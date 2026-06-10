/**
 * Sprite test scene (?mode=spritetest) — Slice 1 proof.
 *
 * A 10×10 IsometricMap blitting the foundry-generated 1-bit masks: grass
 * variants, a road running through, and an animated water pond. Exists to
 * verify (a) the sprite contract loads, (b) the Bayer dither tiles seamlessly
 * on the 64×32 grid, (c) animation strips play, (d) INK tint applies.
 */
import * as ex from "excalibur";
import { spriteRegistry } from "../assets/sprite-loader";
import { TILE_W, TILE_H } from "../palette";

const COLS = 10;
const ROWS = 10;

/** Pond blob + road column over grass. */
function tileKind(x: number, y: number): "water" | "road" | "grass" {
  const dx = x - 6.5;
  const dy = y - 6.5;
  if (dx * dx + dy * dy < 5.5) return "water";
  if (x === 2) return "road";
  return "grass";
}

export class SpriteTestScene extends ex.Scene {
  override onInitialize(engine: ex.Engine): void {
    const map = new ex.IsometricMap({
      pos: ex.vec(0, 0),
      tileWidth: TILE_W,
      tileHeight: TILE_H,
      columns: COLS,
      rows: ROWS,
    });

    const grass = spriteRegistry.get("tile_grass");
    const road = spriteRegistry.get("tile_road");
    const water = spriteRegistry.get("tile_water");

    for (const tile of map.tiles) {
      const kind = tileKind(tile.x, tile.y);
      if (kind === "water" && water.animation) {
        tile.addGraphic(water.animation);
      } else if (kind === "road") {
        tile.addGraphic(road.frames[0]!);
      } else {
        // checker the two grass variants for texture variation
        tile.addGraphic(grass.frames[(tile.x + tile.y) % grass.frames.length]!);
      }
    }
    this.add(map);

    const center = map.tileToWorld(ex.vec(COLS / 2, ROWS / 2));


    this.camera.pos = center;
    this.camera.zoom = 2;
    void engine;
  }
}
