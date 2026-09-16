/**
 * Who can sign in, and giving a login to whoever can't.
 *
 *   npm run people:login                  who can sign in, and who can't, and why
 *   npm run people:login -- --set         give everyone who can't a password
 *   npm run people:login -- --set --email=ricky@revoptics.co     just one person
 *   npm run people:login -- --set --password='the same for all'  your own, not generated
 *   npm run people:login -- --set --all --password='...'  everybody, including
 *                                         people whose password already works
 *
 * Note the single quotes around a password. In bash a "!" inside double
 * quotes is history expansion, so --password="OneSpace2026!" sets something
 * other than what you typed and you find out when nobody can sign in.
 *
 * Why this exists: the Salesforce import creates a person for every
 * colleague it finds who has no OneSpace account, so their deals and
 * contacts keep the right owner. Those rows are deliberately unusable -
 * inactive, with a passwordHash of "disabled" that no password can ever
 * match. That is right for somebody who has left and wrong for somebody who
 * still works here, and there was no way to tell the two apart except by
 * knowing. Meanwhile the login page told them their password was wrong,
 * which is true and completely unhelpful.
 *
 * Nothing here weakens anything: it sets a real scrypt hash through the same
 * function the app uses, and activates the account, which is exactly what an
 * admin does by hand on the People page in two clicks. It is faster and it
 * says who it did it for.
 */

import "./load-env";
import { requireDatabaseUrl } from "./load-env";
import { requireCurrentClient } from "./check-generated-client";
import { randomInt } from "node:crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const at = hit.indexOf("=");
  return at === -1 ? "" : hit.slice(at + 1);
};

const set = flag("set") !== undefined;
const onlyEmail = flag("email")?.trim().toLowerCase();
const given = flag("password");
/**
 * Everybody, not just the locked-out.
 *
 * Off by default, and deliberately: the people who can already sign in have
 * passwords that work, and one of them is whoever is running this. Resetting
 * them to a shared string is a real choice with real costs - it ends their
 * sessions and hands one credential to the whole team - so it is a flag
 * somebody types rather than something that happens quietly.
 */
const everyone = flag("all") !== undefined;

/**
 * A password somebody has to read off a screen and type into a phone.
 *
 * No 0/O/1/I/L: the characters that cost ten minutes when a password is
 * relayed over Slack. Four groups of four is 20 bits a group, 80 in total -
 * far past what a starting password needs, and still typeable.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generate(): string {
  const groups: string[] = [];
  for (let g = 0; g < 4; g++) {
    let block = "";
    for (let i = 0; i < 4; i++) block += ALPHABET[randomInt(ALPHABET.length)];
    groups.push(block);
  }
  return groups.join("-");
}

/** A hash no password can ever match is a row that cannot sign in. */
const usable = (hash: string) => hash.startsWith("scrypt$");

async function main() {
  requireDatabaseUrl();
  requireCurrentClient();

  const people = await db.user.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      passwordHash: true,
      lastSignedInAt: true,
    },
  });

  const why = (p: (typeof people)[number]): string | null => {
    if (!usable(p.passwordHash) && !p.isActive) return "no password, not active";
    if (!usable(p.passwordHash)) return "no password set";
    if (!p.isActive) return "not active";
    return null;
  };

  const stuck = people.filter((p) => why(p) !== null);
  const fine = people.filter((p) => why(p) === null);

  console.log(`\n${people.length} people.\n`);

  if (fine.length) {
    console.log("Can sign in:");
    for (const p of fine) {
      const seen = p.lastSignedInAt
        ? p.lastSignedInAt.toISOString().slice(0, 10)
        : "never signed in";
      console.log(`  ${p.name.padEnd(26)} ${p.email.padEnd(30)} ${p.role.padEnd(6)} ${seen}`);
    }
    console.log("");
  }

  if (stuck.length === 0 && !(set && everyone)) {
    console.log("Everybody can sign in. Nothing to do.\n");
    if (!set) {
      console.log(
        "To give everybody the same password anyway:\n\n" +
          "  npm run people:login -- --set --all --password='your password'\n\n" +
          "Single quotes: in bash a ! inside double quotes means something else.\n",
      );
    }
    await db.$disconnect();
    return;
  }

  if (stuck.length === 0) {
    console.log("Everybody can already sign in — --all is resetting them anyway.\n");
  }

  console.log("Cannot sign in:");
  for (const p of stuck) {
    console.log(`  ${p.name.padEnd(26)} ${p.email.padEnd(30)} ${p.role.padEnd(6)} ${why(p)}`);
  }
  console.log("");

  if (!set) {
    console.log(
      "Nothing changed. To give them a login:\n\n" +
        "  npm run people:login -- --set\n\n" +
        "That sets a password for each and switches the account on. It prints each\n" +
        "password once — send them on, and have people change theirs from their own\n" +
        "account page.\n",
    );
    await db.$disconnect();
    return;
  }

  const pool = everyone ? people : stuck;
  const targets = onlyEmail
    ? pool.filter((p) => p.email.toLowerCase() === onlyEmail)
    : pool;

  if (targets.length === 0) {
    // Two very different situations, and "nobody matched" describes neither.
    const alreadyFine = onlyEmail
      ? fine.find((p) => p.email.toLowerCase() === onlyEmail)
      : undefined;
    console.log(
      alreadyFine
        ? `${alreadyFine.name} can already sign in, so nothing was changed. To give them a\n` +
          `new password deliberately, use Reset password on the People page.\n`
        : onlyEmail
          ? `Nobody here has the address ${onlyEmail}. Check it against the list above.\n`
          : "Nobody to change.\n",
    );
    await db.$disconnect();
    return;
  }

  if (given !== undefined && given.trim().length < 8) {
    console.log("A password given with --password needs at least 8 characters.\n");
    await db.$disconnect();
    process.exit(1);
  }

  if (everyone) {
    console.log(
      "Resetting everybody, including accounts that already worked. Anyone signed\n" +
        "in right now will be signed out.\n",
    );
  }

  console.log("Setting logins. Send each person their own line:\n");

  for (const p of targets) {
    const password = given && given.trim() ? given.trim() : generate();
    await db.user.update({
      where: { id: p.id },
      data: { passwordHash: await hashPassword(password), isActive: true },
    });
    // Anything they had open belonged to the old, unusable state.
    await db.session.deleteMany({ where: { userId: p.id } });

    console.log(`  ${p.email.padEnd(30)} ${password}`);
  }

  console.log(
    `\n${targets.length} ${targets.length === 1 ? "person" : "people"} can now sign in.\n\n` +
      (given && given.trim()
        ? "One password for the whole team is a fine way to get everybody in today and\n" +
          "a poor one to leave in place: it cannot be taken away from one person, and\n" +
          "it ends up in a Slack thread forever. Have each person change theirs from\n" +
          "their own account page once they are in.\n"
        : "These are starting passwords, not secrets to keep: anyone who sees this\n" +
          "terminal or the message you paste them into has them. Have each person\n" +
          "change theirs once they are in.\n"),
  );

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
