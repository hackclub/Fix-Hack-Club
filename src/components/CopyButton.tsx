'use client';

import { useState } from 'react';

export default function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard not available; ignore.
        }
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
