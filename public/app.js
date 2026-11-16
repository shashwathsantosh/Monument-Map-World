// Global Atlas of Government-Recognized Monuments — PMTiles Vector Tiles, Funding Health & Documentation Audit

const DATA_VER = "20261115v49";
const PMTILES_URL = `data/monuments.pmtiles?v=${DATA_VER}`;

const INDIA_TICKET_HISTORY_5Y = {
  "taj mahal": {
    fys: ["FY20", "FY21", "FY22", "FY23", "FY24"],
    revenueCr: [97.11, 9.53, 25.62, 66.57, 98.55],
    visitorsLakhs: [63.17, 17.31, 27.21, 62.35, 76.24],
    source: "Ministry of Culture (Rajya Sabha) & MoT India Tourism Data Compendium",
    url: "https://tourism.gov.in/",
  },
  "agra fort": {
    fys: ["FY20", "FY21", "FY22", "FY23", "FY24"],
    revenueCr: [28.94, 1.31, 4.0, 15.32, 15.27],
    visitorsLakhs: [20.14, null, null, 15.49, 16.29],
    source: "Ministry of Culture (Rajya Sabha) & MoT India Tourism Data Compendium",
    url: "https://tourism.gov.in/",
  },
  "qutub minar": {
    fys: ["FY20", "FY21", "FY22", "FY23", "FY24"],
    revenueCr: [20.17, 1.56, 5.07, 19.2, 23.8],
    visitorsLakhs: [23.03, null, 18.83, 32.39, 33.44],
    source: "Ministry of Culture (Rajya Sabha) & MoT India Tourism Data Compendium",
    url: "https://tourism.gov.in/",
  },
  "qutb minar": {
    fys: ["FY20", "FY21", "FY22", "FY23", "FY24"],
    revenueCr: [20.17, 1.56, 5.07, 19.2, 23.8],
    visitorsLakhs: [23.03, null, 18.83, 32.39, 33.44],
    source: "Ministry of Culture (Rajya Sabha) & MoT India Tourism Data Compendium",
    url: "https://tourism.gov.in/",
  },
  "red fort": {
    fys: ["FY20", "FY21", "FY22", "FY23", "FY24"],
    revenueCr: [16.24, 0.9, 6.01, 13.11, 18.09],
    visitorsLakhs: [null, null, null, 22.64, 28.78],
    source: "Ministry of Culture (Rajya Sabha) & MoT India Tourism Data Compendium",
    url: "https://tourism.gov.in/",
  },
  "lal qila": {
    fys: ["FY20", "FY21", "FY22", "FY23", "FY24"],
    revenueCr: [16.24, 0.9, 6.01, 13.11, 18.09],
    visitorsLakhs: [null, null, null, 22.64, 28.78],
    source: "Ministry of Culture (Rajya Sabha) & MoT India Tourism Data Compendium",
    url: "https://tourism.gov.in/",
  },
};

const SITE_COLORS = {
  fundingdoc: "#179652",
  foreignaid: "#7c3aed",
  visitordoc: "#2563eb",
  wikidoc: "#f7b500",
  photodoc: "#8594a6",
  nophoto: "#e14932",
  prime: "#179652",
  vulnerable: "#f7b500",
  distressed: "#e14932",
  nondisclosed: "#64748b",
  poordoc: "#7c3aed",
  unesco: "#ff9500",
  mostvisited: "#007aff",
  funded: "#15803d",
  prashad: "#af52de",
  restoration: "#dc2626",
  underfunded: "#d97706",
  uncovered: "#7c3aed",
  contested: "#dc2626",
  national: "#64748b",
  flagged: "#dc2626",
};

const ISO3_TO_ISO2 = {
  GBR:"GB",USA:"US",FRA:"FR",DEU:"DE",ESP:"ES",ITA:"IT",RUS:"RU",IND:"IN",POL:"PL",NLD:"NL",CZE:"CZ",BRA:"BR",NOR:"NO",AUT:"AT",UKR:"UA",JPN:"JP",SWE:"SE",PRT:"PT",CHE:"CH",ROU:"RO",IRN:"IR",BEL:"BE",CHN:"CN",SRB:"RS",FIN:"FI",GRC:"GR",CAN:"CA",BLR:"BY",TUR:"TR",AUS:"AU",MDA:"MD",ARG:"AR",SVK:"SK",NGA:"NG",DNK:"DK",BGR:"BG",IDN:"ID",MEX:"MX",ALB:"AL",AZE:"AZ",SVN:"SI",HUN:"HU",HKG:"HK",LUX:"LU",THA:"TH",EGY:"EG",DZA:"DZ",MYS:"MY",MKD:"MK",SYR:"SY",SAU:"SA",PRI:"PR",YEM:"YE",ZAF:"ZA",LTU:"LT",HRV:"HR",ARM:"AM",PER:"PE",MLT:"MT",BIH:"BA",LVA:"LV",EST:"EE",IRL:"IE",IMN:"IM",TUN:"TN",UZB:"UZ",LBY:"LY",KOR:"KR",ALA:"AX",IRQ:"IQ",NZL:"NZ",BGD:"BD",PAK:"PK",TWN:"TW",URY:"UY",COL:"CO",PHL:"PH",SUR:"SR",VNM:"VN",CHL:"CL",ISR:"IL",PSE:"PS",LKA:"LK",ETH:"ET",GEO:"GE",LBN:"LB",MAR:"MA",PAN:"PA",VEN:"VE",CYP:"CY",ARE:"AE",SGP:"SG",UGA:"UG",MOZ:"MZ",JOR:"JO",KAZ:"KZ",CUB:"CU",MMR:"MM",KHM:"KH",BOL:"BO",NAM:"NA",GHA:"GH",AND:"AD",KOS:"XK",ISL:"IS",GTM:"GT",PYF:"PF",MNE:"ME",PRK:"KP",AFG:"AF",MAC:"MO",VIR:"VI",AGO:"AO",SDN:"SD",TZA:"TZ",ECU:"EC",FRO:"FO",KEN:"KE",CPV:"CV",MDG:"MG",NPL:"NP",GGY:"GG",BHR:"BH",OMN:"OM",CMR:"CM",BEN:"BJ",SLV:"SV",NER:"NE",TLS:"TL",NCL:"NC",TKM:"TM",SEN:"SN",ABW:"AW",BLZ:"BZ",LIE:"LI",GUM:"GU",MNG:"MN",MLI:"ML",GNB:"GW",FJI:"FJ",BRN:"BN",BFA:"BF",NIC:"NI",BHS:"BS",BMU:"BM",ERI:"ER",JEY:"JE",LAO:"LA",RWA:"RW",CUW:"CW",HTI:"HT",VAT:"VA",CRI:"CR",CIV:"CI",TJK:"TJ",HND:"HN",DOM:"DO",TTO:"TT",GMB:"GM",JAM:"JM",STP:"ST",KGZ:"KG",FSM:"FM",TGO:"TG",MDV:"MV",MRT:"MR",KWT:"KW",PRY:"PY",BRB:"BB",TCD:"TD",GRL:"GL",QAT:"QA",MUS:"MU",MCO:"MC",DJI:"DJ",MNP:"MP",SMR:"SM",BTN:"BT",COD:"CD",GUY:"GY",SOM:"SO",ZMB:"ZM",BWA:"BW",SYC:"SC",KNA:"KN",ZWE:"ZW",ASM:"AS",ATG:"AG",VGB:"VG",SHN:"SH",SLE:"SL",PNG:"PG",BDI:"BI",GIN:"GN",MWI:"MW",PLW:"PW",SPM:"PM",WLF:"WF",GAB:"GA",SWZ:"SZ",BLM:"BL",TON:"TO",MAF:"MF",SXM:"SX",GRD:"GD",LSO:"LS",COG:"CG",CYM:"KY",DMA:"DM",FLK:"FK",MHL:"MH",CAF:"CF",COM:"KM",LBR:"LR",VUT:"VU",KIR:"KI",LCA:"LC",TCA:"TC",AIA:"AI",SLB:"SB",COK:"CK",GNQ:"GQ",VCT:"VC",WSM:"WS",SSD:"SS",MSR:"MS",NRU:"NR",TUV:"TV",ESH:"EH",NIU:"NU"
};

function flagForIso3(iso3) {
  const code = ISO3_TO_ISO2[String(iso3 || "").toUpperCase()];
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(...code.split("").map((c) => 127397 + c.charCodeAt(0)));
}

const ECON_TIER_LABELS = {
  prime: "Healthy",
  healthy: "Healthy",
  vulnerable: "Vulnerable",
  distressed: "Distressed",
  nondisclosed: "Poor Documentation",
  poordoc: "Poor Documentation",
};

const ERA_LABELS = {
  all: "All Eras",
  anc: "Ancient (<500 CE)",
  med: "Medieval (500–1499)",
  ear: "Early Modern (1500–1799)",
  mod: "Modern (1800+)",
  unk: "Undated (Not Available)",
};

const CURRENCY_RATES = {
  USD: { symbol: "$", usdRate: 1, perInr: 1 / 84.5, unitCr: "M", crToUnit: 0.1183, lakhToUnit: 1183.4 },
  INR: { symbol: "₹", usdRate: 84.5, perInr: 1, unitCr: "Cr", crToUnit: 1, lakhToUnit: 1 },
  EUR: { symbol: "€", usdRate: 0.924, perInr: 1 / 91.5, unitCr: "M", crToUnit: 0.1093, lakhToUnit: 1092.9 },
  GBP: { symbol: "£", usdRate: 0.788, perInr: 1 / 108.0, unitCr: "M", crToUnit: 0.0926, lakhToUnit: 925.9 },
};

const HISTORY_CUE_RE =
  /(built|construct|erect|found|establish|commission|reign|dynasty|king|emperor|queen|sultan|pharaoh|caliph|ruler|empire|kingdom|civilization|sacred|pilgrimage|royal|imperial|capital|fortif|battle|siege|century|historic|unesco|heritage|carved|designed|architect|masterpiece|oldest|largest|earliest|first|preserved|testimony|monumental|inscrib|excavat)/i;

const DRY_LOCATION_ONLY_RE =
  /^(it is (located|situated)|the (site|building|monument|structure|church|temple|castle|fort) is (located|situated))\b[^.!?]*\b(km|kilomet|miles?|north|south|east|west|municipality|district|province|county)\b/i;

const LEGEND_COLOR_ORDER = ["foreignaid", "fundingdoc", "visitordoc", "wikidoc", "photodoc", "nophoto"];

const LEGEND_FILTER_SPEC = {
  fundingdoc: {
    label: "Published Funding",
    countLabel: "with Published Funding",
    statKey: "fundingDoc",
    expr: ["==", ["coalesce", ["get", "fd"], 0], 1],
    matches: (ev) => ev.hasFund,
  },
  foreignaid: {
    label: "Foreign Aid",
    countLabel: "with Foreign Aid",
    statKey: "foreignAid",
    expr: ["==", ["coalesce", ["get", "fa"], 0], 1],
    matches: (ev) => ev.hasForeign,
  },
  visitordoc: {
    label: "Visitor Logs",
    countLabel: "with Visitor Logs",
    statKey: "visitorDoc",
    expr: [">", ["coalesce", ["get", "vis"], 0], 0],
    matches: (ev) => ev.hasVis,
  },
  wikidoc: {
    label: "Wikipedia Entry",
    countLabel: "with Wikipedia Entry",
    statKey: "wikiDoc",
    expr: ["==", ["coalesce", ["get", "wk"], 0], 1],
    matches: (ev) => ev.hasWiki,
  },
  photodoc: {
    label: "Photo Documentation",
    countLabel: "with Photo Documentation",
    statKey: "photoDoc",
    expr: ["==", ["coalesce", ["get", "img"], 0], 1],
    matches: (ev) => ev.hasPhoto,
  },
  nophoto: {
    label: "Missing Photo",
    countLabel: "with Missing Photo",
    statKey: "noPhoto",
    expr: ["==", ["coalesce", ["get", "img"], 0], 0],
    matches: (ev) => !ev.hasPhoto,
  },
};

const state = {
  currency: "USD",
  worldSummary: null,
  countriesGeo: null,
  contestedGeo: null,
  riversGeo: null,
  unescoWorld: {},
  searchTop: [],
  indiaExtras: null,
  globalFunding: null,
  countryNameToIso: {},
  countryShards: {},
  countryShardPromises: {},
  activeCountry: "",
  activeRegion: "",
  activeFilters: [],
  activeEra: "all",
  activeDesignation: "all",
  contestedOnly: false,
  photosOnly: false,
  showCountryBorders: true,
  searchQuery: "",
  galleryCache: {},
  wikiCache: {},
  wdFactsCache: {},
  remoteSearchCache: {},
  lastDrawer: null,
  carouselHandler: null,
  nearbyNav: null,
};

const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const preloadDataPromise = Promise.all([
  fetch(`data/world-summary.json?v=${DATA_VER}`).then((r) => r.json()),
  fetch("data/world-countries.geojson").then((r) => r.json()),
  fetch("data/unesco-world.json").then((r) => r.json()),
  fetch(`data/search-top.json?v=${DATA_VER}`).then((r) => r.json()),
  fetch("data/contested-areas.geojson").then((r) => r.json()).catch(() => null),
  fetch("data/india-extras.json").then((r) => r.json()).catch(() => null),
  fetch("data/world-rivers.geojson").then((r) => r.json()).catch(() => null),
  fetch(`data/global-funding.json?v=${DATA_VER}`).then((r) => r.json()).catch(() => null),
]);

const plateStyle = {
  version: 8,
  projection: { type: "globe" },
  sky: {
    "sky-color": "rgba(8, 16, 37, 0)",
    "sky-horizon-blend": 0.45,
    "horizon-color": "rgba(151, 191, 203, 0.55)",
    "horizon-fog-blend": 0.35,
    "fog-color": "rgba(151, 191, 203, 0.25)",
    "fog-ground-blend": 0.4,
    "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.45, 5, 0.22, 7, 0],
  },
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {
    openmaptiles: {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
    },
  },
  layers: [
    {
      id: "plate-paper",
      type: "background",
      paint: { "background-color": "#e6eef2" },
    },
  ],
};

function formatUsdMoney(usdVal, perSite = false) {
  if (usdVal === null || usdVal === undefined || Number.isNaN(Number(usdVal))) return "Not Available";
  const cfg = CURRENCY_RATES[state.currency] || CURRENCY_RATES.USD;
  const suffix = perSite ? " / site" : "";
  if (state.currency === "INR") {
    const inr = Number(usdVal) * cfg.usdRate;
    if (inr >= 1e7) {
      const cr = inr / 1e7;
      return `₹${cr >= 100 ? Math.round(cr).toLocaleString() : cr.toFixed(cr >= 10 ? 1 : 2).replace(/\.0+$/, "")} Cr${suffix}`;
    }
    if (inr >= 1e5) {
      const lakh = inr / 1e5;
      return `₹${lakh.toFixed(lakh >= 10 ? 1 : 2).replace(/\.0+$/, "")}L${suffix}`;
    }
    return `₹${Math.round(inr).toLocaleString()}${suffix}`;
  }
  const conv = Number(usdVal) * (cfg.usdRate || 1);
  if (conv >= 1e9) {
    return `${cfg.symbol}${(conv / 1e9).toFixed(2).replace(/\.?0+$/, "")}B${suffix}`;
  }
  if (conv >= 1e6) {
    const m = conv / 1e6;
    return `${cfg.symbol}${m >= 100 ? Math.round(m) : m.toFixed(m >= 10 ? 1 : 2).replace(/\.0+$/, "")}M${suffix}`;
  }
  if (conv >= 1e3) {
    const k = conv / 1e3;
    return `${cfg.symbol}${k >= 20 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}K${suffix}`;
  }
  return `${cfg.symbol}${Math.round(conv).toLocaleString()}${suffix}`;
}

function formatMoneyCr(crVal, compact = false) {
  if (crVal === null || crVal === undefined || Number.isNaN(crVal)) return "Not Available";
  const cfg = CURRENCY_RATES[state.currency] || CURRENCY_RATES.USD;
  if (state.currency === "INR") {
    return compact ? `₹${crVal} Cr` : `₹${crVal} Cr`;
  }
  const valM = crVal * cfg.crToUnit;
  if (valM < 1) {
    const valK = Math.round(valM * 1000);
    return `${cfg.symbol}${valK.toLocaleString()}K`;
  }
  return `${cfg.symbol}${valM.toFixed(valM >= 10 ? 1 : 2)}${cfg.unitCr}`;
}

function formatMoneyLakh(lakhVal, perSite = false) {
  if (lakhVal === null || lakhVal === undefined || Number.isNaN(lakhVal)) return "Not Available";
  const cfg = CURRENCY_RATES[state.currency] || CURRENCY_RATES.USD;
  const suffix = perSite ? " / site" : "";
  if (state.currency === "INR") {
    return `₹${lakhVal.toFixed(2)}L${suffix}`;
  }
  const usd = Math.round(lakhVal * cfg.lakhToUnit);
  return `${cfg.symbol}${usd >= 1000 ? `${(usd / 1000).toFixed(1)}K` : usd}${suffix}`;
}

function formatTicketPair(indInr, forInr) {
  if (!indInr && !forInr) return "Open / Free";
  const cfg = CURRENCY_RATES[state.currency] || CURRENCY_RATES.USD;
  if (state.currency === "INR") {
    return `₹${indInr || 0} Domestic · ₹${forInr || 0} Foreign`;
  }
  const a = (indInr * cfg.perInr).toFixed(2).replace(/\.00$/, "");
  const b = (forInr * cfg.perInr).toFixed(2).replace(/\.00$/, "");
  return `${cfg.symbol}${a} Domestic · ${cfg.symbol}${b} Foreign`;
}

// ---------- Custom Apple Select Popover (100% App Font Matching + Instant Search) ----------
const customSelectRegistry = new Map();
let activeSelectPopover = null;
let activeSelectOwner = null;

function ensureSelectPopoverEl() {
  if (activeSelectPopover) return activeSelectPopover;
  const pop = document.createElement("div");
  pop.className = "apple-select-popover hidden";
  pop.id = "apple-select-popover";
  pop.setAttribute("role", "listbox");
  document.body.appendChild(pop);
  activeSelectPopover = pop;

  document.addEventListener("mousedown", (ev) => {
    if (!activeSelectOwner) return;
    const rec = customSelectRegistry.get(activeSelectOwner);
    if (pop.contains(ev.target) || (rec && rec.btn.contains(ev.target))) return;
    closeCustomSelectPopover();
  });
  window.addEventListener("resize", closeCustomSelectPopover);
  return pop;
}

function closeCustomSelectPopover() {
  if (activeSelectPopover) activeSelectPopover.classList.add("hidden");
  if (activeSelectOwner) {
    const rec = customSelectRegistry.get(activeSelectOwner);
    if (rec) rec.btn.setAttribute("aria-expanded", "false");
    activeSelectOwner = null;
  }
}

function splitOptionLabel(text) {
  const m = String(text || "").trim().match(/^(.*?)\s+\(([\d,]+)\)$/);
  if (m) return { main: m[1].trim(), meta: m[2] };
  return { main: String(text || "").trim(), meta: "" };
}

function syncCustomSelect(selectEl) {
  if (!selectEl) return;
  const rec = customSelectRegistry.get(selectEl);
  if (!rec) return;
  const selOpt = selectEl.options[selectEl.selectedIndex] || selectEl.options[0];
  rec.labelSpan.textContent = selOpt ? selOpt.textContent : "";
}

function enhanceSelect(selectEl, opts = {}) {
  if (!selectEl) return;
  const existing = customSelectRegistry.get(selectEl);
  if (existing) {
    syncCustomSelect(selectEl);
    return;
  }
  selectEl.classList.add("sr-select-hidden");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `apple-select-btn${opts.pill ? " is-pill" : ""}`;
  btn.setAttribute("aria-haspopup", "listbox");
  btn.setAttribute("aria-expanded", "false");
  if (selectEl.getAttribute("aria-label")) {
    btn.setAttribute("aria-label", selectEl.getAttribute("aria-label"));
  }
  const labelSpan = document.createElement("span");
  labelSpan.className = "apple-select-btn-label";
  const chev = document.createElement("span");
  chev.className = "apple-select-btn-chev";
  chev.innerHTML = `<svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  btn.appendChild(labelSpan);
  btn.appendChild(chev);
  selectEl.insertAdjacentElement("afterend", btn);

  customSelectRegistry.set(selectEl, { btn, labelSpan, opts });
  syncCustomSelect(selectEl);

  btn.addEventListener("click", () => {
    const pop = ensureSelectPopoverEl();
    if (activeSelectOwner === selectEl && !pop.classList.contains("hidden")) {
      closeCustomSelectPopover();
      return;
    }
    closeCustomSelectPopover();
    activeSelectOwner = selectEl;
    btn.setAttribute("aria-expanded", "true");

    const options = Array.from(selectEl.options);
    const searchable = Boolean(opts.searchable || options.length > 14);
    pop.innerHTML = `
      ${searchable ? `<input type="search" class="apple-select-search" placeholder="Filter countries or territories…" autocomplete="off" />` : ""}
      <div class="apple-select-list"></div>
    `;
    const listEl = pop.querySelector(".apple-select-list");
    const searchInput = pop.querySelector(".apple-select-search");

    const renderOpts = (q = "") => {
      const needle = q.trim().toLowerCase();
      const filtered = needle
        ? options.filter((o) => o.textContent.toLowerCase().includes(needle) || o.value.toLowerCase().includes(needle))
        : options;
      if (!filtered.length) {
        listEl.innerHTML = `<div class="search-empty">No matching options</div>`;
        return;
      }
      listEl.innerHTML = filtered
        .map((o) => {
          const { main, meta } = splitOptionLabel(o.textContent);
          const isSel = o.value === selectEl.value;
          return `<button type="button" class="apple-select-opt${isSel ? " is-selected" : ""}" role="option" aria-selected="${isSel}" data-val="${escapeHtml(o.value)}">
            <span class="apple-select-opt-main">${escapeHtml(main)}</span>
            ${meta ? `<span class="apple-select-opt-meta">${escapeHtml(meta)}</span>` : ""}
          </button>`;
        })
        .join("");
      listEl.querySelectorAll(".apple-select-opt").forEach((optBtn) => {
        optBtn.addEventListener("click", () => {
          selectEl.value = optBtn.dataset.val || "";
          syncCustomSelect(selectEl);
          closeCustomSelectPopover();
          selectEl.dispatchEvent(new Event("change", { bubbles: true }));
        });
      });
    };

    renderOpts("");
    pop.classList.remove("hidden");

    const rect = btn.getBoundingClientRect();
    const minW = opts.pill ? 132 : Math.max(rect.width, 268);
    const popW = Math.min(minW, window.innerWidth - 20);
    pop.style.width = `${popW}px`;
    const left = opts.pill
      ? Math.max(10, Math.min(rect.right - popW, window.innerWidth - popW - 10))
      : Math.max(10, Math.min(rect.left, window.innerWidth - popW - 10));
    const spaceBelow = window.innerHeight - rect.bottom - 14;
    pop.style.left = `${left}px`;
    if (spaceBelow < 220 && rect.top > 240) {
      pop.style.top = "auto";
      pop.style.bottom = `${window.innerHeight - rect.top + 6}px`;
    } else {
      pop.style.bottom = "auto";
      pop.style.top = `${rect.bottom + 6}px`;
    }

    const selRow = listEl.querySelector(".apple-select-opt.is-selected");
    if (selRow) selRow.scrollIntoView({ block: "nearest" });
    if (searchInput) {
      searchInput.addEventListener("input", () => renderOpts(searchInput.value));
      requestAnimationFrame(() => searchInput.focus());
    }
  });
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/\s*\u2014\s*/g, " - ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatYear(y) {
  if (y === null || y === undefined || y === "") return "Undated";
  const num = Number(y);
  if (Number.isNaN(num)) return String(y);
  return num < 0 ? `${Math.abs(num)} BCE` : `${num} CE`;
}

function thumbUrl(url) {
  if (!url) return "";
  if (url.includes("Special:FilePath")) {
    return url.replace(/\?width=\d+/, "") + "?width=420";
  }
  return url;
}

function hiResUrl(url) {
  if (!url) return "";
  if (url.includes("Special:FilePath")) {
    return url.replace(/\?width=\d+/, "") + "?width=1200";
  }
  return url;
}

function pinThumbUrl(url) {
  if (!url) return "";
  if (url.includes("Special:FilePath")) {
    return url.replace(/\?width=\d+/, "") + "?width=220";
  }
  return url;
}

function getGlobePadding() {
  const lpCollapsed = elLeftPanel && elLeftPanel.classList.contains("collapsed");
  if (window.innerWidth <= 900) {
    return { top: 44, bottom: 56, left: 16, right: 16 };
  }
  return { top: 46, bottom: 54, left: lpCollapsed ? 24 : 260, right: 24 };
}

const map = new maplibregl.Map({
  container: "map",
  style: plateStyle,
  center: [22, 18],
  zoom: window.innerWidth <= 760 ? 1.65 : 2.35,
  minZoom: 0.9,
  maxZoom: 19,
  pitch: 0,
  padding: window.innerWidth <= 900 ? { top: 44, bottom: 56, left: 16, right: 16 } : { top: 46, bottom: 54, left: 24, right: 24 },
  renderWorldCopies: false,
  attributionControl: false,
});

map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

class CenterWorldControl {
  onAdd() {
    const wrap = document.createElement("div");
    wrap.className = "maplibregl-ctrl maplibregl-ctrl-group";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "reset-view-btn";
    btn.className = "maplibregl-ctrl-center-world";
    btn.setAttribute("aria-label", "Reset zoom");
    btn.title = "Reset zoom";
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>`;
    btn.addEventListener("click", () => centerCamera(true));
    wrap.appendChild(btn);
    this._container = wrap;
    return wrap;
  }
  onRemove() {
    if (this._container?.parentNode) this._container.parentNode.removeChild(this._container);
  }
}
map.addControl(new CenterWorldControl(), "bottom-right");

