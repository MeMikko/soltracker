import { Suspense } from "react";
import { LoadingState } from "@/components/LoadingState";
import { ResultsContent } from "./results-content";

export default function ResultsPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading results…" />}>
      <ResultsContent />
    </Suspense>
  );
}