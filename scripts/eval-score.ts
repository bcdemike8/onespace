/**
 * How one case of the accuracy script is scored.
 *
 * Kept apart from scripts/eval-commitments.ts, which talks to Claude, so the
 * scoring itself can be tested without a key: a commitment on the wrong
 * person, a deadline on the wrong day (or swapped with another item's), an
 * item that shouldn't exist, one that's missing.
 */
import { promisedDate } from "@/lib/commitments/pipeline";

export interface Expected {
  owner: string;
  /** Any of these words in the title or task shows it's the right item. */
  about: string[];
  /** The promised deadline as YYYY-MM-DD, or absent when none was promised. */
  due?: string;
}

export interface Found {
  ownerId: string;
  title: string;
  task: string;
  when: string | null;
}

export interface Score {
  correct: number;
  falsePositives: number;
  falseNegatives: number;
  wrongOwner: number;
  wrongDeadline: number;
  notes: string[];
  missed: Expected[];
}

export function scoreCase(expect: Expected[], owned: Found[], said: Date): Score {
  const left = [...expect];
  const score: Score = {
    correct: 0,
    falsePositives: 0,
    falseNegatives: 0,
    wrongOwner: 0,
    wrongDeadline: 0,
    notes: [],
    missed: [],
  };

  for (const o of owned) {
    const hay = `${o.title} ${o.task}`.toLowerCase();
    const about = (e: Expected) => e.about.some((w) => hay.includes(w.toLowerCase()));
    const i = left.findIndex((e) => e.owner === o.ownerId && about(e));
    if (i === -1) {
      // The right task on the wrong person is its own kind of mistake.
      const j = left.findIndex(about);
      if (j !== -1) {
        score.wrongOwner += 1;
        score.notes.push(`wrong owner: ${o.ownerId} has "${o.title}" (should be ${left[j].owner})`);
        left.splice(j, 1);
      } else {
        score.falsePositives += 1;
        score.notes.push(`shouldn't be there: ${o.ownerId} - ${o.title}`);
      }
      continue;
    }
    const e = left.splice(i, 1)[0];
    // The actual date, compared with the one that was promised - not just
    // whether there is one.
    const got = promisedDate(o.when, said)?.toISOString().slice(0, 10) ?? null;
    const want = e.due ?? null;
    if (got !== want) {
      score.wrongDeadline += 1;
      score.notes.push(
        `wrong deadline: ${o.title} - got ${got ?? "none"} ("${o.when ?? ""}"), expected ${want ?? "none"}`,
      );
    } else {
      score.correct += 1;
    }
  }

  score.falseNegatives = left.length;
  score.missed = left;
  return score;
}
