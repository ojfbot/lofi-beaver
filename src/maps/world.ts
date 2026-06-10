/**
 * World-layer map parsing — extends the flood-grid string-art format with
 * terrain + props + spawn for the Willow Bend overworld.
 *
 * Terrain chars map to flood TileTypes (the BFS resolver never sees props):
 *   .  grass        → lot        A  road   → arterial
 *   S  swale        → swale      P  pond   → pond
 *   >  spring/source→ pond (+ sources list)
 *
 * Prop chars imply grass underneath (flood: lot) and add a prop:
 *   r  house_rambler   (2×2: occupies (x..x+1, y..y+1))
 *   H  house_two_story (2×2)
 *   c  house_cottage   (1×1)
 *   t  tree_birch      (1×1)
 *   B  beaver spawn    (no prop, no occupancy)
 */
import type { Grid } from "../flood/grid";
import { makeGrid, setTile } from "../flood/grid";
import type { TileType } from "../flood/tiles";

export type TerrainKind = "grass" | "road" | "swale" | "water";

export type PropKind =
  | "house_rambler"
  | "house_two_story"
  | "house_cottage"
  | "tree_birch"
  | "landmark_pump_station";

export interface WorldProp {
  kind: PropKind;
  /** Anchor cell (top-left of the footprint in grid coords). */
  x: number;
  y: number;
  footprint: [number, number];
  /** Variant frame for multi-variant sprites (trees). */
  variant: number;
}

export interface ParsedWorld {
  grid: Grid;
  terrain: TerrainKind[][];
  props: WorldProp[];
  sources: Array<[number, number]>;
  spawn: [number, number];
  /** Cells blocked for avatar movement (houses, trees). */
  blocked: Set<string>;
  width: number;
  height: number;
}

const TERRAIN_FLOOD: Record<TerrainKind, TileType> = {
  grass: "lot",
  road: "arterial",
  swale: "swale",
  water: "pond",
};

const PROP_FOOTPRINT: Record<PropKind, [number, number]> = {
  house_rambler: [2, 2],
  house_two_story: [2, 2],
  house_cottage: [1, 1],
  tree_birch: [1, 1],
  landmark_pump_station: [1, 1],
};

const PROP_CHARS: Record<string, PropKind> = {
  r: "house_rambler",
  H: "house_two_story",
  c: "house_cottage",
  t: "tree_birch",
  p: "landmark_pump_station",
};

const TERRAIN_CHARS: Record<string, TerrainKind> = {
  ".": "grass",
  A: "road",
  S: "swale",
  P: "water",
};

export const blockedKey = (x: number, y: number): string => `${x},${y}`;

export function parseWorld(layout: string): ParsedWorld {
  const lines = layout
    .split("\n")
    .map((l) => l.replace(/\s+/g, ""))
    .filter((l) => l.length > 0);
  const height = lines.length;
  const width = Math.max(...lines.map((l) => l.length));
  const grid = makeGrid(width, height, "lot");
  const terrain: TerrainKind[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => "grass" as TerrainKind),
  );
  const props: WorldProp[] = [];
  const sources: Array<[number, number]> = [];
  const blocked = new Set<string>();
  let spawn: [number, number] | null = null;
  let treeVariant = 0;

  for (let y = 0; y < height; y++) {
    const row = lines[y]!;
    if (row.length !== width) {
      throw new Error(
        `parseWorld: row ${y} has width ${row.length}, expected ${width}`,
      );
    }
    for (let x = 0; x < width; x++) {
      const ch = row[x]!;
      if (ch in TERRAIN_CHARS) {
        const t = TERRAIN_CHARS[ch]!;
        terrain[y]![x] = t;
        setTile(grid, x, y, TERRAIN_FLOOD[t]);
      } else if (ch === ">") {
        terrain[y]![x] = "water";
        setTile(grid, x, y, "pond");
        sources.push([x, y]);
      } else if (ch === "B") {
        terrain[y]![x] = "grass";
        setTile(grid, x, y, "lot");
        spawn = [x, y];
      } else if (ch in PROP_CHARS) {
        const kind = PROP_CHARS[ch]!;
        const footprint = PROP_FOOTPRINT[kind];
        terrain[y]![x] = "grass";
        setTile(grid, x, y, "lot");
        props.push({
          kind,
          x,
          y,
          footprint,
          variant: kind === "tree_birch" ? treeVariant++ % 2 : 0,
        });
        for (let dy = 0; dy < footprint[1]; dy++) {
          for (let dx = 0; dx < footprint[0]; dx++) {
            blocked.add(blockedKey(x + dx, y + dy));
          }
        }
      } else {
        throw new Error(`parseWorld: unknown char "${ch}" at (${x},${y})`);
      }
    }
  }

  if (!spawn) throw new Error("parseWorld: map needs a B spawn marker");
  return { grid, terrain, props, sources, spawn, blocked, width, height };
}
