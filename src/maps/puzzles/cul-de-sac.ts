import type { PuzzleConfig } from "../../scenes/puzzle-config";
import { parse } from "../parse";

/**
 * Puzzle 2 — "The Cul-de-sac Cluster"
 *
 * What it tests: pond capacity-then-overflow + cul-de-sac dead-end topology.
 * Water entering the pond is absorbed before any rises; cul-de-sacs are
 * fast-conducting branches that lead nowhere. Without dams, water still
 * reaches the target — but the pond chews up so much time that the timer
 * may run out before overflow. The intended solve uses dams to detour water
 * past the pond's mouth.
 */
export const CULDESAC: PuzzleConfig & { title: string } = (() => {
  const { grid, sources, target } = parse(`
##############
#>...........#
#............#
#.AAAAAAAA...#
#........A...#
#.PP.....A.CC#
#.PP.....A...#
#........A..T#
##############
  `);
  return {
    title: "cul-de-sac cluster",
    grid,
    sources,
    target: target!,
    damBudget: 5,
    timeLimit: 50,
    tickDt: 0.25,
  };
})();
