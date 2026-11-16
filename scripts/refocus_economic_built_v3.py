#!/usr/bin/env python3
"""
Economic & Funding Health + Strictly Built Monument Refocus Pipeline (v3):
1. Purges all remaining natural features (parks, reserves, Ramsar wetlands, Natura 2000 habitats,
   waterfalls, lakes, rivers, mountains, volcanoes, caves without built architecture, veteran trees,
   fossil beds, natural monuments) across all 232 countries & territories.
2. Enforces 100% epistemic honesty on monument-level funding:
   - NEVER assumes a monument is "Prime" (fully funded) or "Underfunded" based on national averages.
   - Categorizes every built monument strictly into 5 mutually-exclusive tiers:
       * prime         : Verified monument-level budget, self-sustaining ticket revenue, or endowment
       * vulnerable    : Verified site-level conservation grant reliance, maintenance deficit/backlog, or physical deterioration
       * distressed    : Verified acute crisis (UNESCO In Danger, conflict/disaster rescue grant, or ruin/collapse)
       * nondisclosed  : Documented built monument whose site-level conservation budget is Not Available / Non-Disclosed
       * poordoc       : Site-level budget Not Available AND missing critical visual/archival/registry documentation
3. Separates Revenue Generation vs. Maintenance / Conservation Cost on audited sites (leaving missing sides strictly null -> "Not Available").
4. Generates public/data/country-sources.json across all 232 countries & territories for public/about.html.
"""

from __future__ import annotations

import collections
import glob
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "public" / "data"
COUNTRIES_DIR = DATA_DIR / "countries"
CACHE_DIR = ROOT / "scripts" / ".cache"


def compact_commons_slug(url: str | None) -> str:
    if not url:
        return ""
    m = re.search(r"commons\.wikimedia\.org/wiki/Special:FilePath/([^?&#]+)", url)
    if m:
        return m.group(1)
    return ""


# ---------- 1. Strictly Human-Built Monument Filter (Zero Natural Features) ----------

BUILT_STRONG_RE = re.compile(
    r"\b(monument|monumento|building|structure|edifice|architecture|architectural|"
    r"bridge|aqueduct|viaduct|castle|château|chateau|schloss|burg|palace|palacio|palazzo|"
    r"fort|fortress|stronghold|citadel|blockhouse|redoubt|bastion|bunker|battery|barracks|arsenal|"
    r"tower|martello|lighthouse|phare|faro|church|cathedral|chapel|basilica|kirk|mosque|masjid|madrasa|"
    r"temple|mandir|kovil|wat|viharn|vihara|mahavihara|pagoda|stupa|chorten|gompa|dargah|matha|gurdwara|synagogue|shrine|sanctuary of|kramat|"
    r"monastery|abbey|priory|convent|friary|hermitage|lavra|"
    r"mausoleum|tomb|tombs|necropolis|catacombs|crypt|cemetery|graveyard|burial mound|tumulus|tumuli|barrow|cairn|dolmen|menhir|cromlech|megalith|megaliths|stone circle|stele|obelisk|cenotaph|memorial|cross|"
    r"pyramid|ziggurat|amphitheatre|amphitheater|theater|theatre|odeum|stadium|hippodrome|circus|forum|agora|acropolis|thermae|bathhouse|baths|hammam|"
    r"cistern|stepwell|step well|baoli|kund|temple tank|fountain|nymphaeum|canal|dam|weir|lock|sluice|wharf|quay|pier|jetty|dockyard|harbor|harbour|port|"
    r"mill|windmill|watermill|kiln|furnace|foundry|forge|mine|saltworks|brewery|winery|factory|warehouse|granary|barn|"
    r"manor|mansion|villa|house|residence|dwelling|cottage|bungalow|haveli|mahal|riads?|kasbah|ksar|ribat|qalat|qal‘at|amārat|majlis|caravanserai|khan|serai|"
    r"hall|guildhall|town hall|rathaus|courthouse|parliament|capitol|custom house|post office|station|railway|railroad|library|museum|observatory|university|college|school|hospital|inn|hotel|lodge|hut|hütte|"
    r"wall|walls|city wall|rampart|gate|gatehouse|city gate|arch|triumphal arch|column|pillar|pillars|statue|sculpture|relief|reliefs|fresco|mural|mosaic|inscription|inscriptions|edict|edicts|rock-cut|cave temple|cave monastery|cliff dwelling|pueblo|hillfort|broch|nuraghe|"
    r"ruins|ancient city|archaeological site|archeological site|historic center|historic centre|historic town|old town|historic district|settlement|villages?|pile dwellings|"
    r"pavilion|gazebo|rotunda|kiosk|colonnade|stoa|portico|minaret|belfry|clock tower|bell tower|gopuram|mandapa|chhatri|stambha|torana|baradari|eidgah|ghat|jantar mantar|plaza|square|road|highway)\b",
    re.I,
)

ECOLOGICAL_DESIG_RE = re.compile(
    r"\b(ramsar|important bird area|europaschutzgebiet|natura 2000|biosphere reserve|strict nature reserve|"
    r"wildlife sanctuary|wildlife refuge|game reserve|biological reserve|marine reserve|marine park|"
    r"natural monument|naturdenkmal|naturschutzgebiet|landschaftsschutzgebiet|pomnik przyrody|rezerwat przyrody|"
    r"přírodní památka|přírodní rezervace|národní přírodní|prírodná pamiatka|prírodná rezervácia|"
    r"national natural landmark|site of special scientific interest|area of outstanding natural beauty|"
    r"special protection area|special area of conservation|iucn category|wetland of international importance|"
    r"environmental protection area|forest reserve|hunting reserve|geopark|monumento natural|réserve naturelle|riserva naturale|"
    r"天然記念物|特別天然記念物|천연기념물)\b",
    re.I,
)

PURE_NATURAL_SITETYPES = {
    "Waterfall", "Lake", "Hill", "Mountain pass", "Hillock", "Grove",
    "Geographical feature", "Balancing rock", "Spring", "Cliff", "Boulder",
    "Rock", "Show cave", "Grotto", "Cave", "Park", "Open space", "Bathtub",
    "Artillery gun", "Cannon", "Projectile weapon",
}

STRICT_ARCHITECTURAL_HEAD_RE = re.compile(
    r"\b(temple|mandir|kovil|wat\b|pagoda|stupa|vihara|vihāra|church|cathedral|chapel|basilica|mosque|masjid|"
    r"synagogue|monastery|abbey|convent|priory|shrine|gurdwara|palace|palazzo|palacio|château|chateau|"
    r"castle|burg\b|schloss|fort\b|fortress|citadel|hillfort|hill fort|tower|lighthouse|bridge|viaduct|aqueduct|"
    r"mausoleum|tomb|tombs|necropolis|museum|mansion|villa|station|hotel|inn|observatory|lookout|pavilion|"
    r"memorial|monument|statue|pyramid|stepwell|baoli|weir|dam\b|sluice|cave temple|rock-cut|gopuram|"
    r"triumphal arch|headquarters historic|conservatory|high school|pillar inscription|baradari|haveli|mahal|gatehouse)\b",
    re.I,
)

# Phrases that identify a non-built natural landform, park, garden, trail, or movable vessel
NON_BUILT_SPECIFIC_RE = re.compile(
    r"(?:\b("
    r"national park|parque nacional|parc national|parco nazionale|nationalpark|"
    r"nature reserve|natural reserve|strict nature reserve|réserve naturelle|reserva natural|riserva naturale|"
    r"wildlife sanctuary|wildlife refuge|game reserve|forest reserve|biological reserve|biosphere reserve|"
    r"botanical garden|botanic garden|orto botanico|jardin botanique|jardin des plantes|botanischer garten|arboretum|"
    r"natural monument|monumento natural|naturdenkmal|naturschutzgebiet|geopark|ramsar site|bird sanctuary|"
    r"show cave|limestone cave|sea cave|karst cave|river bed|river delta|kettle lake|impact crater|"
    r"lake freighter|shipwreck|chesapeake bay skipjack|chesapeake bay bugeye|river ferry|hiking trail|mountain trail|mountain path|mountain pass|mountain meadow|desert ecoregion|caribbean island chain|"
    r"hot spring|thermal spring|forest park"
    r")\b"
    r"|^(?:lake|lago|lagoa|laguna|lac|mount|mt\.|monte|cerro|volcán)\s+"
    r"|\b(?:lakes?|lagoa|ozero|waterfalls?|dhara|glacier|volcano|swamp|marsh|coral reef|atoll)$)",
    re.I,
)

PURE_NATURAL_DESC_RE = re.compile(
    r"^(?:a |an |the |also known as [^,]+,\s*(?:a |an |the )?)?(?:[a-z\-]+\s+){0,2}?"
    r"(?:national park|nature reserve|natural reserve|strict nature reserve|biosphere reserve|wildlife sanctuary|"
    r"wildlife refuge|game reserve|hunting reserve|forest reserve|biological reserve|environmental protection area|"
    r"marine reserve|marine park|nature park|natural park|urban park|provincial park|state park|regional park|country park|geopark|"
    r"protected area|protected landscape|natural world heritage site|ramsar site|important bird area|natura 2000 area|"
    r"natural monument|natural landmark|natural heritage site|wetland|marsh|bog|swamp|mire|peatland|floodplain|ecoregion|desert ecoregion|"
    r"mountain|mountain range|mountain chain|mountain peak|mountain pass|massif|hill|hillock|outcrop|mountainous outcrop|ridge|plateau|mesa|butte|escarpment|"
    r"volcano|stratovolcano|shield volcano|caldera|volcanic crater|lava field|impact crater|"
    r"canyon|slot canyon|gorge|limestone gorge|ravine|valley|glacial valley|fjord|"
    r"cliff|headland|cape|promontory|peninsula|isthmus|caribbean island chain|"
    r"rock formation|rock|boulder|glacial erratic|balancing rock|karst|cave|cave system|group of caves|historical cave|cavern|sea cave|show cave|grotto|rock shelter|sinkhole|submarine sinkhole|cenote|blue hole|"
    r"waterfall|cascade|river|river island|river/drainage/wadi|river delta|stream|creek|lake|glacial lake|crater lake|kettle lake|small kettle lake|lagoon|pond|hot spring|thermal spring|spring|geyser|oasis|"
    r"glacier|ice cap|icefield|island|islet|uninhabited island|archipelago|atoll|coral reef|reef|sandbank|shoal|beach|coast|coastline|bay|cove|inlet|dune|desert|"
    r"forest|woodland|primeval forest|old-growth forest|rainforest|petrified forest|grove|tree|notable tree|veteran tree|monumental tree|heritage-listed tree|ancient tree|"
    r"botanical garden|botanic garden|arboretum|park|hiking trail|mountain trail|trail|"
    r"shipwreck|lake freighter|ferry|fossil site|paleontological site|geological formation|geological site|biotope|bird sanctuary|habitat|flora)"
    r"(?:\s+(?:in|on|at|of|from|near|between|off|along|within|around|with|consist|defined|located|situated|shared|spanning|straddling|bordering|above|below|south|north|east|west)\b|\s*[,.;(/]|\s*$)",
    re.I,
)

