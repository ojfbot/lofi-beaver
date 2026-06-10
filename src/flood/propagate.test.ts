import { describe, it, expect } from "vitest";
import { propagate, isWet } from "./propagate";
import { getCell } from "./grid";
import { LEGEND, parse as parseLayout } from "../maps/parse";

// Tests pre-date the parse() returning a structured ParsedLayout. Keep the
// old `parse(layout, legend) → Grid` shape via a thin shim.
const LEGEND_DEFAULT = LEGEND;
function parse(layout: string, legend: typeof LEGEND_DEFAULT) {
  return parseLayout(layout, legend).grid;
}

/**
 * Run `propagate` repeatedly. Sources stay pinned at water=1.
 * Returns the resulting grid.
 */
function tick(grid: Parameters<typeof propagate>[0]["grid"], sources: Array<[number, number]>, ticks: number, dt = 1) {
  let g = grid;
  for (let i = 0; i < ticks; i++) {
    g = propagate({ grid: g, sources, dt });
  }
  return g;
}

describe("propagate — flat lot field", () => {
  it("floods outward from a single source on lots", () => {
    const grid = parse(
      `
      . . . . .
      . . . . .
      . . . . .
      . . . . .
      . . . . .
      `,
      LEGEND_DEFAULT
    );
    // Source at center. cost(lot) = 2, dt=1 → each tick raises water by 1/2 per wet neighbour.
    // Tick 1: source pinned to 1; (1,2) and (3,2) and (2,1) and (2,3) each have 1 wet neighbour, water=0.5.
    // Tick 2: those four cells have 1 wet neighbour still (the source), reach 1.0.
    const after = tick(grid, [[2, 2]], 2);
    expect(isWet(getCell(after, 2, 2)!)).toBe(true);
    expect(isWet(getCell(after, 1, 2)!)).toBe(true);
    expect(isWet(getCell(after, 3, 2)!)).toBe(true);
    expect(isWet(getCell(after, 2, 1)!)).toBe(true);
    expect(isWet(getCell(after, 2, 3)!)).toBe(true);
    // Diagonals not yet flooded — 4-cardinal only.
    expect(isWet(getCell(after, 1, 1)!)).toBe(false);
    expect(isWet(getCell(after, 3, 3)!)).toBe(false);
  });

  it("never floods through a full-column curb wall", () => {
    // Wall spans every row of column 2 — there is no path around.
    const grid = parse(
      `
      . . # . .
      . . # . .
      . . # . .
      . . # . .
      . . # . .
      `,
      LEGEND_DEFAULT
    );
    const after = tick(grid, [[0, 2]], 50);
    expect(isWet(getCell(after, 0, 2)!)).toBe(true);
    expect(isWet(getCell(after, 1, 2)!)).toBe(true);
    // Right of the wall must stay dry.
    expect(isWet(getCell(after, 3, 2)!)).toBe(false);
    expect(isWet(getCell(after, 4, 2)!)).toBe(false);
    expect(isWet(getCell(after, 3, 0)!)).toBe(false);
    expect(isWet(getCell(after, 4, 4)!)).toBe(false);
  });

  it("routes around a partial wall and eventually reaches the far side", () => {
    const grid = parse(
      `
      . . . . .
      . . # . .
      . . # . .
      . . # . .
      . . . . .
      `,
      LEGEND_DEFAULT
    );
    // Short window: water hasn't routed around yet.
    const early = tick(grid, [[0, 2]], 3);
    expect(isWet(getCell(early, 4, 2)!)).toBe(false);
    // Long window: water routes via row 0 and row 4.
    const late = tick(grid, [[0, 2]], 80);
    expect(isWet(getCell(late, 4, 2)!)).toBe(true);
  });
});

describe("propagate — road conductivity", () => {
  it("arterial reaches a target faster than lots", () => {
    // Two parallel paths from source (x=0,y=1) to target (x=4):
    //   row 0: lots (slow)
    //   row 2: arterial (fast)
    const grid = parse(
      `
      . . . . .
      A A A A A
      . . . . .
      `,
      LEGEND_DEFAULT
    );
    // Run just enough ticks that arterial-row target is wet but lot-row target is not.
    // arterial cost 1 → each non-source cell needs 1 unit of inflow to fill.
    // lot cost 2 → each cell needs 2 units. Cascade fills arterial 2x faster.
    const after = tick(grid, [[0, 1]], 5);
    expect(isWet(getCell(after, 4, 1)!)).toBe(true); // arterial reached
    expect(isWet(getCell(after, 4, 0)!)).toBe(false); // lot row hasn't
    expect(isWet(getCell(after, 4, 2)!)).toBe(false);
  });
});

describe("propagate — drainage and ponds", () => {
  it("swale never reaches saturation under steady single-source inflow at this rate", () => {
    // Source -> single-tile gap -> swale. Swale's sinkRate (1.5) outpaces inflow (~0.5/tick) on a single neighbour.
    const grid = parse(
      `
      . . S
      `,
      LEGEND_DEFAULT
    );
    const after = tick(grid, [[0, 0]], 200);
    expect(isWet(getCell(after, 2, 0)!)).toBe(false);
    // The mid-cell (a lot) sits between source and swale and *will* fill up since it has the source as a wet neighbour
    // and only loses to the swale on the far side (the swale can't get wet, so the lot's far neighbour is never wet).
    expect(isWet(getCell(after, 1, 0)!)).toBe(true);
  });

  it("pond absorbs before water rises above zero", () => {
    const grid = parse(
      `
      . P .
      `,
      LEGEND_DEFAULT
    );
    // Pond capacity = 4.0. Inflow per tick from a single wet neighbour = 1.
    // Ticks 1..4 fill the pond's absorption; only after that does water start rising.
    const afterAbsorb = tick(grid, [[0, 0]], 4);
    expect(getCell(afterAbsorb, 1, 0)!.water).toBeLessThan(0.01);
    expect(getCell(afterAbsorb, 1, 0)!.pondAbsorbed).toBeGreaterThanOrEqual(3.99);

    const afterOverflow = tick(grid, [[0, 0]], 50);
    expect(isWet(getCell(afterOverflow, 1, 0)!)).toBe(true);
  });
});

describe("propagate — dams", () => {
  it("a player-placed dam blocks the only path to the target", () => {
    const grid = parse(`. . . . .`, LEGEND_DEFAULT);
    // Without dam: water reaches (4,0).
    const before = tick(grid, [[0, 0]], 50);
    expect(isWet(getCell(before, 4, 0)!)).toBe(true);

    // With a dam at (2,0): blocks the chokepoint.
    const damGrid = parse(`. . . . .`, LEGEND_DEFAULT);
    damGrid.cells[2]!.damPlaced = true;
    const after = tick(damGrid, [[0, 0]], 50);
    expect(isWet(getCell(after, 4, 0)!)).toBe(false);
    // And the cell behind the dam stays dry.
    expect(isWet(getCell(after, 3, 0)!)).toBe(false);
  });
});

describe("propagate — purity", () => {
  it("does not mutate the input grid", () => {
    const grid = parse(`. . .`, LEGEND_DEFAULT);
    const before = JSON.stringify(grid);
    propagate({ grid, sources: [[0, 0]], dt: 1 });
    expect(JSON.stringify(grid)).toBe(before);
  });
});
