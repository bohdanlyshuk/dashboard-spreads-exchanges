import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  fetchPrices,
  fetchSpreadHistory,
  type SpreadHistoryResponse,
  type SpreadHistoryError,
} from "../api/client";

const inputClass =
  "w-full min-w-[140px] px-4 py-3 text-white bg-white/5 border border-white/10 rounded-xl transition-all duration-200 focus:border-emerald-400 focus:ring-0 focus:outline-none focus:shadow-lg focus:shadow-emerald-400/25 hover:border-white/20 hover:bg-white/8 appearance-none cursor-pointer";
const badgeClass =
  "inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest";

type IntervalChoice = "raw" | 5 | 15 | 60;

function isErrorResp(
  r: SpreadHistoryResponse | SpreadHistoryError
): r is SpreadHistoryError {
  return "error" in r && typeof (r as SpreadHistoryError).error === "string";
}

export default function SpreadHistoryChart({
  defaultSymbol = "",
}: { defaultSymbol?: string } = {}) {
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [preset, setPreset] = useState<"24h" | "7d">("24h");
  const [interval, setIntervalChoice] = useState<IntervalChoice>("raw");

  const { data: prices } = useQuery({
    queryKey: ["prices"],
    queryFn: async () => {
      const r = await fetchPrices();
      return Array.isArray(r) ? r : [r];
    },
    select: (list) => list.map((x) => x.symbol),
    staleTime: 30_000,
  });

  const symbols = useMemo(() => [...new Set(prices ?? [])].sort(), [prices]);

  const { from, to } = useMemo(() => {
    if (preset === "24h") return { from: undefined, to: undefined };
    const now = Date.now();
    const fromDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const toDate = new Date(now);
    return {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    };
  }, [preset]);

  const intervalParam = interval === "raw" ? undefined : interval;

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["spread-history", symbol, from, to, intervalParam],
    queryFn: () =>
      fetchSpreadHistory({
        symbol,
        from,
        to,
        interval: intervalParam ?? null,
      }),
    enabled: !!symbol.trim(),
  });

  const errMsg =
    data && isErrorResp(data)
      ? data.error
      : isError && error
        ? (error instanceof Error ? error.message : "Failed to load")
        : null;

  const hist =
    data && !isErrorResp(data) ? (data as SpreadHistoryResponse) : null;
  const series = hist?.series ?? [];
  const has503 = !!(
    data &&
    isErrorResp(data) &&
    (data as SpreadHistoryError).error
  );

  return (
    <div className="space-y-6">
      <form
        className="glass-effect rounded-2xl p-6"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex flex-wrap items-end gap-6">
          <div className={badgeClass}>Chart settings</div>
          <label className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Symbol</span>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className={inputClass}>
              <option value="">Choose symbol</option>
              {symbols.map((s) => (
                <option key={s} value={s} className="bg-gray-800 text-gray-200">{s}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Period</span>
            <select value={preset} onChange={(e) => setPreset(e.target.value as "24h" | "7d")} className={inputClass}>
              <option value="24h" className="bg-gray-800 text-gray-200">24h</option>
              <option value="7d" className="bg-gray-800 text-gray-200">7d</option>
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Interval</span>
            <select
              value={interval}
              onChange={(e) => {
                const v = e.target.value;
                setIntervalChoice(v === "raw" ? "raw" : (Number(v) as 5 | 15 | 60));
              }}
              className={inputClass}
            >
              <option value="raw" className="bg-gray-800 text-gray-200">Raw</option>
              <option value="5" className="bg-gray-800 text-gray-200">5 min</option>
              <option value="15" className="bg-gray-800 text-gray-200">15 min</option>
              <option value="60" className="bg-gray-800 text-gray-200">60 min</option>
            </select>
          </label>
        </div>
      </form>

      {has503 && (
        <div className="glass-effect rounded-2xl p-6 border border-amber-500/30 bg-amber-500/5">
          <p className="text-amber-200 font-medium">Spread history unavailable (DATABASE_URL not set).</p>
          <p className="text-xs text-amber-200/70 mt-1 uppercase tracking-wider">Enable database for historical data.</p>
        </div>
      )}

      {errMsg && !has503 && (
        <div className="glass-effect rounded-2xl p-6 border border-red-500/30 bg-red-500/5">
          <p className="text-red-400 font-medium">{errMsg}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 px-5 py-2.5 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            Retry
          </button>
        </div>
      )}

      {!has503 && !errMsg && symbol && series.length === 0 && !isFetching && (
        <div className="glass-effect rounded-2xl p-12 text-center">
          <p className="text-gray-400 font-medium">No data for the selected period.</p>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Try another symbol or range.</p>
        </div>
      )}

      {!has503 && !errMsg && series.length > 0 && (
        <div className="glass-effect rounded-2xl p-6 border border-white/5">
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={series}
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.08)"
                />
                <XAxis
                  dataKey="ts"
                  stroke="rgba(255,255,255,0.15)"
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  tickFormatter={(v) => {
                    try {
                      return new Date(v).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    } catch {
                      return String(v);
                    }
                  }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.15)"
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  tickFormatter={(v) => `${Number(v).toFixed(3)}%`}
                />
                <Tooltip
                  formatter={(v: number) => [`${Number(v).toFixed(4)}%`, ""]}
                  labelFormatter={(v) => new Date(v).toLocaleString()}
                  contentStyle={{
                    backgroundColor: "rgba(31,41,55,0.98)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                  }}
                  labelStyle={{ color: "#e5e7eb" }}
                  itemStyle={{ color: "#9ca3af" }}
                />
                <Legend wrapperStyle={{ color: "#9ca3af" }} />
                <Line
                  type="monotone"
                  dataKey="spread_pct_abs"
                  name="spread_pct_abs"
                  stroke="#3b82f6"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="net_spread_pct"
                  name="net_spread_pct"
                  stroke="#10b981"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {isFetching && symbol && (
        <div className="glass-effect rounded-2xl p-12 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-gray-400 font-medium">Loading…</p>
        </div>
      )}
    </div>
  );
}