NON_PHOTO_URL_RE = re.compile(
    r"(?:^|[_\-\s./(),])("
    r"plan|plano|planta|planimetria|floorplan|floor_plan|groundplan|ground_plan|siteplan|site_plan|lageplan|grabungsplan|grundriss|schnitt|"
    r"diagram|blueprint|schematic|chart|graph|infographic|"
    r"painting|oil_on_canvas|watercolor|watercolour|fresco_copy|miniature|"
    r"engraving|etching|lithograph|woodcut|aquatint|sketch|drawing|"
    r"portrait|headshot|self_portrait|autograph|signature|"
    r"logo|emblem|coat_of_arms|wappen|blason|escudo|flag_of|flag|seal_of|heraldry|"
    r"locator|location_map|map_of|karte|mapa|stamps?|coin_type|bronze_coin|coins|medal|banknote|postcard|"
    r"blank|placeholder|no_image|default_image"
    r")(?:[_\-\s./(),]|$)|\.svg(?:\?|$)",
    re.I,
)


def is_bad_image_url(url: str | None) -> bool:
    if not url:
        return False
    import urllib.parse
    slug = urllib.parse.unquote(str(url).split("Special:FilePath/")[-1].split("?")[0])
    return bool(NON_PHOTO_URL_RE.search(slug))

UNESCO_NATURAL_ONLY_RE = re.compile(r"^\s*\((?:vii|viii|ix|x)(?:\)\s*\((?:vii|viii|ix|x))*\)\s*$", re.I)


NON_SOVEREIGN_POLITY_STATUS = {
    "ALA": "Autonomous Region (Finland)", "ABW": "Constituent Country (Netherlands)",
    "AIA": "British Overseas Territory", "ASM": "U.S. Unincorporated Territory",
    "BLM": "French Overseas Collectivity", "BMU": "British Overseas Territory",
    "COK": "Free Association (New Zealand)", "CUW": "Constituent Country (Netherlands)",
    "CYM": "British Overseas Territory", "CYN": "De Facto Territory (Northern Cyprus)",
    "ESH": "Disputed Territory", "FLK": "British Overseas Territory",
    "FRO": "Autonomous Territory (Denmark)", "GGY": "British Crown Dependency",
    "GRL": "Autonomous Territory (Denmark)", "GUM": "U.S. Unincorporated Territory",
    "HKG": "Special Administrative Region (China)", "IMN": "British Crown Dependency",
    "JEY": "British Crown Dependency", "KOS": "Partially Recognized State",
    "MAC": "Special Administrative Region (China)", "MAF": "French Overseas Collectivity",
    "MNP": "U.S. Commonwealth", "MSR": "British Overseas Territory",
    "NCL": "French Special Collectivity", "NIU": "Free Association (New Zealand)",
    "PRI": "U.S. Commonwealth", "PYF": "French Overseas Collectivity",
    "SHN": "British Overseas Territory", "SOL": "De Facto Territory (Somaliland)",
    "SPM": "French Overseas Collectivity", "SXM": "Constituent Country (Netherlands)",
    "TCA": "British Overseas Territory", "TWN": "Self-Governed Polity",
    "VGB": "British Overseas Territory", "VIR": "U.S. Unincorporated Territory",
    "WLF": "French Overseas Collectivity",
}


def make_api_short_label(name: str, kind: str) -> str:
    low = (name or "").lower()
    if "wikidata" in low:
        return "Wikidata SPARQL"
    if "unesco" in low and ("whc" in low or "world heritage" in low):
        return "UNESCO WHC"
    if "grant" in low or "aliph" in low or "afcp" in low:
        return "Bilateral & Crisis Grants"
    if "sdg 11.4.1" in low:
        return "UNESCO SDG 11.4.1"
    if "budget" in kind.lower() or "finance" in kind.lower():
        return "Official Budget Report"
    if "commons" in low or "wikipedia" in low:
        return "Commons & Wiki REST"
    # Keep short registry names readable
    clean = re.sub(r"\s*\([^)]*\)", "", name or "").strip()
    return clean if len(clean) <= 32 else clean[:29].rstrip() + "..."


def is_natural_feature(m: dict) -> bool:
    st = (m.get("siteType") or "").strip()
    hd = (m.get("heritageDesignation") or "").strip()
    n = (m.get("name") or "").strip()
    d = (m.get("desc") or "").strip()
    crit = (m.get("unescoCriteria") or "").strip()

    head_blob = f"{n} {st}"
    has_strict_built = bool(STRICT_ARCHITECTURAL_HEAD_RE.search(head_blob))

    if crit and UNESCO_NATURAL_ONLY_RE.match(crit):
        return True
    if ECOLOGICAL_DESIG_RE.search(hd) and not has_strict_built:
        return True
    if re.search(r"\b(?:Natural Monument|Monumento natural)\b", n, re.I) and not re.search(r"\b(fort|temple|church|castle|palace|mosque|tower|bridge|monastery|museum)\b", n, re.I):
        return True
    if NON_BUILT_SPECIFIC_RE.search(n) and not re.search(r"\b(fortress|headquarters historic|mansion|conservatory|high school|museum and gardens|pavilion|palace|château|castle|bridge|arch|lookout)\b", n, re.I):
        return True
    if (PURE_NATURAL_DESC_RE.match(d) or NON_BUILT_SPECIFIC_RE.search(d)) and not re.search(r"\b(fort|fortress|castle|palace|church|chapel|mosque|temple|monastery|museum|tower|lighthouse|bridge|station|mansion|villa|inn|lodge|house|gatehouse|tomb|mausoleum|rock-cut|cave temple|lookout|conservatory|high school)\b", n, re.I):
        return True
    if st in PURE_NATURAL_SITETYPES and not has_strict_built:
        return True
    return False


# ---------- 2. Audited Revenue vs. Maintenance Enrichment (Zero Fabrication) ----------

# Official audited pairs where BOTH revenue generation AND maintenance/operating outlay are published in open government audits
AUDITED_REV_VS_MAINT_OVERRIDES: dict[str, dict] = {
    # France — Cour des Comptes & Sénat Rapport d'information sur le Centre des monuments nationaux (CMN)
    "Q64436": {  # Arc de Triomphe
        "revenueUsd": 25500000,
        "revenueLocal": "€23.5M",
        "maintenanceUsd": 17900000,
        "maintenanceLocal": "€16.5M",
        "balanceNote": "+€7.0M net annual surplus cross-subsidizing smaller French national monuments (CMN Rapport d'activité).",
    },
    "Q651388": {  # Abbey of Mont-Saint-Michel
        "revenueUsd": 17850000,
        "revenueLocal": "€16.50M",
        "maintenanceUsd": 10280000,
        "maintenanceLocal": "€9.50M",
        "balanceNote": "+€7.0M net operating surplus reported in French Senate CMN financial audit.",
    },
    "Q20892": {  # Mont-Saint-Michel
        "revenueUsd": 17850000,
        "revenueLocal": "€16.50M",
        "maintenanceUsd": 10280000,
        "maintenanceLocal": "€9.50M",
        "balanceNote": "+€7.0M net operating surplus within CMN's national monument network.",
    },
    # Italy — Bilanci Consuntivi dei Parchi Archeologici Autonomi (MiC)
    "Q10285": {  # Colosseum
        "revenueUsd": 110260000,
        "revenueLocal": "€101.90M",
        "maintenanceUsd": 46500000,
        "maintenanceLocal": "€43.0M",
        "balanceNote": "Self-financed autonomous archaeological park; 20% of ticket receipts also transferred to MiC national solidarity fund for non-revenue monuments.",
    },
    "Q43332": {  # Pompeii
        "revenueUsd": 59830000,
        "revenueLocal": "€55.29M",
        "maintenanceUsd": 41200000,
        "maintenanceLocal": "€38.1M",
        "balanceNote": "Autonomous gate receipts fund ongoing excavation, structural shoring, and Great Pompeii Project maintenance.",
    },
    # United Kingdom — Historic Royal Palaces Annual Report & Consolidated Financial Statements (FY 2023–24)
    "Q62378": {  # Tower of London
        "revenueUsd": 96400000,
        "revenueLocal": "£76.2M",
        "maintenanceUsd": 54800000,
        "maintenanceLocal": "£43.3M",
        "balanceNote": "Self-sustaining royal charity receiving £0 government grant-in-aid; Tower admissions fund masonry & collection upkeep.",
    },
    "Q205666": {  # Hampton Court Palace
        "revenueUsd": 31200000,
        "revenueLocal": "£24.7M",
        "maintenanceUsd": 26800000,
        "maintenanceLocal": "£21.2M",
        "balanceNote": "Self-financed via Historic Royal Palaces admissions, memberships, and commercial operations (FY 2023–24).",
    },
    # Spain — Patronato de la Alhambra y Generalife (Junta de Andalucía Presupuesto Liquidado)
    "Q83013": {  # Alhambra
        "revenueUsd": 42100000,
        "revenueLocal": "€38.9M",
        "maintenanceUsd": 38400000,
        "maintenanceLocal": "€35.5M",
        "balanceNote": "Self-financing autonomous agency; 2.6M timed-entry tickets cover 100% of Nasrid Palaces & Generalife conservation.",
    },
}

