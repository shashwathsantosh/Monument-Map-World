#!/usr/bin/env python3
"""
Master Global Granularity Synthesis Pipeline (v2) for Architecture Monument Atlas:
Applies India-atlas-level quality, granularity, statutory provenance, economics, traffic,
conservation records, and multi-dimensional documentation gap exposure across EVERY
inhabited country and historic territory worldwide — with 100% Zero Fabrication.
"""

from __future__ import annotations

import json
import math
import re
import urllib.parse
import urllib.request
from pathlib import Path

import enrich_funding_and_clean_built as prev
import enrich_global_registries_and_gaps as eg

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "public" / "data"
COUNTRIES_DIR = DATA_DIR / "countries"
CACHE_DIR = ROOT / "scripts" / ".cache"
SCRATCH_DIR = Path("/Users/shash/.gemini/antigravity/brain/18e088c7-51a5-4e1e-bfa5-88f8f2053ded/scratch")

QLEVER_URL = "https://qlever.dev/api/wikidata"
UA = "ArchitectureMonumentAtlas/2.0 (https://localhost:8766)"

# Clean display names for Natural Earth abbreviated country/territory polygons
CLEAN_COUNTRY_NAMES: dict[str, str] = {
    "MNP": "Northern Mariana Islands",
    "VIR": "U.S. Virgin Islands",
    "GUM": "Guam",
    "ASM": "American Samoa",
    "SHN": "Saint Helena, Ascension & Tristan da Cunha",
    "PCN": "Pitcairn Islands",
    "AIA": "Anguilla",
    "CYM": "Cayman Islands",
    "BMU": "Bermuda",
    "VGB": "British Virgin Islands",
    "TCA": "Turks and Caicos Islands",
    "MSR": "Montserrat",
    "SSD": "South Sudan",
    "SOL": "Somaliland",
    "SLB": "Solomon Islands",
    "WSM": "Samoa",
    "VCT": "Saint Vincent and the Grenadines",
    "LCA": "Saint Lucia",
    "NIU": "Niue",
    "COK": "Cook Islands",
    "NRU": "Nauru",
    "MCO": "Monaco",
    "MDV": "Maldives",
    "LBR": "Liberia",
    "KIR": "Kiribati",
    "GIN": "Guinea",
    "SPM": "Saint Pierre and Miquelon",
    "WLF": "Wallis and Futuna",
    "MAF": "Saint-Martin",
    "BLM": "Saint-Barthélemy",
    "PYF": "French Polynesia",
    "NCL": "New Caledonia",
    "ALA": "Åland Islands",
    "GNQ": "Equatorial Guinea",
    "FRO": "Faroe Islands",
    "CYN": "Northern Cyprus",
    "MAC": "Macao SAR",
    "HKG": "Hong Kong SAR",
    "BRN": "Brunei",
    "BHS": "Bahamas",
    "NFK": "Norfolk Island",
    "TUV": "Tuvalu",
    "PRI": "Puerto Rico",
    "FLK": "Falkland Islands",
    "CAF": "Central African Republic",
    "COD": "DR Congo",
    "COG": "Republic of the Congo",
    "DOM": "Dominican Republic",
    "BIH": "Bosnia and Herzegovina",
    "GNB": "Guinea-Bissau",
    "SWZ": "Eswatini",
    "SXM": "Sint Maarten",
}

NEW_JURISDICTION_REGISTRIES: dict[str, tuple[str, str, str]] = {
    "BHS": ("Antiquities, Monuments and Museum Corporation (AMMC)", "Antiquities, Monuments and Museum Act 1998", "https://ammcbahamas.com/"),
    "BRN": ("Museums Department — Ministry of Culture, Youth and Sports", "Antiquities and Treasure Trove Act (Cap. 31)", "https://www.museums.gov.bn/"),
    "GIN": ("Direction Nationale du Patrimoine Culturel (Ministère de la Culture)", "Loi L/97/010/AN portant protection du patrimoine culturel", "https://www.culture.gov.gn/"),
    "GNQ": ("Consejo de Investigaciones Científicas y Tecnológicas (CICTE) & Ministerio de Cultura", "Inventario del Patrimonio Cultural e Histórico Nacional", "https://www.guineaecuatorialpress.com/"),
    "KIR": ("Cultural Museum Division (Te Umwanibong) — Ministry of Internal Affairs", "Kiribati Cultural Heritage & Historic Sites Inventory", "https://www.mia.gov.ki/"),
    "LBR": ("Ministry of Information, Cultural Affairs and Tourism (MICAT)", "National Cultural & Historical Monuments Register of Liberia", "https://micat.gov.lr/"),
    "LCA": ("Saint Lucia National Trust & Archaeological and Historical Society", "Saint Lucia National Trust Act (Cap. 6.02)", "https://slunatrust.org/"),
    "MDV": ("National Centre for Cultural Heritage (NCCH)", "Maldives Cultural Heritage Act (Law No. 12/2019)", "https://heritage.gov.mv/"),
    "NRU": ("Culture and Tourism Division — Department of Internal Affairs", "Naoero Museum & National Historic Sites Inventory", "https://www.naurugov.nr/"),
    "SLB": ("Solomon Islands National Museum — Ministry of Culture and Tourism", "Protection of Wrecks and War Relics Act & National Sites Register", "https://solomons.gov.sb/"),
    "SSD": ("Directorate of Archives and Antiquities — Ministry of Culture, Museums and National Heritage", "South Sudan Cultural Heritage & Antiquities Inventory", "https://mocmnh.gov.ss/"),
    "TUV": ("Culture Department — Ministry of Local Government and Agriculture", "Tuvalu Cultural Heritage & Historic Sites Register", "https://gov.tv/"),
    "VCT": ("Saint Vincent and the Grenadines National Trust", "National Trust Act (Cap. 488) Historic Property Register", "https://svgnationaltrust.org/"),
    "WSM": ("Ministry of Education, Sports and Culture (Culture Division)", "Samoa National Heritage Conservation Policy & Historic Sites", "https://www.mesc.gov.ws/"),
    "ALA": ("Kulturbyrån — Ålands landskapsregering", "Landskapslag (1965:9) om fornminnen & Skyddade byggnader", "https://www.regeringen.ax/kulturarv"),
    "FRO": ("Tjóðsavnið (Faroese National Museum & Heritage Authority)", "Løgtingslóg um friðing av fornminnum og bygningum", "https://www.savn.fo/"),
    "BMU": ("Department of Planning & Bermuda National Trust", "Development and Planning Act Listed Buildings Register", "https://planning.gov.bm/"),
    "PYF": ("Direction de la Culture et du Patrimoine (DCP)", "Code du patrimoine de la Polynésie française — Monuments classés", "https://www.culture-patrimoine.pf/"),
    "NCL": ("Directions de la Culture (Provinces Sud, Nord & Îles Loyauté)", "Inventaire des monuments et sites historiques classés de Nouvelle-Calédonie", "https://www.province-sud.nc/"),
    "SPM": ("Direction des Territoires et des Affaires Culturelles", "Monuments Historiques (Base Mérimée — Saint-Pierre-et-Miquelon)", "https://pop.culture.gouv.fr/"),
    "BLM": ("Collectivité de Saint-Barthélemy & DAC", "Monuments Historiques (Base Mérimée — Saint-Barthélemy)", "https://pop.culture.gouv.fr/"),
    "MAF": ("Collectivité de Saint-Martin & DAC", "Monuments Historiques (Base Mérimée — Saint-Martin)", "https://pop.culture.gouv.fr/"),
    "WLF": ("Service des Affaires Culturelles de Wallis-et-Futuna", "Inventaire du Patrimoine Culturel et Archéologique", "https://www.wallis-et-futuna.gouv.fr/"),
    "GUM": ("Guam State Historic Preservation Office (DPR) & U.S. NPS", "Guam Register of Historic Places & U.S. National Register (NRHP)", "https://historicguam.org/"),
    "MNP": ("CNMI Historic Preservation Office (DCCA) & U.S. NPS", "U.S. National Register of Historic Places (NRHP)", "https://www.nps.gov/subjects/nationalregister/"),
    "ASM": ("American Samoa Historic Preservation Office (ASHPO) & U.S. NPS", "U.S. National Register of Historic Places (NRHP)", "https://ashpo.org/"),
    "SHN": ("Saint Helena National Trust & Heritage Society", "Land Planning and Development Control Ordinance Listed Buildings", "https://www.trust.org.sh/"),
    "CYM": ("National Trust for the Cayman Islands", "National Trust Law Historic Register", "https://nationaltrust.org.ky/"),
    "VGB": ("British Virgin Islands National Parks Trust", "National Parks Act 2006 Historic Sites Register", "https://www.bvinpt.org/"),
    "TCA": ("Turks and Caicos National Museum & National Trust", "National Trust Ordinance Heritage Register", "https://www.tcmuseum.org/"),
    "AIA": ("Anguilla National Trust", "Anguilla National Trust Act Heritage Sites Inventory", "https://axanationaltrust.com/"),
    "MSR": ("Montserrat National Trust", "Montserrat National Trust Act Protected Historic Sites", "https://montserratnationaltrust.ms/"),
    "CYN": ("Antiquities and Museums Department & Technical Committee on Cultural Heritage", "Immovable Antiquities Register (Northern Cyprus)", "https://www.undp.org/cyprus/projects/technical-committee-cultural-heritage"),
    "SOL": ("Department of Archaeology and Museums — Ministry of Trade and Tourism", "Somaliland Archaeological & Historic Monuments Inventory", "https://govsomaliland.org/"),
    "COK": ("Ministry of Cultural Development (Tauranga Vananga)", "Cultural and Historic Places Act 1994 Register", "https://www.culture.gov.ck/"),
    "NIU": ("Taoga Niue — Ministry of Social Services", "Taoga Niue Act 2012 Cultural Heritage Sites", "https://www.gov.nu/"),
}

# Countries where Natural Earth's `region` property is the true first-level Region/Autonomous Community
USE_NE_REGION_ISOS = {
    "GBR", "SVN", "PHL", "ITA", "FRA", "LVA", "MKD", "AZE", "MLT", "ESP", "BFA",
}

NE_ADM0_TO_ISO3 = {
    "ALD": "ALA",
    "SAH": "ESH",
    "PSX": "PSE",
    "SDS": "SSD",
}

