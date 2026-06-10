import { describe, expect, it } from "vitest";
import { parseWorld } from "../maps/world";
import { WILLOW_BEND } from "../maps/willow-bend";
import { floodedHouses, pickEnding, isHouse, WATERSHED_THRESHOLD } from "./ending";
import { buildResidentLookup } from "../story/residents";

describe("season endings", () => {
  const world = parseWorld(WILLOW_BEND);

  it("a dry season ends politely", () => {
    expect(floodedHouses(world, world.grid)).toBe(0);
    expect(pickEnding(world, world.grid).id).toBe("polite");
  });

  it("enough flooded houses end in the watershed", () => {
    const grid = structuredClone(world.grid);
    const houses = world.props.filter((p) => isHouse(p.kind));
    for (const h of houses.slice(0, WATERSHED_THRESHOLD)) {
      grid.cells[h.y * grid.width + h.x]!.water = 1;
    }
    expect(floodedHouses(world, grid)).toBe(WATERSHED_THRESHOLD);
    expect(pickEnding(world, grid).id).toBe("watershed");
  });

  it("a house floods if ANY footprint cell is wet", () => {
    const grid = structuredClone(world.grid);
    const big = world.props.find((p) => p.footprint[0] === 2 && isHouse(p.kind))!;
    grid.cells[(big.y + 1) * grid.width + (big.x + 1)]!.water = 1; // far corner
    expect(floodedHouses(world, grid)).toBe(1);
  });
});

describe("residents", () => {
  it("every house gets a household, stably ordered", () => {
    const world = parseWorld(WILLOW_BEND);
    const lookup = buildResidentLookup(world);
    const houses = world.props.filter((p) => isHouse(p.kind));
    expect(lookup.size).toBe(houses.length);
    expect(lookup.get(houses[0]!)!.name).toBe("THE HENDERSONS");
    const names = new Set([...lookup.values()].map((r) => r.name));
    expect(names.size).toBe(houses.length); // no duplicates with 8 houses
  });
});
