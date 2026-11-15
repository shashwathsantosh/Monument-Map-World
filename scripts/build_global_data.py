#!/usr/bin/env python3
"""
Build verified global human-built architectural & monument datasets for Architecture Monument Atlas.

Strictly excludes natural formations, national parks, rivers, lakes, wetlands,
Ramsar sites, geological reserves, and modern transit stops/municipalities.
Preserves all India ASI/PRASHAD/Adopt-a-Heritage records from ../Maproject/public/data/
and ensures uniform architectural granularity (year, style, patron, architect, citations)
across every country on Earth.
"""

import argparse
import json
import os
import re
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "public" / "data"
COUNTRIES_DIR = DATA_DIR / "countries"
CACHE_DIR = ROOT / "scripts" / ".cache"
INDIA_REPO_DATA = ROOT.parent / "Maproject" / "public" / "data"

DATA_DIR.mkdir(parents=True, exist_ok=True)
COUNTRIES_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)

UA = "ArchitectureMonumentAtlas/1.0 (https://github.com/shashwathsantosh/Monument-Map-World)"
QLEVER_URL = "https://qlever.dev/api/wikidata"
WD_API_URL = "https://www.wikidata.org/w/api.php"
UNESCO_BASE = "https://data.unesco.org/api/explore/v2.1/catalog/datasets/whc001/records"
NE_50M_COUNTRIES_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/"
    "ne_50m_admin_0_countries.geojson"
)
NE_10M_DISPUTED_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/"
    "ne_10m_admin_0_disputed_areas.geojson"
)
NE_50M_BREAKAWAY_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/"
    "ne_50m_admin_0_breakaway_disputed_areas.geojson"
)
NE_50M_RIVERS_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/"
    "ne_50m_rivers_lake_centerlines.geojson"
)

CONSERVATION_AT_RISK_QIDS = {
    "Q55555088",   # in danger
    "Q60539160",   # partially destroyed
    "Q106379705",  # damaged
    "Q117769382",  # dilapidated
    "Q56557159",   # ruinous
    "Q27132179",   # abandoned
}
CONSERVATION_RESTORATION_QIDS = {
    "Q63187954",   # structure under reconstruction
    "Q55555088",   # in danger
}
CONSERVATION_DEMOLISHED_QIDS = {
    "Q56556915",   # demolished or destroyed
}

COUNTRY_QID_ISO_OVERRIDES = {
    "Q21": "GBR",
    "Q22": "GBR",
    "Q25": "GBR",
    "Q26": "GBR",
    "Q756617": "DNK",
    "Q29999": "NLD",
    "Q83286": "SRB",
    "Q33946": "CZE",
}

# Wikidata P31 classes that indicate non-built natural/geographic features or plain settlements/transit
NATURAL_P31_QIDS = {
    "Q46169",   # national park
    "Q179049",  # nature reserve
    "Q473972",  # protected area
    "Q22698",   # urban/recreational park (kept only if explicit monument/building P31 also present)
    "Q158454",  # biosphere reserve
    "Q23397",   # lake
    "Q4022",    # river
    "Q355304",  # watercourse
    "Q23442",   # island
    "Q207524",  # archipelago
    "Q34038",   # waterfall
    "Q35666",   # glacier
    "Q8502",    # mountain
    "Q46831",   # mountain range
    "Q8072",    # volcano
    "Q54050",   # hill
    "Q4421",    # forest
    "Q1775415", # national forest
    "Q167346",  # botanical garden
    "Q150784",  # canyon / gorge
    "Q39816",   # valley
    "Q170321",  # wetland
    "Q40080",   # beach
    "Q11292",   # coral reef
    "Q39594",   # bay
    "Q34763",   # peninsula
    "Q8514",    # desert
    "Q107679",  # cliff
    "Q631305",  # rock formation
    "Q10884",   # tree
    "Q35509",   # natural cave (unless rock-cut temple/archaeological P31 is present)
    "Q1322134", # geopark
    "Q166735",  # brochs/natural? no, fjord = Q45776
    "Q45776",   # fjord
    "Q16521",   # taxon
    "Q70208",   # municipality of Switzerland
    "Q685309",  # former municipality of Switzerland
    "Q486972",  # human settlement
    "Q532",     # village
    "Q515",     # city
    "Q123705",  # neighborhood
    "Q20202352",# locality of Mexico
    "Q55488",   # railway station
    "Q22808403",# underground station
    "Q22808404",# surface station
    "Q928830",  # metro station
}

BUILT_P31_QIDS = {
    "Q16970", "Q23413", "Q839954", "Q2319498", "Q4989906", "Q751876", "Q44613",
    "Q16560", "Q41176", "Q32815", "Q120560", "Q811165", "Q1497375", "Q207694",
    "Q2977", "Q39715", "Q56242215", "Q1785071", "Q24354", "Q1081138", "Q160742",
    "Q2031836", "Q2087181", "Q5393308", "Q17715832", "Q57831", "Q317557", "Q34627",
    "Q162875", "Q811979", "Q1088552", "Q537127", "Q109607", "Q15661340", "Q12518",
    "Q1343246", "Q44539", "Q24699794", "Q82117", "Q174782", "Q35112127", "Q860861",
    "Q15243209", "Q842402", "Q158438", "Q12280", "Q14752696", "Q108325", "Q3950",
    "Q1497364", "Q11303", "Q33506", "Q3947", "Q39614", "Q2065736", "Q210272",
}

NATURAL_HERITAGE_RE = re.compile(
    r"(ramsar site|important bird area|site of special scientific interest|national natural landmark|"
    r"iugs geological|international dark sky|natural monument|national park|nature reserve|"
    r"biosphere reserve|special area of conservation|special protection area|natura 2000|"
    r"wildlife sanctuary|wildlife refuge|geopark|national forest|wilderness area|marine park|"
    r"scenic beauty|botanical heritage|bird sanctuary|tiger reserve|national seashore)",
    re.I,
)

