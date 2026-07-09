import { ZenLogo } from "./ZenLogo";

export function LoadingState({
  message = "Fetching on-chain data…",
}: {
  message?: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-6 py-20 sm:py-24"
      role="status"
    >
      <div className="relative">
        <span
          className="absolute inset-0 -m-4 rounded-full bg-gradient-to-br from-zen-cyan/20 to-zen-purple/20 blur-xl animate-zen-pulse"
          aria-hidden
        />
        <ZenLogo size="lg" className="animate-zen-pulse" />
      </div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}