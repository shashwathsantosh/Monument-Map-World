# Monument Map Atlas — Global Edition

A global, light-mode interactive monument and heritage conservation atlas powered by **PMTiles** vector tiles, country-sharded metadata, and live Wikidata / Wikipedia / UNESCO enrichment across every country in the world.

Kept intentionally separate from the India-focused [Monument-Map](https://github.com/shashwathsantosh/Monument-Map) repository while preserving all 4,408 India ASI/PRASHAD records inside India's country dataset.

## Architecture (Long-Term Global Scale)
- **PMTiles Vector Tiles (`public/data/monuments.pmtiles`):** Streams zoom-tiered heritage vector tiles (`z0–z10`, auto-overzoomed to `z20`) over HTTP Byte-Range requests (`pmtiles` protocol in MapLibre GL JS). Works on GitHub Pages today and scales seamlessly to millions of points on Cloudflare R2/S3 by changing `PMTILES_URL` in `public/app.js`.
- **UNESCO World Heritage (`public/data/unesco-world.json`):** Full official `whc001` catalog (inscribed year, criteria, justification, area, category, and In Danger conservation alerts).
- **Country Shards (`public/data/countries/<ISO3>.json`):** Per-country monument datasets loaded on demand when filtering/browsing a country, keeping startup payload tiny while supporting national detail (including all 4,408 India sites + ASI Circle & PRASHAD overlays).

## Rebuild Global Data & PMTiles
```bash
npm install
python3 scripts/build_global_data.py --min-sitelinks 3
node scripts/build_pmtiles.mjs
```

## Run Locally (Byte-Range Server for PMTiles)
```bash
python3 scripts/serve.py --port 8766 --directory public
```
Open `http://127.0.0.1:8766`.
