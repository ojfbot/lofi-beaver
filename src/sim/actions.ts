/**
 * Daily beaver-action budget. Slice 3 ships `dam`; gnaw/lodge land with
 * later story beats — the budget/validation shape is kind-agnostic already.
 */
import type { Grid } from "../flood/grid";
import { getCell } from "../flood/grid";
import type { ParsedWorld } from "../maps/world";
import { blockedKey } from "../maps/world";

export type ActionKind = "dam";

export const ACTION_COST: Record<ActionKind, number> = {
  dam: 1,
};

/** How far (Chebyshev tiles) from the beaver an action can reach. */
export const ACTION_RANGE = 2;

export class ActionBudget {
  used = 0;

  constructor(public perDay: number = 3) {}

  get remaining(): number {
    return this.perDay - this.used;
  }

  canSpend(kind: ActionKind): boolean {
    return this.remaining >= ACTION_COST[kind];
  }

  spend(kind: ActionKind): boolean {
    if (!this.canSpend(kind)) return false;
    this.used += ACTION_COST[kind];
    return true;
  }

  resetDaily(): void {
    this.used = 0;
  }
}

export interface DamPlacementCheck {
  ok: boolean;
  reason?: "out-of-range" | "blocked" | "already-dammed" | "no-budget";
}

export function validateDamPlacement(
  world: ParsedWorld,
  grid: Grid,
  budget: ActionBudget,
  avatarTile: { x: number; y: number },
  target: { x: number; y: number },
): DamPlacementCheck {
  if (!budget.canSpend("dam")) return { ok: false, reason: "no-budget" };
  const cell = getCell(grid, target.x, target.y);
  if (!cell || world.blocked.has(blockedKey(target.x, target.y))) {
    return { ok: false, reason: "blocked" };
  }
  if (cell.damPlaced) return { ok: false, reason: "already-dammed" };
  const dist = Math.max(
    Math.abs(target.x - avatarTile.x),
    Math.abs(target.y - avatarTile.y),
  );
  if (dist > ACTION_RANGE) return { ok: false, reason: "out-of-range" };
  return { ok: true };
}