NATURAL_NAME_RE = re.compile(
    r"\b(national parks?|nature reserves?|natural reserves?|wildlife|biosphere|botanical gardens?|botanic gardens?|"
    r"arboretums?|natural monuments?|geoparks?|nature parks?|regional parks?|state parks?|provincial parks?|"
    r"country parks?|marine parks?|marine reserves?|forest reserves?|national forests?|wilderness|wetlands?|"
    r"ramsar|glaciers?|volcanos?|volcanoes|calderas?|craters?|canyons?|gorges?|waterfalls?|falls\b|cascades|"
    r"lakes?\b|loch\b|lough\b|fjords?|coral reefs?|barrier reefs?|atolls?|archipelagos?|islands?\b|isles?\b|"
    r"peninsulas?|mountains?|mount\b|mt\.|peaks?\b|summits?|massifs?|alps\b|cordilleras?|caverns?|karst|"
    r"deserts?|sand dunes?|dunes|marsh(?:es)?|swamps?|bogs?|estuar(?:y|ies)|lagoons?|bays?\b|gulfs?\b|"
    r"straits?\b|beach(?:es)?|coasts?\b|seashores?|cliffs?\b|rivers?\b|valleys?\b|deltas?\b|basins?\b|"
    r"steppes?|savannas?|rainforests?|forests?\b|woods?\b|ecological|bird sanctuar(?:y|ies)|tiger reserves?|"
    r"safaris?|fauna|flora|fossils?|paleontolog|meteorites?|geological)\b",
    re.I,
)

BUILT_CUE_RE = re.compile(
    r"\b(temples?|shrines?|pagodas?|stupas?|wat\b|mandir|church|churches|cathedrals?|basilicas?|chapels?|"
    r"abbeys?|monaster(?:y|ies)|monastic|prior(?:y|ies)|convents?|mosques?|masjids?|minarets?|madrasas?|"
    r"synagogues?|castles?|forts?|fortress(?:es)?|citadels?|palaces?|palazzos?|chateaus?|châteaux?|"
    r"schloss|villas?|mansions?|havelis?|mahals?|tombs?|mausoleums?|pyramids?|necropolis|necropoleis|"
    r"acropolis|amphitheat(?:re|er)s?|colosseum|aqueducts?|bridges?|viaducts?|towers?|lighthouses?|"
    r"gates?\b|arch(?:es)?\b|walls?\b|ramparts?|bastions?|museums?|theat(?:re|er)s?|operas?|universit(?:y|ies)|"
    r"librar(?:y|ies)|town halls?|city halls?|capitols?|courthouses?|pavilions?|prisons?|penitentiar(?:y|ies)|"
    r"statues?|obelisks?|ruins?|archaeological|rock-cut|cave temples?|grottos?|grottoes|petroglyphs?|"
    r"rock art|megaliths?|dolmens?|menhirs?|stone circles?|pile dwellings?|dwellings?|mines?\b|"
    r"ancient cit(?:y|ies)|sacred cit(?:y|ies)|historic cent(?:re|er)s?|historic cit(?:y|ies)|city of\b|"
    r"old towns?|historic districts?|ancient villages?|building complex|buildings?\b|town planning|"
    r"medina of|alcázar|alcazar|kasbahs?|kremlins?|sanctuar(?:y|ies) of|alcatraz|skellig michael|delos|"
    r"mont-saint-michel|robben island|gorée|elephanta|ellora|ajanta|mogao|cinque terre|portovenere)\b",
    re.I,
)

GLOBAL_SITE_TYPE_KEYWORDS = [
    ("Castle / Fort", ["castle", "fort", "fortress", "citadel", "château", "chateau", "burg", "alcazar", "kasbah", "qila"]),
    ("Palace / Residence", ["palace", "palazzo", "palais", "villa", "manor", "haveli", "mahal", "schloss", "mansion"]),
    ("Temple / Sanctuary", ["temple", "shrine", "pagoda", "stupa", "wat", "mandir", "gopura", "sanctuary", "rock-cut"]),
    ("Church / Cathedral", ["church", "cathedral", "abbey", "monastery", "basilica", "chapel", "priory", "convent", "kirke"]),
    ("Mosque / Madrasa", ["mosque", "masjid", "minaret", "madrasa", "jami"]),
    ("Archaeological Site", ["archaeological", "ruins", "roman", "ancient", "megalith", "pyramid", "necropolis", "acropolis", "amphitheatre", "tumulus"]),
    ("Tomb / Mausoleum", ["tomb", "mausoleum", "dargah", "cemetery", "memorial", "cenotaph"]),
    ("Civic / Bridge / Tower", ["bridge", "tower", "gate", "arch", "lighthouse", "aqueduct", "town hall", "city hall", "capitol", "theater", "theatre", "opera", "museum"]),
    ("Historic District", ["old town", "historic centre", "historic center", "quarter", "medina", "plaza", "square"]),
]


def http_get_json(url: str, headers: dict | None = None, timeout: int = 45, cache_path: Path | None = None):
    if cache_path and cache_path.exists():
        return json.loads(cache_path.read_text(encoding="utf-8"))
    req_headers = {"User-Agent": UA}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, headers=req_headers)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                raw = resp.read().decode("utf-8")
                data = json.loads(raw)
                if cache_path:
                    cache_path.write_text(raw, encoding="utf-8")
                return data
        except Exception as exc:
            if attempt == 3:
                raise
            is_429 = "429" in str(exc)
            wait_s = (4.0 * (attempt + 1)) if is_429 else (1.5 * (attempt + 1))
            print(f"  retry {attempt + 1} for {url[:80]}... ({exc})")
            time.sleep(wait_s)


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
    return uri.rsplit("/", 1)[-1] if uri else ""


def normalize_commons_url(url: str | None) -> str:
    if not url:
        return ""
    url = url.strip()
    if url.startswith("http://"):
        url = "https://" + url[7:]
    if "Special:FilePath" in url and "width=" not in url:
        sep = "&" if "?" in url else "?"
        return f"{url}{sep}width=720"
    return url


def compact_commons_slug(url: str | None) -> str:
    if not url:
        return ""
    m = re.search(r"Special:FilePath/([^?]+)", url)
    if m:
        return m.group(1)
    return ""


def infer_site_type(name: str, desc: str = "") -> str:
    hay = f"{name} {desc}".lower()
    for label, kws in GLOBAL_SITE_TYPE_KEYWORDS:
        if any(kw in hay for kw in kws):
            return label
    return "Architectural Monument"


