"use client";

import * as React from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Live countdown (adds a days unit past 24h). Renders placeholders until mounted to stay hydration-safe. */
export function SaleCountdown({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    const target = new Date(endsAt).getTime();
    const tick = () => setRemaining(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const totalSeconds = remaining === null ? null : Math.floor(remaining / 1000);
  const showDays = totalSeconds !== null && totalSeconds >= 86400;
  const parts =
    totalSeconds === null
      ? ["--", "--", "--"]
      : [
          ...(showDays ? [pad(Math.floor(totalSeconds / 86400))] : []),
          pad(Math.floor((totalSeconds % 86400) / 3600)),
          pad(Math.floor((totalSeconds % 3600) / 60)),
          pad(totalSeconds % 60),
        ];
  const labels = showDays
    ? ["days", "hrs", "min", "sec"]
    : ["hrs", "min", "sec"];

  return (
    <div className="flex items-center gap-1.5" role="timer" aria-label="Sale ends in">
      {parts.map((value, i) => (
        <React.Fragment key={labels[i]}>
          <span className="flex min-w-11 flex-col items-center rounded-lg bg-background/12 px-2 py-1.5">
            <span className="font-mono text-base leading-none font-semibold tabular-nums">
              {value}
            </span>
            <span className="mt-0.5 text-[10px] tracking-wider uppercase opacity-70">
              {labels[i]}
            </span>
          </span>
          {i < parts.length - 1 && (
            <span className="text-sm font-semibold opacity-60">:</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
