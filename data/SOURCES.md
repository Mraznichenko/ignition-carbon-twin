# Data Sources

Raw downloaded datasets are kept outside Git in `raw-data/`. App-ready extracts live in `data/`.

## Food Impacts

- AGRIBALYSE 3.2, ADEME
- Raw files: `raw-data/agribalyse/*.xlsx`
- Used for food emissions and later category-level CO2e mappings.

## Product Metadata

- Open Food Facts product database
- Raw files: `raw-data/openfood/*.parquet`
- App extract: `data/product_index.json`
- Build command: `npm run build:product-index`

## Local MVP Tables

- `food_seasonality_ch.json`: curated Swiss seasonal produce table.
- `travel_routes.json`: curated route factors for demo routes.
- `local_actions_ch.json`: curated local action recommendations.
- `regional_averages.json`: simplified regional per-capita comparison values.
