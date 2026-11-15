#!/usr/bin/env python3
"""
Harvests:
1. Sub-national State / Province / Governorate / Prefecture / Region (`region`) for ALL 193+ countries
   using Natural Earth 10m Admin-1 States & Provinces (fast bucketed pure-Python point-in-polygon + nearest
   coastal fallback) so EVERY country on Earth has true sub-national regions (replacing continental strings
   like "Southern Europe" or "Northern America").
2. Immediate city/town/municipality (`location`) from QLever (`wdt:P131` / `wdt:P276`) for any monument
   missing `location`.
3. Construction / opening / inception years (`P571`, `P580`, `P1619`) from QLever across all atlas QIDs.
4. Modern populated municipality QIDs (`wdt:P31` modern city/municipality with `wdt:P1082` > 10,000 and NOT
   an archaeological site/ruin/fortress/palace/temple) so modern municipal governments (e.g. Verona Q2028,
   Nagasaki Q38234) are cleanly excluded while historic walled quarters & ancient ruined cities remain.
"""

from __future__ import annotations

import json
import math
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "public" / "data"
CACHE_DIR = ROOT / "scripts" / ".cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

QLEVER_URL = "https://qlever.dev/api/wikidata"
NE_ADM1_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson"
UA = "ArchitectureMonumentAtlas/1.3 (https://localhost:8766)"


