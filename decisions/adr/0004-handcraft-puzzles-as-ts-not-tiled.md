# 0004 — Author the v0 puzzles as TypeScript modules, not Tiled JSON

**Status:** Accepted, 2026-05-09

## Context

The original plan called for three handcrafted puzzles authored in Tiled and
loaded from JSON via `src/maps/load.ts`. Two practical issues with that path:

1. Tiled is a GUI editor. The current build environment doesn't run a GUI.
2. Hand-writing Tiled's JSON is the same labour as a TypeScript module, and
   loses type safety + skips a parse step.

The thing the plan actually cared about — three handcrafted layouts the player
can run — doesn't depend on Tiled.

## Decision

Author the v0 puzzles as TypeScript modules under `src/maps/puzzles/`. Each
module exports a `PuzzleConfig`. A small string-art parser (`src/maps/parse.ts`)
turns multi-line ASCII layouts into a `Grid` plus `sources` / `target`
coordinates, so the layout reads almost as well as a Tiled tilemap.

```
######~######
#.>...A...T#
#......#...#
#####...####
```

Legend:

- `.` lot, `A` arterial, `C` cul-de-sac, `S` swale, `P` pond, `#` curb
- `>` source (also a lot), `T` target (also a lot)
- whitespace is ignored

## Why

- Same authoring time as Tiled JSON.
- TypeScript type-checks the surrounding `PuzzleConfig` (budget, time, etc).
- Diff-friendly, code-reviewable, no binary editor needed.
- Drops a runtime JSON-load dependency from the v0 critical path.

## Tradeoffs (the weakest point)

ASCII layouts are awkward beyond ~16×16 — the visual proportions of an iso
grid don't match a square monospace text grid. For larger maps (or once
elevation enters the model), Tiled becomes the correct tool. Plan to revisit
when (a) any single puzzle needs more than 16×16 tiles or (b) a Tiled-only
feature like layered metadata becomes necessary.

## How to apply

- Each puzzle lives in `src/maps/puzzles/<name>.ts` and exports a
  `PuzzleConfig`. The list of all puzzles lives in
  `src/maps/puzzles/index.ts`.
- The string-art parser lives in `src/maps/parse.ts` and is shared by tests
  and runtime.
- A future Tiled adapter, if needed, plugs in at the same `PuzzleConfig` seam
  — no changes required to `puzzle.ts` or rendering.