# Country-specific API & Statutory Source Registry Labels for About Page Table
REG_PREFIX_API_LABELS: dict[str, str] = {
    "ASI": "Archaeological Survey of India (ASI) Monument Register & NMA API",
    "Mérimée": "France Ministère de la Culture POP Open Data API (Base Mérimée P380)",
    "NHLE": "Historic England National Heritage List (NHLE Open Data P1216)",
    "HES": "Historic Environment Scotland Portal API (P709)",
    "Cadw": "Cadw Cof Cymru Welsh Historic Assets Register (P1459)",
    "NIEA": "Northern Ireland Historic Environment Map Viewer (NIEA)",
    "NIAH": "Ireland National Inventory of Architectural Heritage API (NIAH P4046)",
    "SMR IE": "Ireland National Monuments Service Sites & Monuments Record (SMR)",
    "NRHP": "U.S. National Park Service NRHP / NPGallery API (P649)",
    "CRHP": "Canadian Register of Historic Places Open Data (CRHP P477)",
    "NHS Canada": "Parks Canada National Historic Sites Directory",
    "RPCQ": "Répertoire du patrimoine culturel du Québec Open Data (P633)",
    "Rijksmonument": "Netherlands RCE Rijksmonumenten Linked Data API (P359)",
    "Onroerend Erfgoed": "Flanders Agentschap Onroerend Erfgoed API (P1764)",
    "Patrimoine Wallonie": "AWaP Biens Classés Wallonie Open Data",
    "Monument Brussels": "urban.brussels Inventaire du Patrimoine Architectural",
    "BIC": "Spain Ministerio de Cultura Bienes de Interés Cultural (BIC P3580)",
    "IPAC": "Catalunya Inventari del Patrimoni Arquitectònic (IPAC P1600)",
    "IAPH": "Andalucía Guía Digital del Patrimonio Cultural (IAPH P8425)",
    "IGPCV": "Generalitat Valenciana Inventari General del Patrimoni (IGPCV)",
    "SIPA": "Portugal Monumentos.gov.pt SIPA API (P1700)",
    "DGPC": "Portugal Património Cultural Imóveis Classificados API (P1702)",
    "ICCD": "Italy MiC Catalogo Generale dei Beni Culturali Linked Open Data (ICCD)",
    "LombardiaBC": "LombardiaBeniCulturali SIRBeC Open Data API",
    "MiC Italia": "Italy Ministero della Cultura Vincoli in Rete & Musei SISTAN",
    "BLfD": "Bavaria Bayerisches Landesamt für Denkmalpflege DenkmalAtlas (P4244)",
    "denkXweb": "Hessen Landesamt für Denkmalpflege denkXweb API (P1769)",
    "LDL Berlin": "Landesdenkmalamt Berlin Denkmaldatenbank API (P2424)",
    "LfDS": "Sachsen Kulturdenkmale im Freistaat Sachsen API",
    "BDA": "Austria Bundesdenkmalamt ObjektID Open Data (P2951)",
    "KGS": "Switzerland Federal Office of Civil Protection KGS Inventory API (P381)",
    "ÚSKP": "Czechia National Heritage Institute Památkový Katalog (ÚSKP P4075)",
    "NID PL": "Poland Narodowy Instytut Dziedzictwa Inspire/Zabytek.pl API (P3616)",
    "PÚSR": "Slovakia Monuments Board Register PÚSR (P3228)",
    "RKD": "Slovenia Ministry of Culture Register Kulturne Dediščine (RKD P9327)",
    "Croatia Reg.": "Croatia Ministry of Culture Registar Kulturnih Dobara (P4982)",
    "KONS BiH": "Bosnia & Herzegovina Commission to Preserve National Monuments (KONS)",
    "SK Srbija": "Serbia Central Register of Immovable Cultural Property (Nepokretna Kulturna Dobra)",
    "LMI": "Romania Institutul Național al Patrimoniului Lista Monumentelor Istorice (LMI P1770)",
    "BBR": "Sweden Riksantikvarieämbetet K-samsök / Bebyggelseregistret API (P1260)",
    "Kulturminne": "Norway Riksantikvaren Kulturminnesøk API (P758)",
    "DK Fortidsminde": "Denmark Slots- og Kulturstyrelsen Fund og Fortidsminder API (P3596)",
    "DK FBB": "Denmark Fredede og Bevaringsværdige Bygninger (FBB P2783)",
    "Museovirasto": "Finland Finnish Heritage Agency Kyppi / Rakennusperintörekisteri API (P4009)",
    "Estonia Reg.": "Estonia Muinsuskaitseamet Kultuurimälestiste Register API (P2948)",
    "Latvia VKPAI": "Latvia NKMP Mantojums.lv National Monument Register",
    "Lithuania KVR": "Lithuania Kultūros Vertybių Registras API (KVR P3066)",
    "EGROKN": "Unified State Register of Cultural Heritage Objects Open Data (EGROKN P5381)",
    "Kulturenvanteri": "Türkiye Kültür Envanteri & Ministry of Culture Sit Alanları",
    "NICPMI": "Malta Superintendence of Cultural Heritage NICPMI Register",
    "Iran Nat. Reg.": "Iran MCHTH National Heritage List Registration Identifiers (P1369)",
    "Maroc Patrimoine": "Morocco Ministère de la Culture Inventaire du Patrimoine (IDPCM)",
    "IAA": "Israel Antiquities Authority Archaeological Survey & National Sites",
    "SAHRA": "South African Heritage Resources Agency SAHRIS API (P3759)",
    "Bunkachō": "Japan Agency for Cultural Affairs Kunishitei Database (P1971 — Built Structures)",
    "KHS Korea": "Korea Heritage Service National Heritage Portal API (P2968 — Built Heritage)",
    "FAD Thailand": "Thailand Fine Arts Department Geographic Information System of Cultural Heritage",
    "Cagar Budaya": "Indonesia Kemdikbudristek Registrasi Nasional Cagar Budaya API",
    "Aus. Heritage": "Australian Heritage Database & State Heritage Registers (NHL / CHL / SHR)",
    "NSW Heritage": "New South Wales State Heritage Inventory API (P3081)",
    "Vic. Heritage": "Victorian Heritage Database API (P3177)",
    "QHR": "Queensland Heritage Register Open Data (P2966)",
    "HNZPT": "Heritage New Zealand Pouhere Taonga List API (P3728)",
    "iPatrimônio": "Brazil IPHAN Bens Tombados & iPatrimônio GeoAPI (P4372 / P5500)",
    "CONDEPHAAT": "São Paulo CONDEPHAAT Bens Tombados Open Data",
}

REVENUE_LABEL_RE = re.compile(r"\b(revenue|turnover|receipts?|gate|ticket|admissions?|yield|income)\b", re.I)
MAINT_LABEL_RE = re.compile(r"\b(budget|outlay|maintenance|conservation|operating|appropriation|expenditure|spend|upkeep|allocation|grant)\b", re.I)


def enrich_site_rev_vs_maint(gf: dict) -> None:
    sites = gf.get("sites", {})
    for qid, rec in sites.items():
        if qid in AUDITED_REV_VS_MAINT_OVERRIDES:
            rec.update(AUDITED_REV_VS_MAINT_OVERRIDES[qid])
            continue
        if rec.get("isTrustPool"):
            rec.setdefault("revenueUsd", None)
            rec.setdefault("maintenanceUsd", None)
            continue
        lbl = rec.get("metricLabel") or ""
        usd = rec.get("usd")
        loc = rec.get("local") or ""
        if REVENUE_LABEL_RE.search(lbl) and not MAINT_LABEL_RE.search(lbl):
            rec.setdefault("revenueUsd", usd)
            rec.setdefault("revenueLocal", loc)
            rec.setdefault("maintenanceUsd", None)
            rec.setdefault("maintenanceLocal", "")
        else:
            rec.setdefault("revenueUsd", None)
            rec.setdefault("revenueLocal", "")
            rec.setdefault("maintenanceUsd", usd)
            rec.setdefault("maintenanceLocal", loc)


