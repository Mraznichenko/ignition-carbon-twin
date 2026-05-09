# Carbon Twin

Carbon Twin is a TanStack Start application for a personal AI carbon digital twin. It builds a lifestyle profile, estimates annual CO2e impact across food, travel, shopping, and home energy, and offers context-aware advice through a built-in advisor with optional Kimi/Moonshot enrichment.

## What Is Inside

- Personal profile builder with natural-language profile inference
- Carbon dashboard with footprint breakdowns, grades, benchmarks, and insights
- Advisor chat for food, travel, and purchase decisions
- Company/university workspace with anonymized benchmark context
- Nearby actions and reporting-support screens
- Cloudflare-compatible server entry with branded SSR error handling

## Tech Stack

- React 19
- TanStack Start, Router, and Query
- Vite
- Tailwind CSS 4
- Cloudflare Vite plugin and Wrangler config
- Recharts and Radix UI components
- Optional Kimi/Moonshot API calls for profile inference and advisor responses

## Environment Variables

AI profile inference and enriched advisor responses require one of the API keys below.

```bash
MOONSHOT_API_KEY=your_key_here
# or
KIMI_API_KEY=your_key_here

# Optional
KIMI_MODEL=kimi-k2.6
KIMI_BASE_URL=https://api.moonshot.ai/v1
```

If no API key is configured, the advisor falls back to deterministic built-in advice where available, and API-backed profile inference will report that the key is missing.

## Data And Scripts

The repository includes carbon knowledge and product data under `data`, `raw-data`, and `openfoodfacts-product-database`. To rebuild the product index:

```bash
npm run build:product-index
```

## Deployment

The project is configured for Cloudflare-compatible builds through `@cloudflare/vite-plugin` and `wrangler.jsonc`. Server routes are handled in `src/server.ts`, including:

- `/api/kimi-advisor`
- `/api/kimi-profile`

Build and deploy:

```bash
npm install
npm run deploy
```

For deployed environments, set Kimi/Moonshot values as Cloudflare secrets:

```bash
npx wrangler secret put MOONSHOT_API_KEY
npx wrangler secret put KIMI_BASE_URL
npx wrangler secret put KIMI_MODEL
```

Use these values for the non-secret Kimi settings:

```text
KIMI_BASE_URL=https://api.moonshot.ai/v1
KIMI_MODEL=kimi-k2.6
```

## Project Structure

```text
src/components          Shared UI and Carbon Twin avatar
src/lib/carbon          Carbon calculator, advisor, Kimi clients, and knowledge helpers
src/routes              TanStack file routes
src/server.ts           Cloudflare/TanStack server entry and API routes
scripts                 Data processing utilities
docs                    Pitch and project notes
```
