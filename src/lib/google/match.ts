// Working out which project a meeting belongs to.
//
// Pure functions, no database and no Google: everything the matcher needs is
// passed in, so the rules can be tested against real meeting titles without a
// network or a schema.
//
// Three signals, in order of how much they are worth trusting:
//
//   1. The attendees' email domains. If someone from acme.com is in the room,
//      the meeting is Acme's. This is near enough certain and is weighted
//      accordingly.
//   2. The meeting title against the project and client name. Useful, but only
//      once you account for the fact that half of these projects are called
//      "... Outreach Implementation: Engage ...". A word that appears in forty
//      project names tells you nothing; a word that appears in one tells you
//      everything. Hence the IDF weighting below.
//   3. The title against the task names in the chosen project, so "kickoff"
//      lands on "Run Kickoff" rather than the project's first task.
//
// Nothing here decides anything on its own. It produces a suggestion and the
// one-line reason for it, and a person confirms.

export interface MatchCandidate {
  projectId: string;
  projectName: string;
  clientId: string | null;
  clientName: string | null;
  /** Email domains registered against this project's client, lowercased. */
  domains: string[];
  /** Open tasks, for the second-pass task guess. */
  tasks: { id: string; name: string }[];
  /** Nudges a tie toward the project this person actually runs. */
  ownerId: string | null;
}

export interface MatchInput {
  title: string;
  /** Attendee domains that aren't your own, lowercased. */
  externalDomains: string[];
  organizerEmail: string | null;
  /** The person whose calendar this is. */
  userId: string;
}

export interface MatchResult {
  clientId: string | null;
  projectId: string | null;
  taskId: string | null;
  /** 0-100. Below CONFIDENT the screen asks rather than proposes. */
  confidence: number;
  reason: string;
}

/** At or above this, the suggestion is shown as an answer rather than a guess. */
export const CONFIDENT = 60;

// Words that carry no signal in a meeting title or a project name. "Outreach"
// and "Salesloft" are deliberately absent: they are partners, and while they
// appear in many names they do still narrow things down.
const STOPWORDS = new Set([
  "a", "an", "and", "the", "of", "for", "with", "to", "in", "on", "at", "by",
  "call", "calls", "meeting", "meet", "sync", "syncs", "session", "chat",
  "weekly", "biweekly", "monthly", "daily", "recurring", "check", "checkin",
  "touchbase", "touch", "base", "catch", "up", "1", "2", "3", "one", "1on1",
  "hold", "placeholder", "invite", "zoom", "google", "teams", "hangout",
  "am", "pm", "min", "mins", "minute", "minutes", "hour", "hr",
]);

/** Lowercase alphanumeric words, punctuation squashed, stopwords dropped. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

/**
 * How rare each word is across the whole project list.
 *
 * "implementation" appears in most of these names and so is worth almost
 * nothing; "honeycomb" appears in one and is worth a great deal. Without this
 * a title like "Engage Implementation Call" scores against every project at
 * once and the top match is arbitrary.
 */
export function buildWeights(candidates: MatchCandidate[]): Map<string, number> {
  const docs = candidates.length || 1;
  const freq = new Map<string, number>();

  for (const c of candidates) {
    const words = new Set([
      ...tokenize(c.projectName),
      ...tokenize(c.clientName ?? ""),
    ]);
    for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  }

  const weights = new Map<string, number>();
  for (const [word, n] of freq) {
    // Standard smoothed IDF, floored at zero so a word in every single
    // project contributes nothing rather than going negative.
    weights.set(word, Math.max(0, Math.log(docs / n)));
  }
  return weights;
}

/** Weighted overlap of two strings, 0-1, relative to the query's own weight. */
function similarity(
  query: string[],
  target: string,
  weights: Map<string, number>,
): number {
  if (query.length === 0) return 0;
  const targetWords = new Set(tokenize(target));

  let shared = 0;
  let total = 0;
  for (const word of new Set(query)) {
    // An unseen word (never in any project name) still counts a little, or a
    // title full of novel words could never match anything.
    const weight = weights.get(word) ?? 1;
    total += weight;
    if (targetWords.has(word)) shared += weight;
  }
  return total === 0 ? 0 : shared / total;
}

const domainRoot = (domain: string) => domain.split(".")[0] ?? domain;