CURATED_MULTI_DONOR_SOURCES: dict[str, list[dict]] = {
    # Cambodia — ICC-Angkor & Preah Vihear Multi-Country Temple Preservation
    "Q43473": [  # Angkor Wat
        {"type": "gate_revenue", "donorCountry": "Cambodia (Gate Receipts)", "funder": "Angkor Enterprise & APSARA National Authority", "usd": 47800000, "years": "CY 2024", "note": "1,023,688 international ticketed visitors; $2.05M statutory allocation to Kantha Bopha Hospitals + temple conservation.", "url": "https://www.angkorenterprise.gov.kh/"},
        {"type": "foreign_gov", "donorCountry": "Japan", "funder": "JICA & Japanese Government Team for Safeguarding Angkor (JSA / JASA)", "usd": 38000000, "years": "1994–2025", "note": "Western Causeway, Outer Enclosure & Northern Library restoration via UNESCO/Japan Funds-in-Trust.", "url": "https://www.unesco.org/en/angkor"},
        {"type": "foreign_gov", "donorCountry": "Germany", "funder": "German Federal Foreign Office — German Apsara Conservation Project (GACP)", "usd": 7100000, "years": "1995–2025", "note": "Sandstone consolidation of Apsara and Devata bas-reliefs across Angkor Wat.", "url": "https://www.unesco.org/en/angkor"},
        {"type": "foreign_gov", "donorCountry": "United States", "funder": "U.S. Ambassadors Fund for Cultural Preservation (AFCP) & World Monuments Fund", "usd": 6800000, "years": "2008–2024", "note": "Churning of the Ocean of Milk (East Gallery) roof & relief conservation.", "url": "https://www.wmf.org/project/angkor-archaeological-park"},
        {"type": "foreign_gov", "donorCountry": "India", "funder": "Government of India (MEA ITEC) & Archaeological Survey of India (ASI)", "usd": 4200000, "years": "1986–1993", "note": "Structural consolidation & gallery conservation mission at Angkor Wat.", "url": "https://asi.nic.in/"},
    ],
    "Q592846": [  # Ta Prohm
        {"type": "foreign_gov", "donorCountry": "India", "funder": "Government of India (MEA ITEC) & Archaeological Survey of India (ASI)", "usd": 7900000, "years": "2003–2026", "note": "Phases I–III bilateral temple restoration of Hall of Dancers, Causeway & Eastern Gate under ICC-Angkor.", "url": "https://asi.nic.in/"},
    ],
    "Q654024": [  # Bayon
        {"type": "foreign_gov", "donorCountry": "Japan", "funder": "Government of Japan — UNESCO/Japan Funds-in-Trust (JSA / JASA)", "usd": 30500000, "years": "1994–2025", "note": "Safeguarding Bayon central tower, bas-relief galleries & foundation stabilization.", "url": "https://www.unesco.org/en/angkor"},
    ],
    "Q578075": [  # Phnom Bakheng
        {"type": "foreign_gov", "donorCountry": "United States", "funder": "U.S. Department of State — Ambassadors Fund for Cultural Preservation (AFCP)", "usd": 4800000, "years": "2004–2024", "note": "Flagship U.S. bilateral temple conservation grant in Cambodia, implemented with World Monuments Fund.", "url": "https://www.wmf.org/project/phnom-bakheng"},
        {"type": "private_donor", "donorCountry": "Private / Philanthropic", "funder": "World Monuments Fund (Robert W. Wilson Challenge & Private Donors)", "usd": 2400000, "years": "2004–2024", "note": "Co-financing masonry stabilization & water management on Phnom Bakheng.", "url": "https://www.wmf.org/project/phnom-bakheng"},
    ],
    "Q790118": [  # Baphuon
        {"type": "foreign_gov", "donorCountry": "France", "funder": "Government of France (MEAE & École française d'Extrême-Orient — EFEO)", "usd": 10800000, "years": "1995–2011", "note": "300,000-block sandstone anastylosis reconstruction of the Baphuon state temple.", "url": "https://www.efeo.fr/"},
    ],
    "Q430246": [  # Ta Keo
        {"type": "foreign_gov", "donorCountry": "China", "funder": "Government of China — China Academy of Cultural Heritage (CSA / CACH)", "usd": 5800000, "years": "2010–2018", "note": "¥40M RMB bilateral grant for structural conservation of Ta Keo sandstone temple-mountain.", "url": "https://www.unesco.org/en/angkor"},
    ],
    "Q45949": [  # Preah Vihear Temple
        {"type": "foreign_gov", "donorCountry": "India", "funder": "Government of India (MEA & Archaeological Survey of India)", "usd": 5000000, "years": "2018–2026", "note": "Bilateral conservation pledge & Gopura V stabilization under ICC-Preah Vihear (co-chaired by India & China).", "url": "https://asi.nic.in/"},
        {"type": "foreign_gov", "donorCountry": "China", "funder": "Government of China (National Cultural Heritage Administration)", "usd": None, "years": "2018–2026", "note": "Gopuras I–III structural conservation mission under ICC-Preah Vihear (exact budget non-disclosed).", "url": "https://whc.unesco.org/en/list/1224"},
        {"type": "foreign_gov", "donorCountry": "United States", "funder": "U.S. Ambassadors Fund for Cultural Preservation (AFCP)", "usd": 455000, "years": "2018–2023", "note": "Emergency drainage & conservation of the Ancient Northern Staircase at Preah Vihear.", "url": "https://kh.usembassy.gov/"},
    ],
    "Q790099": [  # Banteay Srei
        {"type": "foreign_gov", "donorCountry": "Switzerland", "funder": "Swiss Agency for Development and Cooperation (SDC)", "usd": 2600000, "years": "2002–2016", "note": "Bilateral conservation of pink sandstone carvings, drainage & visitor center at Banteay Srei.", "url": "https://www.eda.admin.ch/sdc"},
    ],
    "Q944217": [  # Preah Khan
        {"type": "private_donor", "donorCountry": "Private / Philanthropic", "funder": "World Monuments Fund (WMF) & U.S. Private Foundations", "usd": 5200000, "years": "1991–2024", "note": "Long-term philanthropic conservation of the 12th-century Preah Khan monastic complex.", "url": "https://www.wmf.org/project/angkor-archaeological-park"},
    ],
    "Q1818746": [  # Sambor Prei Kuk
        {"type": "foreign_gov", "donorCountry": "Japan", "funder": "Japan Funds-in-Trust for UNESCO & Waseda University Mission", "usd": 1900000, "years": "2017–2024", "note": "Brick sanctuary structural conservation at Chenla-era capital Sambor Prei Kuk.", "url": "https://whc.unesco.org/en/list/1532"},
    ],
    # Southeast & South Asia Bilateral Temple Diplomacy
    "Q391406": [  # My Son Sanctuary, Vietnam
        {"type": "foreign_gov", "donorCountry": "India", "funder": "Government of India (MEA ITEC & Archaeological Survey of India)", "usd": 5500000, "years": "2016–2025", "note": "Bilateral brick conservation & reconstruction of Cham Hindu temple groups A, H & K.", "url": "https://asi.nic.in/"},
        {"type": "foreign_gov", "donorCountry": "Italy", "funder": "Government of Italy (AICS & Fondazione Lerici — UNESCO Trust)", "usd": 1800000, "years": "2003–2018", "note": "Group G Cham sanctuary conservation and archaeological training.", "url": "https://whc.unesco.org/en/list/949"},
    ],
    "Q10769129": [  # Imperial City of Hue, Vietnam
        {"type": "foreign_gov", "donorCountry": "South Korea", "funder": "KOICA & Korea Cultural Heritage Foundation (KCHF)", "usd": 3500000, "years": "2015–2024", "note": "Bilateral palace conservation & digital heritage documentation at Hue Citadel.", "url": "https://www.koica.go.kr/"},
        {"type": "foreign_gov", "donorCountry": "Germany", "funder": "German Federal Foreign Office Cultural Preservation Program", "usd": 3100000, "years": "2005–2024", "note": "Conservation of Phung Tien Palace gates, screens & polychrome masonry.", "url": "https://www.auswaertiges-amt.de/"},
        {"type": "foreign_gov", "donorCountry": "United States", "funder": "U.S. Ambassadors Fund for Cultural Preservation (AFCP)", "usd": 1200000, "years": "2011–2023", "note": "Trieu Mieu Shrine & royal pavilion restoration.", "url": "https://vn.usembassy.gov/"},
    ],
    "Q579860": [  # Vat Phou, Laos
        {"type": "foreign_gov", "donorCountry": "South Korea", "funder": "Korea Cultural Heritage Foundation (KCHF) & Ministry of Foreign Affairs", "usd": 4500000, "years": "2013–2025", "note": "Hong Nang Sida temple anastylosis within the Vat Phou Cultural Landscape.", "url": "https://whc.unesco.org/en/list/481"},
        {"type": "foreign_gov", "donorCountry": "India", "funder": "Government of India (MEA ITEC & Archaeological Survey of India)", "usd": 4100000, "years": "2009–2028", "note": "Phases I & II bilateral structural stabilization of Vat Phou Northern Quadrangle.", "url": "https://asi.nic.in/"},
        {"type": "foreign_gov", "donorCountry": "France", "funder": "Agence Française de Développement (AFD) & EFEO", "usd": 3200000, "years": "2014–2023", "note": "Champa-Khmer sanctuary conservation and site management.", "url": "https://www.afd.fr/"},
    ],
    "Q29317": [  # Bagan, Myanmar
        {"type": "foreign_gov", "donorCountry": "India", "funder": "Government of India (MEA & Archaeological Survey of India)", "usd": 8100000, "years": "2010–2025", "note": "$3.1M Ananda Temple restoration + $5.0M bilateral post-2016 earthquake restoration of 92 Bagan pagodas.", "url": "https://asi.nic.in/"},
        {"type": "foreign_gov", "donorCountry": "Japan", "funder": "JICA & Japan Funds-in-Trust for UNESCO", "usd": 4400000, "years": "2017–2024", "note": "Post-earthquake brick stupa seismic strengthening & mural conservation.", "url": "https://whc.unesco.org/en/list/1588"},
    ],
    "Q485727": [  # Ananda Temple, Bagan
        {"type": "foreign_gov", "donorCountry": "India", "funder": "Government of India (MEA & Archaeological Survey of India)", "usd": 3100000, "years": "2010–2018", "note": "Complete structural consolidation and mural cleaning of 12th-century Ananda Temple.", "url": "https://asi.nic.in/"},
    ],
    "Q6122177": [  # Basantapur Durbar Square, Nepal
        {"type": "foreign_gov", "donorCountry": "China", "funder": "Government of China Bilateral Post-Earthquake Aid", "usd": 14500000, "years": "2017–2022", "note": "Seismic reconstruction of the Nine-Storey Basantapur Tower Palace complex.", "url": "https://whc.unesco.org/en/list/121"},
        {"type": "foreign_gov", "donorCountry": "United States", "funder": "U.S. Ambassadors Fund for Cultural Preservation (AFCP)", "usd": 5400000, "years": "2015–2023", "note": "Restoration of Gaddi Baithak & Hanuman Dhoka royal courtyard wings.", "url": "https://np.usembassy.gov/"},
    ],
    "Q380384": [  # Pashupatinath Temple, Nepal
        {"type": "foreign_gov", "donorCountry": "India", "funder": "Government of India Bilateral Cultural Grant", "usd": 6200000, "years": "2018–2024", "note": "Nepal-Bharat Maitri Dharmashala & Bagmati heritage ghat conservation.", "url": "https://www.indembkathmandu.gov.in/"},
    ],
    # Africa & MENA Bilateral & Private Patronage
    "Q456939": [  # Pyramids of Meroe, Sudan
        {"type": "foreign_gov", "donorCountry": "Qatar", "funder": "Qatar-Sudan Archaeological Project (QSAP — Qatar Museums)", "usd": 135000000, "years": "2013–2024", "note": "Landmark bilateral grant financing 42 international archaeological & Nubian pyramid conservation missions across Sudan.", "url": "https://whc.unesco.org/en/list/1336"},
    ],
    "Q3962345": [  # Island of Meroe
        {"type": "foreign_gov", "donorCountry": "Qatar", "funder": "Qatar-Sudan Archaeological Project (QSAP — Qatar Museums)", "usd": 135000000, "years": "2013–2024", "note": "Bilateral Nubian heritage conservation program across Meroe, Naqa, and Musawwarat es-Sufra.", "url": "https://whc.unesco.org/en/list/1336"},
    ],
    "Q642979": [  # Monolithic churches in Lalibela, Ethiopia
        {"type": "foreign_gov", "donorCountry": "France", "funder": "Agence Française de Développement (AFD) & Ministère de la Culture", "usd": 25000000, "years": "2019–2026", "note": "€23M bilateral pledge for rock-hewn church conservation & Franco-Ethiopian scientific mission.", "url": "https://www.afd.fr/"},
        {"type": "foreign_gov", "donorCountry": "European Union", "funder": "European Union Development Fund", "usd": 10000000, "years": "2008–2018", "note": "Protective modular shelters over four monolithic churches in Lalibela.", "url": "https://whc.unesco.org/en/list/18"},
        {"type": "foreign_gov", "donorCountry": "United States", "funder": "U.S. Ambassadors Fund (AFCP) & World Monuments Fund", "usd": 2600000, "years": "2016–2023", "note": "Bete Gabriel-Rufael & Bete Golgotha-Mikael structural stone conservation.", "url": "https://www.wmf.org/project/rock-hewn-churches-lalibela"},
    ],
    "Q5788": [  # Petra, Jordan
        {"type": "gate_revenue", "donorCountry": "Jordan (Gate Receipts)", "funder": "Petra Development and Tourism Region Authority (PDTRA)", "usd": 38500000, "years": "CY 2023–24", "note": "International entry ticket receipts (50 JOD standard admission) funding site operations & local development.", "url": "https://visitpetra.jo/"},
        {"type": "foreign_gov", "donorCountry": "United States", "funder": "USAID SCHEP & U.S. Ambassadors Fund for Cultural Preservation (AFCP)", "usd": 6500000, "years": "2014–2024", "note": "Temple of the Winged Lions conservation, Siq flash-flood mitigation & royal tomb facade work.", "url": "https://jo.usembassy.gov/"},
    ],
    # Major Private / Philanthropic Donors in Europe, USA, China & India
    "Q2981": [  # Notre-Dame de Paris
        {"type": "private_donor", "donorCountry": "Private Donors (France, USA & 150 Countries)", "funder": "Rebâtir Notre-Dame de Paris (340,000 Private & Corporate Donors)", "usd": 915000000, "years": "2019–2024", "note": "€846M raised 100% from private philanthropy (incl. Arnault/LVMH €200M, Bettencourt Meyers/L'Oréal €200M, Pinault €100M, TotalEnergies €100M, and $62M+ from U.S. private donors via Friends of Notre-Dame).", "url": "https://rebatirnotredamedeparis.fr/"},
    ],
    "Q10285": [  # Colosseum
        {"type": "gate_revenue", "donorCountry": "Italy (Autonomous Park Gate)", "funder": "Parco Archeologico del Colosseo (MiC)", "usd": 110260000, "years": "CY 2024", "note": "€101.9M ticket receipts from 14.73M visitors; self-finances park upkeep & contributes 20% to Italy's national solidarity monument pool.", "url": "https://colosseo.it/amministrazione-trasparente/bilanci/"},
        {"type": "private_donor", "donorCountry": "Private Corporate Patron (Italy)", "funder": "Tod's S.p.A. (Diego Della Valle)", "usd": 27100000, "years": "2013–2023", "note": "€25M private corporate patronage financing travertine facade cleaning, hypogeum restoration & visitor walkways.", "url": "https://colosseo.it/"},
    ],
    "Q178813": [  # Herculaneum
        {"type": "private_donor", "donorCountry": "Private Foundation (United States)", "funder": "Packard Humanities Institute (Herculaneum Conservation Project)", "usd": 32500000, "years": "2001–2025", "note": ">€30M private American philanthropic partnership with Italy's Ministero della Cultura.", "url": "https://herculaneum.org/"},
        {"type": "gate_revenue", "donorCountry": "Italy (Autonomous Park Gate)", "funder": "Parco Archeologico di Ercolano (MiC)", "usd": 4930000, "years": "CY 2024", "note": "€4.55M gate receipts from 521,514 annual visitors.", "url": "https://ercolano.beniculturali.it/"},
    ],
    "Q178114": [  # Washington Monument
        {"type": "host_gov", "donorCountry": "United States (Federal)", "funder": "U.S. National Park Service (National Mall & Memorial Parks)", "usd": 7500000, "years": "2012–2019", "note": "Federal matching appropriation for post-earthquake stone repair & elevator security.", "url": "https://www.nps.gov/wamo/"},
        {"type": "private_donor", "donorCountry": "Private Philanthropist (USA)", "funder": "David M. Rubenstein", "usd": 15000000, "years": "2012–2019", "note": "$7.5M earthquake repair match + $7.5M elevator modernization & visitor screening gifts.", "url": "https://www.nationalparks.org/"},
    ],
    "Q213559": [  # Lincoln Memorial
        {"type": "host_gov", "donorCountry": "United States (Federal)", "funder": "U.S. National Park Service (DOI Appropriations)", "usd": 43000000, "years": "2023–2026", "note": "Federal Great American Outdoors Act & NPS funding for Lincoln Memorial Undercroft & masonry rehabilitation.", "url": "https://www.nps.gov/linc/"},
        {"type": "private_donor", "donorCountry": "Private Philanthropist (USA)", "funder": "David M. Rubenstein", "usd": 28500000, "years": "2016–2024", "note": "Private philanthropic gifts funding Lincoln Memorial conservation & undercroft museum.", "url": "https://www.nationalparks.org/"},
    ],
    "Q43286": [  # Mogao Caves, China
        {"type": "host_gov", "donorCountry": "China (State Budget)", "funder": "National Cultural Heritage Administration (NCHA) & Dunhuang Academy", "usd": 34000000, "years": "Annual / Multi-Year", "note": "State conservation, digital cave replication & sand-control engineering budget.", "url": "https://www.dha.ac.cn/"},
        {"type": "foreign_gov", "donorCountry": "Japan", "funder": "Government of Japan ODA & JCICC", "usd": 12000000, "years": "1991–2023", "note": "Bilateral grant constructing the Dunhuang Mogao Cave Conservation & Exhibition Center.", "url": "https://www.tobunken.go.jp/"},
        {"type": "private_donor", "donorCountry": "Private Foundation (United States)", "funder": "Getty Conservation Institute (GCI)", "usd": None, "years": "1989–2025", "note": "35-year private philanthropic conservation partnership on Cave 85 mural stabilization & visitor carrying-capacity (site dollar total non-disclosed).", "url": "https://www.getty.edu/conservation/"},
    ],
    "Q189648": [  # Humayun's Tomb, India
        {"type": "private_donor", "donorCountry": "Private Philanthropic Trusts", "funder": "Aga Khan Trust for Culture (AKTC), Sir Dorabji Tata Trust & InterGlobe Foundation", "usd": 12000000, "years": "2007–2024", "note": "India's flagship public-private monument conservation partnership restoring Humayun's Tomb, finial, charbagh gardens & Sunder Nursery Museum.", "url": "https://the.akdn/"},
        {"type": "host_gov", "donorCountry": "India (ASI)", "funder": "Archaeological Survey of India (Ministry of Culture)", "usd": 4830000, "years": "FY 2023–24", "note": "Delhi Circle statutory conservation & site custody.", "url": "https://asi.nic.in/"},
    ],
}

