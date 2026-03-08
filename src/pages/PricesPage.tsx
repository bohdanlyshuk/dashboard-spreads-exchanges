import PricesTable from "../components/PricesTable";

export default function PricesPage() {
  return (
    <div className="space-y-8">
      {/* Hero block: mexc-sync style */}
      <section className="relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-4">
          Live
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-tight">
          Spreads <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent italic">Dashboard.</span>
        </h2>
        <p className="mt-2 text-gray-400 text-sm max-w-xl">
          USDT perpetual spreads across Bybit, Binance, MEXC, Gate.io, BingX, KuCoin, Bitget. Click a row to view spread history.
        </p>
      </section>

      <PricesTable />
    </div>
  );
}
