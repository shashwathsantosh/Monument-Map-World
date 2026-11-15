#!/usr/bin/env python3
"""
Harvests for all atlas monuments via fast QLever POST batches:
1. English `schema:description` (`compiled_descriptions.json`) for the ~102K monuments missing `desc`.
2. Missing `en.wikipedia.org` links (`compiled_enwiki.json`) & `wdt:P18` Commons images (`compiled_p18_backfill.json`).
3. Structured dated Conservation, Restoration, Reconstruction & Archaeological Excavation events (`P793` with
   `P585`/`P580` qualifiers -> `compiled_restoration_events.json`) so thousands of monuments worldwide surface
   verified historical restoration/excavation milestones!
"""

from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "public" / "data"
CACHE_DIR = ROOT / "scripts" / ".cache"

QLEVER_URL = "https://qlever.dev/api/wikidata"
UA = "ArchitectureMonumentAtlas/2.0 (https://localhost:8766)"


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


def collect_atlas_qids() -> tuple[list[str], list[str], list[str]]:
    all_qids: set[str] = set()
    missing_desc: set[str] = set()
    missing_img: set[str] = set()

    for p in (DATA_DIR / "countries").glob("*.json"):
        for it in json.loads(p.read_text(encoding="utf-8")):
            q = it.get("qid")
            if not q:
                continue
            all_qids.add(q)
            if not it.get("desc"):
                missing_desc.add(q)
            if not it.get("image"):
                missing_img.add(q)

    for cf in ("qlever_missing_p17.json", "qlever_missing_p131.json", "qlever_sparse_arch_bulk_v1.json"):
        fp = CACHE_DIR / cf
        if not fp.exists():
            continue
        for r in json.loads(fp.read_text(encoding="utf-8")).get("results", {}).get("bindings", []):
            uri = r.get("item", {}).get("value", "")
            q = uri.rsplit("/", 1)[-1] if "/Q" in uri else ""
            if q:
                all_qids.add(q)
                if not r.get("desc", {}).get("value"):
                    missing_desc.add(q)
                if not r.get("img", {}).get("value"):
                    missing_img.add(q)

    return sorted(all_qids), sorted(missing_desc), sorted(missing_img)