const elCountry = document.getElementById("country-select");
const elRegionGroup = document.getElementById("region-filter-group");
const elRegion = document.getElementById("region-select");
const elEraSelect = document.getElementById("era-select");
const elDesignationSelect = document.getElementById("designation-select");
const elToggleCountryBorders = document.getElementById("toggle-country-borders");
const elToggleContested = document.getElementById("toggle-contested");
const elSearch = document.getElementById("search-input");
const elSearchDock = document.getElementById("search-dock");
const elSearchToggleBtn = document.getElementById("search-toggle-btn");
const elSearchWrap = document.getElementById("search-wrap");
const elSearchCloseBtn = document.getElementById("search-close-btn");
const elSearchDropdown = document.getElementById("search-dropdown");
const elCount = document.getElementById("visible-count");
const elDrawer = document.getElementById("detail-drawer");
const elDetailContent = document.getElementById("detail-content");
const elTooltip = document.getElementById("tooltip");
const elBudgetList = document.getElementById("budget-list");
const elBudgetPanel = document.getElementById("budget-panel");
const elBudgetPanelTitle = document.getElementById("budget-panel-title");
const elLeftPanel = document.getElementById("left-panel");
const elReopenSidebar = document.getElementById("reopen-sidebar-btn");
const elToggleFiltersBtn = document.getElementById("toggle-filters-btn");
const elFiltersDrawer = document.getElementById("filters-drawer");

function centerCamera(animate = true) {
  const cur = map.getCenter();
  map.easeTo({
    center: [cur.lng, cur.lat],
    zoom: window.innerWidth <= 760 ? 1.65 : 2.35,
    bearing: 0,
    pitch: 0,
    padding: getGlobePadding(),
    duration: animate ? 650 : 0,
  });
}

function centerWorld(animate = true) {
  centerCamera(animate);
}

function fitBbox(bbox, animate = true) {
  if (!bbox || bbox.length !== 4) return;
  const padLeft = elLeftPanel && !elLeftPanel.classList.contains("collapsed") && window.innerWidth > 900 ? 310 : 48;
  map.fitBounds(
    [
      [bbox[0], bbox[1]],
      [bbox[2], bbox[3]],
    ],
    {
      padding: { top: 44, right: 44, bottom: 72, left: padLeft },
      maxZoom: 7.5,
      duration: animate ? 700 : 0,
    }
  );
}

async function ensureCountryShard(iso3) {
  if (!iso3) return [];
  if (state.countryShards[iso3]) return state.countryShards[iso3];
  if (state.countryShardPromises[iso3]) return state.countryShardPromises[iso3];
  const prom = fetch(`data/countries/${encodeURIComponent(iso3)}.json?v=${DATA_VER}`)
    .then((r) => (r.ok ? r.json() : []))
    .then((list) => {
      const normalized = Array.isArray(list) ? list : [];
      state.countryShards[iso3] = normalized;
      return normalized;
    })
    .catch(() => {
      state.countryShards[iso3] = [];
      return [];
    });
  state.countryShardPromises[iso3] = prom;
  return prom;
}

function reconstructImageUrl(raw) {
  if (!raw) return "";
  if (raw.image) return raw.image;
  if (raw.imgUrl) return raw.imgUrl;
  if (raw.imgU) return raw.imgU;
  if (raw.imgF) {
    let clean = String(raw.imgF);
    try {
      clean = decodeURIComponent(clean);
    } catch {
      // keep raw slug if malformed escape
    }
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(clean)}?width=520`;
  }
  return "";
}

function normalizeTileProps(raw) {
  const yrRaw = raw.yr !== undefined && raw.yr !== -99999 ? Number(raw.yr) : raw.year ?? null;
  const img = reconstructImageUrl(raw);
  return {
    qid: raw.qid || "",
    name: raw.name || "Architectural Monument",
    countryIso: raw.cIso || raw.countryIso || "",
    country: raw.country || "",
    region: raw.reg || raw.region || "",
    state: raw.state || raw.reg || "",
    location: raw.loc || raw.location || raw.place || "",
    siteType: raw.st || raw.siteType || "Monument",
    style: raw.sty || raw.style || "",
    material: raw.mat || raw.material || "",
    period: raw.per || raw.period || "",
    heritageDesignation: raw.hd || raw.heritageDesignation || "Government-Recognized Heritage",
    recognizingBody: raw.recognizingBody || "",
    registryCode: raw.regCode || raw.registryCode || raw.asiId || "",
    tariffText: raw.tariffText || "",
    stewardProgram: raw.stewardProgram || raw.adoptProgram || "",
    hasDigitalRegistry: raw.hasDigitalRegistry !== undefined ? Boolean(raw.hasDigitalRegistry) : true,
    annualVisitors: raw.vis ? Number(raw.vis) : raw.annualVisitors ?? (raw.footfallLakhs ? Math.round(Number(raw.footfallLakhs) * 100000) : null),
    visitorRankInCountry: raw.vRank ? Number(raw.vRank) : raw.visitorRankInCountry || null,
    hasSiteFunding: Boolean(raw.sFund || raw.hasSiteFunding),
    architect: raw.architect || "",
    patron: raw.patron || "",
    era: raw.era || "unk",
    year: yrRaw !== null && !Number.isNaN(yrRaw) ? yrRaw : null,
    contested: Boolean(raw.ct || raw.contested),
    contestedArea: raw.ctName || raw.contestedArea || "",
    conservationState: raw.conservationState || "",
    image: img,
    wikipedia: raw.wp ? (raw.wp.startsWith("http") ? raw.wp : `https://en.wikipedia.org/wiki/${encodeURIComponent(raw.wp.replace(/ /g, "_"))}`) : "",
    unesco: raw.unName || raw.unesco || (raw.un ? "UNESCO World Heritage Site" : ""),
    unescoId: raw.unId || raw.unescoId || "",
    unescoDanger: Boolean(raw.danger || raw.unescoDanger),
    inRestoration: Boolean(raw.rest || raw.inRestoration),
    underfunded: Boolean(raw.uf || raw.underfunded),
    hasFunding: Boolean(raw.fund || raw.hasFunding),
    isMostVisited: Boolean(raw.mv || raw.isMostVisited),
    coverageStatus: raw.uncov ? "uncovered" : raw.coverageStatus || (img ? "partial" : "uncovered"),
    sitelinks: Number(raw.sl ?? raw.sitelinks ?? 0),
    priorityScore: Number(raw.pr ?? raw.priorityScore ?? 0),
    cat: raw.cat || "national",
  };
}

function getMergedProps(rawProps) {
  const base = normalizeTileProps(rawProps);
  const shard = state.countryShards[base.countryIso];
  let rich = base;
  if (shard && base.qid) {
    const found = shard.find((item) => item.qid === base.qid);
    if (found) rich = { ...base, ...found };
  }
  if (rich.unescoId && state.unescoWorld[rich.unescoId]) {
    const u = state.unescoWorld[rich.unescoId];
    rich = {
      ...rich,
      unesco: rich.unesco || u.name,
      unescoYear: rich.unescoYear || u.year,
      unescoDanger: Boolean(rich.unescoDanger || u.danger),
      unescoCategory: rich.unescoCategory || u.category,
      unescoCriteria: u.criteria || "",
      unescoJustification: u.justification || "",
      unescoShortDesc: u.shortDesc || "",
      unescoAreaHa: u.areaHa,
    };
  }
  if (rich.wikipedia && !rich.wikipedia.startsWith("http")) {
    rich.wikipedia = `https://en.wikipedia.org/wiki/${encodeURIComponent(rich.wikipedia.replace(/ /g, "_"))}`;
  }
  return rich;
}

// ---------- Floating Photographic Marker Pins (Incremental DOM Reuse + Loaded Class) ----------
const photoPinState = { activePins: new Map(), timer: null, failedImgs: new Set() };

function clearPhotoMarkers() {
  for (const rec of photoPinState.activePins.values()) {
    rec.marker.remove();
  }
  photoPinState.activePins.clear();
}

function getItemEvidenceFlags(item) {
  const q = item.qid || "";
  const gf = state.globalFunding || {};
  const fsrcs = (q && gf.fundingSources?.[q]) || [];
  const hasFund = Boolean(
    item.fd === 1 || item.sFund === 1 || item.hasSiteFunding || item.revenueCr || gf.sites?.[q] || fsrcs.length
  );
  const hasForeign = Boolean(item.fa === 1 || fsrcs.some((s) => s.type === "foreign_gov"));
  const hasPriv = Boolean(item.pv === 1 || fsrcs.some((s) => s.type === "private_donor") || item.adoptPartner);
  const hasVis = Boolean(Number(item.vis || item.annualVisitors || item.footfallLakhs || 0) > 0 || gf.visitors?.[q]);
  const hasWiki = Boolean(item.wk === 1 || item.wikipedia || item.wp);
  const imgUrl = item.image || item.imgUrl || item.imgU || item.imgF;
  const hasPhoto = Boolean(item.img === 1 || imgUrl);
  const hasReg = Boolean(item.rg === 1 || item.regCode || item.registryCode || item.asiId);
  const dq = (hasFund ? 1 : 0) + (hasVis ? 1 : 0) + (hasWiki ? 1 : 0) + (hasPhoto ? 1 : 0) + (hasReg ? 1 : 0);
  return { hasFund, hasForeign, hasPriv, hasVis, hasWiki, hasPhoto, hasReg, dq };
}

function matchesCurrentFilter(item) {
  if (state.activeCountry && (item.countryIso || item.cIso) !== state.activeCountry) return false;
  if (state.activeRegion && (item.region || item.reg || item.state || "") !== state.activeRegion) return false;
  if (state.activeEra && state.activeEra !== "all" && (item.era || "unk") !== state.activeEra) return false;
  const ev = getItemEvidenceFlags(item);
  if (state.photosOnly && !ev.hasPhoto) return false;
  if (state.contestedOnly && !(item.ct === 1 || item.contested)) return false;

  const des = state.activeDesignation || "all";
  if (des === "dq5" && ev.dq < 5) return false;
  if (des === "dq4plus" && ev.dq < 4) return false;
  if (des === "nofunding" && ev.hasFund) return false;
  if (des === "nowiki" && ev.hasWiki) return false;
  if (des === "zerodoc" && ev.dq > 0) return false;
  if (des === "private" && !ev.hasPriv) return false;
  if (des === "unesco" && !(item.unesco || item.unName || item.un === 1)) return false;
  if (des === "danger" && !(item.unescoDanger || item.danger === 1)) return false;
  if (des === "intl" && Number(item.sitelinks ?? item.sl ?? 0) < 10) return false;
  if (des === "sitefunded" && !ev.hasFund) return false;

  if (!state.activeFilters.length) return true;
  return state.activeFilters.every((f) => LEGEND_FILTER_SPEC[f]?.matches(ev));
}

function schedulePhotoPins() {
  clearTimeout(photoPinState.timer);
  photoPinState.timer = setTimeout(syncPhotoPins, 110);
}

