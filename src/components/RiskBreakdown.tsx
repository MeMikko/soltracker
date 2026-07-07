import type { RiskFactor } from "@/lib/types";

interface RiskBreakdownProps {
  factors: RiskFactor[];
}

export function RiskBreakdown({ factors }: RiskBreakdownProps) {
  return (
    <div className="crypto-card p-4 sm:p-6">
      <h3 className="section-label">Score Breakdown</h3>
      <p className="mt-1 text-xs text-gray-600">
        Points deducted from the 100 baseline for each risk factor.
      </p>
      <div className="mt-5 space-y-5">
        {factors.map((factor) => {
          const pct =
            factor.maxScore > 0
              ? Math.round((factor.score / factor.maxScore) * 100)
              : 0;
          const hasDeduction = factor.score > 0;

          return (
            <div key={factor.id}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium text-gray-200">{factor.label}</span>
                <span
                  className={`font-mono text-xs tabular-nums sm:text-sm ${
                    hasDeduction ? "text-accent-red" : "text-accent-green"
                  }`}
                >
                  {hasDeduction ? `-${factor.score}` : "0"} / {factor.maxScore}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-border/80">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    hasDeduction
                      ? "bg-gradient-to-r from-accent-red/80 to-accent-red/40"
                      : "bg-gradient-to-r from-accent-green/50 to-accent-green/20"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                {factor.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}