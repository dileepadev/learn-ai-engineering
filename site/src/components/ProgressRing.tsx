interface ProgressRingProps {
  percent: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
}

/**
 * A circular progress indicator.
 *
 * Drawn as an SVG rather than a conic-gradient div so the stroke stays crisp at any size
 * and the rounded cap reads correctly at low percentages.
 */
export function ProgressRing({
  percent,
  size = 132,
  stroke = 10,
  label,
  sublabel,
}: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${clamped}% complete`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">
          {label ?? `${clamped}%`}
        </span>
        {sublabel ? (
          <span className="mt-0.5 text-[0.7rem] text-faint">{sublabel}</span>
        ) : null}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  percent: number;
  status?: "complete" | "in-progress" | "upcoming";
  className?: string;
}

const BAR_COLOR: Record<string, string> = {
  complete: "var(--color-done)",
  "in-progress": "var(--color-doing)",
  upcoming: "var(--border-strong)",
};

export function ProgressBar({ percent, status = "in-progress", className = "" }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-sunken ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${clamped}%`, backgroundColor: BAR_COLOR[status] }}
      />
    </div>
  );
}