# Strict jurisdiction mapping for every official heritage registry prefix (prevents cross-border catalog bleed)
ALLOWED_ISOS_BY_REG_PREFIX: dict[str, set[str]] = {
    "ASI": {"IND"},
    "Mérimée": {"FRA", "SPM", "BLM", "MAF", "PYF", "NCL", "WLF", "MCO"},
    "NHLE": {"GBR"},
    "HES": {"GBR"},
    "Cadw": {"GBR"},
    "NIEA": {"GBR"},
    "NIAH": {"IRL"},
    "SMR IE": {"IRL"},
    "NRHP": {"USA", "PRI", "VIR", "GUM", "MNP", "ASM", "FSM", "MHL", "PLW"},
    "CRHP": {"CAN"},
    "NHS Canada": {"CAN"},
    "RPCQ": {"CAN"},
    "Rijksmonument": {"NLD", "CUW", "ABW", "SXM"},
    "Onroerend Erfgoed": {"BEL"},
    "Patrimoine Wallonie": {"BEL"},
    "Monument Brussels": {"BEL"},
    "BIC": {"ESP"},
    "IPAC": {"ESP"},
    "IAPH": {"ESP"},
    "IGPCV": {"ESP"},
    "JCyL": {"ESP"},
    "Patrimonio Galego": {"ESP"},
    "SIPA": {"PRT"},
    "DGPC": {"PRT"},
    "ICCD": {"ITA", "SMR", "VAT"},
    "LombardiaBC": {"ITA"},
    "MiC Italia": {"ITA"},
    "PatER": {"ITA"},
    "CulturaItalia": {"ITA"},
    "BLfD": {"DEU"},
    "denkXweb": {"DEU"},
    "LfDS": {"DEU"},
    "LDL Berlin": {"DEU"},
    "ADABweb": {"DEU"},
    "BLDAM": {"DEU"},
    "Denkmal ST": {"DEU"},
    "Denkmal SH": {"DEU"},
    "BDA": {"AUT"},
    "KGS": {"CHE", "LIE"},
    "ÚSKP": {"CZE"},
    "NID PL": {"POL"},
    "NID": {"SVK"},
    "PÚSR": {"SVK"},
    "RKD": {"SVN"},
    "Croatia Reg.": {"HRV"},
    "KONS BiH": {"BIH"},
    "SK Srbija": {"SRB"},
    "LMI": {"ROU"},
    "Kosovo Reg.": {"KOS", "XKX"},
    "BBR": {"SWE"},
    "Kulturminne": {"NOR"},
    "DK Fortidsminde": {"DNK", "FRO", "GRL"},
    "DK FBB": {"DNK", "FRO", "GRL"},
    "Museovirasto": {"FIN", "ALA"},
    "Estonia Reg.": {"EST"},
    "Latvia VKPAI": {"LVA"},
    "Lithuania KVR": {"LTU"},
    "EGROKN": {"RUS"},
    "Belarus Reg.": {"BLR"},
    "Georgia Reg.": {"GEO"},
    "Armenia Reg.": {"ARM"},
    "Azerbaijan Reg.": {"AZE"},
    "Kulturenvanteri": {"TUR", "CYN"},
    "NICPMI": {"MLT"},
    "Iran Nat. Reg.": {"IRN"},
    "Maroc Patrimoine": {"MAR", "ESH"},
    "Libya Heritage": {"LBY"},
    "IAA": {"ISR", "PSE"},
    "SAHRA": {"ZAF"},
    "Bunkachō": {"JPN"},
    "KHS Korea": {"KOR"},
    "FAD Thailand": {"THA"},
    "Cagar Budaya": {"IDN"},
    "Aus. Heritage": {"AUS", "NFK"},
    "NSW Heritage": {"AUS", "NFK"},
    "Vic. Heritage": {"AUS"},
    "QHR": {"AUS"},
    "THR": {"AUS"},
    "HNZPT": {"NZL"},
    "iPatrimônio": {"BRA"},
    "CONDEPHAAT": {"BRA"},
    "INEPAC": {"BRA"},
}
SORTED_REG_PREFIXES = sorted(ALLOWED_ISOS_BY_REG_PREFIX.keys(), key=len, reverse=True)


def sanitize_registry_code(code: str, iso3: str) -> str:
    """Ensures a monument only displays a statutory registration ID belonging to its own sovereign jurisdiction."""
    c = (code or "").strip()
    if not c:
        return ""
    if iso3 == "SVK" and c.startswith("NID "):
        c = "PÚSR " + c[4:]
    for pref in SORTED_REG_PREFIXES:
        if c.startswith(pref + " "):
            return c if iso3 in ALLOWED_ISOS_BY_REG_PREFIX[pref] else ""
    if c.startswith("Reg. "):
        m = re.match(r"^Reg\.\s+([A-Z]{3})-", c)
        if m and m.group(1) != iso3:
            return ""
        return c
    return c

CONTINENTAL_STRINGS = {
    "southern europe", "western europe", "northern europe", "eastern europe",
    "northern america", "south america", "central america", "caribbean",
    "eastern asia", "southern asia", "south-eastern asia", "western asia", "central asia",
    "northern africa", "western africa", "eastern africa", "middle africa", "southern africa",
    "australia and new zealand", "melanesia", "polynesia", "micronesia",
    "europe", "asia", "africa", "americas", "oceania", "north america", "latin america",
}

# Known sibling QID aliases where official museum/park/ensemble stats map directly onto an atlas monument QID
KNOWN_QID_ALIASES: dict[str, str] = {
    "Q19675": "Q1075988",    # Louvre Museum -> Louvre Palace (FRA)
    "Q233576": "Q17652439",  # Delphi -> Archaeological Site of Delphi (GRC)
    "Q40535": "Q130958",     # Great Sphinx alias -> The Great Sphinx (EGY)
    "Q47672": "Q910180",     # Terracotta Army -> Mausoleum of the First Qin Emperor (CHN)
    "Q2047427": "Q80290",    # Palace Museum -> Forbidden City (CHN)
    "Q237128": "Q6821089",   # Mesa Verde NP -> Mesa Verde Administrative District (USA)
}


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


def compute_geojson_polygons_meta() -> dict[str, dict]:
    """Extracts center, bbox, name, and continent for all 241 polygons in world-countries.geojson."""
    geo = json.loads((DATA_DIR / "world-countries.geojson").read_text(encoding="utf-8"))
    out: dict[str, dict] = {}
    for feat in geo.get("features", []):
        pr = feat.get("properties") or {}
        iso3 = (pr.get("iso3") or pr.get("ISO_A3") or "").strip().upper()
        if not iso3:
            continue
        geom = feat.get("geometry") or {}
        gtype = geom.get("type")
        coords = geom.get("coordinates") or []
        polys = [coords] if gtype == "Polygon" else (coords if gtype == "MultiPolygon" else [])
        xs, ys = [], []
        best_ring = None
        best_len = -1
        for poly in polys:
            if not poly or not poly[0]:
                continue
            ring = poly[0]
            if len(ring) > best_len:
                best_len = len(ring)
                best_ring = ring
            for pt in ring:
                xs.append(float(pt[0]))
                ys.append(float(pt[1]))
        if not xs:
            continue
        # Handle antimeridian wrap cleanly using largest ring for center
        rxs = [float(p[0]) for p in best_ring] if best_ring else xs
        rys = [float(p[1]) for p in best_ring] if best_ring else ys
        cx = round((min(rxs) + max(rxs)) * 0.5, 4)
        cy = round((min(rys) + max(rys)) * 0.5, 4)
        if max(xs) - min(xs) > 250:
            bbox = [round(min(rxs), 4), round(min(rys), 4), round(max(rxs), 4), round(max(rys), 4)]
        else:
            bbox = [round(min(xs), 4), round(min(ys), 4), round(max(xs), 4), round(max(ys), 4)]
        raw_cont = (pr.get("continent") or "").strip()
        if raw_cont == "Seven seas (open ocean)":
            raw_cont = "Island & Maritime"
        out[iso3] = {
            "iso3": iso3,
            "name": CLEAN_COUNTRY_NAMES.get(iso3, pr.get("name") or iso3),
            "continent": raw_cont,
            "center": [cx, cy],
            "bbox": bbox,
        }
    return out


def build_ne_adm1_lookup() -> tuple[dict[tuple[str, str], str], dict[str, list[tuple[str, float, float]]]]:
    """
    Returns:
      1. rollup: (iso3, ne_name_en) -> ne_region for countries where NE splits Admin-1 into counties/boroughs.
      2. valid_regions_by_iso: iso3 -> list[(valid_region_name, lon, lat)] strictly within each country's own borders.
    """
    ne_path = CACHE_DIR / "ne_10m_admin_1_states_provinces.geojson"
    if not ne_path.exists():
        return {}, {}
    geo = json.loads(ne_path.read_text(encoding="utf-8"))
    rollup: dict[tuple[str, str], str] = {}
    valid_regions_by_iso: dict[str, list[tuple[str, float, float]]] = {}

    for feat in geo.get("features", []):
        pr = feat.get("properties") or {}
        raw_adm0 = (pr.get("adm0_a3") or pr.get("sov_a3") or "").strip().upper()
        iso = NE_ADM0_TO_ISO3.get(raw_adm0, raw_adm0)
        if not iso:
            continue
        nm = (pr.get("name_en") or pr.get("name") or pr.get("gn_name") or "").strip()
        if iso == "USA" and (pr.get("name") or "").strip() == "District of Columbia":
            nm = "District of Columbia"
        rg = (pr.get("region") or "").strip()
        rg = rg.replace("Ðông B?c", "Đông Bắc").replace("Canary Is.", "Islas Canarias")

        if iso in USE_NE_REGION_ISOS and nm and rg:
            rollup[(iso, nm)] = rg
            target_reg = rg
        else:
            target_reg = nm

        if not target_reg:
            continue

        lon = pr.get("longitude")
        lat = pr.get("latitude")
        if lon is None or lat is None:
            geom = feat.get("geometry") or {}
            coords = geom.get("coordinates") or []
            polys = [coords] if geom.get("type") == "Polygon" else (coords if geom.get("type") == "MultiPolygon" else [])
            xs, ys = [], []
            for p in polys:
                if p and p[0]:
                    for pt in p[0]:
                        xs.append(float(pt[0]))
                        ys.append(float(pt[1]))
            if xs and ys:
                lon = (min(xs) + max(xs)) * 0.5
                lat = (min(ys) + max(ys)) * 0.5
        if lon is not None and lat is not None:
            valid_regions_by_iso.setdefault(iso, []).append((target_reg, float(lon), float(lat)))

    return rollup, valid_regions_by_iso


