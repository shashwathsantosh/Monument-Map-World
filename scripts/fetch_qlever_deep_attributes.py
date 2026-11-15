#!/usr/bin/env python3
"""
Bulk QLever Offline Harvester for Deep Monument Granularity:
1. Harvests official built/government-recognized monuments across all remaining zero-monument
   and ultra-sparse countries & territories on the globe (using both P17 and P131* for territories).
2. Bulk-harvests 52 official National Statutory Heritage Registry ID properties (Mérimée, NHLE,
   NRHP, BIC, Rijksmonument, Bunkachō, Iran National Heritage, BDA, KGS, EGROKN, SIPA, ICCD, etc.).
3. Bulk-harvests historical patronage (P88/P112), architect (P84), style (P149), material (P186),
   historical period (P2348), and state of conservation (P5816) for instant zero-latency rendering.
4. Bulk-harvests published admission tariffs (P2555 + currency unit).
"""

from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "public" / "data"
CACHE_DIR = ROOT / "scripts" / ".cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

QLEVER_URL = "https://qlever.dev/api/wikidata"
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
    data = json.loads(raw)
    cf.write_text(raw, encoding="utf-8")
    rows = data.get("results", {}).get("bindings", [])
    print(f"  [fetched in {time.time() - t0:.1f}s] {cache_file}: {len(rows):,} rows")
    return rows


# Explicit Wikidata entity QIDs for sovereign states & territories with 0 or <20 monuments
TERRITORY_AND_SPARSE_QIDS: dict[str, str] = {
    # Sovereign UN states currently 0 or ultra-sparse
    "BHS": "Q778",    # Bahamas
    "BRN": "Q921",    # Brunei
    "GIN": "Q1006",   # Guinea
    "GNQ": "Q983",    # Equatorial Guinea
    "KIR": "Q710",    # Kiribati
    "LBR": "Q1014",   # Liberia
    "LCA": "Q760",    # Saint Lucia
    "MCO": "Q235",    # Monaco
    "MDV": "Q826",    # Maldives
    "NRU": "Q697",    # Nauru
    "SLB": "Q685",    # Solomon Islands
    "SSD": "Q958",    # South Sudan
    "TUV": "Q672",    # Tuvalu
    "VCT": "Q757",    # Saint Vincent and the Grenadines
    "WSM": "Q683",    # Samoa
    # Sparse sovereign states (<25 sites)
    "ATG": "Q781",    # Antigua and Barbuda
    "BDI": "Q967",    # Burundi
    "CAF": "Q929",    # Central African Republic
    "COM": "Q970",    # Comoros
    "COG": "Q971",    # Republic of the Congo
    "DMA": "Q784",    # Dominica
    "GAB": "Q1000",   # Gabon
    "GRD": "Q769",    # Grenada
    "KNA": "Q763",    # Saint Kitts and Nevis
    "LSO": "Q1013",   # Lesotho
    "MHL": "Q709",    # Marshall Islands
    "MUS": "Q1027",   # Mauritius
    "MWI": "Q1020",   # Malawi
    "PLW": "Q695",    # Palau
    "PNG": "Q691",    # Papua New Guinea
    "SLE": "Q1044",   # Sierra Leone
    "SMR": "Q238",    # San Marino
    "SWZ": "Q1050",   # Eswatini
    "SYC": "Q1042",   # Seychelles
    "TON": "Q678",    # Tonga
    "VUT": "Q686",    # Vanuatu
    "ZMB": "Q953",    # Zambia
    "ZWE": "Q954",    # Zimbabwe
    "DJI": "Q977",    # Djibouti
    "ERI": "Q986",    # Eritrea
    "GMB": "Q1005",   # The Gambia
    "GNB": "Q1007",   # Guinea-Bissau
    "MRT": "Q1025",   # Mauritania
    "NER": "Q1032",   # Niger
    "TCD": "Q657",    # Chad
    "TGO": "Q945",    # Togo
    "BEN": "Q962",    # Benin
    "BFA": "Q965",    # Burkina Faso
    "RWA": "Q1037",   # Rwanda
    "UGA": "Q1036",   # Uganda
    "TLS": "Q574",    # Timor-Leste
    "FJI": "Q712",    # Fiji
    "GUY": "Q734",    # Guyana
    "SUR": "Q730",    # Suriname
    "TTO": "Q754",    # Trinidad and Tobago
    "JAM": "Q766",    # Jamaica
    "HTI": "Q790",    # Haiti
    # Populated historic territories & micro-regions in world-countries.geojson
    "HKG": "Q8646",   # Hong Kong
    "MAC": "Q14773",  # Macao
    "PRI": "Q1183",   # Puerto Rico
    "BMU": "Q23635",  # Bermuda
    "VIR": "Q11703",  # U.S. Virgin Islands
    "GUM": "Q16635",  # Guam
    "PYF": "Q30971",  # French Polynesia
    "NCL": "Q33788",  # New Caledonia
    "FRO": "Q4628",   # Faroe Islands
    "ALA": "Q5689",   # Åland
    "SHN": "Q192184", # Saint Helena
    "CYM": "Q5785",   # Cayman Islands
    "VGB": "Q25305",  # British Virgin Islands
    "TCA": "Q18221",  # Turks and Caicos
    "AIA": "Q25228",  # Anguilla
    "MSR": "Q13353",  # Montserrat
    "ASM": "Q16641",  # American Samoa
    "MNP": "Q16644",  # Northern Mariana Islands
    "COK": "Q26988",  # Cook Islands
    "NIU": "Q34020",  # Niue
    "WLF": "Q35555",  # Wallis and Futuna
    "SPM": "Q34617",  # Saint Pierre and Miquelon
    "BLM": "Q25362",  # Saint Barthélemy
    "MAF": "Q126125", # Collectivity of Saint Martin
    "SXM": "Q26273",  # Sint Maarten
    "FLK": "Q9648",   # Falkland Islands
    "CYN": "Q23681",  # Northern Cyprus
    "SOL": "Q34754",  # Somaliland
    "ESH": "Q6250",   # Western Sahara
}

