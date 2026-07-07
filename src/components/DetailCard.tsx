interface DetailCardProps {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}

export function DetailCard({
  label,
  value,
  mono = false,
  highlight = false,
}: DetailCardProps) {
  return (
    <div className="crypto-card-hover p-3.5 sm:p-4">
      <p className="section-label text-[10px] sm:text-xs">{label}</p>
      <p
        className={`mt-1.5 ${
          mono
            ? "break-all font-mono text-xs text-gray-200 sm:text-sm"
            : "text-base font-semibold tabular-nums text-white sm:text-lg"
        } ${highlight ? "text-solana-green" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}