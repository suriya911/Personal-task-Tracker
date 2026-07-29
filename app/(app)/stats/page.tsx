import { getStats } from "@/lib/queries/stats";
import { StatsView } from "@/components/stats/stats-view";

export const metadata = { title: "Statistics" };

export default async function StatsPage() {
  const data = await getStats();

  return (
    <main className="flex flex-1 flex-col items-center px-6 pb-24 pt-10 sm:pt-16">
      <StatsView data={data} />
    </main>
  );
}