# 50 Official Government Heritage Registry ID Properties -> Display Prefix
REGISTRY_PROPS: list[tuple[str, str]] = [
    ("P1371", "ASI"),
    ("P380", "Mérimée"),
    ("P1216", "NHLE"),
    ("P709", "HES"),
    ("P1459", "Cadw"),
    ("P1460", "NIEA"),
    ("P4088", "NIAH"),
    ("P649", "NRHP"),
    ("P477", "CRHP"),
    ("P2526", "NHS Canada"),
    ("P359", "Rijksmonument"),
    ("P1764", "Onroerend Erfgoed"),
    ("P1133", "Patrimoine Wallonie"),
    ("P3600", "Monument Brussels"),
    ("P808", "BIC"),
    ("P1600", "IPAC"),
    ("P3318", "IAPH"),
    ("P1700", "SIPA"),
    ("P1702", "DGPC"),
    ("P9051", "ICCD"),
    ("P3503", "LombardiaBC"),
    ("P4244", "BLfD"),
    ("P1769", "denkXweb"),
    ("P1708", "LfDS"),
    ("P2424", "LDL Berlin"),
    ("P2951", "BDA"),
    ("P381", "KGS"),
    ("P4075", "ÚSKP"),
    ("P7170", "NID"),
    ("P1587", "RKD"),
    ("P11296", "Croatia Reg."),
    ("P4245", "SK Srbija"),
    ("P1770", "LMI"),
    ("P3227", "Kosovo Reg."),
    ("P1260", "BBR"),
    ("P758", "Kulturminne"),
    ("P3596", "DK Fortidsminde"),
    ("P2783", "DK FBB"),
    ("P5310", "Museovirasto"),
    ("P2948", "Estonia Reg."),
    ("P2494", "Latvia VKPAI"),
    ("P10040", "Lithuania KVR"),
    ("P1483", "EGROKN"),
    ("P632", "Belarus Reg."),
    ("P4166", "Georgia Reg."),
    ("P3170", "Armenia Reg."),
    ("P13410", "Azerbaijan Reg."),
    ("P11729", "Kulturenvanteri"),
    ("P1799", "NICPMI"),
    ("P1369", "Iran Nat. Reg."),
    ("P5694", "Maroc Patrimoine"),
    ("P4275", "Bunkachō"),
    ("P1626", "FAD Thailand"),
    ("P3008", "Aus. Heritage"),
    ("P3449", "NSW Heritage"),
    ("P5177", "Vic. Heritage"),
    ("P3728", "HNZPT"),
    ("P4372", "iPatrimônio"),
    ("P5525", "CONDEPHAAT"),
]