def is_built_monument(name: str, desc: str = "", heritage_lbl: str = "", p31_set: set | None = None, unesco_cat: str = "") -> bool:
    if unesco_cat == "Natural":
        return False
    if unesco_cat == "Mixed" and not BUILT_CUE_RE.search(f"{name} {desc}"):
        return False
    if unesco_cat == "Cultural":
        # Even within UNESCO Cultural, skip purely natural/vineyard/river landscapes lacking built cues only if strictly natural name
        if NATURAL_NAME_RE.search(name) and not BUILT_CUE_RE.search(f"{name} {desc}"):
            return False
        return True

    if heritage_lbl and NATURAL_HERITAGE_RE.search(heritage_lbl) and not BUILT_CUE_RE.search(f"{name} {desc}"):
        return False

    if p31_set:
        has_nat_p31 = bool(p31_set & NATURAL_P31_QIDS)
        has_built_p31 = bool(p31_set & BUILT_P31_QIDS)
        if has_nat_p31 and not has_built_p31 and not BUILT_CUE_RE.search(f"{name} {desc}"):
            return False

    if NATURAL_NAME_RE.search(name) and not BUILT_CUE_RE.search(f"{name} {desc}"):
        return False
    return True


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
    print("1. Loading Natural Earth 50m countries...")
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
            ext = simplify_ring(coords[0], 0.05, 110)
            simp_geom = {"type": "Polygon", "coordinates": [ext]}
            bboxes.append(ring_bbox(ext))
            raw_rings.append(ext)
        elif gtype == "MultiPolygon" and coords:
            kept = []
            for poly in coords:
                if not poly:
                    continue
                ext = simplify_ring(poly[0], 0.06, 95)
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
            "properties": {"iso3": iso3, "iso2": iso2, "name": props.get("NAME") or name, "continent": continent},
        })
        polys_for_pip.append((iso3, bbox, raw_rings))

    india_border_src = INDIA_REPO_DATA / "india-border.geojson"
    if india_border_src.exists():
        ib = json.loads(india_border_src.read_text(encoding="utf-8"))
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

    (DATA_DIR / "world-countries.geojson").write_text(
        json.dumps({"type": "FeatureCollection", "features": features}, separators=(",", ":")), encoding="utf-8"
    )
    print(f"  Countries written: {len(country_meta)}")
    return country_meta, polys_for_pip


def resolve_country_pip(lon: float, lat: float, polys_for_pip: list) -> str:
    for iso3, bbox, rings in polys_for_pip:
        if bbox[0] <= lon <= bbox[2] and bbox[1] <= lat <= bbox[3]:
            for ring in rings:
                if point_in_ring(lon, lat, ring):
                    return iso3
    return ""


def fetch_country_qid_map(country_meta: dict):
    print("2. Loading Wikidata country QID mapping...")
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
    return qid_to_iso3, iso3_to_qids


def fetch_unesco_built(country_meta: dict, polys_for_pip: list):
    print("3. Filtering UNESCO World Heritage to built/cultural monuments...")
    all_rows = json.loads((CACHE_DIR / "unesco_whc001_all.json").read_text(encoding="utf-8"))
    iso2_to_iso3 = {m["iso2"].upper(): iso3 for iso3, m in country_meta.items() if m.get("iso2")}
    unesco_records = {}
    skipped_natural = 0
    for rec in all_rows:
        id_no = str(rec.get("id_no") or "").strip()
        if not id_no:
            continue
        name = rec.get("name_en") or ""
        short_desc = rec.get("short_description_en") or ""
        cat = rec.get("category") or ""
        if not is_built_monument(name, short_desc, "UNESCO World Heritage Site", None, cat):
            skipped_natural += 1
            continue
        coords_obj = rec.get("coordinates") or {}
        lon = coords_obj.get("lon")
        lat = coords_obj.get("lat")
        coords = [round(float(lon), 5), round(float(lat), 5)] if lon is not None and lat is not None else None
        iso_codes_raw = rec.get("iso_code") or rec.get("iso_codes") or ""
        iso2_list = [str(x).strip().upper() for x in (iso_codes_raw if isinstance(iso_codes_raw, list) else str(iso_codes_raw).split(",")) if x.strip()]
        iso3_list = [iso2_to_iso3[i2] for i2 in iso2_list if i2 in iso2_to_iso3]
        if not iso3_list and coords:
            pip_iso = resolve_country_pip(coords[0], coords[1], polys_for_pip)
            if pip_iso:
                iso3_list = [pip_iso]
        states_names = rec.get("states_names") or []
        states_str = ", ".join(str(x) for x in states_names if x) if isinstance(states_names, list) else str(states_names)
        danger_flag = bool(rec.get("danger") and str(rec.get("danger")).lower() not in ("false", "0", "no", ""))
        unesco_records[id_no] = {
            "id": id_no,
            "name": name,
            "shortDesc": short_desc,
            "justification": rec.get("justification_en") or "",
            "year": str(rec.get("date_inscribed") or "")[:4],
            "category": cat,
            "criteria": rec.get("criteria_txt") or "",
            "danger": danger_flag,
            "region": rec.get("region_en") or "",
            "countries": states_str,
            "iso3List": iso3_list,
            "areaHa": rec.get("area_hectares"),
            "coords": coords,
        }
    (DATA_DIR / "unesco-world.json").write_text(json.dumps(unesco_records, separators=(",", ":")), encoding="utf-8")
    print(f"  Built UNESCO retained: {len(unesco_records)} (excluded natural: {skipped_natural})")
    return unesco_records


def load_p31_map():
    fp = CACHE_DIR / "p31_sl3_types.json"
    if not fp.exists():
        return {}
    raw = json.loads(fp.read_text(encoding="utf-8"))
    out = {}
    for r in raw.get("results", {}).get("bindings", []):
        q = qid_from_uri(r.get("item", {}).get("value"))
        t = qid_from_uri(r.get("type", {}).get("value"))
        if q and t:
            out.setdefault(q, set()).add(t)
    return out


def load_conservation_map():
    fp = CACHE_DIR / "p5816_conservation.json"
    if not fp.exists():
        return {}
    raw = json.loads(fp.read_text(encoding="utf-8"))
    out = {}
    for r in raw.get("results", {}).get("bindings", []):
        q = qid_from_uri(r.get("item", {}).get("value"))
        sq = qid_from_uri(r.get("soc", {}).get("value"))
        sl = (r.get("socLabel", {}).get("value") or "").strip()
        if q and sq:
            out.setdefault(q, []).append((sq, sl))
    return out


