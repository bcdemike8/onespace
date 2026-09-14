import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Which copy of the app answered.
 *
 * Generated once when the process starts, so it changes on every deploy and
 * on every restart. That's all it needs to do: a page that was loaded by the
 * previous copy is stale, and a restart is a good enough proxy for a deploy.
 *
 * Nothing about it is secret - it's an opaque value whose only property is
 * being different from the last one.
 */
const BOOT = randomUUID();

export function GET() {
  return NextResponse.json(
    { id: BOOT },
    { headers: { "Cache-Control": "no-store" } },
  );
}
