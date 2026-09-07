import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logoutAction } from "@/app/login/actions";
import { NavLinks, type NavItem } from "@/components/NavLinks";
import { TimerBar } from "@/components/TimerBar";

export const dynamic = "force-dynamic";

const BASE_NAV: NavItem[] = [
  { href: "/", label: "My work", icon: "◎" },
  { href: "/timesheet", label: "Timesheet", icon: "▦" },
  { href: "/projects", label: "Projects", icon: "▤" },
  { href: "/reports", label: "Reports", icon: "◔" },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/templates", label: "Templates", icon: "⧉" },
  { href: "/clients", label: "Clients", icon: "◈" },
  { href: "/people", label: "People", icon: "◍" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const admin = user.role === "ADMIN";

  const timer = await db.runningTimer.findUnique({
    where: { userId: user.id },
    include: {
      task: {
        select: {
          name: true,
          project: { select: { id: true, name: true } },
        },
      },
    },
  });

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-ink-200 bg-white lg:flex">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            1
          </div>
          <span className="text-base font-semibold tracking-tight">OneSpace</span>
        </div>

        <div className="flex flex-1 flex-col gap-4 px-3 pb-4">
          <NavLinks items={BASE_NAV} />
          {admin ? (
            <div>
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                Admin
              </p>
              <NavLinks items={ADMIN_NAV} />
            </div>
          ) : null}
        </div>

        <div className="border-t border-ink-200 p-3">
          <Link
            href="/account"
            className="block truncate text-sm font-medium text-ink-800 hover:text-brand-700"
          >
            {user.name}
          </Link>
          <p className="truncate text-xs text-ink-500">{user.email}</p>
          <form action={logoutAction} className="mt-2">
            <button type="submit" className="btn-ghost btn-sm w-full justify-start px-0">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Compact nav for phones — the same links, scrolled horizontally. */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-ink-200 bg-white px-3 py-2 lg:hidden">
          <span className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-600 text-xs font-bold text-white">
            1
          </span>
          {[...BASE_NAV, ...(admin ? ADMIN_NAV : [])].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-md px-2.5 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-100"
            >
              {item.label}
            </Link>
          ))}
          <form action={logoutAction} className="ml-auto shrink-0">
            <button type="submit" className="btn-ghost btn-sm">
              Sign out
            </button>
          </form>
        </div>

        {timer ? (
          <TimerBar
            timer={{
              startedAt: timer.startedAt.toISOString(),
              taskName: timer.task.name,
              projectName: timer.task.project.name,
              projectId: timer.task.project.id,
              notes: timer.notes,
            }}
          />
        ) : null}

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
