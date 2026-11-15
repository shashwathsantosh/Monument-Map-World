// Architecture Monument Atlas — PMTiles Vector Tiles, Global Chronology & Conservation Explorer

const PMTILES_URL = "data/monuments.pmtiles?v=20261114h";
const REPORTS_KEY = "architecture_monument_atlas_reports_v1";

const SITE_COLORS = {
  unesco: "#ff9500",
  mostvisited: "#007aff",
  funded: "#34c759",
  prashad: "#af52de",
  restoration: "#af52de",
  underfunded: "#ff3b30",
  uncovered: "#64748b",
  contested: "#dc2626",
  national: "#5a6572",
  flagged: "#dc2626",
};

const ERA_LABELS = {
  all: "All Eras",
  anc: "Ancient (<500 CE)",
  med: "Medieval (500–1499)",
  ear: "Early Modern (1500–1799)",
  mod: "Modern (1800+)",
  unk: "Undated",
};

const CURRENCY_RATES = {
  USD: { symbol: "$", perInr: 1 / 84.5, unitCr: "M", crToUnit: 0.1183, lakhToUnit: 1183.4 },
  INR: { symbol: "₹", perInr: 1, unitCr: "Cr", crToUnit: 1, lakhToUnit: 1 },
  EUR: { symbol: "€", perInr: 1 / 91.5, unitCr: "M", crToUnit: 0.1093, lakhToUnit: 1092.9 },
  GBP: { symbol: "£", perInr: 1 / 108.0, unitCr: "M", crToUnit: 0.0926, lakhToUnit: 925.9 },
};

const HISTORY_CUE_RE =
  /(built|construct|erect|found|establish|commission|reign|dynasty|king|emperor|queen|sultan|ruler|empire|temple|palace|fort|battle|siege|century|historic|unesco|heritage|carved|designed|architect|monastery|mosque|cathedral|ancient|excavat)/i;

const state = {
  currency: "USD",
  worldSummary: null,
  countriesGeo: null,
  contestedGeo: null,
  riversGeo: null,
  unescoWorld: {},
  searchTop: [],
  indiaExtras: null,
  countryShards: {},
  countryShardPromises: {},
  reports: loadReports(),
  activeCountry: "",
  activeRegion: "",
  activeFilter: "all",
  activeEra: "all",
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
  fetch("data/world-summary.json").then((r) => r.json()),
  fetch("data/world-countries.geojson").then((r) => r.json()),
  fetch("data/unesco-world.json").then((r) => r.json()),
  fetch("data/search-top.json").then((r) => r.json()),
  fetch("data/contested-areas.geojson").then((r) => r.json()).catch(() => null),
  fetch("data/india-extras.json").then((r) => r.json()).catch(() => null),
  fetch("data/world-rivers.geojson").then((r) => r.json()).catch(() => null),
]);

const plateStyle = {
  version: 8,
  projection: { type: "globe" },
  sky: {
    "sky-color": "#d6ecfb",
    "sky-horizon-blend": 0.45,
    "horizon-color": "#eef6fc",
    "horizon-fog-blend": 0.4,
    "fog-color": "#eef6fc",
    "fog-ground-blend": 0.6,
    "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.85, 5, 0.45, 7, 0],
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
      paint: { "background-color": "#f2f1ec" },
    },
  ],
};