function syncPhotoPins() {
  if (!map || !map.getSource("monuments-vt")) return;
  const zoom = map.getZoom();
  if (zoom < 2.15) {
    clearPhotoMarkers();
    return;
  }

  const sizeTier =
    zoom < 4.5
      ? { w: 58, h: 43, labelW: 108 }
      : zoom < 6.8
      ? { w: 64, h: 46, labelW: 120 }
      : { w: 70, h: 52, labelW: 132 };

  const bounds = map.getBounds();
  const camCenter = map.getCenter();
  const camLatR = (camCenter.lat * Math.PI) / 180;
  const camLngR = (camCenter.lng * Math.PI) / 180;
  const isFrontVisible = (coords) => {
    if (zoom >= 5.5) return true;
    const lngR = (coords[0] * Math.PI) / 180;
    const latR = (coords[1] * Math.PI) / 180;
    const cosDelta =
      Math.sin(latR) * Math.sin(camLatR) +
      Math.cos(latR) * Math.cos(camLatR) * Math.cos(lngR - camLngR);
    // Exclude far-side / limb monuments that MapLibre fades to low opacity near the globe horizon
    return cosDelta >= 0.46;
  };
  const maxPins = zoom < 4.5 ? 10 : zoom < 7 ? 14 : 18;
  const minDistX = zoom < 5 ? 114 : 94;
  const minDistY = zoom < 5 ? 86 : 72;
  const candidates = [];

  // 1) Inspect currently rendered PMTiles monument features with photos
  const rendered = map.queryRenderedFeatures({ layers: ["monuments-circle"] }) || [];
  const seen = new Set();
  for (const feat of rendered) {
    const p = feat.properties || {};
    if (!p.qid || seen.has(p.qid)) continue;
    const img = reconstructImageUrl(p);
    if (!img || photoPinState.failedImgs.has(img)) continue;
    seen.add(p.qid);
    const coords = feat.geometry?.coordinates;
    if (!coords || !bounds.contains(coords) || !isFrontVisible(coords)) continue;
    if (!matchesCurrentFilter(p)) continue;
    candidates.push({
      qid: p.qid,
      coords,
      img,
      props: p,
      score: (p.un ? 300 : 0) + (p.mv ? 150 : 0) + (p.pr || 0),
    });
  }

  // 2) Always supplement from searchTop so global iconic landmarks stay eligible across wide views
  if (state.searchTop.length) {
    for (const item of state.searchTop) {
      if (!item.image || seen.has(item.qid) || photoPinState.failedImgs.has(item.image)) continue;
      if (!bounds.contains(item.coords) || !isFrontVisible(item.coords)) continue;
      if (!matchesCurrentFilter(item)) continue;
      seen.add(item.qid);
      candidates.push({
        qid: item.qid,
        coords: item.coords,
        img: item.image,
        props: item,
        score: (item.unesco ? 300 : 0) + (item.priorityScore || 0),
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  const chosen = [];
  const chosenPts = [];
  const nextKeys = new Set();
  for (const c of candidates) {
    if (chosen.length >= maxPins) break;
    const px = map.project(c.coords);
    if (chosenPts.some((q) => Math.abs(q.x - px.x) < minDistX && Math.abs(q.y - px.y) < minDistY)) continue;
    chosen.push(c);
    chosenPts.push(px);
    nextKeys.add(c.qid);
  }

  // Remove only pins no longer in the active set for flicker-free pan/zoom
  for (const [qid, rec] of photoPinState.activePins.entries()) {
    if (!nextKeys.has(qid)) {
      rec.marker.remove();
      photoPinState.activePins.delete(qid);
    }
  }

  for (const c of chosen) {
    const existing = photoPinState.activePins.get(c.qid);
    if (existing) {
      existing.el.style.setProperty("--pin-w", `${sizeTier.w}px`);
      existing.el.style.setProperty("--pin-h", `${sizeTier.h}px`);
      existing.el.style.setProperty("--pin-label-w", `${sizeTier.labelW}px`);
      continue;
    }

    const p = normalizeTileProps(c.props);
    const el = document.createElement("button");
    el.type = "button";
    const tint =
      p.cat === "distressed" || p.unescoDanger
        ? SITE_COLORS.distressed
        : p.cat === "vulnerable"
          ? SITE_COLORS.vulnerable
          : p.cat === "prime"
            ? SITE_COLORS.prime
            : p.unesco
              ? SITE_COLORS.unesco
              : SITE_COLORS.nondisclosed;
    el.className = "photo-pin";
    el.style.setProperty("--pin-accent", tint);
    el.style.setProperty("--pin-w", `${sizeTier.w}px`);
    el.style.setProperty("--pin-h", `${sizeTier.h}px`);
    el.style.setProperty("--pin-label-w", `${sizeTier.labelW}px`);
    el.setAttribute("aria-label", `${p.name}${p.country ? `, ${p.country}` : ""}`);

    const frame = document.createElement("div");
    frame.className = `photo-pin-frame${p.unesco ? " is-unesco" : p.isMostVisited ? " is-ticketed" : ""}`;
    frame.style.display = "none";
    const img = document.createElement("img");
    img.loading = "eager";
    img.decoding = "async";
    img.alt = p.name;
    const thumbSrc = pinThumbUrl(c.img);
    img.addEventListener("load", () => {
      frame.style.display = "";
      img.classList.add("loaded");
    });
    img.addEventListener("error", () => {
      photoPinState.failedImgs.add(c.img);
      const rec = photoPinState.activePins.get(c.qid);
      if (rec) {
        rec.marker.remove();
        photoPinState.activePins.delete(c.qid);
      }
    });
    img.src = thumbSrc;
    if (img.complete && img.naturalWidth > 0) {
      frame.style.display = "";
      img.classList.add("loaded");
    }
    frame.appendChild(img);

    const lbl = document.createElement("span");
    lbl.className = "photo-pin-label";
    lbl.textContent = p.name.length > 22 ? `${p.name.slice(0, 20)}…` : p.name;

    const stem = document.createElement("div");
    stem.className = "photo-pin-stem";

    el.appendChild(frame);
    el.appendChild(lbl);
    el.appendChild(stem);

    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      openMonumentFromCoords(c.props, c.coords);
    });

    const marker = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat(c.coords).addTo(map);
    photoPinState.activePins.set(c.qid, { marker, el });
  }
}

function buildMapFilterExpression() {
  const conds = ["all"];
  if (state.activeCountry) conds.push(["==", ["get", "cIso"], state.activeCountry]);
  if (state.activeRegion) conds.push(["==", ["get", "reg"], state.activeRegion]);
  if (state.activeEra && state.activeEra !== "all") conds.push(["==", ["get", "era"], state.activeEra]);
  if (state.photosOnly) conds.push(["==", ["get", "img"], 1]);
  if (state.contestedOnly) conds.push(["==", ["get", "ct"], 1]);

  const des = state.activeDesignation || "all";
  if (des === "dq5") conds.push([">=", ["coalesce", ["get", "dq"], 0], 5]);
  else if (des === "dq4plus") conds.push([">=", ["coalesce", ["get", "dq"], 0], 4]);
  else if (des === "nofunding") conds.push(["==", ["coalesce", ["get", "fd"], 0], 0]);
  else if (des === "nowiki") conds.push(["==", ["coalesce", ["get", "wk"], 0], 0]);
  else if (des === "zerodoc") conds.push(["==", ["coalesce", ["get", "noDoc"], 0], 1]);
  else if (des === "private") conds.push(["==", ["coalesce", ["get", "pv"], 0], 1]);
  else if (des === "unesco") conds.push(["==", ["get", "un"], 1]);
  else if (des === "danger") conds.push(["==", ["get", "danger"], 1]);
  else if (des === "intl") conds.push([">=", ["coalesce", ["get", "sl"], 0], 10]);
  else if (des === "sitefunded") conds.push(["==", ["coalesce", ["get", "fd"], 0], 1]);

  for (const f of state.activeFilters) {
    const spec = LEGEND_FILTER_SPEC[f];
    if (spec) conds.push(spec.expr);
  }

  return conds.length === 1 ? null : conds;
}

function getCircleColorExpression() {
  const active = state.activeFilters;
  if (active.length === 1 && SITE_COLORS[active[0]]) return SITE_COLORS[active[0]];
  const keys = active.length > 1
    ? LEGEND_COLOR_ORDER.filter((k) => active.includes(k))
    : LEGEND_COLOR_ORDER.filter((k) => k !== "nophoto");
  const expr = ["case"];
  for (const k of keys) {
    if (LEGEND_FILTER_SPEC[k] && SITE_COLORS[k]) {
      expr.push(LEGEND_FILTER_SPEC[k].expr, SITE_COLORS[k]);
    }
  }
  expr.push(SITE_COLORS.nophoto);
  return expr;
}

function renderCounterLines(primaryText, extraLines = []) {
  const lines = [`<span class="count-line-primary">${escapeHtml(primaryText)}</span>`];
  for (const line of extraLines) {
    lines.push(`<span class="count-line-meta">${escapeHtml(line)}</span>`);
  }
  elCount.innerHTML = lines.join("");
}

function updateCounterDisplay() {
  if (!state.worldSummary) return;
  renderCounterLines(`${(state.worldSummary.totalMonuments || 118287).toLocaleString()} sites`);
}

function applyFilters() {
  const expr = buildMapFilterExpression();
  const hasNoPhotoLayer = state.activeFilters.includes("nophoto");
  if (map.getLayer("monuments-circle")) {
    map.setFilter("monuments-circle", expr);
    map.setPaintProperty("monuments-circle", "circle-color", getCircleColorExpression());
  }
  if (map.getLayer("monuments-uncovered-excl")) {
    const baseExcl = hasNoPhotoLayer ? ["==", ["coalesce", ["get", "img"], 0], 0] : ["==", ["coalesce", ["get", "noDoc"], 0], 1];
    const exclFilter = expr ? ["all", baseExcl, expr] : baseExcl;
    map.setFilter("monuments-uncovered-excl", exclFilter);
    if (map.setLayerZoomRange) {
      map.setLayerZoomRange("monuments-uncovered-excl", hasNoPhotoLayer || state.activeDesignation === "zerodoc" ? 2.2 : 5.2, 22);
    }
  }
  if (map.getLayer("country-active-line")) {
    map.setFilter(
      "country-active-line",
      state.activeCountry ? ["==", ["get", "iso3"], state.activeCountry] : ["==", ["get", "iso3"], "__NONE__"]
    );
  }
  const contestedEmphasis = Boolean(state.contestedOnly);
  if (map.getLayer("contested-areas-fill")) {
    map.setPaintProperty("contested-areas-fill", "fill-opacity", contestedEmphasis ? 0.24 : 0.05);
  }
  if (map.getLayer("contested-areas-line")) {
    map.setPaintProperty("contested-areas-line", "line-width", contestedEmphasis ? 1.8 : 0.9);
    map.setPaintProperty("contested-areas-line", "line-opacity", contestedEmphasis ? 0.92 : 0.55);
  }
  if (map.getLayer("om-border-disputed")) {
    map.setPaintProperty("om-border-disputed", "line-color", contestedEmphasis ? "#dc2626" : "#4a5056");
    map.setPaintProperty("om-border-disputed", "line-width", contestedEmphasis ? 1.7 : 1.0);
  }
  if (map.getLayer("prashad-points")) {
    const showInd = (!state.activeCountry || state.activeCountry === "IND") && (state.activeFilters.length === 0 || state.activeFilters.includes("fundingdoc"));
    map.setLayoutProperty("prashad-points", "visibility", showInd ? "visible" : "none");
  }
  updateCounterDisplay();
  schedulePhotoPins();
}

function renderCoveragePanel() {
  if (!state.worldSummary || !elBudgetList || !elBudgetPanel || !elBudgetPanelTitle) return;

  // Country-specific India-level Granular Heritage Economics & Documentation Audit Dossier
  if (state.activeCountry) {
    const cMeta = state.worldSummary.countries.find((c) => c.iso3 === state.activeCountry);
    const cf = state.globalFunding?.countries?.[state.activeCountry] || null;
    const shard = state.countryShards[state.activeCountry] || [];
    if (cMeta) {
      elBudgetPanelTitle.textContent = `${cMeta.name}: Funding & Gap Audit`;
      const tot = Math.max(1, cMeta.total || shard.length || 1);
      const isGap = cMeta.budgetUsd === null || cMeta.budgetUsd === undefined || cMeta.fundingBasis === "unlisted";
      const budgetHeadline = isGap
        ? "Unreported National Budget"
        : cMeta.perSiteUsd
          ? `${formatUsdMoney(cMeta.budgetUsd)} (${formatUsdMoney(cMeta.perSiteUsd, true)})`
          : `${formatUsdMoney(cMeta.budgetUsd)} (${cMeta.fy || "Published"})`;

      const dims = [
        { label: "Archive Photography", ok: cMeta.photographed || 0 },
        { label: "Chronological Date", ok: cMeta.withYear || 0 },
        { label: "Archival Monograph", ok: cMeta.withWiki || 0 },
        { label: "Metered Footfall", ok: cMeta.withVisitors || 0 },
        { label: "Site-Level Budget", ok: cMeta.withSiteFunding || 0 },
      ];

      const dimBarsHtml = dims
        .map((d) => {
          const pct = Math.round((d.ok / tot) * 100);
          const low = pct < 25;
          return `
            <div class="budget-item" style="padding:5px 0;">
              <div class="budget-item-top">
                <span>${escapeHtml(d.label)}</span>
                <span>${pct}% (${d.ok.toLocaleString()}/${cMeta.total.toLocaleString()})</span>
              </div>
              <div class="budget-bar-bg">
                <div class="budget-bar-fill ${low ? "is-low" : ""}" style="width:${Math.max(4, pct)}%"></div>
              </div>
            </div>`;
        })
        .join("");

      // Top metered / audited monuments in this country
      const topSites = [...shard]
        .filter((s) => (s.annualVisitors || 0) > 0 || s.hasSiteFunding || state.globalFunding?.sites?.[s.qid])
        .sort((a, b) => (b.annualVisitors || 0) - (a.annualVisitors || 0) || (b.priorityScore || 0) - (a.priorityScore || 0))
        .slice(0, 8);

      const topSitesHtml = topSites.length
        ? `<div style="margin-top:10px; padding-top:8px; border-top:1px solid var(--border);">
             <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; color:var(--ink-muted); margin-bottom:6px;">Audited Footfall &amp; Site Budgets in ${escapeHtml(cMeta.name)}</div>
             ${topSites
               .map((s) => {
                 const sf = state.globalFunding?.sites?.[s.qid];
                 const rightMetric = sf && !sf.isTrustPool
                   ? formatUsdMoney(sf.usd)
                   : s.revenueCr
                     ? formatMoneyCr(s.revenueCr, true)
                     : s.annualVisitors
                       ? `${formatCompactVisitors(s.annualVisitors)}/yr`
                       : "Audited";
                 const subMetric = [
                   s.visitorRankInCountry && s.visitorRankInCountry <= 5 ? `#${s.visitorRankInCountry} Most Visited` : "",
                   s.annualVisitors && (sf || s.revenueCr) ? `${formatCompactVisitors(s.annualVisitors)} visitors` : "",
                   s.registryCode || s.asiId || "",
                 ]
                   .filter(Boolean)
                   .join(" · ");
                 return `
                   <button type="button" class="budget-item budget-site-btn" data-qid="${escapeHtml(s.qid)}" style="width:100%; text-align:left; background:transparent; border:none; border-bottom:1px solid var(--border); padding:6px 2px; cursor:pointer;">
                     <div class="budget-item-top">
                       <span>${escapeHtml(s.name)}</span>
                       <span>${escapeHtml(rightMetric)}</span>
                     </div>
                     ${subMetric ? `<div class="budget-item-sub">${escapeHtml(subMetric)}</div>` : ""}
                   </button>`;
               })
               .join("")}
           </div>`
        : "";

      let asiCirclesHtml = "";
      if (state.activeCountry === "IND" && state.indiaExtras?.asiCircles?.length) {
        const rows = [...state.indiaExtras.asiCircles].sort((a, b) => a.per_site_lakh - b.per_site_lakh);
        const maxPer = Math.max(...rows.map((r) => r.per_site_lakh), 1);
        asiCirclesHtml = `
          <div style="margin-top:10px; padding-top:8px; border-top:1px solid var(--border);">
            <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; color:var(--ink-muted); margin-bottom:6px;">ASI Regional Circle Spend (FY 2023–24)</div>
            ${rows
              .map((r) => {
                const pct = Math.min(100, (r.per_site_lakh / maxPer) * 100);
                const low = r.per_site_lakh < 8.5;
                return `
                  <div class="budget-item">
                    <div class="budget-item-top">
                      <span>${escapeHtml(r.circle)}</span>
                      <span>${escapeHtml(formatMoneyLakh(r.per_site_lakh, true))}</span>
                    </div>
                    <div class="budget-bar-bg">
                      <div class="budget-bar-fill ${low ? "is-low" : ""}" style="width:${pct.toFixed(1)}%"></div>
                    </div>
                    <div class="budget-item-sub">${escapeHtml(r.state)} · ${r.monuments} sites · ${escapeHtml(formatMoneyCr(r.exp_cr))} total</div>
                  </div>`;
              })
              .join("")}
          </div>`;
      }

      elBudgetList.innerHTML = `
        <div class="budget-item" style="padding-bottom:8px; margin-bottom:6px; border-bottom:1px solid var(--border);">
          <div class="budget-item-top">
            <span>${escapeHtml(cMeta.shortAgency || "National Heritage Budget")}</span>
            <span style="${isGap ? "color:#64748b;" : ""}">${escapeHtml(budgetHeadline)}</span>
          </div>
          <div class="budget-item-sub">${escapeHtml(cf?.recognizingBody || cMeta.recognizingBody || "")} · ${escapeHtml(cf?.statutoryRegister || cMeta.statutoryRegister || "")}</div>
        </div>
        <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; color:var(--ink-muted); margin:6px 0 4px;">Documentation Coverage (${cMeta.total.toLocaleString()} Sites)</div>
        ${dimBarsHtml}
        ${topSitesHtml}
        ${asiCirclesHtml}
      `;

      elBudgetList.querySelectorAll(".budget-site-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const target = shard.find((x) => x.qid === btn.dataset.qid);
          if (target) openMonumentFromCoords(target, target.coords, true);
        });
      });
      return;
    }
  }

  elBudgetPanelTitle.textContent = "Public Heritage Budgets & Gaps (Global)";
  const gaps = state.worldSummary.documentationGaps;
  const totalGlobal = Math.max(1, state.worldSummary.totalMonuments || 1);
  const fmtGapPct = (n) => {
    const p = (n / totalGlobal) * 100;
    return p > 99 && p < 100 ? p.toFixed(1) : String(Math.round(p));
  };
  const globalGapHeader = gaps
    ? `<div class="budget-item" style="padding-bottom:8px; margin-bottom:8px; border-bottom:1px solid var(--border);">
         <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; color:var(--ink-muted); margin-bottom:4px;">Global Documentation Gaps (${totalGlobal.toLocaleString()} Monuments)</div>
         <div class="budget-item-sub" style="line-height:1.45;">
           • <b>${fmtGapPct(gaps.missingSiteFunding)}%</b> lack itemized site budgets · <b>${gaps.unreportedCountryBudgets}</b> countries lack public heritage budgets<br/>
           • <b>${fmtGapPct(gaps.missingVisitors)}%</b> lack annual footfall · <b>${fmtGapPct(gaps.missingPhoto)}%</b> lack ground archive photos · <b>${fmtGapPct(gaps.missingYear)}%</b> undated
         </div>
       </div>`
    : "";

  const published = [...state.worldSummary.countries]
    .filter((c) => c.budgetUsd !== null && c.budgetUsd !== undefined)
    .sort((a, b) => b.total - a.total)
    .slice(0, 32);
  const unreported = [...state.worldSummary.countries]
    .filter((c) => c.budgetUsd === null || c.fundingBasis === "unlisted")
    .sort((a, b) => b.total - a.total);
  const maxPerUsd = Math.max(...published.map((c) => Math.min(c.perSiteUsd || 15000, 80000)), 1);
  elBudgetList.innerHTML =
    globalGapHeader +
    [...published, ...unreported]
      .map((c) => {
        const isGap = c.budgetUsd === null || c.fundingBasis === "unlisted";
        const rightVal = isGap
          ? "Unreported"
          : c.perSiteUsd
            ? formatUsdMoney(c.perSiteUsd, true)
            : `${formatUsdMoney(c.budgetUsd)} total`;
        const pct = isGap
          ? 8
          : c.perSiteUsd
            ? Math.max(8, Math.min(100, (c.perSiteUsd / maxPerUsd) * 100))
            : 45;
        const low = isGap || (c.perSiteUsd !== null && c.perSiteUsd < 3500) || c.fundingTier === "poor";
        return `
          <button type="button" class="budget-item budget-country-btn" data-iso="${escapeHtml(c.iso3)}" style="width:100%; text-align:left; background:transparent; border:none; border-bottom:1px solid var(--border); padding:6px 2px; cursor:pointer;">
            <div class="budget-item-top">
              <span>${escapeHtml(c.name)}</span>
              <span style="${isGap ? "color:#64748b;" : ""}">${escapeHtml(rightVal)}</span>
            </div>
            <div class="budget-bar-bg">
              <div class="budget-bar-fill ${low ? "is-low" : ""}" style="width:${pct.toFixed(1)}%"></div>
            </div>
            <div class="budget-item-sub">${
              isGap
                ? `National budget unpublished · ${c.total.toLocaleString()} mapped sites`
                : `${escapeHtml(c.shortAgency || "Ministry of Culture")} (${escapeHtml(c.fy || "Published")}) · ${escapeHtml(formatUsdMoney(c.budgetUsd))} · ${c.total.toLocaleString()} sites`
            }</div>
          </button>`;
      })
      .join("");

  elBudgetList.querySelectorAll(".budget-country-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const iso = btn.dataset.iso;
      if (iso) selectCountryFilter(iso);
    });
  });
}

function showTooltip(point, html, hoverKey = "") {
  if (!hoverKey || elTooltip.dataset.hoverKey !== hoverKey) {
    elTooltip.dataset.hoverKey = hoverKey;
    elTooltip.innerHTML = html;
    const wrap = elTooltip.querySelector(".tooltip-img-wrap");
    const img = wrap ? wrap.querySelector(".tooltip-img") : null;
    if (wrap && img) {
      if (img.complete && img.naturalWidth > 0) {
        wrap.classList.remove("is-loading");
      } else {
        img.addEventListener("load", () => wrap.classList.remove("is-loading"), { once: true });
        img.addEventListener("error", () => wrap.remove(), { once: true });
      }
    }
  }
  elTooltip.classList.remove("hidden");
  elTooltip.style.left = `${Math.min(point.x + 14, window.innerWidth - 260)}px`;
  elTooltip.style.top = `${Math.max(point.y - 12, 12)}px`;
}

function setSelectedSite(coords) {
  const src = map.getSource("selected-site");
  if (!src) return;
  if (!Array.isArray(coords) || coords.length < 2) {
    src.setData({ type: "FeatureCollection", features: [] });
    return;
  }
  src.setData({
    type: "FeatureCollection",
    features: [{ type: "Feature", geometry: { type: "Point", coordinates: coords }, properties: {} }],
  });
}

function getDesktopDrawerPadding() {
  const lpCollapsed = elLeftPanel && elLeftPanel.classList.contains("collapsed");
  return { top: 46, bottom: 54, left: lpCollapsed ? 24 : 336, right: 456 };
}

function getMobileAboveCardPadding() {
  const vh = window.innerHeight || 800;
  const drawerRect = elDrawer ? elDrawer.getBoundingClientRect() : null;
  const bottomOverlap = drawerRect && drawerRect.height > 40 ? Math.max(0, vh - drawerRect.top) : Math.round(vh * 0.68);
  return { top: 48, bottom: bottomOverlap, left: 0, right: 0 };
}

function flyToSite(coords, zoomIn = false) {
  if (!coords) return;
  const isMobile = window.innerWidth <= 720;
  const pad = isMobile ? getMobileAboveCardPadding() : getDesktopDrawerPadding();
  map.easeTo({
    center: coords,
    zoom: zoomIn ? Math.max(map.getZoom(), 5.8) : map.getZoom(),
    padding: pad,
    duration: 480,
  });
}

function showDetailDrawer(coords, shouldFly = false, isRefresh = false) {
  elDrawer.classList.remove("hidden");
  document.body.classList.add("drawer-open");
  if (window.innerWidth <= 760) {
    elLeftPanel.classList.add("collapsed");
    document.body.classList.add("sidebar-collapsed");
    elReopenSidebar.classList.remove("hidden");
  }
  setSelectedSite(coords);
  if (coords && (shouldFly || !isRefresh)) {
    requestAnimationFrame(() => flyToSite(coords, shouldFly));
  }
  requestAnimationFrame(schedulePhotoPins);
}

function closeDetailDrawer() {
  const wasOpen = !elDrawer.classList.contains("hidden");
  elDrawer.classList.add("hidden");
  document.body.classList.remove("drawer-open");
  closeCustomSelectPopover();
  const mapNav = document.getElementById("map-nearby-nav");
  if (mapNav) {
    mapNav.classList.add("hidden");
    mapNav.innerHTML = "";
  }
  state.lastDrawer = null;
  state.carouselHandler = null;
  setSelectedSite(null);
  if (wasOpen) {
    map.easeTo({ padding: getGlobePadding(), duration: 280 });
  }
}

// ---------- Media, Wikidata & Historical Significance ----------
function stripHtmlText(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html || "";
  return (tmp.textContent || tmp.innerText || "").replace(/\s+/g, " ").trim();
}

function formatImageCredit(ext) {
  if (!ext) return "Wikimedia Commons";
  const rawArtist = ext.Artist ? stripHtmlText(ext.Artist.value) : "";
  const artist = rawArtist.replace(/User:/gi, "").slice(0, 42);
  const license = ext.LicenseShortName ? stripHtmlText(ext.LicenseShortName.value) : "";
  if (artist && license) return `${artist} · ${license}`;
  return artist || license || "Wikimedia Commons";
}

function extractCommonsFilename(url) {
  if (!url) return "";
  const m = String(url).match(/Special:FilePath\/([^?]+)/);
  if (m) return "File:" + decodeURIComponent(m[1]).replace(/_/g, " ");
  const u = String(url).match(/\/([^\/]+)$/);
  return u ? "File:" + decodeURIComponent(u[1]).replace(/_/g, " ") : "";
}

function renderCarouselHtml(slides) {
  if (!slides.length) return "";
  const first = slides[0];
  const many = slides.length > 1;
  return `
    <div class="carousel-wrap" id="drawer-carousel">
      <div class="carousel-stage" id="carousel-stage">
        <img id="carousel-main-img" src="${escapeHtml(first.url)}" alt="${escapeHtml(first.caption || "Monument photo")}" decoding="async" />
        ${
          many
            ? `
          <button type="button" class="carousel-nav prev" id="carousel-prev" aria-label="Previous photo">‹</button>
          <button type="button" class="carousel-nav next" id="carousel-next" aria-label="Next photo">›</button>
          <span class="carousel-count" id="carousel-count">1 / ${slides.length}</span>
        `
            : ""
        }
      </div>
      <div class="carousel-cap-row">
        <div class="carousel-caption" id="carousel-caption">${escapeHtml(first.caption)}</div>
        ${first.credit ? `<div class="carousel-credit" id="carousel-credit">${escapeHtml(first.credit)}</div>` : `<div class="carousel-credit" id="carousel-credit"></div>`}
      </div>
      ${
        many
          ? `<div class="carousel-thumbs" id="carousel-thumbs">
              ${slides
                .map(
                  (s, idx) =>
                    `<button type="button" class="carousel-thumb ${idx === 0 ? "active" : ""}" data-slide="${idx}" aria-label="Show image ${idx + 1}"><img src="${escapeHtml(thumbUrl(s.url))}" alt="" loading="lazy" /></button>`
                )
                .join("")}
            </div>`
          : ""
      }
    </div>
  `;
}

function applyBestImageFit(img) {
  if (!img || !img.naturalWidth || !img.naturalHeight) return;
  img.style.objectFit = "cover";
  img.style.objectPosition = "center 35%";
}

function bindCarousel(slides, onEmptyFallback) {
  const mainImg = document.getElementById("carousel-main-img");
  if (!mainImg || !slides.length) return;
  let index = 0;
  let activeSlides = [...slides];
  const syncSlideUi = () => {
    const s = activeSlides[index];
    if (!s) return;
    mainImg.src = s.url;
    mainImg.alt = s.caption || "Monument photograph";
    const cap = document.getElementById("carousel-caption");
    const cred = document.getElementById("carousel-credit");
    const cnt = document.getElementById("carousel-count");
    if (cap) cap.textContent = s.caption || "";
    if (cred) cred.textContent = s.credit || "";
    if (cnt) cnt.textContent = `${index + 1} / ${activeSlides.length}`;
    document.querySelectorAll("#carousel-thumbs .carousel-thumb").forEach((b) => {
      b.classList.toggle("active", Number(b.dataset.slide) === index);
    });
  };
  const setSlide = (nextIdx) => {
    if (!activeSlides.length) return;
    index = (nextIdx + activeSlides.length) % activeSlides.length;
    syncSlideUi();
  };
  const handleLoaded = () => {
    applyBestImageFit(mainImg);
    if (mainImg.naturalHeight > mainImg.naturalWidth) {
      activeSlides.splice(index, 1);
      if (activeSlides.length > 0) {
        index = index % activeSlides.length;
        syncSlideUi();
      } else if (typeof onEmptyFallback === "function") {
        onEmptyFallback();
      }
    }
  };
  mainImg.addEventListener("load", handleLoaded);
  if (mainImg.complete) handleLoaded();
  state.carouselHandler = (delta) => setSlide(index + delta);
  const prevBtn = document.getElementById("carousel-prev");
  const nextBtn = document.getElementById("carousel-next");
  if (prevBtn) prevBtn.addEventListener("click", () => setSlide(index - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => setSlide(index + 1));
  document.querySelectorAll("#carousel-thumbs .carousel-thumb").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetUrl = slides[Number(btn.dataset.slide)]?.url;
      const found = activeSlides.findIndex((s) => s.url === targetUrl);
      if (found >= 0) setSlide(found);
    });
  });
}

function renderSatelliteFallbackHtml(props, coords, searching) {
  if (!Array.isArray(coords) || coords.length < 2) return "";
  const z = 17;
  const [lng, lat] = coords;
  const n = 2 ** z;
  const fx = ((lng + 180) / 360) * n;
  const rad = (lat * Math.PI) / 180;
  const fy = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  const cx = Math.floor(fx);
  const cy = Math.floor(fy);
  const offX = Math.round((fx - cx) * 256);
  const offY = Math.round((fy - cy) * 256);

  const tiles = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = ((cx + dx) % n + n) % n;
      const ty = Math.max(0, Math.min(n - 1, cy + dy));
      tiles.push(`<img src="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${ty}/${tx}" alt="" loading="lazy" />`);
    }
  }

  const uploadDesc = [props.name, props.region, props.country].filter(Boolean).join(" - ");
  const uploadUrl = `https://commons.wikimedia.org/wiki/Special:UploadWizard?categories=${encodeURIComponent(
    "Cultural heritage monuments"
  )}&description=${encodeURIComponent(uploadDesc)}&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;

  const capText = searching
    ? "Aerial view · Searching Wikimedia Commons archives…"
    : "No established Wikimedia photo record yet · Aerial satellite view";

  return `
    <div class="carousel-wrap" id="drawer-carousel">
      <div class="carousel-stage sat-stage">
        <div class="sat-grid" style="transform: translate(-${256 + offX}px, -${256 + offY}px);">
          ${tiles.join("")}
        </div>
        <span class="sat-pin" aria-hidden="true"></span>
        <span class="sat-badge"><span class="legend-excl" aria-hidden="true">!</span>Satellite View · Poorly Covered</span>
      </div>
      <div class="carousel-cap-row">
        <div class="carousel-caption" id="carousel-caption">${escapeHtml(capText)}</div>
        <a class="carousel-upload-link" href="${escapeHtml(uploadUrl)}" target="_blank" rel="noopener">Upload photo ↗</a>
      </div>
    </div>
  `;
}

