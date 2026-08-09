import { Suspense } from "react";
import QuranSearchClient from "./client";

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading search...</div>}>
      <QuranSearchClient />
    </Suspense>
  );
}
