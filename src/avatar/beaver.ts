/**
 * The beaver avatar — real-time WASD/arrow movement over the iso grid.
 * Facing picks one of the 4 sprite-strip frames (grid +x, +y, -x, -y).
 * Collision is tile-level: house/tree cells block, water is swimmable.
 */
import * as ex from "excalibur";
import { spriteRegistry } from "../assets/sprite-loader";
import type { ParsedWorld } from "../maps/world";
import { blockedKey } from "../maps/world";
import { TILE_H } from "../palette";

const SPEED = 110; // px/s in world (screen) space

export class Beaver extends ex.Actor {
  private facing = 3; // frame index; default -y (toward camera)

  constructor(
    private world: ParsedWorld,
    private map: ex.IsometricMap,
  ) {
    const spawnTile = map.tileToWorld(ex.vec(world.spawn[0], world.spawn[1]));
    const meta = spriteRegistry.get("beaver_avatar").meta;
    super({
      pos: spawnTile.add(ex.vec(0, TILE_H / 2)),
      width: 24,
      height: 16,
      // Actor.anchor drives graphics placement (graphics.anchor gets
      // clobbered by the actor's own anchor every frame).
      anchor: ex.vec(
        meta.anchor_px[0] / meta.frame.w,
        meta.anchor_px[1] / meta.frame.h,
      ),
    });
  }

  override onInitialize(): void {
    const sheet = spriteRegistry.get("beaver_avatar");
    this.graphics.use(sheet.frames[this.facing]!);
    this.addComponent(new ex.IsometricEntityComponent(this.map));
  }

  override onPreUpdate(engine: ex.Engine, deltaMs: number): void {
    const kb = engine.input.keyboard;
    let vx = 0;
    let vy = 0;
    if (kb.isHeld(ex.Keys.W) || kb.isHeld(ex.Keys.Up)) vy -= 1;
    if (kb.isHeld(ex.Keys.S) || kb.isHeld(ex.Keys.Down)) vy += 1;
    if (kb.isHeld(ex.Keys.A) || kb.isHeld(ex.Keys.Left)) vx -= 1;
    if (kb.isHeld(ex.Keys.D) || kb.isHeld(ex.Keys.Right)) vx += 1;

    if (vx === 0 && vy === 0) return;
    const v = ex.vec(vx, vy).normalize().scale((SPEED * deltaMs) / 1000);
    const next = this.pos.add(v);

    if (this.walkable(next)) {
      this.pos = next;
    } else {
      // slide along the blocked edge: try each axis independently
      const nx = this.pos.add(ex.vec(v.x, 0));
      const ny = this.pos.add(ex.vec(0, v.y));
      if (this.walkable(nx)) this.pos = nx;
      else if (this.walkable(ny)) this.pos = ny;
    }

    // facing from grid-space velocity (invert the iso projection)
    const u = v.x / 32;
    const w = v.y / 16;
    const gx = (u + w) / 2;
    const gy = (w - u) / 2;
    this.facing =
      Math.abs(gx) >= Math.abs(gy) ? (gx > 0 ? 0 : 2) : gy > 0 ? 1 : 3;
    const sheet = spriteRegistry.get("beaver_avatar");
    this.graphics.use(sheet.frames[this.facing]!);
  }

  tile(): { x: number; y: number } {
    const t = this.map.worldToTile(this.pos);
    return { x: t.x, y: t.y };
  }

  private walkable(pos: ex.Vector): boolean {
    const t = this.map.worldToTile(pos);
    if (t.x < 0 || t.y < 0 || t.x >= this.world.width || t.y >= this.world.height) {
      return false;
    }
    return !this.world.blocked.has(blockedKey(t.x, t.y));
  }
}
