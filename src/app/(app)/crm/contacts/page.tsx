import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { crmHref, searchWhere } from "@/lib/crm/view";
import { EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const LIMIT = 100;

/**
 * 7,485 people, so this opens on a search box rather than a list.
 *
 * Over half of them belong to no company - bought lists and old campaigns
 * that Salesforce recorded with a null account id, which made the column
 * look fully populated. They are here and findable, and the "No company"
 * tab is the honest name for what they are.
 */
export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; show?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const loose = params.show === "loose";
  const current = { q: params.q, show: params.show };

  const where = {
    ...(loose ? { clientId: null } : {}),
    ...searchWhere(q, ["firstName", "lastName", "email", "title"]),
  };

  const searching = q.length >= 2 || loose;

  const [rows, total] = searching
    ? await Promise.all([
        db.contact.findMany({
          where,
          orderBy: [{ noLongerHere: "asc" }, { lastName: "asc" }],
          take: LIMIT,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            title: true,
            noLongerHere: true,
            client: { select: { id: true, name: true } },
          },
        }),
        db.contact.count({ where }),
      ])
    : [[], await db.contact.count()];

  return (
    <>
      <PageHeader
        title="Contacts"
        subtitle={
          searching
            ? `${total.toLocaleString()} ${total === 1 ? "person" : "people"}`
            : `${total.toLocaleString()} people. Search to find someone.`
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <Link
          href={crmHref("/crm/contacts", current, { show: null })}
          className={loose ? "btn-ghost btn-sm" : "btn-secondary btn-sm"}
        >
          Everyone
        </Link>
        <Link
          href={crmHref("/crm/contacts", current, { show: "loose" })}
          className={loose ? "btn-secondary btn-sm" : "btn-ghost btn-sm"}
        >
          No company
        </Link>
        <span className="ml-auto flex gap-2">
          <Link href="/crm" className="btn-ghost btn-sm">
            Accounts
          </Link>
          <Link href="/crm/deals" className="btn-ghost btn-sm">
            Deals
          </Link>
        </span>
      </div>

      <form className="mb-4 flex gap-2" action="/crm/contacts">
        {loose ? <input type="hidden" name="show" value="loose" /> : null}
        <input
          name="q"
          defaultValue={q}
          placeholder="Name, email or job title"
          className="input max-w-md"
          autoFocus
        />
        <button type="submit" className="btn-secondary btn-sm">
          Search
        </button>
      </form>

      {!searching ? (
        <EmptyState
          title="Start typing"
          body="There are too many people here to list. Search by name, email or job title — two characters is enough."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Nobody matches that"
          body="Try a shorter term, or a surname on its own."
        />
      ) : (
        <>
          {total > rows.length ? (
            <p className="mb-2 text-xs text-ink-500">
              Showing {rows.length} of {total.toLocaleString()}.
            </p>
          ) : null}
          <ul className="card divide-y divide-ink-100">
            {rows.map((p) => (
              <li key={p.id} className="flex flex-wrap items-baseline gap-2 px-4 py-2.5">
                <span
                  className={`text-sm ${
                    p.noLongerHere ? "text-ink-400 line-through" : "text-ink-900"
                  }`}
                >
                  {[p.firstName, p.lastName].filter(Boolean).join(" ")}
                </span>
                {p.title ? <span className="text-xs text-ink-500">{p.title}</span> : null}
                {p.noLongerHere ? (
                  <span className="chip bg-ink-100 text-ink-500">Left</span>
                ) : null}
                {p.client ? (
                  <Link
                    href={`/crm/${p.client.id}`}
                    className="text-xs text-ink-600 underline"
                  >
                    {p.client.name}
                  </Link>
                ) : null}
                {p.email ? (
                  <a
                    href={`mailto:${p.email}`}
                    className="ml-auto shrink-0 text-xs text-brand-600 underline"
                  >
                    {p.email}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
