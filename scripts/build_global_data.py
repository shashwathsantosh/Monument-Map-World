#!/usr/bin/env python3
"""
Build verified global monument, UNESCO World Heritage, country boundary,
and country-sharded search datasets for Monument Map Atlas (World Edition).

Preserves all 4,408 India ASI/PRASHAD/Adopt-a-Heritage records intact from
../Maproject/public/data/ and expands coverage across every country on Earth
using UNESCO DataHub (whc001), Natural Earth 50m countries, and QLever/Wikidata.
"""

import argparse
import json
import math
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "public" / "data"
COUNTRIES_DIR = DATA_DIR / "countries"
CACHE_DIR = ROOT / "scripts" / ".cache"
INDIA_REPO_DATA = ROOT.parent / "Maproject" / "public" / "data"

DATA_DIR.mkdir(parents=True, exist_ok=True)
COUNTRIES_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)

UA = "MonumentMapAtlasWorld/1.0 (https://github.com/shashwathsantosh/Monument-Map-World)"
QLEVER_URL = "https://qlever.cs.uni-freiburg.de/api/wikidata"
WD_API_URL = "https://www.wikidata.org/w/api.php"
UNESCO_BASE = "https://data.unesco.org/api/explore/v2.1/catalog/datasets/whc001/records"
NE_50M_COUNTRIES_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/"
    "ne_50m_admin_0_countries.geojson"
)

COMMONS_IMG_RE = re.compile(r"/Special:FilePath/([^?]+)")

# Normalize constituent / historical Wikidata country QIDs to ISO-3166 alpha-3
COUNTRY_QID_ISO_OVERRIDES = {
    "Q21": "GBR",   # England
    "Q22": "GBR",   # Scotland
    "Q25": "GBR",   # Wales
    "Q26": "GBR",   # Northern Ireland
    "Q756617": "DNK",  # Kingdom of Denmark
    "Q29999": "NLD",   # Kingdom of the Netherlands
    "Q15180": "RUS",   # Soviet Union (resolved geographically below if needed)
    "Q83286": "SRB",   # Yugoslavia
    "Q33946": "CZE",   # Czechoslovakia
}

GLOBAL_SITE_TYPE_KEYWORDS = [
    ("Castle / Fort", ["castle", "fort", "fortress", "citadel", "château", "chateau", "burg", "alcazar", "kasbah", "qila"]),
    ("Palace / Residence", ["palace", "palazzo", "palais", "villa", "manor", "haveli", "mahal", "schloss", "mansion"]),
    ("Temple / Sanctuary", ["temple", "shrine", "pagoda", "stupa", "wat", "mandir", "gopura", "sanctuary"]),
    ("Church / Cathedral", ["church", "cathedral", "abbey", "monastery", "basilica", "chapel", "priory", "convent", "kirke"]),
    ("Mosque / Madrasa", ["mosque", "masjid", "minaret", "madrasa", "jami"]),
    ("Archaeological Site", ["archaeological", "ruins", "roman", "ancient", "megalith", "pyramid", "necropolis", "acropolis", "amphitheatre", "tumulus"]),
    ("Tomb / Mausoleum", ["tomb", "mausoleum", "dargah", "cemetery", "memorial", "cenotaph"]),
    ("Civic / Bridge / Tower", ["bridge", "tower", "gate", "arch", "lighthouse", "aqueduct", "town hall", "station", "theater", "theatre", "opera", "museum"]),
    ("Historic District", ["old town", "historic centre", "historic center", "quarter", "medina", "plaza", "square"]),
]


def http_get_json(url: str, headers: dict | None = None, timeout: int = 45, cache_path: Path | None = None):
    if cache_path and cache_path.exists():
        return json.loads(cache_path.read_text(encoding="utf-8"))
    req_headers = {"User-Agent": UA}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, headers=req_headers)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                raw = resp.read().decode("utf-8")
                data = json.loads(raw)
                if cache_path:
                    cache_path.write_text(raw, encoding="utf-8")
                return data
        except Exception as exc:
            if attempt == 2:
                raise
            print(f"  retry {attempt + 1} for {url[:80]}... ({exc})")
            time.sleep(1.5 * (attempt + 1))


def qlever_query(query: str, cache_name: str | None = None, timeout: int = 60) -> list[dict]:
    cache_path = (CACHE_DIR / f"{cache_name}.json") if cache_name else None
    url = f"{QLEVER_URL}?query={urllib.parse.quote(query)}"
    data = http_get_json(
        url,
        headers={"Accept": "application/sparql-results+json"},
        timeout=timeout,
        cache_path=cache_path,
    )
    return data.get("results", {}).get("bindings", [])


def parse_wkt_point(wkt: str | None):
    if not wkt:
        return None
    m = re.search(r"Point\(([-\d\.eE]+)\s+([-\d\.eE]+)\)", wkt, re.I)
    if not m:
        return None
    lon, lat = float(m.group(1)), float(m.group(2))
    if not (-180.0 <= lon <= 180.0 and -90.0 <= lat <= 90.0):
        return None
    if abs(lon) < 1e-6 and abs(lat) < 1e-6:
        return None
    return [round(lon, 5), round(lat, 5)]


def qid_from_uri(uri: str | None) -> str:
    if not uri:
        return ""
    return uri.rsplit("/", 1)[-1]


def normalize_commons_url(url: str | None) -> str:
    if not url:
        return ""
    url = url.strip()
    if url.startswith("http://"):
        url = "https://" + url[7:]
    if "Special:FilePath" in url and "width=" not in url:
        sep = "&" if "?" in url else "?"
        return f"{url}{sep}width=720"
    if "upload.wikimedia.org" in url:
        return url
    return url


def infer_site_type(name: str, desc: str = "", unesco_cat: str = "") -> str:
    hay = f"{name} {desc}".lower()
    for label, kws in GLOBAL_SITE_TYPE_KEYWORDS:
        if any(kw in hay for kw in kws):
            return label
    if unesco_cat == "Natural":
        return "Natural Heritage"
    if unesco_cat == "Mixed":
        return "Mixed Heritage"
    return "Heritage Monument"


