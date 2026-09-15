import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { DiscoverSnowflake } from "./DiscoverSnowflake";

export const dynamic = "force-dynamic";

/**
 * Before the connector, the question it depends on.
 *
 * Outreach's Snowflake share isn't one fixed shape - the database, schema
 * and table names depend on how it was mounted and which feeds are on. And
 * the thing that matters most, the transcript text, is the field most often
 * left out of a warehouse share: call metadata replicates readily, the words
 * people said frequently don't.
 *
 * So this asks, and prints the answer, before anybody writes a sync against
 * a table name they assumed.
 */
export default async function SnowflakePage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Snowflake"
        subtitle="What's in there, before anything is built on top of it."
      />

      <div className="card p-4">
        <p className="mb-4 text-sm leading-relaxed text-ink-700">
          This looks for tables whose names suggest calls, meetings or
          recordings, then for columns in them that look like transcript or
          summary text. It reads nothing else and changes nothing.
        </p>
        <DiscoverSnowflake />
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink-500">
        The answer decides whether a Snowflake connector is worth building. If
        the transcript text is there, the sync gets written against these exact
        names. If only call metadata came across, Outreach&apos;s own API
        returns transcripts directly and would be the shorter road.
      </p>
    </div>
  );
}
