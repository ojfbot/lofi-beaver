/**
 * ci-visual-gate.ts — the 1-bit invariant, enforced in CI.
 *
 * Boots the PRODUCTION build (vite preview) in headless Chromium
 * (SwiftShader — no GPU in CI) and asserts:
 *
 *   1. The title screen renders with EXACTLY 2 RGB values (ADR-0007).
 *   2. A lab toy (?mode=lab&dyn=flood,dams — no clock, deterministic) boots,
 *      N-steps two nights, the flood sim advances (wetCount grows), and the
 *      world screenshot still contains EXACTLY 2 RGB values.
 *
 * Failure screenshots land in tmp/gate-*.png (uploaded as CI artifacts).
 * Run locally: pnpm gate:visual (after pnpm build).
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium, type Page } from "playwright";
import { PNG } from "pngjs";

const PORT = 4173;
const BASE = `http://localhost:${PORT}`;

function uniqueColors(buf: Buffer): Set<string> {
  const png = PNG.sync.read(buf);
  const colors = new Set<string>();
  for (let i = 0; i < png.data.length; i += 4) {
    colors.add(`${png.data[i]},${png.data[i + 1]},${png.data[i + 2]}`);
  }
  return colors;
}

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`preview server did not come up at ${url}`);
}

interface Failure {
  name: string;
  detail: string;
}

async function expectTwoColors(
  page: Page,
  name: string,
  failures: Failure[],
): Promise<void> {
  const buf = await page.screenshot({ type: "png" });
  const colors = uniqueColors(buf);
  if (colors.size !== 2) {
    writeFileSync(`tmp/gate-${name}.png`, buf);
    failures.push({
      name,
      detail: `expected exactly 2 RGB values, got ${colors.size}: ${[...colors].slice(0, 8).join(" | ")}`,
    });
  } else {
    console.log(`✓ ${name}: exactly 2 colors (${[...colors].join(" | ")})`);
  }
}

async function main(): Promise<void> {
  mkdirSync("tmp", { recursive: true });
  // detached → own process group, so teardown can kill the whole
  // pnpm → sh → node(vite) chain. server.kill() alone only reaches the pnpm
  // wrapper; the surviving vite child holds the stdio pipes open and keeps
  // this script's event loop alive forever — but only on the success path,
  // because the failure paths call process.exit(). CI burned the full 6h job
  // ceiling on every green gate before this.
  const server = spawn("pnpm", ["preview", "--port", String(PORT), "--strictPort"], {
    stdio: "pipe",
    detached: true,
  });
  const failures: Failure[] = [];
  let browser;
  try {
    await waitForServer(BASE);
    browser = await chromium.launch({
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    });
    const page = await (
      await browser.newContext({ viewport: { width: 1280, height: 800 } })
    ).newPage();
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    // Gate 1 — title screen, full game config
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await expectTwoColors(page, "title", failures);

    // Gate 2 — deterministic lab toy: flood+dams, no clock, N-step the sim
    await page.goto(`${BASE}/?mode=lab&dyn=flood,dams&ticks=6`, {
      waitUntil: "networkidle",
    });
    await page.waitForFunction(
      () => (window as unknown as { __lofi?: { worldProbe?: unknown } }).__lofi?.worldProbe,
      null,
      { timeout: 20_000 },
    );
    const wet0 = await page.evaluate(
      () => (window as unknown as { __lofi: { worldProbe: () => { wetCount: number } } }).__lofi.worldProbe().wetCount,
    );
    await page.keyboard.press("n");
    await page.keyboard.press("n");
    await page.waitForTimeout(400);
    const wet2 = await page.evaluate(
      () => (window as unknown as { __lofi: { worldProbe: () => { wetCount: number } } }).__lofi.worldProbe().wetCount,
    );
    if (wet2 <= wet0) {
      failures.push({
        name: "sim-step",
        detail: `flood did not advance under N-stepping (wet ${wet0} → ${wet2})`,
      });
    } else {
      console.log(`✓ sim-step: flood advanced (wet ${wet0} → ${wet2})`);
    }
    await expectTwoColors(page, "lab-world", failures);

    if (pageErrors.length > 0) {
      failures.push({ name: "page-errors", detail: pageErrors.join("; ") });
    }
  } finally {
    await browser?.close();
    try {
      if (server.pid) process.kill(-server.pid, "SIGTERM");
    } catch {
      server.kill();
    }
  }

  if (failures.length > 0) {
    for (const f of failures) console.error(`✗ ${f.name}: ${f.detail}`);
    process.exit(1);
  }
  console.log("visual gate: all checks passed");
  process.exit(0);
}

main().catch((err) => {
  console.error("visual gate crashed:", err);
  process.exit(1);
});
