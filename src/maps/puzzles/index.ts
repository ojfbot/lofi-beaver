import type { PuzzleConfig } from "../../scenes/puzzle-config";
import { SPRAWL } from "./sprawl";
import { CULDESAC } from "./cul-de-sac";
import { DRAINAGE } from "./drainage";

export type TitledPuzzle = PuzzleConfig & { title: string };

export const PUZZLES: ReadonlyArray<TitledPuzzle> = [SPRAWL, CULDESAC, DRAINAGE];

export function getPuzzle(index: number): TitledPuzzle {
  const safe = ((index % PUZZLES.length) + PUZZLES.length) % PUZZLES.length;
  return PUZZLES[safe]!;
}
