---
id: 20260609-2200-brief-grill-verb-system-tooltips
type: brief
title: "Grill: the verb system + onscreen tooltips (gnaw, haul, lodge, sabotage, block, invade)"
actor: code-claude
to: any
session_id: 2026-06-09
refs:
  - file:src/sim/actions.ts
  - file:src/scenes/overworld.ts
  - file:src/ui/panel.ts
  - file:decisions/adr/0007-three-state-sprites-display-layer-palette.md
  - file:CLAUDE.md
hook: next-roadmap
status: live
created_at: 2026-06-09T22:00:00-05:00
labels:
  project: lofi-beaver
  repo: lofi-beaver
  phase: roadmap-2
---

## Run me

Open this repo and run `/grill-with-docs` with this bead as the subject. The
output should be a shared design concept + ADR stub(s) for the verb system,
ready for `/plan-feature --from-conversation`.

## Context (what exists)

The Willow Bend story-world prototype is playable end-to-end: WASD beaver,
daily clock, ONE verb (dam, 3/day, click within range 2 —
`src/sim/actions.ts` already has a kind-agnostic `ActionKind`/cost/budget
shape), nightly flood resolve, resident cards, story beats, two endings.
UI chrome is DOM canvases quantized to 1-bit under a multiply palette
overlay (ADR-0007) — any tooltip system must follow that pattern (white on
black backing plate, `quantizeCanvas1Bit`).

## The ask (from the owner, 2026-06-09)

Onscreen tooltips for playable elements plus the verbs themselves:
**cutting down trees, dragging logs down, sabotaging pumphouses, blocking
drains, invading swimming pools, building lodges, etc.**

Glagstone reference: contextual icon chips (the hammer chip in the
reference screenshot) — small ornate-bordered prompts that appear when an
interaction is available.

## Grill agenda (the decision tree)

1. ROOT — economy: do all verbs spend the same daily action budget, or do
   heavy verbs (fell, lodge) cost multiple actions / take in-world time?
   Wrong answer invalidates everything downstream.
2. Log logistics: fell → log entity. Carry one at a time (beaverGame Mode A
   parity), or drag-chain? Are logs REQUIRED for dams/lodges (making dam no
   longer free), or a speed-up?
3. Sabotage fiction + sim hook: pump station currently is set dressing.
   Proposal: an active pump drains N wet cells/night (this also fixes the
   flood-balance problem — the suburb finally fights back); sabotage
   disables it for K nights. Does sabotage have a counter (repair crew)?
4. Swimming pools: new prop + what does "invading" do — instant wet cell
   colony? resident reaction accelerator?
5. Lodge: win-condition home, fast-travel point, or save point?
6. Tooltip surface: chip anchored near the avatar (screen-space DOM) showing
   key + verb ("E — GNAW"); how many simultaneous affordances before noise?
   Keyboard vs click-to-act?
7. Resident reactions: do destructive verbs (sabotage, invade) change
   resident lines / HOA newsletter beats? (Cheap, high story value.)

## Constraints

- 1-bit invariant (2 RGB values per screenshot) is enforced — tooltips
  must go through the DOM-canvas + quantize path.
- New sprites (log, lodge, pool, sabotaged-pump state, tooltip icons) come
  from the foundry pipeline (`asset-foundry/sprites.yaml` + fixtures),
  never hand-drawn.
- Flood core stays pure; verbs mutate the grid only via explicit functions
  (like `placeDam`).
- Vertical slices: each verb should ship demoable on its own.

## Relationship to sibling beads

- `20260609-2210-brief-grill-procedural-willow-bend.md` — verbs must work on
  procedurally spawned props too (no hardcoded prop lists).
- `20260609-2220-brief-grill-swamp-vs-suburbs-factions.md` — if the faction
  mode happens, verbs likely become unit abilities; design the verb registry
  so an AI/faction controller could invoke it, not just the input handler.

## Landing zone: the Mechanics Lab (added 2026-06-09, ADR-0008)

This grill's mechanics must land as composable *dynamics* in the Mechanics
Lab (`src/lab/config.ts`, `?mode=lab` launcher) — NOT as a separate mode or
branch. Each new dynamic gets a `DynamicId`, gates in `OverworldScene`, and
parameter knobs, so it can be playtested in weird combinations with every
other dynamic (Wright-style toy prototyping; see the `pump` dynamic +
`src/sim/pump.ts` as the reference implementation, and the PUMP WARS preset
as the reference toy). Design the grill's output with its lab toy(s) named:
what is the smallest `dyn=` combination that answers this grill's root
question?