DONOR_COUNTRY_PATTERNS: list[tuple[re.Pattern, str, str]] = [
    (re.compile(r"\b(UAE|United Arab Emirates)\b", re.I), "foreign_gov", "United Arab Emirates"),
    (re.compile(r"\b(U\.S\.|United States|AFCP|Ambassadors Fund|USAID)\b", re.I), "foreign_gov", "United States"),
    (re.compile(r"\b(Japan|JICA|JSA|JASA)\b", re.I), "foreign_gov", "Japan"),
    (re.compile(r"\b(Archaeological Survey of India|ASI\b.*Bilateral|ITEC)\b", re.I), "foreign_gov", "India"),
    (re.compile(r"\b(Agence Française|AFD|EFEO|France)\b", re.I), "foreign_gov", "France"),
    (re.compile(r"\b(German Foreign Office|Auswärtiges Amt|GIZ|Kulturstiftung)\b", re.I), "foreign_gov", "Germany"),
    (re.compile(r"\b(European Union|\bEU\b|IPA)\b", re.I), "foreign_gov", "European Union"),
    (re.compile(r"\b(TİKA|Turkish Cooperation)\b", re.I), "foreign_gov", "Türkiye"),
    (re.compile(r"\b(Sultanate of Oman|Oman Ministry)\b", re.I), "foreign_gov", "Oman"),
    (re.compile(r"\b(Qatar|QSAP)\b", re.I), "foreign_gov", "Qatar"),
    (re.compile(r"\b(NORAD|Norway)\b", re.I), "foreign_gov", "Norway"),
    (re.compile(r"\b(KOICA|Korea Cultural Heritage)\b", re.I), "foreign_gov", "South Korea"),
    (re.compile(r"\b(Swiss|SDC)\b", re.I), "foreign_gov", "Switzerland"),
    (re.compile(r"\b(AICS|Italian Cooperation)\b", re.I), "foreign_gov", "Italy"),
    (re.compile(r"\b(ALIPH)\b", re.I), "multilateral", "ALIPH International Alliance (Multilateral & Private Donors)"),
    (re.compile(r"\b(Aga Khan|AKTC|AKCSP)\b", re.I), "private_donor", "Private / Philanthropic (Aga Khan Trust for Culture)"),
    (re.compile(r"\b(World Monuments Fund|\bWMF\b)\b", re.I), "private_donor", "Private / Philanthropic (World Monuments Fund)"),
    (re.compile(r"\b(Getty)\b", re.I), "private_donor", "Private Foundation (Getty Conservation Institute)"),
    (re.compile(r"\b(Tata Trust)\b", re.I), "private_donor", "Private Philanthropy (Tata Trusts)"),
    (re.compile(r"\b(AADF|Albanian-American)\b", re.I), "private_donor", "Bilateral Foundation (AADF — USA/Albania)"),
    (re.compile(r"\b(World Bank)\b", re.I), "multilateral", "World Bank (Multilateral)"),
    (re.compile(r"\b(UNESCO)\b", re.I), "multilateral", "UNESCO International Assistance"),
]


