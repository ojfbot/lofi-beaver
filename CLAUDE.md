# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## What this is

The Excalibur.js client for **lofi-beaver** — the Glagstone-inspired, 1-bit
isometric **story-world prototype of Willow Bend** (the Master Planned
Community built on a buried wetland, shared lore with beaverGame Mode B).
You roam as the beaver in real time, spend a daily action budget (dams), and
the v0-validated flood BFS resolves each night while story vignettes fire at
dawn. Vanilla TypeScript + Vite + Excalibur. Sibling to
[`beaverGame/`](../beaverGame).

**Art is generated, not committed by hand:** the 1-bit iso sprites and
Freestyle ink vignettes come from headless Blender via the target-side sprite
pipeline under `asset-foundry/` (the brassboard for a future asset-foundry
core modality — see ADR-0006 and
`../asset-foundry/decisions/adr/draft-sprite-output-modality.md`).

First read: `decisions/adr/0005`–`0007` (the reboot, the pipeline, the
display-layer palette).

## Modes

- default (`/`) — **overworld**: the Willow Bend story world
  (= `fullGameConfig()` — every dynamic except `pump`)
- `?mode=lab` — **Mechanics Lab** (ADR-0008): launcher with presets/knobs;
  `?mode=lab&dyn=flood,dams&ticks=6` boots any dynamic combination over the
  same world. With `clock` off, **N** steps a night. New mechanics MUST land
  as lab dynamics (`src/lab/config.ts`), never as mode forks/branches.
- `?mode=puzzle` — legacy v0 mechanic-validator (vector-drawn, zero assets)
- `?mode=spritetest` — terrain sprite proof grid (seam/dither check)

## Architecture

### Sprite pipeline (asset-foundry/ target dir)
- `asset-foundry/sprites.yaml` — the sprite manifest (order book)
- `asset-foundry/fixtures/_sprite_lib.py` — camera contract (yaw 45°,
  elev 30°, ppu 64/√2), EEVEE render settings, numpy Bayer 8×8 quantize
  (three-state: ink/paper/void), outline ring, `run_sprite` / `run_vignette`
- `asset-foundry/fixtures/_mesh.py` — bmesh builders (normals recalced —
  hand-wound faces render black otherwise)
- `asset-foundry/fixtures/<id>.py` — one fixture per asset (§4.4-compatible)
- `scripts/render-sprites.ts` — headless Blender runner → dist → syncs to
  `public/assets/sprites/`
- `scripts/validate-sprites.ts` — gates: dims, 1-bit purity, coverage, anchor

```bash
pnpm sprites [id…]          # regenerate (needs Blender 5.1.x at BLENDER_BIN)
pnpm sprites:validate [id…] # gate + write .validation.json
```

### Game (src/)
- `assets/sprite-loader.ts` — registry; refuses unvalidated PNGs in dev.
  **Never set sprite.tint** (Excalibur 0.30.3 drops tinted sprites on the
  actor path — ADR-0007).
- `scenes/overworld.ts` — IsometricMap terrain + depth-sorted prop actors +
  daily loop wiring + dam placement + beat checks
- `maps/world.ts` + `maps/willow-bend.ts` — string-art world map (terrain +
  props + spawn); `flood/` types underneath
- `avatar/beaver.ts` — WASD/arrows, tile collision, 4-direction strip
- `sim/day-cycle.ts` — dawn→day→dusk→night state machine (injectable durations)
- `sim/actions.ts` — daily budget + dam placement validation (range 2)
- `flood/` — **untouched v0 BFS core**; runs as the nightly resolver
  (12 ticks × dt 0.5, deterministic)
- `story/beats.ts` — dawn-checked, simulation-driven story beats (one per
  dawn; the heron beat also spawns the heron actor at the water's edge)
- `story/residents.ts` — one household per house, stable map-scan order;
  click a house for its card; lines change once the crawlspace floods
- `sim/ending.ts` — dawn after day 14, the watershed's state picks the
  ending: ≥ 2 flooded houses → THE WATERSHED REMEMBERS, else THE POND STAYS
  POLITE; `seasonOver` freezes the clock
- `ui/day-strip.ts`, `ui/vignette.ts`, `ui/panel.ts`, `ui/title.ts`,
  `ui/location-panel.ts` — **DOM canvases**, not ScreenElements (those
  inherit camera zoom); quantized to 1-bit after drawing; HUD needs an
  opaque paper backing plate
- `palette.ts` — the display-layer palette: everything draws white-on-black;
  a `mix-blend-mode: multiply` overlay applies INK. Day/night = one DOM write.

## Dev commands

```bash
pnpm install
pnpm dev                  # vite at http://localhost:5180 (falls back if busy)
pnpm typecheck            # tsc --noEmit
pnpm test                 # vitest run (flood core + world parse + day cycle)
pnpm build                # vite build
pnpm snap                 # tsx scripts/snap.ts → tmp/snap.png
SNAP_SOFT_GL=1 pnpm snap  # software WebGL — survives GPU contention
```

## The 1-bit invariant (ADR-0007)

A screenshot of the running game contains **exactly two RGB values** in any
phase: paper `#000000` + the active ink (day `#e8e0d0`, night `#aebad0`).
Enforced end-to-end:
- sprites are three-state (ink/paper/void) — paper occludes, void passes
- palette is the multiply overlay, never per-sprite tint
- DOM UI is 1-bit-quantized after drawing
- verify with a pixel-histogram of a snap (2 unique colors or it's a bug)

## Conventions inherited from beaverGame

- **`tsconfig.json` has `"noEmit": true`**; `pnpm build` runs `vite build`
  only. **Never re-enable emit** (stale `.js` shadow files freeze the runtime).
- **pnpm only.** `pnpm dlx` for one-offs.
- ADR-numbering: `decisions/adr/NNNN-<slug>.md`, monotonic per repo.
- Snap-iteration loop: edit → `pnpm snap` → read `tmp/snap.png`.
- Vite watcher: `usePolling` is on (fsevents starves under concurrent-agent
  load and silently serves stale modules).

## Tile vocabulary (flood core)

Six types — see `src/flood/tiles.ts`: `lot`, `arterial`, `culdesac`, `swale`,
`pond`, `curb`. World terrain maps onto these in `maps/world.ts`
(grass→lot, road→arterial, water→pond, swale→swale).

## Open threads

- Firefly vignette layer: `.handoff/20260609-2125-techdebt-adobe-firefly-node-layer.md`
- Promotion of the sprite pipeline into asset-foundry core is gated on a
  second consumer target (see draft ADR in asset-foundry).
- Not yet built: gnaw/lodge actions, swale + cul-de-sac tile sprites,
  restart-after-ending, flood balance pass (the source currently wins any
  long game; dams only delay it — arguably the theme, definitely untuned).

## Process: PR + rebase-only (no direct pushes to main)

Main is governed by an active repo ruleset (mirrors core's, plus required
status checks core doesn't have):

- **All changes land via PR** — including docs and ADRs. No direct commits
  to main; force pushes and branch deletion are blocked.
- **Rebase is the only merge method** (merge commits and squash are disabled
  repo-wide). Keep branches rebased on main; history stays linear.
- **Required checks**: `build-test` (typecheck → test → build →
  validate-sprites) and `visual-gate` (headless-browser 1-bit invariant)
  must pass before merge; the branch must be up to date with main (strict).
- Solo-dev review policy: 0 approvals required — checks are the gate, the
  PR is the record. Branches auto-delete on merge.