function formatMoneyCr(crVal, compact = false) {
  if (crVal === null || crVal === undefined || Number.isNaN(crVal)) return "—";
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
  if (lakhVal === null || lakhVal === undefined || Number.isNaN(lakhVal)) return "—";
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

function loadReports() {
  try {
    return JSON.parse(localStorage.getItem(REPORTS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveReports() {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(state.reports));
}

function escapeHtml(str) {
  return String(str || "")
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
  padding: window.innerWidth <= 900 ? { top: 44, bottom: 56, left: 16, right: 16 } : { top: 46, bottom: 54, left: 260, right: 24 },
  renderWorldCopies: false,
  attributionControl: false,
});

map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), "bottom-right");

const elCountry = document.getElementById("country-select");
const elRegionGroup = document.getElementById("region-filter-group");
const elRegion = document.getElementById("region-select");
const elTogglePhotos = document.getElementById("toggle-photos");
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

function centerWorld(animate = true) {
  map.easeTo({
    center: [22, 18],
    zoom: window.innerWidth <= 760 ? 1.65 : 2.35,
    bearing: 0,
    pitch: 0,
    padding: getGlobePadding(),
    duration: animate ? 650 : 0,
  });
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
  const prom = fetch(`data/countries/${encodeURIComponent(iso3)}.json`)
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
    annualVisitors: raw.vis ? Number(raw.vis) : raw.annualVisitors ?? (raw.footfallLakhs ? Math.round(Number(raw.footfallLakhs) * 100000) : null),
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

function matchesCurrentFilter(item) {
  if (state.activeCountry && (item.countryIso || item.cIso) !== state.activeCountry) return false;
  if (state.activeRegion && (item.region || item.reg || item.state || "") !== state.activeRegion) return false;
  if (state.activeEra && state.activeEra !== "all" && (item.era || "unk") !== state.activeEra) return false;
  const imgUrl = item.image || item.imgUrl || item.imgU || item.imgF;
  if (state.photosOnly && !(imgUrl || item.img === 1)) return false;
  if (state.contestedOnly && !(item.ct === 1 || item.contested)) return false;
  const f = state.activeFilter;
  if (f === "all") return true;
  if (f === "unesco") return Boolean(item.unesco || item.unName || item.un === 1);
  if (f === "restoration") return Boolean(item.inRestoration || item.rest === 1 || item.unescoDanger || item.danger === 1);
  if (f === "mostvisited") return Boolean(item.isMostVisited || item.mv === 1);
  if (f === "funded") return Boolean((item.hasFunding || item.fund === 1) && !(item.underfunded || item.uf === 1));
  if (f === "underfunded") return Boolean(item.underfunded || item.uf === 1);
  if (f === "uncovered") return (item.coverageStatus === "uncovered" || item.uncov === 1);
  if (f === "contested") return Boolean(item.ct === 1 || item.contested);
  if (f === "national") return (item.cat === "national") || (!(item.unesco || item.unName || item.un === 1) && !(item.hasFunding || item.fund === 1) && !(item.inRestoration || item.rest === 1) && !(item.isMostVisited || item.mv === 1) && !(item.underfunded || item.uf === 1) && !(item.coverageStatus === "uncovered" || item.uncov === 1));
  return true;
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
      ? { w: 40, h: 30, labelW: 92 }
      : zoom < 6.8
      ? { w: 48, h: 35, labelW: 108 }
      : { w: 56, h: 40, labelW: 122 };

  const bounds = map.getBounds();
  const maxPins = zoom < 4.5 ? 7 : zoom < 7 ? 11 : 15;
  const minPixelDist = zoom < 5 ? 112 : 84;
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
    if (!coords || !bounds.contains(coords)) continue;
    if (!matchesCurrentFilter(p)) continue;
    candidates.push({
      qid: p.qid,
      coords,
      img,
      props: p,
      score: (p.un ? 300 : 0) + (p.mv ? 150 : 0) + (p.pr || 0),
    });
  }

  // 2) Supplement from searchTop if zoom is low or rendered set is small
  if (candidates.length < maxPins && state.searchTop.length) {
    for (const item of state.searchTop) {
      if (!item.image || seen.has(item.qid) || photoPinState.failedImgs.has(item.image)) continue;
      if (!bounds.contains(item.coords)) continue;
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
    if (chosenPts.some((q) => Math.hypot(q.x - px.x, q.y - px.y) < minPixelDist)) continue;
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
    const tint = p.unesco
      ? SITE_COLORS.unesco
      : p.inRestoration
      ? SITE_COLORS.restoration
      : p.contested
      ? SITE_COLORS.contested
      : p.isMostVisited
      ? SITE_COLORS.mostvisited
      : SITE_COLORS.funded;
    el.className = "photo-pin";
    el.style.setProperty("--pin-accent", tint);
    el.style.setProperty("--pin-w", `${sizeTier.w}px`);
    el.style.setProperty("--pin-h", `${sizeTier.h}px`);
    el.style.setProperty("--pin-label-w", `${sizeTier.labelW}px`);
    el.setAttribute("aria-label", `${p.name} — ${p.country || ""}`);

    const frame = document.createElement("div");
    frame.className = `photo-pin-frame${p.unesco ? " is-unesco" : p.isMostVisited ? " is-ticketed" : ""}`;
    const img = document.createElement("img");
    img.loading = "eager";
    img.decoding = "async";
    img.alt = p.name;
    const thumbSrc = pinThumbUrl(c.img);
    img.addEventListener("load", () => img.classList.add("loaded"));
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

  const f = state.activeFilter;
  if (f === "unesco") conds.push(["==", ["get", "un"], 1]);
  else if (f === "restoration") conds.push(["any", ["==", ["get", "rest"], 1], ["==", ["get", "danger"], 1]]);
  else if (f === "mostvisited") conds.push(["==", ["get", "mv"], 1]);
  else if (f === "funded") conds.push(["all", ["==", ["get", "fund"], 1], ["==", ["get", "uf"], 0]]);
  else if (f === "underfunded") conds.push(["==", ["get", "uf"], 1]);
  else if (f === "uncovered") conds.push(["==", ["get", "uncov"], 1]);
  else if (f === "contested") conds.push(["==", ["get", "ct"], 1]);
  else if (f === "national") conds.push(["==", ["get", "cat"], "national"]);

  return conds.length === 1 ? null : conds;
}

function updateCounterDisplay() {
  if (!state.worldSummary) return;
  const eraSuffix = state.activeEra && state.activeEra !== "all" ? ` · ${ERA_LABELS[state.activeEra] || state.activeEra}` : "";
  if (state.activeCountry) {
    const cMeta = state.worldSummary.countries.find((c) => c.iso3 === state.activeCountry);
    const shard = state.countryShards[state.activeCountry];
    const items = shard || [];
    const matching = items.length ? items.filter((item) => matchesCurrentFilter(item)).length : cMeta?.total || 0;
    const countryName = cMeta ? cMeta.name : state.activeCountry;
    elCount.textContent = `${matching.toLocaleString()} structures in ${countryName}${eraSuffix}`;
  } else if (state.contestedOnly || state.activeFilter === "contested") {
    elCount.textContent = `${(state.worldSummary.contestedMonuments || 0).toLocaleString()} monuments in ${state.worldSummary.contestedAreasCount || 0} contested territories${eraSuffix}`;
  } else if (state.activeEra && state.activeEra !== "all" && state.worldSummary.eraCounts) {
    const ec = state.worldSummary.eraCounts[state.activeEra] || 0;
    elCount.textContent = `${ec.toLocaleString()} ${ERA_LABELS[state.activeEra]} monuments · ${state.worldSummary.countriesCount} countries`;
  } else {
    elCount.textContent = `${state.worldSummary.totalMonuments.toLocaleString()} built monuments · ${state.worldSummary.countriesCount} countries`;
  }
}

function applyFilters() {
  const expr = buildMapFilterExpression();
  if (map.getLayer("monuments-circle")) {
    map.setFilter("monuments-circle", expr);
  }
  if (map.getLayer("monuments-uncovered-excl")) {
    const exclFilter = expr ? ["all", ["==", ["get", "uncov"], 1], expr] : ["==", ["get", "uncov"], 1];
    map.setFilter("monuments-uncovered-excl", exclFilter);
    if (map.setLayerZoomRange) {
      map.setLayerZoomRange("monuments-uncovered-excl", state.activeFilter === "uncovered" ? 2.2 : 5.2, 22);
    }
  }
  if (map.getLayer("country-active-line")) {
    map.setFilter(
      "country-active-line",
      state.activeCountry ? ["==", ["get", "iso3"], state.activeCountry] : ["==", ["get", "iso3"], "__NONE__"]
    );
  }
  const contestedEmphasis = Boolean(state.contestedOnly || state.activeFilter === "contested");
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
    const showInd = (!state.activeCountry || state.activeCountry === "IND") && (state.activeFilter === "all" || state.activeFilter === "restoration" || state.activeFilter === "funded");
    map.setLayoutProperty("prashad-points", "visibility", showInd ? "visible" : "none");
  }
  updateCounterDisplay();
  schedulePhotoPins();
}

function renderCoveragePanel() {
  if (!state.worldSummary) return;
  if (state.activeCountry === "IND" && state.indiaExtras?.asiCircles?.length) {
    elBudgetPanelTitle.textContent = "ASI Circle Spend per Monument (India FY 2023–24)";
    const rows = [...state.indiaExtras.asiCircles].sort((a, b) => a.per_site_lakh - b.per_site_lakh);
    const maxPer = Math.max(...rows.map((r) => r.per_site_lakh), 1);
    elBudgetList.innerHTML = rows
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
      .join("");
    return;
  }

  elBudgetPanelTitle.textContent = "Top Countries by Heritage Registry & Photos";
  const topCountries = [...state.worldSummary.countries].sort((a, b) => b.total - a.total).slice(0, 24);
  elBudgetList.innerHTML = topCountries
    .map((c) => {
      const photoPct = c.total ? Math.round((c.photographed / c.total) * 100) : 0;
      return `
        <button type="button" class="budget-item budget-country-btn" data-iso="${escapeHtml(c.iso3)}" style="width:100%; text-align:left; background:transparent; border:none; border-bottom:1px solid var(--border); padding:6px 2px; cursor:pointer;">
          <div class="budget-item-top">
            <span>${escapeHtml(c.name)}</span>
            <span>${c.total.toLocaleString()} sites</span>
          </div>
          <div class="budget-bar-bg">
            <div class="budget-bar-fill ${photoPct < 50 ? "is-low" : ""}" style="width:${photoPct}%"></div>
          </div>
          <div class="budget-item-sub">${c.unesco} UNESCO · ${photoPct}% photographed · ${c.restoration} conservation alerts</div>
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

function showTooltip(point, html) {
  elTooltip.innerHTML = html;
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

function flyToSite(coords) {
  if (!coords) return;
  const isMobile = window.innerWidth <= 900;
  const drawerW = 390;
  const offset = isMobile ? [0, -Math.round(window.innerHeight * 0.22)] : [-Math.round(drawerW * 0.45), 0];
  map.easeTo({
    center: coords,
    zoom: Math.max(map.getZoom(), 9.5),
    offset,
    duration: 550,
  });
}

function showDetailDrawer(coords, shouldFly = false) {
  elDrawer.classList.remove("hidden");
  document.body.classList.add("drawer-open");
  if (window.innerWidth <= 760) {
    elLeftPanel.classList.add("collapsed");
    elReopenSidebar.classList.remove("hidden");
  }
  setSelectedSite(coords);
  if (shouldFly && coords) flyToSite(coords);
  requestAnimationFrame(schedulePhotoPins);
}

function closeDetailDrawer() {
  elDrawer.classList.add("hidden");
  document.body.classList.remove("drawer-open");
  state.lastDrawer = null;
  state.carouselHandler = null;
  setSelectedSite(null);
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
  const ratio = img.naturalWidth / img.naturalHeight;
  const isPortraitOrTall = ratio < 1.15;
  img.style.objectFit = isPortraitOrTall ? "contain" : "cover";
  img.style.objectPosition = "center center";
}

function bindCarousel(slides) {
  const mainImg = document.getElementById("carousel-main-img");
  if (!mainImg || !slides.length) return;
  mainImg.addEventListener("load", () => applyBestImageFit(mainImg));
  if (mainImg.complete) applyBestImageFit(mainImg);
  let index = 0;
  const setSlide = (nextIdx) => {
    index = (nextIdx + slides.length) % slides.length;
    const s = slides[index];
    mainImg.src = s.url;
    mainImg.alt = s.caption || "Monument photograph";
    const cap = document.getElementById("carousel-caption");
    const cred = document.getElementById("carousel-credit");
    const cnt = document.getElementById("carousel-count");
    if (cap) cap.textContent = s.caption || "";
    if (cred) cred.textContent = s.credit || "";
    if (cnt) cnt.textContent = `${index + 1} / ${slides.length}`;
    document.querySelectorAll("#carousel-thumbs .carousel-thumb").forEach((b, i) => {
      b.classList.toggle("active", i === index);
    });
  };
  state.carouselHandler = (delta) => setSlide(index + delta);
  const prevBtn = document.getElementById("carousel-prev");
  const nextBtn = document.getElementById("carousel-next");
  if (prevBtn) prevBtn.addEventListener("click", () => setSlide(index - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => setSlide(index + 1));
  document.querySelectorAll("#carousel-thumbs .carousel-thumb").forEach((btn) => {
    btn.addEventListener("click", () => setSlide(Number(btn.dataset.slide)));
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
    : "No established Wikimedia photo record yet — Aerial satellite view";

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
    /\b(painting|lithograph|engraving|watercolou?r|sketch|aquatint|etching|drawing|pottery|sherd|coin|numismatic|terracotta|figurine|artifact|artefact|excavated|museum|relic|manuscript|copper_?plate|copper\s+plate)\b/i;
  const skipRe = /\.(svg|ogg|ogv|webm|pdf|tif|tiff)$/i;
  const badTitleRe = /(flag|emblem|coat_of_arms|map|locator|icon|logo|commons-logo|wikidata|question_book|ambox|edit-clear|symbol|stamp|postage|plaque|board|ticket|plan|seal)/i;

  const pushSlide = (url, caption, credit = "", rawHint = "") => {
    if (!url || seen.has(url)) return;
    if (artifactOrArchivalRe.test(`${rawHint} ${caption || ""}`)) return;
    seen.add(url);
    slides.push({ url: hiResUrl(url), caption: caption || props.name, credit });
  };
  if (props.image) pushSlide(props.image, `${props.name} · Verified Archive Photo`, "Wikimedia Commons");

  try {
    if (props.image) {
      const fileTitle = extractCommonsFilename(props.image);
      if (fileTitle) {
        const crRes = await fetch(
          `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=extmetadata&format=json&origin=*`
        );
        if (crRes.ok) {
          const crData = await crRes.json();
          const pg = Object.values((crData.query && crData.query.pages) || {})[0];
          const ii = pg?.imageinfo?.[0];
          if (ii?.extmetadata && slides[0]) slides[0].credit = formatImageCredit(ii.extmetadata);
        }
      }
    }

    let discoveredWikiTitle =
      props.wikipedia && props.wikipedia.includes("/wiki/")
        ? decodeURIComponent(props.wikipedia.split("/wiki/")[1])
        : "";

    if ((!props.image || !discoveredWikiTitle) && props.qid && /^Q\d+$/i.test(props.qid)) {
      const wdRes = await fetch(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(props.qid)}&props=claims|sitelinks&format=json&origin=*`
      );
      if (wdRes.ok) {
        const wdData = await wdRes.json();
        const ent = wdData.entities?.[props.qid];
        const p18 = ent?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
        if (p18 && !props.image) {
          pushSlide(
            `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(String(p18).replace(/ /g, "_"))}`,
            `${props.name} · Wikidata P18 Photo`,
            "Wikimedia Commons",
            p18
          );
        }
        const enTitle = ent?.sitelinks?.enwiki?.title;
        if (enTitle && !discoveredWikiTitle) discoveredWikiTitle = enTitle;
        const p373 = ent?.claims?.P373?.[0]?.mainsnak?.datavalue?.value;
        if (p373 && slides.length < 4) {
          const cmRes = await fetch(
            `https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent("Category:" + p373)}&cmtype=file&cmlimit=10&format=json&origin=*`
          );
          if (cmRes.ok) {
            const cmData = await cmRes.json();
            const catFiles = (cmData.query?.categorymembers || [])
              .map((m) => m.title)
              .filter((t) => t && !skipRe.test(t) && !badTitleRe.test(t) && !artifactOrArchivalRe.test(t))
              .slice(0, 6);
            if (catFiles.length) {
              const infoRes = await fetch(
                `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(catFiles.join("|"))}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200&format=json&origin=*`
              );
              if (infoRes.ok) {
                const infoData = await infoRes.json();
                for (const p of Object.values(infoData.query?.pages || {})) {
                  const ii = p.imageinfo?.[0];
                  if (ii && slides.length < 5) {
                    const cleanCap = String(p.title || "").replace(/^File:/i, "").replace(/\.[^.]+$/, "").replace(/_/g, " ");
                    pushSlide(ii.thumburl || ii.url, cleanCap, formatImageCredit(ii.extmetadata), p.title);
                  }
                }
              }
            }
          }
        }
      }
    }

    if (discoveredWikiTitle && slides.length < 5) {
      const imgsRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(discoveredWikiTitle)}&prop=images&imlimit=12&format=json&origin=*`
      );
      if (imgsRes.ok) {
        const imgsData = await imgsRes.json();
        const page = Object.values(imgsData.query?.pages || {})[0];
        const titles = (page?.images || [])
          .map((x) => x.title)
          .filter((t) => t && !skipRe.test(t) && !badTitleRe.test(t) && !artifactOrArchivalRe.test(t))
          .slice(0, 6);
        if (titles.length) {
          const infoRes = await fetch(
            `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles.join("|"))}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200&format=json&origin=*`
          );
          if (infoRes.ok) {
            const infoData = await infoRes.json();
            for (const p of Object.values(infoData.query?.pages || {})) {
              const ii = p.imageinfo?.[0];
              if (ii && slides.length < 5) {
                const cleanCap = String(p.title || "").replace(/^File:/i, "").replace(/\.[^.]+$/, "").replace(/_/g, " ");
                pushSlide(ii.thumburl || ii.url, cleanCap, formatImageCredit(ii.extmetadata), p.title);
              }
            }
          }
        }
      }
    }
  } catch {
    // Keep strictly verified slides only
  }

  state.galleryCache[key] = slides;
  return slides;
}

function hydrateDrawerCarousel(mountId, props, coords) {
  fetchGalleryImages(props).then((slides) => {
    const mount = document.getElementById(mountId);
    if (!mount) return;
    if (slides.length) {
      mount.innerHTML = renderCarouselHtml(slides);
      bindCarousel(slides);
      const badge = document.getElementById("coverage-badge");
      if (badge && badge.dataset.uncovered === "true") {
        badge.className = "coverage-pill is-partial";
        badge.textContent = "Verified Photo · Partial Data";
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
  const loc = [props.location, props.region, props.country].filter(Boolean).join(", ");
  const s1 = `${props.name} is a ${props.siteType ? props.siteType.toLowerCase() : "protected monument"}${loc ? ` in ${loc}` : ""}, recorded under ${props.heritageDesignation || "official heritage protection"}.`;
  let s2 = "";
  if (props.unescoShortDesc) {
    const first = props.unescoShortDesc.match(/[^.!?]+[.!?]+/);
    s2 = first ? first[0].trim() : props.unescoShortDesc;
  } else if (props.unesco) {
    s2 = `Inscribed on the UNESCO World Heritage List${props.unescoYear ? ` (${props.unescoYear})` : ""}.`;
  } else if (props.desc) {
    s2 = props.desc.replace(/\.+$/, "") + ".";
  } else {
    s2 = "No extended narrative summary is linked on English Wikipedia yet.";
  }
  return { text: `${s1} ${s2}`, fullText: "", title: props.name, url: props.wikipedia || "", source: props.unesco ? "UNESCO World Heritage List" : "Wikidata Heritage Registry" };
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

    const grabFirstQid = (prop) => claims[prop]?.[0]?.mainsnak?.datavalue?.value?.id || "";
    const propTargets = {
      patron: grabFirstQid("P88"),
      architect: grabFirstQid("P84"),
      creator: grabFirstQid("P170"),
      foundedBy: grabFirstQid("P112"),
      timePeriod: grabFirstQid("P2348"),
      style: grabFirstQid("P149"),
      material: grabFirstQid("P186"),
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
  return { yearNum: null, builtLabel: "Undated", ageLabel: "Age unverified" };
}

function citeHtml(sourceText, url = "", label = "Citation") {
  return `
    <details class="cite-drop">
      <summary>${escapeHtml(label)} ▾</summary>
      <div class="cite-body">${escapeHtml(sourceText)}${
        url ? ` — <a href="${escapeHtml(url)}" target="_blank" rel="noopener">Open source ↗</a>` : ""
      }</div>
    </details>`;
}

function buildHistoricalSignificance(props, dateInfo, wikiResult = null, wdFacts = null) {
  const lines = [];
  const citations = [];
  const seen = new Set();
  const pushLine = (t) => {
    const clean = String(t || "").replace(/\s+/g, " ").trim();
    if (!clean) return;
    const k = clean.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    lines.push(clean);
  };

  const patron = wdFacts?.patron || props.patron || wdFacts?.foundedBy || wdFacts?.creator || "";
  const architect = wdFacts?.architect || props.architect || "";
  const periodTag = wdFacts?.timePeriod || (props.era && props.era !== "unk" ? ERA_LABELS[props.era] : "") || "";
  if (patron || architect) {
    const parts = [];
    if (wdFacts?.patron || props.patron) parts.push(`Commissioned by ${wdFacts?.patron || props.patron}`);
    else if (wdFacts?.foundedBy) parts.push(`Founded by ${wdFacts.foundedBy}`);
    else if (wdFacts?.creator) parts.push(`Created by ${wdFacts.creator}`);
    if (architect && architect !== patron) parts.push(`architect: ${architect}`);
    pushLine(`${parts.join(" · ")}.`);
    if (wdFacts?.qid || props.qid) {
      const q = wdFacts?.qid || props.qid;
      if (/^Q\d+$/i.test(q)) citations.push({ text: `Wikidata ${q}`, url: `https://www.wikidata.org/wiki/${q}` });
    }
  } else if (periodTag && dateInfo?.yearNum !== null) {
    pushLine(`${periodTag} monument (${dateInfo.builtLabel}).`);
    if (wdFacts?.qid || props.qid) {
      const q = wdFacts?.qid || props.qid;
      if (/^Q\d+$/i.test(q)) citations.push({ text: `Wikidata ${q}`, url: `https://www.wikidata.org/wiki/${q}` });
    }
  }

  if (props.unescoJustification) {
    const first = props.unescoJustification.match(/[^.!?]+[.!?]+/);
    if (first) {
      pushLine(first[0]);
      citations.push({ text: `UNESCO WHC #${props.unescoId || "List"}`, url: props.unescoId ? `https://whc.unesco.org/en/list/${props.unescoId}` : "" });
    }
  }

  if (wikiResult?.fullText) {
    const leadLow = String(wikiResult.text || "").toLowerCase();
    const sentences = wikiResult.fullText.match(/[^.!?]+[.!?]+/g) || [];
    const picked = sentences
      .filter((s) => {
        const clean = s.trim();
        if (clean.length < 28 || clean.length > 260) return false;
        if (!HISTORY_CUE_RE.test(clean)) return false;
        if (leadLow && leadLow.includes(clean.toLowerCase().slice(0, 60)) && lines.length > 0) return false;
        return true;
      })
      .slice(0, patron ? 1 : 2);
    for (const s of picked) pushLine(s);
    if (picked.length && wikiResult.url) {
      citations.push({ text: `Wikipedia (${wikiResult.title || "Article"})`, url: wikiResult.url });
    }
  }

  if (props.unesco) {
    pushLine(`UNESCO World Heritage Site${props.unescoYear ? ` (${props.unescoYear})` : ""}${props.unescoCriteria ? ` · Criteria ${props.unescoCriteria}` : ""}.`);
    if (!citations.some((c) => /UNESCO/i.test(c.text))) {
      citations.push({ text: "UNESCO World Heritage Centre", url: props.unescoId ? `https://whc.unesco.org/en/list/${props.unescoId}` : "" });
    }
  }

  if (!lines.length) return null;
  if (!citations.length) {
    citations.push({
      text: `${props.heritageDesignation || "Heritage Registry"}${props.qid ? ` · Wikidata ${props.qid}` : ""}`,
      url: props.qid && /^Q\d+$/i.test(props.qid) ? `https://www.wikidata.org/wiki/${props.qid}` : "",
    });
  }
  return { lines: lines.slice(0, 3), badge: periodTag || patron || "", citations };
}