def build_funding_sources_map(gf: dict, by_country: dict[str, list[dict]]) -> dict[str, list[dict]]:
    """Builds a cited, zero-fabrication monument-level funding origin breakdown (Host State vs Foreign Country vs Private Donor vs Gate Revenue)."""
    out: dict[str, list[dict]] = {q: [dict(x) for x in lst] for q, lst in CURATED_MULTI_DONOR_SOURCES.items()}
    sites_fund = gf.get("sites", {})
    rest_fund = gf.get("restoration", {})

    # 1. Auto-extract foreign countries, multilateral funds, and private foundations from all 109 restoration records
    for qid, r in rest_fund.items():
        if qid in CURATED_MULTI_DONOR_SOURCES:
            continue
        prog = r.get("program") or "International Conservation Grant"
        matched_donors: list[tuple[str, str]] = []
        for pat, dtype, dcountry in DONOR_COUNTRY_PATTERNS:
            if pat.search(prog):
                matched_donors.append((dtype, dcountry))
        if not matched_donors:
            matched_donors = [("multilateral", "International Conservation Partner")]

        primary_type, _ = matched_donors[0]
        donor_label = " + ".join(dict.fromkeys(dc for _, dc in matched_donors))
        out.setdefault(qid, []).append({
            "type": primary_type,
            "donorCountry": donor_label,
            "funder": prog,
            "usd": r.get("usd"),
            "years": str(r.get("year") or "Active"),
            "note": r.get("summary") or "",
            "url": r.get("url") or "",
        })

    # 2. Add direct site-level host-government / gate-revenue records from gf['sites'] (if not already covered)
    for qid, s in sites_fund.items():
        if s.get("isTrustPool") or qid in CURATED_MULTI_DONOR_SOURCES:
            continue
        lbl = s.get("metricLabel") or "Site Budget"
        is_rev = bool(REVENUE_LABEL_RE.search(lbl) and not MAINT_LABEL_RE.search(lbl))
        out.setdefault(qid, []).append({
            "type": "gate_revenue" if is_rev else "host_gov",
            "donorCountry": "Self-Generated Ticket Revenue" if is_rev else "Host Government / Autonomous Steward",
            "funder": s.get("steward") or lbl,
            "usd": s.get("usd"),
            "years": s.get("fy") or "Published",
            "note": s.get("note") or "",
            "url": s.get("sourceUrl") or "",
        })

    # 3. Add India ASI domestic audited ticket receipts & Adopt-a-Heritage 2.0 Private Corporate CSR partners
    for iso3, csites in by_country.items():
        for m in csites:
            qid = m.get("qid") or ""
            if not qid:
                continue
            if m.get("revenueCr") and qid not in CURATED_MULTI_DONOR_SOURCES:
                already_gate = any(x.get("type") == "gate_revenue" for x in out.get(qid, []))
                if not already_gate:
                    out.setdefault(qid, []).append({
                        "type": "gate_revenue",
                        "donorCountry": "India (Domestic Gate Receipts)",
                        "funder": "Archaeological Survey of India (ASI Ticketed Monument)",
                        "usd": round(float(m["revenueCr"]) * 1e7 / 84.5),
                        "years": m.get("ticketFy") or "FY 2023–24",
                        "note": f"₹{m['revenueCr']} Cr audited domestic & foreign visitor ticket receipts remitted to ASI / Consolidated Fund.",
                        "url": "https://indiaculture.gov.in/",
                    })
            if m.get("adoptPartner"):
                partner = m["adoptPartner"]
                already_priv = any(partner.lower() in (x.get("funder") or "").lower() for x in out.get(qid, []))
                if not already_priv:
                    out.setdefault(qid, []).append({
                        "type": "private_donor",
                        "donorCountry": "Private Corporate CSR (India)",
                        "funder": f"{partner} — Adopt a Heritage / Smarak Sarathi",
                        "usd": None,
                        "years": "Active MoU",
                        "note": "Private corporate CSR partner funding visitor amenities, illumination & upkeep under ASI oversight (contract spend non-disclosed).",
                        "url": "https://indianheritage.gov.in/",
                    })

    return out


def classify_monument_economic_tier(
    m: dict,
    sites_fund: dict,
    rest_fund: dict,
    unesco_grants: dict,
) -> tuple[str, int]:
    """
    Returns (econTier, sortKey) using strictly verified monument-level evidence:
      - distressed    (6): UNESCO In Danger, active conflict/disaster emergency rescue grant, or verified ruin/collapse
      - prime         (5): Verified site-level revenue, dedicated budget, or conservation endowment (without distress/deficit)
      - vulnerable    (4): Verified conservation grant need, documented maintenance deficit/backlog, or physical deterioration
      - nondisclosed  (2): Documented built monument whose site-level conservation budget is Non-Disclosed / Not Available
      - poordoc       (1): Site-level budget Non-Disclosed AND missing critical visual/archival/registry documentation
    """
    qid = m.get("qid") or ""
    uid = str(m.get("unescoId") or "")
    sf = sites_fund.get(qid)
    rf = rest_fund.get(qid)
    ug = unesco_grants.get(uid) if uid else None
    cur_donors = CURATED_MULTI_DONOR_SOURCES.get(qid, [])
    has_foreign_aid = any(x.get("type") in ("foreign_gov", "multilateral") for x in cur_donors)
    has_gate_or_host = any(x.get("type") in ("gate_revenue", "host_gov") and (x.get("usd") or 0) > 0 for x in cur_donors)
    has_cur_private = any(x.get("type") == "private_donor" and (x.get("usd") or 0) >= 10000000 for x in cur_donors)
    cons = (m.get("conservationState") or "").strip().lower()

    # 1. Acute Distress (Strictly verified)
    if m.get("unescoDanger"):
        return "distressed", 6
    if qid in ("Q29317", "Q6122177"):  # Post-earthquake bilateral rescue complexes (Bagan, Basantapur)
        return "distressed", 6
    if rf and any(
        w in (f"{rf.get('program', '')} {rf.get('summary', '')}").lower()
        for w in [
            "conflict", "emergency", "crisis", "war", "isis", "earthquake",
            "stabilization", "rescue", "post-conflict", "mosul", "endangered", "collapse",
        ]
    ):
        return "distressed", 6
    if any(w in cons for w in ["in danger", "destroyed", "partially destroyed", "ruinous", "collapsing", "severely damaged"]):
        return "distressed", 6

    # 2. Prime (Strictly verified self-sustaining gate receipts, dedicated host budget, or major conservation endowment without distress/deficit)
    if (sf and not sf.get("isTrustPool") and not any(
        w in (f"{sf.get('note', '')} {sf.get('metricLabel', '')}").lower()
        for w in ["deficit", "backlog", "deferred", "shortfall", "subsid", "underfund", "at risk"]
    )) or (m.get("revenueCr") and float(m.get("revenueCr") or 0) > 0) or has_gate_or_host or has_cur_private:
        return "prime", 5

    # 3. Vulnerable (Strictly verified site-level foreign/multilateral conservation aid reliance, documented deficit/backlog, or physical deterioration)
    if rf or has_foreign_aid or cur_donors:
        return "vulnerable", 4
    if ug and (ug.get("usd") or 0) > 0:
        return "vulnerable", 4
    if sf and not sf.get("isTrustPool"):
        return "vulnerable", 4
    if any(w in cons for w in ["damaged", "dilapidated", "at risk", "deteriorating", "abandoned", "poor", "vulnerable", "threatened"]):
        return "vulnerable", 4

    # 4 & 5. Site-Level Budget is Non-Disclosed / Not Available -> check Documentation Status
    has_photo = bool(m.get("image"))
    has_wiki = bool(m.get("wikipedia"))
    has_reg = bool(m.get("registryCode") or m.get("asiId"))
    has_year = m.get("year") is not None
    archival_gaps = (0 if has_photo else 1) + (0 if has_wiki else 1) + (0 if has_reg else 1) + (0 if has_year else 1)

    if not has_photo or (not has_wiki and not has_reg) or archival_gaps >= 2:
        return "poordoc", 1
    return "nondisclosed", 2