/**
 * The best guess for one meeting, or a null match with the reason why.
 *
 * `weights` comes from buildWeights over the same candidate list. It is passed
 * in rather than computed here because a sync scores hundreds of meetings
 * against one unchanging project list.
 */
export function matchMeeting(
  input: MatchInput,
  candidates: MatchCandidate[],
  weights: Map<string, number>,
): MatchResult {
  const none = (reason: string): MatchResult => ({
    clientId: null,
    projectId: null,
    taskId: null,
    confidence: 0,
    reason,
  });

  if (candidates.length === 0) return none("No open projects to match against.");

  const titleWords = tokenize(input.title);

  // ------------------------------------------------------- 1. by domain
  const byDomain = new Map<string, MatchCandidate[]>();
  for (const c of candidates) {
    for (const d of c.domains) {
      if (input.externalDomains.includes(d)) {
        const list = byDomain.get(d) ?? [];
        list.push(c);
        byDomain.set(d, list);
      }
    }
  }

  const domainClients = new Set(
    [...byDomain.values()].flat().map((c) => c.clientId),
  );

  if (domainClients.size === 1) {
    const matched = [...byDomain.values()].flat();
    const domain = [...byDomain.keys()][0];
    const client = matched[0];

    // Deduplicate: one client can have several projects, and a project can
    // match on more than one of its client's domains.
    const projects = [...new Map(matched.map((c) => [c.projectId, c])).values()];

    if (projects.length === 1) {
      const only = projects[0];
      return {
        clientId: only.clientId,
        projectId: only.projectId,
        taskId: bestTask(titleWords, only, weights),
        confidence: 92,
        reason: `${domain} in the invite, and ${client.clientName ?? "that client"} has one open project.`,
      };
    }

    // Several projects for the right client - the title has to break the tie.
    const ranked = projects
      .map((c) => ({ c, score: similarity(titleWords, c.projectName, weights) }))
      .sort((a, b) => b.score - a.score);

    const [top, next] = ranked;
    const clear = top.score > 0.25 && top.score - (next?.score ?? 0) > 0.12;

    if (clear) {
      return {
        clientId: top.c.clientId,
        projectId: top.c.projectId,
        taskId: bestTask(titleWords, top.c, weights),
        confidence: 78,
        reason: `${domain} in the invite, and the title matches this project over ${projects.length - 1} other${projects.length === 2 ? "" : "s"}.`,
      };
    }

    // The client is certain but the project isn't. Say so honestly and let
    // the person pick: proposing one of four at random is worse than asking.
    //
    // Owning the project only breaks the tie when it actually narrows things.
    // Brianna owns most of these, so "this is the one you own" would be a
    // reason that isn't one.
    const mine = projects.filter((c) => c.ownerId === input.userId);
    const owned = mine.length === 1 ? mine[0] : undefined;
    const fallback = owned ?? top.c;
    return {
      clientId: fallback.clientId,
      projectId: fallback.projectId,
      taskId: null,
      confidence: owned ? 55 : 35,
      reason: owned
        ? `${domain} in the invite. They have ${projects.length} open projects; this is the one you own.`
        : `${domain} in the invite, but ${client.clientName ?? "they"} have ${projects.length} open projects - pick the right one.`,
    };
  }

  if (domainClients.size > 1) {
    const names = [...new Map([...byDomain.values()].flat().map((c) => [c.clientId, c.clientName])).values()];
    return none(
      `Attendees from more than one client (${names.filter(Boolean).join(", ")}) - pick which this belongs to.`,
    );
  }

  // ------------------------------------------- 2. the title names a client
  // Checked before generic word overlap, and separately from it, because
  // naming the customer is a different kind of evidence from sharing a word
  // with their project. IDF over a corpus this small can make an ordinary
  // word look rare - "hours" scores high purely because one project is called
  // "Quick Start - 10 Hours" - and that noise should never outweigh the title
  // saying "Suvoda".
  const named = candidates.filter((c) => {
    if (!c.clientName) return false;
    const nameWords = tokenize(c.clientName);
    if (nameWords.length === 0) return false;
    // Every word of the client's name has to be in the title. One-word names
    // must also be reasonably long, or a client called "One" matches half the
    // calendar.
    if (nameWords.length === 1 && nameWords[0].length < 4) return false;
    return nameWords.every((w) => titleWords.includes(w));
  });

  const namedClients = new Set(named.map((c) => c.clientId));
  if (namedClients.size === 1) {
    const projects = [...new Map(named.map((c) => [c.projectId, c])).values()];
    const label = named[0].clientName;

    if (projects.length === 1) {
      return {
        clientId: projects[0].clientId,
        projectId: projects[0].projectId,
        taskId: bestTask(titleWords, projects[0], weights),
        confidence: 70,
        reason: `The title names ${label}, though nobody from a known client domain was invited.`,
      };
    }

    const ranked = projects
      .map((c) => ({ c, score: similarity(titleWords, c.projectName, weights) }))
      .sort((a, b) => b.score - a.score);
    const [top, next] = ranked;
    const clear = top.score - (next?.score ?? 0) > 0.12;

    return {
      clientId: top.c.clientId,
      projectId: top.c.projectId,
      taskId: clear ? bestTask(titleWords, top.c, weights) : null,
      confidence: clear ? 62 : 40,
      reason: clear
        ? `The title names ${label} and matches this project over ${projects.length - 1} other${projects.length === 2 ? "" : "s"}.`
        : `The title names ${label}, who have ${projects.length} open projects - pick the right one.`,
    };
  }

  // -------------------------------------------------- 3. by word overlap
  // Nothing named outright. A strong, clearly-ahead overlap can still be
  // right: "Governance audit for Finalsite" where the client row is spelled
  // differently.
  if (titleWords.length > 0) {
    const ranked = candidates
      .map((c) => ({
        c,
        score: Math.max(
          similarity(titleWords, c.projectName, weights),
          c.clientName ? similarity(titleWords, c.clientName, weights) * 0.95 : 0,
        ),
      }))
      .sort((a, b) => b.score - a.score);

    const [top, next] = ranked;
    if (top.score > 0.4 && top.score - (next?.score ?? 0) > 0.15) {
      return {
        clientId: top.c.clientId,
        projectId: top.c.projectId,
        taskId: bestTask(titleWords, top.c, weights),
        confidence: Math.min(58, Math.round(top.score * 70)),
        reason: `The title looks like ${top.c.clientName ?? top.c.projectName}, but nobody from a known client domain was invited - worth a check.`,
      };
    }
  }

  // ------------------------------------------------------ 4. give up well
  if (input.externalDomains.length === 0) {
    return none("Internal - nobody outside RevOptics was invited.");
  }
  return none(
    `Nobody recognised in the invite (${input.externalDomains.slice(0, 3).map(domainRoot).join(", ")}). Add the domain to a client to match these automatically.`,
  );
}