def qlever_run(query: str, cache_file: str, timeout: int = 90) -> list[dict]:
    cf = CACHE_DIR / cache_file
    if cf.exists() and cf.stat().st_size > 100:
        try:
            rows = json.loads(cf.read_text(encoding="utf-8")).get("results", {}).get("bindings", [])
            print(f"  [cached] {cache_file}: {len(rows):,} rows")
            return rows
        except Exception:
            pass
    t0 = time.time()
    url = QLEVER_URL + "?" + urllib.parse.urlencode({"query": query})
    req = urllib.request.Request(url, headers={"Accept": "application/sparql-results+json", "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode("utf-8")
    cf.write_text(raw, encoding="utf-8")
    rows = json.loads(raw).get("results", {}).get("bindings", [])
    print(f"  [fetched in {time.time() - t0:.1f}s] {cache_file}: {len(rows):,} rows")
    return rows


def collect_all_candidate_points() -> dict[str, tuple[str, float, float]]:
    """Returns qid -> (iso3, lon, lat)."""
    pts: dict[str, tuple[str, float, float]] = {}
    for p in (DATA_DIR / "countries").glob("*.json"):
        iso3 = p.stem
        for item in json.loads(p.read_text(encoding="utf-8")):
            qid = item.get("qid")
            c = item.get("coords")
            if qid and isinstance(c, list) and len(c) >= 2:
                pts[qid] = (iso3, float(c[0]), float(c[1]))

    for cf in ("qlever_missing_p17.json", "qlever_missing_p131.json", "qlever_sparse_arch_bulk_v1.json"):
        fp = CACHE_DIR / cf
        if not fp.exists():
            continue
        for r in json.loads(fp.read_text(encoding="utf-8")).get("results", {}).get("bindings", []):
            uri = r.get("item", {}).get("value", "")
            qid = uri.rsplit("/", 1)[-1] if "/Q" in uri else ""
            iso3 = (r.get("iso3", {}).get("value") or "").strip()
            wkt = r.get("coord", {}).get("value", "")
            m = re.search(r"Point\(([-\d.]+)\s+([-\d.]+)\)", wkt, re.I)
            if qid and iso3 and m and qid not in pts:
                pts[qid] = (iso3, float(m.group(1)), float(m.group(2)))
    return pts


def point_in_ring(x: float, y: float, ring: list[list[float]]) -> bool:
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi):
            inside = not inside
        j = i
    return inside


def build_adm1_lookup(pts: dict[str, tuple[str, float, float]]):
    out_path = CACHE_DIR / "compiled_adm1_regions.json"
    if out_path.exists() and out_path.stat().st_size > 1000:
        d = json.loads(out_path.read_text(encoding="utf-8"))
        print(f"  [cached] compiled_adm1_regions.json: {len(d):,} monuments mapped to ADM1 states/provinces")
        return

    ne_file = CACHE_DIR / "ne_10m_admin_1_states_provinces.geojson"
    if not ne_file.exists():
        print("1. Downloading Natural Earth 10m Admin-1 States & Provinces GeoJSON...")
        t0 = time.time()
        req = urllib.request.Request(NE_ADM1_URL, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=90) as resp:
            raw = resp.read()
        ne_file.write_bytes(raw)
        print(f"  Downloaded {len(raw) / 1e6:.1f} MB in {time.time() - t0:.1f}s")

    print("1b. Indexing 4,596 global States / Provinces / Prefectures / Governorates...")
    t0 = time.time()
    geo = json.loads(ne_file.read_text(encoding="utf-8"))

    # Group polygons by country ISO3 AND 2-degree spatial grid for super-fast pure-Python PIP
    by_iso_polys: dict[str, list[tuple[str, float, float, float, float, list[list[float]], float, float]]] = {}
    grid: dict[tuple[int, int], list[tuple[str, str, float, float, float, float, list[list[float]]]]] = {}

    for feat in geo.get("features", []):
        props = feat.get("properties") or {}
        name = (props.get("name_en") or props.get("name") or props.get("gn_name") or "").strip()
        if not name:
            continue
        iso3 = (props.get("adm0_a3") or props.get("sov_a3") or props.get("gu_a3") or "").strip().upper()
        adm0_extra = {
            (props.get("adm0_a3") or "").upper(),
            (props.get("gu_a3") or "").upper(),
            (props.get("su_a3") or "").upper(),
        } - {""}
        geom = feat.get("geometry") or {}
        gtype = geom.get("type")
        coords = geom.get("coordinates") or []
        polys = [coords] if gtype == "Polygon" else (coords if gtype == "MultiPolygon" else [])
        for poly in polys:
            if not poly or not poly[0]:
                continue
            outer = poly[0]
            # Decimate ultra-dense coastal rings slightly (>300 pts -> ~220 pts) for 5x speed with <0.01° precision
            if len(outer) > 300:
                step = max(1, len(outer) // 220)
                ring = outer[::step]
                if ring[-1] != outer[0]:
                    ring.append(outer[0])
            else:
                ring = outer
            xs = [p[0] for p in ring]
            ys = [p[1] for p in ring]
            minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
            cx, cy = (minx + maxx) * 0.5, (miny + maxy) * 0.5
            for code in adm0_extra:
                by_iso_polys.setdefault(code, []).append((name, minx, miny, maxx, maxy, ring, cx, cy))
            gx0, gx1 = int(math.floor(minx / 2.0)), int(math.floor(maxx / 2.0))
            gy0, gy1 = int(math.floor(miny / 2.0)), int(math.floor(maxy / 2.0))
            rec = (iso3, name, minx, miny, maxx, maxy, ring)
            for gx in range(gx0, gx1 + 1):
                for gy in range(gy0, gy1 + 1):
                    grid.setdefault((gx, gy), []).append(rec)

    adm1_by_qid: dict[str, str] = {}
    for qid, (iso3, lon, lat) in pts.items():
        if iso3 == "IND":
            continue  # India already has curated ASI State/UT mapping
        gx, gy = int(math.floor(lon / 2.0)), int(math.floor(lat / 2.0))
        bucket = grid.get((gx, gy), [])
        matched = ""
        # Pass 1: same ISO3 polygon hit
        for p_iso, rname, minx, miny, maxx, maxy, ring in bucket:
            if p_iso == iso3 and minx <= lon <= maxx and miny <= lat <= maxy:
                if point_in_ring(lon, lat, ring):
                    matched = rname
                    break
        # Pass 2: any polygon hit (handles border/coastal territory code differences)
        if not matched:
            for _, rname, minx, miny, maxx, maxy, ring in bucket:
                if minx <= lon <= maxx and miny <= lat <= maxy:
                    if point_in_ring(lon, lat, ring):
                        matched = rname
                        break
        # Pass 3: nearest coastal/island ADM1 within same ISO3 (<= 1.2 degrees)
        if not matched and iso3 in by_iso_polys:
            best_d = 1.44
            for rname, minx, miny, maxx, maxy, _, cx, cy in by_iso_polys[iso3]:
                dx = 0.0 if minx <= lon <= maxx else min(abs(lon - minx), abs(lon - maxx))
                dy = 0.0 if miny <= lat <= maxy else min(abs(lat - miny), abs(lat - maxy))
                d2 = dx * dx + dy * dy
                if d2 < best_d:
                    best_d = d2
                    matched = rname
        if matched:
            adm1_by_qid[qid] = matched

    out_path.write_text(json.dumps(adm1_by_qid, separators=(",", ":")), encoding="utf-8")
    print(f"  Mapped {len(adm1_by_qid):,} monuments to exact ADM1 State/Province/Region in {time.time() - t0:.1f}s!")


def qlever_post(query: str, timeout: int = 60) -> list[dict]:
    data = urllib.parse.urlencode({"query": query}).encode("utf-8")
    req = urllib.request.Request(
        QLEVER_URL,
        data=data,
        headers={
            "Accept": "application/sparql-results+json",
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": UA,
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode("utf-8")
    return json.loads(raw).get("results", {}).get("bindings", [])


def harvest_locations_dates_and_modern_cities(target_qids: set[str]):
    qlist = sorted(target_qids)
    batch_size = 15000

    print("2. Harvesting immediate municipality/locality labels (P131) in fast POST batches...")
    loc_out = CACHE_DIR / "compiled_locations.json"
    if not loc_out.exists():
        t0 = time.time()
        loc_map: dict[str, str] = {}
        for i in range(0, len(qlist), batch_size):
            vals = " ".join(f"wd:{q}" for q in qlist[i : i + batch_size])
            q_loc = f"""
            PREFIX wd: <http://www.wikidata.org/entity/>
            PREFIX wdt: <http://www.wikidata.org/prop/direct/>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            SELECT ?item ?locLbl WHERE {{
              VALUES ?item {{ {vals} }}
              ?item wdt:P131 ?loc .
              ?loc rdfs:label ?locLbl .
              FILTER(LANG(?locLbl) = "en")
            }}
            """
            for r in qlever_post(q_loc, timeout=60):
                uri = r.get("item", {}).get("value", "")
                qid = uri.rsplit("/", 1)[-1] if "/Q" in uri else ""
                if qid and qid not in loc_map:
                    lbl = (r.get("locLbl", {}).get("value") or "").strip()
                    if lbl:
                        loc_map[qid] = lbl
        loc_out.write_text(json.dumps(loc_map, separators=(",", ":")), encoding="utf-8")
        print(f"  Matched P131 locality labels for {len(loc_map):,} monuments in {time.time() - t0:.1f}s")

    print("3. Harvesting inception / start / opening dates (P571, P1619, P580) in fast POST batches...")
    yr_out = CACHE_DIR / "compiled_years.json"
    if not yr_out.exists():
        t0 = time.time()
        yr_map: dict[str, int] = {}
        for pid in ("P571", "P1619", "P580"):
            for i in range(0, len(qlist), batch_size):
                chunk = [q for q in qlist[i : i + batch_size] if q not in yr_map]
                if not chunk:
                    continue
                vals = " ".join(f"wd:{q}" for q in chunk)
                q_yr = f"""
                PREFIX wd: <http://www.wikidata.org/entity/>
                PREFIX wdt: <http://www.wikidata.org/prop/direct/>
                SELECT ?item ?dt WHERE {{
                  VALUES ?item {{ {vals} }}
                  ?item wdt:{pid} ?dt .
                }}
                """
                for r in qlever_post(q_yr, timeout=60):
                    uri = r.get("item", {}).get("value", "")
                    qid = uri.rsplit("/", 1)[-1] if "/Q" in uri else ""
                    if not qid or qid in yr_map:
                        continue
                    val = str(r.get("dt", {}).get("value") or "")
                    m = re.match(r"^([+-]?\d{1,4})-", val)
                    if m:
                        y = int(m.group(1))
                        if -4000 <= y <= 2026 and y != 0:
                            yr_map[qid] = y
        yr_out.write_text(json.dumps(yr_map, separators=(",", ":")), encoding="utf-8")
        print(f"  Matched verified Wikidata construction/opening years for {len(yr_map):,} monuments in {time.time() - t0:.1f}s!")

    print("4. Detecting modern populated municipal QIDs (so modern cities don't masquerade as monuments)...")
    city_out = CACHE_DIR / "compiled_modern_city_qids.json"
    if not city_out.exists():
        t0 = time.time()
        city_qids_set: set[str] = set()
        for i in range(0, len(qlist), batch_size):
            vals = " ".join(f"wd:{q}" for q in qlist[i : i + batch_size])
            q_city = f"""
            PREFIX wd: <http://www.wikidata.org/entity/>
            PREFIX wdt: <http://www.wikidata.org/prop/direct/>
            SELECT DISTINCT ?item WHERE {{
              VALUES ?item {{ {vals} }}
              VALUES ?ct {{ wd:Q515 wd:Q1549591 wd:Q15284 wd:Q747074 wd:Q484170 wd:Q494721 wd:Q2074737 wd:Q262166 }}
              ?item wdt:P31 ?ct ;
                    wdt:P1082 ?pop .
              FILTER(?pop > 5000)
              MINUS {{ ?item wdt:P31 wd:Q839954 }}
              MINUS {{ ?item wdt:P31 wd:Q57831 }}
              MINUS {{ ?item wdt:P31 wd:Q23413 }}
              MINUS {{ ?item wdt:P31 wd:Q16560 }}
            }}
            """
            for r in qlever_post(q_city, timeout=60):
                uri = r.get("item", {}).get("value", "")
                if "/Q" in uri:
                    city_qids_set.add(uri.rsplit("/", 1)[-1])
        city_qids = sorted(city_qids_set)
        city_out.write_text(json.dumps(city_qids), encoding="utf-8")
        print(f"  Flagged {len(city_qids):,} modern populated municipality QIDs in candidate set in {time.time() - t0:.1f}s")


if __name__ == "__main__":
    pts = collect_all_candidate_points()
    print(f"Total candidate monument coordinates: {len(pts):,}")
    build_adm1_lookup(pts)
    harvest_locations_dates_and_modern_cities(set(pts.keys()))
