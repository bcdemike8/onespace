"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

/** Does this path sit under this link? */
const covers = (href: string, pathname: string): boolean =>
  href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  // The longest matching link wins, and only it.
  //
  // /crm/dashboard sits under both "Closed business" (/crm/dashboard) and
  // "Accounts" (/crm), so a plain prefix test lights up two items at once -
  // and sets aria-current="page" on both, which tells a screen reader you
  // are in two places.
  const best = items
    .filter((item) => covers(item.href, pathname))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <nav className="flex flex-1 flex-col gap-0.5">
      {items.map((item) => {
        const active = item.href === best?.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-200 text-brand-900"
                : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
            }`}
          >
            <span aria-hidden className="w-4 text-center text-base leading-none">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
