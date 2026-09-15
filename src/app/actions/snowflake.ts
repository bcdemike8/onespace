"use server";

import { requireAdmin } from "@/lib/auth";

export type SnowflakeState = { error?: string; ok?: boolean; report?: string };

/**
 * Ask Snowflake what it holds, and print it.
 *
 * Admin-only because it reads the warehouse's whole table catalogue, which
 * is a fair bit more than anyone's own work.
 */
export async function discoverSnowflakeAction(): Promise<SnowflakeState> {
  await requireAdmin();

  const { snowflakeConfigured } = await import("@/lib/snowflake/client");
  if (!snowflakeConfigured()) {
    return {
      error:
        "Snowflake isn't connected on this service. Set SNOWFLAKE_ACCOUNT and either SNOWFLAKE_TOKEN or SNOWFLAKE_USERNAME and SNOWFLAKE_PASSWORD in Railway, on the app service, and redeploy.",
    };
  }

  try {
    const { discoverSnowflake } = await import("@/lib/snowflake/discover");
    const found = await discoverSnowflake();

    const lines: string[] = [];
    lines.push(`Databases visible: ${found.databases.join(", ") || "none"}`);
    lines.push("");

    if (found.candidates.length > 0) {
      lines.push("Tables that look like calls, meetings or recordings:");
      for (const t of found.candidates.slice(0, 30)) {
        lines.push(
          `  ${t.database}.${t.schema}.${t.table}${t.rows !== null ? `  (${t.rows.toLocaleString()} rows)` : ""}`,
        );
      }
      lines.push("");
    }

    if (found.textColumns.length > 0) {
      lines.push("Columns in those that look like transcript or summary text:");
      for (const c of found.textColumns) {
        lines.push(`  ${c.database}.${c.schema}.${c.table}.${c.column}  ${c.type}`);
      }
      lines.push("");
    }

    lines.push(found.note);
    return { ok: true, report: lines.join("\n") };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't reach Snowflake." };
  }
}