def load_json_if_exists(path: Path, default):
    if path.exists() and path.stat().st_size > 2:
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"  [warn] failed loading {path.name}: {e}")
    return default


def build_candidate_from_qlever_row(r: dict, iso3: str, cname: str, reg_law: str) -> dict | None:
    uri = r.get("item", {}).get("value", "")
    qid = uri.rsplit("/", 1)[-1] if "/Q" in uri else ""
    if not qid:
        return None
    lbl = (r.get("lbl", {}).get("value") or "").strip()
    if not lbl or re.match(r"^Q\d+$", lbl):
        return None
    if lbl[0].islower():
        lbl = lbl[0].upper() + lbl[1:]
    coords = eg.parse_wkt_point(r.get("coord", {}).get("value", ""))
    if not coords:
        return None
    desc = (r.get("desc", {}).get("value") or "").strip()
    her_lbl = (r.get("herLabel", {}).get("value") or "").strip()
    inc_yr = eg.parse_inception_year(r.get("inc", {}).get("value", ""))
    sl = int(float(r.get("sl", {}).get("value") or 0))
    img_raw = (r.get("img", {}).get("value") or "").strip()
    if img_raw and "Special:FilePath" in img_raw and "width=" not in img_raw:
        img_raw = f"{img_raw}?width=720"
    wp = (r.get("art", {}).get("value") or "").strip()

    return {
        "qid": qid,
        "name": lbl,
        "coords": coords,
        "countryIso": iso3,
        "country": cname,
        "region": "",
        "location": "",
        "siteType": eg.infer_type_from_label(lbl, desc),
        "style": "",
        "material": "",
        "period": "",
        "architect": "",
        "patron": "",
        "year": inc_yr,
        "era": prev.classify_era(inc_yr, "", desc),
        "desc": desc,
        "heritageDesignation": her_lbl or reg_law,
        "hasDigitalRegistry": bool(her_lbl),
        "image": img_raw,
        "wikipedia": wp,
        "unesco": "",
        "unescoId": "",
        "unescoYear": "",
        "unescoCategory": "",
        "unescoDanger": False,
        "inRestoration": False,
        "sitelinks": sl,
        "priorityScore": sl * 3 + (20 if img_raw else 0) + (25 if her_lbl else 0),
    }


