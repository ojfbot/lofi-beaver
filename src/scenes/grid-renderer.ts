import * as ex from "excalibur";
import type { Grid, Cell } from "../flood/grid";
import { TILES } from "../flood/tiles";
import { INK, TILE_W, TILE_H } from "../palette";
import { diamondCorners, tileCenterMap } from "./iso";

export interface RenderState {
  grid: Grid;
  sources: ReadonlyArray<readonly [number, number]>;
  target: readonly [number, number] | null;
}

/**
 * Custom actor that draws the entire grid from primitives in onPostDraw,
 * reading the latest state from a getter so it always reflects current.
 */
export class GridRenderer extends ex.Actor {
  constructor(private getState: () => RenderState, pos: ex.Vector) {
    super({ pos, anchor: ex.vec(0, 0) });
  }

  override onInitialize(): void {
    this.graphics.onPostDraw = (gfx) => {
      const { grid, sources, target } = this.getState();
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const cell = grid.cells[y * grid.width + x]!;
          const { mx, my } = tileCenterMap(x, y);
          const isSource = sources.some(([sx, sy]) => sx === x && sy === y);
          const isTarget = target ? target[0] === x && target[1] === y : false;
          drawCell(gfx, cell, mx, my, isSource, isTarget);
        }
      }
    };
  }
}

function drawCell(
  gfx: ex.ExcaliburGraphicsContext,
  cell: Cell,
  cx: number,
  cy: number,
  isSource: boolean,
  isTarget: boolean,
): void {
  const c = diamondCorners(cx, cy);
  const blocked = TILES[cell.type].blocks || cell.damPlaced;

  // Diamond outline
  line(gfx, c.top, c.right, OUTLINE_THICKNESS);
  line(gfx, c.right, c.bottom, OUTLINE_THICKNESS);
  line(gfx, c.bottom, c.left, OUTLINE_THICKNESS);
  line(gfx, c.left, c.top, OUTLINE_THICKNESS);

  // Type glyph
  if (blocked) {
    line(gfx, c.top, c.bottom, GLYPH_THICKNESS);
    line(gfx, c.left, c.right, GLYPH_THICKNESS);
    if (cell.damPlaced) {
      line(gfx, [cx + TILE_W / 8, cy - TILE_H / 4], [cx + TILE_W / 4, cy - TILE_H / 8], GLYPH_THICKNESS);
    }
  } else if (cell.type === "arterial") {
    line(gfx, [cx - TILE_W / 4, cy], [cx + TILE_W / 4, cy], GLYPH_THICKNESS);
  } else if (cell.type === "culdesac") {
    line(gfx, [cx - TILE_W / 4, cy], [cx, cy], GLYPH_THICKNESS);
    dot(gfx, cx + TILE_W / 8, cy, 2);
  } else if (cell.type === "swale") {
    for (let i = -1; i <= 1; i++) dot(gfx, cx + i * (TILE_W / 6), cy, 1.6);
  } else if (cell.type === "pond") {
    const fill = TILES.pond.capacity > 0 ? cell.pondAbsorbed / TILES.pond.capacity : 0;
    const halfW = TILE_W / 4;
    line(gfx, [cx - halfW, cy + TILE_H / 8], [cx + halfW, cy + TILE_H / 8], GLYPH_THICKNESS);
    if (fill > 0.25) line(gfx, [cx - halfW * 0.7, cy], [cx + halfW * 0.7, cy], GLYPH_THICKNESS);
    if (fill > 0.6) line(gfx, [cx - halfW * 0.4, cy - TILE_H / 8], [cx + halfW * 0.4, cy - TILE_H / 8], GLYPH_THICKNESS);
  }

  // Water level — stipple intensifies with `cell.water`
  if (!blocked && cell.water > 0.05) {
    const cols = 3;
    const rows = 2;
    const total = cols * rows;
    const dotsLit = Math.ceil(cell.water * total);
    let drawn = 0;
    for (let yy = 0; yy < rows && drawn < dotsLit; yy++) {
      for (let xx = 0; xx < cols && drawn < dotsLit; xx++, drawn++) {
        const px = cx - TILE_W / 4 + ((xx + 0.5) / cols) * (TILE_W / 2);
        const py = cy - TILE_H / 6 + ((yy + 0.5) / rows) * (TILE_H / 3);
        dot(gfx, px, py, 1.4);
      }
    }
  }

  // Source marker — small inverted triangle above tile centre, pointing in
  if (isSource) {
    line(gfx, [cx - TILE_W / 6, cy - TILE_H / 2 - 2], [cx + TILE_W / 6, cy - TILE_H / 2 - 2], MARKER_THICKNESS);
    line(gfx, [cx - TILE_W / 6, cy - TILE_H / 2 - 2], [cx, cy - TILE_H / 4 - 2], MARKER_THICKNESS);
    line(gfx, [cx + TILE_W / 6, cy - TILE_H / 2 - 2], [cx, cy - TILE_H / 4 - 2], MARKER_THICKNESS);
  }

  // Target marker — concentric diamond inside the tile
  if (isTarget) {
    const inset = 0.55;
    const ic = {
      top:    [cx, cy - (TILE_H / 2) * inset] as [number, number],
      right:  [cx + (TILE_W / 2) * inset, cy] as [number, number],
      bottom: [cx, cy + (TILE_H / 2) * inset] as [number, number],
      left:   [cx - (TILE_W / 2) * inset, cy] as [number, number],
    };
    line(gfx, ic.top, ic.right, MARKER_THICKNESS);
    line(gfx, ic.right, ic.bottom, MARKER_THICKNESS);
    line(gfx, ic.bottom, ic.left, MARKER_THICKNESS);
    line(gfx, ic.left, ic.top, MARKER_THICKNESS);
    dot(gfx, cx, cy, 2);
  }
}

const OUTLINE_THICKNESS = 1.5;
const GLYPH_THICKNESS = 2;
const MARKER_THICKNESS = 2;

function line(
  gfx: ex.ExcaliburGraphicsContext,
  a: [number, number],
  b: [number, number],
  thickness = 1,
): void {
  gfx.drawLine(ex.vec(a[0], a[1]), ex.vec(b[0], b[1]), INK, thickness);
}

function dot(gfx: ex.ExcaliburGraphicsContext, x: number, y: number, r: number): void {
  gfx.drawCircle(ex.vec(x, y), r, INK);
}
