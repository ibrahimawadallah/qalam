import PageHead from "@/components/page-head";
import ReciterCard from "@/components/ruqyah-card";
import { getStationsByCategory } from "@/lib/quran-data";

export const dynamic = "force-dynamic";

export default function RuqyahPage() {
  const stations = getStationsByCategory("ruqyah");

  return (
    <div className="min-h-screen">
      <PageHead eyebrow="Quranic healing" title="Ruqyah al-Shariah">
        Protective recitations from the Quran and Sunnah — stream them as continuous audio.
      </PageHead>
      <main className="mx-auto max-w-[1080px] px-6 py-12 page-enter">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stations.map((station) => (
            <ReciterCard key={station.id} station={station} />
          ))}
        </div>
      </main>
    </div>
  );
}
