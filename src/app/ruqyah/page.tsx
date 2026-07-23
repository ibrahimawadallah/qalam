import SiteNav from "@/components/site-nav";
import ReciterCard from "@/components/ruqyah-card";
import { getStationsByCategory } from "@/lib/quran-data";

export const dynamic = "force-dynamic";

export default function RuqyahPage() {
  const stations = getStationsByCategory("ruqyah");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0518" }}>
      <SiteNav />
      <main className="mx-auto max-w-screen-xl px-3 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-emerald-200 mb-2">الرقية الشرعية</h1>
          <p className="text-emerald-300/60 text-sm">Ruqyah al-Shariah — Quranic healing &amp; protection recitations</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations.map((station) => (
            <ReciterCard key={station.id} station={station} />
          ))}
        </div>
      </main>
    </div>
  );
}
