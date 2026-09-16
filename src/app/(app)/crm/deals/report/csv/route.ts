import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { loadDeals } from "@/lib/crm/deal-data";
import {
  asBand,
  asDirection,
  filterDeals,
  isSortKey,
  sortDeals,
  toCsv,
  type SortKey,
} from "@/lib/crm/deal-report";

export const dynamic = "force-dynamic";

/**
 * The report, as a spreadsheet.
 *
 * Because "filters like Excel" eventually means Excel, and a CSV is the one
 * export nothing can misread. It takes exactly the same parameters as the
 * report page and runs them through the same filter and sort, so the file
 * and the screen are the same rows in the same order - which is the only
 * way somebody can check one against the other.
 */
export async function GET(request: Request) {
  // Not requireUser: that redirects, and a redirect to a login page
  // downloaded as a .csv is a confusing file to open.
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Sign in to download this.", { status: 401 });
  }

  const url = new URL(request.url);
  const get = (k: string) => url.searchParams.get(k) ?? undefined;

  const within = get("within") ? Number(get("within")) : undefined;
  const sort: SortKey = isSortKey(get("sort")) ? (get("sort") as SortKey) : "close";

  const { deals } = await loadDeals(
    { q: get("q"), owner: get("owner"), type: get("type"), year: get("year") },
    5000,
  );

  const rows = sortDeals(
    filterDeals(
      filterDeals(deals, {
        band: asBand(get("band")),
        withinDays: Number.isFinite(within) ? within : undefined,
      }),
      {
        account: get("account"),
        type: get("ptype"),
        owner: get("powner"),
        stage: get("stage"),
      },
    ),
    sort,
    asDirection(get("dir")),
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const name = `onespace-deals-${get("band") ?? "all"}-${stamp}.csv`;

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      // A report is only as good as its freshness; a cached CSV from
      // yesterday looks exactly like today's.
      "Cache-Control": "no-store",
    },
  });
}
