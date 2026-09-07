/**
 * First-run seed.
 *
 *   npm run seed          → creates the admin account from SEED_ADMIN_* env vars
 *   npm run seed -- --demo → also adds an example client, template and project
 *
 * Safe to re-run: it never overwrites anything that already exists.
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const db = new PrismaClient();

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

async function main() {
  const demo = process.argv.includes("--demo");

  const email = (process.env.SEED_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";
  const name = process.env.SEED_ADMIN_NAME ?? "Administrator";

  if (!email || password.length < 8) {
    console.error(
      "Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (8+ chars) before seeding.\n" +
        "Or skip the seed entirely — the first visit to /login offers a setup form.",
    );
    process.exitCode = 1;
    return;
  }

  const admin = await db.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      role: "ADMIN",
      passwordHash: await hashPassword(password),
      costRateCents: 0,
      billRateCents: 0,
    },
  });
  console.log(`✓ Admin ready: ${admin.email}`);

  if (!demo) return;

  const client = await db.client.upsert({
    where: { name: "Northwind Co." },
    update: {},
    create: { name: "Northwind Co.", notes: "Example client — delete when you're set up." },
  });

  const existing = await db.projectTemplate.findUnique({
    where: { name: "Monthly retainer" },
  });
  if (existing) {
    console.log("✓ Demo data already present.");
    return;
  }

  const template = await db.projectTemplate.create({
    data: {
      name: "Monthly retainer",
      description:
        "The standard month: kickoff, the work itself, then reporting and invoicing.",
    },
  });

  const sections = await Promise.all(
    ["Kickoff", "Delivery", "Wrap up"].map((sectionName, orderIndex) =>
      db.templateSection.create({
        data: { templateId: template.id, name: sectionName, orderIndex },
      }),
    ),
  );

  const steps: [number, string, number | null, number | null][] = [
    // [sectionIndex, name, offsetDays, estimatedHours]
    [0, "Kickoff call with the client", 0, 1],
    [0, "Confirm scope and priorities for the month", 1, 1],
    [1, "Weekly working session — week 1", 7, 2],
    [1, "Weekly working session — week 2", 14, 2],
    [1, "Weekly working session — week 3", 21, 2],
    [2, "Pull the numbers and write the monthly report", 27, 3],
    [2, "Send the report and invoice", 28, 0.5],
  ];

  await db.templateTask.createMany({
    data: steps.map(([sectionIndex, taskName, offsetDays, estimatedHours], i) => ({
      templateId: template.id,
      sectionId: sections[sectionIndex].id,
      name: taskName,
      offsetDays,
      estimatedHours,
      defaultAssigneeId: admin.id,
      orderIndex: i,
    })),
  });

  console.log(`✓ Demo template "${template.name}" with ${steps.length} steps`);
  console.log(`✓ Demo client "${client.name}"`);
  console.log("  Create a project from the template at /projects/new.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
