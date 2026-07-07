export function LoadingState({
  message = "Fetching on-chain data…",
}: {
  message?: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-5 py-20 sm:py-24"
      role="status"
    >
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-surface-border border-t-solana-purple" />
        <div
          className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-b-solana-green"
          style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
        />
      </div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}