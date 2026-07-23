import * as React from "react";

/** Stylized gold crown mark, echoing the Fashion Legacy logo crown. */
export function CrownMark({ className }: { className?: string }) {
  const id = React.useId();
  return (
    <svg viewBox="0 0 32 26" aria-hidden className={className}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="oklch(0.9 0.08 88)" />
          <stop offset="0.55" stopColor="oklch(0.78 0.11 78)" />
          <stop offset="1" stopColor="oklch(0.6 0.11 62)" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`}>
        <circle cx="6" cy="7.6" r="2" />
        <circle cx="16" cy="3.4" r="2.2" />
        <circle cx="26" cy="7.6" r="2" />
        <path d="M4.2 20.2 6 10.6l5.6 4.4L16 6.6l4.4 8.4 5.6-4.4 1.8 9.6Z" />
        <rect x="4.6" y="21.6" width="22.8" height="3" rx="1.3" />
      </g>
    </svg>
  );
}
