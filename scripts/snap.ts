// Headless screenshot of the dev server. Iteration loop while building visuals.
// Adapted from beaverGame/scripts/snap.ts.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const URL = process.env.SNAP_URL ?? "http://localhost:5180/";
const OUT = process.env.SNAP_OUT ?? "tmp/snap.png";
const VIEWPORT = { width: 1280, height: 800 };
const SETTLE_MS = Number(process.env.SNAP_SETTLE_MS ?? 1500);

(async () => {
  mkdirSync("tmp", { recursive: true });

  // SNAP_SOFT_GL=1: software WebGL — survives GPU contention from concurrent
  // agent sessions (real-GPU context losses show as "WebGL Graphics Context Lost").
  const browser = await chromium.launch(
    process.env.SNAP_SOFT_GL
      ? { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }
      : {},
  );
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  const consoleLines: string[] = [];
  page.on("console", (msg) => {
    consoleLines.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on("pageerror", (err) => {
    consoleLines.push(`[pageerror] ${err.message}`);
  });

  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(SETTLE_MS);

  // Optional: jump to a specific puzzle by repeatedly invoking scene.advance().
  const jumpIndex = Number(process.env.SNAP_PUZZLE_INDEX ?? "0");
  if (Number.isFinite(jumpIndex) && jumpIndex > 0) {
    await page.evaluate((n) => {
      const w = window as unknown as {
        __lofi?: { scene?: { state: { kind: string }; advance?: () => void; index?: number } };
      };
      const scene = w.__lofi?.scene;
      if (!scene) return;
      // advance() requires win-state; force the scene through `won` by mutating state.
      for (let i = 0; i < n; i++) {
        scene.state = { kind: "won" } as { kind: string };
        scene.advance?.();
      }
    }, jumpIndex);
    await page.waitForTimeout(400);
  }

  // Optional scenario: SNAP_SCENARIO=dam-place
  // Clicks to place dams at coordinates listed in SNAP_DAMS
  // (semicolon-separated `x,y` pairs in tile coords). Verifies state via probe.
  const scenario = process.env.SNAP_SCENARIO;
  if (scenario === "dam-place") {
    const dams = (process.env.SNAP_DAMS ?? "")
      .split(";")
      .map((s) => s.split(",").map(Number) as [number, number])
      .filter((p) => p.length === 2 && Number.isFinite(p[0]!) && Number.isFinite(p[1]!));

    for (const [tx, ty] of dams) {
      const screenPos = await page.evaluate(([x, y]) => {
        const w = window as unknown as {
          __lofi?: {
            game?: { canvas: HTMLCanvasElement };
            scene?: { tileToWorld: (x: number, y: number) => { wx: number; wy: number } };
          };
        };
        const canvas = w.__lofi?.game?.canvas;
        const scene = w.__lofi?.scene;
        if (!canvas || !scene?.tileToWorld) return null;
        const { wx, wy } = scene.tileToWorld(x, y);
        const rect = canvas.getBoundingClientRect();
        const sx = rect.left + (wx / canvas.width) * rect.width;
        const sy = rect.top + (wy / canvas.height) * rect.height;
        return { sx, sy };
      }, [tx, ty] as [number, number]);
      if (!screenPos) continue;
      await page.mouse.click(screenPos.sx, screenPos.sy);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(800);
  }

  const buf = await page.screenshot({ type: "png" });
  writeFileSync(OUT, buf);
  writeFileSync(join("tmp", "snap.console.txt"), consoleLines.join("\n"));

  const probe = await page.evaluate(() => {
    const w = window as unknown as {
      __lofi?: {
        game?: { currentSceneName?: string; drawWidth?: number; drawHeight?: number };
        scene?: {
          ticks?: number;
          wetCount?: () => number;
          damsPlaced?: number;
          elapsed?: number;
          state?: { kind: string; reason?: string };
          config?: {
            sources: Array<[number, number]>;
            target: [number, number];
            damBudget: number;
            timeLimit: number;
          };
          grid?: { width: number; height: number };
        };
      };
    };
    if (!w.__lofi?.game) return { loaded: false };
    return {
      loaded: true,
      currentScene: w.__lofi.game.currentSceneName ?? null,
      drawWidth: w.__lofi.game.drawWidth ?? null,
      drawHeight: w.__lofi.game.drawHeight ?? null,
      ticks: w.__lofi.scene?.ticks ?? null,
      wetCount: w.__lofi.scene?.wetCount?.() ?? null,
      damsPlaced: w.__lofi.scene?.damsPlaced ?? null,
      damBudget: w.__lofi.scene?.config?.damBudget ?? null,
      elapsed: w.__lofi.scene?.elapsed ?? null,
      state: w.__lofi.scene?.state ?? null,
      sources: w.__lofi.scene?.config?.sources ?? null,
      target: w.__lofi.scene?.config?.target ?? null,
      gridSize: w.__lofi.scene?.grid ? `${w.__lofi.scene.grid.width}x${w.__lofi.scene.grid.height}` : null,
    };
  });

  console.log(`saved ${OUT}`);
  console.log("probe:", JSON.stringify(probe, null, 2));
  console.log(`console lines: ${consoleLines.length}`);
  if (consoleLines.length) {
    console.log("─── console ───");
    console.log(consoleLines.slice(0, 30).join("\n"));
  }

  await browser.close();
})().catch((err) => {
  console.error("snap failed:", err);
  process.exit(1);
});