def harvest_missing_territories_and_sparse():
    print("1. Harvesting monuments for missing UN states, sparse countries & historic territories...")
    pairs = " ".join(f'(wd:{qid} "{iso}")' for iso, qid in TERRITORY_AND_SPARSE_QIDS.items())
    # Query A: Items matched via wdt:P17 (sovereign country)
    q_p17 = f"""
    PREFIX wd: <http://www.wikidata.org/entity/>
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    PREFIX wikibase: <http://wikiba.se/ontology#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX schema: <http://schema.org/>
    SELECT ?iso3 ?item ?lbl ?desc ?coord ?sl ?img ?inc ?herLabel ?art WHERE {{
      VALUES (?c ?iso3) {{ {pairs} }}
      ?item wdt:P17 ?c ;
            wdt:P625 ?coord .
      {{ ?item wdt:P1435 ?her . }}
      UNION
      {{
        VALUES ?t {{
          wd:Q4989906 wd:Q839954 wd:Q2065736 wd:Q23413 wd:Q57831 wd:Q16560
          wd:Q44539 wd:Q44613 wd:Q5393308 wd:Q32815 wd:Q2977 wd:Q16970
          wd:Q39715 wd:Q1081138 wd:Q34627 wd:Q82117 wd:Q12518 wd:Q1497375
          wd:Q1785071 wd:Q33506 wd:Q12280 wd:Q474741 wd:Q143912 wd:Q570116
        }}
        ?item wdt:P31 ?t .
      }}
      ?item rdfs:label ?lbl . FILTER(LANG(?lbl) = "en")
      OPTIONAL {{ ?item schema:description ?desc . FILTER(LANG(?desc) = "en") }}
      OPTIONAL {{ ?item wikibase:sitelinks ?sl . }}
      OPTIONAL {{ ?item wdt:P18 ?img . }}
      OPTIONAL {{ ?item wdt:P571 ?inc . }}
      OPTIONAL {{ ?item wdt:P1435 ?h2 . ?h2 rdfs:label ?herLabel . FILTER(LANG(?herLabel) = "en") }}
      OPTIONAL {{ ?art schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }}
    }}
    """
    qlever_run(q_p17, "qlever_missing_p17.json", timeout=90)

    # Query B: Sub-sovereign territories matched via wdt:P131+ (HKG, MAC, PRI, BMU, VIR, GUM, PYF, NCL, FRO, ALA, SHN, CYM, etc.)
    sub_territories = {
        k: TERRITORY_AND_SPARSE_QIDS[k]
        for k in [
            "HKG", "MAC", "PRI", "BMU", "VIR", "GUM", "PYF", "NCL", "FRO", "ALA",
            "SHN", "CYM", "VGB", "TCA", "AIA", "MSR", "ASM", "MNP", "COK", "NIU",
            "WLF", "SPM", "BLM", "MAF", "SXM", "FLK", "CYN", "SOL",
        ]
    }
    sub_pairs = " ".join(f'(wd:{qid} "{iso}")' for iso, qid in sub_territories.items())
    q_p131 = f"""
    PREFIX wd: <http://www.wikidata.org/entity/>
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    PREFIX wikibase: <http://wikiba.se/ontology#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX schema: <http://schema.org/>
    SELECT ?iso3 ?item ?lbl ?desc ?coord ?sl ?img ?inc ?herLabel ?art WHERE {{
      VALUES (?c ?iso3) {{ {sub_pairs} }}
      ?item wdt:P131+ ?c ;
            wdt:P625 ?coord .
      {{ ?item wdt:P1435 ?her . }}
      UNION
      {{
        VALUES ?t {{
          wd:Q4989906 wd:Q839954 wd:Q2065736 wd:Q23413 wd:Q57831 wd:Q16560
          wd:Q44539 wd:Q44613 wd:Q5393308 wd:Q32815 wd:Q2977 wd:Q16970
          wd:Q39715 wd:Q1081138 wd:Q34627 wd:Q82117 wd:Q12518 wd:Q1785071
        }}
        ?item wdt:P31 ?t .
      }}
      ?item rdfs:label ?lbl . FILTER(LANG(?lbl) = "en")
      OPTIONAL {{ ?item schema:description ?desc . FILTER(LANG(?desc) = "en") }}
      OPTIONAL {{ ?item wikibase:sitelinks ?sl . }}
      OPTIONAL {{ ?item wdt:P18 ?img . }}
      OPTIONAL {{ ?item wdt:P571 ?inc . }}
      OPTIONAL {{ ?item wdt:P1435 ?h2 . ?h2 rdfs:label ?herLabel . FILTER(LANG(?herLabel) = "en") }}
      OPTIONAL {{ ?art schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }}
    }}
    """
    qlever_run(q_p131, "qlever_missing_p131.json", timeout=90)


