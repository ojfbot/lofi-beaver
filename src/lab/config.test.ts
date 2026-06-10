import { describe, expect, it } from "vitest";
import {
  parseLabConfig,
  fullGameConfig,
  labUrl,
  DEFAULT_PARAMS,
  DYNAMICS,
} from "./config";
import { parseWorld } from "../maps/world";
import { WILLOW_BEND } from "../maps/willow-bend";
import { propagate, isWet } from "../flood/propagate";
import { runPump } from "../sim/pump";

describe("lab config", () => {
  it("full game = every dynamic except the pump, default knobs", () => {
    const cfg = fullGameConfig();
    expect(cfg.lab).toBe(false);
    expect(cfg.dynamics.has("pump")).toBe(false);
    expect(cfg.dynamics.has("flood")).toBe(true);
    expect(cfg.params).toEqual(DEFAULT_PARAMS);
  });

  it("parses a weird combination with knobs", () => {
    const cfg = parseLabConfig(
      new URLSearchParams("mode=lab&dyn=flood,pump&ticks=20&pump=12&dt=0.25"),
    );
    expect(cfg.lab).toBe(true);
    expect([...cfg.dynamics].sort()).toEqual(["flood", "pump"]);
    expect(cfg.params.nightTicks).toBe(20);
    expect(cfg.params.pumpPower).toBe(12);
    expect(cfg.params.nightDt).toBe(0.25);
    expect(cfg.params.budget).toBe(DEFAULT_PARAMS.budget);
  });

  it("ignores unknown dynamics and bad numbers", () => {
    const cfg = parseLabConfig(
      new URLSearchParams("dyn=flood,wizards&ticks=-3&budget=banana"),
    );
    expect([...cfg.dynamics]).toEqual(["flood"]);
    expect(cfg.params.nightTicks).toBe(DEFAULT_PARAMS.nightTicks);
    expect(cfg.params.budget).toBe(DEFAULT_PARAMS.budget);
  });

  it("dyn=all enables everything", () => {
    const cfg = parseLabConfig(new URLSearchParams("dyn=all"));
    expect(cfg.dynamics.size).toBe(DYNAMICS.length);
  });

  it("labUrl round-trips through parse", () => {
    const url = labUrl(["flood", "dams", "pump"], { nightTicks: 18, pumpPower: 10 });
    const cfg = parseLabConfig(new URLSearchParams(url.split("?")[1]));
    expect([...cfg.dynamics].sort()).toEqual(["dams", "flood", "pump"]);
    expect(cfg.params.nightTicks).toBe(18);
    expect(cfg.params.pumpPower).toBe(10);
  });
});

describe("pump dynamic", () => {
  it("drains up to power wet cells nearest the pump, deterministically", () => {
    const world = parseWorld(WILLOW_BEND);
    let grid = world.grid;
    for (let i = 0; i < 36; i++) {
      grid = propagate({ grid, sources: world.sources, dt: 0.5 });
    }
    const wetBefore = grid.cells.filter(isWet).length;
    expect(wetBefore).toBeGreaterThan(10);

    const pump = world.props.find((p) => p.kind === "landmark_pump_station")!;
    const a = structuredClone(grid);
    const b = structuredClone(grid);
    const drainedA = runPump(a, { x: pump.x, y: pump.y }, 6);
    const drainedB = runPump(b, { x: pump.x, y: pump.y }, 6);
    expect(drainedA).toBe(drainedB);
    expect(drainedA).toBeGreaterThan(0);
    expect(drainedA).toBeLessThanOrEqual(6);
    expect(a.cells.map((c) => c.water)).toEqual(b.cells.map((c) => c.water));
    expect(a.cells.filter(isWet).length).toBe(wetBefore - drainedA);
  });

  it("does nothing on a dry grid", () => {
    const world = parseWorld(WILLOW_BEND);
    const pump = world.props.find((p) => p.kind === "landmark_pump_station")!;
    expect(runPump(world.grid, { x: pump.x, y: pump.y }, 6)).toBe(0);
  });
});
