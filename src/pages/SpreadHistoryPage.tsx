import SpreadHistoryChart from "../components/SpreadHistoryChart";

export default function SpreadHistoryPage() {
  return (
    <div className="space-y-8">
      <section className="relative">
        <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-tight">
          Spread <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent italic">history</span>
        </h2>
        <p className="mt-2 text-gray-400 text-sm max-w-xl">
          Time series for spread % and net spread % (requires DATABASE_URL on API).
        </p>
      </section>
      <SpreadHistoryChart />
    </div>
  );
}