async function fetchGalleryImages(props) {
  const key = props.qid || props.name;
  if (state.galleryCache[key]) return state.galleryCache[key];

  const seen = new Set();
  const slides = [];
  const artifactOrArchivalRe =
    /(?:^|[_\-\s./(),])(painting|oil_on_canvas|portrait|headshot|self_portrait|autograph|signature|lithograph|engraving|watercolou?r|sketch|aquatint|etching|drawing|diagram|blueprint|schematic|floor_?plan|site_?plan|ground_?plan|plano|planta|grabungsplan|cross_?section|illustration|chart|graph|reconstruction|cartoon|fresco_copy|miniature|woodcut|pottery|sherd|coin_type|bronze_coin|numismatic|terracotta|figurine|artifact|artefact|excavated|relic|manuscript|copper_?plate|rendering|infographic)(?:[_\-\s./(),]|$)/i;
  const skipRe = /\.(svg|ogg|ogv|webm|pdf|tif|tiff|gif)(?:\?|$)/i;
  const badTitleRe = /(?:^|[_\-\s./(),])(flag_of|flag|emblem|coat_of_arms|wappen|blason|location_map|map_of|locator|icon|logo|commons-logo|wikidata|question_book|ambox|edit-clear|symbol|stamps?|postage|plaque|board|ticket|plan|seal_of|heraldry|postcard)(?:[_\-\s./(),]|$)/i;

  const stopWords = new Set(["the", "and", "for", "from", "with", "site", "sites", "old", "new", "great", "grand", "ancient", "historic", "historical", "national", "monument", "monuments", "complex", "area", "building"]);
  const rawTokens = `${props.name || ""} ${(props.wikipedia || "").split("/wiki/")[1] || ""}`
    .toLowerCase()
    .replace(/_/g, " ")
    .split(/[^a-z0-9\u00c0-\u024f]+/)
    .filter((t) => t.length >= 3 && !stopWords.has(t));
  const subjectTokens = [...new Set(rawTokens)];

  const subjectMatchScore = (metaBlob = "") => {
    const low = metaBlob.toLowerCase();
    let hits = 0;
    for (const tok of subjectTokens) {
      if (low.includes(tok)) hits += 1;
    }
    return hits;
  };

  const evalImageMeta = (ii, title = "", caption = "", isInlineWiki = false) => {
    const w = Number(ii?.width || 0);
    const h = Number(ii?.height || 0);
    if (w && h && h > w) return { reject: true, score: -1000 };
    const ext = ii?.extmetadata || {};
    const metaText = `${title} ${caption} ${ext.ObjectName?.value || ""} ${ext.ImageDescription?.value || ""} ${ext.Categories?.value || ""}`.replace(/<[^>]+>/g, " ");
    if (skipRe.test(ii?.url || title) || badTitleRe.test(title) || artifactOrArchivalRe.test(metaText)) {
      return { reject: true, score: -1000 };
    }
    const overlap = subjectMatchScore(metaText);
    // Reject generic inline Wikipedia images (e.g., ruler portraits, adjacent sites) that share zero name tokens
    if (isInlineWiki && subjectTokens.length > 0 && overlap === 0) {
      return { reject: true, score: -1000 };
    }
    let score = overlap * 18;
    if (/\.(jpe?g|webp)(\?|$)/i.test(ii?.url || title)) score += 20;
    if (ext.DateTimeOriginal?.value || /photograph|camera|taken on/i.test(metaText)) score += 35;
    if (w && h && w / h >= 1.25) score += 15;
    return { reject: false, score };
  };

  const pushSlide = (url, caption, credit = "", rawHint = "", score = 10) => {
    if (!url || seen.has(url)) return;
    if (skipRe.test(url) || badTitleRe.test(url) || artifactOrArchivalRe.test(`${rawHint} ${caption || ""}`)) return;
    seen.add(url);
    slides.push({ url: hiResUrl(url), caption: caption || props.name, credit, score });
  };
  if (props.image) pushSlide(props.image, `${props.name} · Verified Archive Photo`, "Wikimedia Commons", "", 15);

  try {
    if (props.image) {
      const fileTitle = extractCommonsFilename(props.image);
      if (fileTitle) {
        const crRes = await fetch(
          `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url|size|extmetadata&format=json&origin=*`
        );
        if (crRes.ok) {
          const crData = await crRes.json();
          const pg = Object.values((crData.query && crData.query.pages) || {})[0];
          const ii = pg?.imageinfo?.[0];
          if (ii && slides[0]) {
            const ev = evalImageMeta(ii, fileTitle, props.name);
            if (ev.reject) {
              slides.shift();
            } else {
              slides[0].score = ev.score + 5;
              if (ii.extmetadata) slides[0].credit = formatImageCredit(ii.extmetadata);
            }
          }
        }
      }
    }

    let discoveredWikiTitle =
      props.wikipedia && props.wikipedia.includes("/wiki/")
        ? decodeURIComponent(props.wikipedia.split("/wiki/")[1])
        : "";

    if ((slides.length < 4 || !discoveredWikiTitle) && props.qid && /^Q\d+$/i.test(props.qid)) {
      const wdRes = await fetch(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(props.qid)}&props=claims|sitelinks&format=json&origin=*`
      );
      if (wdRes.ok) {
        const wdData = await wdRes.json();
        const ent = wdData.entities?.[props.qid];
        const p18 = ent?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
        if (p18 && !props.image) {
          const p18Title = `File:${String(p18).replace(/^File:/i, "").replace(/ /g, "_")}`;
          const infoRes = await fetch(
            `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(p18Title)}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1200&format=json&origin=*`
          );
          if (infoRes.ok) {
            const infoData = await infoRes.json();
            const pg = Object.values(infoData.query?.pages || {})[0];
            const ii = pg?.imageinfo?.[0];
            if (ii) {
              const ev = evalImageMeta(ii, p18Title, props.name);
              if (!ev.reject) {
                pushSlide(ii.thumburl || ii.url, `${props.name} · Wikidata Photo`, formatImageCredit(ii.extmetadata), p18, ev.score + 10);
              }
            }
          }
        }
        const enTitle = ent?.sitelinks?.enwiki?.title;
        if (enTitle && !discoveredWikiTitle) discoveredWikiTitle = enTitle;
        const p373 = ent?.claims?.P373?.[0]?.mainsnak?.datavalue?.value;
        if (p373 && slides.length < 5) {
          const cmRes = await fetch(
            `https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent("Category:" + p373)}&cmtype=file&cmlimit=16&format=json&origin=*`
          );
          if (cmRes.ok) {
            const cmData = await cmRes.json();
            const catFiles = (cmData.query?.categorymembers || [])
              .map((m) => m.title)
              .filter((t) => t && !skipRe.test(t) && !badTitleRe.test(t) && !artifactOrArchivalRe.test(t))
              .slice(0, 10);
            if (catFiles.length) {
              const infoRes = await fetch(
                `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(catFiles.join("|"))}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1200&format=json&origin=*`
              );
              if (infoRes.ok) {
                const infoData = await infoRes.json();
                for (const p of Object.values(infoData.query?.pages || {})) {
                  const ii = p.imageinfo?.[0];
                  if (ii && slides.length < 8) {
                    const cleanCap = String(p.title || "").replace(/^File:/i, "").replace(/\.[^.]+$/, "").replace(/_/g, " ");
                    const ev = evalImageMeta(ii, p.title, cleanCap);
                    if (!ev.reject) {
                      pushSlide(ii.thumburl || ii.url, cleanCap, formatImageCredit(ii.extmetadata), p.title, ev.score);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    if (discoveredWikiTitle && slides.length < 5) {
      // 1) Prioritize Wikipedia's primary lead photograph (prop=pageimages)
      const leadRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(discoveredWikiTitle)}&prop=pageimages&piprop=original|thumbnail&pithumbsize=1200&format=json&origin=*`
      );
      if (leadRes.ok) {
        const leadData = await leadRes.json();
        const leadPage = Object.values(leadData.query?.pages || {})[0];
        const orig = leadPage?.original;
        const thumb = leadPage?.thumbnail;
        const leadUrl = thumb?.source || orig?.source;
        const lw = Number(orig?.width || thumb?.width || 0);
        const lh = Number(orig?.height || thumb?.height || 0);
        if (leadUrl && (!lw || !lh || lw >= lh) && !skipRe.test(leadUrl) && !badTitleRe.test(leadUrl) && !artifactOrArchivalRe.test(leadUrl)) {
          pushSlide(leadUrl, `${props.name} · Wikipedia Primary Photo`, "Wikimedia Commons", leadUrl, 85);
        }
      }

      // 2) Secondary relevant photographs from article gallery (filtered by monument name match)
      const imgsRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(discoveredWikiTitle)}&prop=images&imlimit=16&format=json&origin=*`
      );
      if (imgsRes.ok) {
        const imgsData = await imgsRes.json();
        const page = Object.values(imgsData.query?.pages || {})[0];
        const titles = (page?.images || [])
          .map((x) => x.title)
          .filter((t) => t && !skipRe.test(t) && !badTitleRe.test(t) && !artifactOrArchivalRe.test(t))
          .slice(0, 10);
        if (titles.length) {
          const infoRes = await fetch(
            `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles.join("|"))}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1200&format=json&origin=*`
          );
          if (infoRes.ok) {
            const infoData = await infoRes.json();
            for (const p of Object.values(infoData.query?.pages || {})) {
              const ii = p.imageinfo?.[0];
              if (ii && slides.length < 8) {
                const cleanCap = String(p.title || "").replace(/^File:/i, "").replace(/\.[^.]+$/, "").replace(/_/g, " ");
                const ev = evalImageMeta(ii, p.title, cleanCap, true);
                if (!ev.reject) {
                  pushSlide(ii.thumburl || ii.url, cleanCap, formatImageCredit(ii.extmetadata), p.title, ev.score);
                }
              }
            }
          }
        }
      }
    }
  } catch {
    // Keep strictly verified slides only
  }

  slides.sort((a, b) => (b.score || 0) - (a.score || 0));
  const finalSlides = slides.slice(0, 5);
  state.galleryCache[key] = finalSlides;
  return finalSlides;
}

function hydrateDrawerCarousel(mountId, props, coords) {
  fetchGalleryImages(props).then((slides) => {
    const mount = document.getElementById(mountId);
    if (!mount) return;
    const renderSat = () => {
      mount.innerHTML = renderSatelliteFallbackHtml(props, coords, false);
    };
    if (slides.length) {
      mount.innerHTML = renderCarouselHtml(slides);
      bindCarousel(slides, renderSat);
      const badge = document.getElementById("coverage-badge");
      if (badge) {
        badge.remove();
      }
      const docCard = document.getElementById("documentation-gaps-card");
      if (docCard && state.lastDrawer && state.lastDrawer.props.qid === props.qid) {
        const effDate = extractConstructionInfo(props, state.wdFactsCache[props.qid]?.rawYear ?? null);
        const fmNow = buildFundingModel(props);
        docCard.outerHTML = renderDocumentationGapsCard(
          props,
          effDate,
          fmNow,
          state.wikiCache[props.qid || props.name] || null,
          state.wdFactsCache[props.qid] || null
        );
      }
    } else {
      mount.innerHTML = renderSatelliteFallbackHtml(props, coords, false);
    }
  });
}

async function fetchWikiTwoSentences(props) {
  const key = props.qid || props.name;
  if (state.wikiCache[key]) return state.wikiCache[key];

  let wikiTitle =
    props.wikipedia && props.wikipedia.includes("/wiki/")
      ? decodeURIComponent(props.wikipedia.split("/wiki/")[1])
      : "";

  if (!wikiTitle && props.qid && /^Q\d+$/i.test(props.qid)) {
    try {
      const wdRes = await fetch(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(props.qid)}&props=sitelinks&format=json&origin=*`
      );
      if (wdRes.ok) {
        const wdData = await wdRes.json();
        wikiTitle = wdData.entities?.[props.qid]?.sitelinks?.enwiki?.title || "";
      }
    } catch {
      // ignore
    }
  }

  if (wikiTitle) {
    try {
      const sumRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`);
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        const extract = (sumData.extract || "").trim();
        if (extract && sumData.type !== "disambiguation") {
          const sentences = extract.match(/[^.!?]+[.!?]+/g) || [extract];
          const two = sentences.slice(0, 2).join(" ").trim();
          const result = {
            text: two,
            fullText: extract,
            title: sumData.title || wikiTitle.replace(/_/g, " "),
            url: sumData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiTitle)}`,
            source: "Wikipedia",
          };
          state.wikiCache[key] = result;
          return result;
        }
      }
    } catch {
      // fallback below
    }
  }

  const fb = buildFallbackTwoSentenceSummary(props);
  state.wikiCache[key] = fb;
  return fb;
}

function buildFallbackTwoSentenceSummary(props) {
  const loc = dedupeSubtitleParts([props.location, props.region, props.country]).join(", ");
  const hd = (props.heritageDesignation || "official heritage protection").trim();
  const hdClause = /^(protected|listed|classified|designated|registered)\b/i.test(hd)
    ? `statutorily ${hd}`
    : `recorded under ${hd}`;
  const s1 = `${props.name} is a ${props.siteType ? props.siteType.toLowerCase() : "protected monument"}${loc ? ` in ${loc}` : ""}, ${hdClause}.`;
  let s2 = "";
  if (props.unescoShortDesc) {
    const cleanedU = props.unescoShortDesc.replace(/^(Brief synthesis|Overview)\s*[:\-–—]?\s*/i, "").trim();
    const first = cleanedU.match(/[^.!?]+[.!?]+/);
    s2 = first ? first[0].trim() : cleanedU;
  } else if (props.unesco) {
    s2 = `Inscribed on the UNESCO World Heritage List${props.unescoYear ? ` (${props.unescoYear})` : ""}.`;
  } else if (props.desc) {
    const dClean = props.desc.trim().replace(/\.+$/, "");
    s2 = dClean ? `${dClean.charAt(0).toUpperCase()}${dClean.slice(1)}.` : "";
  } else {
    s2 = "No extended narrative summary is linked on English Wikipedia yet.";
  }
  return { text: `${s1} ${s2}`.trim(), fullText: "", title: props.name, url: props.wikipedia || "", source: props.unesco ? "UNESCO World Heritage List" : "Wikidata Heritage Registry" };
}

async function fetchWikidataHistoryFacts(qid) {
  if (!qid || !/^Q\d+$/i.test(qid)) return null;
  if (state.wdFactsCache[qid]) return state.wdFactsCache[qid];
  try {
    const res = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(qid)}&props=claims|descriptions&languages=en&format=json&origin=*`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const ent = data.entities?.[qid];
    if (!ent) return null;
    const claims = ent.claims || {};

    let rawYear = null;
    const incVal = claims.P571?.[0]?.mainsnak?.datavalue?.value?.time;
    if (incVal) {
      const m = incVal.match(/^([+-]?\d{1,4})-/);
      if (m) rawYear = Number(m[1]);
    }

    // Parse live Wikidata P1174 visitor statements if present
    let liveVisitors = null;
    let liveVisitorYear = null;
    const liveSeriesMap = {};
    for (const st of claims.P1174 || []) {
      const amt = Number(String(st?.mainsnak?.datavalue?.value?.amount || "").replace(/^\+/, ""));
      if (!Number.isFinite(amt) || amt <= 0 || amt > 80_000_000) continue;
      const pit = st?.qualifiers?.P585?.[0]?.datavalue?.value?.time || "";
      const ym = pit.match(/^([+-]?\d{4})-/);
      const yr = ym ? Number(ym[1]) : null;
      if (yr && yr >= 1990 && yr <= 2026) {
        if (!liveSeriesMap[yr] || amt > liveSeriesMap[yr]) liveSeriesMap[yr] = Math.round(amt);
        if (liveVisitorYear === null || yr > liveVisitorYear || (yr === liveVisitorYear && amt > liveVisitors)) {
          liveVisitorYear = yr;
          liveVisitors = Math.round(amt);
        }
      } else if (liveVisitorYear === null && (!liveVisitors || amt > liveVisitors)) {
        liveVisitors = Math.round(amt);
      }
    }

    // Parse live Wikidata P2555 entry fee if present
    let feeAmount = null;
    let feeUnitQid = "";
    const feeVal = claims.P2555?.[0]?.mainsnak?.datavalue?.value;
    if (feeVal && feeVal.amount !== undefined) {
      const fn = Number(String(feeVal.amount).replace(/^\+/, ""));
      if (Number.isFinite(fn) && fn >= 0) {
        feeAmount = fn;
        feeUnitQid = String(feeVal.unit || "").split("/").pop() || "";
      }
    }

    const grabFirstQid = (prop) => claims[prop]?.[0]?.mainsnak?.datavalue?.value?.id || "";
    const propTargets = {
      patron: grabFirstQid("P88"),
      architect: grabFirstQid("P84"),
      creator: grabFirstQid("P170"),
      foundedBy: grabFirstQid("P112"),
      timePeriod: grabFirstQid("P2348"),
      style: grabFirstQid("P149"),
      material: grabFirstQid("P186"),
      feeUnit: /^Q\d+$/i.test(feeUnitQid) ? feeUnitQid : "",
    };
    const idsToResolve = [...new Set(Object.values(propTargets).filter(Boolean))];
    const labelMap = {};
    if (idsToResolve.length) {
      const lblRes = await fetch(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${idsToResolve.join("|")}&props=labels&languages=en&format=json&origin=*`
      );
      if (lblRes.ok) {
        const lblData = await lblRes.json();
        for (const [id, item] of Object.entries(lblData.entities || {})) {
          labelMap[id] = item.labels?.en?.value || "";
        }
      }
    }

    const liveSeries = Object.keys(liveSeriesMap)
      .map(Number)
      .sort((a, b) => a - b)
      .slice(-6)
      .map((y) => ({ year: y, count: liveSeriesMap[y] }));

    const facts = {
      qid,
      rawYear,
      descEn: ent.descriptions?.en?.value || "",
      patron: labelMap[propTargets.patron] || "",
      architect: labelMap[propTargets.architect] || "",
      creator: labelMap[propTargets.creator] || "",
      foundedBy: labelMap[propTargets.foundedBy] || "",
      timePeriod: labelMap[propTargets.timePeriod] || "",
      style: labelMap[propTargets.style] || "",
      material: labelMap[propTargets.material] || "",
      liveVisitors,
      liveVisitorYear,
      liveSeries: liveSeries.length >= 2 ? liveSeries : [],
      feeText:
        feeAmount === 0
          ? "Free public entry"
          : feeAmount !== null
            ? `${feeAmount} ${labelMap[propTargets.feeUnit] || ""}`.trim()
            : "",
    };
    state.wdFactsCache[qid] = facts;
    return facts;
  } catch {
    return null;
  }
}

function extractConstructionInfo(props, extraYear = null) {
  const yearNum = props.year !== null && props.year !== undefined ? Number(props.year) : extraYear;
  if (yearNum !== null && !Number.isNaN(yearNum)) {
    const nowYr = new Date().getFullYear();
    const age = nowYr - yearNum;
    const ageLabel = age > 0 ? `~${age.toLocaleString()} years` : "Recent";
    return { yearNum, builtLabel: formatYear(yearNum), ageLabel };
  }
  return { yearNum: null, builtLabel: "Undated", ageLabel: "Chronology gap" };
}

function citeHtml(sourceText, url = "", label = "Citation") {
  return `
    <details class="cite-drop">
      <summary>${escapeHtml(label)} ▾</summary>
      <div class="cite-body">${escapeHtml(sourceText)}${
        url ? ` · <a href="${escapeHtml(url)}" target="_blank" rel="noopener">Open source ↗</a>` : ""
      }</div>
    </details>`;
}

function buildRichDescriptionHtml(props, dateInfo, wikiResult = null, wdFacts = null) {
  const sentences = wikiResult?.fullText ? wikiResult.fullText.match(/[^.!?]+[.!?]+/g) || [wikiResult.fullText] : [];
  const lead = sentences.length
    ? sentences[0].trim()
    : (wikiResult?.text || buildFallbackTwoSentenceSummary(props).text).trim();

  // Synthesize explicit Historical Significance sentence(s)
  const stripUnescoBoilerplate = (t) =>
    String(t || "")
      .replace(/^(Brief synthesis|Criterion\s*\([ivx]+\))\s*[:\-–—]?\s*/i, "")
      .trim();
  let sigSentence = "";
  if (props.unescoJustification) {
    const cleanJ = stripUnescoBoilerplate(props.unescoJustification);
    const m = cleanJ.match(/[^.!?]+[.!?]+/);
    if (m) sigSentence = m[0].trim();
  }
  if (!sigSentence && props.unescoShortDesc) {
    const cleanS = stripUnescoBoilerplate(props.unescoShortDesc);
    const usents = cleanS.match(/[^.!?]+[.!?]+/g) || [cleanS];
    const picked = usents.find((s) => s.trim().toLowerCase() !== lead.toLowerCase() && !DRY_LOCATION_ONLY_RE.test(s.trim()));
    if (picked) sigSentence = stripUnescoBoilerplate(picked);
  }
  if (!sigSentence && sentences.length > 1) {
    const rest = sentences.slice(1).map((s) => s.trim());
    const cueHit = rest.find(
      (s) => s.length >= 32 && s.length <= 290 && !DRY_LOCATION_ONLY_RE.test(s) && HISTORY_CUE_RE.test(s)
    );
    sigSentence = cueHit || rest.find((s) => s.length >= 32 && !DRY_LOCATION_ONLY_RE.test(s)) || "";
  }
  if (!sigSentence) {
    const patron = wdFacts?.patron || props.patron || wdFacts?.foundedBy || wdFacts?.creator || "";
    const arch = wdFacts?.architect || props.architect || "";
    const style = wdFacts?.style || props.style || "";
    const period = wdFacts?.timePeriod || props.period || "";
    const bits = [];
    if (patron) bits.push(`commissioned or founded by ${patron}`);
    if (arch && arch !== patron) bits.push(`designed by ${arch}`);
    if (style) bits.push(`exemplifying ${style} architecture`);
    if (period && period.toLowerCase() !== style.toLowerCase()) bits.push(`from the ${period}`);
    else if (dateInfo?.yearNum !== null) bits.push(`dating to ${dateInfo.builtLabel}`);

    if (bits.length) {
      sigSentence = `Historically significant as a protected ${props.siteType ? props.siteType.toLowerCase() : "architectural monument"} ${bits.join(", ")}${
        props.unesco ? `, inscribed on the UNESCO World Heritage List${props.unescoYear ? ` in ${props.unescoYear}` : ""}` : ""
      }.`;
    } else if (props.unesco) {
      sigSentence = `Recognized for Outstanding Universal Value on the UNESCO World Heritage List${
        props.unescoYear ? ` (${props.unescoYear})` : ""
      }${props.unescoCriteria ? ` under criteria ${props.unescoCriteria}` : ""}.`;
    } else {
      const cf = resolveCountryFunding(props);
      const auth = props.recognizingBody || cf?.recognizingBody || `${props.country || "national"} heritage authorities`;
      sigSentence = `Protected by ${auth} under ${props.heritageDesignation || "statutory monument law"}; extended historical patronage narratives have not yet been digitized in open international archives.`;
    }
  }

  const combinedProse =
    sigSentence && !lead.toLowerCase().includes(sigSentence.slice(0, 28).toLowerCase())
      ? `${lead} ${sigSentence}`
      : lead;

  return `<p>${escapeHtml(combinedProse)}</p>`;
}

function renderCurrencySwitchHtml() {
  return `
    <select id="currency-select" class="currency-select" aria-label="Display currency" title="Change display currency">
      ${Object.entries(CURRENCY_RATES)
        .map(([c, cfg]) => `<option value="${c}" ${state.currency === c ? "selected" : ""}>${c} (${cfg.symbol})</option>`)
        .join("")}
    </select>
  `;
}

function bindDrawerCurrencySwitch() {
  const sel = document.getElementById("currency-select");
  if (!sel) return;
  enhanceSelect(sel, { pill: true });
  sel.addEventListener("change", () => {
    state.currency = sel.value || "USD";
    renderCoveragePanel();
    if (state.lastDrawer) openMonumentDrawer(state.lastDrawer.props, state.lastDrawer.coords, false);
  });
}

const SUBREGION_SKIP_RE =
  /^(southern europe|western europe|northern europe|eastern europe|central europe|south america|north america|central america|caribbean|eastern asia|south-eastern asia|southern asia|western asia|central asia|northern africa|western africa|eastern africa|middle africa|southern africa|sub-saharan africa|australia and new zealand|melanesia|polynesia|micronesia|americas|europe|asia|africa|oceania)$/i;

function dedupeSubtitleParts(parts) {
  const out = [];
  const seen = new Set();
  const seenStems = new Set();
  const flat = [];
  for (const raw of parts) {
    for (const seg of String(raw || "").split(",")) {
      const clean = seg.replace(/\s+/g, " ").trim();
      if (clean && !SUBREGION_SKIP_RE.test(clean)) flat.push(clean);
    }
  }
  for (let i = 0; i < flat.length; i++) {
    const clean = flat[i];
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    const isLastCountry = i === flat.length - 1 && flat.length >= 2;
    const stem = key
      .replace(/\b(governorate|province|prefecture|department|departament|municipality|district|metropolitan city|capitale|county)\b/g, "")
      .replace(/\s+of\s+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!isLastCountry && stem && seenStems.has(stem)) continue;
    seen.add(key);
    if (!isLastCountry && stem) seenStems.add(stem);
    out.push(clean);
  }
  return out;
}

function resolveCountryFunding(props) {
  const gf = state.globalFunding;
  if (!gf || !gf.countries) return null;
  if (props.countryIso && gf.countries[props.countryIso]) {
    return gf.countries[props.countryIso];
  }
  if (props.country) {
    const iso = state.countryNameToIso[String(props.country).trim().toLowerCase()];
    if (iso && gf.countries[iso]) return gf.countries[iso];
  }
  return null;
}

function formatCompactVisitors(n) {
  const num = Number(n || 0);
  if (!num || num <= 0) return "Unreported";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (num >= 10_000) return `${Math.round(num / 1_000).toLocaleString()}K`;
  return num.toLocaleString();
}

function getIndiaFiveYearSeries(props) {
  if (props.countryIso !== "IND" && props.country !== "India") return null;
  const key = String(props.name || "").trim().toLowerCase();
  if (props.qid === "Q7676724" || key.includes("palace")) return null;
  for (const [k, data] of Object.entries(INDIA_TICKET_HISTORY_5Y)) {
    if (key.includes(k)) return data;
  }
  return null;
}

// ---------- 100% Zero-Fabrication Cited Funding Health (Revenue vs. Maintenance + Donor Origins) ----------
function renderFundingSourcesHtml(props) {
  const gf = state.globalFunding || {};
  const rawSources = (props.qid && Array.isArray(gf.fundingSources?.[props.qid]) && gf.fundingSources[props.qid]) || [];
  const restGrant = (props.qid && gf.restoration?.[props.qid]) || null;
  const unescoGrant = (props.unescoId && gf.unescoGrants?.[String(props.unescoId)]) || null;

  const list = [...rawSources];
  if (!list.length && restGrant) {
    list.push({
      type: /AFCP|U\.S\.|Japan|India|France|Germany|Qatar|UAE|Korea|China/i.test(restGrant.program || "") ? "foreign_gov" : "multilateral",
      donorCountry: restGrant.donorCountry || "International Conservation Grant",
      funder: restGrant.program || "International Conservation Mission",
      usd: restGrant.usd || null,
      years: restGrant.year || "Active",
      note: restGrant.summary || "",
      url: restGrant.url || "",
    });
  }
  if (!list.length && unescoGrant && unescoGrant.usd > 0) {
    list.push({
      type: "multilateral",
      donorCountry: "UNESCO International Assistance",
      funder: "UNESCO World Heritage Fund (prj001)",
      usd: unescoGrant.usd,
      years: "Audited Grant",
      note: unescoGrant.projectTitle || "UNESCO Culture Sector international conservation assistance.",
      url: "https://data.unesco.org/explore/dataset/prj001/",
    });
  }
  if (props.adoptPartner && !list.some((s) => String(s.funder || "").includes(props.adoptPartner))) {
    list.push({
      type: "private_donor",
      donorCountry: "Private / Corporate CSR (India)",
      funder: `${props.adoptPartner} (${props.adoptProgram || "Adopt a Heritage 2.0"})`,
      usd: null,
      years: "Active CSR",
      note: props.adoptScope || "Visitor amenities & upkeep; core conservation retained by ASI.",
      url: "https://asi.nic.in/",
    });
  }

  if (!list.length) {
    const cf = resolveCountryFunding(props);
    const steward = props.recognizingBody || cf?.recognizingBody || cf?.shortAgency || `${props.country || "National"} heritage authority`;
    return `
      <div class="funding-sources-block">
        <div class="funding-sources-head">
          <span>Funding Origins (Countries &amp; Donors)</span>
          <span class="funding-source-amt is-na">Not Available</span>
        </div>
        <div class="funding-source-na">
          Site-level funding origins (foreign bilateral aid, private donors, or exact ministry split) are <strong>Not Available</strong> in open public disclosures. Statutory custodian: ${escapeHtml(steward)}.
        </div>
      </div>
    `;
  }

  const pillMeta = (src) => {
    const t = src.type || "";
    if (t === "foreign_gov") {
      return {
        cls: "is-foreign",
        label: `Foreign Country · ${src.donorCountry || "Bilateral Grant"}`,
      };
    }
    if (t === "private_donor") {
      return {
        cls: "is-private",
        label: src.donorCountry && !/private/i.test(src.donorCountry) ? `Private Donor · ${src.donorCountry}` : (src.donorCountry || "Private / Philanthropic Donor"),
      };
    }
    if (t === "gate_revenue") {
      return {
        cls: "is-gate",
        label: src.donorCountry || "Self-Generated Gate Revenue",
      };
    }
    if (t === "multilateral") {
      return {
        cls: "is-multi",
        label: src.donorCountry || "Multilateral Grant",
      };
    }
    return {
      cls: "is-host",
      label: src.donorCountry || `Host Government (${props.country || "State"})`,
    };
  };

  return `
    <div class="funding-sources-block">
      <div class="funding-sources-head">
        <span>Where Funding Comes From (${list.length} Verified Source${list.length > 1 ? "s" : ""})</span>
      </div>
      <div class="funding-sources-list">
        ${list
          .map((src) => {
            const pm = pillMeta(src);
            const amt = src.usd ? formatUsdMoney(src.usd) : "Disclosed Partner";
            const yrs = src.years ? ` (${src.years})` : "";
            return `
              <div class="funding-source-item">
                <div class="funding-source-top">
                  <span class="origin-pill ${pm.cls}">${escapeHtml(pm.label)}</span>
                  <span class="funding-source-amt ${src.usd ? "" : "is-na"}">${escapeHtml(amt)}</span>
                </div>
                <div class="funding-source-funder">${
                  src.url
                    ? `<a href="${escapeHtml(src.url)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline;text-decoration-color:rgba(0,0,0,0.22);">${escapeHtml(src.funder || " Conservation Funder")}</a>`
                    : escapeHtml(src.funder || "Conservation Funder")
                }${escapeHtml(yrs)}</div>
                ${src.note ? `<div class="funding-source-note">${escapeHtml(src.note)}</div>` : ""}
              </div>`;
          })
          .join("")}
      </div>
    </div>
  `;
}

