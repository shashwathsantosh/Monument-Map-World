#!/usr/bin/env node
/**
 * Build a spec-compliant PMTiles v3 vector-tile archive (public/data/monuments.pmtiles)
 * from scripts/.cache/monuments_for_pmtiles.geojson using geojson-vt + vt-pbf + pmtiles.
 */

import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";
import { createRequire } from "module";

import geojsonvt from "geojson-vt";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vtpbf = require("vt-pbf");
const { PMTiles, Compression, TileType, zxyToTileId } = require("pmtiles");

const ROOT = path.resolve(__dirname, "..");
const INPUT_GEOJSON = path.join(ROOT, "scripts", ".cache", "monuments_for_pmtiles.geojson");
const OUTPUT_PMTILES = path.join(ROOT, "public", "data", "monuments.pmtiles");
const MAX_ZOOM = 8;

function writeVarint(out, val) {
  let v = BigInt(val);
  while (v >= 0x80n) {
    out.push(Number((v & 0x7fn) | 0x80n));
    v >>= 7n;
  }
  out.push(Number(v));
}

function serializeDirectory(entries) {
  const bytes = [];
  writeVarint(bytes, entries.length);

  let lastId = 0;
  for (const e of entries) {
    writeVarint(bytes, e.tileId - lastId);
    lastId = e.tileId;
  }
  for (const e of entries) {
    writeVarint(bytes, e.runLength);
  }
  for (const e of entries) {
    writeVarint(bytes, e.length);
  }
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (i > 0 && e.offset === entries[i - 1].offset + entries[i - 1].length) {
      writeVarint(bytes, 0);
    } else {
      writeVarint(bytes, e.offset + 1);
    }
  }
  return zlib.gzipSync(Buffer.from(bytes), { level: 9 });
}

class NodeFileSource {
  constructor(filePath) {
    this.fd = fs.openSync(filePath, "r");
  }
  getKey() {
    return "local-pmtiles";
  }
  async getBytes(offset, length) {
    const buf = Buffer.alloc(length);
    const bytesRead = fs.readSync(this.fd, buf, 0, length, offset);
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + bytesRead);
    return { data: ab };
  }
  close() {
    fs.closeSync(this.fd);
  }
}

