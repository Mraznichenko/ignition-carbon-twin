# Carbon Twin

Carbon Twin is a TanStack Start prototype for a personal AI carbon digital twin. It builds a lifestyle profile, estimates annual CO2e impact across food, travel, shopping, and home energy, and offers context-aware advice through a local deterministic advisor with optional Kimi/Moonshot enrichment.

## What Is Inside

- Personal profile builder with natural-language profile inference
- Carbon dashboard with footprint breakdowns, grades, benchmarks, and insights
- Advisor chat for food, travel, and purchase decisions
- Company/university workspace prototype with anonymized benchmark context
- Local actions and reporting-support prototype screens
- Cloudflare-compatible server entry with branded SSR error handling

## Tech Stack

- React 19
- TanStack Start, Router, and Query
- Vite
- Tailwind CSS 4
- Cloudflare Vite plugin and Wrangler config
- Recharts and Radix UI components
- Optional Kimi/Moonshot API calls for profile inference and advisor responses

## Local Development

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

The app runs on:

```text
http://localhost:8080
```

Build for production:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

## Local Environment Variables

Create `.env.local` for local API credentials. The app works without these keys, but AI profile inference and enriched advisor responses need one of the API keys below.

```bash
MOONSHOT_API_KEY=your_key_here
# or
KIMI_API_KEY=your_key_here

# Optional
KIMI_MODEL=kimi-k2.6
KIMI_BASE_URL=https://api.moonshot.ai/v1
```

If no API key is configured, the advisor falls back to deterministic local advice where available, and API-backed profile inference will report that the key is missing.

## Prototype Flow

1. Open the landing page.
2. Click `Load demo mode` to load a Lausanne demo profile and join the AlpineTech workspace.
3. Visit the dashboard to inspect the footprint estimate and benchmarks.
4. Ask the advisor about meals, trips, purchases, or weekly reduction ideas.
5. Edit the profile to test different lifestyles and workspace codes.

Available demo workspace codes:

```text
ALPINETECH-2026
EPFL-CLIMATE
```

## Data And Scripts

The repository includes carbon knowledge and product data under `data`, `raw-data`, and `openfoodfacts-product-database`. To rebuild the product index:

```bash
npm run build:product-index
```

## Deploy With Wrangler

The project is configured for Cloudflare-compatible builds through `@cloudflare/vite-plugin` and `wrangler.jsonc`. Server routes are handled in `src/server.ts`, including:

- `/api/kimi-advisor`
- `/api/kimi-profile`

Build and deploy:

```bash
npm run build
npx wrangler deploy
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
