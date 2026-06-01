'use client';

import { useState, type MouseEvent } from 'react';

export default function Nav() {
  const [open, setOpen] = useState(false);

  const handleAnchor = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.querySelector(id);
    if (!target) {
      return;
    }
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setOpen(false);
  };

  return (
    <nav>
      <a className="nav-brand" href="#top" onClick={(e) => handleAnchor(e, '#top')}>
        ⚙ FixHC
      </a>
      <button
        className="menu-toggle"
        type="button"
        aria-label="Toggle menu"
        aria-expanded={open}
        aria-controls="main-nav-links"
        onClick={() => setOpen((value) => !value)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <ul className={`nav-links${open ? ' open' : ''}`} id="main-nav-links">
        <li>
          <a href="#how" onClick={(e) => handleAnchor(e, '#how')}>
            How It Works
          </a>
        </li>
        <li>
          <a href="#jobs" onClick={(e) => handleAnchor(e, '#jobs')}>
            Examples
          </a>
        </li>
        <li>
          <a href="#contribute" onClick={(e) => handleAnchor(e, '#contribute')}>
            Contribute
          </a>
        </li>
        <li>
          <a href="/explore">Explore</a>
        </li>
        <li>
          <a href="/shop">Shop</a>
        </li>
        <li>
          <a href="/dashboard" className="nav-cta">
            Open Dashboard
          </a>
        </li>
        <li>
          <a href="https://hackclub.com/slack" target="_blank" rel="noopener noreferrer">
            Join Slack
          </a>
        </li>
      </ul>
    </nav>
  );
}