def main():
    all_qids, missing_desc, missing_img = collect_atlas_qids()
    print(f"Atlas QIDs={len(all_qids):,} | missing desc={len(missing_desc):,} | missing img={len(missing_img):,}")
    batch = 15000

    # 1. Descriptions
    desc_out = CACHE_DIR / "compiled_descriptions.json"
    if not desc_out.exists():
        t0 = time.time()
        dmap: dict[str, str] = {}
        for i in range(0, len(missing_desc), batch):
            vals = " ".join(f"wd:{q}" for q in missing_desc[i : i + batch])
            q_desc = f"""
            PREFIX wd: <http://www.wikidata.org/entity/>
            PREFIX schema: <http://schema.org/>
            SELECT ?item ?d WHERE {{
              VALUES ?item {{ {vals} }}
              ?item schema:description ?d .
              FILTER(LANG(?d) = "en")
            }}
            """
            for r in qlever_post(q_desc):
                q = r["item"]["value"].rsplit("/", 1)[-1]
                val = (r.get("d", {}).get("value") or "").strip()
                if q and val and q not in dmap:
                    dmap[q] = val
        desc_out.write_text(json.dumps(dmap, separators=(",", ":")), encoding="utf-8")
        print(f"1. Backfilled English descriptions for {len(dmap):,} monuments in {time.time() - t0:.1f}s")

    # 2. Missing enwiki & Commons images
    wp_out = CACHE_DIR / "compiled_enwiki.json"
    img_out = CACHE_DIR / "compiled_p18_backfill.json"
    if not wp_out.exists() or not img_out.exists():
        t0 = time.time()
        wpmap: dict[str, str] = {}
        for i in range(0, len(all_qids), batch):
            vals = " ".join(f"wd:{q}" for q in all_qids[i : i + batch])
            q_wp = f"""
            PREFIX wd: <http://www.wikidata.org/entity/>
            PREFIX schema: <http://schema.org/>
            SELECT ?item ?art WHERE {{
              VALUES ?item {{ {vals} }}
              ?art schema:about ?item ;
                   schema:isPartOf <https://en.wikipedia.org/> .
            }}
            """
            for r in qlever_post(q_wp):
                q = r["item"]["value"].rsplit("/", 1)[-1]
                art = (r.get("art", {}).get("value") or "").strip()
                if q and art and q not in wpmap:
                    wpmap[q] = art
        wp_out.write_text(json.dumps(wpmap, separators=(",", ":")), encoding="utf-8")

        imap: dict[str, str] = {}
        for i in range(0, len(missing_img), batch):
            vals = " ".join(f"wd:{q}" for q in missing_img[i : i + batch])
            q_im = f"""
            PREFIX wd: <http://www.wikidata.org/entity/>
            PREFIX wdt: <http://www.wikidata.org/prop/direct/>
            SELECT ?item ?img WHERE {{
              VALUES ?item {{ {vals} }}
              ?item wdt:P18 ?img .
            }}
            """
            for r in qlever_post(q_im):
                q = r["item"]["value"].rsplit("/", 1)[-1]
                im = (r.get("img", {}).get("value") or "").strip()
                if q and im and q not in imap:
                    if "Special:FilePath" in im and "width=" not in im:
                        im = f"{im}?width=720"
                    imap[q] = im
        img_out.write_text(json.dumps(imap, separators=(",", ":")), encoding="utf-8")
        print(f"2. Matched {len(wpmap):,} enwiki links & {len(imap):,} backfilled Commons photos in {time.time() - t0:.1f}s")

    # 3. Structured Conservation, Restoration, Reconstruction & Excavation Events (P793)
    ev_out = CACHE_DIR / "compiled_restoration_events.json"
    if not ev_out.exists():
        t0 = time.time()
        ev_map: dict[str, list[dict]] = {}
        # Conservation, restoration, reconstruction, archaeological excavation, rebuilding, renovation, structural repair, war/earthquake damage
        keep_ev_re = re.compile(
            r"\b(restor|conserv|reconstruct|excavat|renovat|rebuild|rehabilitat|repair|unesco|damage|fire|earthquake|siege|stabiliz)\b",
            re.I,
        )
        skip_ev_re = re.compile(r"\b(construction|opening|inauguration|groundbreaking|foundation|christening|consecration)\b", re.I)

        for i in range(0, len(all_qids), batch):
            vals = " ".join(f"wd:{q}" for q in all_qids[i : i + batch])
            q_ev = f"""
            PREFIX wd: <http://www.wikidata.org/entity/>
            PREFIX p: <http://www.wikidata.org/prop/>
            PREFIX ps: <http://www.wikidata.org/prop/statement/>
            PREFIX pq: <http://www.wikidata.org/prop/qualifier/>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            SELECT ?item ?evLbl ?dt ?st WHERE {{
              VALUES ?item {{ {vals} }}
              ?item p:P793 ?stmt .
              ?stmt ps:P793 ?ev .
              ?ev rdfs:label ?evLbl .
              FILTER(LANG(?evLbl) = "en")
              OPTIONAL {{ ?stmt pq:P585 ?dt . }}
              OPTIONAL {{ ?stmt pq:P580 ?st . }}
            }}
            """
            for r in qlever_post(q_ev):
                q = r["item"]["value"].rsplit("/", 1)[-1]
                lbl = (r.get("evLbl", {}).get("value") or "").strip()
                if not lbl or not keep_ev_re.search(lbl) or skip_ev_re.search(lbl):
                    continue
                raw_dt = (r.get("dt", {}).get("value") or r.get("st", {}).get("value") or "").strip()
                m = re.match(r"^([12]\d{3})-", raw_dt)
                if not m:
                    continue
                yr = int(m.group(1))
                if not (1400 <= yr <= 2026):
                    continue
                lst = ev_map.setdefault(q, [])
                cap_lbl = lbl[0].upper() + lbl[1:]
                if not any(x["year"] == yr and x["label"].lower() == cap_lbl.lower() for x in lst):
                    lst.append({"year": yr, "label": cap_lbl})

        for q, lst in ev_map.items():
            lst.sort(key=lambda x: x["year"])
        ev_out.write_text(json.dumps(ev_map, separators=(",", ":")), encoding="utf-8")
        print(f"3. Matched structured dated P793 conservation/excavation events for {len(ev_map):,} monuments in {time.time() - t0:.1f}s")


if __name__ == "__main__":
    main()