def collect_target_qids() -> set[str]:
    qids = set()
    for p in (DATA_DIR / "countries").glob("*.json"):
        for item in json.loads(p.read_text(encoding="utf-8")):
            if item.get("qid"):
                qids.add(item["qid"])
    for cf in ("qlever_missing_p17.json", "qlever_missing_p131.json"):
        fp = CACHE_DIR / cf
        if fp.exists():
            for r in json.loads(fp.read_text(encoding="utf-8")).get("results", {}).get("bindings", []):
                uri = r.get("item", {}).get("value", "")
                if "/Q" in uri:
                    qids.add(uri.rsplit("/", 1)[-1])
    return qids


def harvest_statutory_codes_and_claims(target_qids: set[str]):
    print(f"2. Harvesting official statutory registry IDs across {len(REGISTRY_PROPS)} national registers...")
    reg_out_path = CACHE_DIR / "compiled_registry_codes.json"
    if not reg_out_path.exists():
        reg_by_qid: dict[str, str] = {}
        # Query in 2 fast batches of ~30 properties each, filtering in Python against target_qids
        for b_idx in range(0, len(REGISTRY_PROPS), 30):
            batch = REGISTRY_PROPS[b_idx : b_idx + 30]
            unions = " UNION ".join(
                f'{{ ?item wdt:{pid} ?id . BIND("{prefix}" AS ?pfx) }}'
                for pid, prefix in batch
            )
            q = f"""
            PREFIX wdt: <http://www.wikidata.org/prop/direct/>
            SELECT ?item ?pfx ?id WHERE {{
              ?item wdt:P625 ?coord .
              {unions}
            }}
            """
            rows = qlever_run(q, f"qlever_reg_codes_b{b_idx}.json", timeout=95)
            for r in rows:
                uri = r.get("item", {}).get("value", "")
                qid = uri.rsplit("/", 1)[-1] if "/Q" in uri else ""
                if qid not in target_qids or qid in reg_by_qid:
                    continue
                pfx = r.get("pfx", {}).get("value", "")
                raw_id = (r.get("id", {}).get("value") or "").strip()
                if not raw_id:
                    continue
                # Clean long URIs (like Swedish SOCH URI) to compact trailing code
                if raw_id.startswith("http"):
                    raw_id = raw_id.rstrip("/").rsplit("/", 1)[-1]
                if len(raw_id) <= 28:
                    reg_by_qid[qid] = f"{pfx} {raw_id}"
        reg_out_path.write_text(json.dumps(reg_by_qid, separators=(",", ":")), encoding="utf-8")
        print(f"  Matched statutory government registration numbers for {len(reg_by_qid):,} monuments!")
    else:
        reg_by_qid = json.loads(reg_out_path.read_text(encoding="utf-8"))
        print(f"  [cached] compiled_registry_codes.json: {len(reg_by_qid):,} monuments")

    print("3. Harvesting historical patronage, architect, style, material, period & conservation state...")
    claims_out_path = CACHE_DIR / "compiled_deep_claims.json"
    if not claims_out_path.exists():
        claim_props = [
            ("P88", "patron"),
            ("P112", "foundedBy"),
            ("P84", "architect"),
            ("P149", "style"),
            ("P186", "material"),
            ("P2348", "period"),
            ("P5816", "conservationState"),
        ]
        claims_by_qid: dict[str, dict[str, str]] = {}
        for pid, field in claim_props:
            q = f"""
            PREFIX wdt: <http://www.wikidata.org/prop/direct/>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            SELECT ?item ?lbl WHERE {{
              ?item wdt:P625 ?coord ;
                    wdt:{pid} ?val .
              ?val rdfs:label ?lbl .
              FILTER(LANG(?lbl) = "en")
            }}
            """
            rows = qlever_run(q, f"qlever_claim_{pid}.json", timeout=80)
            matched = 0
            for r in rows:
                uri = r.get("item", {}).get("value", "")
                qid = uri.rsplit("/", 1)[-1] if "/Q" in uri else ""
                if qid not in target_qids:
                    continue
                lbl = (r.get("lbl", {}).get("value") or "").strip()
                if not lbl:
                    continue
                rec = claims_by_qid.setdefault(qid, {})
                if field not in rec:
                    rec[field] = lbl
                    matched += 1
            print(f"    {pid} ({field}): matched {matched:,} monuments in atlas")
        claims_out_path.write_text(json.dumps(claims_by_qid, separators=(",", ":")), encoding="utf-8")
        print(f"  Total monuments enriched with structured historical/architectural claims: {len(claims_by_qid):,}")
    else:
        claims_by_qid = json.loads(claims_out_path.read_text(encoding="utf-8"))
        print(f"  [cached] compiled_deep_claims.json: {len(claims_by_qid):,} monuments")

    print("4. Harvesting published admission fees (P2555)...")
    fees_out_path = CACHE_DIR / "compiled_fees.json"
    if not fees_out_path.exists():
        q_fee = """
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        PREFIX p: <http://www.wikidata.org/prop/>
        PREFIX psv: <http://www.wikidata.org/prop/statement/value/>
        PREFIX wikibase: <http://wikiba.se/ontology#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?item ?amt ?unitLbl WHERE {
          ?item wdt:P625 ?coord ;
                p:P2555 ?stmt .
          ?stmt psv:P2555 ?vn .
          ?vn wikibase:quantityAmount ?amt ;
              wikibase:quantityUnit ?unit .
          ?unit rdfs:label ?unitLbl .
          FILTER(LANG(?unitLbl) = "en")
        }
        """
        rows = qlever_run(q_fee, "qlever_p2555_fees.json", timeout=60)
        fees_by_qid: dict[str, str] = {}
        for r in rows:
            uri = r.get("item", {}).get("value", "")
            qid = uri.rsplit("/", 1)[-1] if "/Q" in uri else ""
            if qid not in target_qids or qid in fees_by_qid:
                continue
            try:
                amt = float(r.get("amt", {}).get("value") or 0)
            except Exception:
                continue
            unit = (r.get("unitLbl", {}).get("value") or "").strip()
            if amt == 0:
                fees_by_qid[qid] = "Free Admission"
            elif amt > 0:
                amt_str = f"{int(amt):,}" if amt == int(amt) else f"{amt:.2f}"
                fees_by_qid[qid] = f"{amt_str} {unit}".strip()
        fees_out_path.write_text(json.dumps(fees_by_qid, separators=(",", ":")), encoding="utf-8")
        print(f"  Matched P2555 admission tariffs for {len(fees_by_qid):,} monuments!")


if __name__ == "__main__":
    harvest_missing_territories_and_sparse()
    all_qids = collect_target_qids()
    print(f"Collected {len(all_qids):,} candidate atlas QIDs")
    harvest_statutory_codes_and_claims(all_qids)
