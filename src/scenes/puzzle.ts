import * as ex from "excalibur";
import type { Grid } from "../flood/grid";
import { cloneGrid } from "../flood/grid";
import { propagate } from "../flood/propagate";
import { GridRenderer } from "./grid-renderer";
import type { PuzzleConfig } from "./puzzle-config";
import { attachDamPlacement } from "../input/dam-placement";
import { Hud } from "../ui/hud";
import type { GameState } from "../ui/hud";
import { TILES } from "../flood/tiles";
import { PUZZLES, getPuzzle } from "../maps/puzzles";
import type { TitledPuzzle } from "../maps/puzzles";

export class PuzzleScene extends ex.Scene {
  index = 0;
  config: TitledPuzzle = getPuzzle(0);
  grid: Grid = cloneGrid(this.config.grid);
  ticks = 0;
  damsPlaced = 0;
  elapsed = 0;
  state: GameState = { kind: "playing" };

  private accum = 0;
  private detach: (() => void) | null = null;
  private renderer: GridRenderer | null = null;

  override onInitialize(engine: ex.Engine) {
    const center = ex.vec(engine.drawWidth / 2, 120);
    this.renderer = new GridRenderer(
      () => ({ grid: this.grid, sources: this.config.sources, target: this.config.target }),
      center,
    );
    this.add(this.renderer);

    this.add(new Hud(() => ({
      title: this.config.title,
      puzzleIndex: this.index,
      puzzleTotal: PUZZLES.length,
      timeRemaining: Math.max(0, this.config.timeLimit - this.elapsed),
      damBudget: this.config.damBudget,
      damsPlaced: this.damsPlaced,
      state: this.state,
    })));

    this.detach = attachDamPlacement(
      engine,
      () => this.renderer!.pos,
      () => this.grid,
      {
        canPlace: (x, y) => {
          if (this.state.kind !== "playing") return false;
          if (this.damsPlaced >= this.config.damBudget) return false;
          // Don't dam over source or target
          if (this.config.sources.some(([sx, sy]) => sx === x && sy === y)) return false;
          const [tx, ty] = this.config.target;
          if (tx === x && ty === y) return false;
          return true;
        },
        onPlaced: () => {
          this.damsPlaced += 1;
        },
      },
    );

    engine.input.keyboard.on("press", (event) => {
      if (this.state.kind === "playing") return;
      if (event.key === ex.Keys.R) this.restart();
      else if (event.key === ex.Keys.N && this.state.kind === "won") this.advance();
      else if (event.key === ex.Keys.Space && this.state.kind === "won") this.advance();
    });

    const w = window as unknown as { __lofi?: { scene?: PuzzleScene } };
    w.__lofi = { ...(w.__lofi ?? {}), scene: this };
  }

  override onDeactivate(): void {
    if (this.detach) {
      this.detach();
      this.detach = null;
    }
  }

  override onPreUpdate(_engine: ex.Engine, elapsedMs: number): void {
    if (this.state.kind !== "playing") return;
    const dtSec = elapsedMs / 1000;
    this.elapsed += dtSec;
    this.accum += dtSec;
    while (this.accum >= this.config.tickDt) {
      this.grid = propagate({ grid: this.grid, sources: this.config.sources, dt: this.config.tickDt });
      this.accum -= this.config.tickDt;
      this.ticks += 1;
    }

    // Win/lose checks (run after the tick).
    if (this.targetWet()) {
      this.state = { kind: "won" };
      return;
    }
    if (this.elapsed >= this.config.timeLimit) {
      this.state = { kind: "lost", reason: "time" };
      return;
    }
    if (this.spilled()) {
      this.state = { kind: "lost", reason: "spill" };
      return;
    }
    if (
      this.damsPlaced >= this.config.damBudget &&
      !this.targetWet() &&
      !this.canTargetStillFlood()
    ) {
      // Conservative budget-lose: only triggers if exhausted AND target hasn't reached water yet.
      // The harsher "any path remaining" check is deferred — for v0 we let the timer be the second clock.
    }
  }

  wetCount(): number {
    let n = 0;
    for (const c of this.grid.cells) if (c.water >= 1) n += 1;
    return n;
  }

  /** Tile (x,y) → world-space pixel coordinates of the tile centre. Used by the snap script. */
  tileToWorld(x: number, y: number): { wx: number; wy: number } {
    const TILE_W = 64;
    const TILE_H = 32;
    const origin = this.renderer?.pos ?? { x: 0, y: 0 };
    return {
      wx: origin.x + (x - y) * (TILE_W / 2),
      wy: origin.y + (x + y) * (TILE_H / 2),
    };
  }

  /**
   * Debug helper: run the same validation as the click handler and place a
   * dam at (x, y) if allowed. Returns true on placement. Used by Playwright
   * MCP, which can't fire trusted PointerEvents.
   */
  testPlaceDam(x: number, y: number): boolean {
    if (this.state.kind !== "playing") return false;
    if (this.damsPlaced >= this.config.damBudget) return false;
    if (this.config.sources.some(([sx, sy]) => sx === x && sy === y)) return false;
    const [tx, ty] = this.config.target;
    if (tx === x && ty === y) return false;
    const cell = this.grid.cells[y * this.grid.width + x];
    if (!cell) return false;
    if (TILES[cell.type].blocks || cell.damPlaced) return false;
    if (cell.water >= 1) return false;
    cell.damPlaced = true;
    cell.water = 0;
    this.damsPlaced += 1;
    return true;
  }

  private targetWet(): boolean {
    const [tx, ty] = this.config.target;
    const c = this.grid.cells[ty * this.grid.width + tx];
    return !!c && c.water >= 1;
  }

  private canTargetStillFlood(): boolean {
    // Stub for v0 — assume there might still be a path. M3.5 can do reachability.
    return true;
  }

  private spilled(): boolean {
    const g = this.grid;
    const sources = this.config.sources;
    for (let x = 0; x < g.width; x++) {
      for (const y of [0, g.height - 1]) {
        if (this.isSpillCell(x, y, sources)) return true;
      }
    }
    for (let y = 0; y < g.height; y++) {
      for (const x of [0, g.width - 1]) {
        if (this.isSpillCell(x, y, sources)) return true;
      }
    }
    return false;
  }

  private isSpillCell(x: number, y: number, sources: ReadonlyArray<readonly [number, number]>): boolean {
    if (sources.some(([sx, sy]) => sx === x && sy === y)) return false;
    const c = this.grid.cells[y * this.grid.width + x];
    if (!c) return false;
    // A perimeter cell that's a curb cannot spill — by construction the perimeter is meant to contain.
    // Spill = a non-curb non-source perimeter cell becomes wet.
    if (TILES[c.type].blocks) return false;
    return c.water >= 1;
  }

  private restart(): void {
    this.grid = cloneGrid(this.config.grid);
    this.ticks = 0;
    this.damsPlaced = 0;
    this.elapsed = 0;
    this.accum = 0;
    this.state = { kind: "playing" };
  }

  /**
   * Public so the snap script can step through puzzles to verify they all
   * render. Normal play reaches it via `N` after a win.
   */
  advance(): void {
    this.index = (this.index + 1) % PUZZLES.length;
    this.config = getPuzzle(this.index);
    this.restart();
  }
}
