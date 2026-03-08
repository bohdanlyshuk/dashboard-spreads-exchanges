# Spreads Dashboard

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Standalone frontend for [exchanges-spreads-service](https://github.com/bohdanlyshuk/exchanges-spreads-service): live USDT perpetual prices/spreads table and spread history charts across Bybit, Binance, MEXC, Gate.io, BingX, KuCoin, Bitget.

Dashboard and API are **separate projects**. Run and deploy them independently; the dashboard only needs the API URL.

- **Prices** — filter by spread %, net spread %, symbol; auto-refresh; click a row for spread history.
- **Spread history** — time series charts (API must have `DATABASE_URL`).

## Local development

```bash
cp .env.example .env
# Optional: VITE_API_URL defaults to http://localhost:8001. API must allow CORS.

npm install
npm run dev
```

Open http://localhost:5173.

## Docker

Build and run (default API: http://localhost:8001):

```bash
docker build -t spreads-dashboard .
docker run -p 9080:80 spreads-dashboard
```

To use another API URL:

```bash
docker build --build-arg VITE_API_URL=https://your-api.example.com -t spreads-dashboard .
# or with compose:
VITE_API_URL=https://your-api.example.com docker compose up -d --build
```

Site is available on port **9080**. To change the port, edit `"9080:80"` in `docker-compose.yml`.

## Config

| Variable        | Description |
|-----------------|-------------|
| `VITE_API_URL`  | API base URL. Default: `http://localhost:8001`. |

## Stack

React 18, TypeScript, Vite, TanStack Query, Recharts, React Router, Tailwind CSS.

## License

MIT — see [LICENSE](LICENSE).