def classify_era(year_val, unesco_year="", text=""):
    y = year_val
    if y is None and text:
        m = re.search(r"\b(\d{3,4})\s*(BCE|BC)\b", text, re.I)
        if m:
            y = -int(m.group(1))
        else:
            m2 = re.search(r"\b(\d{1,2})(?:st|nd|rd|th)\s+centur", text, re.I)
            if m2:
                c = int(m2.group(1))
                y = -(c * 100 - 50) if re.search(r"BCE|BC", text, re.I) else ((c - 1) * 100 + 50)
    if y is None:
        return "unk"
    if y < 500:
        return "anc"
    if y < 1500:
        return "med"
    if y < 1800:
        return "ear"
    return "mod"


def build_contested_areas():
    print("1b. Loading Natural Earth contested & disputed territories...")
    features = []
    contested_pips = []
    seen_names = set()
    for url, cache_name, step in [
        (NE_10M_DISPUTED_URL, "ne_10m_disputed_areas.json", 0.02),
        (NE_50M_BREAKAWAY_URL, "ne_50m_breakaway_disputed.json", 0.03),
    ]:
        try:
            raw = http_get_json(url, cache_path=CACHE_DIR / cache_name)
        except Exception as exc:
            print(f"  Warning fetching {cache_name}: {exc}")
            continue
        for f in raw.get("features", []):
            props = f.get("properties", {})
            name = (
                props.get("NAME")
                or props.get("BRK_NAME")
                or props.get("ADMIN")
                or props.get("SOVEREIGNT")
                or ""
            ).strip()
            if not name:
                continue
            note = (props.get("NOTE_BRK") or props.get("NAME_ALT") or props.get("TYPE") or "Disputed / Contested Territory").strip()
            admin = (props.get("ADMIN") or props.get("BRK_GROUP") or "").strip()
            key = (name.lower(), admin.lower())
            if key in seen_names:
                continue
            geom = f.get("geometry") or {}
            gtype = geom.get("type")
            coords = geom.get("coordinates") or []
            simp_geom = None
            bboxes = []
            rings = []
            if gtype == "Polygon" and coords:
                ext = simplify_ring(coords[0], step, 140)
                if len(ext) >= 4:
                    simp_geom = {"type": "Polygon", "coordinates": [ext]}
                    bboxes.append(ring_bbox(ext))
                    rings.append(ext)
            elif gtype == "MultiPolygon" and coords:
                kept = []
                for poly in coords:
                    if not poly:
                        continue
                    ext = simplify_ring(poly[0], step, 110)
                    if len(ext) >= 4:
                        kept.append([ext])
                        bboxes.append(ring_bbox(ext))
                        rings.append(ext)
                if kept:
                    simp_geom = {"type": "MultiPolygon", "coordinates": kept}
            if not simp_geom or not bboxes:
                continue
            seen_names.add(key)
            all_x = [b[0] for b in bboxes] + [b[2] for b in bboxes]
            all_y = [b[1] for b in bboxes] + [b[3] for b in bboxes]
            bbox = [round(min(all_x), 3), round(min(all_y), 3), round(max(all_x), 3), round(max(all_y), 3)]
            cx = round((min(all_x) + max(all_x)) / 2, 4)
            cy = round((min(all_y) + max(all_y)) / 2, 4)
            features.append({
                "type": "Feature",
                "geometry": simp_geom,
                "properties": {
                    "name": name,
                    "admin": admin,
                    "note": note,
                    "bbox": bbox,
                    "center": [cx, cy],
                },
            })
            contested_pips.append((name, note, bboxes, rings))

    (DATA_DIR / "contested-areas.geojson").write_text(
        json.dumps({"type": "FeatureCollection", "features": features}, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"  Built contested-areas.geojson: {len(features)} territories")
    return contested_pips


def resolve_contested_pip(lon: float, lat: float, contested_pips: list) -> str:
    for name, _note, bboxes, rings in contested_pips:
        for idx, b in enumerate(bboxes):
            if b[0] <= lon <= b[2] and b[1] <= lat <= b[3]:
                if point_in_ring(lon, lat, rings[idx]):
                    return name
    return ""


def _decimate_line(pts: list, step: float = 0.04, max_pts: int = 80) -> list:
    if len(pts) <= 2:
        return [[round(p[0], 3), round(p[1], 3)] for p in pts]
    out = [pts[0]]
    for pt in pts[1:-1]:
        lx, ly = out[-1]
        if abs(pt[0] - lx) >= step or abs(pt[1] - ly) >= step:
            out.append(pt)
    out.append(pts[-1])
    if len(out) > max_pts:
        stride = max(1, len(out) // max_pts)
        out = out[::stride]
        if out[-1] != pts[-1]:
            out.append(pts[-1])
    return [[round(p[0], 3), round(p[1], 3)] for p in out]


def build_world_rivers():
    print("1c. Loading Natural Earth global major & regional rivers...")
    raw = http_get_json(NE_50M_RIVERS_URL, cache_path=CACHE_DIR / "ne_50m_rivers.json")
    features = []
    for f in raw.get("features", []):
        props = f.get("properties", {})
        if (props.get("featurecla") or "").lower().startswith("lake"):
            continue
        name = (props.get("name_en") or props.get("name") or "").strip()
        scalerank = props.get("scalerank")
        try:
            sr = int(scalerank) if scalerank is not None else 6
        except Exception:
            sr = 6
        geom = f.get("geometry") or {}
        gtype = geom.get("type")
        coords = geom.get("coordinates") or []
        if gtype == "LineString" and len(coords) >= 2:
            simp = _decimate_line(coords)
            if len(simp) >= 2:
                features.append({
                    "type": "Feature",
                    "geometry": {"type": "LineString", "coordinates": simp},
                    "properties": {"name": name, "scalerank": sr},
                })
        elif gtype == "MultiLineString" and coords:
            parts = []
            for part in coords:
                if len(part) >= 2:
                    simp = _decimate_line(part)
                    if len(simp) >= 2:
                        parts.append(simp)
            if parts:
                features.append({
                    "type": "Feature",
                    "geometry": {"type": "MultiLineString", "coordinates": parts},
                    "properties": {"name": name, "scalerank": sr},
                })
    (DATA_DIR / "world-rivers.geojson").write_text(
        json.dumps({"type": "FeatureCollection", "features": features}, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"  Built world-rivers.geojson: {len(features)} rivers")
    return len(features)


def fetch_architectural_details():
    print("4. Fetching global architectural details (style, architect, patron, period) via QLever...")
    q = """
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX wikibase: <http://wikiba.se/ontology#>
    SELECT ?item ?styleLabel ?archLabel ?patronLabel WHERE {
      ?item wdt:P1435 ?h ; wdt:P625 ?coord ; wikibase:sitelinks ?sl .
      FILTER(?sl >= 3)
      OPTIONAL { ?item wdt:P149 ?style . ?style rdfs:label ?styleLabel . FILTER(LANG(?styleLabel) = "en") }
      OPTIONAL { ?item wdt:P84 ?arch . ?arch rdfs:label ?archLabel . FILTER(LANG(?archLabel) = "en") }
      OPTIONAL { ?item wdt:P88 ?patron . ?patron rdfs:label ?patronLabel . FILTER(LANG(?patronLabel) = "en") }
      FILTER(BOUND(?styleLabel) || BOUND(?archLabel) || BOUND(?patronLabel))
    }
    """
    rows = qlever_query(q, cache_name="arch_details_sl3", timeout=60)
    details = {}
    for r in rows:
        qid = qid_from_uri(r.get("item", {}).get("value"))
        if not qid:
            continue
        d = details.setdefault(qid, {"style": "", "architect": "", "patron": ""})
        if not d["style"] and r.get("styleLabel"):
            d["style"] = r["styleLabel"]["value"]
        if not d["architect"] and r.get("archLabel"):
            d["architect"] = r["archLabel"]["value"]
        if not d["patron"] and r.get("patronLabel"):
            d["patron"] = r["patronLabel"]["value"]
    print(f"  Architectural detail records: {len(details)}")
    return details


def fetch_global_granularity_and_visitors():
    """Fetch verified annual visitors (P1174), material (P186), period (P2348), location (P131), and official heritage title (P1435)."""
    print("4b. Fetching global verified visitor counts (P1174), material, period, locality, and government designation...")
    q_vis = """
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    SELECT ?item (MAX(xsd:integer(?v)) AS ?maxV) WHERE {
      ?item wdt:P1435 ?h ; wdt:P1174 ?v .
    }
    GROUP BY ?item
    """
    visitors = {}
    for r in qlever_query(q_vis, cache_name="global_visitors_p1174", timeout=30):
        qid = qid_from_uri(r.get("item", {}).get("value"))
        try:
            mv = int(float(r.get("maxV", {}).get("value") or 0))
        except Exception:
            mv = 0
        if qid and mv > 0:
            visitors[qid] = mv

    q_gran = """
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX wikibase: <http://wikiba.se/ontology#>
    SELECT ?item ?herLabel ?matLabel ?perLabel ?locLabel WHERE {
      ?item wdt:P1435 ?h ; wdt:P625 ?coord ; wikibase:sitelinks ?sl .
      FILTER(?sl >= 3)
      OPTIONAL { ?h rdfs:label ?herLabel . FILTER(LANG(?herLabel) = "en") }
      OPTIONAL { ?item wdt:P186 ?mat . ?mat rdfs:label ?matLabel . FILTER(LANG(?matLabel) = "en") }
      OPTIONAL { ?item wdt:P2348 ?per . ?per rdfs:label ?perLabel . FILTER(LANG(?perLabel) = "en") }
      OPTIONAL { ?item wdt:P131 ?loc . ?loc rdfs:label ?locLabel . FILTER(LANG(?locLabel) = "en") }
    }
    """
    gran = {}
    for r in qlever_query(q_gran, cache_name="global_granularity_sl3", timeout=90):
        qid = qid_from_uri(r.get("item", {}).get("value"))
        if not qid:
            continue
        g = gran.setdefault(qid, {"heritage": "", "material": "", "period": "", "location": ""})
        if not g["heritage"] and r.get("herLabel"):
            g["heritage"] = r["herLabel"]["value"]
        if not g["material"] and r.get("matLabel"):
            g["material"] = r["matLabel"]["value"]
        if not g["period"] and r.get("perLabel"):
            g["period"] = r["perLabel"]["value"]
        if not g["location"] and r.get("locLabel"):
            g["location"] = r["locLabel"]["value"]
    print(f"  Global P1174 visitor records: {len(visitors)} | Extra granularity records: {len(gran)}")
    return visitors, gran


def expand_underrepresented_countries_granularity(sites_by_qid: dict, country_meta: dict, iso3_to_qids: dict, p31_map: dict, visitors_map: dict):
    """Ensure countries with <350 sites in sl>=3 pull strictly government-recognized (wdt:P1435) built monuments at sl>=0."""
    counts = {}
    for s in sites_by_qid.values():
        counts[s["countryIso"]] = counts.get(s["countryIso"], 0) + 1

    targets = [iso3 for iso3 in sorted(country_meta.keys()) if iso3 != "IND" and counts.get(iso3, 0) < 350]
    print(f"5. Expanding strictly government-recognized (P1435) granularity across {len(targets)} countries (<350 sites)...")

    def _fetch_country(iso3: str):
        qids = iso3_to_qids.get(iso3, [])
        if not qids:
            return iso3, []
        cqid = qids[0]
        q = f"""
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX wikibase: <http://wikiba.se/ontology#>
        PREFIX schema: <http://schema.org/>
        SELECT ?item ?label ?coord ?sl ?image ?article ?inception ?herLabel WHERE {{
          ?item wdt:P17 wd:{cqid} ; wdt:P1435 ?h ; wdt:P625 ?coord .
          OPTIONAL {{ ?h rdfs:label ?herLabel . FILTER(LANG(?herLabel) = "en") }}
          OPTIONAL {{ ?item wikibase:sitelinks ?sl . }}
          OPTIONAL {{ ?item wdt:P18 ?image . }}
          OPTIONAL {{ ?item wdt:P571 ?inception . }}
          OPTIONAL {{ ?item rdfs:label ?label . FILTER(LANG(?label) = "en") }}
          OPTIONAL {{ ?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }}
        }}
        ORDER BY DESC(?sl)
        LIMIT 350
        """
        try:
            rows = qlever_query(q, cache_name=f"p1435_{iso3}", timeout=15)
            return iso3, rows
        except Exception as exc:
            print(f"  Skip {iso3}: {exc}", flush=True)
            return iso3, []

    added = 0
    for iso3 in targets:
        cache_file = CACHE_DIR / f"p1435_{iso3}.json"
        was_cached = cache_file.exists()
        _, rows = _fetch_country(iso3)
        if not was_cached:
            time.sleep(0.22)
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
            her_lbl = (r.get("herLabel", {}).get("value") or "").strip() or "Government-Designated Heritage"
            if not is_built_monument(label, "", her_lbl, p31_map.get(qid), ""):
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
                "location": (r.get("locLabel", {}).get("value") or ""),
                "siteType": infer_site_type(label),
                "year": yr,
                "style": (r.get("styleLabel", {}).get("value") or ""),
                "material": (r.get("matLabel", {}).get("value") or ""),
                "period": (r.get("perLabel", {}).get("value") or ""),
                "architect": (r.get("archLabel", {}).get("value") or ""),
                "patron": (r.get("patronLabel", {}).get("value") or ""),
                "desc": "",
                "image": img,
                "wikipedia": wp_title,
                "unesco": "",
                "unescoId": "",
                "unescoYear": "",
                "unescoDanger": False,
                "heritageDesignation": her_lbl,
                "sitelinks": sl,
                "annualVisitors": visitors_map.get(qid),
                "hasFunding": False,
                "underfunded": False,
                "inRestoration": False,
            }
            added += 1
    print(f"  Granularity pass added {added} strictly government-recognized P1435 sites across underrepresented countries")


def main():
    country_meta, polys_for_pip = build_countries()
    contested_pips = build_contested_areas()
    build_world_rivers()
    qid_to_iso3, iso3_to_qids = fetch_country_qid_map(country_meta)
    unesco_records = fetch_unesco_built(country_meta, polys_for_pip)
    p31_map = load_p31_map()
    conservation_map = load_conservation_map()
    arch_details = fetch_architectural_details()
    visitors_map, extra_gran = fetch_global_granularity_and_visitors()

    hydrated_labels = {}
    hyd_file = CACHE_DIR / "hydrated_labels.json"
    if hyd_file.exists():
        hydrated_labels = json.loads(hyd_file.read_text(encoding="utf-8"))

    sites_by_qid = {}
    excluded_natural = 0
    for band_name in ["band_wd_unesco", "band_sl_25_plus", "band_sl_10_24", "band_sl_5_9", "band_sl_3_4"]:
        rows = json.loads((CACHE_DIR / f"{band_name}.json").read_text(encoding="utf-8"))["results"]["bindings"]
        for r in rows:
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

            label = (r.get("label", {}).get("value") or "").strip() or hydrated_labels.get(qid, {}).get("label", "")
            if not label:
                continue
            heritage_lbl = (r.get("heritageLabel", {}).get("value") or "").strip()
            unesco_id = str(r.get("unescoId", {}).get("value") or "").strip()
            unesco_cat = unesco_records.get(unesco_id, {}).get("category", "") if unesco_id else ""

            if not is_built_monument(label, hydrated_labels.get(qid, {}).get("desc", ""), heritage_lbl, p31_map.get(qid), unesco_cat):
                excluded_natural += 1
                continue

            sl = int(r.get("sl", {}).get("value") or 0)
            img = normalize_commons_url(r.get("image", {}).get("value"))
            wp = r.get("article", {}).get("value") or ""
            wp_title = urllib.parse.unquote(wp.rsplit("/wiki/", 1)[-1]).replace("_", " ") if "/wiki/" in wp else ""
            inc = (r.get("inception", {}).get("value") or "")[:4]
            yr = int(inc) if re.match(r"^-?\d{1,4}$", inc) else None
            det = arch_details.get(qid, {})
            gran = extra_gran.get(qid, {})
            best_heritage = heritage_lbl or gran.get("heritage", "") or ("UNESCO World Heritage Site" if band_name == "band_wd_unesco" else "Government-Recognized Heritage")

            existing = sites_by_qid.get(qid)
            if not existing:
                sites_by_qid[qid] = {
                    "qid": qid,
                    "name": label,
                    "coords": coords,
                    "countryIso": iso3,
                    "country": country_meta[iso3]["name"],
                    "region": country_meta[iso3].get("subregion") or "",
                    "location": gran.get("location", ""),
                    "siteType": infer_site_type(label),
                    "year": yr,
                    "style": det.get("style", ""),
                    "material": gran.get("material", ""),
                    "period": gran.get("period", ""),
                    "architect": det.get("architect", ""),
                    "patron": det.get("patron", ""),
                    "desc": hydrated_labels.get(qid, {}).get("desc", ""),
                    "image": img,
                    "wikipedia": wp_title,
                    "unesco": "",
                    "unescoId": unesco_id,
                    "unescoYear": "",
                    "unescoDanger": False,
                    "heritageDesignation": best_heritage,
                    "sitelinks": sl,
                    "annualVisitors": visitors_map.get(qid),
                    "hasFunding": False,
                    "underfunded": False,
                    "inRestoration": False,
                }
            else:
                if img and not existing["image"]:
                    existing["image"] = img
                if wp_title and not existing["wikipedia"]:
                    existing["wikipedia"] = wp_title
                if yr and not existing["year"]:
                    existing["year"] = yr
                if unesco_id and not existing["unescoId"]:
                    existing["unescoId"] = unesco_id
                if gran.get("heritage") and existing.get("heritageDesignation") in ("", "Government-Recognized Heritage", "National Architectural Heritage"):
                    existing["heritageDesignation"] = gran["heritage"]
                if sl > existing["sitelinks"]:
                    existing["sitelinks"] = sl

    print(f"  Retained built sites from bands: {len(sites_by_qid)} (excluded natural/settlement: {excluded_natural})")
    expand_underrepresented_countries_granularity(sites_by_qid, country_meta, iso3_to_qids, p31_map, visitors_map)

    # Link built UNESCO records cleanly
    matched_unesco = set()
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
            matched_unesco.add(uid)

    for uid, u in unesco_records.items():
        if uid in matched_unesco or not u.get("coords"):
            continue
        ux, uy = u["coords"]
        best_qid = None
        best_d2 = 0.08 * 0.08
        uname_low = u["name"].lower()
        for qid, s in sites_by_qid.items():
            sx, sy = s["coords"]
            d2 = (sx - ux) ** 2 + (sy - uy) ** 2
            if d2 < best_d2 and ((u["iso3List"] and s["countryIso"] in u["iso3List"]) or s["name"].lower() in uname_low or uname_low in s["name"].lower()):
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
            matched_unesco.add(uid)
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
                "siteType": infer_site_type(u["name"], u["shortDesc"]),
                "year": None,
                "style": "",
                "architect": "",
                "patron": "",
                "desc": (u["shortDesc"] or "")[:240],
                "image": "",
                "wikipedia": u["name"],
                "unesco": u["name"],
                "unescoId": uid,
                "unescoYear": u["year"],
                "unescoDanger": bool(u["danger"]),
                "unescoCategory": u["category"],
                "heritageDesignation": "UNESCO Cultural Heritage Site",
                "sitelinks": 35,
                "annualVisitors": visitors_map.get(syn_qid),
                "hasFunding": True,
                "underfunded": bool(u["danger"]),
                "inRestoration": bool(u["danger"]),
            }
            matched_unesco.add(uid)

    # Merge ALL built India ASI/PRASHAD/Adopt-a-Heritage records intact
    india_monuments_file = INDIA_REPO_DATA / "monuments.geojson"
    if india_monuments_file.exists():
        print("6. Merging ALL India ASI sites intact (excluding natural parks/sanctuaries)...")
        ind_geo = json.loads(india_monuments_file.read_text(encoding="utf-8"))
        for feat in ind_geo.get("features", []):
            p = feat.get("properties", {})
            coords = feat.get("geometry", {}).get("coordinates")
            qid = p.get("qid")
            if not qid or not coords:
                continue
            if not is_built_monument(p.get("name", ""), p.get("desc", ""), "ASI Monument", None, ""):
                continue
            prev_sl = sites_by_qid.get(qid, {}).get("sitelinks", 0)
            prev_uid = sites_by_qid.get(qid, {}).get("unescoId", "")
            det = arch_details.get(qid, {})
            gran = extra_gran.get(qid, {})
            in_rest = bool(
                p.get("inRestoration")
                or p.get("prashad")
                or re.search(r"conservation|restoration|repair|adopt|prashad", (p.get("desc") or "").lower())
            )
            ind_fl = p.get("footfallLakhs")
            ind_vis = int(round(float(ind_fl) * 100000)) if ind_fl else None
            sites_by_qid[qid] = {
                **p,
                "coords": [round(coords[0], 5), round(coords[1], 5)],
                "countryIso": "IND",
                "country": "India",
                "region": p.get("state") or "",
                "location": p.get("place") or p.get("location") or gran.get("location", ""),
                "style": p.get("style") or det.get("style", ""),
                "material": p.get("material") or gran.get("material", ""),
                "period": p.get("period") or gran.get("period", ""),
                "architect": det.get("architect", ""),
                "patron": det.get("patron", ""),
                "heritageDesignation": f"ASI {p.get('asiId')}" if p.get("asiId") else "Monument of National Importance (India)",
                "unescoId": prev_uid,
                "unescoDanger": False,
                "sitelinks": max(prev_sl, 8 if p.get("unesco") else (4 if p.get("wikipedia") else 1)),
                "annualVisitors": ind_vis or visitors_map.get(qid),
                "hasFunding": bool(p.get("circleExpCr") or p.get("adoptPartner") or p.get("unesco") or p.get("ticketFy")),
                "underfunded": bool(p.get("underfundedCircle")),
                "inRestoration": in_rest,
            }

    india_extras = {}
    for fname, key in [("asi-circles.json", "asiCircles"), ("prashad-projects.geojson", "prashad")]:
        fp = INDIA_REPO_DATA / fname
        if fp.exists():
            india_extras[key] = json.loads(fp.read_text(encoding="utf-8"))
    (DATA_DIR / "india-extras.json").write_text(json.dumps(india_extras, separators=(",", ":")), encoding="utf-8")

    # Apply conservation signals (Wikidata P5816 + UNESCO Danger + India circles) and drop purely demolished non-UNESCO entries
    removed_demolished = 0
    for qid in list(sites_by_qid.keys()):
        s = sites_by_qid[qid]
        states = conservation_map.get(qid, [])
        if states and not s.get("unesco") and s.get("countryIso") != "IND":
            qids_only = {sq for sq, _ in states}
            if qids_only <= CONSERVATION_DEMOLISHED_QIDS:
                del sites_by_qid[qid]
                removed_demolished += 1
                continue
        for sq, slbl in states:
            if sq in CONSERVATION_AT_RISK_QIDS:
                s["underfunded"] = True
                if not s.get("conservationState"):
                    s["conservationState"] = slbl
            if sq in CONSERVATION_RESTORATION_QIDS:
                s["inRestoration"] = True
                if not s.get("conservationState"):
                    s["conservationState"] = slbl
            elif slbl and not s.get("conservationState"):
                s["conservationState"] = slbl
    if removed_demolished:
        print(f"  Removed {removed_demolished} completely demolished non-extant structures via Wikidata P5816")

    # Compute priority scores, chronological eras, contested territory overlap, and PER-COUNTRY zoom rank
    all_sites = list(sites_by_qid.values())
    era_counts = {"anc": 0, "med": 0, "ear": 0, "mod": 0, "unk": 0}
    contested_site_count = 0
    for s in all_sites:
        has_photo = bool(s.get("image"))
        has_wiki = bool(s.get("wikipedia") or s.get("desc"))
        has_budget = bool(s.get("hasFunding") or s.get("circleExpCr") or s.get("footfallLakhs"))
        if not has_photo:
            s["coverageStatus"] = "uncovered"
        elif has_photo and (has_wiki or has_budget):
            s["coverageStatus"] = "full"
        else:
            s["coverageStatus"] = "partial"

        era = classify_era(s.get("year"), s.get("unescoYear", ""), f"{s.get('period') or ''} {s.get('desc') or ''}")
        s["era"] = era
        era_counts[era] = era_counts.get(era, 0) + 1

        ct_name = resolve_contested_pip(s["coords"][0], s["coords"][1], contested_pips)
        s["contested"] = bool(ct_name)
        s["contestedArea"] = ct_name
        if ct_name:
            contested_site_count += 1

        score = (s.get("sitelinks") or 0) * 3
        if s.get("unesco"):
            score += 200
        if s.get("unescoDanger"):
            score += 45
        if s.get("footfallLakhs"):
            score += 130
        if (s.get("annualVisitors") or 0) >= 500000:
            score += 95
        if has_photo:
            score += 40
        if has_wiki:
            score += 20
        if s.get("year") or s.get("style") or s.get("architect") or s.get("patron"):
            score += 15
        s["priorityScore"] = score
        s["isMostVisited"] = bool((s.get("annualVisitors") or 0) >= 500000)

    by_country = {}
    for s in all_sites:
        by_country.setdefault(s["countryIso"], []).append(s)

    for iso3, csites in by_country.items():
        csites.sort(key=lambda x: (-x["priorityScore"], x["name"]))
        z4_cap = 5000 if iso3 == "IND" else 1400
        for c_idx, s in enumerate(csites):
            # Per-country rank zoom tier so India (~3.8k ASI) & every country show full density crisply on zoom 4!
            if s.get("unesco") or (c_idx < 3 and s.get("priorityScore", 0) >= 80):
                s["mz"] = 0
            elif c_idx < 12 or s.get("isMostVisited"):
                s["mz"] = 2
            elif c_idx < (140 if iso3 == "IND" else 80):
                s["mz"] = 3
            elif c_idx < z4_cap:
                s["mz"] = 4
            else:
                s["mz"] = 5

    all_sites.sort(key=lambda x: (-x["priorityScore"], x["name"]))
    for idx, s in enumerate(all_sites):
        s["rank"] = idx + 1

    # Remove stale country JSON shards before writing updated ones
    for old_f in COUNTRIES_DIR.glob("*.json"):
        old_f.unlink()

    world_summary = {
        "totalMonuments": len(all_sites),
        "totalUnesco": len(unesco_records),
        "countriesCount": 0,
        "contestedAreasCount": len(contested_pips),
        "contestedMonuments": contested_site_count,
        "eraCounts": era_counts,
        "countries": [],
    }
    for iso3, meta in sorted(country_meta.items(), key=lambda kv: kv[1]["name"]):
        csites = by_country.get(iso3, [])
        if not csites:
            continue
        world_summary["countries"].append({
            "iso3": iso3,
            "name": meta["name"],
            "continent": meta["continent"],
            "center": meta["center"],
            "bbox": meta["bbox"],
            "total": len(csites),
            "unesco": sum(1 for x in csites if x.get("unesco")),
            "restoration": sum(1 for x in csites if x.get("unescoDanger") or x.get("inRestoration")),
            "photographed": sum(1 for x in csites if x.get("image")),
            "uncovered": sum(1 for x in csites if x.get("coverageStatus") == "uncovered"),
            "funded": sum(1 for x in csites if x.get("hasFunding") and not x.get("underfunded")),
            "underfunded": sum(1 for x in csites if x.get("underfunded")),
            "contested": sum(1 for x in csites if x.get("contested")),
        })
        (COUNTRIES_DIR / f"{iso3}.json").write_text(json.dumps(csites, separators=(",", ":")), encoding="utf-8")

    world_summary["countriesCount"] = len(world_summary["countries"])
    (DATA_DIR / "world-summary.json").write_text(json.dumps(world_summary, separators=(",", ":")), encoding="utf-8")

    search_top = []
    seen_q = set()
    for s in all_sites:
        if len(search_top) < 8000 or s.get("unesco") or s.get("isMostVisited"):
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
                "era": s.get("era") or "unk",
                "yr": s.get("year") if s.get("year") is not None else None,
                "ct": 1 if s.get("contested") else 0,
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

    # Compact PMTiles payload (reconstruct full Wikimedia FilePath client-side for snappiness!)
    tile_features = []
    for s in all_sites:
        cat = (
            "unesco" if s.get("unesco")
            else "restoration" if s.get("inRestoration")
            else "mostvisited" if s.get("isMostVisited")
            else "underfunded" if s.get("underfunded")
            else "uncovered" if s.get("coverageStatus") == "uncovered"
            else "funded" if s.get("hasFunding")
            else "national"
        )
        img_slug = compact_commons_slug(s.get("image"))
        img_raw = "" if img_slug else (s.get("image") or "")
        tile_features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": s["coords"]},
            "properties": {
                "qid": s["qid"],
                "name": s["name"],
                "cIso": s["countryIso"],
                "country": s["country"],
                "reg": s.get("region") or "",
                "loc": (s.get("location") or "")[:60],
                "st": s.get("siteType") or "",
                "sty": (s.get("style") or "")[:60],
                "mat": (s.get("material") or "")[:50],
                "per": (s.get("period") or "")[:50],
                "hd": (s.get("heritageDesignation") or "")[:70],
                "vis": int(s.get("annualVisitors") or 0),
                "era": s.get("era") or "unk",
                "yr": s.get("year") if s.get("year") is not None else -99999,
                "ct": 1 if s.get("contested") else 0,
                "ctName": s.get("contestedArea") or "",
                "img": 1 if s.get("image") else 0,
                "imgF": img_slug,
                "imgU": img_raw,
                "un": 1 if s.get("unesco") else 0,
                "unId": s.get("unescoId") or "",
                "danger": 1 if s.get("unescoDanger") else 0,
                "rest": 1 if s.get("inRestoration") else 0,
                "uf": 1 if s.get("underfunded") else 0,
                "fund": 1 if s.get("hasFunding") else 0,
                "mv": 1 if s.get("isMostVisited") else 0,
                "uncov": 1 if s.get("coverageStatus") == "uncovered" else 0,
                "sl": s.get("sitelinks") or 0,
                "mz": s["mz"],
                "cat": cat,
                "pr": s.get("priorityScore") or 0,
            },
        })

    pmtiles_src = CACHE_DIR / "monuments_for_pmtiles.geojson"
    pmtiles_src.write_text(json.dumps({"type": "FeatureCollection", "features": tile_features}, separators=(",", ":")), encoding="utf-8")
    ind_count = len(by_country.get("IND", []))
    print(f"DONE: {len(all_sites)} strictly built monuments across {world_summary['countriesCount']} countries (India: {ind_count} sites).")


if __name__ == "__main__":
    main()