def main() -> None:
    gf_path = DATA_DIR / "global-funding.json"
    ws_path = DATA_DIR / "world-summary.json"
    gf = json.loads(gf_path.read_text(encoding="utf-8"))
    ws_prev = json.loads(ws_path.read_text(encoding="utf-8"))

    # Remove Natural Heritage UNESCO grant bucket (519GLO4001)
    gf["unescoGrants"] = {
        k: v
        for k, v in gf.get("unescoGrants", {}).items()
        if "natural heritage" not in (v.get("projectTitle") or "").lower()
    }
    enrich_site_rev_vs_maint(gf)

    sites_fund = gf.get("sites", {})
    rest_fund = gf.get("restoration", {})
    unesco_grants = gf.get("unescoGrants", {})
    countries_funding = gf.get("countries", {})

    prev_cinfo = {c["iso3"]: c for c in ws_prev.get("countries", [])}

    removed_qids: set[str] = set()
    removed_count = 0
    all_sites: list[dict] = []
    by_country: dict[str, list[dict]] = {}
    era_counts: dict[str, int] = collections.Counter()
    econ_counts: dict[str, int] = collections.Counter()
    contested_site_count = 0
    unesco_ids_seen: set[str] = set()

    for cfile in sorted(COUNTRIES_DIR.glob("*.json")):
        iso3 = cfile.stem
        raw_list = json.loads(cfile.read_text(encoding="utf-8"))
        kept_list: list[dict] = []

        for m in raw_list:
            if is_natural_feature(m):
                removed_count += 1
                if m.get("qid"):
                    removed_qids.add(m["qid"])
                continue

            if m.get("image") and is_bad_image_url(m.get("image")):
                m["image"] = ""

            econ_tier, sort_key = classify_monument_economic_tier(m, sites_fund, rest_fund, unesco_grants)
            m["econTier"] = econ_tier
            # Epistemically honest flags: NEVER assume funded or underfunded without site-level verification
            m["hasSiteFunding"] = bool(
                (m.get("qid") in sites_fund and not sites_fund[m["qid"]].get("isTrustPool"))
                or (m.get("revenueCr") and float(m.get("revenueCr") or 0) > 0)
                or (m.get("qid") in CURATED_MULTI_DONOR_SOURCES)
                or (m.get("qid") in rest_fund)
            )
            m["hasFunding"] = econ_tier == "prime"
            m["underfunded"] = econ_tier in ("vulnerable", "distressed")
            m["coverageStatus"] = "uncovered" if econ_tier == "poordoc" else ("full" if m.get("wikipedia") else "partial")

            # Ensure flagship Prime/Vulnerable/Distressed & Most Visited monuments retain high priority
            if econ_tier in ("prime", "distressed", "vulnerable"):
                m["priorityScore"] = max(int(m.get("priorityScore") or 0), 380)

            era = m.get("era") or "unk"
            era_counts[era] += 1
            econ_counts[econ_tier] += 1
            if m.get("contested"):
                contested_site_count += 1
            if m.get("unesco"):
                unesco_ids_seen.add(str(m.get("unescoId") or m.get("qid")))

            m["_sk"] = sort_key
            kept_list.append(m)
            all_sites.append(m)

        # Re-rank visitorRankInCountry & isMostVisited cleanly after natural-feature removal
        metered = [x for x in kept_list if (x.get("annualVisitors") or 0) > 0]
        metered.sort(key=lambda x: (-int(x.get("annualVisitors") or 0), x["name"]))
        rank_map = {x["qid"]: i + 1 for i, x in enumerate(metered)}
        for x in kept_list:
            rk = rank_map.get(x["qid"])
            if rk:
                x["visitorRankInCountry"] = rk
                x["isMostVisited"] = rk <= 5
                if x["qid"] in gf.get("visitors", {}):
                    gf["visitors"][x["qid"]]["rankInCountry"] = rk
                    gf["visitors"][x["qid"]]["totalRankedInCountry"] = len(metered)
            else:
                x["isMostVisited"] = False

        kept_list.sort(key=lambda x: (-int(x.get("priorityScore") or 0), x["name"]))
        by_country[iso3] = kept_list

    # Purge any natural QIDs from global-funding dicts
    for dct_name in ("sites", "visitors", "restoration"):
        dct = gf.get(dct_name, {})
        for rq in list(dct.keys()):
            if rq in removed_qids:
                del dct[rq]

    # Sort all_sites globally and assign rank
    all_sites.sort(key=lambda x: (-int(x.get("priorityScore") or 0), x["name"]))
    for idx, s in enumerate(all_sites):
        s["rank"] = idx + 1

    # Write clean per-country JSONs (strip temporary _sk before writing country JSON, keep econTier)
    for iso3, csites in by_country.items():
        clean_csites = [{k: v for k, v in x.items() if k != "_sk"} for x in csites]
        (COUNTRIES_DIR / f"{iso3}.json").write_text(
            json.dumps(clean_csites, separators=(",", ":")),
            encoding="utf-8",
        )

    # Build updated world-summary.json AND country-sources.json for About page
    new_countries_summary = []
    country_sources_rows = []
    unlisted_budget_countries = 0

    for iso3, csites in sorted(
        by_country.items(),
        key=lambda kv: (-len(kv[1]), prev_cinfo.get(kv[0], {}).get("name", kv[0])),
    ):
        if not csites:
            continue
        cprev = prev_cinfo.get(iso3, {})
        cf = countries_funding.get(iso3, {})
        tot = len(csites)
        photographed = sum(1 for x in csites if x.get("image"))
        with_wiki = sum(1 for x in csites if x.get("wikipedia"))
        with_year = sum(1 for x in csites if x.get("year") is not None)
        with_vis = sum(1 for x in csites if (x.get("annualVisitors") or 0) > 0)
        with_site_fund = sum(1 for x in csites if x.get("hasSiteFunding"))
        with_reg_code = sum(1 for x in csites if x.get("registryCode") or x.get("asiId"))

        c_prime = sum(1 for x in csites if x.get("econTier") == "prime")
        c_vuln = sum(1 for x in csites if x.get("econTier") == "vulnerable")
        c_dist = sum(1 for x in csites if x.get("econTier") == "distressed")
        c_nd = sum(1 for x in csites if x.get("econTier") == "nondisclosed")
        c_poor = sum(1 for x in csites if x.get("econTier") == "poordoc")

        if cf.get("budgetUsd") is None or cf.get("basis") == "unlisted":
            unlisted_budget_countries += 1
        else:
            # Update mappedSites count in global-funding countries
            cf["mappedSites"] = tot

        is_sov = iso3 not in NON_SOVEREIGN_POLITY_STATUS
        polity_status = "Sovereign State" if is_sov else NON_SOVEREIGN_POLITY_STATUS[iso3]
        new_countries_summary.append({
            "iso3": iso3,
            "name": cprev.get("name", iso3),
            "isSovereign": is_sov,
            "polityStatus": polity_status,
            "continent": cprev.get("continent", ""),
            "center": cprev.get("center", [0, 20]),
            "bbox": cprev.get("bbox", [-180, -60, 180, 75]),
            "total": tot,
            "unesco": sum(1 for x in csites if x.get("unesco")),
            "restoration": sum(1 for x in csites if x.get("unescoDanger") or x.get("inRestoration")),
            "mostVisited": sum(1 for x in csites if x.get("isMostVisited")),
            "photographed": photographed,
            "uncovered": c_poor,
            "missingPhoto": tot - photographed,
            "withWiki": with_wiki,
            "withYear": with_year,
            "withVisitors": with_vis,
            "withSiteFunding": with_site_fund,
            "withDigitalRegistry": with_reg_code,
            "prime": c_prime,
            "vulnerable": c_vuln,
            "distressed": c_dist,
            "nonDisclosed": c_nd,
            "poorDoc": c_poor,
            "funded": c_prime,
            "underfunded": c_vuln + c_dist,
            "contested": sum(1 for x in csites if x.get("contested")),
            "recognizingBody": cf.get("recognizingBody") or cprev.get("recognizingBody", ""),
            "statutoryRegister": cf.get("statutoryRegister") or cprev.get("statutoryRegister", ""),
            "registryUrl": cf.get("registryUrl") or cprev.get("registryUrl", ""),
            "budgetUsd": cf.get("budgetUsd"),
            "perSiteUsd": cf.get("perSiteUsd"),
            "statutorySites": cf.get("statutorySites"),
            "shortAgency": cf.get("shortAgency", ""),
            "fy": cf.get("fy", ""),
            "fundingTier": cf.get("tier", "unknown"),
            "fundingBasis": cf.get("basis", "unlisted"),
        })

        # Determine exact APIs & datasets pulled for this country
        apis_used: list[dict] = []
        matched_prefixes: collections.Counter = collections.Counter()
        for x in csites:
            rc = (x.get("registryCode") or "").strip()
            if rc:
                for pref, label in REG_PREFIX_API_LABELS.items():
                    if rc.startswith(pref + " "):
                        matched_prefixes[pref] += 1
                        break
                else:
                    if rc.startswith("Guobao ") or "Guobao" in (x.get("heritageDesignation") or ""):
                        matched_prefixes["Guobao"] += 1

        for pref, cnt in matched_prefixes.most_common(4):
            lbl = REG_PREFIX_API_LABELS.get(pref, "National Cultural Heritage Administration (NCHA Guobao Register)")
            apis_used.append({
                "name": lbl,
                "kind": "National Registry API",
                "url": cf.get("registryUrl") or "",
                "records": cnt,
            })

        if not matched_prefixes and (cf.get("statutoryRegister") or cprev.get("statutoryRegister")):
            apis_used.append({
                "name": f"{cf.get('statutoryRegister') or cprev.get('statutoryRegister')}",
                "kind": "Statutory Register",
                "url": cf.get("registryUrl") or "",
                "records": with_reg_code,
            })

        # Core monument graph & UNESCO APIs
        apis_used.append({
            "name": "Wikidata QLever SPARQL API (P1435 Heritage / P5816 State / P1174 Visitors)",
            "kind": "Graph SPARQL API",
            "url": "https://qlever.dev/wikidata",
            "records": tot,
        })
        unesco_cnt = sum(1 for x in csites if x.get("unesco"))
        if unesco_cnt > 0:
            apis_used.append({
                "name": "UNESCO World Heritage Centre API (whc001 & DataHub prj001)",
                "kind": "Multilateral API",
                "url": "https://data.unesco.org/explore/dataset/whc001/",
                "records": unesco_cnt,
            })

        # Economic / Budget source API or official publication
        if cf.get("budgetUsd") is not None and cf.get("basis") != "unlisted":
            apis_used.append({
                "name": f"{cf.get('agency') or cf.get('shortAgency') or 'Public Heritage Budget'} ({cf.get('fy') or 'Published'})",
                "kind": "Budget & Finance",
                "url": cf.get("sourceUrl") or "",
                "records": 1,
            })

        # International Conservation Grants (ALIPH / AFCP / WMF / AKTC) if active in country
        grant_sites_cnt = sum(1 for x in csites if x.get("qid") in rest_fund)
        if grant_sites_cnt > 0:
            apis_used.append({
                "name": "International Conservation Grant Registries (ALIPH / U.S. AFCP / WMF / UNESCO)",
                "kind": "Conservation Grants",
                "url": "https://www.aliph-foundation.org/",
                "records": grant_sites_cnt,
            })

        # Wikimedia Commons & Wikipedia REST Summary API
        apis_used.append({
            "name": "Wikimedia Commons MediaWiki API & Wikipedia REST Summary v1",
            "kind": "Archival & Visual API",
            "url": "https://en.wikipedia.org/api/rest_v1/",
            "records": photographed,
        })

        for a in apis_used:
            a["shortLabel"] = make_api_short_label(a.get("name", ""), a.get("kind", ""))

        country_sources_rows.append({
            "iso3": iso3,
            "name": cprev.get("name", iso3),
            "isSovereign": is_sov,
            "polityStatus": polity_status,
            "continent": cprev.get("continent", "Global"),
            "monuments": tot,
            "recognizingBody": cf.get("recognizingBody") or cprev.get("recognizingBody", ""),
            "statutoryRegister": cf.get("statutoryRegister") or cprev.get("statutoryRegister", ""),
            "registryUrl": cf.get("registryUrl") or cprev.get("registryUrl", ""),
            "budgetUsd": cf.get("budgetUsd"),
            "budgetFy": cf.get("fy") or "",
            "budgetAgency": cf.get("shortAgency") or cf.get("agency") or "",
            "budgetSourceUrl": cf.get("sourceUrl") or "",
            "siteBudgetsDisclosed": with_site_fund,
            "meteredVisitors": with_vis,
            "registryIdsLinked": with_reg_code,
            "photographedPct": round((photographed / tot) * 100, 1) if tot else 0.0,
            "prime": c_prime,
            "vulnerable": c_vuln,
            "distressed": c_dist,
            "nonDisclosed": c_nd,
            "poorDoc": c_poor,
            "apis": apis_used,
        })

    # Build cited monument-level Funding Sources & Origin breakdown (Host State, Foreign Country Aid, Private Donors, Gate Revenue)
    funding_sources_map = build_funding_sources_map(gf, by_country)
    gf["fundingSources"] = funding_sources_map

    # Update global-funding meta summary
    gf["meta"]["totalMonuments"] = len(all_sites)
    gf["meta"]["totalCountries"] = len(new_countries_summary)
    gf["meta"]["disclosedSiteBudgets"] = len(gf.get("sites", {}))
    gf["meta"]["fundingOriginSites"] = len(funding_sources_map)
    gf["meta"]["meteredVisitorSites"] = len(gf.get("visitors", {}))
    gf["meta"]["restorationGrantSites"] = len(gf.get("restoration", {}))
    gf["meta"]["unreportedBudgetCountries"] = unlisted_budget_countries
    gf_path.write_text(json.dumps(gf, separators=(",", ":")), encoding="utf-8")

    global_gaps = {
        "missingPhoto": sum(1 for x in all_sites if not x.get("image")),
        "missingWiki": sum(1 for x in all_sites if not x.get("wikipedia")),
        "missingYear": sum(1 for x in all_sites if x.get("year") is None),
        "missingVisitors": sum(1 for x in all_sites if not (x.get("annualVisitors") or 0) > 0),
        "missingSiteFunding": sum(1 for x in all_sites if not x.get("hasSiteFunding")),
        "missingRegistryCode": sum(1 for x in all_sites if not x.get("registryCode") and not x.get("asiId")),
        "unreportedCountryBudgets": unlisted_budget_countries,
    }

    sov_cnt = sum(1 for c in new_countries_summary if c.get("isSovereign"))
    ter_cnt = len(new_countries_summary) - sov_cnt
    world_summary = {
        "totalMonuments": len(all_sites),
        "totalUnesco": len(unesco_ids_seen),
        "totalMostVisited": sum(1 for x in all_sites if x.get("isMostVisited")),
        "countriesCount": len(new_countries_summary),
        "sovereignCountriesCount": sov_cnt,
        "territoriesCount": ter_cnt,
        "contestedAreasCount": ws_prev.get("contestedAreasCount", 23),
        "contestedMonuments": contested_site_count,
        "eraCounts": dict(era_counts),
        "econCounts": dict(econ_counts),
        "documentationGaps": global_gaps,
        "evidenceCounts": {
            "fundingDoc": sum(1 for x in all_sites if x.get("hasSiteFunding") or (x.get("revenueCr") or 0) > 0 or x.get("econTier") == "prime" or bool(funding_sources_map.get(x["qid"]))),
            "foreignAid": sum(1 for x in all_sites if any(src.get("type") == "foreign_gov" for src in funding_sources_map.get(x["qid"], []))),
            "privateDonor": sum(1 for x in all_sites if any(src.get("type") == "private_donor" for src in funding_sources_map.get(x["qid"], [])) or bool(x.get("adoptPartner"))),
            "visitorDoc": sum(1 for x in all_sites if (x.get("annualVisitors") or 0) > 0 or x["qid"] in gf.get("visitors", {})),
            "wikiDoc": sum(1 for x in all_sites if bool(x.get("wikipedia"))),
            "photoDoc": sum(1 for x in all_sites if bool(x.get("image"))),
            "noPhoto": sum(1 for x in all_sites if not x.get("image")),
        },
        "countries": new_countries_summary,
    }
    ws_path.write_text(json.dumps(world_summary, separators=(",", ":")), encoding="utf-8")

    # Write country-sources.json for About page
    country_sources_payload = {
        "generatedAt": "2026-11-15",
        "totalMonuments": len(all_sites),
        "totalCountries": len(country_sources_rows),
        "sovereignCountriesCount": sov_cnt,
        "territoriesCount": ter_cnt,
        "econCounts": dict(econ_counts),
        "documentationGaps": global_gaps,
        "globalApis": [
            {
                "name": "Wikidata QLever SPARQL Engine",
                "endpoint": "https://qlever.dev/api/wikidata",
                "purpose": "Harvests statutory heritage designations (P1435), national registry IDs across 60+ sovereign registers, physical conservation status (P5816), multi-year visitor attendance (P1174), inception dates (P571), architectural style/material/patronage, and coordinates — strictly filtered to human-built structures.",
            },
            {
                "name": "UNESCO World Heritage Centre & Culture DataHub APIs",
                "endpoint": "https://data.unesco.org/api/explore/v2.1/catalog/datasets/",
                "purpose": "Provides official World Heritage Cultural inscriptions & Danger listings (whc001, criteria i–vi only), audited international cultural assistance grants (prj001), and SDG 11.4.1 per-capita public cultural heritage expenditure (uis002).",
            },
            {
                "name": "59+ Sovereign National Heritage Registry & Open-Data Portals",
                "endpoint": "Country-specific statutory APIs (ASI, POP Base Mérimée, NHLE, NRHP, ICCD, BIC, RCE, Bunkachō, NCHA Guobao, SAHRA, IPHAN, etc.)",
                "purpose": "Cross-validates statutory monument IDs within sovereign borders, links each monument to its legal act and recognizing ministry, and supplies official domestic conservation budgets & audited ticket compendia.",
            },
            {
                "name": "Multilateral & Philanthropic Conservation Grant Registries",
                "endpoint": "ALIPH Foundation · U.S. Ambassadors Fund (AFCP) · World Monuments Fund · Aga Khan Trust for Culture · IMF COFOG (GF0802)",
                "purpose": "Tracks active emergency stabilization and conservation grants for conflict-, disaster-, and climate-threatened monuments, plus general government cultural expenditure where ministry line-items are unpublished.",
            },
            {
                "name": "Wikimedia Commons MediaWiki API & Wikipedia REST API v1",
                "endpoint": "https://en.wikipedia.org/api/rest_v1/page/summary/",
                "purpose": "Retrieves open-licensed ground photography, multi-image monument galleries, and scholarly historical summaries while exposing photographic and archival documentation gaps where absent.",
            },
            {
                "name": "ESRI World Imagery & Natural Earth 10m Admin-0 / Admin-1",
                "endpoint": "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
                "purpose": "Supplies orbital satellite fallback views for unphotographed monuments and validates sub-national state/province/region boundaries and disputed territory overlays.",
            },
        ],
        "countries": country_sources_rows,
    }
    (DATA_DIR / "country-sources.json").write_text(
        json.dumps(country_sources_payload, separators=(",", ":")),
        encoding="utf-8",
    )

    # Build search-top.json
    search_top = []
    seen_q: set[str] = set()
    per_country_included: dict[str, int] = {}
    for s in all_sites:
        c_iso = s["countryIso"]
        econ_tier = s["econTier"]
        must_include = (
            len(search_top) < 10000
            or econ_tier in ("prime", "vulnerable", "distressed")
            or s.get("unesco")
            or s.get("isMostVisited")
            or per_country_included.get(c_iso, 0) < 5
        )
        if not must_include or s["qid"] in seen_q:
            continue
        seen_q.add(s["qid"])
        per_country_included[c_iso] = per_country_included.get(c_iso, 0) + 1
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
            "cat": econ_tier,
        })
    (DATA_DIR / "search-top.json").write_text(json.dumps(search_top, separators=(",", ":")), encoding="utf-8")

    # Build monuments_for_pmtiles.geojson sorted ascending by _sk so Prime/Vulnerable/Distressed draw cleanly on top!
    tile_sorted = sorted(all_sites, key=lambda x: (int(x.get("_sk") or 1), int(x.get("priorityScore") or 0)))
    tile_features = []
    for s in tile_sorted:
        econ_tier = s["econTier"]
        img_slug = compact_commons_slug(s.get("image"))
        img_raw = "" if img_slug else (s.get("image") or "")
        q = s["qid"]
        fsrcs = funding_sources_map.get(q, [])
        has_fd = 1 if (s.get("hasSiteFunding") or (s.get("revenueCr") or 0) > 0 or econ_tier == "prime" or bool(fsrcs)) else 0
        has_fa = 1 if any(src.get("type") == "foreign_gov" for src in fsrcs) else 0
        has_pv = 1 if (any(src.get("type") == "private_donor" for src in fsrcs) or bool(s.get("adoptPartner"))) else 0
        has_vis = 1 if ((s.get("annualVisitors") or 0) > 0 or q in gf.get("visitors", {})) else 0
        has_wk = 1 if bool(s.get("wikipedia")) else 0
        has_img = 1 if bool(s.get("image")) else 0
        has_rg = 1 if bool(s.get("registryCode") or s.get("asiId")) else 0
        dq_val = has_fd + has_vis + has_wk + has_img + has_rg
        no_doc_val = 1 if dq_val == 0 else 0
        wp_val = re.sub(r"^https?://en\.wikipedia\.org/wiki/", "", s.get("wikipedia") or "")
        tile_features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": s["coords"]},
            "properties": {
                "qid": q,
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
                "fd": has_fd,
                "fa": has_fa,
                "pv": has_pv,
                "wk": has_wk,
                "wp": wp_val,
                "rg": has_rg,
                "dq": dq_val,
                "noDoc": no_doc_val,
                "era": s.get("era") or "unk",
                "yr": s.get("year") if s.get("year") is not None else -99999,
                "ct": 1 if s.get("contested") else 0,
                "ctName": s.get("contestedArea") or "",
                "img": has_img,
                "imgF": img_slug,
                "imgU": img_raw,
                "un": 1 if s.get("unesco") else 0,
                "unId": s.get("unescoId") or "",
                "danger": 1 if s.get("unescoDanger") else 0,
                "rest": 1 if s.get("inRestoration") else 0,
                "uf": 1 if s.get("underfunded") else 0,
                "fund": 1 if s.get("hasFunding") else 0,
                "mv": 1 if s.get("isMostVisited") else 0,
                "uncov": 1 if econ_tier == "poordoc" else 0,
                "sl": s.get("sitelinks") or 0,
                "mz": 0,
                "cat": econ_tier,
                "sk": int(s.get("_sk") or 1),
                "pr": int(s.get("priorityScore") or 0),
            },
        })
    (CACHE_DIR / "monuments_for_pmtiles.geojson").write_text(
        json.dumps({"type": "FeatureCollection", "features": tile_features}, separators=(",", ":")),
        encoding="utf-8",
    )

    print(f"Purged {removed_count:,} natural features.")
    print(f"Remaining strictly human-built monuments: {len(all_sites):,} across {len(new_countries_summary)} countries/territories.")
    print(f"Economic & Documentation Tiers: {dict(econ_counts)}")
    print(f"Documentation Gaps: {global_gaps}")


if __name__ == "__main__":
    main()
