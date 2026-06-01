import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'FixHC - Fix Hack Club',
  description:
    "FixHC helps Hack Club members find small, high-impact projects to improve infra, pages, and polish across Hack Club sites.",
  icons: { icon: '/logo.png' },
  openGraph: {
    title: 'FixHC - Fix Hack Club',
    description: 'Find small Hack Club fixes, ship PRs, and help improve the ecosystem.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
