# Global Monument Atlas

A light-mode interactive atlas of built architectural monuments, chronological eras, statutory heritage registries, and conservation economics across every sovereign state and territory worldwide.

Kept in its own standalone repository (`Monument-Map-World`), separate from the India-focused [Monument-Map](https://github.com/shashwathsantosh/Monument-Map) repository, while preserving India's records within India's country shard.

## Dataset & Architecture
- **117,533 Built Sites** across **195 sovereign countries & 37 territories**, filtered to human-built monuments and structures.
- **PMTiles Vector Tiles (`public/data/monuments.pmtiles`):** Streams zoom-tiered monument vector tiles (`z0-z8`, auto-overzoomed to `z20`) over HTTP Byte-Range requests (`pmtiles` protocol in MapLibre GL JS).
- **Country Shards & Search Index (`public/data/countries/<ISO3>.json`, `public/data/search-top.json`):** Per-country metadata shards loaded on demand alongside lightweight global search autocomplete.
- **Public Registers & Heritage Budgets (`public/data/country-sources.json`, `public/data/global-funding.json`, `public/about.html`):** Tracks **322** public APIs & statutory registries and **209** published public heritage budgets with sortable country tables.
- **UNESCO World Heritage (`public/data/unesco-world.json`):** Built and mixed `whc001` catalog with inscription details and In Danger indicators.

## Rebuild Data & PMTiles
```bash
npm install
python3 scripts/build_global_data.py
python3 scripts/refocus_economic_built_v3.py
node scripts/build_pmtiles.mjs
```

## Run Locally (Byte-Range Server for PMTiles)
```bash
python3 scripts/serve.py --port 8766 --directory public
```
Open `http://127.0.0.1:8766`.