def simplify_ring(ring: list, step_deg: float = 0.04, max_pts: int = 120) -> list:
    if len(ring) <= 8:
        return [[round(pt[0], 3), round(pt[1], 3)] for pt in ring]
    out = [ring[0]]
    lx, ly = ring[0][0], ring[0][1]
    min_d2 = step_deg * step_deg
    for pt in ring[1:-1]:
        dx, dy = pt[0] - lx, pt[1] - ly
        if dx * dx + dy * dy >= min_d2:
            out.append(pt)
            lx, ly = pt[0], pt[1]
    out.append(ring[-1])
    if len(out) > max_pts:
        stride = max(1, len(out) // max_pts)
        trimmed = out[::stride]
        if trimmed[-1] != out[-1]:
            trimmed.append(out[-1])
        out = trimmed
    if len(out) < 4:
        return [[round(pt[0], 3), round(pt[1], 3)] for pt in ring[:4]]
    return [[round(pt[0], 3), round(pt[1], 3)] for pt in out]


def ring_bbox(ring: list):
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    return (min(xs), min(ys), max(xs), max(ys))


def point_in_ring(lon: float, lat: float, ring: list) -> bool:
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if ((yi > lat) != (yj > lat)) and (lon < (xj - xi) * (lat - yi) / ((yj - yi) or 1e-12) + xi):
            inside = not inside
        j = i
    return inside


def build_countries():
    print("1. Fetching Natural Earth 50m countries...")
    raw = http_get_json(NE_50M_COUNTRIES_URL, cache_path=CACHE_DIR / "ne_50m_countries.json")
    features = []
    country_meta = {}
    polys_for_pip = []

    for f in raw.get("features", []):
        props = f.get("properties", {})
        iso3 = props.get("ISO_A3_EH") or props.get("ISO_A3") or props.get("ADM0_A3") or ""
        if iso3 in ("-99", ""):
            iso3 = props.get("ADM0_A3") or props.get("SOV_A3") or ""
        if not iso3 or iso3 in ("ATA",):
            continue
        name = props.get("NAME_LONG") or props.get("ADMIN") or props.get("NAME") or iso3
        if iso3 == "SOL":
            name = "Somaliland"
        iso2 = props.get("ISO_A2_EH") or props.get("ISO_A2") or ""
        if iso2 == "-99":
            iso2 = ""
        continent = props.get("CONTINENT") or ""
        subregion = props.get("SUBREGION") or ""
        geom = f.get("geometry") or {}
        gtype = geom.get("type")
        coords = geom.get("coordinates") or []

        simp_geom = None
        bboxes = []
        raw_rings = []
        if gtype == "Polygon" and coords:
            ext = simplify_ring(coords[0], 0.04, 140)
            simp_geom = {"type": "Polygon", "coordinates": [ext]}
            bboxes.append(ring_bbox(ext))
            raw_rings.append(ext)
        elif gtype == "MultiPolygon" and coords:
            kept = []
            for poly in coords:
                if not poly:
                    continue
                ext = simplify_ring(poly[0], 0.05, 110)
                if len(ext) >= 4:
                    kept.append([ext])
                    bboxes.append(ring_bbox(ext))
                    raw_rings.append(ext)
            if kept:
                simp_geom = {"type": "MultiPolygon", "coordinates": kept}

        if not simp_geom or not bboxes:
            continue

        all_x = [b[0] for b in bboxes] + [b[2] for b in bboxes]
        all_y = [b[1] for b in bboxes] + [b[3] for b in bboxes]
        cx = round((min(all_x) + max(all_x)) / 2, 4)
        cy = round((min(all_y) + max(all_y)) / 2, 4)
        bbox = [round(min(all_x), 3), round(min(all_y), 3), round(max(all_x), 3), round(max(all_y), 3)]

        # Special clean label center for large wrap/multipolygon nations
        label_lon = props.get("LABEL_X") or cx
        label_lat = props.get("LABEL_Y") or cy

        if iso3 not in country_meta:
            country_meta[iso3] = {
                "iso3": iso3,
                "iso2": iso2,
                "name": props.get("NAME") or name,
                "nameLong": name,
                "continent": continent,
                "subregion": subregion,
                "bbox": bbox,
                "center": [round(float(label_lon), 4), round(float(label_lat), 4)],
            }
        features.append({
            "type": "Feature",
            "geometry": simp_geom,
            "properties": {
                "iso3": iso3,
                "iso2": iso2,
                "name": props.get("NAME") or name,
                "continent": continent,
            },
        })
        polys_for_pip.append((iso3, bbox, raw_rings))

    # Overlay Survey of India official border polygon for India if present in Maproject
    india_border_src = INDIA_REPO_DATA / "india-border.geojson"
    if india_border_src.exists():
        ib = json.loads(india_border_src.read_text(encoding="utf-8"))
        # Replace IND feature geometry cleanly if SOI is Polygon/MultiPolygon
        if ib.get("features"):
            ind_geoms = []
            for bf in ib["features"]:
                bg = bf.get("geometry") or {}
                if bg.get("type") == "Polygon":
                    ind_geoms.append([simplify_ring(bg["coordinates"][0], 0.03, 180)])
                elif bg.get("type") == "MultiPolygon":
                    for p in bg["coordinates"]:
                        ind_geoms.append([simplify_ring(p[0], 0.03, 140)])
            if ind_geoms:
                features = [feat for feat in features if feat["properties"]["iso3"] != "IND"]
                features.append({
                    "type": "Feature",
                    "geometry": {"type": "MultiPolygon", "coordinates": ind_geoms},
                    "properties": {"iso3": "IND", "iso2": "IN", "name": "India", "continent": "Asia"},
                })
                if "IND" in country_meta:
                    country_meta["IND"]["bbox"] = [68.1, 6.7, 97.4, 37.1]
                    country_meta["IND"]["center"] = [78.96, 21.5]

    out_geo = {"type": "FeatureCollection", "features": features}
    (DATA_DIR / "world-countries.geojson").write_text(json.dumps(out_geo, separators=(",", ":")), encoding="utf-8")
    print(f"  Countries written: {len(country_meta)} ({len(features)} features)")
    return country_meta, polys_for_pip


def resolve_country_pip(lon: float, lat: float, polys_for_pip: list) -> str:
    for iso3, bbox, rings in polys_for_pip:
        if bbox[0] <= lon <= bbox[2] and bbox[1] <= lat <= bbox[3]:
            for ring in rings:
                if point_in_ring(lon, lat, ring):
                    return iso3
    return ""


def fetch_country_qid_map(country_meta: dict):
    print("2. Fetching Wikidata country QID -> ISO mapping...")
    q = """
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT ?c ?iso2 ?iso3 ?label WHERE {
      ?c wdt:P298 ?iso3 .
      OPTIONAL { ?c wdt:P297 ?iso2 . }
      OPTIONAL { ?c rdfs:label ?label . FILTER(LANG(?label) = "en") }
    }
    """
    rows = qlever_query(q, cache_name="country_qids")
    qid_to_iso3 = dict(COUNTRY_QID_ISO_OVERRIDES)
    iso3_to_qids = {}
    for r in rows:
        qid = qid_from_uri(r.get("c", {}).get("value"))
        iso3 = (r.get("iso3", {}).get("value") or "").upper()
        if qid and iso3:
            qid_to_iso3[qid] = iso3
            iso3_to_qids.setdefault(iso3, []).append(qid)
    # Also match exact names for any country missing P298
    q2 = """
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    PREFIX wd: <http://www.wikidata.org/entity/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT ?c ?label WHERE {
      ?c wdt:P31 wd:Q3624078 .
      ?c rdfs:label ?label . FILTER(LANG(?label) = "en")
    }
    """
    name_to_iso3 = {}
    for iso3, meta in country_meta.items():
        name_to_iso3[meta["name"].lower()] = iso3
        name_to_iso3[meta["nameLong"].lower()] = iso3
    for r in qlever_query(q2, cache_name="sovereign_qids"):
        qid = qid_from_uri(r.get("c", {}).get("value"))
        lbl = (r.get("label", {}).get("value") or "").lower()
        if qid and lbl in name_to_iso3 and qid not in qid_to_iso3:
            iso3 = name_to_iso3[lbl]
            qid_to_iso3[qid] = iso3
            iso3_to_qids.setdefault(iso3, []).append(qid)
    print(f"  Mapped {len(qid_to_iso3)} Wikidata country QIDs covering {len(iso3_to_qids)} ISO3 codes")
    return qid_to_iso3, iso3_to_qids


def fetch_all_unesco(country_meta: dict, polys_for_pip: list):
    print("3. Fetching ALL global UNESCO World Heritage records (whc001)...")
    cache_file = CACHE_DIR / "unesco_whc001_all.json"
    if cache_file.exists():
        all_rows = json.loads(cache_file.read_text(encoding="utf-8"))
    else:
        all_rows = []
        offset = 0
        limit = 100
        total = None
        while total is None or offset < total:
            url = f"{UNESCO_BASE}?limit={limit}&offset={offset}"
            page = http_get_json(url, timeout=30)
            if total is None:
                total = page.get("total_count", 0)
            batch = page.get("results", [])
            if not batch:
                break
            all_rows.extend(batch)
            offset += len(batch)
            time.sleep(0.15)
        cache_file.write_text(json.dumps(all_rows), encoding="utf-8")

    iso2_to_iso3 = {m["iso2"].upper(): iso3 for iso3, m in country_meta.items() if m.get("iso2")}
    unesco_records = {}
    for rec in all_rows:
        id_no = str(rec.get("id_no") or "").strip()
        if not id_no:
            continue
        coords_obj = rec.get("coordinates") or {}
        lon = coords_obj.get("lon")
        lat = coords_obj.get("lat")
        coords = [round(float(lon), 5), round(float(lat), 5)] if lon is not None and lat is not None else None
        iso_codes_raw = rec.get("iso_code") or rec.get("iso_codes") or ""
        if isinstance(iso_codes_raw, list):
            iso2_list = [str(x).strip().upper() for x in iso_codes_raw if x]
        else:
            iso2_list = [x.strip().upper() for x in str(iso_codes_raw).split(",") if x.strip()]
        iso3_list = [iso2_to_iso3[i2] for i2 in iso2_list if i2 in iso2_to_iso3]
        if not iso3_list and coords:
            pip_iso = resolve_country_pip(coords[0], coords[1], polys_for_pip)
            if pip_iso:
                iso3_list = [pip_iso]
        states_names = rec.get("states_names") or []
        if isinstance(states_names, list):
            states_str = ", ".join(str(x) for x in states_names if x)
        else:
            states_str = str(states_names)

        danger_flag = bool(rec.get("danger") and str(rec.get("danger")).lower() not in ("false", "0", "no", ""))
        unesco_records[id_no] = {
            "id": id_no,
            "name": rec.get("name_en") or "",
            "shortDesc": rec.get("short_description_en") or "",
            "justification": rec.get("justification_en") or "",
            "year": str(rec.get("date_inscribed") or "")[:4],
            "category": rec.get("category") or "",
            "criteria": rec.get("criteria_txt") or "",
            "danger": danger_flag,
            "region": rec.get("region_en") or "",
            "countries": states_str,
            "iso3List": iso3_list,
            "areaHa": rec.get("area_hectares"),
            "coords": coords,
        }
    (DATA_DIR / "unesco-world.json").write_text(json.dumps(unesco_records, separators=(",", ":")), encoding="utf-8")
    print(f"  UNESCO records saved: {len(unesco_records)}")
    return unesco_records


def fetch_global_wikidata_bands(min_sitelinks: int = 3):
    print(f"4. Querying QLever global heritage items (min_sitelinks={min_sitelinks})...")
    # Query UNESCO Q9259 specifically + sitelink tiers so queries never overwhelm endpoint
    bands = [
        ("wd_unesco", """
            PREFIX wdt: <http://www.wikidata.org/prop/direct/>
            PREFIX wd: <http://www.wikidata.org/entity/>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX wikibase: <http://wikiba.se/ontology#>
            PREFIX schema: <http://schema.org/>
            SELECT ?item ?label ?coord ?sl ?country ?image ?article ?inception ?unescoId WHERE {
              ?item wdt:P1435 wd:Q9259 ; wdt:P625 ?coord .
              OPTIONAL { ?item wikibase:sitelinks ?sl . }
              OPTIONAL { ?item wdt:P17 ?country . }
              OPTIONAL { ?item wdt:P18 ?image . }
              OPTIONAL { ?item wdt:P571 ?inception . }
              OPTIONAL { ?item wdt:P757 ?unescoId . }
              OPTIONAL { ?item rdfs:label ?label . FILTER(LANG(?label) = "en") }
              OPTIONAL { ?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }
            }
        """),
        ("sl_25_plus", """
            PREFIX wdt: <http://www.wikidata.org/prop/direct/>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX wikibase: <http://wikiba.se/ontology#>
            PREFIX schema: <http://schema.org/>
            SELECT ?item ?label ?coord ?sl ?country ?image ?article ?inception ?heritageLabel WHERE {
              ?item wdt:P1435 ?h ; wdt:P625 ?coord ; wikibase:sitelinks ?sl .
              FILTER(?sl >= 25)
              OPTIONAL { ?item wdt:P17 ?country . }
              OPTIONAL { ?item wdt:P18 ?image . }
              OPTIONAL { ?item wdt:P571 ?inception . }
              OPTIONAL { ?item rdfs:label ?label . FILTER(LANG(?label) = "en") }
              OPTIONAL { ?h rdfs:label ?heritageLabel . FILTER(LANG(?heritageLabel) = "en") }
              OPTIONAL { ?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }
            }
        """),
        ("sl_10_24", """
            PREFIX wdt: <http://www.wikidata.org/prop/direct/>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX wikibase: <http://wikiba.se/ontology#>
            PREFIX schema: <http://schema.org/>
            SELECT ?item ?label ?coord ?sl ?country ?image ?article ?inception ?heritageLabel WHERE {
              ?item wdt:P1435 ?h ; wdt:P625 ?coord ; wikibase:sitelinks ?sl .
              FILTER(?sl >= 10 && ?sl < 25)
              OPTIONAL { ?item wdt:P17 ?country . }
              OPTIONAL { ?item wdt:P18 ?image . }
              OPTIONAL { ?item wdt:P571 ?inception . }
              OPTIONAL { ?item rdfs:label ?label . FILTER(LANG(?label) = "en") }
              OPTIONAL { ?h rdfs:label ?heritageLabel . FILTER(LANG(?heritageLabel) = "en") }
              OPTIONAL { ?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }
            }
        """),
        ("sl_5_9", """
            PREFIX wdt: <http://www.wikidata.org/prop/direct/>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX wikibase: <http://wikiba.se/ontology#>
            PREFIX schema: <http://schema.org/>
            SELECT ?item ?label ?coord ?sl ?country ?image ?article ?inception WHERE {
              ?item wdt:P1435 ?h ; wdt:P625 ?coord ; wikibase:sitelinks ?sl .
              FILTER(?sl >= 5 && ?sl < 10)
              OPTIONAL { ?item wdt:P17 ?country . }
              OPTIONAL { ?item wdt:P18 ?image . }
              OPTIONAL { ?item wdt:P571 ?inception . }
              OPTIONAL { ?item rdfs:label ?label . FILTER(LANG(?label) = "en") }
              OPTIONAL { ?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }
            }
        """),
    ]
    if min_sitelinks <= 3:
        bands.append(("sl_3_4", """
            PREFIX wdt: <http://www.wikidata.org/prop/direct/>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX wikibase: <http://wikiba.se/ontology#>
            PREFIX schema: <http://schema.org/>
            SELECT ?item ?label ?coord ?sl ?country ?image ?article WHERE {
              ?item wdt:P1435 ?h ; wdt:P625 ?coord ; wikibase:sitelinks ?sl .
              FILTER(?sl >= 3 && ?sl < 5)
              OPTIONAL { ?item wdt:P17 ?country . }
              OPTIONAL { ?item wdt:P18 ?image . }
              OPTIONAL { ?item rdfs:label ?label . FILTER(LANG(?label) = "en") }
              OPTIONAL { ?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }
            }
        """))
    if min_sitelinks <= 1:
        bands.append(("sl_1_2", """
            PREFIX wdt: <http://www.wikidata.org/prop/direct/>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX wikibase: <http://wikiba.se/ontology#>
            SELECT ?item ?label ?coord ?sl ?country ?image WHERE {
              ?item wdt:P1435 ?h ; wdt:P625 ?coord ; wikibase:sitelinks ?sl .
              FILTER(?sl >= 1 && ?sl < 3)
              OPTIONAL { ?item wdt:P17 ?country . }
              OPTIONAL { ?item wdt:P18 ?image . }
              OPTIONAL { ?item rdfs:label ?label . FILTER(LANG(?label) = "en") }
            }
            LIMIT 120000
        """))

    all_bindings = []
    for name, q in bands:
        t0 = time.time()
        rows = qlever_query(q, cache_name=f"band_{name}", timeout=90)
        print(f"  Band {name}: {len(rows)} rows in {time.time() - t0:.2f}s")
        all_bindings.extend([(name, r) for r in rows])
    return all_bindings


def backfill_underrepresented_countries(sites_by_qid: dict, country_meta: dict, iso3_to_qids: dict, min_per_country: int = 12):
    counts = {}
    for s in sites_by_qid.values():
        c = s.get("countryIso", "")
        if c:
            counts[c] = counts.get(c, 0) + 1
    missing = [iso3 for iso3 in sorted(country_meta.keys()) if counts.get(iso3, 0) < min_per_country]
    print(f"5. Backfilling {len(missing)} countries with < {min_per_country} monuments...")
    added = 0
    for iso3 in missing:
        qids = iso3_to_qids.get(iso3, [])
        if not qids:
            continue
        cqid = qids[0]
        q = f"""
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX wikibase: <http://wikiba.se/ontology#>
        PREFIX schema: <http://schema.org/>
        SELECT ?item ?label ?coord ?sl ?image ?article ?inception WHERE {{
          ?item wdt:P17 wd:{cqid} ; wdt:P625 ?coord .
          {{ ?item wdt:P1435 ?h . }}
          UNION {{ ?item wdt:P31 wd:Q4989906 . }}
          UNION {{ ?item wdt:P31 wd:Q839954 . }}
          UNION {{ ?item wdt:P31 wd:Q570116 . }}
          UNION {{ ?item wdt:P31 wd:Q23413 . }}
          UNION {{ ?item wdt:P31 wd:Q44539 . }}
          UNION {{ ?item wdt:P31 wd:Q16560 . }}
          OPTIONAL {{ ?item wikibase:sitelinks ?sl . }}
          OPTIONAL {{ ?item wdt:P18 ?image . }}
          OPTIONAL {{ ?item wdt:P571 ?inception . }}
          OPTIONAL {{ ?item rdfs:label ?label . FILTER(LANG(?label) = "en") }}
          OPTIONAL {{ ?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }}
        }}
        ORDER BY DESC(?sl)
        LIMIT 60
        """
        try:
            rows = qlever_query(q, cache_name=f"country_{iso3}", timeout=25)
        except Exception as exc:
            print(f"  Backfill skip {iso3}: {exc}")
            continue
        for r in rows:
            qid = qid_from_uri(r.get("item", {}).get("value"))
            if not qid or qid in sites_by_qid:
                continue
            coords = parse_wkt_point(r.get("coord", {}).get("value"))
            if not coords:
                continue
            label = (r.get("label", {}).get("value") or "").strip()
            if not label:
                continue
            sl = int(r.get("sl", {}).get("value") or 0)
            img = normalize_commons_url(r.get("image", {}).get("value"))
            wp = r.get("article", {}).get("value") or ""
            wp_title = urllib.parse.unquote(wp.rsplit("/wiki/", 1)[-1]).replace("_", " ") if "/wiki/" in wp else ""
            inc = (r.get("inception", {}).get("value") or "")[:4]
            yr = int(inc) if re.match(r"^-?\d{1,4}$", inc) else None
            sites_by_qid[qid] = {
                "qid": qid,
                "name": label,
                "coords": coords,
                "countryIso": iso3,
                "country": country_meta[iso3]["name"],
                "region": country_meta[iso3].get("subregion") or country_meta[iso3].get("continent") or "",
                "siteType": infer_site_type(label),
                "year": yr,
                "style": "",
                "desc": "",
                "image": img,
                "wikipedia": wp_title,
                "unesco": "",
                "unescoId": "",
                "unescoYear": "",
                "unescoDanger": False,
                "heritageDesignation": "National Landmark / Heritage",
                "sitelinks": sl,
                "hasFunding": False,
                "underfunded": False,
                "inRestoration": False,
            }
            added += 1
        time.sleep(0.05)
    print(f"  Backfill added {added} monuments across smaller countries")


def hydrate_missing_labels(sites_by_qid: dict):
    missing = [q for q, s in sites_by_qid.items() if not s.get("name")]
    if not missing:
        return
    print(f"6. Hydrating {len(missing)} items missing English labels via Wikidata wbgetentities (capped at 5000 top sitelinks)...")
    missing.sort(key=lambda q: sites_by_qid[q].get("sitelinks", 0), reverse=True)
    missing = missing[:5000]
    cache_path = CACHE_DIR / "hydrated_labels.json"
    cached = json.loads(cache_path.read_text(encoding="utf-8")) if cache_path.exists() else {}
    to_fetch = [q for q in missing if q not in cached]
    for i in range(0, len(to_fetch), 50):
        chunk = to_fetch[i:i + 50]
        url = (
            f"{WD_API_URL}?action=wbgetentities&ids={'|'.join(chunk)}"
            "&props=labels|descriptions&languages=en|fr|es|de|pt|it|ar|ru|zh|ja&format=json"
        )
        try:
            data = http_get_json(url, timeout=20)
            for q, ent in data.get("entities", {}).items():
                labels = ent.get("labels", {})
                descs = ent.get("descriptions", {})
                lbl = ""
                for lang in ("en", "fr", "es", "de", "pt", "it", "ar", "ru", "zh", "ja"):
                    if lang in labels:
                        lbl = labels[lang].get("value", "")
                        break
                if not lbl and labels:
                    lbl = next(iter(labels.values())).get("value", "")
                desc = descs.get("en", {}).get("value", "")
                cached[q] = {"label": lbl, "desc": desc}
        except Exception:
            pass
        time.sleep(0.08)
    cache_path.write_text(json.dumps(cached), encoding="utf-8")
    for q, info in cached.items():
        if q in sites_by_qid and not sites_by_qid[q].get("name") and info.get("label"):
            sites_by_qid[q]["name"] = info["label"]
            if not sites_by_qid[q].get("desc") and info.get("desc"):
                sites_by_qid[q]["desc"] = info["desc"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--min-sitelinks", type=int, default=3, help="Wikidata P1435 minimum sitelinks (3=~110k sites, 5=~43k sites, 1=~750k sites)")
    args = parser.parse_args()

    country_meta, polys_for_pip = build_countries()
    qid_to_iso3, iso3_to_qids = fetch_country_qid_map(country_meta)
    unesco_records = fetch_all_unesco(country_meta, polys_for_pip)
    raw_bindings = fetch_global_wikidata_bands(args.min_sitelinks)

    sites_by_qid = {}
    for band_name, r in raw_bindings:
        qid = qid_from_uri(r.get("item", {}).get("value"))
        if not qid:
            continue
        coords = parse_wkt_point(r.get("coord", {}).get("value"))
        if not coords:
            continue
        cqid = qid_from_uri(r.get("country", {}).get("value"))
        iso3 = qid_to_iso3.get(cqid, "")
        if not iso3 or iso3 not in country_meta:
            iso3 = resolve_country_pip(coords[0], coords[1], polys_for_pip)
        if not iso3 or iso3 not in country_meta:
            continue

        sl = int(r.get("sl", {}).get("value") or 0)
        label = (r.get("label", {}).get("value") or "").strip()
        img = normalize_commons_url(r.get("image", {}).get("value"))
        wp = r.get("article", {}).get("value") or ""
        wp_title = urllib.parse.unquote(wp.rsplit("/wiki/", 1)[-1]).replace("_", " ") if "/wiki/" in wp else ""
        inc = (r.get("inception", {}).get("value") or "")[:4]
        yr = int(inc) if re.match(r"^-?\d{1,4}$", inc) else None
        unesco_id = str(r.get("unescoId", {}).get("value") or "").strip()
        heritage_label = (r.get("heritageLabel", {}).get("value") or "").strip()

        existing = sites_by_qid.get(qid)
        if not existing:
            sites_by_qid[qid] = {
                "qid": qid,
                "name": label,
                "coords": coords,
                "countryIso": iso3,
                "country": country_meta[iso3]["name"],
                "region": country_meta[iso3].get("subregion") or "",
                "siteType": infer_site_type(label),
                "year": yr,
                "style": "",
                "desc": "",
                "image": img,
                "wikipedia": wp_title,
                "unesco": "",
                "unescoId": unesco_id,
                "unescoYear": "",
                "unescoDanger": False,
                "heritageDesignation": heritage_label or ("UNESCO World Heritage Site" if band_name == "wd_unesco" else "National Heritage Designation"),
                "sitelinks": sl,
                "hasFunding": False,
                "underfunded": False,
                "inRestoration": False,
            }
        else:
            if label and not existing["name"]:
                existing["name"] = label
            if img and not existing["image"]:
                existing["image"] = img
            if wp_title and not existing["wikipedia"]:
                existing["wikipedia"] = wp_title
            if yr and not existing["year"]:
                existing["year"] = yr
            if unesco_id and not existing["unescoId"]:
                existing["unescoId"] = unesco_id
            if heritage_label and existing["heritageDesignation"] == "National Heritage Designation":
                existing["heritageDesignation"] = heritage_label
            if sl > existing["sitelinks"]:
                existing["sitelinks"] = sl

    backfill_underrepresented_countries(sites_by_qid, country_meta, iso3_to_qids, min_per_country=12)
    hydrate_missing_labels(sites_by_qid)

    # Drop any site still lacking a readable name
    sites_by_qid = {q: s for q, s in sites_by_qid.items() if s.get("name")}

    # Link UNESCO World Heritage official data (and ensure ALL 1,273 UNESCO sites appear!)
    matched_unesco_ids = set()
    for qid, s in sites_by_qid.items():
        uid = s.get("unescoId")
        if uid and uid in unesco_records:
            u = unesco_records[uid]
            s["unesco"] = u["name"]
            s["unescoYear"] = u["year"]
            s["unescoDanger"] = bool(u["danger"])
            s["unescoCategory"] = u["category"]
            if not s["desc"] and u["shortDesc"]:
                s["desc"] = u["shortDesc"][:240]
            if u["danger"]:
                s["inRestoration"] = True
                s["underfunded"] = True
            s["hasFunding"] = True
            matched_unesco_ids.add(uid)

    # Also spatially match remaining UNESCO whc001 entries if not linked via P757
    for uid, u in unesco_records.items():
        if uid in matched_unesco_ids or not u.get("coords"):
            continue
        ux, uy = u["coords"]
        best_qid = None
        best_d2 = 0.08 * 0.08
        uname_low = u["name"].lower()
        for qid, s in sites_by_qid.items():
            sx, sy = s["coords"]
            d2 = (sx - ux) ** 2 + (sy - uy) ** 2
            if d2 < best_d2 and (u["iso3List"] and s["countryIso"] in u["iso3List"] or s["name"].lower() in uname_low or uname_low in s["name"].lower()):
                best_d2 = d2
                best_qid = qid
        if best_qid:
            s = sites_by_qid[best_qid]
            s["unescoId"] = uid
            s["unesco"] = u["name"]
            s["unescoYear"] = u["year"]
            s["unescoDanger"] = bool(u["danger"])
            s["unescoCategory"] = u["category"]
            if u["danger"]:
                s["inRestoration"] = True
                s["underfunded"] = True
            s["hasFunding"] = True
            matched_unesco_ids.add(uid)
        else:
            iso3 = (u["iso3List"][0] if u["iso3List"] else "") or resolve_country_pip(ux, uy, polys_for_pip)
            if not iso3 or iso3 not in country_meta:
                continue
            syn_qid = f"WHC-{uid}"
            sites_by_qid[syn_qid] = {
                "qid": syn_qid,
                "name": u["name"],
                "coords": u["coords"],
                "countryIso": iso3,
                "country": country_meta[iso3]["name"],
                "region": u["region"] or country_meta[iso3].get("subregion") or "",
                "siteType": infer_site_type(u["name"], u["shortDesc"], u["category"]),
                "year": None,
                "style": "",
                "desc": (u["shortDesc"] or "")[:240],
                "image": "",
                "wikipedia": u["name"],
                "unesco": u["name"],
                "unescoId": uid,
                "unescoYear": u["year"],
                "unescoDanger": bool(u["danger"]),
                "unescoCategory": u["category"],
                "heritageDesignation": "UNESCO World Heritage Site",
                "sitelinks": 30,
                "hasFunding": True,
                "underfunded": bool(u["danger"]),
                "inRestoration": bool(u["danger"]),
            }
            matched_unesco_ids.add(uid)

    # Preserve ALL 4,408 India ASI/PRASHAD/Adopt-a-Heritage records verbatim!
    india_monuments_file = INDIA_REPO_DATA / "monuments.geojson"
    if india_monuments_file.exists():
        print("7. Merging all 4,408 India detailed sites intact...")
        ind_geo = json.loads(india_monuments_file.read_text(encoding="utf-8"))
        for feat in ind_geo.get("features", []):
            p = feat.get("properties", {})
            coords = feat.get("geometry", {}).get("coordinates")
            qid = p.get("qid")
            if not qid or not coords:
                continue
            prev_sl = sites_by_qid.get(qid, {}).get("sitelinks", 0)
            prev_uid = sites_by_qid.get(qid, {}).get("unescoId", "")
            in_rest = bool(
                p.get("inRestoration")
                or p.get("prashad")
                or re.search(r"conservation|restoration|repair|adopt|prashad", (p.get("desc") or "").lower())
            )
            sites_by_qid[qid] = {
                **p,
                "coords": [round(coords[0], 5), round(coords[1], 5)],
                "countryIso": "IND",
                "country": "India",
                "region": p.get("state") or "",
                "heritageDesignation": f"ASI {p.get('asiId')}" if p.get("asiId") else "Monument of National Importance (India)",
                "unescoId": prev_uid,
                "unescoDanger": False,
                "sitelinks": max(prev_sl, 8 if p.get("unesco") else (4 if p.get("wikipedia") else 1)),
                "hasFunding": bool(p.get("circleExpCr") or p.get("adoptPartner") or p.get("unesco") or p.get("ticketFy")),
                "underfunded": bool(p.get("underfundedCircle")),
                "inRestoration": in_rest,
            }

    # Copy India supplemental overlays for India Circle Budgets & PRASHAD layer
    india_extras = {}
    for fname, key in [("asi-circles.json", "asiCircles"), ("prashad-projects.geojson", "prashad")]:
        fp = INDIA_REPO_DATA / fname
        if fp.exists():
            india_extras[key] = json.loads(fp.read_text(encoding="utf-8"))
    (DATA_DIR / "india-extras.json").write_text(json.dumps(india_extras, separators=(",", ":")), encoding="utf-8")

    # Compute priority rank, coverage tier, and most-visited landmarks
    all_sites = list(sites_by_qid.values())
    for s in all_sites:
        has_photo = bool(s.get("image"))
        has_wiki = bool(s.get("wikipedia") or s.get("desc"))
        has_budget = bool(s.get("hasFunding") or s.get("circleExpCr") or s.get("footfallLakhs"))
        if not has_photo and not has_wiki:
            s["coverageStatus"] = "uncovered"
        elif has_photo and (has_wiki or has_budget):
            s["coverageStatus"] = "full"
        else:
            s["coverageStatus"] = "partial"

        score = (s.get("sitelinks") or 0) * 3
        if s.get("unesco"):
            score += 180
        if s.get("unescoDanger"):
            score += 40
        if s.get("footfallLakhs"):
            score += 120
        if has_photo:
            score += 35
        if has_wiki:
            score += 20
        if s.get("year"):
            score += 15
        s["priorityScore"] = score
        s["isMostVisited"] = bool(
            (s.get("sitelinks", 0) >= 55)
            or (s.get("footfallLakhs") and s["footfallLakhs"] >= 5)
            or (s.get("unesco") and s.get("sitelinks", 0) >= 35)
        )

    all_sites.sort(key=lambda x: (-x["priorityScore"], x["name"]))
    for idx, s in enumerate(all_sites):
        s["rank"] = idx + 1

    # Group into country shards + world summary + top global search index
    print(f"8. Writing {len(all_sites)} global monuments across country shards and GeoJSON intermediate...")
    by_country = {}
    for s in all_sites:
        by_country.setdefault(s["countryIso"], []).append(s)

    world_summary = {"totalMonuments": len(all_sites), "totalUnesco": len(unesco_records), "countriesCount": 0, "countries": []}
    for iso3, meta in sorted(country_meta.items(), key=lambda kv: kv[1]["name"]):
        csites = by_country.get(iso3, [])
        if not csites:
            continue
        unesco_c = sum(1 for x in csites if x.get("unesco"))
        danger_c = sum(1 for x in csites if x.get("unescoDanger") or x.get("inRestoration"))
        photo_c = sum(1 for x in csites if x.get("image"))
        uncov_c = sum(1 for x in csites if x.get("coverageStatus") == "uncovered")
        funded_c = sum(1 for x in csites if x.get("hasFunding") and not x.get("underfunded"))
        underf_c = sum(1 for x in csites if x.get("underfunded"))
        world_summary["countries"].append({
            "iso3": iso3,
            "name": meta["name"],
            "continent": meta["continent"],
            "center": meta["center"],
            "bbox": meta["bbox"],
            "total": len(csites),
            "unesco": unesco_c,
            "restoration": danger_c,
            "photographed": photo_c,
            "uncovered": uncov_c,
            "funded": funded_c,
            "underfunded": underf_c,
        })
        # Write per-country lightweight JSON shard for instant country filter/nearby/search
        shard = [
            {
                "qid": x["qid"],
                "name": x["name"],
                "coords": x["coords"],
                "countryIso": x["countryIso"],
                "country": x["country"],
                "region": x.get("region") or "",
                "siteType": x.get("siteType") or "",
                "year": x.get("year"),
                "style": x.get("style") or "",
                "desc": x.get("desc") or "",
                "image": x.get("image") or "",
                "wikipedia": x.get("wikipedia") or "",
                "unesco": x.get("unesco") or "",
                "unescoId": x.get("unescoId") or "",
                "unescoYear": x.get("unescoYear") or "",
                "unescoDanger": bool(x.get("unescoDanger")),
                "unescoCategory": x.get("unescoCategory") or "",
                "heritageDesignation": x.get("heritageDesignation") or "",
                "asiId": x.get("asiId") or "",
                "state": x.get("state") or "",
                "location": x.get("location") or "",
                "circleName": x.get("circleName") or "",
                "circleExpCr": x.get("circleExpCr"),
                "circleMonuments": x.get("circleMonuments"),
                "circlePerSiteLakh": x.get("circlePerSiteLakh"),
                "underfundedCircle": bool(x.get("underfundedCircle")),
                "adoptPartner": x.get("adoptPartner") or "",
                "adoptProgram": x.get("adoptProgram") or "",
                "adoptScope": x.get("adoptScope") or "",
                "footfallLakhs": x.get("footfallLakhs"),
                "revenueCr": x.get("revenueCr"),
                "ticketFy": x.get("ticketFy") or "",
                "ticketNote": x.get("ticketNote") or "",
                "model3dUrl": x.get("model3dUrl") or "",
                "model3dLabel": x.get("model3dLabel") or "",
                "epigraphy": bool(x.get("epigraphy")),
                "sitelinks": x.get("sitelinks") or 0,
                "priorityScore": x.get("priorityScore") or 0,
                "isMostVisited": bool(x.get("isMostVisited")),
                "coverageStatus": x.get("coverageStatus") or "partial",
                "hasFunding": bool(x.get("hasFunding")),
                "underfunded": bool(x.get("underfunded")),
                "inRestoration": bool(x.get("inRestoration")),
            }
            for x in csites
        ]
        (COUNTRIES_DIR / f"{iso3}.json").write_text(json.dumps(shard, separators=(",", ":")), encoding="utf-8")

    world_summary["countriesCount"] = len(world_summary["countries"])
    (DATA_DIR / "world-summary.json").write_text(json.dumps(world_summary, separators=(",", ":")), encoding="utf-8")

    # Top global search & featured pins index (top ~6,500 global landmarks + all UNESCO)
    search_top = []
    seen_q = set()
    for s in all_sites:
        if len(search_top) < 6500 or s.get("unesco") or s.get("isMostVisited"):
            if s["qid"] in seen_q:
                continue
            seen_q.add(s["qid"])
            search_top.append({
                "qid": s["qid"],
                "name": s["name"],
                "coords": s["coords"],
                "countryIso": s["countryIso"],
                "country": s["country"],
                "region": s.get("region") or "",
                "siteType": s.get("siteType") or "",
                "unesco": s.get("unesco") or "",
                "image": s.get("image") or "",
                "sitelinks": s.get("sitelinks") or 0,
                "priorityScore": s.get("priorityScore") or 0,
                "cat": (
                    "unesco" if s.get("unesco")
                    else "restoration" if s.get("inRestoration")
                    else "mostvisited" if s.get("isMostVisited")
                    else "underfunded" if s.get("underfunded")
                    else "uncovered" if s.get("coverageStatus") == "uncovered"
                    else "funded" if s.get("hasFunding")
                    else "national"
                ),
            })
    (DATA_DIR / "search-top.json").write_text(json.dumps(search_top, separators=(",", ":")), encoding="utf-8")

    # Write intermediate GeoJSON for scripts/build_pmtiles.mjs (in scripts/.cache so it isn't shipped in public/)
    tile_features = []
    for s in all_sites:
        # Assign minimum zoom level cleanly so low zooms show crisp landmarks and high zooms reveal all sites
        if s.get("unesco") or s.get("isMostVisited") or (s.get("sitelinks", 0) >= 40):
            mz = 0
        elif s.get("sitelinks", 0) >= 18:
            mz = 2
        elif s.get("sitelinks", 0) >= 8:
            mz = 4
        elif s.get("sitelinks", 0) >= 4:
            mz = 5
        else:
            mz = 6

        cat = (
            "unesco" if s.get("unesco")
            else "restoration" if s.get("inRestoration")
            else "mostvisited" if s.get("isMostVisited")
            else "underfunded" if s.get("underfunded")
            else "uncovered" if s.get("coverageStatus") == "uncovered"
            else "funded" if s.get("hasFunding")
            else "national"
        )
        tile_features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": s["coords"]},
            "properties": {
                "qid": s["qid"],
                "name": s["name"],
                "cIso": s["countryIso"],
                "country": s["country"],
                "reg": s.get("region") or "",
                "st": s.get("siteType") or "",
                "img": 1 if s.get("image") else 0,
                "imgUrl": s.get("image") or "",
                "wp": s.get("wikipedia") or "",
                "un": 1 if s.get("unesco") else 0,
                "unName": s.get("unesco") or "",
                "unId": s.get("unescoId") or "",
                "danger": 1 if s.get("unescoDanger") else 0,
                "rest": 1 if s.get("inRestoration") else 0,
                "uf": 1 if s.get("underfunded") else 0,
                "fund": 1 if s.get("hasFunding") else 0,
                "mv": 1 if s.get("isMostVisited") else 0,
                "uncov": 1 if s.get("coverageStatus") == "uncovered" else 0,
                "sl": s.get("sitelinks") or 0,
                "mz": mz,
                "cat": cat,
                "pr": s.get("priorityScore") or 0,
            },
        })

    pmtiles_src = CACHE_DIR / "monuments_for_pmtiles.geojson"
    pmtiles_src.write_text(json.dumps({"type": "FeatureCollection", "features": tile_features}, separators=(",", ":")), encoding="utf-8")
    print(f"DONE: {len(all_sites)} sites across {world_summary['countriesCount']} countries.")
    print(f"  Matched UNESCO entries: {len(matched_unesco_ids)} / {len(unesco_records)}")
    print(f"  PMTiles source GeoJSON: {pmtiles_src} ({pmtiles_src.stat().st_size / 1e6:.2f} MB)")


if __name__ == "__main__":
    main()
