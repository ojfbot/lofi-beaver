---
id: 20260609-2220-brief-grill-swamp-vs-suburbs-factions
type: brief
title: "Grill: SWAMP vs SUBURBS — AoE-style faction mode (beavers, alligators, herons, mosquitos)"
actor: code-claude
to: any
session_id: 2026-06-09
refs:
  - file:src/flood/propagate.ts
  - file:src/sim/ending.ts
  - file:src/story/residents.ts
  - file:decisions/adr/0005-story-world-reboot.md
  - file:../beaverGame/.github/planning/MODE_A_CURRENT_STATE.md
hook: next-roadmap
status: live
created_at: 2026-06-09T22:20:00-05:00
labels:
  project: lofi-beaver
  repo: lofi-beaver
  phase: roadmap-2
---

## Run me

Open this repo and run `/grill-with-docs` with this bead as the subject.
**Run this grill FIRST among the three roadmap beads** — its root answer
reshapes the verb system and the worldgen target.

## Context (what exists)

A single-avatar explore-witness game: you ARE the beaver; the flood sim is
the antagonist-slash-protagonist; the suburb reacts through resident cards
and beats; seasons end in one of two endings. ADR-0005 frames lofi-beaver
as the story-world prototype.

## The ask (from the owner, 2026-06-09)

"What about targeting Age of Empires gameplay style of **swamp vs suburbs**
— player is beavers, alligators, herons, mosquitos."

## The tension to resolve openly (don't paper over it)

AoE-style means: faction-level control, multiple units, an opposing AI
(the suburb: HOA, landscapers, pump crews, insurance adjusters), economy,
win conditions. That is a DIFFERENT CONTROL MODEL from the shipped
explore-witness avatar. Three honest framings — the grill's root question:

A. **Pivot**: lofi-beaver becomes the RTS prototype; avatar mode was a
   stepping stone.
B. **Second mode**: "Season" (current, cozy, story) + "Skirmish" (RTS)
   sharing the flood sim, sprite pipeline, map format. Cost: two input
   systems, two UIs.
C. **Indirect-control hybrid** (most novel, most on-tone): you still play
   ONE beaver avatar, but ally factions act autonomously and you *influence*
   them (Pikmin/Majesty-style indirect command) — herons hunt where water
   stands, gators claim deep cells, mosquito pressure scales with stagnant
   wet area driving residents out. The suburb runs its own playbook
   (pumps, French drains, re-sodding). AoE *dynamics* without abandoning
   the avatar.

## Faction sketches (to react against, not to keep)

- **Beavers** — engineering: dams, lodges, canals (water transport speed).
- **Herons** — recon + strike: reveal map, suppress pump crews?
- **Alligators** — territory control: deep-water cells become no-go for
  repair crews; slow, terrifying, few.
- **Mosquitos** — attrition aura: stagnant water radius lowers resident
  morale → earlier move-outs; the suburb counters with fogging trucks.
- **The Suburb (AI)** — pumps drain nightly, landscapers re-sod, drainage
  committee upgrades swales, insurance adjusters condemn flooded lots
  (removing them from play = scoring).

## Grill agenda

1. ROOT: framing A, B, or C above?
2. Time model: real-time-with-days (current clock) or tick-based RTS time?
   Does the daily dawn/dusk loop survive as the macro rhythm?
   (Recommendation to defend: it should — it's the game's identity.)
3. Win conditions: rewild %, resident move-out count, or the season-end
   verdict generalized to a victory screen? Losing = HOA stabilizes?
4. Control: direct unit selection (true AoE) vs influence verbs (C)?
   Selection UI in 1-bit at zoom 2 is a real readability question.
5. Suburb AI: scripted playbook tiers (Brassboard: observe-only suburb
   first — log what it WOULD do nightly before it acts — per the
   control-gates discipline)?
6. Scope fence: what is the smallest skirmish slice — one pond, two
   factions (beavers + suburb), one win condition?
7. Sprite order: gator (2-frame lurk/lunge), mosquito cloud (animated
   stipple swarm — basically free in this art style), fogging truck,
   landscaper crew. All foundry fixtures.

## Constraints

- Flood core stays the shared substrate — factions read/write the grid
  through explicit functions, same as verbs.
- 1-bit invariant + palette overlay apply to any RTS UI (selection
  rectangles, command chips = DOM canvases, quantized).
- Keep the melancholic-funny register: this is not a war game; it's a
  zoning dispute with teeth.

## Relationship to sibling beads

- Verbs bead: under framing C, verbs = the influence API factions consume.
- Procedural bead: skirmish maps come from the same generator.

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
