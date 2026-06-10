import type { PuzzleConfig } from "../../scenes/puzzle-config";
import { parse } from "../parse";

/**
 * Puzzle 3 — "Drainage Defense"
 *
 * What it tests: swale drainage + spill detection. Swales drain water at a
 * faster rate than a single neighbour can refill. To get water past the
 * swale belt, the player must either route around it or dam swales adjacent
 * to the path. The perimeter has two leak openings (north + east of target):
 * if water reaches them, you spill and lose.
 *
 * Tight time + tight budget — the prototype's hardest layout.
 */
export const DRAINAGE: PuzzleConfig & { title: string } = (() => {
  const { grid, sources, target } = parse(`
##############
#>...........#
#..S.S.......#
#.S....S.A...#
#.....S..A...#
#.S......A...#
#.....S..A...#
#........A..T#
##############
  `);
  return {
    title: "drainage defense",
    grid,
    sources,
    target: target!,
    damBudget: 4,
    timeLimit: 35,
    tickDt: 0.25,
  };
})();