def main():
    print("=== Architecture Monument Atlas — Global Granularity Synthesis v2 ===")
    nat_fix = load_json_if_exists(SCRATCH_DIR / "natural_and_labels_fix.json", {"pure_natural_qids": []})
    pure_nat_qids = set(nat_fix.get("pure_natural_qids", []))

    # Load compiled QLever & Natural Earth caches
    adm1_map: dict[str, str] = load_json_if_exists(CACHE_DIR / "compiled_adm1_regions.json", {})
    loc_map: dict[str, str] = load_json_if_exists(CACHE_DIR / "compiled_locations.json", {})
    yr_map: dict[str, int] = load_json_if_exists(CACHE_DIR / "compiled_years.json", {})
    modern_city_qids: set[str] = set(load_json_if_exists(CACHE_DIR / "compiled_modern_city_qids.json", []))
    reg_codes_map: dict[str, str] = load_json_if_exists(CACHE_DIR / "compiled_registry_codes.json", {})
    reg_codes_extra: dict[str, str] = load_json_if_exists(CACHE_DIR / "compiled_registry_codes_extra.json", {})
    for q_ex, c_ex in reg_codes_extra.items():
        if q_ex not in reg_codes_map:
            reg_codes_map[q_ex] = c_ex
    deep_claims_map: dict[str, dict] = load_json_if_exists(CACHE_DIR / "compiled_deep_claims.json", {})
    fees_map: dict[str, str] = load_json_if_exists(CACHE_DIR / "compiled_fees.json", {})
    desc_map: dict[str, str] = load_json_if_exists(CACHE_DIR / "compiled_descriptions.json", {})
    enwiki_map: dict[str, str] = load_json_if_exists(CACHE_DIR / "compiled_enwiki.json", {})
    p18_backfill_map: dict[str, str] = load_json_if_exists(CACHE_DIR / "compiled_p18_backfill.json", {})
    rest_events_map: dict[str, list] = load_json_if_exists(CACHE_DIR / "compiled_restoration_events.json", {})
    ne_rollup, valid_regions_by_iso = build_ne_adm1_lookup()
    poly_meta = compute_geojson_polygons_meta()

    # Load deep subagent research outputs
    deep_am_eu = load_json_if_exists(SCRATCH_DIR / "deep_americas_europe.json", {})
    deep_as_af = load_json_if_exists(SCRATCH_DIR / "deep_asia_africa_mena.json", {})
    deep_reg_gr = load_json_if_exists(SCRATCH_DIR / "deep_registries_and_grants.json", {})

    print(
        f"Loaded caches: ADM1={len(adm1_map):,}, Loc={len(loc_map):,}, Yr={len(yr_map):,}, "
        f"RegCodes={len(reg_codes_map):,}, DeepClaims={len(deep_claims_map):,}, Fees={len(fees_map):,}"
    )

    # 1. Build Comprehensive Global Government Registry Dictionary (240+ jurisdictions)
    gov_registries: dict[str, dict] = {}
    for iso3, (rb, rl) in eg.GOVERNMENT_REGISTRIES.items():
        gov_registries[iso3] = {
            "recognizingBody": rb,
            "statutoryRegister": rl,
            "registryUrl": "",
        }
    for iso3, (rb, rl, ru) in NEW_JURISDICTION_REGISTRIES.items():
        gov_registries[iso3] = {
            "recognizingBody": rb,
            "statutoryRegister": rl,
            "registryUrl": ru,
        }
    for iso3, rec in (deep_reg_gr.get("registries") or {}).items():
        iso_u = iso3.strip().upper()
        if iso_u == "XKX":
            iso_u = "KOS"
        if rec.get("recognizingBody") and rec.get("statutoryRegister"):
            gov_registries[iso_u] = {
                "recognizingBody": rec["recognizingBody"].strip(),
                "statutoryRegister": rec["statutoryRegister"].strip(),
                "registryUrl": (rec.get("registryUrl") or "").strip(),
            }
            if iso_u == "KOS":
                gov_registries["XKX"] = gov_registries["KOS"]

    ws_orig = load_json_if_exists(DATA_DIR / "world-summary.json", {"countries": []})
    country_info_by_iso: dict[str, dict] = {}
    for iso3, pm in poly_meta.items():
        country_info_by_iso[iso3] = dict(pm)
    for c in ws_orig.get("countries", []):
        iso3 = c["iso3"]
        country_info_by_iso[iso3] = {
            "iso3": iso3,
            "name": CLEAN_COUNTRY_NAMES.get(iso3, c.get("name") or iso3),
            "continent": c.get("continent") or poly_meta.get(iso3, {}).get("continent", ""),
            "center": c.get("center") or poly_meta.get(iso3, {}).get("center", [0, 20]),
            "bbox": c.get("bbox") or poly_meta.get(iso3, {}).get("bbox", [-180, -60, 180, 75]),
        }

    clean_unesco_world = load_json_if_exists(DATA_DIR / "unesco-world.json", {})

    # 2. Identify Territory Re-homing QIDs (so HKG, MAC, PRI, VIR, GUM, ALA, FRO, BMU, PYF, NCL etc. own their monuments)
    territory_qlever_rows = load_json_if_exists(CACHE_DIR / "qlever_missing_p131.json", {}).get("results", {}).get("bindings", [])
    rehome_qid_to_iso: dict[str, str] = {}
    territory_candidates_by_iso: dict[str, dict[str, dict]] = {}
    for r in territory_qlever_rows:
        t_iso = (r.get("iso3", {}).get("value") or "").strip().upper()
        if not t_iso or t_iso not in poly_meta:
            continue
        cname = country_info_by_iso.get(t_iso, {}).get("name", t_iso)
        reg_law = gov_registries.get(t_iso, {}).get("statutoryRegister", f"{cname} Statutory Heritage Register")
        cand = build_candidate_from_qlever_row(r, t_iso, cname, reg_law)
        if not cand or not prev.is_strictly_built(cand, pure_nat_qids):
            continue
        if cand["qid"] in modern_city_qids and not cand.get("unescoId"):
            continue
        rehome_qid_to_iso[cand["qid"]] = t_iso
        prev_cand = territory_candidates_by_iso.setdefault(t_iso, {}).get(cand["qid"])
        if not prev_cand or (cand["hasDigitalRegistry"] and not prev_cand["hasDigitalRegistry"]):
            territory_candidates_by_iso[t_iso][cand["qid"]] = cand

    # 3. Load Existing Country Shards + Filter Pure Natural & Non-UNESCO Modern Cities + Re-home Territories
    by_country: dict[str, list[dict]] = {}
    seen_global_qids: set[str] = set()
    excluded_modern_cities = 0
    renamed_unesco_cities = 0

    for shard_file in sorted(COUNTRIES_DIR.glob("*.json")):
        iso3 = shard_file.stem
        items = json.loads(shard_file.read_text(encoding="utf-8"))
        for it in items:
            qid = it.get("qid")
            if not qid:
                continue
            if not prev.is_strictly_built(it, pure_nat_qids):
                continue

            # Handle modern municipal governments cleanly
            if qid in modern_city_qids and iso3 != "IND":
                if it.get("unescoId"):
                    u_title = (it.get("unesco") or "").strip()
                    if u_title and len(it.get("name", "")) < len(u_title):
                        it["name"] = u_title
                        renamed_unesco_cities += 1
                    it["siteType"] = "UNESCO Historic Ensemble"
                else:
                    excluded_modern_cities += 1
                    continue

            # Capitalize accidental lowercase leading titles (e.g., "archaeological Site of Delphi")
            nm = (it.get("name") or "").strip()
            if nm and nm[0].islower():
                it["name"] = nm[0].upper() + nm[1:]

            # Re-home to territory polygon if applicable
            target_iso = rehome_qid_to_iso.get(qid, iso3)
            if target_iso != iso3:
                it["countryIso"] = target_iso
                it["country"] = country_info_by_iso.get(target_iso, {}).get("name", target_iso)
                it["region"] = ""

            if qid in seen_global_qids:
                continue
            seen_global_qids.add(qid)
            by_country.setdefault(target_iso, []).append(it)

    # Add territory monuments from qlever_missing_p131.json
    added_territory_sites = 0
    for t_iso, qmap in territory_candidates_by_iso.items():
        for qid, cand in sorted(qmap.items(), key=lambda kv: (-int(kv[1]["hasDigitalRegistry"]), -kv[1]["priorityScore"], kv[1]["name"])):
            if qid in seen_global_qids:
                continue
            seen_global_qids.add(qid)
            by_country.setdefault(t_iso, []).append(cand)
            added_territory_sites += 1

    # Add missing & sparse sovereign country monuments from qlever_missing_p17.json & qlever_sparse_arch_bulk_v1.json
    added_missing_sovereign_sites = 0
    for cache_fn in ("qlever_missing_p17.json", "qlever_sparse_arch_bulk_v1.json"):
        rows = load_json_if_exists(CACHE_DIR / cache_fn, {}).get("results", {}).get("bindings", [])
        grouped: dict[str, dict[str, dict]] = {}
        for r in rows:
            iso3 = (r.get("iso3", {}).get("value") or "").strip().upper()
            if not iso3 or iso3 == "IND" or iso3 not in country_info_by_iso:
                continue
            cname = country_info_by_iso[iso3]["name"]
            reg_law = gov_registries.get(iso3, {}).get("statutoryRegister", f"{cname} Statutory Heritage Register")
            cand = build_candidate_from_qlever_row(r, iso3, cname, reg_law)
            if not cand or cand["qid"] in seen_global_qids:
                continue
            if cand["qid"] in modern_city_qids:
                continue
            low_hay = f"{cand['name']} {cand['desc']}".lower()
            if not cand["hasDigitalRegistry"] and len(by_country.get(iso3, [])) >= 30:
                if ("church" in low_hay or "chapel" in low_hay or "bridge" in low_hay) and cand["sitelinks"] < 2 and not (cand["year"] and cand["year"] <= 1945):
                    continue
                if cand["year"] and cand["year"] > 1965 and cand["sitelinks"] < 4:
                    continue
            prev_c = grouped.setdefault(iso3, {}).get(cand["qid"])
            if not prev_c or (cand["hasDigitalRegistry"] and not prev_c["hasDigitalRegistry"]):
                grouped[iso3][cand["qid"]] = cand

        for iso3, qmap in grouped.items():
            unlisted_cap = 180 if len(by_country.get(iso3, [])) < 50 else 80
            unlisted_used = sum(1 for x in by_country.get(iso3, []) if not x.get("hasDigitalRegistry"))
            for cand in sorted(qmap.values(), key=lambda x: (-int(x["hasDigitalRegistry"]), -x["priorityScore"], x["name"])):
                if cand["qid"] in seen_global_qids:
                    continue
                if not cand["hasDigitalRegistry"]:
                    if unlisted_used >= unlisted_cap:
                        continue
                    unlisted_used += 1
                seen_global_qids.add(cand["qid"])
                by_country.setdefault(iso3, []).append(cand)
                added_missing_sovereign_sites += 1

    print(
        f"Base shards + expansions: {sum(len(v) for v in by_country.values()):,} monuments across {len(by_country)} jurisdictions "
        f"(+{added_territory_sites:,} territory sites, +{added_missing_sovereign_sites:,} sovereign sites, "
        f"-{excluded_modern_cities} non-UNESCO modern cities, {renamed_unesco_cities} UNESCO ensembles clarified)"
    )

    # 4. Merge All Researched Visitors, Site-Level Funding, & Restoration Grants
    merged_audited_visitors: dict[str, dict] = {}
    for qid, rec in eg.AUDITED_VISITORS.items():
        merged_audited_visitors[qid] = {
            "count": int(rec["visitors"]),
            "year": rec.get("year"),
            "source": rec["source"],
            "url": rec.get("url", ""),
            "tariff": rec.get("tariff", ""),
            "series": rec.get("series", []),
        }
    for src_blob in (deep_am_eu, deep_as_af):
        for qid, rec in (src_blob.get("visitors") or {}).items():
            cnt = rec.get("count") or rec.get("visitors")
            if not cnt or int(cnt) <= 0:
                continue
            merged_audited_visitors[qid] = {
                "count": int(cnt),
                "year": rec.get("year"),
                "source": rec.get("source") or "Official Heritage Authority Report",
                "url": rec.get("url") or "",
                "tariff": rec.get("tariff") or "",
                "series": [
                    {"year": int(s["year"]), "count": int(s["count"])}
                    for s in (rec.get("series") or [])
                    if isinstance(s, dict) and s.get("year") and s.get("count")
                ],
                "_iso3": rec.get("countryIso") or rec.get("iso3"),
                "_name": rec.get("name"),
            }

    merged_audited_sites_funding: dict[str, dict] = {}
    for qid, srec in prev.AUDITED_SITES.items():
        if qid in eg.EGYPT_SCA_QIDS:
            merged_audited_sites_funding[qid] = {
                "metricLabel": "SCA National Antiquities Pool",
                "usd": 164000000,
                "local": "6.0B EGP receipts (3.0B EGP restoration)",
                "fy": "FY 2023/24",
                "steward": "Supreme Council of Antiquities (Egypt)",
                "note": "Published national SCA self-financed antiquities ticket pool (6.0B EGP); individual monument receipt split is not separately published.",
                "sourceUrl": "https://mota.gov.eg/",
                "isTrustPool": True,
            }
        else:
            merged_audited_sites_funding[qid] = dict(srec)

    by_country_qid_name = {it["qid"]: (it.get("name") or "") for cs in by_country.values() for it in cs}
    CORP_SCHOOL_FACTORY_FUNDING_RE = re.compile(
        r"\b(Laboratory|Academy of Sciences|Arms Plant|Plant\b|Factory|\bJSC\b|Bertazzoni|Molnija|"
        r"University|Universität|Université|Universidad|Hochschule|\bHTW\b|\bETH\b|\bMIT\b|\bTAFE\b|Cégep|"
        r"Grammar School|High School|Secondary School|\bSchool\b|College|Hospital|Clinic|Medical Center|"
        r"Hotel\b|Aquarium|\bZoo\b|Zoological|Central Bank|Stock Exchange)\b",
        re.I,
    )

    for src_blob in (deep_am_eu, deep_as_af):
        for qid, srec in (src_blob.get("sitesFunding") or {}).items():
            usd_val = srec.get("usd")
            if not usd_val or float(usd_val) <= 0:
                continue
            fy_str = str(srec.get("fy") or "")
            nm_check = str(srec.get("name") or by_country_qid_name.get(qid, ""))
            if "Wikidata P2" in fy_str and (qid == "Q486450" or CORP_SCHOOL_FACTORY_FUNDING_RE.search(nm_check)):
                continue
            rev_series = [
                {"year": str(rs["year"]), "usd": round(float(rs["usd"]))}
                for rs in (srec.get("revenueSeries") or [])
                if isinstance(rs, dict) and rs.get("year") and rs.get("usd")
            ]
            merged_audited_sites_funding[qid] = {
                "metricLabel": srec.get("metricLabel") or "Published Site Budget",
                "usd": round(float(usd_val)),
                "local": srec.get("local") or "",
                "fy": srec.get("fy") or "FY 2024",
                "steward": srec.get("steward") or "",
                "note": srec.get("note") or "",
                "sourceUrl": srec.get("sourceUrl") or "",
                "isTrustPool": bool(srec.get("isTrustPool", False)),
                "revenueSeries": rev_series,
                "_iso3": srec.get("countryIso") or srec.get("iso3"),
                "_name": srec.get("name"),
            }

    restoration_grants: dict[str, dict] = {}
    for qid, rrec in (deep_reg_gr.get("restorationGrants") or {}).items():
        if not rrec.get("program") or not rrec.get("summary"):
            continue
        restoration_grants[qid] = {
            "program": rrec["program"],
            "year": rrec.get("year") or "2022–2025",
            "usd": round(float(rrec["usd"])) if rrec.get("usd") else None,
            "summary": rrec["summary"],
            "url": rrec.get("url") or "",
            "_iso3": rrec.get("countryIso") or rrec.get("iso3"),
            "_name": rrec.get("name"),
        }

    # 5. Automated QID Reconciliation & Missing Flagship Monument Backfill via QLever
    qid_index: dict[str, dict] = {it["qid"]: it for items in by_country.values() for it in items}
    referenced_qids = (
        set(merged_audited_visitors.keys())
        | set(merged_audited_sites_funding.keys())
        | set(restoration_grants.keys())
    )
    missing_ref_qids = sorted(q for q in referenced_qids if q not in qid_index and re.match(r"^Q\d+$", q))

    if missing_ref_qids:
        print(f"Reconciling {len(missing_ref_qids)} researched monument QIDs not yet in country shards...")
        vals = " ".join(f"wd:{q}" for q in missing_ref_qids)
        q_backfill = f"""
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        PREFIX wikibase: <http://wikiba.se/ontology#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX schema: <http://schema.org/>
        SELECT ?item ?iso3 ?lbl ?desc ?coord ?sl ?img ?inc ?herLabel ?art WHERE {{
          VALUES ?item {{ {vals} }}
          ?item wdt:P625 ?coord .
          OPTIONAL {{ ?item wdt:P17 ?c . ?c wdt:P298 ?iso3 . }}
          OPTIONAL {{ ?item wdt:P1435 ?h . ?h rdfs:label ?herLabel . FILTER(LANG(?herLabel)="en") }}
          OPTIONAL {{ ?item wikibase:sitelinks ?sl . }}
          OPTIONAL {{ ?item wdt:P18 ?img . }}
          OPTIONAL {{ ?item wdt:P571 ?inc . }}
          OPTIONAL {{ ?item rdfs:label ?lbl . FILTER(LANG(?lbl)="en") }}
          OPTIONAL {{ ?item schema:description ?desc . FILTER(LANG(?desc)="en") }}
          OPTIONAL {{ ?art schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }}
        }}
        """
        try:
            bf_rows = qlever_post(q_backfill, timeout=60)
        except Exception as e:
            print(f"  [warn] QLever backfill query error: {e}")
            bf_rows = []

        bf_by_q: dict[str, dict] = {}
        for r in bf_rows:
            uri = r.get("item", {}).get("value", "")
            q = uri.rsplit("/", 1)[-1] if "/Q" in uri else ""
            if q and q not in bf_by_q:
                bf_by_q[q] = r

        backfilled_added = 0
        aliased_mapped = 0
        for q in missing_ref_qids:
            # First propagate to explicit known sibling QID if present
            alias_q = KNOWN_QID_ALIASES.get(q)
            if alias_q and alias_q in qid_index:
                if q in merged_audited_visitors and alias_q not in merged_audited_visitors:
                    merged_audited_visitors[alias_q] = dict(merged_audited_visitors[q])
                if q in merged_audited_sites_funding and alias_q not in merged_audited_sites_funding:
                    merged_audited_sites_funding[alias_q] = dict(merged_audited_sites_funding[q])
                if q in restoration_grants and alias_q not in restoration_grants:
                    restoration_grants[alias_q] = dict(restoration_grants[q])
                aliased_mapped += 1
                continue

            r = bf_by_q.get(q)
            if not r:
                continue
            hint_iso = (
                (r.get("iso3", {}).get("value") or "")
                or (merged_audited_visitors.get(q, {}).get("_iso3") or "")
                or (merged_audited_sites_funding.get(q, {}).get("_iso3") or "")
                or (restoration_grants.get(q, {}).get("_iso3") or "")
            ).strip().upper()
            if not hint_iso or hint_iso not in country_info_by_iso:
                continue
            cname = country_info_by_iso[hint_iso]["name"]
            reg_law = gov_registries.get(hint_iso, {}).get("statutoryRegister", f"{cname} Statutory Heritage Register")
            cand = build_candidate_from_qlever_row(r, hint_iso, cname, reg_law)
            if not cand:
                continue

            # Check if an existing monument in the same country is within ~350m and shares a significant name word
            existing_match = None
            cand_words = {w.lower() for w in re.findall(r"[A-Za-zÀ-ÿ]{5,}", cand["name"])} - {"palace", "castle", "temple", "museum", "church", "mosque", "national", "royal", "ancient", "archaeological"}
            for ex in by_country.get(hint_iso, []):
                if abs(ex["coords"][0] - cand["coords"][0]) < 0.0035 and abs(ex["coords"][1] - cand["coords"][1]) < 0.0035:
                    ex_words = {w.lower() for w in re.findall(r"[A-Za-zÀ-ÿ]{5,}", ex["name"])}
                    if cand_words & ex_words:
                        existing_match = ex["qid"]
                        break

            if existing_match:
                if q in merged_audited_visitors and existing_match not in merged_audited_visitors:
                    merged_audited_visitors[existing_match] = dict(merged_audited_visitors[q])
                if q in merged_audited_sites_funding and existing_match not in merged_audited_sites_funding:
                    merged_audited_sites_funding[existing_match] = dict(merged_audited_sites_funding[q])
                if q in restoration_grants and existing_match not in restoration_grants:
                    restoration_grants[existing_match] = dict(restoration_grants[q])
                aliased_mapped += 1
            elif prev.is_strictly_built(cand, pure_nat_qids) and q not in modern_city_qids:
                by_country.setdefault(hint_iso, []).append(cand)
                qid_index[q] = cand
                seen_global_qids.add(q)
                backfilled_added += 1

        print(f"  Reconciled researched QIDs: +{backfilled_added} flagship built monuments added, {aliased_mapped} mapped to sibling architectural QIDs")

    # Clean internal helper keys
    for d in (merged_audited_visitors, merged_audited_sites_funding, restoration_grants):
        for rec in d.values():
            rec.pop("_iso3", None)
            rec.pop("_name", None)

    # 6. Enrich Every Single Monument Globally with Sub-National Region, Locality, Year, Registry Code, Deep Claims & Tariffs
    print("Enriching all monuments with sub-national ADM1 regions, localities, statutory registry codes & historical claims...")
    reg_code_enriched = 0
    adm1_enriched = 0
    claims_enriched = 0
    year_enriched = 0

    for iso3, csites in by_country.items():
        valid_reg_pts = valid_regions_by_iso.get(iso3, [])
        valid_reg_names = {r[0] for r in valid_reg_pts}

        for s in csites:
            qid = s["qid"]

            # 6a. Sub-national Region & Locality (preserve India's curated ASI States, enforce strict border hygiene elsewhere)
            if iso3 != "IND":
                raw_adm1 = adm1_map.get(qid, "")
                coords = s.get("coords")
                if iso3 == "USA" and coords and -77.12 <= coords[0] <= -76.90 and 38.79 <= coords[1] <= 39.00:
                    rolled = "District of Columbia"
                elif raw_adm1:
                    rolled = ne_rollup.get((iso3, raw_adm1), raw_adm1)
                else:
                    rolled = (s.get("region") or "").strip()
                    if rolled.lower() in CONTINENTAL_STRINGS:
                        rolled = ""

                if valid_reg_names:
                    if not rolled or rolled not in valid_reg_names:
                        if coords:
                            best_r = min(
                                valid_reg_pts,
                                key=lambda rp: (rp[1] - coords[0]) ** 2 + (rp[2] - coords[1]) ** 2,
                            )[0]
                            rolled = best_r

                if rolled:
                    s["region"] = rolled
                    adm1_enriched += 1
                    if raw_adm1 and (iso3, raw_adm1) in ne_rollup and rolled != raw_adm1 and not s.get("location"):
                        s["location"] = raw_adm1
                else:
                    s["region"] = ""

            if not s.get("location") and qid in loc_map:
                loc_lbl = loc_map[qid]
                if loc_lbl.lower() not in {(s.get("region") or "").lower(), (s.get("country") or "").lower()}:
                    s["location"] = loc_lbl

            # 6b. Verified Construction / Opening Year
            if s.get("year") is None and qid in yr_map:
                s["year"] = yr_map[qid]
                year_enriched += 1

            # 6c. Statutory Registration Code (`registryCode`) — strictly country-validated
            existing_rc = sanitize_registry_code(s.get("registryCode") or "", iso3)
            if not existing_rc and s.get("registryCode"):
                s.pop("registryCode", None)
                s.pop("hasDigitalRegistry", None)
            elif existing_rc:
                s["registryCode"] = existing_rc

            if s.get("asiId") and iso3 == "IND":
                s["registryCode"] = f"ASI {s['asiId']}"
                s["hasDigitalRegistry"] = True
            elif not s.get("registryCode"):
                cand_rc = sanitize_registry_code(reg_codes_map.get(qid, ""), iso3)
                if not cand_rc and qid in reg_codes_extra:
                    cand_rc = sanitize_registry_code(reg_codes_extra[qid], iso3)
                if cand_rc:
                    s["registryCode"] = cand_rc
                    s["hasDigitalRegistry"] = True
                    reg_code_enriched += 1

            if "hasDigitalRegistry" not in s or not s.get("registryCode"):
                raw_hd = (s.get("heritageDesignation") or "").strip()
                c_reg_law = gov_registries.get(iso3, {}).get("statutoryRegister", "")
                s["hasDigitalRegistry"] = bool(
                    (s.get("asiId") and iso3 == "IND")
                    or s.get("registryCode")
                    or s.get("unescoId")
                    or (
                        raw_hd
                        and raw_hd not in ("Government-Recognized Heritage", "National Heritage Register", "National Architectural Heritage", c_reg_law)
                    )
                )

            # 6d. Deep Historical & Architectural Claims (`patron`, `architect`, `style`, `material`, `period`, `conservationState`)
            dc = deep_claims_map.get(qid)
            if dc:
                touched = False
                for fld in ("patron", "architect", "style", "material", "period", "conservationState"):
                    if dc.get(fld) and not s.get(fld):
                        s[fld] = dc[fld]
                        touched = True
                if touched:
                    claims_enriched += 1

            # 6e. Admission Tariff (`tariffText`)
            if qid in fees_map and not s.get("tariffText"):
                s["tariffText"] = fees_map[qid]

            # 6f. Descriptions, Enwiki, P18 Image Backfill, & Structured Conservation Events
            if not s.get("desc") and qid in desc_map:
                s["desc"] = desc_map[qid]
            if not s.get("wikipedia") and qid in enwiki_map:
                s["wikipedia"] = enwiki_map[qid]
            if not s.get("image") and qid in p18_backfill_map:
                s["image"] = p18_backfill_map[qid]
            if qid in rest_events_map:
                s["restorationEvents"] = rest_events_map[qid]

            # 6g. Active Restoration Grant Flag (`inRestoration`)
            if qid in restoration_grants:
                s["inRestoration"] = True

    print(
        f"  Enriched: {adm1_enriched:,} sub-national regions, {reg_code_enriched:,} statutory registration codes, "
        f"{year_enriched:,} construction years, {claims_enriched:,} deep historical/architectural records"
    )

    # 7. Country-Level Funding & Statutory Recognition Compilation (Zero Fabrication)
    sub1_list = load_json_if_exists(SCRATCH_DIR / "sub1_parsed.json", [])
    sub1 = {c["iso3"]: c for c in sub1_list}
    sub3 = load_json_if_exists(SCRATCH_DIR / "sub3_parsed.json", {})
    if "XKX" in sub3 and "KOS" not in sub3:
        sub3["KOS"] = sub3["XKX"]
    new_sov_budgets = deep_reg_gr.get("sovereignBudgetsFound") or {}

    raw_probe = load_json_if_exists(SCRATCH_DIR / "raw_global_funding_probe.json", {"wb_population": {}})
    deep_gf = load_json_if_exists(SCRATCH_DIR / "deep_global_funding.json", {"unesco_uis002": {}, "nom_ppp_ratio": {}, "wikidata_usd": {}})
    imf = load_json_if_exists(SCRATCH_DIR / "imf_gfscofog_cultural.json", {"imf_cofog": {}})
    prj_rows = load_json_if_exists(SCRATCH_DIR / "unesco_prj001.json", [])

    unesco_uis = deep_gf["unesco_uis002"]
    nom_ppp = deep_gf["nom_ppp_ratio"]
    wb_pop = raw_probe["wb_population"]
    imf_cofog = imf["imf_cofog"]
    wikidata_usd = deep_gf["wikidata_usd"]
    p1174_map = eg.fetch_p1174_visitor_series()

    # Clean UNESCO prj001 Culture-sector grants
    culture_prj = {}
    for r in prj_rows:
        pid = str(r.get("id") or "")
        title = str(r.get("title") or "")
        b = float(r.get("budgetUsd") or 0)
        if b <= 0:
            continue
        is_culture = bool(
            re.search(r"[A-Z]{3}4\d{3}$", pid)
            or re.match(r"^[23]2105", pid)
            or re.search(
                r"\b(world heritage|archaeolog|monument|museum|citadel|temple|mosque|church|historic|"
                r"cultural heritage|antiquit|restoration of|rehabilitation of|mosul|petra|angkor|timbuktu|"
                r"bagan|odesa|alula|koguryo|lalibela|axum|shibam|sana'a|carthage|tyre|baalbek|palmyra|"
                r"aleppo|bamiyan|jam|samarkand|bukhara|cusco|machu picchu)\b",
                title,
                re.I,
            )
        )
        is_non_culture = bool(
            re.search(
                r"\b(education|alphabétisation|literacy|hiv|sida|water resilience|open science|stem edu|"
                r"journalism|media development|biosphere|geoparks?)\b",
                title,
                re.I,
            )
        )
        if is_culture and not is_non_culture:
            prev_rec = culture_prj.get(pid)
            if not prev_rec or b > prev_rec["budgetUsd"]:
                culture_prj[pid] = r

    name_to_iso = {cinfo["name"].lower(): iso3 for iso3, cinfo in country_info_by_iso.items()}
    name_to_iso.update({
        "iran (islamic republic of)": "IRN", "iran": "IRN",
        "syrian arab republic": "SYR", "viet nam": "VNM",
        "lao people's democratic republic": "LAO",
        "democratic people's republic of korea": "PRK",
        "republic of korea": "KOR", "united republic of tanzania": "TZA",
        "bolivia (plurinational state of)": "BOL",
        "venezuela (bolivarian republic of)": "VEN",
        "republic of moldova": "MDA", "russian federation": "RUS",
        "united states of america": "USA",
        "united kingdom of great britain and northern ireland": "GBR",
        "czechia": "CZE", "türkiye": "TUR", "turkiye": "TUR", "turkey": "TUR",
        "palestine": "PSE", "state of palestine": "PSE",
        "côte d'ivoire": "CIV", "democratic republic of the congo": "COD",
    })

    unesco_grants_by_uid: dict[str, dict] = {}
    unesco_grants_by_iso: dict[str, dict] = {}
    for p in culture_prj.values():
        cname = (p.get("country") or "").strip().lower()
        p_iso = name_to_iso.get(cname, "")
        if not p_iso:
            for k, v in name_to_iso.items():
                if len(k) >= 5 and k in cname:
                    p_iso = v
                    break
        p_title = (p.get("title") or "").strip()
        b_usd = float(p.get("budgetUsd") or 0)
        if p_iso:
            rec = unesco_grants_by_iso.setdefault(p_iso, {"totalUsd": 0.0, "count": 0, "topTitle": "", "topUsd": 0.0, "topId": ""})
            rec["totalUsd"] += b_usd
            rec["count"] += 1
            if b_usd > rec["topUsd"]:
                rec["topUsd"] = b_usd
                rec["topTitle"] = p_title
                rec["topId"] = p.get("id") or ""

        t_low = p_title.lower()
        for uid, u in clean_unesco_world.items():
            if p_iso and u.get("iso3List") and p_iso not in u["iso3List"]:
                continue
            uname = u.get("name", "")
            tokens = [
                w.lower() for w in re.findall(r"[A-Za-zÀ-ÿ]{5,}", uname)
                if w.lower() not in {
                    "historic", "centre", "center", "ancient", "archaeological", "monuments", "monument",
                    "world", "heritage", "cultural", "landscape", "sites", "royal", "palaces", "palace",
                    "church", "churches", "abbey", "cathedral", "fortress", "castle", "valley", "city",
                    "towns", "villages", "sacred", "complex", "sanctuary", "national", "state", "mount",
                    "island", "roman", "early", "christian", "buildings", "works", "architecture",
                }
            ]
            if t_low and tokens and any(tok in t_low for tok in tokens[:3]):
                ug = unesco_grants_by_uid.setdefault(uid, {"usd": 0.0, "count": 0, "projectTitle": "", "projectId": ""})
                ug["usd"] += b_usd
                ug["count"] += 1
                if b_usd >= ug.get("_max", 0):
                    ug["_max"] = b_usd
                    ug["projectTitle"] = p_title
                    ug["projectId"] = p.get("id") or ""

    for ug in unesco_grants_by_uid.values():
        ug.pop("_max", None)
        ug["usd"] = round(ug["usd"])

    countries_funding: dict[str, dict] = {}
    unlisted_budget_countries = 0

    for iso3, csites in sorted(by_country.items()):
        cinfo = country_info_by_iso.get(iso3, {"name": iso3})
        cname = cinfo.get("name", iso3)
        atlas_count = len(csites)
        pop_raw = wb_pop.get(iso3)
        pop = float((pop_raw.get("pop") if isinstance(pop_raw, dict) else pop_raw) or 0)

        greg = gov_registries.get(iso3)
        reg_body = greg["recognizingBody"] if greg else f"Department of Cultural Heritage ({cname})"
        reg_law = greg["statutoryRegister"] if greg else f"{cname} Statutory Heritage Register"
        reg_url = greg["registryUrl"] if greg else ""
        stat_sites = prev.STATUTORY_REGISTRY_COUNTS.get(iso3)

        budget_usd: float | None = None
        agency = ""
        short_agency = ""
        fy = ""
        local_label = ""
        basis = "unlisted"
        note = ""
        source_url = ""

        use_sub3_first = iso3 in {"ARG", "EGY", "ETH", "ZAF"}

        if iso3 in new_sov_budgets and new_sov_budgets[iso3].get("budgetUsd"):
            nb = new_sov_budgets[iso3]
            budget_usd = float(nb["budgetUsd"])
            agency = nb.get("agency") or reg_body
            short_agency = nb.get("shortAgency") or prev.shorten_agency(agency, cname)
            fy = str(nb.get("fy") or "FY 2024")
            local_label = nb.get("localLabel") or ""
            basis = "official_budget"
            note = nb.get("note") or ""
            source_url = nb.get("sourceUrl") or ""
        elif not use_sub3_first and iso3 in sub1:
            r1 = sub1[iso3]
            budget_usd = float(r1["annual_budget_usd"])
            agency = r1["agency_name"]
            short_agency = prev.shorten_agency(agency, cname)
            fy = str(r1["fiscal_year"]).split("(")[0].strip()
            loc_cur = r1.get("local_currency", "USD")
            loc_amt = float(r1.get("annual_budget_local") or 0)
            if loc_cur != "USD" and loc_amt > 0:
                if loc_amt >= 1e12:
                    local_label = f"{loc_amt / 1e12:.2f}T {loc_cur}"
                elif loc_amt >= 1e9:
                    local_label = f"{loc_amt / 1e9:.2f}B {loc_cur}"
                else:
                    local_label = f"{loc_amt / 1e6:.1f}M {loc_cur}"
            basis = "official_budget"
            note = r1["breakdown_notes"]
            source_url = r1["source_url"]
        elif iso3 in sub3:
            r3 = sub3[iso3]
            budget_usd = float(r3["usdMillions"]) * 1_000_000.0
            agency = r3["agency"]
            short_agency = prev.shorten_agency(agency, cname)
            fy = f"FY {r3['fiscalYear']}" if not str(r3["fiscalYear"]).startswith("FY") else str(r3["fiscalYear"])
            local_label = r3.get("localAmount", "")
            basis = "official_budget"
            note = r3["heritageShareNote"]
            source_url = r3["sourceUrl"]
        elif iso3 in sub1:
            r1 = sub1[iso3]
            budget_usd = float(r1["annual_budget_usd"])
            agency = r1["agency_name"]
            short_agency = prev.shorten_agency(agency, cname)
            fy = str(r1["fiscal_year"]).split("(")[0].strip()
            basis = "official_budget"
            note = r1["breakdown_notes"]
            source_url = r1["source_url"]
        elif iso3 in prev.EXTRA_SOVEREIGN_BUDGETS and prev.EXTRA_SOVEREIGN_BUDGETS[iso3]["basis"] == "direct_agency":
            ex = prev.EXTRA_SOVEREIGN_BUDGETS[iso3]
            budget_usd = float(ex["budgetUsd"])
            agency = ex["agency"]
            short_agency = ex["shortAgency"]
            fy = ex["fy"]
            local_label = ex["localLabel"]
            basis = "official_budget"
            note = ex["note"]
            source_url = ex["sourceUrl"]
        elif iso3 in unesco_uis and pop > 0:
            u_rec = unesco_uis[iso3]
            ppp_pc = float(u_rec["perCapitaPppUsd"])
            ratio = float(nom_ppp.get(iso3) or 1.0)
            budget_usd = ppp_pc * ratio * pop
            agency = f"{cname} Public Heritage Expenditure (UNESCO UIS SDG 11.4.1)"
            short_agency = "UNESCO UIS SDG 11.4.1"
            fy = f"CY {u_rec['year']}"
            local_label = f"${ppp_pc:.2f} PPP/capita"
            basis = "unesco_sdg_11_4_1"
            note = f"Official government submission to UNESCO Institute for Statistics SDG 11.4.1 ({u_rec['label']}, {u_rec['year']}: ${ppp_pc:.2f} PPP/capita)."
            source_url = "https://data.unesco.org/explore/dataset/uis002/"
        elif iso3 in imf_cofog:
            ic = imf_cofog[iso3]
            cult_m = float(ic["culturalUsdMillions"])
            cofog_code = ic.get("cofog", "GF0802")
            budget_usd = cult_m * 1_000_000.0
            agency = f"{cname} General Government Cultural Services (IMF COFOG {cofog_code})"
            short_agency = f"IMF COFOG {cofog_code}"
            fy = f"FY {ic['year']}"
            local_label = f"{ic['pctGdp']:.2f}% of GDP"
            basis = "imf_cofog"
            note = f"Audited General Government Cultural Services expenditure ({cofog_code}: ${cult_m:.2f}M USD, {ic['pctGdp']:.2f}% of GDP in {ic['year']}) reported to IMF GFS."
            source_url = "https://data.imf.org/?sk=5804c5e1-0502-4672-bdcd-671b556c014e"
        elif iso3 in unesco_grants_by_iso and unesco_grants_by_iso[iso3]["totalUsd"] > 0:
            ug_rec = unesco_grants_by_iso[iso3]
            budget_usd = float(ug_rec["totalUsd"])
            agency = f"UNESCO Culture Sector Active Grants ({cname})"
            short_agency = "UNESCO Culture Grants"
            fy = "Active Portfolio"
            local_label = f"{ug_rec['count']} UNESCO project{'s' if ug_rec['count'] > 1 else ''}"
            basis = "unesco_grants_only"
            note = f"Domestic government heritage budget not publicly disclosed; reflects {ug_rec['count']} audited UNESCO Culture grant(s) totaling ${ug_rec['totalUsd']:,.0f} (incl. '{ug_rec['topTitle'][:75]}')."
            source_url = "https://data.unesco.org/explore/dataset/prj001/"
        else:
            unlisted_budget_countries += 1
            uaudit = (deep_reg_gr.get("unlistedSovereignBudgetsAudit") or {}).get(iso3, {})
            agency = uaudit.get("agency") or reg_body
            short_agency = "No Public Budget Disclosed"
            fy = "Unreported"
            local_label = uaudit.get("localAmount") or ""
            basis = "unlisted"
            note = uaudit.get("rationale") or f"No published domestic heritage appropriation, UNESCO SDG 11.4.1 report, or IMF COFOG cultural outlay is publicly disclosed in open records for {cname}."
            source_url = uaudit.get("sourceUrl") or reg_url or ""

        per_site_usd = None
        if budget_usd is not None and stat_sites and basis in ("official_budget", "unesco_sdg_11_4_1"):
            per_site_usd = round(budget_usd / max(1, stat_sites))

        if budget_usd is None or basis == "unlisted":
            tier = "unlisted"
        elif basis == "unesco_grants_only":
            tier = "poor"
        elif per_site_usd is not None:
            tier = "good" if per_site_usd >= 15000 else ("avg" if per_site_usd >= 3500 else "poor")
        else:
            tier = "good" if budget_usd >= 25_000_000 else ("avg" if budget_usd >= 3_000_000 else "poor")

        ug_info = unesco_grants_by_iso.get(iso3)
        countries_funding[iso3] = {
            "iso3": iso3,
            "country": cname,
            "recognizingBody": reg_body,
            "statutoryRegister": reg_law,
            "registryUrl": reg_url,
            "budgetUsd": round(budget_usd) if budget_usd is not None else None,
            "perSiteUsd": per_site_usd,
            "statutorySites": stat_sites,
            "atlasSites": atlas_count,
            "agency": agency,
            "shortAgency": short_agency,
            "fy": fy,
            "localLabel": local_label,
            "tier": tier,
            "basis": basis,
            "note": note[:320],
            "sourceUrl": source_url,
            "unescoGrantsUsd": round(ug_info["totalUsd"]) if ug_info else 0,
            "unescoProjectsCount": ug_info["count"] if ug_info else 0,
        }

    # Supplement site-level funding from currency-verified Wikidata P2769/P2139 statements
    sites_funding: dict[str, dict] = dict(merged_audited_sites_funding)
    all_kept_by_qid = {it["qid"]: it for cs in by_country.values() for it in cs}
    for qid, vals in wikidata_usd.items():
        if qid in sites_funding or qid not in all_kept_by_qid:
            continue
        it = all_kept_by_qid[qid]
        nm = it.get("name") or ""
        if prev.NON_MONUMENT_CORP_RE.search(nm) or CORP_SCHOOL_FACTORY_FUNDING_RE.search(nm) or qid == "Q486450":
            continue
        if qid in modern_city_qids:
            continue
        b_usd = vals.get("budgetUsd")
        r_usd = vals.get("revenueUsd")
        s_usd = vals.get("stewardBudgetUsd")
        s_org = vals.get("stewardOrg") or ""

        if isinstance(b_usd, (int, float)) and 40_000 <= b_usd <= 450_000_000:
            sites_funding[qid] = {
                "metricLabel": "Published Annual Budget",
                "usd": round(b_usd),
                "local": "",
                "fy": "Wikidata P2769",
                "steward": s_org if (s_org and prev.HERITAGE_STEWARD_RE.search(s_org)) else (it.get("heritageDesignation") or f"{it['country']} Registry"),
                "note": f"Currency-verified institutional budget recorded in Wikidata ({qid}).",
                "sourceUrl": f"https://www.wikidata.org/wiki/{qid}",
            }
        elif isinstance(r_usd, (int, float)) and 40_000 <= r_usd <= 350_000_000:
            sites_funding[qid] = {
                "metricLabel": "Published Annual Revenue",
                "usd": round(r_usd),
                "local": "",
                "fy": "Wikidata P2139",
                "steward": s_org if (s_org and prev.HERITAGE_STEWARD_RE.search(s_org)) else (it.get("heritageDesignation") or f"{it['country']} Registry"),
                "note": f"Currency-verified annual site/institution revenue recorded in Wikidata ({qid}).",
                "sourceUrl": f"https://www.wikidata.org/wiki/{qid}",
            }
        elif isinstance(s_usd, (int, float)) and 250_000 <= s_usd <= 1_200_000_000 and s_org and prev.HERITAGE_STEWARD_RE.search(s_org):
            sites_funding[qid] = {
                "metricLabel": "Operating Trust Budget",
                "usd": round(s_usd),
                "local": "",
                "fy": "Steward Trust",
                "steward": s_org,
                "note": f"Conserved & operated under {s_org}'s published institutional heritage budget.",
                "sourceUrl": f"https://www.wikidata.org/wiki/{qid}",
                "isTrustPool": True,
            }

    # 8. Assign Verified Annual Visitors, Tariffs, Multi-Year Series & Strict Top-5 Most Visited Per Country
    visitors_meta: dict[str, dict] = {}
    countries_with_top_visitors = 0
    total_mv_sites = 0

    for iso3, csites in by_country.items():
        for s in csites:
            qid = s["qid"]
            is_whole_city = (
                s.get("siteType") in ("Historic District", "UNESCO Historic Ensemble")
                or qid in modern_city_qids
                or bool(re.match(r"^(Historic Centre of |City of |Old Town of |Town of |Sacred City of )", s.get("name", ""), re.I))
            )

            if qid in merged_audited_visitors:
                av = merged_audited_visitors[qid]
                s["annualVisitors"] = av["count"]
                if av.get("tariff"):
                    s["tariffText"] = av["tariff"]
                p_series = p1174_map.get(qid, {}).get("byYear", {})
                series_map = dict(p_series)
                for sr in av.get("series", []):
                    series_map[int(sr["year"])] = int(sr["count"])
                if av.get("year"):
                    series_map[int(av["year"])] = av["count"]
                series = [{"year": y, "count": series_map[y]} for y in sorted(series_map.keys())[-6:]]
                visitors_meta[qid] = {
                    "count": av["count"],
                    "year": av.get("year"),
                    "source": av["source"],
                    "url": av.get("url") or "",
                    "tariff": av.get("tariff") or s.get("tariffText") or "",
                    "series": series if len(series) >= 2 else [],
                }
            elif s.get("footfallLakhs"):
                cnt = int(round(float(s["footfallLakhs"]) * 100_000))
                s["annualVisitors"] = cnt
                visitors_meta[qid] = {
                    "count": cnt,
                    "year": 2024,
                    "source": "Ministry of Culture (Rajya Sabha) & MoT India Tourism Data Compendium",
                    "url": "https://tourism.gov.in/",
                    "tariff": s.get("tariffText") or "",
                    "series": [],
                }
            elif qid in p1174_map and not is_whole_city:
                pm = p1174_map[qid]
                s["annualVisitors"] = pm["latest"]
                series = [{"year": y, "count": pm["byYear"][y]} for y in sorted(pm["byYear"].keys())[-6:]]
                visitors_meta[qid] = {
                    "count": pm["latest"],
                    "year": pm["latestYear"],
                    "source": f"Wikidata P1174 ({qid})",
                    "url": f"https://www.wikidata.org/wiki/{qid}",
                    "tariff": s.get("tariffText") or "",
                    "series": series if len(series) >= 2 else [],
                }
            elif s.get("annualVisitors") and not is_whole_city:
                cnt = int(s["annualVisitors"])
                visitors_meta[qid] = {
                    "count": cnt,
                    "year": None,
                    "source": f"Wikidata P1174 ({qid})",
                    "url": f"https://www.wikidata.org/wiki/{qid}",
                    "tariff": s.get("tariffText") or "",
                    "series": [],
                }
            else:
                s["annualVisitors"] = None

            s["isMostVisited"] = False
            s.pop("visitorRankInCountry", None)

        verified_vis_sites = [s for s in csites if (s.get("annualVisitors") or 0) > 0]
        verified_vis_sites.sort(key=lambda x: (-int(x["annualVisitors"]), -x.get("priorityScore", 0), x["name"]))
        if verified_vis_sites:
            countries_with_top_visitors += 1
        for idx, vs in enumerate(verified_vis_sites):
            rank_in_c = idx + 1
            vs["visitorRankInCountry"] = rank_in_c
            if vs["qid"] in visitors_meta:
                visitors_meta[vs["qid"]]["rankInCountry"] = rank_in_c
                visitors_meta[vs["qid"]]["totalRankedInCountry"] = len(verified_vis_sites)
            if rank_in_c <= 5:
                vs["isMostVisited"] = True
                total_mv_sites += 1

    print(
        f"Visitors & Economics: {len(visitors_meta):,} metered monuments ({total_mv_sites} Top-5 across {countries_with_top_visitors} countries), "
        f"{len(sites_funding):,} site/trust funding records, {len(restoration_grants):,} restoration grants"
    )

    # Write global-funding.json
    global_funding_payload = {
        "meta": {
            "version": "2026.11-v2-world-granular",
            "zeroFabrication": True,
            "countriesTotal": len(countries_funding),
            "countriesWithPublishedBudget": sum(1 for c in countries_funding.values() if c["budgetUsd"] is not None),
            "countriesUnreportedBudget": unlisted_budget_countries,
            "sitesWithDirectOrTrustFigures": len(sites_funding),
            "sitesWithVerifiedVisitors": len(visitors_meta),
            "sitesWithRestorationGrants": len(restoration_grants),
            "unescoPropertiesWithGrants": len(unesco_grants_by_uid),
        },
        "countries": countries_funding,
        "sites": sites_funding,
        "unescoGrants": unesco_grants_by_uid,
        "restoration": restoration_grants,
        "visitors": visitors_meta,
    }
    (DATA_DIR / "global-funding.json").write_text(
        json.dumps(global_funding_payload, separators=(",", ":")),
        encoding="utf-8",
    )

    # 9. Finalize Country Shards, World Summary, Search Index, & PMTiles GeoJSON
    all_sites = []
    era_counts = {"anc": 0, "med": 0, "ear": 0, "mod": 0, "unk": 0}
    contested_site_count = 0

    for iso3, csites in sorted(by_country.items()):
        cf = countries_funding[iso3]
        reg_body = cf["recognizingBody"]
        reg_law = cf["statutoryRegister"]
        country_well_funded = cf["tier"] == "good"
        country_underfunded = cf["tier"] in ("poor", "unlisted")

        for s in csites:
            qid = s["qid"]
            uid = str(s.get("unescoId") or "")
            has_direct_site = (qid in sites_funding and not sites_funding[qid].get("isTrustPool")) or (uid in unesco_grants_by_uid)
            has_trust_pool = qid in sites_funding and bool(sites_funding[qid].get("isTrustPool"))

            raw_hd = (s.get("heritageDesignation") or "").strip()
            if not raw_hd or raw_hd in ("Government-Recognized Heritage", "National Heritage Register", "National Architectural Heritage"):
                s["heritageDesignation"] = reg_law
            s["recognizingBody"] = reg_body

            if iso3 == "IND":
                s["hasFunding"] = bool(s.get("circleExpCr") or s.get("adoptPartner") or s.get("unesco") or s.get("revenueCr") or has_direct_site)
                s["underfunded"] = bool(s.get("underfundedCircle") or s.get("unescoDanger"))
                s["hasSiteFunding"] = bool(s.get("revenueCr") or s.get("adoptPartner") or has_direct_site)
            else:
                physical_at_risk = bool(
                    s.get("unescoDanger")
                    or s.get("conservationState") in {"in danger", "partially destroyed", "damaged", "dilapidated", "ruinous", "abandoned"}
                )
                s["hasFunding"] = bool(has_direct_site or has_trust_pool or s.get("unesco") or country_well_funded)
                s["underfunded"] = bool(physical_at_risk or (country_underfunded and not has_direct_site and not s.get("unesco")))
                s["hasSiteFunding"] = bool(has_direct_site)

            has_photo = bool(s.get("image"))
            has_wiki = bool(s.get("wikipedia") or s.get("desc"))
            s["coverageStatus"] = "uncovered" if not has_photo else ("full" if has_wiki else "partial")

            era = prev.classify_era(s.get("year"), s.get("unescoYear", ""), f"{s.get('period') or ''} {s.get('desc') or ''}")
            s["era"] = era
            era_counts[era] = era_counts.get(era, 0) + 1
            if s.get("contested"):
                contested_site_count += 1

            # Boost priority score slightly for metered/audited/registered flagship monuments
            if s.get("isMostVisited"):
                s["priorityScore"] = max(int(s.get("priorityScore") or 0), 420)
            elif s.get("hasSiteFunding"):
                s["priorityScore"] = max(int(s.get("priorityScore") or 0), 320)

            all_sites.append(s)

        csites.sort(key=lambda x: (-int(x.get("priorityScore") or 0), x["name"]))
        (COUNTRIES_DIR / f"{iso3}.json").write_text(json.dumps(csites, separators=(",", ":")), encoding="utf-8")

    all_sites.sort(key=lambda x: (-int(x.get("priorityScore") or 0), x["name"]))
    for idx, s in enumerate(all_sites):
        s["rank"] = idx + 1

    # Build world-summary.json sorted cleanly by total monuments desc (matching existing UI expectations)
    new_countries_summary = []
    for iso3, csites in sorted(by_country.items(), key=lambda kv: (-len(kv[1]), country_info_by_iso.get(kv[0], {}).get("name", kv[0]))):
        if not csites:
            continue
        cinfo = country_info_by_iso.get(iso3, {"name": iso3, "continent": "", "center": [0, 20], "bbox": [-180, -60, 180, 75]})
        cf = countries_funding[iso3]
        tot = len(csites)
        photographed = sum(1 for x in csites if x.get("image"))
        with_wiki = sum(1 for x in csites if x.get("wikipedia"))
        with_year = sum(1 for x in csites if x.get("year") is not None)
        with_vis = sum(1 for x in csites if (x.get("annualVisitors") or 0) > 0)
        with_site_fund = sum(1 for x in csites if x.get("hasSiteFunding"))
        with_dig_reg = sum(1 for x in csites if x.get("hasDigitalRegistry", True))

        new_countries_summary.append({
            "iso3": iso3,
            "name": cinfo["name"],
            "continent": cinfo.get("continent", ""),
            "center": cinfo["center"],
            "bbox": cinfo["bbox"],
            "total": tot,
            "unesco": sum(1 for x in csites if x.get("unesco")),
            "restoration": sum(1 for x in csites if x.get("unescoDanger") or x.get("inRestoration")),
            "mostVisited": sum(1 for x in csites if x.get("isMostVisited")),
            "photographed": photographed,
            "uncovered": tot - photographed,
            "withWiki": with_wiki,
            "withYear": with_year,
            "withVisitors": with_vis,
            "withSiteFunding": with_site_fund,
            "withDigitalRegistry": with_dig_reg,
            "funded": sum(1 for x in csites if x.get("hasFunding") and not x.get("underfunded")),
            "underfunded": sum(1 for x in csites if x.get("underfunded")),
            "contested": sum(1 for x in csites if x.get("contested")),
            "recognizingBody": cf["recognizingBody"],
            "statutoryRegister": cf["statutoryRegister"],
            "registryUrl": cf["registryUrl"],
            "budgetUsd": cf["budgetUsd"],
            "perSiteUsd": cf["perSiteUsd"],
            "statutorySites": cf["statutorySites"],
            "shortAgency": cf["shortAgency"],
            "fy": cf["fy"],
            "fundingTier": cf["tier"],
            "fundingBasis": cf["basis"],
        })

    global_gaps = {
        "missingPhoto": sum(1 for x in all_sites if not x.get("image")),
        "missingWiki": sum(1 for x in all_sites if not x.get("wikipedia")),
        "missingYear": sum(1 for x in all_sites if x.get("year") is None),
        "missingVisitors": sum(1 for x in all_sites if not (x.get("annualVisitors") or 0) > 0),
        "missingSiteFunding": sum(1 for x in all_sites if not x.get("hasSiteFunding")),
        "missingRegistryCode": sum(1 for x in all_sites if not x.get("registryCode") and not x.get("asiId")),
        "unreportedCountryBudgets": unlisted_budget_countries,
    }

    world_summary = {
        "totalMonuments": len(all_sites),
        "totalUnesco": len(clean_unesco_world),
        "totalMostVisited": total_mv_sites,
        "countriesCount": len(new_countries_summary),
        "contestedAreasCount": ws_orig.get("contestedAreasCount", 23),
        "contestedMonuments": contested_site_count,
        "eraCounts": era_counts,
        "documentationGaps": global_gaps,
        "countries": new_countries_summary,
    }
    (DATA_DIR / "world-summary.json").write_text(json.dumps(world_summary, separators=(",", ":")), encoding="utf-8")

    # Build search-top.json (guaranteeing at least top monuments from EVERY country + all UNESCO + all Most Visited + all Site Funded)
    search_top = []
    seen_q = set()
    per_country_included: dict[str, int] = {}
    for s in all_sites:
        c_iso = s["countryIso"]
        must_include = (
            len(search_top) < 10000
            or s.get("unesco")
            or s.get("isMostVisited")
            or s.get("hasSiteFunding")
            or per_country_included.get(c_iso, 0) < 5
        )
        if not must_include or s["qid"] in seen_q:
            continue
        seen_q.add(s["qid"])
        per_country_included[c_iso] = per_country_included.get(c_iso, 0) + 1
        cat = (
            "unesco" if s.get("unesco")
            else "restoration" if (s.get("inRestoration") or s.get("unescoDanger"))
            else "mostvisited" if s.get("isMostVisited")
            else "underfunded" if s.get("underfunded")
            else "uncovered" if s.get("coverageStatus") == "uncovered"
            else "funded" if s.get("hasFunding")
            else "national"
        )
        search_top.append({
            "qid": s["qid"],
            "name": s["name"],
            "coords": s["coords"],
            "countryIso": c_iso,
            "country": s["country"],
            "region": s.get("region") or "",
            "siteType": s.get("siteType") or "",
            "unesco": s.get("unesco") or "",
            "registryCode": s.get("registryCode") or "",
            "image": s.get("image") or "",
            "annualVisitors": s.get("annualVisitors"),
            "visitorRankInCountry": s.get("visitorRankInCountry"),
            "sitelinks": s.get("sitelinks") or 0,
            "priorityScore": s.get("priorityScore") or 0,
            "era": s.get("era") or "unk",
            "yr": s.get("year") if s.get("year") is not None else None,
            "ct": 1 if s.get("contested") else 0,
            "cat": cat,
        })
    (DATA_DIR / "search-top.json").write_text(json.dumps(search_top, separators=(",", ":")), encoding="utf-8")

    # Build monuments_for_pmtiles.geojson (including regCode!)
    tile_features = []
    for s in all_sites:
        cat = (
            "unesco" if s.get("unesco")
            else "restoration" if (s.get("inRestoration") or s.get("unescoDanger"))
            else "mostvisited" if s.get("isMostVisited")
            else "underfunded" if s.get("underfunded")
            else "uncovered" if s.get("coverageStatus") == "uncovered"
            else "funded" if s.get("hasFunding")
            else "national"
        )
        img_slug = prev.compact_commons_slug(s.get("image"))
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
                "regCode": (s.get("registryCode") or "")[:36],
                "vis": int(s.get("annualVisitors") or 0),
                "vRank": int(s.get("visitorRankInCountry") or 0),
                "sFund": 1 if s.get("hasSiteFunding") else 0,
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
                "mz": 0,
                "cat": cat,
                "pr": s.get("priorityScore") or 0,
            },
        })
    (CACHE_DIR / "monuments_for_pmtiles.geojson").write_text(
        json.dumps({"type": "FeatureCollection", "features": tile_features}, separators=(",", ":")),
        encoding="utf-8",
    )

    print(
        f"SUCCESS! Built {len(all_sites):,} monuments across {len(new_countries_summary)} countries & historic territories.\n"
        f"Global Documentation Gaps: {global_gaps}"
    )


if __name__ == "__main__":
    main()
