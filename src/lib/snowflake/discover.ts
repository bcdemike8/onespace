import "server-only";
import { snowflakeQuery } from "@/lib/snowflake/client";

/**
 * What's actually in there.
 *
 * Outreach's Snowflake share is not one fixed shape - the database name, the
 * schema and the table names depend on how the share was mounted and which
 * feeds were enabled. Writing a sync against guessed table names would be
 * the same mistake as guessing an API: it passes every test that stubs it,
 * and finds nothing in production.
 *
 * So the first thing OneSpace does with Snowflake is ask it what it has,
 * and print the answer. The sync gets written against that.
 */

export interface FoundColumn {
  database: string;
  schema: string;
  table: string;
  column: string;
  type: string;
  rows: number | null;
}

export interface Discovery {
  databases: string[];
  /** Tables whose name suggests calls, meetings or recordings. */
  candidates: { database: string; schema: string; table: string; rows: number | null }[];
  /** Columns in those tables that look like transcript or summary text. */
  textColumns: FoundColumn[];
  note: string;
}

/** Names worth looking at, in the order they'd be worth having. */
const TABLE_HINTS = ["KAIA", "TRANSCRIPT", "RECORDING", "CALL", "MEETING", "CONVERSATION"];
const TEXT_HINTS = ["TRANSCRIPT", "SUMMARY", "BODY", "TEXT", "CONTENT", "NOTE"];

export async function discoverSnowflake(): Promise<Discovery> {
  // Every database this login can see. SHOW is cheap and needs no warehouse.
  const dbRows = await snowflakeQuery<{ name: string }>("SHOW DATABASES");
  const databases = dbRows.map((r) => r.name).filter(Boolean);

  if (databases.length === 0) {
    return {
      databases: [],
      candidates: [],
      textColumns: [],
      note: "This login can't see any databases. Check the role - Snowflake shares are usually granted to a specific role, and the driver uses SNOWFLAKE_ROLE if you set it.",
    };
  }

  // INFORMATION_SCHEMA is per-database, so this reads the account-wide view.
  // It needs a warehouse; the error says so plainly if one isn't set.
  const like = TABLE_HINTS.map((h) => `TABLE_NAME ILIKE '%${h}%'`).join(" OR ");
  const candidates = await snowflakeQuery<{
    TABLE_CATALOG: string;
    TABLE_SCHEMA: string;
    TABLE_NAME: string;
    ROW_COUNT: number | null;
  }>(
    `select TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, ROW_COUNT
       from SNOWFLAKE.ACCOUNT_USAGE.TABLES
      where DELETED is null and (${like})
      order by ROW_COUNT desc nulls last
      limit 60`,
  ).catch(async () =>
    // ACCOUNT_USAGE needs a privilege a share-only login often lacks. The
    // per-database INFORMATION_SCHEMA always works, so fall back to it.
    (
      await Promise.all(
        databases.slice(0, 10).map((db) =>
          snowflakeQuery<{
            TABLE_CATALOG: string;
            TABLE_SCHEMA: string;
            TABLE_NAME: string;
            ROW_COUNT: number | null;
          }>(
            `select TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, ROW_COUNT
               from "${db}".INFORMATION_SCHEMA.TABLES
              where ${like}
              limit 40`,
          ).catch(() => []),
        ),
      )
    ).flat(),
  );

  const textColumns: FoundColumn[] = [];
  for (const t of candidates.slice(0, 12)) {
    const cols = await snowflakeQuery<{
      COLUMN_NAME: string;
      DATA_TYPE: string;
    }>(
      `select COLUMN_NAME, DATA_TYPE
         from "${t.TABLE_CATALOG}".INFORMATION_SCHEMA.COLUMNS
        where TABLE_SCHEMA = ? and TABLE_NAME = ?
          and (${TEXT_HINTS.map((h) => `COLUMN_NAME ILIKE '%${h}%'`).join(" OR ")})`,
      [t.TABLE_SCHEMA, t.TABLE_NAME],
    ).catch(() => []);

    for (const c of cols) {
      textColumns.push({
        database: t.TABLE_CATALOG,
        schema: t.TABLE_SCHEMA,
        table: t.TABLE_NAME,
        column: c.COLUMN_NAME,
        type: c.DATA_TYPE,
        rows: t.ROW_COUNT ?? null,
      });
    }
  }

  return {
    databases,
    candidates: candidates.map((t) => ({
      database: t.TABLE_CATALOG,
      schema: t.TABLE_SCHEMA,
      table: t.TABLE_NAME,
      rows: t.ROW_COUNT ?? null,
    })),
    textColumns,
    note:
      textColumns.length > 0
        ? "Transcript-shaped columns found. Send me this and I'll write the sync against it."
        : candidates.length > 0
          ? "Call-shaped tables, but nothing that looks like transcript text in them. That is the thing worth knowing before building anything: a warehouse share often carries call metadata and leaves the transcript behind."
          : "Nothing call-shaped in any database this login can see. Either the Outreach share isn't mounted, or the role can't see it.",
  };
}
