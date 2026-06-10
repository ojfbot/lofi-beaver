import type * as ex from "excalibur";
import { mapToTile } from "../scenes/iso";
import type { Grid } from "../flood/grid";
import { getCell, placeDam, inBounds } from "../flood/grid";
import { TILES } from "../flood/tiles";

export interface DamPlacementCallbacks {
  /** True if (x, y) may receive a dam right now (not source, not target, not already blocked, etc). */
  canPlace: (x: number, y: number) => boolean;
  /** Called when a dam is successfully placed. Implementations should decrement budget. */
  onPlaced: (x: number, y: number) => void;
}

/**
 * Wires pointer-down events to grid-cell placement. The renderer's world
 * origin (the GridRenderer's `pos`) is needed so screen→tile inversion
 * subtracts the right offset.
 */
export function attachDamPlacement(
  engine: ex.Engine,
  rendererOrigin: () => ex.Vector,
  getGrid: () => Grid,
  cb: DamPlacementCallbacks,
): () => void {
  const handler = (event: ex.PointerEvent) => {
    const origin = rendererOrigin();
    const local = event.worldPos.sub(origin);
    const { x, y } = mapToTile(local.x, local.y);
    const grid = getGrid();
    if (!inBounds(grid, x, y)) return;
    const cell = getCell(grid, x, y);
    if (!cell) return;
    if (TILES[cell.type].blocks || cell.damPlaced) return;
    if (cell.water >= 1) return; // already wet — too late
    if (!cb.canPlace(x, y)) return;
    if (placeDam(grid, x, y)) cb.onPlaced(x, y);
  };

  engine.input.pointers.primary.on("down", handler);
  return () => engine.input.pointers.primary.off("down", handler);
}
