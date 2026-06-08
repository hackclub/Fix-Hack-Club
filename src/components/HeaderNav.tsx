'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/projects', label: 'Projects' },
  { href: '/find', label: 'Find work' },
  { href: '/ships', label: 'Ships' },
  { href: '/shop', label: 'Shop' },
];

// Primary navigation links with active-route highlighting. Rendered inside the
// server-side SiteHeader so the right-hand session UI stays server-rendered.
export default function HeaderNav({ admin = false, reviewer = false }: { admin?: boolean; reviewer?: boolean }) {
  const pathname = usePathname();
  const items = [...LINKS];
  // Admins reach first-grade review inside the Admin console. Reviewers (no
  // admin access) get a direct link into the console's review page.
  if (admin) {
    items.push({ href: '/admin', label: 'Admin' });
  } else if (reviewer) {
    items.push({ href: '/admin/review', label: 'Review' });
  }

  return (
    <nav className="site-nav" aria-label="Primary">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`dash-topbar__link${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
