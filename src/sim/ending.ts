/**
 * Season endings — at dawn after the final day, the watershed's actual state
 * picks the ending. Pure functions; the scene just displays the verdict.
 */
import type { Grid } from "../flood/grid";
import { isWet } from "../flood/propagate";
import type { ParsedWorld, WorldProp } from "../maps/world";

export type EndingId = "watershed" | "polite";

export interface SeasonEnding {
  id: EndingId;
  vignetteId: string;
  title: string;
  text: string;
}

export const ENDINGS: Record<EndingId, SeasonEnding> = {
  watershed: {
    id: "watershed",
    vignetteId: "vignette_ending_watershed",
    title: "THE WATERSHED REMEMBERS",
    text: "The pond stopped being a pond around week two. The Hendersons' upstairs window has the best view of the new wetland. The heron approves of the management change.",
  },
  polite: {
    id: "polite",
    vignetteId: "vignette_ending_polite",
    title: "THE POND STAYS POLITE",
    text: "The water kept to its easements this season. The HOA commended the drainage committee. One fence post was gnawed to a point. Nobody has connected these facts. Next spring, the water will try again.",
  },
};

export function isHouse(kind: WorldProp["kind"]): boolean {
  return kind.startsWith("house_");
}

/** A house counts as flooded when any cell under its footprint is wet. */
export function floodedHouses(world: ParsedWorld, grid: Grid): number {
  let count = 0;
  for (const prop of world.props) {
    if (!isHouse(prop.kind)) continue;
    let wet = false;
    for (let dy = 0; dy < prop.footprint[1] && !wet; dy++) {
      for (let dx = 0; dx < prop.footprint[0] && !wet; dx++) {
        const cell = grid.cells[(prop.y + dy) * grid.width + (prop.x + dx)];
        if (cell && isWet(cell)) wet = true;
      }
    }
    if (wet) count += 1;
  }
  return count;
}

export const WATERSHED_THRESHOLD = 2; // flooded houses needed for the wet ending

export function pickEnding(world: ParsedWorld, grid: Grid): SeasonEnding {
  return floodedHouses(world, grid) >= WATERSHED_THRESHOLD
    ? ENDINGS.watershed
    : ENDINGS.polite;
}
