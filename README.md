# Architecture Monument Atlas

A global, light-mode interactive architectural monument, chronology, and conservation atlas powered by **PMTiles** vector tiles, country-sharded metadata, and live Wikidata / Wikipedia / UNESCO enrichment across every country in the world.

Kept intentionally separate from the India-focused [Monument-Map](https://github.com/shashwathsantosh/Monument-Map) repository while preserving all India ASI/PRASHAD records inside India's country dataset.

## Architecture (Long-Term Global Scale)
- **PMTiles Vector Tiles (`public/data/monuments.pmtiles`):** Streams zoom-tiered architectural monument vector tiles (`z0–z8`, auto-overzoomed to `z20`) over HTTP Byte-Range requests (`pmtiles` protocol in MapLibre GL JS). Works on GitHub Pages today and scales seamlessly to millions of points on Cloudflare R2/S3 by changing `PMTILES_URL` in `public/app.js`.
- **Global Chronological Timeline:** Filter architectural structures worldwide across Ancient (`< 500 CE`), Medieval (`500–1499`), Early Modern (`1500–1799`), and Modern (`1800+`) eras directly on the vector map.
- **UNESCO World Heritage (`public/data/unesco-world.json`):** Full built & mixed `whc001` catalog (inscribed year, criteria, justification, area, category, and In Danger conservation alerts).
- **Contested Territories & Country Shards (`public/data/contested-areas.geojson`, `public/data/countries/<ISO3>.json`):** Highlights disputed territories and loads per-country architectural records on demand.

## Rebuild Global Data & PMTiles
```bash
npm install
python3 scripts/build_global_data.py
node scripts/build_pmtiles.mjs
```

## Run Locally (Byte-Range Server for PMTiles)
```bash
python3 scripts/serve.py --port 8766 --directory public
```
Open `http://127.0.0.1:8766`.
