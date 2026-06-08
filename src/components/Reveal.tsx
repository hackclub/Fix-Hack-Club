'use client';

import { useEffect } from 'react';

// Adds the scroll-reveal animation to landing sections after hydration,
// matching the behavior of the original vanilla site.
export default function Reveal() {
  useEffect(() => {
    const items = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.hero h1, .hero-desc, .btn-row, .hero-note, .section-label, .ticket, .ticketA, .code-block',
      ),
    );

    items.forEach((item, index) => {
      item.classList.add('reveal');
      item.style.transitionDelay = `${(index % 6) * 0.06}s`;
    });

    if (!('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('reveal-show'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add('reveal-show');
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -50px 0px' },
    );

    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return null;
}
