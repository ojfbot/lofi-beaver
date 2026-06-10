/**
 * The pump station dynamic — the suburb fights back. Each night, after the
 * flood propagates, the pump drains up to `power` wet cells nearest the
 * station (Chebyshev radius). Deterministic: cells sorted by distance, then
 * row-major index. The spring re-wets from its side every night, so the
 * pump is a per-night tug-of-war, not a cure.
 */
import type { Grid } from "../flood/grid";
import { isWet } from "../flood/propagate";

export function runPump(
  grid: Grid,
  center: { x: number; y: number },
  power: number,
  radius = 6,
): number {
  const candidates: Array<{ idx: number; d: number }> = [];
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const d = Math.max(Math.abs(x - center.x), Math.abs(y - center.y));
      if (d > radius) continue;
      const idx = y * grid.width + x;
      if (isWet(grid.cells[idx]!)) candidates.push({ idx, d });
    }
  }
  candidates.sort((a, b) => a.d - b.d || a.idx - b.idx);
  const drained = candidates.slice(0, power);
  for (const { idx } of drained) {
    grid.cells[idx]!.water = 0;
  }
  return drained.length;
}