function renderHistoricalSignificanceCard(sig) {
  if (!sig || !sig.lines?.length) return "";
  const primary = sig.citations.find((c) => c.url) || sig.citations[0];
  const labelText = sig.citations.map((c) => c.text).join(" · ");
  const extraLinks = sig.citations
    .filter((c) => c.url && c.url !== primary?.url)
    .map((c) => ` · <a href="${escapeHtml(c.url)}" target="_blank" rel="noopener">${escapeHtml(c.text)} ↗</a>`)
    .join("");
  return `
    <div class="history-sig-card">
      <div class="funding-health-head">
        <span class="funding-health-title">Historical Significance</span>
        ${sig.badge ? `<span class="history-sig-pill">${escapeHtml(sig.badge)}</span>` : ""}
      </div>
      <div class="history-sig-facts">
        ${sig.lines.map((l) => `<p class="history-sig-line">${escapeHtml(l)}</p>`).join("")}
      </div>
      <details class="cite-drop">
        <summary>Citation ▾</summary>
        <div class="cite-body">${escapeHtml(labelText)}${primary?.url ? ` — <a href="${escapeHtml(primary.url)}" target="_blank" rel="noopener">Open source ↗</a>` : ""}${extraLinks}</div>
      </details>
    </div>
  `;
}

