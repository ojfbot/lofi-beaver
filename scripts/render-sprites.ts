/**
 * render-sprites.ts — drive headless Blender over asset-foundry/sprites.yaml.
 *
 * For each manifest entry (optionally filtered by id args):
 *   blender --background --python asset-foundry/fixtures/<id>.py -- dist/sprites/<id>_v1.png
 * Parses the fixture's FOUNDRY_SUMMARY line, cross-checks it against the
 * manifest, writes <id>_v1.sprite.json, and syncs PNG+JSON into
 * public/assets/sprites/. Mirrors asset-foundry's SubprocessTransport posture.
 *
 *   pnpm sprites              # all
 *   pnpm sprites tile_water   # one
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";

const execFileAsync = promisify(execFile);

const ROOT = path.resolve(import.meta.dirname, "..");
const FOUNDRY_DIR = path.join(ROOT, "asset-foundry");
const DIST_DIR = path.join(FOUNDRY_DIR, "dist", "sprites");
const PUBLIC_DIR = path.join(ROOT, "public", "assets", "sprites");
const BLENDER_BIN =
  process.env.BLENDER_BIN ?? "/Applications/Blender.app/Contents/MacOS/Blender";

interface SpriteEntry {
  id: string;
  kind: "sprite" | "vignette";
  canvas_px: [number, number];
  frames: number;
  footprint: [number, number];
}

interface FoundrySummary {
  asset_id: string;
  kind: string;
  pixel_size: [number, number];
  frame: { count: number; w: number; h: number };
  anchor_px: [number, number];
  tile_footprint: [number, number];
  palette_independent: boolean;
  ppu: number;
  camera: { yaw_deg: number; elev_deg: number };
  ink_coverage_per_frame: number[];
  blender: string;
}

async function renderOne(entry: SpriteEntry): Promise<void> {
  const fixture = path.join(FOUNDRY_DIR, "fixtures", `${entry.id}.py`);
  const outPng = path.join(DIST_DIR, `${entry.id}_v1.png`);
  await mkdir(DIST_DIR, { recursive: true });

  const { stdout } = await execFileAsync(
    BLENDER_BIN,
    ["--background", "--python", fixture, "--", outPng],
    { timeout: 180_000, maxBuffer: 16 * 1024 * 1024 },
  );

  const summaryLine = stdout
    .split("\n")
    .find((line) => line.startsWith("FOUNDRY_SUMMARY "));
  if (!summaryLine) {
    throw new Error(`${entry.id}: fixture emitted no FOUNDRY_SUMMARY`);
  }
  const summary = JSON.parse(
    summaryLine.slice("FOUNDRY_SUMMARY ".length),
  ) as FoundrySummary;

  if (summary.asset_id !== entry.id) {
    throw new Error(`${entry.id}: summary asset_id mismatch (${summary.asset_id})`);
  }
  if (summary.frame.count !== entry.frames) {
    throw new Error(
      `${entry.id}: manifest frames=${entry.frames}, fixture rendered ${summary.frame.count}`,
    );
  }
  if (
    summary.frame.w !== entry.canvas_px[0] ||
    summary.frame.h !== entry.canvas_px[1]
  ) {
    throw new Error(
      `${entry.id}: manifest canvas ${entry.canvas_px}, fixture rendered ${summary.frame.w}x${summary.frame.h}`,
    );
  }

  const spriteJsonPath = path.join(DIST_DIR, `${entry.id}_v1.sprite.json`);
  await writeFile(spriteJsonPath, JSON.stringify(summary, null, 2) + "\n");

  await mkdir(PUBLIC_DIR, { recursive: true });
  await cp(outPng, path.join(PUBLIC_DIR, `${entry.id}_v1.png`));
  await cp(spriteJsonPath, path.join(PUBLIC_DIR, `${entry.id}_v1.sprite.json`));
  console.log(
    `✓ ${entry.id} — ${summary.pixel_size[0]}x${summary.pixel_size[1]}, ` +
      `${summary.frame.count} frame(s), coverage ${summary.ink_coverage_per_frame.join("/")}`,
  );
}

async function main(): Promise<void> {
  const manifestRaw = await readFile(path.join(FOUNDRY_DIR, "sprites.yaml"), "utf8");
  const manifest = parseYaml(manifestRaw) as { sprites: SpriteEntry[] };
  const filter = process.argv.slice(2);
  const entries = filter.length
    ? manifest.sprites.filter((s) => filter.includes(s.id))
    : manifest.sprites;
  if (filter.length && entries.length !== filter.length) {
    const known = new Set(entries.map((e) => e.id));
    throw new Error(`unknown sprite id(s): ${filter.filter((f) => !known.has(f)).join(", ")}`);
  }

  let failed = 0;
  for (const entry of entries) {
    try {
      await renderOne(entry);
    } catch (err) {
      failed += 1;
      console.error(`✗ ${entry.id}: ${(err as Error).message}`);
    }
  }
  if (failed > 0) {
    console.error(`${failed}/${entries.length} sprite(s) failed`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