function buildFundingModel(props) {
  const gf = state.globalFunding || {};
  const siteFund = (props.qid && gf.sites && gf.sites[props.qid]) || null;
  const fSources = (props.qid && gf.fundingSources && gf.fundingSources[props.qid]) || [];
  const unescoGrant = (props.unescoId && gf.unescoGrants && gf.unescoGrants[String(props.unescoId)]) || null;
  const cf = resolveCountryFunding(props);

  const cat = props.cat || props.econTier || "nondisclosed";
  const isDanger = Boolean(props.unescoDanger || cat === "distressed");
  const isVuln = Boolean(cat === "vulnerable");
  const isHealthy = Boolean(cat === "prime" || cat === "healthy");

  // Revenue Generation side (strictly audited site-level gate/operating revenue; otherwise Not Available)
  let revLabel = "Revenue Generation";
  let revVal = "Not Available";
  let revGap = true;
  let revSub = "Site-level ticket receipts not publicly disclosed";

  if (siteFund && !siteFund.isTrustPool && siteFund.revenueUsd) {
    revVal = formatUsdMoney(siteFund.revenueUsd);
    revGap = false;
    revSub = [siteFund.fy, siteFund.revenueLocal || siteFund.local].filter(Boolean).join(" · ") || "Audited gate receipts";
  } else if (props.revenueCr) {
    revVal = formatMoneyCr(props.revenueCr, true);
    revGap = false;
    revSub = `${props.ticketFy || "FY 2023–24"} · Official ASI ticket receipt`;
  } else {
    const gateSrc = fSources.find((s) => s.type === "gate_revenue" && s.usd);
    if (gateSrc) {
      revVal = formatUsdMoney(gateSrc.usd);
      revGap = false;
      revSub = [gateSrc.years, gateSrc.funder].filter(Boolean).join(" · ");
    }
  }

  // Maintenance / Conservation Cost side (strictly audited site-level upkeep/grant; otherwise Not Available)
  let maintLabel = "Maintenance & Conservation";
  let maintVal = "Not Available";
  let maintGap = true;
  let maintSub =
    cf && cf.budgetUsd !== null && cf.basis !== "unlisted"
      ? `Site split non-disclosed (${cf.shortAgency}: ${formatUsdMoney(cf.budgetUsd)} national pool)`
      : "Site-level upkeep not publicly disclosed";

  if (siteFund && !siteFund.isTrustPool && siteFund.maintenanceUsd) {
    maintVal = formatUsdMoney(siteFund.maintenanceUsd);
    maintGap = false;
    maintSub = [siteFund.fy, siteFund.maintenanceLocal || siteFund.steward].filter(Boolean).join(" · ");
  } else if (siteFund && !siteFund.isTrustPool && !siteFund.revenueUsd && siteFund.usd) {
    maintLabel = siteFund.metricLabel || "Site Conservation Outlay";
    maintVal = formatUsdMoney(siteFund.usd);
    maintGap = false;
    maintSub = [siteFund.fy, siteFund.steward].filter(Boolean).join(" · ");
  } else if (unescoGrant && unescoGrant.usd > 0) {
    maintLabel = "Audited Conservation Grant";
    maintVal = formatUsdMoney(unescoGrant.usd);
    maintGap = false;
    maintSub = `UNESCO WHC (${unescoGrant.count} project${unescoGrant.count > 1 ? "s" : ""}) · Routine upkeep Not Available`;
  } else {
    const grantTotal = fSources
      .filter((s) => s.type !== "gate_revenue" && Number(s.usd) > 0)
      .reduce((acc, s) => acc + Number(s.usd), 0);
    if (grantTotal > 0) {
      maintLabel = "Disclosed Donor / State Grants";
      maintVal = formatUsdMoney(grantTotal);
      maintGap = false;
      const countries = [...new Set(fSources.filter((s) => s.type === "foreign_gov").map((s) => s.donorCountry))];
      maintSub = countries.length
        ? `Funded by ${countries.slice(0, 3).join(", ")}${countries.length > 3 ? " +" : ""}`
        : "Published conservation commitments";
    } else if (props.circleExpCr) {
      maintSub = `Site split Not Available (${props.circleName || "ASI Circle"}: ${formatMoneyCr(props.circleExpCr, true)} pool)`;
    } else if (siteFund && siteFund.isTrustPool) {
      maintSub = `Site split Not Available (${siteFund.steward}: ${formatUsdMoney(siteFund.usd)} shared pool)`;
    }
  }

  // Honest Status Badge — NEVER assume funded or underfunded when data is Not Available
  let tierClass = "tier-unknown";
  let tierLabel = "Not Available";
  let meterClass = "is-gap";
  let meterPct = 12;

  if (isDanger) {
    tierClass = "tier-poor";
    tierLabel = "Distressed";
    meterClass = "is-poor";
    meterPct = 28;
  } else if (isVuln) {
    tierClass = "tier-avg";
    tierLabel = "Vulnerable";
    meterClass = "is-avg";
    meterPct = 52;
  } else if (isHealthy || (!revGap && !maintGap) || (!revGap && siteFund)) {
    tierClass = "tier-good";
    tierLabel = "Healthy";
    meterClass = "is-good";
    meterPct = 90;
  } else if (!maintGap) {
    tierClass = "tier-avg";
    tierLabel = "Grant-Supported";
    meterClass = "is-avg";
    meterPct = 64;
  }

  let citationText = "";
  let sourceUrl = "";
  if (siteFund) {
    citationText = `${siteFund.steward || "Monument Authority"} (${siteFund.fy || "Published report"}): ${siteFund.balanceNote || siteFund.note || "Audited financial statement."}`;
    sourceUrl = siteFund.sourceUrl || cf?.sourceUrl || "";
  } else if (fSources.length) {
    citationText = fSources.map((s) => `${s.donorCountry ? `${s.donorCountry}: ` : ""}${s.funder}${s.years ? ` (${s.years})` : ""}`).join("; ") + ".";
    sourceUrl = fSources.find((s) => s.url)?.url || cf?.sourceUrl || "";
  } else if (cf && cf.budgetUsd !== null && cf.basis !== "unlisted") {
    citationText = `Monument-level revenue and maintenance figures are Not Available in open records. National pool context (${cf.agency}, ${cf.fy}): ${cf.note}`;
    sourceUrl = cf.sourceUrl || "";
  } else {
    citationText =
      cf?.note ||
      `Neither site-level conservation budgets nor national ministry heritage line-items are publicly disclosed for ${props.country || "this jurisdiction"}.`;
    sourceUrl = "https://data.unesco.org/explore/dataset/uis002/";
  }

  return {
    tierClass,
    tierLabel,
    meterClass,
    meterPct,
    leftLabel: revLabel,
    leftVal: revVal,
    leftGap: revGap,
    leftSub: revSub,
    rightLabel: maintLabel,
    rightVal: maintVal,
    rightGap: maintGap,
    rightSub: maintSub,
    citationText,
    sourceUrl,
  };
}

// ---------- Visitor Traffic / Yearly Footfall Card ----------
function renderVisitorTrafficCard(props, wdFacts = null) {
  const visMeta = (props.qid && state.globalFunding?.visitors?.[props.qid]) || null;
  const india5Y = getIndiaFiveYearSeries(props);
  const count =
    visMeta?.count ||
    props.annualVisitors ||
    (props.footfallLakhs ? Math.round(Number(props.footfallLakhs) * 100000) : null) ||
    wdFacts?.liveVisitors ||
    null;

  const yearLabel = visMeta?.year || wdFacts?.liveVisitorYear || (props.footfallLakhs ? "FY 2023–24" : null);
  const rankInCountry = visMeta?.rankInCountry || props.visitorRankInCountry || null;
  const isTop5 = Boolean(props.isMostVisited || (rankInCountry && rankInCountry <= 5));
  const ticketVal =
    props.ticketIndianInr || props.ticketForeignInr
      ? formatTicketPair(props.ticketIndianInr, props.ticketForeignInr)
      : visMeta?.tariff || props.tariffText || wdFacts?.feeText || "";

  const hasChartSeries = Boolean(
    (india5Y && india5Y.visitorsLakhs && india5Y.visitorsLakhs.some((v) => v !== null && Number.isFinite(Number(v)))) ||
      (visMeta?.series && visMeta.series.length >= 2) ||
      (wdFacts?.liveSeries && wdFacts.liveSeries.length >= 2)
  );
  if (!count && !hasChartSeries && !ticketVal && !rankInCountry) {
    return `
      <section class="apple-section-card apple-section-compact" id="visitor-traffic-card" aria-label="Visitor Traffic">
        <div class="apple-section-head">
          <span class="apple-section-title">Visitor Traffic</span>
          <span class="funding-tier-badge tier-unknown">Not Available</span>
        </div>
      </section>
    `;
  }

  let badgeClass = "tier-unknown";
  let badgeText = "Footfall Gap";
  if (count && count > 0) {
    if (isTop5 && rankInCountry) {
      badgeClass = "tier-visited";
      badgeText = `#${rankInCountry} Most Visited in ${props.country || "Country"}`;
    } else if (rankInCountry) {
      badgeClass = "tier-good";
      badgeText = `Ranked #${rankInCountry} in ${props.country || "Country"}`;
    } else {
      badgeClass = "tier-good";
      badgeText = "Verified Footfall";
    }
  }

  // Multi-year bar chart (India 5Y series or Wikidata/Ministry multi-year series)
  let chartHtml = "";
  if (india5Y && india5Y.visitorsLakhs) {
    const vals = india5Y.visitorsLakhs;
    const valid = vals.filter((v) => v !== null && Number.isFinite(Number(v))).map(Number);
    if (valid.length >= 2) {
      const maxV = Math.max(...valid, 0.01);
      chartHtml = `
        <div class="traffic-series-wrap">
          <div class="traffic-series-head">
            <span>5-Year Annual Footfall Trend</span>
            <span>Visitors (Millions / Lakhs)</span>
          </div>
          <div class="traffic-bar-grid">
            ${vals
              .map((v, idx) => {
                if (v === null || v === undefined) {
                  return `<div class="bar-col"><span class="bar-val is-na">N/A</span><div class="bar-track"><div class="bar-fill is-na"></div></div><span class="bar-fy">${india5Y.fys[idx]}</span></div>`;
                }
                const pct = Math.max(8, Math.round((Number(v) / maxV) * 100));
                const disp = formatCompactVisitors(Math.round(Number(v) * 100000));
                return `<div class="bar-col"><span class="bar-val">${escapeHtml(disp)}</span><div class="bar-track"><div class="bar-fill" style="height:${pct}%"></div></div><span class="bar-fy">${india5Y.fys[idx]}</span></div>`;
              })
              .join("")}
          </div>
        </div>`;
    }
  } else {
    const series = (visMeta?.series && visMeta.series.length >= 2 ? visMeta.series : wdFacts?.liveSeries) || [];
    if (series.length >= 2) {
      const maxV = Math.max(...series.map((s) => Number(s.count) || 0), 1);
      chartHtml = `
        <div class="traffic-series-wrap">
          <div class="traffic-series-head">
            <span>Recorded Multi-Year Footfall</span>
            <span>Annual Visitors</span>
          </div>
          <div class="traffic-bar-grid">
            ${series
              .map((s) => {
                const pct = Math.max(8, Math.round(((Number(s.count) || 0) / maxV) * 100));
                return `<div class="bar-col"><span class="bar-val">${escapeHtml(formatCompactVisitors(s.count))}</span><div class="bar-track"><div class="bar-fill" style="height:${pct}%"></div></div><span class="bar-fy">${escapeHtml(String(s.year))}</span></div>`;
              })
              .join("")}
          </div>
        </div>`;
    }
  }

  const rightBoxLabel = ticketVal ? "Entry Tariff" : rankInCountry ? "National Rank" : "Ticketing";
  const rightBoxVal = ticketVal
    ? ticketVal
    : rankInCountry
      ? `#${rankInCountry} in ${props.country || "Country"}`
      : "Not Published";
  const rightBoxGap = !ticketVal && !rankInCountry;
  const rightBoxSub = ticketVal
    ? "Published admission tariff"
    : rankInCountry
      ? isTop5
        ? "Top 5 verified most-visited monument"
        : `Among ${visMeta?.totalRankedInCountry || "verified"} metered sites`
      : "Admission tariff not in open registries";

  const citationSource = count
    ? india5Y
      ? `${india5Y.source} (${yearLabel || "FY 2023–24"}): ${Number(count).toLocaleString()} annual visitors.`
      : `${visMeta?.source || `Wikidata P1174 (${props.qid})`} (${yearLabel ? `CY ${yearLabel}` : "Latest published year"}): ${Number(count).toLocaleString()} annual visitors.`
    : `Annual visitor attendance is not publicly reported in ministry compendia or Wikidata (P1174) for ${props.name}.`;
  const citationUrl = count
    ? india5Y?.url || visMeta?.url || (props.qid ? `https://www.wikidata.org/wiki/${props.qid}` : "")
    : props.qid
      ? `https://www.wikidata.org/wiki/${props.qid}`
      : "";

  return `
    <section class="apple-section-card" id="visitor-traffic-card" aria-label="Visitor Traffic">
      <div class="apple-section-head">
        <div class="apple-section-head-left">
          <span class="apple-section-title">Visitor Traffic</span>
          <span class="funding-tier-badge ${badgeClass}">${escapeHtml(badgeText)}</span>
        </div>
      </div>
      <div class="budget-split-grid" style="margin-bottom:${chartHtml ? "12px" : "4px"};">
        <div class="budget-split-box">
          <span class="budget-split-label">Annual Visitors</span>
          <span class="budget-split-val ${count ? "" : "is-gap-val"}">${escapeHtml(count ? Number(count).toLocaleString() : "Unreported")}</span>
          <span class="budget-split-sub">${escapeHtml(
            count
              ? `${formatCompactVisitors(count)}/yr · ${yearLabel ? `Recorded ${yearLabel}` : "Verified record"}`
              : "No public footfall count disclosed"
          )}</span>
        </div>
        <div class="budget-split-box">
          <span class="budget-split-label">${escapeHtml(rightBoxLabel)}</span>
          <span class="budget-split-val ${rightBoxGap ? "is-gap-val" : ""}" style="${ticketVal ? "font-size:13px;" : ""}">${escapeHtml(rightBoxVal)}</span>
          <span class="budget-split-sub">${escapeHtml(rightBoxSub)}</span>
        </div>
      </div>
      ${chartHtml}
      ${citeHtml(citationSource, citationUrl, count ? "Citation" : "Data Gap Note")}
    </section>
  `;
}

// ---------- Multi-Dimensional Documentation Gap Audit Card ----------
function renderDocumentationGapsCard(props, effectiveDate, fm, wikiResult = null, wdFacts = null) {
  const hasPhoto = Boolean(props.image || (state.galleryCache[props.qid || props.name]?.length > 0));
  const hasVisitors = Boolean(
    props.annualVisitors ||
      props.footfallLakhs ||
      state.globalFunding?.visitors?.[props.qid]?.count ||
      wdFacts?.liveVisitors
  );
  const hasSiteBudget = !fm.leftGap;
  const hasYear = effectiveDate.yearNum !== null;
  const hasWiki = Boolean(props.wikipedia || (wikiResult?.url && /wikipedia\.org/i.test(wikiResult.url)));
  const hasDigReg = props.hasDigitalRegistry !== false;

  const missing = [];
  if (!hasSiteBudget) {
    missing.push({
      dim: "Statistical",
      text: fm.rightGap
        ? "Neither monument-level conservation spend nor national heritage budget is publicly disclosed."
        : "Monument-level conservation expenditure is not itemized in public ministry accounts.",
    });
  }
  if (!hasVisitors) {
    missing.push({
      dim: "Traffic",
      text: "Annual visitor footfall is unpublished in open tourism/ministry compendia (P1174).",
    });
  }
  if (!hasPhoto) {
    missing.push({
      dim: "Photographic",
      text: "No open-licensed ground photograph in Wikimedia Commons; relying on orbital satellite imagery.",
    });
  }
  if (!hasYear) {
    missing.push({
      dim: "Chronological",
      text: "Construction date / inception century is unrecorded in digitized heritage registries.",
    });
  }
  if (!hasWiki || !hasDigReg) {
    missing.push({
      dim: "Archival",
      text: !hasWiki && !hasDigReg
        ? "Missing both an English Wikipedia monograph and a digitized national registry ID (P1435)."
        : !hasWiki
          ? "No dedicated English Wikipedia historical article linked to this statutory monument."
          : "National heritage authority registry code is not yet linked in open Wikidata (P1435).",
    });
  }

  const cSummary = state.worldSummary?.countries?.find((c) => c.iso3 === props.countryIso);
  let countryGapFoot = "";
  if (cSummary && cSummary.total > 0) {
    const noVisPct = Math.round(((cSummary.total - (cSummary.withVisitors || 0)) / cSummary.total) * 100);
    const noPhotoPct = Math.round(((cSummary.uncovered || 0) / cSummary.total) * 100);
    countryGapFoot = `Across ${cSummary.name}'s ${cSummary.total.toLocaleString()} mapped monuments, ${noVisPct}% lack public visitor counts and ${noPhotoPct}% lack archive photography.`;
  }

  const statusBadge =
    missing.length === 0
      ? `<span class="funding-tier-badge tier-good">Complete Record (5/5)</span>`
      : `<span class="funding-tier-badge ${missing.length >= 3 ? "tier-poor" : "tier-avg"}">${missing.length} Gap${missing.length > 1 ? "s" : ""} Exposed</span>`;

  return `
    <section class="apple-section-card" id="documentation-gaps-card" aria-label="Documentation Audit">
      <div class="apple-section-head">
        <div class="apple-section-head-left">
          <span class="apple-section-title">Documentation Audit</span>
          ${statusBadge}
        </div>
      </div>
      <div class="gap-audit-list">
        ${
          missing.length
            ? missing
                .map(
                  (g) => `
              <div class="gap-audit-item">
                <span class="gap-audit-dim">${escapeHtml(g.dim)}</span>
                <span class="gap-audit-text">${escapeHtml(g.text)}</span>
              </div>`
                )
                .join("")
            : `<div class="gap-audit-item">
                <span class="gap-audit-dim is-ok">Verified</span>
                <span class="gap-audit-text">Photographic, chronological, archival, visitor footfall, and site-level funding records are all publicly documented.</span>
              </div>`
        }
      </div>
      ${countryGapFoot ? `<div class="apple-unesco-note">${escapeHtml(countryGapFoot)}</div>` : ""}
    </section>
  `;
}

function openMonumentFromCoords(rawProps, coords, shouldFly = false) {
  const merged = getMergedProps(rawProps);
  openMonumentDrawer(merged, coords, shouldFly, false);
  if (merged.countryIso && !state.countryShards[merged.countryIso]) {
    ensureCountryShard(merged.countryIso).then(() => {
      if (state.lastDrawer && state.lastDrawer.props.qid === merged.qid) {
        const refreshed = getMergedProps(merged);
        state.lastDrawer.props = refreshed;
        openMonumentDrawer(refreshed, coords, false, true);
      }
    });
  }
}

// ---------- Conditional Conservation & Restoration Timeline (Shown ONLY When Verified Records Exist) ----------
function extractRestorationEvents(text, sourceLabel, builtYearNum = null) {
  if (!text) return [];
  const re = /\b(restor(?:ed|ation|ing)|conserv(?:ed|ation|ing)|renovat(?:ed|ion|ing)|reconstruct(?:ed|ion)|excavat(?:ed|ion)|stabiliz(?:ed|ation)|rebuilt|rehabilitat(?:ed|ion)|unesco\s+emergency|world\s+monuments\s+fund)\b/i;
  const originCueRe = /\b(originally\s+built|first\s+built|commissioned\s+in|founded\s+in|constructed\s+between)\b/i;
  const sentences = String(text).replace(/\s+/g, " ").match(/[^.!?]+[.!?]+/g) || [];
  const out = [];
  for (const s of sentences) {
    const clean = s.trim();
    if (!re.test(clean) || clean.length < 30 || clean.length > 250) continue;
    const yrM = clean.match(/\b(1[7-9]\d{2}|20[0-2]\d)\b/);
    if (!yrM) continue;
    const yr = Number(yrM[1]);
    if (builtYearNum !== null && Math.abs(yr - builtYearNum) <= 5 && originCueRe.test(clean)) continue;
    out.push({
      year: yr,
      yearLabel: String(yr),
      text: clean,
      source: sourceLabel,
    });
    if (out.length >= 4) break;
  }
  return out;
}

function renderRestorationCard(props, effectiveDate, wikiResult = null) {
  const gf = state.globalFunding || {};
  const restGrant = (props.qid && gf.restoration && gf.restoration[props.qid]) || null;
  const unescoGrant = (props.unescoId && gf.unescoGrants && gf.unescoGrants[String(props.unescoId)]) || null;
  const events = [];

  if (props.unescoDanger) {
    events.push({
      year: 2024,
      yearLabel: "In Danger",
      text: `Inscribed on the UNESCO List of World Heritage in Danger, subject to statutory reactive monitoring and emergency conservation measures.`,
      source: "UNESCO World Heritage Centre",
    });
  }
  if (restGrant) {
    events.push({
      year: Number(String(restGrant.year || "2023").slice(0, 4)) || 2023,
      yearLabel: String(restGrant.year || "Active Grant"),
      text: `${restGrant.program}: ${restGrant.summary}${restGrant.usd ? ` (${formatUsdMoney(restGrant.usd)})` : ""}`,
      source: restGrant.program,
      url: restGrant.url || "",
    });
  }
  if (unescoGrant && unescoGrant.projectTitle) {
    events.push({
      year: 2023,
      yearLabel: "WHC Assist",
      text: `UNESCO International Assistance (${formatUsdMoney(unescoGrant.usd)}): "${unescoGrant.projectTitle}".`,
      source: "UNESCO Culture Sector (prj001)",
      url: "https://data.unesco.org/explore/dataset/prj001/",
    });
  }
  if (props.adoptPartner) {
    events.push({
      year: 2024,
      yearLabel: "Stewardship",
      text: `Adopted by ${props.adoptPartner} (${props.adoptScope || "Visitor amenities & upkeep; core structural conservation retained by statutory agency"}).`,
      source: props.adoptProgram || "Adopt a Heritage 2.0",
    });
  }
  if (Array.isArray(props.restorationEvents)) {
    for (const rev of props.restorationEvents) {
      if (rev?.year && rev?.label) {
        events.push({
          year: Number(rev.year),
          yearLabel: String(rev.year),
          text: `${rev.label} recorded in structured heritage archive (Wikidata P793).`,
          source: `Wikidata P793 (${props.qid || "Archive"})`,
          url: props.qid ? `https://www.wikidata.org/wiki/${props.qid}` : "",
        });
      }
    }
  }
  if (wikiResult?.fullText) {
    const wikiEvs = extractRestorationEvents(wikiResult.fullText, `Wikipedia (${wikiResult.title || "Archive"})`, effectiveDate?.yearNum ?? null);
    for (const wev of wikiEvs) {
      if (!events.some((e) => e.year === wev.year || e.text === wev.text)) {
        events.push({ ...wev, url: wikiResult.url || "" });
      }
    }
  }

  if (!events.length) return "";
  events.sort((a, b) => a.year - b.year);
  const topEvents = events.slice(-4);
  const citeUrl = topEvents.find((e) => e.url)?.url || props.wikipedia || (props.unescoId ? `https://whc.unesco.org/en/list/${props.unescoId}` : "");
  const citeSources = [...new Set(topEvents.map((e) => e.source))].join(" · ");

  return `
    <section class="apple-section-card" id="restoration-timeline-card" aria-label="Conservation and Restoration History">
      <div class="apple-section-head">
        <div class="apple-section-head-left">
          <span class="apple-section-title">Conservation &amp; Restoration</span>
          <span class="funding-tier-badge ${props.unescoDanger ? "tier-poor" : "tier-good"}">${topEvents.length} Record${topEvents.length > 1 ? "s" : ""}</span>
        </div>
      </div>
      <div class="gap-audit-list">
        ${topEvents
          .map(
            (ev) => `
          <div class="gap-audit-item">
            <span class="gap-audit-dim ${props.unescoDanger && ev.yearLabel === "In Danger" ? "" : "is-ok"}">${escapeHtml(ev.yearLabel)}</span>
            <span class="gap-audit-text">${escapeHtml(ev.text)}</span>
          </div>`
          )
          .join("")}
      </div>
      ${citeHtml(`Dated conservation & restoration records compiled from ${citeSources}.`, citeUrl)}
    </section>
  `;
}

