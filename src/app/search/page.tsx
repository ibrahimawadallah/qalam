import { Suspense } from "react";
import QuranSearchClient from "./client";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-purple-300/60">Loading search...</div>}>
      <QuranSearchClient />
    </Suspense>
  );
}
