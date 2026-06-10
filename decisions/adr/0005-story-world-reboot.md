# 0005 — Story-world reboot: lofi-beaver is the Glagstone-style prototype of Willow Bend

**Status:** Accepted, 2026-06-09

## Context

v0 (ADRs 0001–0004) validated the flood-propagation mechanic — but as abstract
glyph diamonds with time-attack puzzles: structurally "minesweeper with
water," which is exactly the misreading the project owner kept getting from
earlier attempts. The intended target was always a *story-world* prototype in
a dense 1-bit dithered isometric language (reference: the in-development game
**Glagstone** — inhabited monochrome world, timeline strip, ornate panels,
hand-inked story vignettes). The story world already exists as beaverGame
Mode B lore: **Willow Bend**, a Master Planned Community built on a buried
wetland.

## Decision

lofi-beaver's job is rebooted: it prototypes the **Willow Bend story world
and its daily-loop mechanics** in the Glagstone visual language.

- Player loop: real-time explore as the beaver + beaver actions
  (dam/gnaw/lodge, daily budget) + a **daily** cycle (dawn → day → dusk →
  night) with a Glagstone-style day strip.
- The v0 flood BFS survives unchanged as the **nightly resolver**
  (`src/flood/` is untouched; `NIGHT_TICKS × NIGHT_DT` fixed ⇒ deterministic).
- Story beats fire at dawn from simulation state (`src/story/beats.ts`),
  opening ink-sketch vignette panels.
- The v0 puzzle mode is **legacy, not deleted** — reachable via `?mode=puzzle`,
  boots with zero sprite assets.

This supersedes the *scope framing* of 0002/0004's cut list ("no NPCs, no
story") — those cuts bound v0, not the reboot. The 1-bit invariant from
0003 stands, restated in ADR-0007.

## Consequences

- Gains: the prototype now answers the question it was built for — does the
  world, tone, and daily rhythm work — with real generated art.
- Costs: the repo is no longer asset-free; it depends on the sprite pipeline
  (ADR-0006) and headless Blender for regeneration.
- `grid-renderer.ts` (vector diamonds) survives only in the legacy puzzle
  scene; the overworld renders through `ex.IsometricMap` + sprite masks.
