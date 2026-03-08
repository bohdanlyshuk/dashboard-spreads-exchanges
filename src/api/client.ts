const baseUrl =
  (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:8001";

// GET /v1/prices
export interface ExchangePrice {
  exchange: string;
  bid: string;
  ask: string;
  last: string;
  mark: string;
  funding_rate: string;
}

export interface BestPrice {
  exchange: string;
  price: string;
}

export interface Arbitrage {
  best_bid: BestPrice;
  best_ask: BestPrice;
  /** Signed: (best_bid − best_ask) / best_ask × 100; positive = arbitrage opportunity */
  spread_pct: number;
  /** spread_pct plus funding adjustment (LONG pays, SHORT receives) */
  net_spread_pct: number;
  direction: string;
}

export interface PricesResponse {
  symbol: string;
  updated_at?: string;
  prices: ExchangePrice[];
  arbitrage: Arbitrage;
  pairwise_spreads: Record<string, string>;
  errors: Array<Record<string, string>>;
}

// GET /v1/spread-history
export interface SpreadHistoryPoint {
  ts: string;
  /** Signed spread %; positive = arb opportunity */
  spread_pct: number;
  net_spread_pct: number;
}

export interface SpreadHistoryResponse {
  symbol: string;
  from: string;
  to: string;
  interval_minutes: number | null;
  series: SpreadHistoryPoint[];
}

export interface SpreadHistoryError {
  error: string;
}

async function get(url: string): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    return await fetch(`${baseUrl}${url}`, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function fetchPrices(
  symbol?: string
): Promise<PricesResponse | PricesResponse[]> {
  const url = symbol ? `/v1/prices?symbol=${encodeURIComponent(symbol)}` : "/v1/prices";
  const res = await get(url);
  if (!res.ok) {
    throw new Error(`fetchPrices: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchSpreadHistory(params: {
  symbol: string;
  from?: string;
  to?: string;
  interval?: number | null;
}): Promise<SpreadHistoryResponse | SpreadHistoryError> {
  const q = new URLSearchParams();
  q.set("symbol", params.symbol);
  if (params.from != null) q.set("from", params.from);
  if (params.to != null) q.set("to", params.to);
  if (params.interval != null && params.interval >= 1) q.set("interval", String(params.interval));
  const res = await get(`/v1/spread-history?${q.toString()}`);
  if (!res.ok && res.status !== 503) {
    throw new Error(`fetchSpreadHistory: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (res.status === 503) {
    return data as SpreadHistoryError;
  }
  return data as SpreadHistoryResponse;
}
