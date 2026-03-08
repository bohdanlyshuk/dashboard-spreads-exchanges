# Spreads Dashboard

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Dashboard for [exchanges-spreads-service](https://github.com/bohdanlyshuk/exchanges-spreads-service): live USDT perpetual prices/spreads table and spread history charts across Bybit, Binance, MEXC, Gate.io, BingX, KuCoin, Bitget.

- **Prices** — filter by spread %, net spread %, symbol; auto-refresh; click a row for spread history.
- **Spread history** — time series charts (requires API with `DATABASE_URL`).
- **Docker** — single port, dashboard + API behind nginx proxy (no CORS).

## Running on the server (Docker)

Dashboard and API run together: one external port, API behind `/api` proxy (no CORS).

**Prerequisites:** clone **exchanges-spreads-service** next to this repo:

```bash
# example layout
projects/
├── dashboard-spreads-exchanges/   # this repo
└── exchanges-spreads-service/     # git clone https://github.com/bohdanlyshuk/exchanges-spreads-service
```

1. Copy the API config and set variables:

```bash
cp .env.api.example .env.api
# Edit .env.api: PORT=8000, LOG_LEVEL, HTTP_TIMEOUT, PRICE_UPDATE_INTERVAL are required
```

2. Build and run:

```bash
docker compose up -d --build
```

3. Site is available externally on port **9080**: `http://<server-IP>:9080`

The API is not exposed directly—only through the dashboard (nginx proxies `/api` to the API container). To change the port, edit `"9080:80"` to `"<your-port>:80"` in `docker-compose.yml`.

## Local development

```bash
cp .env.example .env
# For direct API requests set VITE_API_URL (backend must allow CORS)

npm install
npm run dev
```

Open http://localhost:5173.

## Config

| File / variable | Description |
|-----------------|-------------|
| `.env` | `VITE_API_URL` — API URL for local build/dev (optional). |
| `.env.api` | Variables for the API container (PORT, LOG_LEVEL, HTTP_TIMEOUT, PRICE_UPDATE_INTERVAL, optional DATABASE_URL). |

## Pages

- **Prices** (`/prices`) — symbol table, spreads, auto-refresh.
- **Spread history** (`/spread-history`) — charts (requires DATABASE_URL on API).

## Stack

React 18, TypeScript, Vite, TanStack Query, Recharts, React Router, Tailwind CSS.

## License

MIT — see [LICENSE](LICENSE).
