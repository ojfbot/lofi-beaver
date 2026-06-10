import type { Grid } from "../flood/grid";

export interface PuzzleConfig {
  /** Initial grid layout. Cloned on scene start so restart is clean. */
  grid: Grid;
  /** Cells pinned to water=1 every tick. */
  sources: Array<[number, number]>;
  /** Win when this cell's water >= 1. */
  target: [number, number];
  /** Number of dams the player can place. */
  damBudget: number;
  /** Seconds before time-attack lose. */
  timeLimit: number;
  /** Per-tick propagation step (s). */
  tickDt: number;
}

