'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SideNav({
  items,
  ariaLabel,
  roots = [],
}: {
  items: { href: string; label: string }[];
  ariaLabel?: string;
  roots?: string[];
}) {
  const pathname = usePathname();

  return (
    <nav className="dash-nav" aria-label={ariaLabel}>
      {items.map((item) => {
        const isRoot = roots.includes(item.href);
        const active = isRoot
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`dash-nav__link${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
