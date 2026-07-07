"use client";

interface LockedFieldProps {
  label: string;
  onUpgrade: () => void;
}

export function LockedField({ label, onUpgrade }: LockedFieldProps) {
  return (
    <div className="crypto-card relative overflow-hidden p-3.5 sm:p-4">
      <p className="section-label text-[10px] sm:text-xs">{label}</p>
      <div className="mt-2 select-none blur-[6px]">
        <p className="font-mono text-base text-gray-300 sm:text-lg">██.██%</p>
        <p className="font-mono text-xs text-gray-500 sm:text-sm">Gini: 0.██</p>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-surface/70 backdrop-blur-[2px]">
        <button
          type="button"
          onClick={onUpgrade}
          className="btn-primary px-3 py-1.5 text-xs"
        >
          Unlock with Pro
        </button>
      </div>
    </div>
  );
}