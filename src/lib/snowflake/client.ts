import "server-only";
import type { Connection, ConnectionOptions } from "snowflake-sdk";

/**
 * Snowflake, over the official driver.
 *
 * Not hand-rolled REST like Zoom and Google. Snowflake's own documentation
 * is unreachable from where this was written, and the one thing today has
 * taught repeatedly is that an API shape guessed from memory fails in
 * production and passes every test that stubs it. The driver is the
 * documented contract, so it is what we use.
 *
 * A fifth vendor, against the standing rule of Railway, GitHub and Supabase.
 * Brianna asked for it with the credentials already in place; the argument
 * for going at Outreach's API directly is on the record and was not taken.
 */

export const snowflakeConfigured = () =>
  Boolean(
    process.env.SNOWFLAKE_ACCOUNT &&
      (process.env.SNOWFLAKE_TOKEN ||
        (process.env.SNOWFLAKE_USERNAME && process.env.SNOWFLAKE_PASSWORD)),
  );

/**
 * How the credentials that are set decide the way in.
 *
 * A token is preferred where one exists: it is scoped and rotatable, and a
 * password sitting in an environment variable is neither. PROGRAMMATIC_ACCESS_TOKEN
 * is the modern shape and OAUTH the older one; both send the value as `token`,
 * so the only question is which name the server expects. Set
 * SNOWFLAKE_AUTHENTICATOR to pick explicitly.
 */
function connectionOptions(): ConnectionOptions {
  const account = process.env.SNOWFLAKE_ACCOUNT!;
  const base = {
    account,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE || undefined,
    database: process.env.SNOWFLAKE_DATABASE || undefined,
    schema: process.env.SNOWFLAKE_SCHEMA || undefined,
    role: process.env.SNOWFLAKE_ROLE || undefined,
    // Read-only work. A query that runs away shouldn't hold a request open
    // or quietly burn credits.
    clientSessionKeepAlive: false,
  };

  const token = process.env.SNOWFLAKE_TOKEN;
  if (token) {
    return {
      ...base,
      username: process.env.SNOWFLAKE_USERNAME || undefined,
      authenticator:
        process.env.SNOWFLAKE_AUTHENTICATOR || "PROGRAMMATIC_ACCESS_TOKEN",
      token,
    };
  }

  return {
    ...base,
    username: process.env.SNOWFLAKE_USERNAME!,
    password: process.env.SNOWFLAKE_PASSWORD!,
  };
}

export class SnowflakeError extends Error {}

/**
 * Connect, run, disconnect.
 *
 * One connection per call rather than a pool. This runs a handful of times a
 * night, not a handful of times a second, and a pooled connection that dies
 * between syncs is a harder problem than opening a new one.
 */
export async function snowflakeQuery<T = Record<string, unknown>>(
  sqlText: string,
  binds: (string | number | boolean | null)[] = [],
): Promise<T[]> {
  if (!snowflakeConfigured()) {
    throw new SnowflakeError(
      "Snowflake isn't connected - set SNOWFLAKE_ACCOUNT and either SNOWFLAKE_TOKEN or SNOWFLAKE_USERNAME and SNOWFLAKE_PASSWORD in Railway.",
    );
  }

  // Loaded here rather than at module scope: the driver is a large CommonJS
  // package and importing it into a page's bundle costs everyone who never
  // touches Snowflake.
  const snowflake = (await import("snowflake-sdk")).default;

  let connection: Connection;
  try {
    connection = snowflake.createConnection(connectionOptions());
  } catch (e) {
    throw new SnowflakeError(
      `Snowflake wouldn't take those settings: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  await new Promise<void>((resolve, reject) => {
    connection.connectAsync((err) => {
      if (err) {
        reject(
          new SnowflakeError(
            // The driver's own message names the account, the user and the
            // reason, which is exactly what somebody needs to fix it.
            `Snowflake refused the connection: ${err.message}`,
          ),
        );
      } else resolve();
    });
  }).catch((e) => {
    void disconnect(connection);
    throw e;
  });

  try {
    return await new Promise<T[]>((resolve, reject) => {
      connection.execute({
        sqlText,
        binds,
        // Objects keyed by column name. Arrays would mean every caller
        // carrying its own column order, which is how a query change
        // silently starts reading the wrong field.
        rowMode: "object",
        complete: (err, _stmt, rows) => {
          if (err) reject(new SnowflakeError(`Snowflake rejected the query: ${err.message}`));
          else resolve((rows ?? []) as T[]);
        },
      });
    });
  } finally {
    await disconnect(connection);
  }
}

/** Closing is best-effort: a query that worked shouldn't fail on the way out. */
async function disconnect(connection: Connection): Promise<void> {
  await new Promise<void>((resolve) => {
    try {
      connection.destroy(() => resolve());
    } catch {
      resolve();
    }
  });
}
