import { describe, it, expect } from "vitest";
import { PUZZLES } from "./index";

describe("puzzles — sanity", () => {
  it("all parse and expose source + target", () => {
    expect(PUZZLES.length).toBeGreaterThanOrEqual(3);
    for (const p of PUZZLES) {
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.sources.length).toBeGreaterThan(0);
      expect(p.target).toBeDefined();
      expect(p.damBudget).toBeGreaterThan(0);
      expect(p.timeLimit).toBeGreaterThan(0);
      expect(p.tickDt).toBeGreaterThan(0);
    }
  });

  it("source and target are inside grid bounds and not curbs", () => {
    for (const p of PUZZLES) {
      for (const [sx, sy] of p.sources) {
        expect(sx).toBeGreaterThanOrEqual(0);
        expect(sy).toBeGreaterThanOrEqual(0);
        expect(sx).toBeLessThan(p.grid.width);
        expect(sy).toBeLessThan(p.grid.height);
        const c = p.grid.cells[sy * p.grid.width + sx]!;
        expect(c.type).not.toBe("curb");
      }
      const [tx, ty] = p.target;
      expect(tx).toBeGreaterThanOrEqual(0);
      expect(ty).toBeGreaterThanOrEqual(0);
      expect(tx).toBeLessThan(p.grid.width);
      expect(ty).toBeLessThan(p.grid.height);
      const t = p.grid.cells[ty * p.grid.width + tx]!;
      expect(t.type).not.toBe("curb");
    }
  });
});
