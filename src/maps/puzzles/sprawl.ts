import type { PuzzleConfig } from "../../scenes/puzzle-config";
import { parse } from "../parse";

/**
 * Puzzle 1 — "Suburban Sprawl"
 *
 * What it tests: arterial vs lot conductivity. The arterial row in the middle
 * fills 2× faster than parallel lot rows. Without dams the player can win on
 * the arterial alone in time. The dams matter only if the player wants to
 * shave the time, or if they spill water by accident.
 *
 * Containment: full curb perimeter. No spill possible.
 */
export const SPRAWL: PuzzleConfig & { title: string } = (() => {
  const { grid, sources, target } = parse(`
##############
#>...........#
#............#
#..AAAAAAAA..#
#............#
#...........T#
##############
  `);
  return {
    title: "suburban sprawl",
    grid,
    sources,
    target: target!,
    damBudget: 4,
    timeLimit: 45,
    tickDt: 0.25,
  };
})();
