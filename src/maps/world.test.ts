import { describe, expect, it } from "vitest";
import { parseWorld, blockedKey } from "./world";
import { WILLOW_BEND } from "./willow-bend";

describe("parseWorld", () => {
  const world = parseWorld(WILLOW_BEND);

  it("parses Willow Bend dimensions", () => {
    expect(world.width).toBe(24);
    expect(world.height).toBe(18);
  });

  it("finds the beaver spawn", () => {
    expect(world.spawn).toEqual([7, 14]);
  });

  it("finds the spring source inside the pond", () => {
    expect(world.sources).toEqual([[12, 13]]);
    expect(world.terrain[13]![12]).toBe("water");
    expect(world.grid.cells[13 * world.width + 12]!.type).toBe("pond");
  });

  it("maps terrain to flood tile types", () => {
    // road loop row
    expect(world.terrain[4]![1]).toBe("road");
    expect(world.grid.cells[4 * world.width + 1]!.type).toBe("arterial");
    // swale easement
    expect(world.terrain[8]![6]).toBe("swale");
    expect(world.grid.cells[8 * world.width + 6]!.type).toBe("swale");
  });

  it("blocks all cells under a 2x2 house footprint", () => {
    const houses = world.props.filter((p) => p.kind === "house_two_story");
    expect(houses.length).toBeGreaterThan(0);
    const h = houses[0]!;
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        expect(world.blocked.has(blockedKey(h.x + dx, h.y + dy))).toBe(true);
      }
    }
  });

  it("alternates tree variants", () => {
    const trees = world.props.filter((p) => p.kind === "tree_birch");
    expect(trees.length).toBeGreaterThan(4);
    expect(new Set(trees.map((t) => t.variant))).toEqual(new Set([0, 1]));
  });

  it("rejects maps without a spawn", () => {
    expect(() => parseWorld("...\n.t.\n...")).toThrow(/spawn/);
  });

  it("rejects unknown chars", () => {
    expect(() => parseWorld("..B\n.x.\n...")).toThrow(/unknown char/);
  });
});
