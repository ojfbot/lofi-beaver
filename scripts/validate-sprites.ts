/**
 * validate-sprites.ts — deterministic sprite gates, the lofi twin of
 * asset-foundry's Validator. Writes <id>_v1.validation.json next to each
 * sprite under public/assets/sprites/; the game's loader refuses any PNG
 * whose sibling validation file is missing or not "validated".
 *
 * Gates (kind: sprite | vignette):
 *   dims      — PNG is exactly canvas_w×frames by canvas_h
 *   purity    — every pixel is exactly (0,0,0,0) or (255,255,255,255)
 *   coverage  — per-frame ink coverage within [0.01, 0.95]
 *   anchor    — anchor_px lies inside one frame's bounds
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PNG } from "pngjs";
import { parse as parseYaml } from "yaml";

const ROOT = path.resolve(import.meta.dirname, "..");
const FOUNDRY_DIR = path.join(ROOT, "asset-foundry");
const PUBLIC_DIR = path.join(ROOT, "public", "assets", "sprites");

interface SpriteEntry {
  id: string;
  kind: "sprite" | "vignette";
  canvas_px: [number, number];
  frames: number;
  footprint: [number, number];
}

interface GateResult {
  gate: string;
  pass: boolean;
  detail: string;
}

async function validateOne(entry: SpriteEntry): Promise<GateResult[]> {
  const pngPath = path.join(PUBLIC_DIR, `${entry.id}_v1.png`);
  const metaPath = path.join(PUBLIC_DIR, `${entry.id}_v1.sprite.json`);
  const png = PNG.sync.read(await readFile(pngPath));
  const meta = JSON.parse(await readFile(metaPath, "utf8"));

  const [fw, fh] = entry.canvas_px;
  const gates: GateResult[] = [];

  const wantW = fw * entry.frames;
  gates.push({
    gate: "dims",
    pass: png.width === wantW && png.height === fh,
    detail: `want ${wantW}x${fh}, got ${png.width}x${png.height}`,
  });

  let impure = 0;
  const inkPerFrame = new Array<number>(entry.frames).fill(0);
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const i = (png.width * y + x) * 4;
      const r = png.data[i] ?? 0;
      const g = png.data[i + 1] ?? 0;
      const b = png.data[i + 2] ?? 0;
      const a = png.data[i + 3] ?? 0;
      const isInk = r === 255 && g === 255 && b === 255 && a === 255;
      const isPaper = r === 0 && g === 0 && b === 0 && a === 255;
      const isVoid = a === 0;
      if (!isInk && !isPaper && !isVoid) impure += 1;
      if (isInk) inkPerFrame[Math.floor(x / fw)] = (inkPerFrame[Math.floor(x / fw)] ?? 0) + 1;
    }
  }
  gates.push({
    gate: "purity",
    pass: impure === 0,
    detail: impure === 0 ? "all pixels 1-bit" : `${impure} impure pixel(s)`,
  });

  const coverage = inkPerFrame.map((n) => n / (fw * fh));
  const coverageOk = coverage.every((c) => c >= 0.01 && c <= 0.95);
  gates.push({
    gate: "coverage",
    pass: coverageOk,
    detail: coverage.map((c) => c.toFixed(4)).join("/"),
  });

  const [ax, ay] = meta.anchor_px as [number, number];
  gates.push({
    gate: "anchor",
    pass: ax >= 0 && ax <= fw && ay >= 0 && ay <= fh,
    detail: `anchor (${ax}, ${ay}) in frame ${fw}x${fh}`,
  });

  const allPass = gates.every((g) => g.pass);
  await writeFile(
    path.join(PUBLIC_DIR, `${entry.id}_v1.validation.json`),
    JSON.stringify(
      {
        asset_id: entry.id,
        kind: entry.kind,
        status: allPass ? "validated" : "failed",
        gates,
        validated_with: "scripts/validate-sprites.ts",
        blender: meta.blender,
      },
      null,
      2,
    ) + "\n",
  );
  return gates;
}

async function main(): Promise<void> {
  const manifestRaw = await readFile(path.join(FOUNDRY_DIR, "sprites.yaml"), "utf8");
  const manifest = parseYaml(manifestRaw) as { sprites: SpriteEntry[] };
  const filter = process.argv.slice(2);
  const entries = filter.length
    ? manifest.sprites.filter((s) => filter.includes(s.id))
    : manifest.sprites;

  let failed = 0;
  for (const entry of entries) {
    try {
      const gates = await validateOne(entry);
      const bad = gates.filter((g) => !g.pass);
      if (bad.length) {
        failed += 1;
        console.error(`✗ ${entry.id}: ${bad.map((g) => `${g.gate} (${g.detail})`).join("; ")}`);
      } else {
        console.log(`✓ ${entry.id} validated`);
      }
    } catch (err) {
      failed += 1;
      console.error(`✗ ${entry.id}: ${(err as Error).message}`);
    }
  }
  if (failed > 0) {
    console.error(`${failed}/${entries.length} sprite(s) failed validation`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