function renderRevenueSeriesChart(props) {
  const india5Y = getIndiaFiveYearSeries(props);
  const siteFund = (props.qid && state.globalFunding?.sites?.[props.qid]) || null;
  if (india5Y && india5Y.revenueCr) {
    const vals = india5Y.revenueCr;
    const valid = vals.filter((v) => v !== null && Number.isFinite(Number(v))).map(Number);
    if (valid.length >= 2) {
      const maxR = Math.max(...valid, 0.01);
      return `
        <div class="traffic-series-wrap" style="margin-top:12px;">
          <div class="traffic-series-head">
            <span>5-Year Ticket Revenue Trend</span>
            <span>${state.currency === "INR" ? "₹ Crore" : `Converted (${state.currency})`}</span>
          </div>
          <div class="traffic-bar-grid">
            ${vals
              .map((v, idx) => {
                if (v === null || v === undefined) {
                  return `<div class="bar-col"><span class="bar-val is-na">N/A</span><div class="bar-track"><div class="bar-fill is-na"></div></div><span class="bar-fy">${india5Y.fys[idx]}</span></div>`;
                }
                const pct = Math.max(8, Math.round((Number(v) / maxR) * 100));
                const disp = formatMoneyCr(Number(v), true);
                return `<div class="bar-col"><span class="bar-val">${escapeHtml(disp)}</span><div class="bar-track"><div class="bar-fill" style="height:${pct}%;background:#34c759;"></div></div><span class="bar-fy">${india5Y.fys[idx]}</span></div>`;
              })
              .join("")}
          </div>
        </div>`;
    }
  }
  if (siteFund?.revenueSeries && siteFund.revenueSeries.length >= 2) {
    const series = siteFund.revenueSeries;
    const maxR = Math.max(...series.map((s) => Number(s.usd) || 0), 1);
    return `
      <div class="traffic-series-wrap" style="margin-top:12px;">
        <div class="traffic-series-head">
          <span>Multi-Year Site Budget / Receipts</span>
          <span>${escapeHtml(state.currency)}</span>
        </div>
        <div class="traffic-bar-grid">
          ${series
            .map((s) => {
              const pct = Math.max(8, Math.round(((Number(s.usd) || 0) / maxR) * 100));
              return `<div class="bar-col"><span class="bar-val">${escapeHtml(formatUsdMoney(s.usd))}</span><div class="bar-track"><div class="bar-fill" style="height:${pct}%;background:#34c759;"></div></div><span class="bar-fy">${escapeHtml(String(s.year))}</span></div>`;
            })
            .join("")}
        </div>
      </div>`;
  }
  return "";
}

