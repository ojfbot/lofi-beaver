import type { TileType } from "./tiles";

export interface Cell {
  type: TileType;
  /** Saturation in [0, 1]. >= 1 means fully flooded. */
  water: number;
  /** Pond-only: cumulative inflow absorbed before water can rise. */
  pondAbsorbed: number;
  /** Player-placed dam overlay. Flips effective `blocks` to true. */
  damPlaced: boolean;
}

export interface Grid {
  width: number;
  height: number;
  cells: Cell[]; // row-major: cells[y * width + x]
}

export function makeGrid(width: number, height: number, fill: TileType = "lot"): Grid {
  const cells: Cell[] = [];
  for (let i = 0; i < width * height; i++) {
    cells.push({ type: fill, water: 0, pondAbsorbed: 0, damPlaced: false });
  }
  return { width, height, cells };
}

export function inBounds(g: Grid, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < g.width && y < g.height;
}

export function getCell(g: Grid, x: number, y: number): Cell | undefined {
  if (!inBounds(g, x, y)) return undefined;
  return g.cells[y * g.width + x];
}

export function setTile(g: Grid, x: number, y: number, type: TileType): void {
  const c = getCell(g, x, y);
  if (c) c.type = type;
}

export function placeDam(g: Grid, x: number, y: number): boolean {
  const c = getCell(g, x, y);
  if (!c || c.damPlaced) return false;
  c.damPlaced = true;
  c.water = 0;
  return true;
}

/**
 * 4-cardinal neighbours in grid space. Staggered iso topology is handled by
 * the *renderer*; the BFS lives in grid space and never sees the projection.
 * (See decisions/adr/0002-…)
 */
export function neighbors(g: Grid, x: number, y: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  if (x + 1 < g.width) out.push([x + 1, y]);
  if (x - 1 >= 0) out.push([x - 1, y]);
  if (y + 1 < g.height) out.push([x, y + 1]);
  if (y - 1 >= 0) out.push([x, y - 1]);
  return out;
}

/** Build a fresh grid with a deep copy of cells. The propagation step is pure: input untouched. */
export function cloneGrid(g: Grid): Grid {
  return {
    width: g.width,
    height: g.height,
    cells: g.cells.map((c) => ({ ...c })),
  };
}
