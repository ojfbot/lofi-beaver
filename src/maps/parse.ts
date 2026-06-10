import type { Grid } from "../flood/grid";
import { makeGrid, setTile } from "../flood/grid";
import type { TileType } from "../flood/tiles";

export interface ParsedLayout {
  grid: Grid;
  sources: Array<[number, number]>;
  target: [number, number] | null;
}

/**
 * Default legend. Source (`>`) and target (`T`) cells are lots underneath.
 * Add custom chars by passing your own legend (it's merged with this one).
 */
export const LEGEND: Record<string, TileType | "source" | "target"> = {
  ".": "lot",
  A: "arterial",
  C: "culdesac",
  S: "swale",
  P: "pond",
  "#": "curb",
  ">": "source",
  T: "target",
};

/**
 * Parse a string-art layout into a grid + special markers.
 *
 *   const { grid, sources, target } = parse(`
 *     ##########
 *     #>.A.A..T#
 *     ##########
 *   `);
 *
 * Whitespace is stripped (so you can pre-indent rows for readability). Width
 * is the longest non-empty row; shorter rows are padded with `lot`.
 */
export function parse(layout: string, legend: typeof LEGEND = LEGEND): ParsedLayout {
  const lines = layout
    .split("\n")
    .map((l) => l.replace(/\s+/g, ""))
    .filter((l) => l.length > 0);
  const height = lines.length;
  const width = Math.max(...lines.map((l) => l.length));
  const grid = makeGrid(width, height, "lot");
  const sources: Array<[number, number]> = [];
  let target: [number, number] | null = null;

  for (let y = 0; y < height; y++) {
    const row = lines[y]!;
    if (row.length !== width) {
      throw new Error(
        `parse: row ${y} has width ${row.length}, expected ${width}. ` +
          `Pad layout rows to a uniform width.`,
      );
    }
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]!;
      const v = legend[ch];
      if (!v) throw new Error(`unknown layout char "${ch}" at (${x},${y})`);
      if (v === "source") {
        setTile(grid, x, y, "lot");
        sources.push([x, y]);
      } else if (v === "target") {
        setTile(grid, x, y, "lot");
        target = [x, y];
      } else {
        setTile(grid, x, y, v);
      }
    }
  }
  return { grid, sources, target };
}