function openMonumentDrawer(rawProps, coords, shouldFly = false, isRefresh = false) {
  const props = getMergedProps(rawProps);
  state.lastDrawer = { props, coords };
  const dateInfo = extractConstructionInfo(props);
  const cachedWd = (props.qid && state.wdFactsCache[props.qid]) || null;
  const cachedWiki = state.wikiCache[props.qid || props.name] || null;
  const effectiveDate = cachedWd?.rawYear !== undefined && cachedWd?.rawYear !== null ? extractConstructionInfo(props, cachedWd.rawYear) : dateInfo;

  const hasPhoto = Boolean(props.image);
  const visMeta = (props.qid && state.globalFunding?.visitors?.[props.qid]) || null;
  const visCount =
    visMeta?.count ||
    props.annualVisitors ||
    (props.footfallLakhs ? Math.round(Number(props.footfallLakhs) * 100000) : null) ||
    cachedWd?.liveVisitors ||
    null;

  // 1) Clean deduplicated Apple Maps Kicker: Type · City, Region, Country
  const placeParts = dedupeSubtitleParts([props.location, props.region, props.country]);
  const cleanType =
    props.siteType && props.siteType.toLowerCase() !== "monument"
      ? props.siteType
      : props.unescoCategory
        ? `${props.unescoCategory} Monument`
        : "Architectural Monument";
  const kickerText = [cleanType, placeParts.join(", ")].filter(Boolean).join(" · ");

  // 2) Concise non-redundant Apple Status Pills (max 3)
  const pills = [];
  if (props.unescoDanger) {
    pills.push(`<span class="apple-pill pill-danger">UNESCO In Danger</span>`);
  } else if (props.unesco) {
    pills.push(`<span class="apple-pill pill-unesco">UNESCO${props.unescoYear ? ` · ${escapeHtml(props.unescoYear)}` : ""}</span>`);
  }
  const regCode = props.registryCode || props.asiId || cachedWd?.registryCode || "";
  if (regCode) {
    pills.push(`<span class="apple-pill">${escapeHtml(regCode)}</span>`);
  } else if (props.isMostVisited || (visMeta?.rankInCountry && visMeta.rankInCountry <= 5)) {
    pills.push(`<span class="apple-pill pill-unesco">Top ${visMeta?.rankInCountry || 5} Visited</span>`);
  }
  if (props.contested) {
    pills.push(`<span class="apple-pill pill-contested">Contested${props.contestedArea ? ` · ${escapeHtml(props.contestedArea)}` : ""}</span>`);
  }
  if (!hasPhoto) {
    pills.push(`<span class="apple-pill pill-uncovered" id="coverage-badge">! No Archive Photo</span>`);
  }

  // 3) 3-Column Apple Maps Glance Strip (BUILT | VISITORS/AREA/ERA | CONDITION)
  let midLabel = "Era";
  let midVal = props.era && props.era !== "unk" ? ERA_LABELS[props.era].split(" (")[0] : "Historic";
  let midSub = props.era && props.era !== "unk" && ERA_LABELS[props.era].includes("(") ? ERA_LABELS[props.era].replace(/^[^(]+\(|\)$/g, "") : "Built structure";
  if (visCount) {
    midLabel = "Visitors";
    midVal = formatCompactVisitors(visCount);
    midSub = visMeta?.rankInCountry && visMeta.rankInCountry <= 5 ? `#${visMeta.rankInCountry} in ${props.country || "Country"}` : "Annual footfall";
  } else if (props.unescoAreaHa) {
    midLabel = "Protected Zone";
    midVal = `${Math.round(Number(props.unescoAreaHa)).toLocaleString()} ha`;
    midSub = "UNESCO boundary";
  }

  const effConsState = props.conservationState || cachedWd?.conservationState || "";
  let condVal = "Protected";
  let condSub = "Statutory care";
  let condAccent = "color: #15803d;";
  if (props.unescoDanger) {
    condVal = "In Danger";
    condSub = "UNESCO alert";
    condAccent = "color: #c62828;";
  } else if (props.inRestoration || props.adoptPartner || (props.qid && state.globalFunding?.restoration?.[props.qid])) {
    condVal = "Restoring";
    condSub = props.adoptPartner || state.globalFunding?.restoration?.[props.qid]?.program || "Active works";
    condAccent = "color: #b45309;";
  } else if (effConsState && /(ruin|damaged|at risk|destroyed|neglect|poor|threatened)/i.test(effConsState)) {
    condVal = effConsState.charAt(0).toUpperCase() + effConsState.slice(1);
    condSub = "Conservation alert";
    condAccent = "color: #c62828;";
  } else if (effConsState) {
    condVal = effConsState.charAt(0).toUpperCase() + effConsState.slice(1);
    condSub = "Recorded state";
    condAccent = "color: #15803d;";
  } else if (props.underfundedCircle) {
    condVal = "Stretched";
    condSub = "Low circle pool";
    condAccent = "color: #b45309;";
  }

  // 4) Zero-Fabrication Cited Funding Health Card (Concise strip when unavailable)
  const fm = buildFundingModel(props);
  const revSeriesHtml = renderRevenueSeriesChart(props);
  const gf = state.globalFunding || {};
  const hasFundingSources = Boolean(
    (props.qid && Array.isArray(gf.fundingSources?.[props.qid]) && gf.fundingSources[props.qid].length) ||
      (props.qid && gf.restoration?.[props.qid]) ||
      (props.unescoId && gf.unescoGrants?.[String(props.unescoId)]?.usd > 0) ||
      props.adoptPartner
  );
  const hasMonetaryData = !fm.leftGap || !fm.rightGap || Boolean(revSeriesHtml);
  const fundingHealthHtml =
    !hasMonetaryData && !hasFundingSources
      ? `
    <section class="apple-section-card apple-section-compact" id="funding-health-card" aria-label="Funding Health">
      <div class="apple-section-head">
        <span class="apple-section-title">Funding Health</span>
        <span class="funding-tier-badge tier-unknown">Not Available</span>
      </div>
    </section>
  `
      : `
    <section class="apple-section-card" id="funding-health-card" aria-label="Funding Health">
      <div class="apple-section-head">
        <div class="apple-section-head-left">
          <span class="apple-section-title">Funding Health</span>
          <span class="funding-tier-badge ${fm.tierClass}">${escapeHtml(fm.tierLabel)}</span>
        </div>
        ${hasMonetaryData ? renderCurrencySwitchHtml() : ""}
      </div>
      <div class="budget-split-grid">
        <div class="budget-split-box">
          <span class="budget-split-label">${escapeHtml(fm.leftLabel)}</span>
          <span class="budget-split-val ${fm.leftGap ? "is-gap-val" : ""}">${escapeHtml(fm.leftVal)}</span>
          <span class="budget-split-sub">${escapeHtml(fm.leftSub)}</span>
        </div>
        <div class="budget-split-box">
          <span class="budget-split-label">${escapeHtml(fm.rightLabel)}</span>
          <span class="budget-split-val ${fm.rightGap ? "is-gap-val" : ""}">${escapeHtml(fm.rightVal)}</span>
          <span class="budget-split-sub">${escapeHtml(fm.rightSub)}</span>
        </div>
      </div>
      <div class="funding-meter-track" role="progressbar" aria-valuenow="${fm.meterPct}" aria-valuemin="0" aria-valuemax="100">
        <div class="funding-meter-fill ${fm.meterClass}" style="width:${fm.meterPct}%"></div>
      </div>
      ${renderFundingSourcesHtml(props)}
      ${revSeriesHtml}
      ${citeHtml(fm.citationText, fm.sourceUrl, fm.leftGap && fm.rightGap ? "Data Gap Note" : "Citation")}
    </section>
  `;

  // 5) Visitor Traffic Card
  const visitorTrafficHtml = renderVisitorTrafficCard(props, cachedWd);

  // 6) Statutory Recognition & Architecture Card — Zero repetition, Recognized By + Recognized Under + Registry Code
  const cf = resolveCountryFunding(props);
  const recognizedByVal =
    props.recognizingBody ||
    (props.asiId
      ? String(props.asiId).toUpperCase().startsWith("S-")
        ? `${props.state || "State"} Directorate of Archaeology`
        : "Archaeological Survey of India (ASI)"
      : cf?.recognizingBody || cf?.registryAuthority || cf?.agency || `National Heritage Authority (${props.country || "Sovereign State"})`);

  const rawDes = String(props.heritageDesignation || "").trim();
  const desIsDupCode = Boolean(regCode && rawDes.toLowerCase().includes(regCode.toLowerCase()));
  const desIsGenericWhs = Boolean(props.unesco && /^World Heritage Site$/i.test(rawDes));
  const cleanDes =
    rawDes &&
    !desIsDupCode &&
    !desIsGenericWhs &&
    rawDes.toLowerCase() !== recognizedByVal.toLowerCase() &&
    !/^(Government-Recognized Heritage|National Architectural Heritage|Government-Designated Heritage)$/i.test(rawDes)
      ? rawDes
      : cf?.statutoryRegister || cf?.registryLaw || "National Statutory Monument Register";

  const recognizedUnderParts = dedupeSubtitleParts([
    cleanDes,
    regCode ? `ID ${regCode}` : "",
    props.unesco ? `UNESCO World Heritage${props.unescoCriteria ? ` ${props.unescoCriteria}` : ""}` : "",
  ]);
  const recognizedUnderVal = recognizedUnderParts.join(" · ");

  const initArchitect = cachedWd?.architect || props.architect || "";
  const initPatron = cachedWd?.patron || props.patron || cachedWd?.foundedBy || cachedWd?.creator || "";
  const initStyle = cachedWd?.style || props.style || "";
  const initMaterial = cachedWd?.material || props.material || "";
  const initPeriod = cachedWd?.timePeriod || props.period || "";
  const showPeriod = Boolean(initPeriod && initPeriod.toLowerCase() !== initStyle.toLowerCase());

  const regCitationText = `${recognizedByVal}: ${recognizedUnderVal}${props.qid ? ` · Cross-referenced via Wikidata (${props.qid})` : ""}.`;
  const regCitationUrl = cf?.registryUrl || cf?.sourceUrl || (props.qid ? `https://www.wikidata.org/wiki/${props.qid}` : "");

  // 7) Conditional Conservation & Restoration Card + Multi-Dimensional Documentation Audit Card
  const restorationHtml = renderRestorationCard(props, effectiveDate, cachedWiki);
  const docGapsHtml = renderDocumentationGapsCard(props, effectiveDate, fm, cachedWiki, cachedWd);

  // 8) Clean Bottom Hyperlinks ONLY (Wikipedia strictly at the bottom)
  const extLinks = [];
  const cachedWikiUrl = cachedWiki?.url || "";
  const wikiHref = props.wikipedia || (/^https?:\/\/[^.]+\.wikipedia\.org\//i.test(cachedWikiUrl) ? cachedWikiUrl : "");
  if (wikiHref) {
    extLinks.push(`<a class="detail-link" data-link-kind="wikipedia" href="${escapeHtml(wikiHref)}" target="_blank" rel="noopener">Wikipedia ↗</a>`);
  }
  if (props.unescoId) {
    extLinks.push(`<a class="detail-link" href="https://whc.unesco.org/en/list/${encodeURIComponent(props.unescoId)}" target="_blank" rel="noopener">UNESCO #${escapeHtml(props.unescoId)} ↗</a>`);
  }
  if (props.qid && /^Q\d+$/i.test(props.qid)) {
    extLinks.push(`<a class="detail-link" href="https://www.wikidata.org/wiki/${encodeURIComponent(props.qid)}" target="_blank" rel="noopener">Wikidata ↗</a>`);
  }
  if (cf?.registryUrl) {
    extLinks.push(`<a class="detail-link" href="${escapeHtml(cf.registryUrl)}" target="_blank" rel="noopener">Official Registry ↗</a>`);
  }

  elDetailContent.innerHTML = `
    <div id="drawer-media-mount">
      ${hasPhoto ? renderCarouselHtml([{ url: hiResUrl(props.image), caption: props.name, credit: "Wikimedia Commons" }]) : renderSatelliteFallbackHtml(props, coords, true)}
    </div>

    <header class="apple-place-head">
      <h2 class="detail-title">${escapeHtml(props.name)}</h2>
      <div class="detail-kicker">${escapeHtml(kickerText)}</div>
      ${pills.length ? `<div class="apple-pill-row">${pills.slice(0, 3).join("")}</div>` : ""}
    </header>

    <section class="apple-section-card" id="historical-significance-card" aria-label="Historical Significance">
      <div class="apple-section-head">
        <span class="apple-section-title">Historical Significance</span>
      </div>
      <div class="hist-sig-prose" id="wiki-summary-mount">
        ${
          cachedWiki
            ? buildRichDescriptionHtml(props, effectiveDate, cachedWiki, cachedWd)
            : `<div class="skeleton-block" aria-label="Loading historical significance"><span class="skeleton-line w-full"></span><span class="skeleton-line w-88"></span></div>`
        }
      </div>
    </section>

    <div class="apple-glance-strip" aria-label="Key monument facts">
      <div class="apple-glance-cell">
        <span class="apple-glance-label">Built</span>
        <span class="apple-glance-val" id="drawer-age-val">${escapeHtml(effectiveDate.builtLabel)}</span>
        <span class="apple-glance-sub" id="drawer-age-sub">${escapeHtml(effectiveDate.ageLabel)}</span>
      </div>
      <div class="apple-glance-cell">
        <span class="apple-glance-label" id="glance-mid-label">${escapeHtml(midLabel)}</span>
        <span class="apple-glance-val" id="glance-mid-val">${escapeHtml(midVal)}</span>
        <span class="apple-glance-sub" id="glance-mid-sub">${escapeHtml(midSub)}</span>
      </div>
      <div class="apple-glance-cell">
        <span class="apple-glance-label">Condition</span>
        <span class="apple-glance-val" id="glance-cond-val" style="${condAccent}">${escapeHtml(condVal)}</span>
        <span class="apple-glance-sub" id="glance-cond-sub">${escapeHtml(condSub)}</span>
      </div>
    </div>

    ${fundingHealthHtml}

    <div id="visitor-traffic-mount">${visitorTrafficHtml}</div>

    <section class="apple-section-card" aria-label="Statutory Recognition and Architecture">
      <div class="apple-section-head">
        <span class="apple-section-title">Statutory Recognition &amp; Architecture</span>
      </div>
      <div class="apple-spec-list">
        <div class="apple-spec-row">
          <span class="apple-spec-key">Recognized By</span>
          <span class="apple-spec-val">${escapeHtml(recognizedByVal)}</span>
        </div>
        <div class="apple-spec-row">
          <span class="apple-spec-key">Recognized Under</span>
          <span class="apple-spec-val">${escapeHtml(recognizedUnderVal)}</span>
        </div>
        <div class="apple-spec-row ${initPatron ? "" : "hidden"}" id="spec-patron-row">
          <span class="apple-spec-key">Commissioned By</span>
          <span class="apple-spec-val" id="spec-patron-val">${escapeHtml(initPatron)}</span>
        </div>
        <div class="apple-spec-row ${initArchitect && initArchitect !== initPatron ? "" : "hidden"}" id="spec-architect-row">
          <span class="apple-spec-key">Architect</span>
          <span class="apple-spec-val" id="spec-architect-val">${escapeHtml(initArchitect)}</span>
        </div>
        <div class="apple-spec-row ${initStyle ? "" : "hidden"}" id="spec-style-row">
          <span class="apple-spec-key">Style</span>
          <span class="apple-spec-val" id="spec-style-val">${escapeHtml(initStyle)}</span>
        </div>
        <div class="apple-spec-row ${initMaterial ? "" : "hidden"}" id="spec-material-row">
          <span class="apple-spec-key">Material</span>
          <span class="apple-spec-val" id="spec-material-val">${escapeHtml(initMaterial)}</span>
        </div>
        <div class="apple-spec-row ${showPeriod ? "" : "hidden"}" id="spec-period-row">
          <span class="apple-spec-key">Period</span>
          <span class="apple-spec-val" id="spec-period-val">${escapeHtml(initPeriod)}</span>
        </div>
      </div>
      ${citeHtml(regCitationText, regCitationUrl)}
    </section>

    <div id="restoration-card-mount">${restorationHtml}</div>

    <div id="documentation-gaps-mount">${docGapsHtml}</div>

    <div class="detail-links" id="detail-links">${extLinks.join("")}</div>
  `;

  bindDrawerCurrencySwitch();
  hydrateDrawerCarousel("drawer-media-mount", props, coords);

  Promise.all([fetchWikiTwoSentences(props), fetchWikidataHistoryFacts(props.qid)]).then(([wikiResult, wdFacts]) => {
    if (!state.lastDrawer || state.lastDrawer.props.qid !== props.qid) return;
    const updatedDate = extractConstructionInfo(props, wdFacts?.rawYear ?? null);
    const sumEl = document.getElementById("wiki-summary-mount");
    if (sumEl) {
      sumEl.innerHTML = buildRichDescriptionHtml(props, updatedDate, wikiResult, wdFacts);
    }
    const linksEl = document.getElementById("detail-links");
    if (linksEl && wikiResult?.url && /^https?:\/\/[^.]+\.wikipedia\.org\//i.test(wikiResult.url)) {
      if (!linksEl.querySelector('[data-link-kind="wikipedia"]')) {
        linksEl.insertAdjacentHTML(
          "afterbegin",
          `<a class="detail-link" data-link-kind="wikipedia" href="${escapeHtml(wikiResult.url)}" target="_blank" rel="noopener">Wikipedia ↗</a>`
        );
      }
    }

    const kpiAgeVal = document.getElementById("drawer-age-val");
    const kpiAgeSub = document.getElementById("drawer-age-sub");
    if (updatedDate.yearNum !== null) {
      if (kpiAgeVal) kpiAgeVal.textContent = updatedDate.builtLabel;
      if (kpiAgeSub) kpiAgeSub.textContent = updatedDate.ageLabel;
    }

    if (wdFacts) {
      const pat = wdFacts.patron || props.patron || wdFacts.foundedBy || wdFacts.creator || "";
      const arch = wdFacts.architect || props.architect || "";
      const setSpecRow = (rowId, valId, val) => {
        if (!val) return;
        const r = document.getElementById(rowId);
        const v = document.getElementById(valId);
        if (r && v) {
          v.textContent = val;
          r.classList.remove("hidden");
        }
      };
      setSpecRow("spec-patron-row", "spec-patron-val", pat);
      if (arch && arch !== pat) setSpecRow("spec-architect-row", "spec-architect-val", arch);
      const sty = wdFacts.style || props.style || "";
      setSpecRow("spec-style-row", "spec-style-val", sty);
      setSpecRow("spec-material-row", "spec-material-val", wdFacts.material || props.material || "");
      const per = wdFacts.timePeriod || props.period || "";
      if (per && per.toLowerCase() !== sty.toLowerCase()) {
        setSpecRow("spec-period-row", "spec-period-val", per);
      }

      if (wdFacts.liveVisitors || wdFacts.feeText) {
        const vtMount = document.getElementById("visitor-traffic-mount");
        if (vtMount) vtMount.innerHTML = renderVisitorTrafficCard(props, wdFacts);
      }
    }

    const restMount = document.getElementById("restoration-card-mount");
    if (restMount) {
      restMount.innerHTML = renderRestorationCard(props, updatedDate, wikiResult);
    }

    const dgMount = document.getElementById("documentation-gaps-mount");
    if (dgMount) {
      dgMount.innerHTML = renderDocumentationGapsCard(props, updatedDate, fm, wikiResult, wdFacts);
    }
  });

  mountMapNearbyNav(props, coords);
  showDetailDrawer(coords, shouldFly, isRefresh);
}

// ---------- Map-Level Nearby Navigation Arrows ----------
function buildNearbyNav(coords, currentQid) {
  if (!coords) return null;
  const [lng0, lat0] = coords;
  const cosLat = Math.cos((lat0 * Math.PI) / 180);
  const scored = [];
  const countryCode = state.lastDrawer?.props?.countryIso || state.activeCountry;
  const pool = (countryCode && state.countryShards[countryCode]) || state.searchTop || [];

  for (const item of pool) {
    const c = item.coords;
    if (!c) continue;
    const distKm = Math.hypot((c[0] - lng0) * cosLat * 111.32, (c[1] - lat0) * 110.57);
    if (distKm <= 55) scored.push({ item, distKm });
  }
  scored.sort((a, b) => {
    if (a.item.qid === currentQid) return -1;
    if (b.item.qid === currentQid) return 1;
    return a.distKm - b.distKm;
  });
  const list = scored.slice(0, 14).map((x) => x.item);
  return list.length > 1 ? { list, index: 0 } : null;
}

function mountMapNearbyNav(props, coords) {
  const slot = document.getElementById("map-nearby-nav");
  let nav = state.nearbyNav;
  const curIdx = nav && nav.list ? nav.list.findIndex((x) => x.qid === props.qid) : -1;
  if (curIdx >= 0) {
    nav.index = curIdx;
  } else {
    nav = buildNearbyNav(coords, props.qid);
    state.nearbyNav = nav;
  }
  if (!slot) return;
  if (nav && nav.list && nav.list.length > 1) {
    slot.innerHTML = `
      <button type="button" class="map-nearby-btn" id="nearby-prev-btn" aria-label="Previous nearby monument" title="Previous nearby monument (←)">‹</button>
      <button type="button" class="map-nearby-btn" id="nearby-next-btn" aria-label="Next nearby monument" title="Next nearby monument (→)">›</button>`;
    slot.classList.remove("hidden");
    document.getElementById("nearby-prev-btn")?.addEventListener("click", () => navigateNearby(-1));
    document.getElementById("nearby-next-btn")?.addEventListener("click", () => navigateNearby(1));
  } else {
    slot.classList.add("hidden");
    slot.innerHTML = "";
  }
}

function navigateNearby(delta) {
  const nav = state.nearbyNav;
  if (!nav || !nav.list.length) return;
  nav.index = (nav.index + delta + nav.list.length) % nav.list.length;
  const target = nav.list[nav.index];
  if (!target) return;
  if (elDetailContent) elDetailContent.scrollTop = 0;
  openMonumentFromCoords(target, target.coords);
}

window.__oceanGradientActive = window.__oceanGradientActive !== undefined ? window.__oceanGradientActive : true;
window.__tempLandRgb = window.__tempLandRgb || [230 / 255, 238 / 255, 242 / 255];

function createOceanGradientLayer() {
  let prog = null;
  let vbo = null;
  let tex = null;
  let aPos = -1;
  let uTex = null;
  let uLandRgb = null;

  const vsSrc = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main() {
      v_uv = a_pos * 0.5 + 0.5;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;
  const fsSrc = `
    precision highp float;
    uniform sampler2D u_tex;
    uniform vec3 u_land_rgb;
    varying vec2 v_uv;

    vec3 gradBottomUp(float t) {
      vec3 c0 = vec3(0.0314, 0.0510, 0.0980); // #080d19 (bottom)
      vec3 c1 = vec3(0.0314, 0.0627, 0.1451); // #081025
      vec3 c2 = vec3(0.0196, 0.1137, 0.2392); // #051d3d
      vec3 c3 = vec3(0.0196, 0.2039, 0.4000); // #053466
      vec3 c4 = vec3(0.0784, 0.3569, 0.5804); // #145b94
      vec3 c5 = vec3(0.3176, 0.5882, 0.7412); // #5196bd
      vec3 c6 = vec3(0.5922, 0.7490, 0.7961); // #97bfcb
      vec3 c7 = vec3(0.6902, 0.7922, 0.8039); // #b0cacd
      vec3 c8 = vec3(0.7216, 0.8000, 0.8000); // #b8cccc (top)
      if (t <= 0.12) return mix(c0, c1, clamp(t / 0.12, 0.0, 1.0));
      if (t <= 0.25) return mix(c1, c2, (t - 0.12) / 0.13);
      if (t <= 0.40) return mix(c2, c3, (t - 0.25) / 0.15);
      if (t <= 0.55) return mix(c3, c4, (t - 0.40) / 0.15);
      if (t <= 0.70) return mix(c4, c5, (t - 0.55) / 0.15);
      if (t <= 0.85) return mix(c5, c6, (t - 0.70) / 0.15);
      if (t <= 0.95) return mix(c6, c7, (t - 0.85) / 0.10);
      return mix(c7, c8, clamp((t - 0.95) / 0.05, 0.0, 1.0));
    }

    void main() {
      vec4 c = texture2D(u_tex, v_uv);
      if (c.a <= 0.002) {
        gl_FragColor = vec4(0.0);
        return;
      }
      // Recover ocean coverage vs land coverage, leaving ocean untouched and lifting land from light-blue to white
      vec3 luma = vec3(0.299, 0.587, 0.114);
      float landY = max(dot(u_land_rgb, luma), 0.05);
      float lumRatio = clamp(dot(c.rgb, luma) / max(c.a * landY, 0.001), 0.0, 1.0);
      float w = 1.0 - lumRatio;
      vec3 landGrad = mix(u_land_rgb, vec3(1.0), smoothstep(0.14, 0.86, v_uv.y));
      vec3 g = gradBottomUp(v_uv.y);
      gl_FragColor = vec4((lumRatio * landGrad + w * g) * c.a, c.a);
    }
  `;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  return {
    id: "om-water-gradient",
    type: "custom",
    renderingMode: "2d",
    onAdd(mapInstance, gl) {
      const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
      const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
      prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      aPos = gl.getAttribLocation(prog, "a_pos");
      uTex = gl.getUniformLocation(prog, "u_tex");
      uLandRgb = gl.getUniformLocation(prog, "u_land_rgb");

      vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

      tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    },
    render(gl) {
      if (!window.__oceanGradientActive || !prog || !tex || !vbo) return;
      const w = gl.drawingBufferWidth;
      const h = gl.drawingBufferHeight;
      if (!w || !h) return;

      const prevProg = gl.getParameter(gl.CURRENT_PROGRAM);
      const prevBuf = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
      const prevActiveTex = gl.getParameter(gl.ACTIVE_TEXTURE);
      const prevTex = gl.getParameter(gl.TEXTURE_BINDING_2D);
      const wasBlend = gl.isEnabled(gl.BLEND);
      const wasDepth = gl.isEnabled(gl.DEPTH_TEST);
      const wasStencil = gl.isEnabled(gl.STENCIL_TEST);
      const wasCull = gl.isEnabled(gl.CULL_FACE);
      const wasScissor = gl.isEnabled(gl.SCISSOR_TEST);

      gl.disable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.STENCIL_TEST);
      gl.disable(gl.CULL_FACE);
      gl.disable(gl.SCISSOR_TEST);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, w, h, 0);

      gl.useProgram(prog);
      gl.uniform1i(uTex, 0);
      const lrgb = window.__tempLandRgb || [230 / 255, 238 / 255, 242 / 255];
      gl.uniform3f(uLandRgb, lrgb[0], lrgb[1], lrgb[2]);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (wasBlend) gl.enable(gl.BLEND); else gl.disable(gl.BLEND);
      if (wasDepth) gl.enable(gl.DEPTH_TEST); else gl.disable(gl.DEPTH_TEST);
      if (wasStencil) gl.enable(gl.STENCIL_TEST); else gl.disable(gl.STENCIL_TEST);
      if (wasCull) gl.enable(gl.CULL_FACE); else gl.disable(gl.CULL_FACE);
      if (wasScissor) gl.enable(gl.SCISSOR_TEST); else gl.disable(gl.SCISSOR_TEST);
      gl.activeTexture(prevActiveTex);
      gl.bindTexture(gl.TEXTURE_2D, prevTex);
      gl.bindBuffer(gl.ARRAY_BUFFER, prevBuf);
      gl.useProgram(prevProg);
    },
    onRemove(mapInstance, gl) {
      if (tex) gl.deleteTexture(tex);
      if (vbo) gl.deleteBuffer(vbo);
      if (prog) gl.deleteProgram(prog);
    },
  };
}

// ---------- Map Style & Vector Layers ----------
// ---------- Map Style (India Apple Maps Aesthetic + Crisp Borders + Contested + Global Place Labels) ----------
function attachOverlayLayers() {
  const hasOpenMapTiles = Boolean(map.getSource("openmaptiles"));

  if (hasOpenMapTiles) {
    const appleMapLayers = [
      {
        id: "om-water",
        type: "fill",
        "source-layer": "water",
        paint: {
          "fill-color": window.__oceanGradientActive ? "#000000" : (window.__tempOceanColor || "#cbe5f7"),
          "fill-opacity": window.__oceanGradientActive || window.__tempOceanColor ? 1 : 0.94,
        },
      },
      {
        id: "om-waterway",
        type: "line",
        "source-layer": "waterway",
        minzoom: 4.5,
        paint: {
          "line-color": "#5ca3cc",
          "line-width": ["interpolate", ["linear"], ["zoom"], 4.5, 0.7, 9, 1.4, 14, 3.0],
          "line-opacity": 0.85,
        },
      },
      {
        id: "om-park",
        type: "fill",
        "source-layer": "park",
        minzoom: 8.0,
        paint: {
          "fill-color": "#cce3de",
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.45, 11, 0.78],
        },
      },
      {
        id: "om-landcover",
        type: "fill",
        "source-layer": "landcover",
        filter: ["match", ["get", "class"], ["wood", "forest", "grass", "wetland"], true, false],
        minzoom: 8.5,
        paint: {
          "fill-color": "#d5e7e3",
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 8.5, 0.35, 12, 0.6],
        },
      },
      {
        id: "om-road-casing",
        type: "line",
        "source-layer": "transportation",
        filter: ["match", ["get", "class"], ["motorway", "trunk", "primary", "secondary", "tertiary"], true, false],
        minzoom: 6.8,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#bac7cf",
          "line-width": ["interpolate", ["linear"], ["zoom"], 6.8, 1.3, 10, 3.0, 14, 7.2],
        },
      },
      {
        id: "om-road-inner",
        type: "line",
        "source-layer": "transportation",
        filter: ["match", ["get", "class"], ["motorway", "trunk", "primary", "secondary", "tertiary"], true, false],
        minzoom: 6.8,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#ffffff",
          "line-width": ["interpolate", ["linear"], ["zoom"], 6.8, 0.7, 10, 1.9, 14, 5.2],
        },
      },
      {
        id: "om-road-minor",
        type: "line",
        "source-layer": "transportation",
        filter: ["match", ["get", "class"], ["minor", "service"], true, false],
        minzoom: 12.0,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#cfdbe0",
          "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.8, 16, 3.5],
        },
      },
      {
        id: "om-building",
        type: "fill-extrusion",
        "source-layer": "building",
        minzoom: 13.0,
        paint: {
          "fill-extrusion-color": "#d5e0e5",
          "fill-extrusion-height": ["coalesce", ["get", "render_height"], 12],
          "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": ["interpolate", ["linear"], ["zoom"], 13.0, 0.0, 14.5, 0.88],
        },
      },
      // Analogous cool steel borders harmonizing with blue-cyan ocean & glacier-mist land
      {
        id: "om-border-admin",
        type: "line",
        "source-layer": "boundary",
        filter: ["all", ["==", ["get", "admin_level"], 2], ["!=", ["get", "maritime"], 1], ["!=", ["get", "disputed"], 1], ["!", ["has", "claimed_by"]]],
        layout: { "line-cap": "round", "line-join": "round", visibility: state.showCountryBorders ? "visible" : "none" },
        paint: {
          "line-color": "#89a3b8",
          "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.55, 5, 0.9, 10, 1.25],
          "line-opacity": 0.68,
        },
      },
      {
        id: "om-border-sub",
        type: "line",
        "source-layer": "boundary",
        filter: ["all", [">=", ["get", "admin_level"], 3], ["<=", ["get", "admin_level"], 4], ["!=", ["get", "maritime"], 1], ["!=", ["get", "disputed"], 1], ["!", ["has", "claimed_by"]]],
        minzoom: 4.0,
        paint: {
          "line-color": "#a8bece",
          "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.5, 8, 0.95],
          "line-dasharray": [3, 2],
          "line-opacity": 0.5,
        },
      },
      {
        id: "om-border-disputed",
        type: "line",
        "source-layer": "boundary",
        filter: ["all", ["!=", ["get", "maritime"], 1], ["any", ["==", ["get", "disputed"], 1], ["has", "claimed_by"]]],
        layout: { visibility: state.showCountryBorders ? "visible" : "none" },
        paint: {
          "line-color": "#6b859c",
          "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.65, 6, 0.95],
          "line-dasharray": [2.5, 2],
          "line-opacity": 0.64,
        },
      },
    ];
    for (const def of appleMapLayers) {
      if (!map.getLayer(def.id)) {
        map.addLayer({ source: "openmaptiles", ...def });
      }
      if (def.id === "om-water" && !map.getLayer("om-water-gradient")) {
        map.addLayer(createOceanGradientLayer());
      }
    }
  }

  // Global major & regional rivers (Natural Earth) so river basins show clearly at all zoom levels
  if (state.riversGeo && !map.getSource("world-rivers")) {
    map.addSource("world-rivers", { type: "geojson", data: state.riversGeo });
    map.addLayer({
      id: "world-rivers-minor",
      type: "line",
      source: "world-rivers",
      filter: [">", ["get", "scalerank"], 4],
      minzoom: 3.0,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#5ea6cf",
        "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.65, 8, 1.45, 12, 2.2],
        "line-opacity": 0.78,
      },
    });
    map.addLayer({
      id: "world-rivers-major",
      type: "line",
      source: "world-rivers",
      filter: ["<=", ["get", "scalerank"], 4],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#3d8bbd",
        "line-width": ["interpolate", ["linear"], ["zoom"], 1.5, 0.85, 5, 1.5, 10, 2.6],
        "line-opacity": 0.88,
      },
    });
    map.addLayer({
      id: "world-rivers-labels",
      type: "symbol",
      source: "world-rivers",
      filter: ["all", ["!=", ["get", "name"], ""], ["<=", ["get", "scalerank"], 4]],
      minzoom: 4.2,
      layout: {
        "symbol-placement": "line",
        "text-field": ["get", "name"],
        "text-font": ["Noto Sans Italic"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 4.2, 8.8, 8, 10.6],
        "text-letter-spacing": 0.12,
        "symbol-spacing": 380,
      },
      paint: {
        "text-color": "#1e5b85",
        "text-halo-color": "rgba(230, 238, 242, 0.85)",
        "text-halo-width": 0.9,
        "text-halo-blur": 0.4,
      },
    });
  }

  if (state.countriesGeo && !map.getSource("world-countries")) {
    map.addSource("world-countries", { type: "geojson", data: state.countriesGeo });
    map.addLayer({
      id: "countries-fill",
      type: "fill",
      source: "world-countries",
      paint: { "fill-color": "transparent" },
    });
    map.addLayer({
      id: "country-active-line",
      type: "line",
      source: "world-countries",
      filter: ["==", ["get", "iso3"], "__NONE__"],
      paint: { "line-color": "#687078", "line-width": 1.8, "line-opacity": 0.78 },
    });
  }

  if (state.contestedGeo && !map.getSource("contested-areas")) {
    map.addSource("contested-areas", { type: "geojson", data: state.contestedGeo });
    map.addLayer({
      id: "contested-areas-fill",
      type: "fill",
      source: "contested-areas",
      paint: {
        "fill-color": "#dc2626",
        "fill-opacity": 0.04,
      },
    });
    map.addLayer({
      id: "contested-areas-line",
      type: "line",
      source: "contested-areas",
      paint: {
        "line-color": "#b58282",
        "line-width": 0.9,
        "line-dasharray": [3, 2],
        "line-opacity": 0.42,
      },
    });
    map.addLayer({
      id: "contested-areas-label",
      type: "symbol",
      source: "contested-areas",
      minzoom: 3.2,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Noto Sans Italic"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 3.2, 9.5, 8, 12],
        "text-max-width": 8,
      },
      paint: {
        "text-color": "#991b1b",
        "text-halo-color": "rgba(255,255,255,0.9)",
        "text-halo-width": 1.4,
      },
    });
  }

  // Global oceans, countries, states, cities, towns & village labels (Apple Maps style hierarchy)
  if (hasOpenMapTiles) {
    const labelLayers = [
      {
        id: "water-ocean-labels",
        type: "symbol",
        "source-layer": "water_name",
        minzoom: 1.5,
        layout: {
          "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
          "text-font": ["Noto Sans Italic"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 1.5, 11, 5, 14],
          "text-letter-spacing": 0.12,
        },
        paint: {
          "text-color": "#e3f2f8",
          "text-halo-color": "rgba(6, 20, 44, 0.72)",
          "text-halo-width": 0.9,
          "text-halo-blur": 0.5,
        },
      },
      {
        id: "country-labels",
        type: "symbol",
        "source-layer": "place",
        filter: ["==", ["get", "class"], "country"],
        minzoom: 1.6,
        maxzoom: 6.5,
        layout: {
          "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 1.6, 8.8, 3.8, 9.8, 6, 11.4],
          "text-transform": "uppercase",
          "text-letter-spacing": 0.16,
          "text-padding": 10,
        },
        paint: {
          "text-color": "#23394f",
          "text-halo-color": "rgba(230, 238, 242, 0.85)",
          "text-halo-width": 0.9,
          "text-halo-blur": 0.4,
        },
      },
      {
        id: "state-labels",
        type: "symbol",
        "source-layer": "place",
        filter: ["==", ["get", "class"], "state"],
        minzoom: 4.2,
        maxzoom: 8.5,
        layout: {
          "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 4.2, 9.0, 7, 11.2],
          "text-transform": "uppercase",
          "text-letter-spacing": 0.12,
          "text-padding": 12,
        },
        paint: {
          "text-color": "#456078",
          "text-halo-color": "rgba(230, 238, 242, 0.85)",
          "text-halo-width": 0.85,
          "text-halo-blur": 0.4,
        },
      },
      {
        id: "city-dots-tier1",
        type: "circle",
        "source-layer": "place",
        filter: ["all", ["==", ["get", "class"], "city"], ["<=", ["coalesce", ["get", "rank"], 10], 4]],
        minzoom: 3.4,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 3.4, 1.8, 9, 2.8],
          "circle-color": "#1c3044",
          "circle-stroke-width": 0,
        },
      },
      {
        id: "city-labels-tier1",
        type: "symbol",
        "source-layer": "place",
        filter: ["all", ["==", ["get", "class"], "city"], ["<=", ["coalesce", ["get", "rank"], 10], 4]],
        minzoom: 3.4,
        layout: {
          "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 3.4, 10.0, 8, 12.6, 12, 14.0],
          "text-variable-anchor": ["left", "right", "top", "bottom"],
          "text-radial-offset": 0.5,
          "text-padding": 22,
          "symbol-sort-key": ["coalesce", ["get", "rank"], 10],
        },
        paint: {
          "text-color": "#1c3044",
          "text-halo-color": "rgba(230, 238, 242, 0.88)",
          "text-halo-width": 1.0,
          "text-halo-blur": 0.4,
        },
      },
      {
        id: "city-dots-major",
        type: "circle",
        "source-layer": "place",
        filter: ["all", ["==", ["get", "class"], "city"], [">", ["coalesce", ["get", "rank"], 10], 4], ["<=", ["coalesce", ["get", "rank"], 10], 8]],
        minzoom: 5.5,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5.5, 1.6, 10, 2.5],
          "circle-color": "#1c3044",
          "circle-stroke-width": 0,
        },
      },
      {
        id: "city-labels-major",
        type: "symbol",
        "source-layer": "place",
        filter: ["all", ["==", ["get", "class"], "city"], [">", ["coalesce", ["get", "rank"], 10], 4], ["<=", ["coalesce", ["get", "rank"], 10], 8]],
        minzoom: 5.5,
        layout: {
          "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 5.5, 9.8, 9, 12.0, 12, 13.2],
          "text-variable-anchor": ["left", "right", "top", "bottom"],
          "text-radial-offset": 0.45,
          "text-padding": 16,
          "symbol-sort-key": ["coalesce", ["get", "rank"], 10],
        },
        paint: {
          "text-color": "#263c52",
          "text-halo-color": "rgba(230, 238, 242, 0.88)",
          "text-halo-width": 1.0,
          "text-halo-blur": 0.4,
        },
      },
      {
        id: "city-labels-regional",
        type: "symbol",
        "source-layer": "place",
        filter: ["all", ["==", ["get", "class"], "city"], [">", ["coalesce", ["get", "rank"], 10], 8]],
        minzoom: 6.5,
        layout: {
          "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 6.5, 9.6, 11, 11.8],
          "text-padding": 14,
          "symbol-sort-key": ["coalesce", ["get", "rank"], 15],
        },
        paint: {
          "text-color": "#344e66",
          "text-halo-color": "rgba(230, 238, 242, 0.86)",
          "text-halo-width": 0.9,
          "text-halo-blur": 0.4,
        },
      },
      {
        id: "city-labels-towns",
        type: "symbol",
        "source-layer": "place",
        filter: ["==", ["get", "class"], "town"],
        minzoom: 8.2,
        layout: {
          "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 8.2, 9.2, 13, 11.6],
          "text-padding": 12,
          "symbol-sort-key": ["coalesce", ["get", "rank"], 20],
        },
        paint: {
          "text-color": "#3f5970",
          "text-halo-color": "rgba(230, 238, 242, 0.86)",
          "text-halo-width": 0.9,
          "text-halo-blur": 0.4,
        },
      },
      {
        id: "city-labels-localities",
        type: "symbol",
        "source-layer": "place",
        filter: ["match", ["get", "class"], ["village", "suburb", "quarter", "neighbourhood", "hamlet"], true, false],
        minzoom: 10.6,
        layout: {
          "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
          "text-font": ["Noto Sans Italic"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 10.6, 9.0, 14, 11.0],
          "text-padding": 10,
        },
        paint: {
          "text-color": "#4f687d",
          "text-halo-color": "rgba(230, 238, 242, 0.84)",
          "text-halo-width": 0.85,
          "text-halo-blur": 0.4,
        },
      },
    ];
    for (const def of labelLayers) {
      if (!map.getLayer(def.id)) {
        map.addLayer({ source: "openmaptiles", ...def });
      }
    }
  }

  if (state.indiaExtras?.prashad && !map.getSource("prashad-src")) {
    map.addSource("prashad-src", { type: "geojson", data: state.indiaExtras.prashad });
    map.addLayer({
      id: "prashad-points",
      type: "circle",
      source: "prashad-src",
      minzoom: 4,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 3.2, 10, 6.2],
        "circle-color": SITE_COLORS.prashad,
        "circle-stroke-width": 1.4,
        "circle-stroke-color": "#ffffff",
      },
    });
  }

  if (!map.getSource("monuments-vt")) {
    const absUrl = new URL(PMTILES_URL, window.location.href).href;
    map.addSource("monuments-vt", {
      type: "vector",
      url: `pmtiles://${absUrl}`,
      minzoom: 0,
      maxzoom: 8,
      promoteId: "qid",
    });

    map.addLayer({
      id: "monuments-circle",
      type: "circle",
      source: "monuments-vt",
      "source-layer": "monuments",
      layout: {
        "circle-sort-key": ["coalesce", ["get", "sk"], 1],
      },
      paint: {
        "circle-radius": 4.0,
        "circle-color": getCircleColorExpression(),
        "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 1, 0.32, 10, 0.5],
        "circle-stroke-color": "rgba(15, 23, 42, 0.65)",
        "circle-opacity": 0.94,
      },
    });
  }

  // Hover highlight halo ring (magnetic hover snap feedback matching India Atlas)
  if (!map.getSource("hovered-site")) {
    map.addSource("hovered-site", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    map.addLayer({
      id: "hovered-site-halo",
      type: "circle",
      source: "hovered-site",
      paint: {
        "circle-radius": 11,
        "circle-color": "rgba(0, 122, 255, 0.14)",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#007aff",
      },
    });
  }

  // Selected halo ring + crisp dot core matching India Atlas
  if (!map.getSource("selected-site")) {
    map.addSource("selected-site", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    map.addLayer({
      id: "selected-site-halo",
      type: "circle",
      source: "selected-site",
      paint: {
        "circle-radius": 14,
        "circle-color": "rgba(24, 25, 26, 0.12)",
        "circle-stroke-width": 2.2,
        "circle-stroke-color": "#18191a",
      },
    });
    map.addLayer({
      id: "selected-site-core",
      type: "circle",
      source: "selected-site",
      paint: {
        "circle-radius": 6,
        "circle-color": "#18191a",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });
  }

  bindMapInteractions();
  applyFilters();
}

let mapInteractionsBound = false;
function bindMapInteractions() {
  if (mapInteractionsBound) return;
  mapInteractionsBound = true;

  // Reject pointer or projected coordinates that lie in empty space outside the globe silhouette
  const isPointOnGlobe = (point) => {
    if (!point || Number.isNaN(point.x) || Number.isNaN(point.y)) return false;
    if (map.getProjection?.()?.type !== "globe") return true;
    try {
      const lngLat = map.unproject(point);
      if (!lngLat || Number.isNaN(lngLat.lng) || Number.isNaN(lngLat.lat)) return false;
      const reproj = map.project(lngLat);
      return Math.hypot(reproj.x - point.x, reproj.y - point.y) <= 2.5;
    } catch {
      return false;
    }
  };

  // Magnetic snap query: checks active visible dots and picks closest Euclidean hit
  const findSnapFeature = (point) => {
    if (!isPointOnGlobe(point)) return null;
    const layers = ["prashad-points", "monuments-uncovered-excl", "monuments-circle"].filter((l) => map.getLayer(l));
    if (!layers.length) return null;
    for (const r of [14, 18]) {
      const hits = map.queryRenderedFeatures(
        [
          [point.x - r, point.y - r],
          [point.x + r, point.y + r],
        ],
        { layers }
      );
      if (hits.length) {
        let best = null;
        let bestDist = Infinity;
        for (const f of hits) {
          const coords = f.geometry?.coordinates;
          if (!Array.isArray(coords) || coords.length < 2) continue;
          const sp = map.project(coords);
          if (!isPointOnGlobe(sp)) continue;
          const d = Math.hypot(sp.x - point.x, sp.y - point.y);
          if (d > 20) continue;
          const layerBonus = f.layer.id === "prashad-points" ? -1.5 : 0;
          if (d + layerBonus < bestDist) {
            bestDist = d + layerBonus;
            best = { feat: f, screenPoint: sp, coords: coords.slice(0, 2) };
          }
        }
        if (best) return best;
      }
    }
    return null;
  };

  let lastHoverKey = "";
  const clearHover = () => {
    map.getCanvas().style.cursor = "";
    elTooltip.classList.add("hidden");
    elTooltip.dataset.hoverKey = "";
    const src = map.getSource("hovered-site");
    if (src && lastHoverKey) src.setData({ type: "FeatureCollection", features: [] });
    lastHoverKey = "";
  };

  map.on("mousemove", (ev) => {
    if (!isPointOnGlobe(ev.point)) {
      clearHover();
      return;
    }
    const hit = findSnapFeature(ev.point);
    if (hit) {
      map.getCanvas().style.cursor = "pointer";
      const f = hit.feat;
      const p = normalizeTileProps(f.properties);
      const hoverKey = `${p.qid || p.name}:${hit.coords[0].toFixed(4)},${hit.coords[1].toFixed(4)}`;
      if (hoverKey !== lastHoverKey) {
        lastHoverKey = hoverKey;
        const src = map.getSource("hovered-site");
        if (src) {
          src.setData({
            type: "FeatureCollection",
            features: [{ type: "Feature", geometry: { type: "Point", coordinates: hit.coords }, properties: {} }],
          });
        }
      }
      const badge =
        p.unescoDanger
          ? "UNESCO In Danger"
          : p.unesco
            ? "UNESCO World Heritage"
            : p.isMostVisited
              ? "Most Visited"
              : p.inRestoration
                ? "Endangered"
                : p.coverageStatus === "uncovered"
                  ? "! Uncovered"
                  : p.siteType;
      const imgUrl = p.image || (f.properties && f.properties.imgU) || "";
      const thumbSrc = imgUrl ? thumbUrl(imgUrl) : "";
      const imgHtml = thumbSrc
        ? `<div class="tooltip-img-wrap is-loading"><img class="tooltip-img" src="${escapeHtml(thumbSrc)}" alt="" loading="eager" /></div>`
        : "";
      showTooltip(
        hit.screenPoint,
        `${imgHtml}<div class="tooltip-title">${escapeHtml(p.name)}</div>
         <div class="tooltip-meta">${escapeHtml([p.country || p.region, badge].filter(Boolean).join(" · "))}</div>`,
        hoverKey
      );
      return;
    }

    const src = map.getSource("hovered-site");
    if (src && lastHoverKey) {
      src.setData({ type: "FeatureCollection", features: [] });
      lastHoverKey = "";
    }

    if (map.getLayer("contested-areas-fill")) {
      const ctHits = map.queryRenderedFeatures(ev.point, { layers: ["contested-areas-fill"] });
      if (ctHits.length) {
        map.getCanvas().style.cursor = "help";
        const cp = ctHits[0].properties || {};
        showTooltip(
          ev.point,
          `<div class="tooltip-title" style="color:#991b1b;">Contested Territory: ${escapeHtml(cp.name)}</div>
           <div class="tooltip-meta">${escapeHtml(cp.note || cp.admin || "Disputed sovereignty boundary")}</div>`
        );
        return;
      }
    }

    clearHover();
  });

  map.getCanvas().addEventListener("mouseleave", clearHover);

  map.on("click", (ev) => {
    const hit = findSnapFeature(ev.point);
    if (!hit) return;
    elTooltip.classList.add("hidden");
    // Open detail panel cleanly WITHOUT zooming/panning the map camera
    openMonumentFromCoords(hit.feat.properties, hit.coords, false);
  });

  let atlasTilesReady = false;
  let atlasDataReady = false;
  let bootDismissed = false;
  const dismissAtlasBootSkeleton = () => {
    if (bootDismissed || !atlasTilesReady || !atlasDataReady) return;
    bootDismissed = true;
    const legendWrap = document.getElementById("legend-bar-wrap");
    if (legendWrap) legendWrap.classList.remove("is-boot-loading");
    const skel = document.getElementById("atlas-boot-skeleton");
    if (skel) {
      skel.classList.add("is-hidden");
      setTimeout(() => skel.remove(), 380);
    }
  };
  setTimeout(() => {
    atlasTilesReady = true;
    atlasDataReady = true;
    dismissAtlasBootSkeleton();
  }, 6500);

  map.on("moveend", schedulePhotoPins);
  map.on("sourcedata", (ev) => {
    if (ev.sourceId === "monuments-vt" && ev.isSourceLoaded) {
      schedulePhotoPins();
      atlasTilesReady = true;
      dismissAtlasBootSkeleton();
    }
  });
  map.once("idle", () => {
    atlasTilesReady = true;
    dismissAtlasBootSkeleton();
  });
  window.__markAtlasDataReady = () => {
    atlasDataReady = true;
    dismissAtlasBootSkeleton();
  };
}

// ---------- Country & Legend Filtering ----------
async function selectCountryFilter(iso3) {
  state.activeCountry = iso3 || "";
  state.activeRegion = "";
  elCountry.value = state.activeCountry;
  syncCustomSelect(elCountry);

  if (!state.activeCountry) {
    elRegionGroup.classList.add("hidden");
    elRegion.innerHTML = `<option value="">All Regions</option>`;
    syncCustomSelect(elRegion);
    applyFilters();
    renderCoveragePanel();
    centerWorld(true);
    return;
  }

  const cMeta = state.worldSummary?.countries?.find((c) => c.iso3 === state.activeCountry);
  if (cMeta?.bbox) fitBbox(cMeta.bbox, true);

  applyFilters();
  const shard = await ensureCountryShard(state.activeCountry);
  const regions = [...new Set(shard.map((x) => x.region || x.state).filter(Boolean))].sort();
  if (regions.length > 1) {
    elRegion.innerHTML = `<option value="">All Regions (${regions.length})</option>` +
      regions.map((r) => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join("");
    elRegionGroup.classList.remove("hidden");
    enhanceSelect(elRegion, { searchable: regions.length > 12 });
    syncCustomSelect(elRegion);
  } else {
    elRegionGroup.classList.add("hidden");
  }
  applyFilters();
  renderCoveragePanel();
}

function setActiveFilter(filterKey) {
  if (filterKey === "all") {
    state.activeFilters = [];
  } else if (LEGEND_FILTER_SPEC[filterKey]) {
    const idx = state.activeFilters.indexOf(filterKey);
    if (idx >= 0) {
      state.activeFilters = state.activeFilters.filter((k) => k !== filterKey);
    } else {
      state.activeFilters = [...state.activeFilters, filterKey];
    }
  }
  const isAll = state.activeFilters.length === 0;
  document.querySelectorAll("#legend-bar .legend-btn").forEach((btn) => {
    const key = btn.dataset.legendFilter;
    const isAct = key === "all" ? isAll : state.activeFilters.includes(key);
    btn.classList.toggle("active", isAct);
    btn.setAttribute("aria-pressed", String(isAct));
  });
  applyFilters();
}

// ---------- Global Search (Instant Index + Loaded Shards + Live Wikidata) ----------
function closeSearchDropdown() {
  elSearchDropdown.classList.add("hidden");
  elSearch.setAttribute("aria-expanded", "false");
}

function openSearchDock() {
  elSearchToggleBtn.classList.add("hidden");
  elSearchWrap.classList.remove("hidden");
  elSearchToggleBtn.setAttribute("aria-expanded", "true");
  elSearch.focus();
  renderSearchDropdown();
}

function closeSearchDock(clearQuery = false) {
  closeSearchDropdown();
  if (clearQuery) {
    elSearch.value = "";
    state.searchQuery = "";
  }
  elSearchWrap.classList.add("hidden");
  elSearchToggleBtn.classList.remove("hidden");
  elSearchToggleBtn.setAttribute("aria-expanded", "false");
}

function getLocalSearchMatches(q) {
  const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return state.searchTop.filter((s) => !/\bauschwitz\b/i.test(s.name || "")).slice(0, 10);

  const pool = [];
  const seen = new Set();
  if (state.activeCountry && state.countryShards[state.activeCountry]) {
    for (const s of state.countryShards[state.activeCountry]) {
      seen.add(s.qid);
      pool.push(s);
    }
  }
  for (const s of state.searchTop) {
    if (!seen.has(s.qid)) pool.push(s);
  }

  const hits = [];
  for (const s of pool) {
    if (state.activeCountry && s.countryIso !== state.activeCountry) continue;
    const hay = `${s.name} ${s.country} ${s.region || ""} ${s.unesco || ""} ${s.siteType || ""} ${s.registryCode || ""} ${s.asiId || ""}`.toLowerCase();
    if (terms.every((t) => hay.includes(t))) {
      hits.push(s);
      if (hits.length >= 14) break;
    }
  }
  return hits;
}

function renderSearchDropdown() {
  const q = elSearch.value.trim();
  const hits = getLocalSearchMatches(q);
  if (!hits.length && q.length >= 3) {
    elSearchDropdown.innerHTML = `<div class="search-empty">Searching Wikidata worldwide for "${escapeHtml(q)}"…</div>`;
    elSearchDropdown.classList.remove("hidden");
    elSearch.setAttribute("aria-expanded", "true");
    queryRemoteWikidataSearch(q);
    return;
  }
  if (!hits.length) {
    elSearchDropdown.innerHTML = `<div class="search-empty">No matching monuments found.</div>`;
    elSearchDropdown.classList.remove("hidden");
    return;
  }
  elSearchDropdown.innerHTML = hits
    .map(
      (h, idx) => `
      <button type="button" class="search-option" role="option" data-search-idx="${idx}">
        <i class="dot" style="background:${SITE_COLORS[h.cat] || SITE_COLORS.national}; flex-shrink:0;"></i>
        <span class="search-opt-main">
          <span class="search-opt-name">${escapeHtml(h.name)}</span>
          <span class="search-opt-sub">${escapeHtml([h.region, h.country, h.unesco ? "UNESCO" : h.siteType].filter(Boolean).join(" · "))}</span>
        </span>
      </button>`
    )
    .join("");
  elSearchDropdown.classList.remove("hidden");
  elSearch.setAttribute("aria-expanded", "true");

  elSearchDropdown.querySelectorAll(".search-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = hits[Number(btn.dataset.searchIdx)];
      if (!target) return;
      closeSearchDock(false);
      openMonumentFromCoords(target, target.coords, true);
    });
  });
}

