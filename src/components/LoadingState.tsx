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
      <ZenLogo size="lg" showGlow />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}