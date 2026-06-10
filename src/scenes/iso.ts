import { TILE_W, TILE_H } from "../palette";

/**
 * True-diamond isometric: tile (x, y) projects to a rotated grid where the
 * diagonal of the tile aligns with the screen axes. (Excalibur's IsometricMap
 * default — what M1 rendered.)
 *
 * Returns the tile *center* in map-local pixel coords, with the origin at the
 * center of tile (0, 0).
 */
export function tileCenterMap(x: number, y: number): { mx: number; my: number } {
  return {
    mx: (x - y) * (TILE_W / 2),
    my: (x + y) * (TILE_H / 2),
  };
}

/** Inverse of tileCenterMap, rounded to the nearest grid cell. */
export function mapToTile(mx: number, my: number): { x: number; y: number } {
  const u = mx / (TILE_W / 2);
  const v = my / (TILE_H / 2);
  return { x: Math.round((u + v) / 2), y: Math.round((v - u) / 2) };
}

/** Diamond vertices for a tile centered at (cx, cy). Top, right, bottom, left. */
export function diamondCorners(cx: number, cy: number): {
  top: [number, number];
  right: [number, number];
  bottom: [number, number];
  left: [number, number];
} {
  return {
    top: [cx, cy - TILE_H / 2],
    right: [cx + TILE_W / 2, cy],
    bottom: [cx, cy + TILE_H / 2],
    left: [cx - TILE_W / 2, cy],
  };
}
