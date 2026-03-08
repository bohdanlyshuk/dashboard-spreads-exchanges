import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { fetchPrices, type PricesResponse } from "../api/client";
import SpreadHistoryChart from "./SpreadHistoryChart";
import { cn } from "../utils/cn";

const ChevronRight = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

function formatLastUpdate(ts: number): string {
  if (!ts || ts < 1000) return "—";
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 5) return "Just now";
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

type Limit = 10 | 25 | 50 | 100 | 200 | "all";

const LIMIT_OPTS: { value: Limit; label: string }[] = [
  { value: 10, label: "10" },
  { value: 25, label: "25" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
  { value: 200, label: "200" },
  { value: "all", label: "All" },
];

const EXCHANGES: { id: string; label: string }[] = [
  { id: "bybit", label: "Bybit" },
  { id: "binance", label: "Binance" },
  { id: "mexc", label: "MEXC" },
  { id: "gate", label: "Gate" },
  { id: "bingx", label: "BingX" },
  { id: "kucoin", label: "KuCoin" },
  { id: "bitget", label: "Bitget" },
];

function toUsdtUnderscore(s: string): string {
  return s.replace(/USDT$/i, "_USDT");
}

const EXCHANGE_META: Record<
  string,
  { domain: string; url: (symbol: string) => string }
> = {
  bybit: {
    domain: "bybit.com",
    url: (s) => `https://www.bybit.com/trade/usdt/${s}`,
  },
  binance: {
    domain: "binance.com",
    url: (s) => `https://www.binance.com/en/futures/${s}`,
  },
  mexc: {
    domain: "mexc.com",
    url: (s) => `https://www.mexc.com/futures/${toUsdtUnderscore(s)}`,
  },
  gate: {
    domain: "gate.io",
    url: (s) => `https://www.gate.io/futures/USDT/${toUsdtUnderscore(s)}`,
  },
  bingx: {
    domain: "bingx.com",
    url: (s) => `https://bingx.com/en-us/perpetual/${s.replace(/USDT$/i, "-USDT")}`,
  },
  kucoin: {
    domain: "kucoin.com",
    url: (s) => `https://www.kucoin.com/futures/trade/${s.replace(/USDT$/i, "-USDT")}`,
  },
  bitget: {
    domain: "bitget.com",
    url: (s) => `https://www.bitget.com/futures/usdt/${s}`,
  },
};

function BybitIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <rect width="16" height="16" rx="4" fill="#F7A600" />
      <text x="8" y="11.5" fill="#fff" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="system-ui, sans-serif">
        b
      </text>
    </svg>
  );
}

function ExchangeIcon({ exchange, domain }: { exchange: string; domain: string }) {
  const key = exchange.toLowerCase();
  if (key === "bybit") return <BybitIcon />;
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
      alt=""
      className="w-4 h-4 rounded shrink-0"
    />
  );
}

function ExchangeCell({
  exchange,
  price,
  symbol,
}: {
  exchange: string;
  price: string;
  symbol: string;
}) {
  const key = exchange.toLowerCase();
  const meta = EXCHANGE_META[key];
  const href = meta?.url(symbol);
  if (href && meta) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-colors"
      >
        <ExchangeIcon exchange={exchange} domain={meta.domain} />
        <span className="tabular-nums">{price}</span>
      </a>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-gray-300">
      <span className="tabular-nums">{price}</span>
    </span>
  );
}

const REFRESH_OPTS: { value: number; label: string }[] = [
  { value: 5, label: "5s" },
  { value: 10, label: "10s" },
  { value: 30, label: "30s" },
];

const inputClass =
  "rounded-xl px-3 py-2.5 bg-white/5 border border-white/10 text-gray-200 text-sm focus:border-emerald-400 focus:outline-none focus:ring-0 w-20 transition-colors hover:border-white/20";

const PauseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

