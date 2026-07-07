import type { RiskLevel } from "@/lib/types";

interface RiskScoreProps {
  score: number;
  level: RiskLevel;
}

const LEVEL_LABELS: Record<RiskLevel, string> = {
  low: "Low Risk",
  medium: "Medium Risk",
  high: "High Risk",
};

const LEVEL_STYLES: Record<RiskLevel, { box: string; text: string; ring: string }> = {
  low: {
    box: "bg-risk-low",
    text: "text-risk-low",
    ring: "ring-accent-green/20",
  },
  medium: {
    box: "bg-risk-medium",
    text: "text-risk-medium",
    ring: "ring-accent-yellow/20",
  },
  high: {
    box: "bg-risk-high",
    text: "text-risk-high",
    ring: "ring-accent-red/20",
  },
};

export function RiskScore({ score, level }: RiskScoreProps) {
  const styles = LEVEL_STYLES[level];
  const pct = score;

  return (
    <div
      className={`crypto-card relative overflow-hidden p-6 text-center ring-1 sm:p-8 ${styles.box} ${styles.ring}`}
      data-testid="risk-score"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-2xl" />

      <p className="section-label">Risk Score</p>
      <p className="mt-1 text-xs text-gray-600">100 = safest · 0 = highest risk</p>

      <div className="relative mx-auto mt-6 flex h-36 w-36 items-center justify-center sm:h-40 sm:w-40">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-surface-border"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${pct * 2.64} 264`}
            className={styles.text}
          />
        </svg>
        <p className={`text-4xl font-bold tabular-nums sm:text-5xl ${styles.text}`}>
          {score}
        </p>
      </div>

      <p className={`mt-4 text-base font-semibold sm:text-lg ${styles.text}`}>
        {LEVEL_LABELS[level]}
      </p>
    </div>
  );
}