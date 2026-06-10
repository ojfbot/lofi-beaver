import { describe, expect, it } from "vitest";
import { DayCycle, type DayPhase } from "./day-cycle";
import { parseWorld } from "../maps/world";
import { WILLOW_BEND } from "../maps/willow-bend";
import { propagate, isWet } from "../flood/propagate";
import { placeDam } from "../flood/grid";

const FAST = { dawn: 1, day: 2, dusk: 1, night: 1 };

describe("DayCycle", () => {
  it("walks dawn → day → dusk → night → dawn(day+1)", () => {
    const seen: Array<[DayPhase, number]> = [];
    const c = new DayCycle({
      durations: FAST,
      onPhase: (p, d) => seen.push([p, d]),
    });
    c.begin();
    for (let i = 0; i < 50; i++) c.update(0.1); // 5 seconds = one full day
    expect(seen).toEqual([
      ["dawn", 1],
      ["day", 1],
      ["dusk", 1],
      ["night", 1],
      ["dawn", 2],
    ]);
  });

  it("handles a large dt by firing every crossed phase", () => {
    const seen: DayPhase[] = [];
    const c = new DayCycle({ durations: FAST, onPhase: (p) => seen.push(p) });
    c.update(5); // one full day in a single update
    expect(seen).toEqual(["day", "dusk", "night", "dawn"]);
    expect(c.day).toBe(2);
  });

  it("skipToNextPhase jumps exactly one boundary", () => {
    const c = new DayCycle({ durations: FAST });
    c.update(0.5);
    c.skipToNextPhase();
    expect(c.phase).toBe("day");
    expect(c.phaseElapsed).toBe(0);
  });
});

describe("nightly flood resolver (Willow Bend)", () => {
  const NIGHT_TICKS = 12;
  const NIGHT_DT = 0.5;

  function resolveNights(nights: number, withDams: Array<[number, number]> = []) {
    let grid = parseWorld(WILLOW_BEND).grid;
    for (const [x, y] of withDams) placeDam(grid, x, y);
    const sources = parseWorld(WILLOW_BEND).sources;
    for (let n = 0; n < nights; n++) {
      for (let i = 0; i < NIGHT_TICKS; i++) {
        grid = propagate({ grid, sources, dt: NIGHT_DT });
      }
    }
    return grid;
  }

  it("is deterministic", () => {
    const a = resolveNights(3);
    const b = resolveNights(3);
    expect(a.cells.map((c) => c.water)).toEqual(b.cells.map((c) => c.water));
  });

  it("water spreads outward from the spring over the nights", () => {
    const wet1 = resolveNights(1).cells.filter(isWet).length;
    const wet5 = resolveNights(5).cells.filter(isWet).length;
    expect(wet1).toBeGreaterThan(0);
    expect(wet5).toBeGreaterThan(wet1);
  });

  it("dams hold water back", () => {
    const open = resolveNights(5).cells.filter(isWet).length;
    // ring the pond's north exit with dams
    const dammed = resolveNights(5, [
      [11, 10], [12, 10], [13, 10], [10, 11], [14, 11],
    ]).cells.filter(isWet).length;
    expect(dammed).toBeLessThan(open);
  });
});