export default function PricesTable() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [limit, setLimit] = useState<Limit>(50);
  const [exchanges, setExchanges] = useState<Set<string>>(
    () => new Set(EXCHANGES.map((e) => e.id))
  );
  const [spreadFrom, setSpreadFrom] = useState("");
  const [spreadTo, setSpreadTo] = useState("");
  const [netSpreadFrom, setNetSpreadFrom] = useState("");
  const [netSpreadTo, setNetSpreadTo] = useState("");
  const [symbolFilter, setSymbolFilter] = useState("");
  const [refreshIntervalSec, setRefreshIntervalSec] = useState(10);
  const [isTableHovered, setIsTableHovered] = useState(false);
  const [isTableScrolling, setIsTableScrolling] = useState(false);
  const [, setTick] = useState(0);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPaused = isTableHovered || isTableScrolling;

  const closeModal = useCallback(() => setSelectedSymbol(null), []);

  const toggleExchange = useCallback((id: string) => {
    setExchanges((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  useEffect(() => {
    if (!selectedSymbol) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedSymbol, closeModal]);

  // Tick every 1s for "Last update: Xs ago"
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { data, isLoading, isError, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["prices"],
    queryFn: async () => {
      const r = await fetchPrices();
      return Array.isArray(r) ? r : [r];
    },
    refetchInterval: isPaused ? false : refreshIntervalSec * 1000,
  });

  const handleTableScroll = useCallback(() => {
    setIsTableScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsTableScrolling(false);
      scrollTimeoutRef.current = null;
    }, 1500);
  }, []);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const list = (data ?? []) as PricesResponse[];

  const getSpreadPct = (row: PricesResponse) =>
    Number((row.arbitrage as { spread_pct?: number; spread_pct_abs?: number }).spread_pct ?? (row.arbitrage as { spread_pct_abs?: number }).spread_pct_abs ?? 0);

  const filteredList = useMemo(() => {
    return list.filter((row) => {
      const bid = row.arbitrage.best_bid?.exchange?.toLowerCase();
      const ask = row.arbitrage.best_ask?.exchange?.toLowerCase();
      if (!bid || !ask || !exchanges.has(bid) || !exchanges.has(ask)) return false;
      const spreadPct = getSpreadPct(row);
      const from = parseFloat(spreadFrom);
      if (!Number.isNaN(from) && spreadPct < from) return false;
      const to = parseFloat(spreadTo);
      if (!Number.isNaN(to) && spreadPct > to) return false;
      const netPct = Number(row.arbitrage.net_spread_pct ?? 0);
      const nFrom = parseFloat(netSpreadFrom);
      if (!Number.isNaN(nFrom) && netPct < nFrom) return false;
      const nTo = parseFloat(netSpreadTo);
      if (!Number.isNaN(nTo) && netPct > nTo) return false;
      const sym = symbolFilter.trim();
      if (sym && !row.symbol.toUpperCase().includes(sym.toUpperCase())) return false;
      return true;
    });
  }, [list, exchanges, spreadFrom, spreadTo, netSpreadFrom, netSpreadTo, symbolFilter]);

  const displayedList = useMemo(() => {
    if (limit === "all") return filteredList;
    return filteredList.slice(0, limit);
  }, [filteredList, limit]);

  const total = filteredList.length;
  const showingText =
    total === 0
      ? "No rows match filters"
      : total === displayedList.length
        ? `Showing ${total} of ${total}`
        : `Showing 1–${displayedList.length} of ${total}`;

  if (isLoading) {
    return (
      <div className="glass-effect rounded-2xl p-12 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
        <p className="text-gray-200 font-medium">Loading…</p>
        <p className="text-xs text-gray-500 uppercase tracking-wider">Connecting to API</p>
      </div>
    );
  }

  if (isError) {
    const apiUrl = import.meta.env.VITE_API_URL || "/api";
    return (
      <div className="glass-effect rounded-2xl p-6 border border-red-500/40">
        <p className="text-red-300 font-medium">
          {error instanceof Error ? error.message : "Failed to load"}
        </p>
        <p className="text-xs text-gray-400 mt-2 uppercase tracking-wider">Ensure the API is running and allows this origin (CORS)</p>
        <p className="text-xs text-gray-500 mt-1 font-mono break-all">API: {apiUrl}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 px-5 py-2.5 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="glass-effect rounded-2xl p-12 text-center">
        <p className="text-gray-200 font-medium">No data.</p>
        <p className="text-xs text-gray-500 mt-2 uppercase tracking-wider">Wait for backend cache to update.</p>
      </div>
    );
  }

  return (
    <>
      {/* Filter bar */}
      <div className="rounded-2xl mb-6 overflow-hidden border border-white/10 bg-gray-900/60 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-4 px-5 py-4 border-b border-white/5">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Filters</span>
          <label className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Show</span>
            <select
              value={String(limit)}
              onChange={(e) => {
                const v = e.target.value;
                setLimit(v === "all" ? "all" : (Number(v) as Limit));
              }}
              className="rounded-lg px-2.5 py-1.5 w-16 bg-white/5 border border-white/10 text-gray-200 text-sm focus:border-emerald-500/50 focus:outline-none cursor-pointer"
            >
              {LIMIT_OPTS.map((o) => (
                <option key={o.value} value={String(o.value)} className="bg-gray-800 text-gray-200">
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Refresh</span>
            <select
              value={refreshIntervalSec}
              onChange={(e) => setRefreshIntervalSec(Number(e.target.value))}
              className="rounded-lg px-2.5 py-1.5 w-14 bg-white/5 border border-white/10 text-gray-200 text-sm focus:border-emerald-500/50 focus:outline-none cursor-pointer"
            >
              {REFRESH_OPTS.map((o) => (
                <option key={o.value} value={o.value} className="bg-gray-800 text-gray-200">
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <span className="w-px h-4 bg-white/10" aria-hidden />
          <span className="text-xs text-gray-400">
            Updated <span className={cn("tabular-nums font-medium", dataUpdatedAt && dataUpdatedAt > 0 ? "text-emerald-400/80" : "text-gray-500")}>{formatLastUpdate(dataUpdatedAt ?? 0)}</span>
          </span>
          <span className="text-xs text-gray-500">{showingText}</span>
        </div>
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4 px-5 py-4">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Exchanges</span>
            <div className="flex flex-wrap gap-1.5">
              {EXCHANGES.map((e) => {
                const on = exchanges.has(e.id);
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggleExchange(e.id)}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-xs font-medium border transition-colors",
                      on
                        ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                        : "border-white/10 bg-white/[0.04] text-gray-500 hover:border-white/15 hover:text-gray-400"
                    )}
                  >
                    {e.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Spread %</span>
            <div className="flex items-center gap-1.5">
              <input type="number" step="any" placeholder="min" value={spreadFrom} onChange={(e) => setSpreadFrom(e.target.value)} className={inputClass} />
              <span className="text-gray-500 text-xs">–</span>
              <input type="number" step="any" placeholder="max" value={spreadTo} onChange={(e) => setSpreadTo(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Net %</span>
            <div className="flex items-center gap-1.5">
              <input type="number" step="any" placeholder="min" value={netSpreadFrom} onChange={(e) => setNetSpreadFrom(e.target.value)} className={inputClass} />
              <span className="text-gray-500 text-xs">–</span>
              <input type="number" step="any" placeholder="max" value={netSpreadTo} onChange={(e) => setNetSpreadTo(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Symbol</span>
            <input
              type="text"
              placeholder="BTC"
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              className="rounded-lg px-3 py-2 w-24 bg-white/5 border border-white/10 text-gray-200 text-sm focus:border-emerald-500/50 focus:outline-none placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      <div
        className="glass-effect rounded-2xl overflow-hidden border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.2)]"
        onMouseEnter={() => setIsTableHovered(true)}
        onMouseLeave={() => setIsTableHovered(false)}
      >
        {/* Table header bar: title + pair count */}
        <div className="relative flex items-center justify-between px-6 py-4 bg-white/[0.02] border-b border-white/10">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">Spreads</h3>
          {isPaused && (
            <div
              className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/15 px-3 py-2 text-amber-400/95 text-xs font-semibold shadow-lg pointer-events-none"
              aria-live="polite"
            >
              <PauseIcon />
              <span>Updates paused while you browse</span>
            </div>
          )}
          <span className="text-xs font-medium text-gray-500">{displayedList.length} pairs</span>
        </div>
        <div
          className="overflow-auto max-h-[calc(100vh-14rem)] modal-scrollbar scroll-smooth"
          onScroll={handleTableScroll}
        >
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-900 backdrop-blur-md border-b-2 border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-300 uppercase tracking-widest">Symbol</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">Spread %</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">Net spread %</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-300 uppercase tracking-widest">LONG</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-300 uppercase tracking-widest">SHORT</th>
                <th className="w-14 px-4 py-4 text-center text-gray-300" aria-label="History" />
              </tr>
            </thead>
            <tbody>
              {displayedList.map((row, i) => (
                <tr
                  key={row.symbol}
                  onClick={() => setSelectedSymbol(row.symbol)}
                  className={cn(
                    "group border-b border-white/5 cursor-pointer transition-all duration-200",
                    "hover:bg-emerald-500/5 active:bg-white/5",
                    i % 2 === 1 && "bg-white/[0.02]"
                  )}
                >
                  <td className="px-6 py-4 font-bold text-emerald-400 text-left">{row.symbol}</td>
                  <td className="px-6 py-4 text-center tabular-nums font-medium">
                    <span className={cn(
                      getSpreadPct(row) > 0 && "text-emerald-400",
                      getSpreadPct(row) < 0 && "text-red-400",
                      getSpreadPct(row) === 0 && "text-gray-400"
                    )}>
                      {getSpreadPct(row).toFixed(4)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center tabular-nums font-medium text-gray-200">{(Number(row.arbitrage.net_spread_pct ?? 0)).toFixed(4)}</td>
                  <td className="px-6 py-4">
                    <ExchangeCell
                      exchange={row.arbitrage.best_ask.exchange}
                      price={row.arbitrage.best_ask.price}
                      symbol={row.symbol}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <ExchangeCell
                      exchange={row.arbitrage.best_bid.exchange}
                      price={row.arbitrage.best_bid.price}
                      symbol={row.symbol}
                    />
                  </td>
                  <td className="px-4 py-4 text-center text-gray-500 group-hover:text-emerald-400 transition-colors">
                    <ChevronRight />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSymbol && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="glass-effect rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-white/10 shadow-[0_0_60px_rgba(16,185,129,0.12)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
              <h2 id="modal-title" className="text-base font-black uppercase tracking-tight text-gray-100">
                Spread history: <span className="text-emerald-400">{selectedSymbol}</span>
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="overflow-auto flex-1 p-6 modal-scrollbar scroll-smooth">
              <SpreadHistoryChart defaultSymbol={selectedSymbol} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