async function queryRemoteWikidataSearch(query) {
  if (state.remoteSearchCache[query]) return;
  state.remoteSearchCache[query] = true;
  try {
    const res = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&limit=6&format=json&origin=*`
    );
    if (!res.ok) return;
    const data = await res.json();
    const ids = (data.search || []).map((x) => x.id).filter(Boolean);
    if (!ids.length || elSearch.value.trim() !== query) return;
    const entRes = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.join("|")}&props=labels|descriptions|claims|sitelinks&languages=en&format=json&origin=*`
    );
    const entData = await entRes.json();
    const remoteBuiltRe = /\b(palace|castle|fort|fortress|citadel|temple|mosque|church|cathedral|abbey|monastery|chapel|shrine|synagogue|stupa|pagoda|mausoleum|tomb|pyramid|amphitheatre|theater|theatre|bridge|aqueduct|viaduct|tower|lighthouse|arch|gate|monument|memorial|statue|ruins|archaeological|villa|mansion|hall|museum|library)\b/i;
    const remoteNaturalRe = /\b(national park|biosphere|nature reserve|wildlife|wilderness|archipelago|islands?|volcano|mountain|glacier|river|lake|waterfall|canyon|gorge|reef|forest|valley|atoll|fjord|wetland|botanic)\b/i;
    const remoteHits = [];
    for (const qid of ids) {
      const ent = entData.entities?.[qid];
      const coord = ent?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
      if (!coord || coord.latitude === undefined || coord.longitude === undefined) continue;
      const nm = ent.labels?.en?.value || qid;
      const desc = ent.descriptions?.en?.value || "";
      const hay = `${nm} ${desc}`;
      if (remoteNaturalRe.test(hay) && !remoteBuiltRe.test(hay)) continue;
      if (!remoteBuiltRe.test(hay) && !ent.claims?.P1435 && !ent.claims?.P149 && !ent.claims?.P84) continue;
      remoteHits.push({
        qid,
        name: nm,
        coords: [coord.longitude, coord.latitude],
        country: "",
        siteType: desc || "Built Monument",
        wikipedia: ent.sitelinks?.enwiki?.title ? `https://en.wikipedia.org/wiki/${encodeURIComponent(ent.sitelinks.enwiki.title)}` : "",
        cat: "national",
      });
    }
    if (elSearch.value.trim() !== query) return;
    if (!remoteHits.length) {
      elSearchDropdown.innerHTML = `<div class="search-empty">No geolocated heritage sites found for "${escapeHtml(query)}".</div>`;
      return;
    }
    elSearchDropdown.innerHTML = remoteHits
      .map(
        (h, idx) => `
        <button type="button" class="search-option" role="option" data-ridx="${idx}">
          <i class="dot" style="background:${SITE_COLORS.national}; flex-shrink:0;"></i>
          <span class="search-opt-main">
            <span class="search-opt-name">${escapeHtml(h.name)}</span>
            <span class="search-opt-sub">${escapeHtml(h.siteType)} · Wikidata Live</span>
          </span>
        </button>`
      )
      .join("");
    elSearchDropdown.querySelectorAll(".search-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = remoteHits[Number(btn.dataset.ridx)];
        if (!target) return;
        closeSearchDock(false);
        openMonumentFromCoords(target, target.coords, true);
      });
    });
  } catch {
    // ignore
  }
}

// ---------- Initialization & Controls ----------
async function init() {
  const [summary, countriesGeo, unescoWorld, searchTop, contestedGeo, indiaExtras, riversGeo, globalFunding] = await preloadDataPromise;
  state.worldSummary = summary;
  state.countriesGeo = countriesGeo;
  state.unescoWorld = unescoWorld || {};
  state.searchTop = searchTop || [];
  state.contestedGeo = contestedGeo;
  state.indiaExtras = indiaExtras;
  state.riversGeo = riversGeo;
  state.globalFunding = globalFunding || { countries: {}, sites: {}, unescoGrants: {} };

  const nameMap = {};
  for (const c of summary?.countries || []) {
    nameMap[c.name.toLowerCase()] = c.iso3;
  }
  for (const [iso3, cf] of Object.entries(state.globalFunding.countries || {})) {
    if (cf.country) nameMap[cf.country.toLowerCase()] = iso3;
  }
  state.countryNameToIso = nameMap;

  const sovCountries = summary.countries.filter((c) => c.isSovereign !== false);
  const depTerritories = summary.countries.filter((c) => c.isSovereign === false);

  elCountry.innerHTML =
    `<option value="">All ${sovCountries.length} Countries (+${depTerritories.length} Territories)</option>` +
    sovCountries
      .map((c) => {
        const fl = flagForIso3(c.iso3);
        return `<option value="${escapeHtml(c.iso3)}">${fl ? `${fl} ` : ""}${escapeHtml(c.name)} (${c.total.toLocaleString()})</option>`;
      })
      .join("") +
    depTerritories
      .map((c) => {
        const fl = flagForIso3(c.iso3);
        return `<option value="${escapeHtml(c.iso3)}">${fl ? `${fl} ` : ""}${escapeHtml(c.name)} · Territory (${c.total.toLocaleString()})</option>`;
      })
      .join("");
  enhanceSelect(elCountry, { searchable: true });
  enhanceSelect(elRegion);
  if (elEraSelect) enhanceSelect(elEraSelect);
  if (elDesignationSelect) enhanceSelect(elDesignationSelect);

  updateCounterDisplay();
  renderCoveragePanel();

  const onReady = () => {
    attachOverlayLayers();
    if (typeof window.__markAtlasDataReady === "function") window.__markAtlasDataReady();
    const urlCountry = new URLSearchParams(window.location.search).get("country");
    if (urlCountry && summary.countries.some((c) => c.iso3 === urlCountry.toUpperCase())) {
      selectCountryFilter(urlCountry.toUpperCase());
    }
  };

  if (map.isStyleLoaded()) onReady();
  else map.once("load", onReady);
}

setTimeout(() => {
  const lbl = document.getElementById("boot-center-label");
  if (lbl) lbl.textContent = "Gathering public records…";
}, 650);

init();

elCountry.addEventListener("change", () => selectCountryFilter(elCountry.value));
elRegion.addEventListener("change", () => {
  state.activeRegion = elRegion.value;
  applyFilters();
});
if (elEraSelect) {
  elEraSelect.addEventListener("change", () => {
    state.activeEra = elEraSelect.value || "all";
    applyFilters();
  });
}
if (elDesignationSelect) {
  elDesignationSelect.addEventListener("change", () => {
    state.activeDesignation = elDesignationSelect.value || "all";
    applyFilters();
  });
}
elToggleCountryBorders.addEventListener("change", () => {
  state.showCountryBorders = elToggleCountryBorders.checked;
  ["countries-line", "om-border-admin", "om-border-sub", "om-border-disputed"].forEach((id) => {
    if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", state.showCountryBorders ? "visible" : "none");
  });
});
if (elToggleContested) {
  elToggleContested.addEventListener("change", () => {
    state.contestedOnly = elToggleContested.checked;
    applyFilters();
  });
}

document.querySelectorAll("#legend-bar .legend-btn").forEach((btn) => {
  btn.addEventListener("click", () => setActiveFilter(btn.dataset.legendFilter));
});

const legendTrack = document.getElementById("legend-bar");
const legendWrap = document.getElementById("legend-bar-wrap");
const legendLeftBtn = document.getElementById("legend-scroll-left");
const legendRightBtn = document.getElementById("legend-scroll-hint");
if (legendTrack && legendWrap) {
  const updateLegendEnds = () => {
    const atStart = legendTrack.scrollLeft <= 4;
    const atEnd = legendTrack.scrollLeft + legendTrack.clientWidth >= legendTrack.scrollWidth - 4;
    legendWrap.classList.toggle("scrolled-start", atStart);
    legendWrap.classList.toggle("scrolled-end", atEnd);
  };
  if (legendRightBtn) legendRightBtn.addEventListener("click", () => legendTrack.scrollBy({ left: 160, behavior: "smooth" }));
  if (legendLeftBtn) legendLeftBtn.addEventListener("click", () => legendTrack.scrollBy({ left: -160, behavior: "smooth" }));
  legendTrack.addEventListener("scroll", updateLegendEnds, { passive: true });
  window.addEventListener("resize", updateLegendEnds);
  updateLegendEnds();
}

elToggleFiltersBtn.addEventListener("click", () => {
  const hidden = elFiltersDrawer.classList.toggle("hidden");
  elToggleFiltersBtn.setAttribute("aria-expanded", String(!hidden));
});

document.getElementById("collapse-sidebar-btn").addEventListener("click", () => {
  elLeftPanel.classList.add("collapsed");
  document.body.classList.add("sidebar-collapsed");
  elReopenSidebar.classList.remove("hidden");
  map.easeTo({ padding: getGlobePadding(), duration: 280 });
});
elReopenSidebar.addEventListener("click", () => {
  elLeftPanel.classList.remove("collapsed");
  document.body.classList.remove("sidebar-collapsed");
  elReopenSidebar.classList.add("hidden");
  map.easeTo({ padding: getGlobePadding(), duration: 280 });
});

document.getElementById("close-drawer").addEventListener("click", closeDetailDrawer);

elSearchToggleBtn.addEventListener("click", openSearchDock);
elSearchCloseBtn.addEventListener("click", () => closeSearchDock(true));
elSearch.addEventListener("input", renderSearchDropdown);
elSearch.addEventListener("focus", renderSearchDropdown);
document.addEventListener("click", (ev) => {
  if (!elSearchDock.contains(ev.target)) closeSearchDropdown();
});

document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") {
    closeSearchDock(false);
    closeDetailDrawer();
  } else if (
    ev.key === "ArrowLeft" &&
    !elDrawer.classList.contains("hidden") &&
    document.activeElement !== elSearch &&
    document.activeElement.tagName !== "TEXTAREA"
  ) {
    if (state.nearbyNav?.list?.length > 1) navigateNearby(-1);
    else if (state.carouselHandler) state.carouselHandler(-1);
  } else if (
    ev.key === "ArrowRight" &&
    !elDrawer.classList.contains("hidden") &&
    document.activeElement !== elSearch &&
    document.activeElement.tagName !== "TEXTAREA"
  ) {
    if (state.nearbyNav?.list?.length > 1) navigateNearby(1);
    else if (state.carouselHandler) state.carouselHandler(1);
  } else if (ev.key === "/" && document.activeElement !== elSearch && document.activeElement.tagName !== "TEXTAREA") {
    ev.preventDefault();
    openSearchDock();
  }
});

// Swipe gestures for nearby site navigation (mobile touch + desktop horizontal wheel)
{
  let touchX0 = null;
  let touchY0 = null;
  let swipingCard = false;
  let touchBlocked = false;
  const resetDrag = () => {
    elDrawer.style.transition = "";
    elDrawer.style.transform = "";
    elDrawer.style.opacity = "";
    touchX0 = touchY0 = null;
    swipingCard = touchBlocked = false;
  };
  elDrawer.addEventListener("touchstart", (ev) => {
    if (!state.nearbyNav || state.nearbyNav.list.length < 2 || ev.touches.length !== 1) return;
    const multiPhoto = Boolean(elDrawer.querySelector(".carousel-thumbs"));
    touchBlocked = Boolean(ev.target.closest(".carousel-thumbs, select, input, textarea") || (multiPhoto && ev.target.closest("#carousel-stage")));
    touchX0 = ev.touches[0].clientX;
    touchY0 = ev.touches[0].clientY;
    swipingCard = false;
  }, { passive: true });
  elDrawer.addEventListener("touchmove", (ev) => {
    if (touchBlocked || touchX0 === null || touchY0 === null || ev.touches.length !== 1) return;
    const dx = ev.touches[0].clientX - touchX0;
    const dy = ev.touches[0].clientY - touchY0;
    if (!swipingCard) {
      if (Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        swipingCard = true;
        elDrawer.style.transition = "none";
      } else if (Math.abs(dy) > 16) {
        touchBlocked = true;
        return;
      }
    }
    if (swipingCard) {
      if (ev.cancelable) ev.preventDefault();
      const dragX = Math.max(-140, Math.min(140, dx * 0.65));
      elDrawer.style.transform = `translateX(${dragX.toFixed(1)}px) rotate(${((dragX / 140) * 2.2).toFixed(2)}deg)`;
      elDrawer.style.opacity = String(Math.max(0.72, 1 - Math.abs(dragX) / 420));
    }
  }, { passive: false });
  elDrawer.addEventListener("touchend", (ev) => {
    if (touchBlocked || touchX0 === null || touchY0 === null || !ev.changedTouches.length) return resetDrag();
    const dx = ev.changedTouches[0].clientX - touchX0;
    const dy = ev.changedTouches[0].clientY - touchY0;
    if (Math.abs(dx) >= 56 && Math.abs(dx) > Math.abs(dy) * 1.15) {
      resetDrag();
      navigateNearby(dx < 0 ? 1 : -1);
    } else resetDrag();
  }, { passive: true });
  elDrawer.addEventListener("touchcancel", resetDrag, { passive: true });

  let lastWheelAt = 0;
  elDrawer.addEventListener("wheel", (ev) => {
    if (!state.nearbyNav || state.nearbyNav.list.length < 2) return;
    if (Math.abs(ev.deltaX) > 40 && Math.abs(ev.deltaX) > Math.abs(ev.deltaY) * 1.8) {
      if (ev.target.closest("#carousel-stage, .carousel-thumbs")) return;
      ev.preventDefault();
      const now = Date.now();
      if (now - lastWheelAt < 460) return;
      lastWheelAt = now;
      navigateNearby(ev.deltaX > 0 ? 1 : -1);
    }
  }, { passive: false });
}

