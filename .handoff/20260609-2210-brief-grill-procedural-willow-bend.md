---
id: 20260609-2210-brief-grill-procedural-willow-bend
type: brief
title: "Grill: procedural Willow Bend — Zelda-style chunked world, spawn-as-you-explore"
actor: code-claude
to: any
session_id: 2026-06-09
refs:
  - file:src/maps/world.ts
  - file:src/maps/willow-bend.ts
  - file:src/scenes/overworld.ts
  - file:src/flood/grid.ts
  - file:asset-foundry/sprites.yaml
  - file:../asset-foundry/decisions/adr/draft-sprite-output-modality.md
hook: next-roadmap
status: live
created_at: 2026-06-09T22:10:00-05:00
labels:
  project: lofi-beaver
  repo: lofi-beaver
  phase: roadmap-2
---

## Run me

Open this repo and run `/grill-with-docs` with this bead as the subject.
Output: design concept + ADR stub for the world/streaming architecture.

## Context (what exists)

One hand-authored 24×18 map (`maps/willow-bend.ts`, string-art parsed by
`maps/world.ts` into terrain + props + a flood `Grid`). One `ex.IsometricMap`
holds all tiles; props are depth-sorted actors; the flood BFS runs over the
single grid each night. Everything assumes one fixed-size world.

## The ask (from the owner, 2026-06-09)

Make the map MUCH bigger, procedurally generating/spawning as the player
explores — target Zelda-style exploration.

## Grill agenda (the decision tree)

1. ROOT — what is "Zelda-style" here: (a) one large authored-feeling
   overworld revealed by exploration (screens/regions with identities —
   the golf course, the strip mall, the old creek), or (b) infinite
   procedural sprawl? (a) implies a region-graph generator with hand
   rules; (b) implies chunk noise. Very different generators.
2. Generation grammar: suburbs are *patterns* — arterial loops, cul-de-sac
   pods, retention ponds every N lots, swale easements between pods. A
   road-grammar generator (L-system-ish) over chunk templates vs WFC vs
   hand-authored chunk library stitched procedurally?
3. Simulation scale: does the flood sim run over the WHOLE generated world
   each night (grid grows — O(cells) fine to ~100k?) or per-loaded-region
   with boundary flow assumptions? Water continuity across unloaded chunks
   is the hard correctness question.
4. Streaming: one IsometricMap per chunk, mounted/unmounted on proximity;
   prop actor pooling; persistence of player changes (dams, felled trees)
   in unloaded chunks.
5. Determinism: seed strategy so a season is replayable (the fixture
   contract's determinism discipline, applied to worldgen).
6. Foundry tie-in: house/tree VARIANTS (sprites.yaml `frames` as variants
   already works) — how many archetypes does believable sprawl need? Is
   this the moment asset-foundry's WorldDesigner sub-agent generates chunk
   manifests? (That's the foundry's actual Phase-2 concept.)
7. Region identity beats: new POIs (golf course, school, strip mall,
   country club pool) as story-beat anchors — which 3 ship first?

## Constraints

- Day strip / beats / endings must keep working: season structure is the
  spine, exploration hangs off it.
- 64×32 tile + frozen camera contract is settled (ADR-0006) — worldgen
  outputs the same world.ts shapes (terrain kinds + prop list + blocked).
- Mobile-class perf not required; 60fps desktop at zoom 2 is.

## Relationship to sibling beads

- Verbs bead: interactables must registry-spawn with chunks.
- Factions bead: if AoE-mode happens, this generator doubles as the
  skirmish-map generator — keep it scene-agnostic.

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