function renderCurrencySwitchHtml() {
  return `
    <div class="currency-dropdown-wrap">
      <select id="currency-select" class="currency-select" aria-label="Currency" title="Change display currency">
        ${Object.entries(CURRENCY_RATES)
          .map(([c, cfg]) => `<option value="${c}" ${state.currency === c ? "selected" : ""}>${c} (${cfg.symbol})</option>`)
          .join("")}
      </select>
    </div>
  `;
}

function bindDrawerCurrencySwitch() {
  const sel = document.getElementById("currency-select");
  if (!sel) return;
  sel.addEventListener("change", () => {
    state.currency = sel.value || "USD";
    if (state.lastDrawer) openMonumentDrawer(state.lastDrawer.props, state.lastDrawer.coords);
  });
}

function openMonumentFromCoords(rawProps, coords, shouldFly = false) {
  const merged = getMergedProps(rawProps);
  openMonumentDrawer(merged, coords, shouldFly);
  if (merged.countryIso && !state.countryShards[merged.countryIso]) {
    ensureCountryShard(merged.countryIso).then(() => {
      if (state.lastDrawer && state.lastDrawer.props.qid === merged.qid) {
        const refreshed = getMergedProps(merged);
        state.lastDrawer.props = refreshed;
        mountDrawerNearbyNav(refreshed, coords);
      }
    });
  }
}