/** The task in this project whose name the title best matches, if any. */
function bestTask(
  titleWords: string[],
  candidate: MatchCandidate,
  weights: Map<string, number>,
): string | null {
  if (titleWords.length === 0 || candidate.tasks.length === 0) return null;

  // How many of this project's tasks use each word. A word in one task points
  // at that task; a word in three ("training", in a project with user,
  // manager and advanced-topics training) points nowhere.
  const taskFreq = new Map<string, number>();
  for (const t of candidate.tasks) {
    for (const w of new Set(tokenize(t.name))) {
      taskFreq.set(w, (taskFreq.get(w) ?? 0) + 1);
    }
  }

  // Scored on how much of the *task* name the title covers, not the other way
  // round: task names here are verb-first ("Run Kickoff", "Prepare for
  // Kickoff", "Conduct workflow interviews") and no meeting title repeats the
  // whole thing.
  const ranked = candidate.tasks
    .map((t) => {
      const taskWords = tokenize(t.name);
      if (taskWords.length === 0) return { t, score: 0, unique: false };
      const shared = taskWords.filter((w) => titleWords.includes(w));
      const weight = (w: string) => weights.get(w) ?? 1;
      const total = taskWords.reduce((sum, w) => sum + weight(w), 0);
      const hit = shared.reduce((sum, w) => sum + weight(w), 0);
      return {
        t,
        score: total === 0 ? 0 : hit / total,
        // At least one shared word has to belong to this task alone. That is
        // the difference between "Honeycomb kickoff", which means Run Kickoff
        // because nothing else here mentions a kickoff, and a bare "Training"
        // in a project with three of them, which means nothing in particular.
        unique: shared.some((w) => (taskFreq.get(w) ?? 0) === 1),
      };
    })
    .sort((a, b) => b.score - a.score);

  const [top, next] = ranked;
  return top.unique && top.score >= 0.4 && top.score - (next?.score ?? 0) > 0.1
    ? top.t.id
    : null;
}
