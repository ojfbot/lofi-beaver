import { TILES } from "./tiles";
import type { Grid, Cell } from "./grid";
import { cloneGrid, neighbors } from "./grid";

export interface PropagateInput {
  grid: Grid;
  /** Cells that are continuously held at water = 1 (e.g. a broken-dam outflow). */
  sources: ReadonlyArray<readonly [number, number]>;
  /** Seconds since last tick. */
  dt: number;
}

/**
 * Pure BFS / cellular-automaton step. Returns a new grid; does not mutate input.
 *
 * Rules (the thing being validated):
 *   - Curbs and player-placed dams (effective `blocks=true`) never wet.
 *   - Source cells are pinned to water=1 each tick.
 *   - For every other cell, count "wet" neighbours (water >= 1) from the
 *     *previous* tick's state. Inflow per tick = `wetNeighbours * dt`.
 *   - For ponds: inflow goes to `pondAbsorbed` until capacity; overflow raises water.
 *   - For other non-blocked tiles: `water += inflow / cost`.
 *   - For swales: water also drains by `sinkRate * dt` each tick.
 *   - Water clamps to [0, 1].
 */
export function propagate({ grid, sources, dt }: PropagateInput): Grid {
  const w = grid.width;
  const h = grid.height;

  const sourceSet = new Set<number>();
  for (const [sx, sy] of sources) {
    if (sx >= 0 && sy >= 0 && sx < w && sy < h) {
      sourceSet.add(sy * w + sx);
    }
  }

  // Build the input view: a logical clone of `grid` where source cells are
  // pinned at water=1 for the duration of this tick. Reading neighbours from
  // this view (instead of raw `grid.cells`) lets the source contribute on
  // tick 1, matching the player-visible expectation that a source "is wet
  // from t=0".
  const inView = cloneGrid(grid);
  for (const idx of sourceSet) {
    inView.cells[idx]!.water = 1;
  }
  const next = cloneGrid(inView);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const prev = inView.cells[idx]!;
      const cell = next.cells[idx]!;
      const props = TILES[cell.type];
      const blocked = props.blocks || cell.damPlaced;

      if (blocked) {
        cell.water = 0;
        continue;
      }

      if (sourceSet.has(idx)) {
        cell.water = 1;
        continue;
      }

      let wetNeighbours = 0;
      for (const [nx, ny] of neighbors(inView, x, y)) {
        const nb = inView.cells[ny * w + nx]!;
        const nbBlocked = TILES[nb.type].blocks || nb.damPlaced;
        if (nbBlocked) continue;
        if (nb.water >= 1) wetNeighbours += 1;
      }

      const inflow = wetNeighbours * dt;

      if (cell.type === "pond" && prev.pondAbsorbed < props.capacity && inflow > 0) {
        const remaining = props.capacity - prev.pondAbsorbed;
        const absorb = Math.min(inflow, remaining);
        cell.pondAbsorbed = prev.pondAbsorbed + absorb;
        const overflow = inflow - absorb;
        if (overflow > 0) {
          cell.water = clamp01(prev.water + overflow / Math.max(props.cost, 1e-6));
        } else {
          cell.water = prev.water;
        }
      } else if (inflow > 0) {
        cell.water = clamp01(prev.water + inflow / Math.max(props.cost, 1e-6));
      } else {
        cell.water = prev.water;
      }

      if (cell.type === "swale" && props.sinkRate > 0) {
        cell.water = clamp01(cell.water - props.sinkRate * dt);
      }
    }
  }

  return next;
}

/** True when `water >= 1` — fully flooded, the binary "wet" state. */
export function isWet(c: Cell): boolean {
  return c.water >= 1;
}

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}