function openMonumentDrawer(rawProps, coords, shouldFly = false) {
  const props = getMergedProps(rawProps);
  state.lastDrawer = { props, coords };
  const dateInfo = extractConstructionInfo(props);

  const gaps = [];
  if (!props.image) gaps.push({ key: "photo", label: "No verified Wikimedia Commons archive photo yet" });
  if (!props.wikipedia) gaps.push({ key: "wiki", label: "No linked English Wikipedia page" });
  if (dateInfo.yearNum === null) gaps.push({ key: "date", label: "Construction year / era unverified" });
  if (!props.circleExpCr && !props.unesco && !props.hasFunding) gaps.push({ key: "budget", label: "Public maintenance budget not disclosed in central registry" });

  const hasPhoto = Boolean(props.image);
  const badgeText = !hasPhoto ? "! Poorly Covered" : gaps.length ? "Partial Coverage" : "Well Documented";
  const badgeClass = !hasPhoto ? "is-uncovered" : gaps.length ? "is-partial" : "is-full";

  const kpiCards = [];
  kpiCards.push({
    label: "Built / Age",
    val: dateInfo.builtLabel,
    sub: dateInfo.ageLabel,
    accent: "",
    valId: "drawer-age-val",
    subId: "drawer-age-sub",
  });

  if (props.unesco) {
    kpiCards.push({
      label: props.unescoDanger ? "UNESCO Status" : "UNESCO Listed",
      val: props.unescoDanger ? "In Danger" : props.unescoYear || "Inscribed",
      sub: props.unescoCategory || "World Heritage",
      accent: props.unescoDanger ? "color: var(--c-underfunded)" : "color: var(--c-unesco)",
    });
  }

  const visCount = props.annualVisitors || (props.footfallLakhs ? Math.round(Number(props.footfallLakhs) * 100000) : null);
  if (visCount) {
    const compactVis =
      visCount >= 1_000_000
        ? `${(visCount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
        : visCount >= 1_000
          ? `${Math.round(visCount / 1_000)}K`
          : String(visCount);
    kpiCards.push({
      label: "Annual Visitors",
      val: compactVis,
      sub: `~${visCount.toLocaleString()} / yr`,
      accent: "color: var(--c-footfall)",
    });
  }

  if (props.revenueCr) {
    kpiCards.push({
      label: "Ticket Revenue",
      val: formatMoneyCr(props.revenueCr, true),
      sub: props.ticketFy || "Annual ticket receipt",
      accent: "",
    });
  } else if (props.circlePerSiteLakh) {
    kpiCards.push({
      label: "Site Budget (Est.)",
      val: formatMoneyLakh(props.circlePerSiteLakh, true),
      sub: props.circleName || "ASI FY 2023–24",
      accent: props.underfundedCircle ? "color: var(--c-underfunded)" : "color: var(--c-adopt)",
    });
  } else if (props.unescoAreaHa && kpiCards.length < 3) {
    kpiCards.push({
      label: "Protected Area",
      val: `${Math.round(Number(props.unescoAreaHa)).toLocaleString()} ha`,
      sub: "UNESCO boundary",
      accent: "",
    });
  }

  const metaRows = [];
  metaRows.push(["Government Recognition", props.heritageDesignation || "Government-Recognized Heritage"]);
  if (props.unesco) metaRows.push(["UNESCO World Heritage", `${props.unesco}${props.unescoYear ? ` (${props.unescoYear})` : ""}`]);
  if (props.unescoCriteria) metaRows.push(["UNESCO Criteria", props.unescoCriteria]);
  if (visCount) metaRows.push(["Annual Visitors", `~${visCount.toLocaleString()} / yr${visCount >= 500000 ? " (Most Visited 500K+)" : ""}`]);
  metaRows.push(["Built / Historical Date", dateInfo.builtLabel]);
  metaRows.push(["Monument Age", dateInfo.ageLabel]);
  if (props.siteType) metaRows.push(["Category", props.siteType]);
  if (props.style) metaRows.push(["Architecture", props.style]);
  if (props.material) metaRows.push(["Material", props.material]);
  if (props.period) metaRows.push(["Historical Period", props.period]);
  if (props.architect) metaRows.push(["Architect", props.architect]);
  if (props.patron) metaRows.push(["Patron", props.patron]);
  if (props.location) metaRows.push(["City / Locality", props.location]);
  if (props.region) metaRows.push(["Region / State", props.region]);
  if (props.country) metaRows.push(["Country / Territory", props.country]);
  if (props.contestedArea) metaRows.push(["Contested Territory", props.contestedArea]);
  if (props.circleName) metaRows.push(["ASI Circle", props.circleName]);

  const initialSig = buildHistoricalSignificance(props, dateInfo, null, null);

  let statusClass = "is-routine";
  let statusText = "Registry Monitored";
  let statusNote = "Listed under national or international architectural protection with no active crisis alert.";
  if (props.unescoDanger) {
    statusClass = "is-underfunded";
    statusText = "UNESCO In Danger";
    statusNote = "Flagged on the official UNESCO List of World Heritage in Danger requiring urgent conservation.";
  } else if (props.inRestoration || props.adoptPartner) {
    statusClass = "is-active";
    statusText = props.adoptPartner ? `Partnered (${props.adoptPartner})` : props.conservationState || "Active Conservation";
    statusNote = props.adoptScope || "Ongoing heritage conservation / restoration program recorded.";
  } else if (props.underfundedCircle) {
    statusClass = "is-underfunded";
    statusText = "Underfunded Circle";
    statusNote = "Situated in an ASI circle averaging below ₹8.5L per monument in FY 2023–24.";
  } else if (props.underfunded && props.conservationState) {
    statusClass = "is-underfunded";
    statusText = `Conservation Alert (${props.conservationState})`;
    statusNote = `Recorded in Wikidata P5816 state of conservation as "${props.conservationState}".`;
  }

  const extLinks = [];
  if (props.wikipedia) extLinks.push(`<a class="detail-link" data-link-kind="wikipedia" href="${escapeHtml(props.wikipedia)}" target="_blank" rel="noopener">Wikipedia ↗</a>`);
  if (props.qid && /^Q\d+$/i.test(props.qid)) extLinks.push(`<a class="detail-link" href="https://www.wikidata.org/wiki/${encodeURIComponent(props.qid)}" target="_blank" rel="noopener">Wikidata ↗</a>`);
  if (props.unescoId) extLinks.push(`<a class="detail-link" href="https://whc.unesco.org/en/list/${encodeURIComponent(props.unescoId)}" target="_blank" rel="noopener">UNESCO WHC #${escapeHtml(props.unescoId)} ↗</a>`);
  extLinks.push(
    `<a class="detail-link" href="https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(
      `${props.name} ${props.country || ""}`.trim()
    )}" target="_blank" rel="noopener">Commons ↗</a>`
  );

  const badges = [];
  if (props.asiId) badges.push(`<span class="badge">${String(props.asiId).toUpperCase().startsWith("S-") ? "State" : "ASI"} ${escapeHtml(props.asiId)}</span>`);
  else if (props.heritageDesignation) {
    const shortDes = String(props.heritageDesignation).length > 26
      ? `${String(props.heritageDesignation).slice(0, 24).trim()}…`
      : String(props.heritageDesignation);
    badges.push(`<span class="badge" title="${escapeHtml(props.heritageDesignation)}">${escapeHtml(shortDes)}</span>`);
  }
  if (props.unesco) badges.push(`<span class="badge badge-unesco">UNESCO World Heritage${props.unescoYear ? ` · ${escapeHtml(props.unescoYear)}` : ""}</span>`);
  if (props.contested) badges.push(`<span class="badge badge-flagged">Contested Territory</span>`);
  if (props.isMostVisited) badges.push(`<span class="badge badge-footfall">Most Visited (500K+)</span>`);
  if (props.hasFunding && !props.underfunded) badges.push(`<span class="badge badge-adopt">Funded / Protected</span>`);
  if (!hasPhoto) badges.push(`<span class="badge badge-uncovered" id="coverage-badge"><span class="legend-excl" aria-hidden="true">!</span>Poorly Covered · No Photo</span>`);

  const reports = state.reports[props.qid] || [];
  const issueOptions = [
    "Structural Decay / Cracks",
    "Encroachment / Buffer Risk",
    "Missing Signage / Lighting",
    "Sanitation / Visitor Amenities",
    "Restoration Verified",
  ];
  let selectedIssue = issueOptions[0];

  let fundingTierClass = "tier-unknown";
  let fundingTierLabel = "Public Registry · Undisclosed";
  let fundingLeftLabel = "Site Allocation";
  let fundingLeftVal = "Not Line-Itemed";
  let fundingLeftSub = `Statutory protection via ${props.country || "national"} heritage budget; site-level outlay unpublished`;
  let fundingRightLabel = "Steward / Authority";
  let fundingRightVal = props.heritageDesignation || `${props.country || "National"} Heritage Registry`;
  let fundingRightSub = `${props.country || "National"} Ministry / Trust`;
  let fundingCitation = "Evaluated from UNESCO World Heritage Fund / Danger records, Wikidata P5816 conservation state & patronage, and national statutory heritage registries.";

  if (props.circlePerSiteLakh || props.revenueCr) {
    fundingTierClass = props.underfundedCircle ? "tier-poor" : "tier-good";
    fundingTierLabel = props.underfundedCircle ? "Underfunded Circle" : "Budget Disclosed";
    fundingLeftLabel = "Site / Ticket Estimate";
    fundingLeftVal = props.revenueCr ? formatMoneyCr(props.revenueCr, true) : formatMoneyLakh(props.circlePerSiteLakh || 0, true);
    fundingLeftSub = props.revenueCr ? props.ticketFy || "Annual ticket revenue" : props.circleName || "Circle average";
    fundingRightLabel = "ASI Circle";
    fundingRightVal = props.circleExpCr ? formatMoneyCr(props.circleExpCr, true) : "—";
    fundingRightSub = props.circleName || "Ministry of Culture FY 2023–24";
    fundingCitation = "FY 2023–24 PIB circle budgets, Adopt a Heritage 2.0 & PRASHAD.";
  } else if (props.unescoDanger) {
    fundingTierClass = "tier-poor";
    fundingTierLabel = "Emergency Aid Needed";
    fundingLeftVal = "Critical Shortfall";
    fundingLeftSub = "Inscribed on the UNESCO List of World Heritage in Danger; urgent international conservation aid flagged";
    fundingRightVal = "UNESCO WHF + National Govt";
    fundingRightSub = props.heritageDesignation || "Emergency Assistance Eligible";
  } else if (props.underfunded) {
    fundingTierClass = "tier-poor";
    fundingTierLabel = "Conservation / Funding Risk";
    fundingLeftVal = "Underfunded / At Risk";
    fundingLeftSub = props.conservationState ? `Wikidata conservation status: ${props.conservationState}` : "Maintenance or conservation resource gap recorded";
    fundingRightVal = props.unesco ? "UNESCO + National Registry" : `${props.country || "National"} Ministry`;
    fundingRightSub = props.heritageDesignation || "National Statutory Protection";
  } else if (props.hasFunding || props.unesco || props.adoptPartner) {
    fundingTierClass = "tier-good";
    fundingTierLabel = props.adoptPartner ? "Sponsor / Grant Funded" : props.unesco ? "UNESCO + National Funded" : "Government Funded";
    fundingLeftVal = props.adoptPartner ? `Partner: ${props.adoptPartner}` : "Active Grant / Program";
    fundingLeftSub = props.adoptScope || (props.unesco ? "Eligible for UNESCO World Heritage Fund & national conservation outlays" : "Dedicated national conservation or restoration funding verified");
    fundingRightVal = props.unesco ? "UNESCO WHC + National Govt" : `${props.country || "National"} Heritage Trust`;
    fundingRightSub = props.heritageDesignation || "Protected Budget Allocation";
  }

  const fundingHealthHtml = `
    <div class="funding-health-card">
      <div class="funding-health-head">
        <span class="funding-health-title">Funding Health</span>
        <span class="funding-tier-badge ${fundingTierClass}">${escapeHtml(fundingTierLabel)}</span>
      </div>
      <div class="budget-split-grid">
        <div class="budget-split-box">
          <span class="budget-split-label">${escapeHtml(fundingLeftLabel)}</span>
          <span class="budget-split-val">${escapeHtml(fundingLeftVal)}</span>
          <span class="budget-split-sub">${escapeHtml(fundingLeftSub)}</span>
        </div>
        <div class="budget-split-box">
          <span class="budget-split-label">${escapeHtml(fundingRightLabel)}</span>
          <span class="budget-split-val">${escapeHtml(fundingRightVal)}</span>
          <span class="budget-split-sub">${escapeHtml(fundingRightSub)}</span>
        </div>
      </div>
      ${citeHtml(fundingCitation)}
    </div>
  `;

  const recognitionBodies = [];
  const rawDesignation = String(props.heritageDesignation || "").trim();
  const isGenericDes = !rawDesignation || /^(Government-Recognized Heritage|National Architectural Heritage|Government-Designated Heritage)$/i.test(rawDesignation);
  const govAuthorityLabel = props.asiId
    ? `Government of India · ${String(props.asiId).toUpperCase().startsWith("S-") ? "State Archaeology Registry" : "Archaeological Survey of India (ASI)"}`
    : `${props.country || "National"} Statutory Heritage Registry`;
  if (props.unesco) {
    recognitionBodies.push(`UNESCO World Heritage${props.unescoYear ? ` (Inscribed ${props.unescoYear})` : ""}`);
  }
  if (!isGenericDes && !/^UNESCO/i.test(rawDesignation)) {
    recognitionBodies.push(`${rawDesignation} (${govAuthorityLabel})`);
  } else if (!props.unesco || props.asiId || rawDesignation) {
    recognitionBodies.push(govAuthorityLabel);
  }
  const recognitionPill =
    props.unesco && !isGenericDes
      ? "UNESCO + Government"
      : props.unesco
        ? "UNESCO Recognized"
        : "Government Recognized";
  const recognitionPillClass = props.unesco ? "is-active" : "is-routine";
  const recognitionHtml = `
    <div class="restoration-status-row">
      <div class="funding-health-head" style="margin-bottom:2px;">
        <span class="funding-health-title">Official Recognition</span>
        <span class="restoration-status-pill ${recognitionPillClass}">${escapeHtml(recognitionPill)}</span>
      </div>
      <div class="budget-split-sub">${escapeHtml(recognitionBodies.join(" · "))}</div>
    </div>
  `;

  elDetailContent.innerHTML = `
    <div id="drawer-media-mount">
      ${hasPhoto ? renderCarouselHtml([{ url: hiResUrl(props.image), caption: `${props.name} · Primary Archive Photo`, credit: "Wikimedia Commons" }]) : renderSatelliteFallbackHtml(props, coords, true)}
    </div>

    <div class="v-head-grid">
      <div>
        <h2 class="detail-title">${escapeHtml(props.name)}</h2>
        <div class="detail-kicker">${escapeHtml([props.location, props.region, props.country].filter(Boolean).join(" · "))}</div>
      </div>
    </div>

    <div class="drawer-subbar">
      <div class="detail-badges" style="margin:0;">${badges.slice(0, 5).join("")}</div>
      ${renderCurrencySwitchHtml()}
    </div>

    <div class="detail-desc" id="wiki-summary-mount">
      ${
        state.wikiCache[props.qid || props.name]?.text
          ? escapeHtml(state.wikiCache[props.qid || props.name].text)
          : `<div class="skeleton-block" aria-label="Loading site summary"><span class="skeleton-line w-full"></span><span class="skeleton-line w-88"></span><span class="skeleton-line w-72"></span></div>`
      }
    </div>
    ${citeHtml("Synthesized from UNESCO, Wikidata, and linked Wikipedia lead summary.")}
    <div style="margin-bottom:14px;"></div>

    <div class="kpi-strip${kpiCards.length >= 4 ? " is-four" : ""}">
      ${kpiCards
        .slice(0, 4)
        .map(
          (k) => `
        <div class="kpi-card">
          <span class="kpi-label">${escapeHtml(k.label)}</span>
          <span class="kpi-val" ${k.valId ? `id="${escapeHtml(k.valId)}"` : ""} ${k.accent ? `style="${k.accent}"` : ""}>${escapeHtml(k.val)}</span>
          <span class="kpi-sub" ${k.subId ? `id="${escapeHtml(k.subId)}"` : ""}>${escapeHtml(k.sub)}</span>
        </div>`
        )
        .join("")}
    </div>

    <div id="history-sig-mount">${
      !props.qid || state.wdFactsCache[props.qid]
        ? initialSig
          ? renderHistoricalSignificanceCard(initialSig)
          : ""
        : `<div class="skeleton-card" aria-label="Loading historical context"><div class="skeleton-block"><span class="skeleton-line w-44"></span><span class="skeleton-line w-full"></span><span class="skeleton-line w-72"></span></div></div>`
    }</div>

    ${recognitionHtml}

    ${fundingHealthHtml}

    <div class="restoration-status-row">
      <div class="funding-health-head" style="margin-bottom:2px;">
        <span class="funding-health-title">Conservation Status</span>
        <span class="restoration-status-pill ${statusClass}">${escapeHtml(statusText)}</span>
      </div>
      <div class="budget-split-sub">${escapeHtml(statusNote)}</div>
    </div>

    <div class="meta-block">
      ${metaRows
        .map(
          ([k, v]) =>
            `<div class="meta-row"><span class="meta-label">${escapeHtml(k)}</span><span class="meta-val" ${
              k === "Built / Historical Date"
                ? 'id="meta-built-val"'
                : k === "Monument Age"
                  ? 'id="meta-age-val"'
                  : ""
            }>${escapeHtml(v)}</span></div>`
        )
        .join("")}
    </div>
    ${citeHtml(`${props.heritageDesignation || "National Architectural Register"}${props.qid ? ` · Wikidata ${props.qid}` : ""}.`, props.qid && /^Q\d+$/i.test(props.qid) ? `https://www.wikidata.org/wiki/${props.qid}` : "")}

    ${
      gaps.length
        ? `<div class="coverage-gaps-card" id="coverage-gaps-card">
            <div class="coverage-gaps-title">Why coverage is marked incomplete (${gaps.length} gap${gaps.length > 1 ? "s" : ""})</div>
            <div class="coverage-checklist">
              ${gaps
                .map(
                  (g) => `
                <div class="coverage-check-item" data-gap="${escapeHtml(g.key)}">
                  <span class="coverage-check-icon" aria-hidden="true">!</span>
                  <span>${escapeHtml(g.label)}</span>
                </div>`
                )
                .join("")}
            </div>
            ${citeHtml("Audited live against Wikimedia Commons media, linked Wikipedia pages, and Wikidata/UNESCO architectural fields.")}
          </div>`
        : ""
    }

    ${extLinks.length ? `<div class="detail-links" id="detail-links">${extLinks.join("")}</div>` : ""}

    <details class="report-box" ${reports.length ? "open" : ""}>
      <summary>
        <span>Flag maintenance or conservation issue${reports.length ? ` (${reports.length})` : ""}</span>
        <span class="report-chevron" aria-hidden="true">▾</span>
      </summary>
      <form id="report-form">
        <div class="issue-chips" role="radiogroup" aria-label="Issue category">
          ${issueOptions
            .map(
              (opt, idx) =>
                `<button type="button" class="issue-chip ${idx === 0 ? "active" : ""}" data-issue="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`
            )
            .join("")}
        </div>
        <textarea id="report-note" rows="2" placeholder="Describe the issue or verify conservation work (saved locally)…"></textarea>
        <div class="report-actions">
          <button type="submit" class="btn-primary">Submit Flag</button>
          <button type="button" class="btn-secondary" id="export-reports-btn">Export JSON</button>
        </div>
      </form>
      ${
        reports.length
          ? reports
              .map((r) => `<div class="report-item"><b>${escapeHtml(r.category)}</b> · ${escapeHtml(r.date)}${r.note ? `<br/>${escapeHtml(r.note)}` : ""}</div>`)
              .join("")
          : ""
      }
    </details>
  `;

  bindDrawerCurrencySwitch();
  hydrateDrawerCarousel("drawer-media-mount", props, coords);

  Promise.all([fetchWikiTwoSentences(props), fetchWikidataHistoryFacts(props.qid)]).then(([wikiResult, wdFacts]) => {
    if (!state.lastDrawer || state.lastDrawer.props.qid !== props.qid) return;
    const sumEl = document.getElementById("wiki-summary-mount");
    if (sumEl) {
      sumEl.textContent = wikiResult?.text || buildFallbackTwoSentenceSummary(props).text;
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
    const updatedDate = extractConstructionInfo(props, wdFacts?.rawYear ?? null);
    const builtEl = document.getElementById("meta-built-val");
    const ageEl = document.getElementById("meta-age-val");
    const kpiAgeVal = document.getElementById("drawer-age-val");
    const kpiAgeSub = document.getElementById("drawer-age-sub");
    if (updatedDate.yearNum !== null) {
      if (builtEl) builtEl.textContent = updatedDate.builtLabel;
      if (ageEl) ageEl.textContent = updatedDate.ageLabel;
      if (kpiAgeVal) kpiAgeVal.textContent = updatedDate.builtLabel;
      if (kpiAgeSub) kpiAgeSub.textContent = updatedDate.ageLabel;
    }

    const sig = buildHistoricalSignificance(props, updatedDate, wikiResult, wdFacts);
    const sigMount = document.getElementById("history-sig-mount");
    if (sigMount) sigMount.innerHTML = renderHistoricalSignificanceCard(sig);
  });

  document.querySelectorAll(".issue-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".issue-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      selectedIssue = chip.dataset.issue || selectedIssue;
    });
  });

  document.getElementById("report-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const note = document.getElementById("report-note").value.trim();
    const list = state.reports[props.qid] || [];
    list.unshift({ qid: props.qid, name: props.name, category: selectedIssue, note, date: new Date().toISOString().slice(0, 10) });
    state.reports[props.qid] = list;
    saveReports();
    openMonumentDrawer(props, coords, false);
  });

  document.getElementById("export-reports-btn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state.reports, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "architecture-monument-atlas-reports.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  mountDrawerNearbyNav(props, coords);
  showDetailDrawer(coords, shouldFly);
}

// ---------- Nearby Swipe Navigation ----------
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

function mountDrawerNearbyNav(props, coords) {
  const slot = document.getElementById("drawer-nearby-slot");
  if (slot) slot.innerHTML = "";
  const nav = state.nearbyNav;
  const curIdx = nav && nav.list ? nav.list.findIndex((x) => x.qid === props.qid) : -1;
  if (curIdx >= 0) {
    nav.index = curIdx;
  } else {
    state.nearbyNav = buildNearbyNav(coords, props.qid);
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
        paint: { "fill-color": "#cbe5f7", "fill-opacity": 0.94 },
      },
      {
        id: "om-waterway",
        type: "line",
        "source-layer": "waterway",
        minzoom: 4.5,
        paint: {
          "line-color": "#80bee9",
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
          "fill-color": "#c7e4c0",
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
          "fill-color": "#d5ebd0",
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
          "line-color": "#c8c6be",
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
          "line-color": "#dcd9d0",
          "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.8, 16, 3.5],
        },
      },
      {
        id: "om-building",
        type: "fill-extrusion",
        "source-layer": "building",
        minzoom: 13.0,
        paint: {
          "fill-extrusion-color": "#e3e0d8",
          "fill-extrusion-height": ["coalesce", ["get", "render_height"], 12],
          "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": ["interpolate", ["linear"], ["zoom"], 13.0, 0.0, 14.5, 0.88],
        },
      },
      // Soft, low-contrast country, state & disputed borders matching Apple Maps paper aesthetic
      {
        id: "om-border-admin",
        type: "line",
        "source-layer": "boundary",
        filter: ["all", ["==", ["get", "admin_level"], 2], ["!=", ["get", "maritime"], 1], ["!=", ["get", "disputed"], 1], ["!", ["has", "claimed_by"]]],
        layout: { "line-cap": "round", "line-join": "round", visibility: state.showCountryBorders ? "visible" : "none" },
        paint: {
          "line-color": "#b4bac0",
          "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.55, 5, 0.9, 10, 1.25],
          "line-opacity": 0.62,
        },
      },
      {
        id: "om-border-sub",
        type: "line",
        "source-layer": "boundary",
        filter: ["all", [">=", ["get", "admin_level"], 3], ["<=", ["get", "admin_level"], 4], ["!=", ["get", "maritime"], 1], ["!=", ["get", "disputed"], 1], ["!", ["has", "claimed_by"]]],
        minzoom: 4.0,
        paint: {
          "line-color": "#c9ced4",
          "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.5, 8, 0.95],
          "line-dasharray": [3, 2],
          "line-opacity": 0.52,
        },
      },
      {
        id: "om-border-disputed",
        type: "line",
        "source-layer": "boundary",
        filter: ["all", ["!=", ["get", "maritime"], 1], ["any", ["==", ["get", "disputed"], 1], ["has", "claimed_by"]]],
        layout: { visibility: state.showCountryBorders ? "visible" : "none" },
        paint: {
          "line-color": "#989fa6",
          "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.65, 6, 0.95],
          "line-dasharray": [2.5, 2],
          "line-opacity": 0.58,
        },
      },
    ];
    for (const def of appleMapLayers) {
      if (!map.getLayer(def.id)) {
        map.addLayer({ source: "openmaptiles", ...def });
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
        "line-color": "#7bbbef",
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
        "line-color": "#55a4e5",
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
        "text-color": "#3d7cb0",
        "text-halo-color": "rgba(255, 255, 255, 0.88)",
        "text-halo-width": 1.4,
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
          "text-color": "#6186a6",
          "text-halo-color": "rgba(215, 236, 250, 0.8)",
          "text-halo-width": 1.3,
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
          "text-color": "#4f555c",
          "text-halo-color": "rgba(255, 255, 255, 0.88)",
          "text-halo-width": 1.4,
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
          "text-color": "#737980",
          "text-halo-color": "rgba(255, 255, 255, 0.88)",
          "text-halo-width": 1.3,
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
          "circle-color": "#18191a",
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
          "text-color": "#34393e",
          "text-halo-color": "rgba(255, 255, 255, 0.94)",
          "text-halo-width": 1.8,
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
          "circle-color": "#18191a",
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
          "text-color": "#3e4348",
          "text-halo-color": "rgba(255, 255, 255, 0.94)",
          "text-halo-width": 1.8,
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
          "text-color": "#4b5055",
          "text-halo-color": "rgba(255, 255, 255, 0.92)",
          "text-halo-width": 1.6,
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
          "text-color": "#555a60",
          "text-halo-color": "rgba(255, 255, 255, 0.92)",
          "text-halo-width": 1.5,
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
          "text-color": "#636669",
          "text-halo-color": "rgba(244, 243, 239, 0.9)",
          "text-halo-width": 1.3,
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
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          1, 7.2,
          4, 6.0,
          8, 4.8,
          12, 3.8,
          16, 3.0,
        ],
        "circle-color": [
          "match",
          ["get", "cat"],
          "unesco", SITE_COLORS.unesco,
          "restoration", SITE_COLORS.restoration,
          "mostvisited", SITE_COLORS.mostvisited,
          "underfunded", SITE_COLORS.underfunded,
          "funded", SITE_COLORS.funded,
          "uncovered", SITE_COLORS.uncovered,
          SITE_COLORS.national,
        ],
        "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 1, 0.4, 8, 0.85],
        "circle-stroke-color": "#ffffff",
        "circle-opacity": 0.92,
      },
    });

    // India-parity crisp canvas exclamation badge icon for poorly covered sites
    if (typeof document !== "undefined" && map.addImage && !map.hasImage?.("uncovered-excl")) {
      const sz = 28;
      const cv = document.createElement("canvas");
      cv.width = sz;
      cv.height = sz;
      const g = cv.getContext("2d");
      g.beginPath();
      g.arc(sz / 2, sz / 2, sz / 2 - 2.5, 0, Math.PI * 2);
      g.fillStyle = "#ffffff";
      g.fill();
      g.lineWidth = 2.4;
      g.strokeStyle = "#64748b";
      g.stroke();
      g.fillStyle = "#475569";
      g.font = "900 17px Karla, -apple-system, BlinkMacSystemFont, sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("!", sz / 2, sz / 2 + 1);
      map.addImage("uncovered-excl", g.getImageData(0, 0, sz, sz), { pixelRatio: 2 });
    }

    map.addLayer({
      id: "monuments-uncovered-excl",
      type: "symbol",
      source: "monuments-vt",
      "source-layer": "monuments",
      filter: ["==", ["get", "uncov"], 1],
      minzoom: 5.2,
      layout: {
        "icon-image": "uncovered-excl",
        "icon-size": ["interpolate", ["linear"], ["zoom"], 2.2, 0.52, 5.5, 0.62, 10, 0.78, 14, 0.92],
        "icon-allow-overlap": false,
        "icon-padding": 3,
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

  // Magnetic snap query: checks active visible dots and picks closest Euclidean hit
  const findSnapFeature = (point) => {
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
          const d = Math.hypot(sp.x - point.x, sp.y - point.y);
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
    const src = map.getSource("hovered-site");
    if (src && lastHoverKey) src.setData({ type: "FeatureCollection", features: [] });
    lastHoverKey = "";
  };

  map.on("mousemove", (ev) => {
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
        p.unesco
          ? "UNESCO World Heritage"
          : p.inRestoration
            ? "In Danger / Restoration"
            : p.coverageStatus === "uncovered"
              ? "! Poorly Covered"
              : p.siteType;
      const imgUrl = p.image || (f.properties && f.properties.imgU) || "";
      const imgHtml = imgUrl ? `<img class="tooltip-img" src="${escapeHtml(imgUrl)}" alt="" loading="eager" />` : "";
      showTooltip(
        hit.screenPoint,
        `${imgHtml}<div class="tooltip-title">${escapeHtml(p.name)}</div>
         <div class="tooltip-meta">${escapeHtml([p.country || p.region, badge].filter(Boolean).join(" · "))}</div>`
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

  map.on("moveend", schedulePhotoPins);
  map.on("sourcedata", (ev) => {
    if (ev.sourceId === "monuments-vt" && ev.isSourceLoaded) schedulePhotoPins();
  });
}

// ---------- Country & Legend Filtering ----------
async function selectCountryFilter(iso3) {
  state.activeCountry = iso3 || "";
  state.activeRegion = "";
  elCountry.value = state.activeCountry;

  if (!state.activeCountry) {
    elRegionGroup.classList.add("hidden");
    elRegion.innerHTML = `<option value="">All Regions</option>`;
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
  } else {
    elRegionGroup.classList.add("hidden");
  }
  applyFilters();
  renderCoveragePanel();
}

function setActiveFilter(filterKey) {
  state.activeFilter = state.activeFilter === filterKey && filterKey !== "all" ? "all" : filterKey;
  if (elToggleContested && filterKey === "contested") {
    state.contestedOnly = state.activeFilter === "contested";
    elToggleContested.checked = state.contestedOnly;
  }
  document.querySelectorAll("#legend-bar .legend-btn").forEach((btn) => {
    const isAct = btn.dataset.legendFilter === state.activeFilter;
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
  elSearchToggleBtn.setAttribute("aria-expanded", "false");
}

function getLocalSearchMatches(q) {
  const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return state.searchTop.slice(0, 10);

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
    const hay = `${s.name} ${s.country} ${s.region || ""} ${s.unesco || ""} ${s.siteType || ""}`.toLowerCase();
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
    const remoteHits = [];
    for (const qid of ids) {
      const ent = entData.entities?.[qid];
      const coord = ent?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
      if (!coord || coord.latitude === undefined || coord.longitude === undefined) continue;
      remoteHits.push({
        qid,
        name: ent.labels?.en?.value || qid,
        coords: [coord.longitude, coord.latitude],
        country: "",
        siteType: ent.descriptions?.en?.value || "Heritage Site",
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
  const [summary, countriesGeo, unescoWorld, searchTop, contestedGeo, indiaExtras, riversGeo] = await preloadDataPromise;
  state.worldSummary = summary;
  state.countriesGeo = countriesGeo;
  state.unescoWorld = unescoWorld || {};
  state.searchTop = searchTop || [];
  state.contestedGeo = contestedGeo;
  state.indiaExtras = indiaExtras;
  state.riversGeo = riversGeo;

  elCountry.innerHTML =
    `<option value="">All Countries &amp; Territories (${summary.countriesCount})</option>` +
    summary.countries
      .map((c) => `<option value="${escapeHtml(c.iso3)}">${escapeHtml(c.name)} (${c.total.toLocaleString()})</option>`)
      .join("");

  updateCounterDisplay();
  renderCoveragePanel();

  if (map.isStyleLoaded()) attachOverlayLayers();
  else map.once("load", attachOverlayLayers);
}

init();

elCountry.addEventListener("change", () => selectCountryFilter(elCountry.value));
elRegion.addEventListener("change", () => {
  state.activeRegion = elRegion.value;
  applyFilters();
});
elTogglePhotos.addEventListener("change", () => {
  state.photosOnly = elTogglePhotos.checked;
  applyFilters();
});
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

document.querySelectorAll("#timeline-bar .timeline-pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    const era = btn.dataset.era || "all";
    state.activeEra = state.activeEra === era && era !== "all" ? "all" : era;
    document.querySelectorAll("#timeline-bar .timeline-pill").forEach((p) => {
      const act = p.dataset.era === state.activeEra;
      p.classList.toggle("active", act);
      p.setAttribute("aria-pressed", String(act));
    });
    applyFilters();
  });
});

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

document.getElementById("reset-view-btn").addEventListener("click", () => {
  selectCountryFilter("");
});

document.getElementById("collapse-sidebar-btn").addEventListener("click", () => {
  elLeftPanel.classList.add("collapsed");
  elReopenSidebar.classList.remove("hidden");
  map.easeTo({ padding: getGlobePadding(), duration: 280 });
});
elReopenSidebar.addEventListener("click", () => {
  elLeftPanel.classList.remove("collapsed");
  elReopenSidebar.classList.add("hidden");
  map.easeTo({ padding: getGlobePadding(), duration: 280 });
});

document.getElementById("close-drawer").addEventListener("click", closeDetailDrawer);
document.getElementById("toggle-sources-btn").addEventListener("click", () => {
  document.getElementById("sources-panel").classList.toggle("hidden");
  elBudgetPanel.classList.add("hidden");
});
document.getElementById("close-sources-btn").addEventListener("click", () => document.getElementById("sources-panel").classList.add("hidden"));
document.getElementById("toggle-budgets-btn").addEventListener("click", () => {
  document.getElementById("sources-panel").classList.add("hidden");
  elBudgetPanel.classList.toggle("hidden");
});
document.getElementById("close-budgets-btn").addEventListener("click", () => elBudgetPanel.classList.add("hidden"));

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
