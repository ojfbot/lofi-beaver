# 0008 — Mechanics Lab: composable dynamics, not gameplay forks

**Status:** Accepted, 2026-06-09

## Context

Three roadmap directions are in parallel design grills (verbs/tooltips,
procedural world, swamp-vs-suburbs factions — see `.handoff/20260609-22*`),
and the owner wants to playtest fundamental and complex mechanics in weird
combinations. The naive structure — parallel gameplay-mode git forks — would
rot immediately: all three directions share a living sim core, sprite
pipeline, and palette architecture.

The proven alternative is Will Wright's prototyping discipline: Spore was
designed by searching its possibility space with dozens of cheap standalone
toys, each isolating one dynamic (Gingold/Hecker, GDC 2006 "Advanced
Prototyping"), over layered simple simulations (SimCity's interacting CA
layers). Toys first, games (goals) layered on after.

## Decision

One trunk, **composable dynamics**:

- Every gameplay mechanic is a `DynamicId` gated by `LabConfig`
  (`src/lab/config.ts`): `title, clock, flood, dams, pump, beats,
  residents, heron` — plus parameter knobs (`ticks, dt, budget, days, pump`).
- `OverworldScene` takes a `LabConfig`; the shipped game is just
  `fullGameConfig()` (every dynamic except `pump`).
- `?mode=lab&dyn=flood,dams&ticks=6` boots any combination. URLs are the
  experiment records: shareable, diffable, runnable side-by-side in
  parallel tabs (that is the "parallel forks" ask, without branches).
- `?mode=lab` bare opens the **launcher**: dynamics toggles, knobs, and
  named preset toys (CLASSIC SEASON, TOY POND, PUMP WARS, DELUGE WITNESS,
  QUIET TOWN).
- With `clock` off, **N** steps one night manually — the sandbox/toy mode.
- New mechanics from the roadmap grills MUST land as dynamics in this
  registry (the factions grill: each faction = a dynamic; the verbs grill:
  the verb registry is a dynamic surface; worldgen: a `map=` source param).

First new dynamic shipped with the lab: **pump** (`src/sim/pump.ts`) — the
suburb drains up to `pumpPower` wet cells nearest the pump station each
night. Deterministic, tested, and immediately produced an emergent finding:
drained cells re-flood from the spring, so suppression equilibrates at
~one night's pump power. The tug-of-war is real and tunable.

## Consequences

- Gains: no merge hell; combinatorial playtesting; every grill outcome has
  a landing zone; balance work becomes knob-sweeping; experiment URLs can
  be pasted into beads/issues as repro cases.
- Costs: OverworldScene carries gate checks (acceptable at this scale; if
  gates exceed ~a dozen, extract a System/registry pattern — that
  extraction decision belongs to the factions grill, which needs it first).
- Exemption: the lab **launcher** is tooling and uses styled DOM text — it
  is exempt from the 2-color histogram gate. Gameplay screens (any `dyn=`
  combination) remain strictly 1-bit; the lab chip is quantized like all
  HUD.