async function main() {
  if (!fs.existsSync(INPUT_GEOJSON)) {
    throw new Error(`Missing input GeoJSON: ${INPUT_GEOJSON}`);
  }
  const t0 = Date.now();
  console.log("Reading GeoJSON intermediate...");
  const fc = JSON.parse(fs.readFileSync(INPUT_GEOJSON, "utf8"));
  console.log(`Loaded ${fc.features.length} features in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  // Zoom-tiered geojson-vt indexes keep z0..z5 lightweight and crisp while z6..z10 retain every point
  const tiers = [
    { minZ: 0, maxZ: 1, maxMz: 0 },
    { minZ: 2, maxZ: 3, maxMz: 2 },
    { minZ: 4, maxZ: 4, maxMz: 4 },
    { minZ: 5, maxZ: 5, maxMz: 5 },
    { minZ: 6, maxZ: MAX_ZOOM, maxMz: 99 },
  ];

  const tiles = [];
  for (const tier of tiers) {
    const subset = {
      type: "FeatureCollection",
      features: fc.features.filter((f) => (f.properties.mz ?? 6) <= tier.maxMz),
    };
    const tileIndex = new geojsonvt(subset, {
      maxZoom: tier.maxZ,
      indexMaxZoom: tier.maxZ,
      indexMaxPoints: 0,
      tolerance: 2,
      extent: 4096,
      buffer: 64,
    });

    for (let z = tier.minZ; z <= tier.maxZ; z++) {
      // Enumerate only non-empty tiles covered by geojson-vt tile coords
      for (const idStr of Object.keys(tileIndex.tiles)) {
        const t = tileIndex.tiles[idStr];
        if (!t || t.z !== z || !t.features || !t.features.length) continue;
        const vtTile = tileIndex.getTile(t.z, t.x, t.y);
        if (!vtTile || !vtTile.features || !vtTile.features.length) continue;
        const pbf = vtpbf.fromGeojsonVt({ monuments: vtTile });
        const gz = zlib.gzipSync(Buffer.from(pbf), { level: 6 });
        tiles.push({
          tileId: zxyToTileId(t.z, t.x, t.y),
          z: t.z,
          x: t.x,
          y: t.y,
          buf: gz,
        });
      }
    }
    console.log(`Tier z${tier.minZ}-z${tier.maxZ} (${subset.features.length} feats): cumulative ${tiles.length} tiles`);
  }

  tiles.sort((a, b) => a.tileId - b.tileId);

  // Deduplicate identical consecutive or global tile buffers? Keep sequential layout cleanly
  let tileOffset = 0;
  const tileEntries = [];
  for (const t of tiles) {
    tileEntries.push({
      tileId: t.tileId,
      offset: tileOffset,
      length: t.buf.length,
      runLength: 1,
    });
    tileOffset += t.buf.length;
  }

  const metadataObj = {
    name: "Monument Map Atlas (Global)",
    description: "Global Heritage & Conservation Atlas vector tiles (all countries + UNESCO + India ASI)",
    version: "1.0.0",
    minzoom: "0",
    maxzoom: String(MAX_ZOOM),
    vector_layers: [
      {
        id: "monuments",
        minzoom: 0,
        maxzoom: MAX_ZOOM,
        fields: {
          qid: "String",
          name: "String",
          cIso: "String",
          country: "String",
          reg: "String",
          st: "String",
          img: "Number",
          imgUrl: "String",
          wp: "String",
          un: "Number",
          unName: "String",
          unId: "String",
          danger: "Number",
          rest: "Number",
          uf: "Number",
          fund: "Number",
          mv: "Number",
          uncov: "Number",
          sl: "Number",
          mz: "Number",
          cat: "String",
          pr: "Number",
        },
      },
    ],
  };
  const metadataGz = zlib.gzipSync(Buffer.from(JSON.stringify(metadataObj), "utf8"), { level: 9 });

  // Build root + optional leaf directories so header + root <= 16384 bytes
  let rootGz = serializeDirectory(tileEntries);
  let leavesBuf = Buffer.alloc(0);
  if (127 + rootGz.length > 16384) {
    const leafChunks = [];
    const rootEntries = [];
    let leafSize = 4096;
    while (true) {
      leafChunks.length = 0;
      rootEntries.length = 0;
      let leafOff = 0;
      for (let i = 0; i < tileEntries.length; i += leafSize) {
        const slice = tileEntries.slice(i, i + leafSize);
        const gz = serializeDirectory(slice);
        rootEntries.push({
          tileId: slice[0].tileId,
          offset: leafOff,
          length: gz.length,
          runLength: 0,
        });
        leafChunks.push(gz);
        leafOff += gz.length;
      }
      rootGz = serializeDirectory(rootEntries);
      if (127 + rootGz.length <= 16384 || leafSize >= tileEntries.length) break;
      leafSize *= 2;
    }
    leavesBuf = Buffer.concat(leafChunks);
  }

  const rootDirectoryOffset = 127n;
  const rootDirectoryLength = BigInt(rootGz.length);
  const jsonMetadataOffset = rootDirectoryOffset + rootDirectoryLength;
  const jsonMetadataLength = BigInt(metadataGz.length);
  const leafDirectoryOffset = jsonMetadataOffset + jsonMetadataLength;
  const leafDirectoryLength = BigInt(leavesBuf.length);
  const tileDataOffset = leafDirectoryOffset + leafDirectoryLength;
  const tileDataLength = BigInt(tileOffset);

  const header = Buffer.alloc(127);
  header.write("PMTiles", 0, "ascii");
  header.writeUInt8(3, 7);
  header.writeBigUInt64LE(rootDirectoryOffset, 8);
  header.writeBigUInt64LE(rootDirectoryLength, 16);
  header.writeBigUInt64LE(jsonMetadataOffset, 24);
  header.writeBigUInt64LE(jsonMetadataLength, 32);
  header.writeBigUInt64LE(leafDirectoryOffset, 40);
  header.writeBigUInt64LE(leafDirectoryLength, 48);
  header.writeBigUInt64LE(tileDataOffset, 56);
  header.writeBigUInt64LE(tileDataLength, 64);
  header.writeBigUInt64LE(BigInt(tileEntries.length), 72);
  header.writeBigUInt64LE(BigInt(tileEntries.length), 80);
  header.writeBigUInt64LE(BigInt(tileEntries.length), 88);
  header.writeUInt8(1, 96); // clustered
  header.writeUInt8(Compression.Gzip, 97);
  header.writeUInt8(Compression.Gzip, 98);
  header.writeUInt8(TileType.Mvt, 99);
  header.writeUInt8(0, 100); // minZoom
  header.writeUInt8(MAX_ZOOM, 101); // maxZoom
  header.writeInt32LE(Math.round(-180 * 1e7), 102);
  header.writeInt32LE(Math.round(-85 * 1e7), 106);
  header.writeInt32LE(Math.round(180 * 1e7), 110);
  header.writeInt32LE(Math.round(85 * 1e7), 114);
  header.writeUInt8(2, 118); // centerZoom
  header.writeInt32LE(Math.round(20 * 1e7), 119);
  header.writeInt32LE(Math.round(20 * 1e7), 123);

  const fd = fs.openSync(OUTPUT_PMTILES, "w");
  fs.writeSync(fd, header);
  fs.writeSync(fd, rootGz);
  fs.writeSync(fd, metadataGz);
  if (leavesBuf.length) fs.writeSync(fd, leavesBuf);
  for (const t of tiles) {
    fs.writeSync(fd, t.buf);
  }
  fs.closeSync(fd);

  const stat = fs.statSync(OUTPUT_PMTILES);
  console.log(`Wrote ${OUTPUT_PMTILES} (${(stat.size / (1024 * 1024)).toFixed(2)} MB, ${tiles.length} tiles, leafBytes=${leavesBuf.length})`);

  // Verify readability using pmtiles JS reader
  const src = new NodeFileSource(OUTPUT_PMTILES);
  const archive = new PMTiles(src);
  const hdr = await archive.getHeader();
  const meta = await archive.getMetadata();
  const z0 = await archive.getZxy(0, 0, 0);
  src.close();
  console.log(
    `Verified PMTiles v${hdr.specVersion}: minZ=${hdr.minZoom} maxZ=${hdr.maxZoom} entries=${hdr.numTileEntries} z0Bytes=${z0?.data?.byteLength || 0} layers=${meta.vector_layers?.map((l) => l.id).join(",")}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
