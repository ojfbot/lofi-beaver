# 0002 — Tiled (staggered isometric) over LDtk for level authoring

**Status:** Accepted, 2026-05-09

## Context

We need a level editor for ~3 handcrafted MPC layouts (M4). Two options:
**Tiled** and **LDtk**.

## Decision

Tiled. Staggered isometric (not "true diamond" iso) for the projection.

## Why

- LDtk explicitly does not support isometric. From the LDtk site: "Sorry, no
  isometric 3D here!" — that's the end of the comparison.
- Tiled supports staggered iso natively. Each odd row/column shifts by half a
  tile, eliminating stretched sprite art and matching Excalibur's
  `IsometricMap` semantics.
- JSON export. Plain text, diffable, parseable in <50 lines of TypeScript.

## Why staggered, not "true diamond"

True diamond iso renders tiles as actual rotated rhombi, which forces sprite
art to be authored at the projection's exact angle and makes adjacency
computation more painful. Staggered iso keeps the *grid* axis-aligned (so
`grid[y][x]` indexing stays trivial) and only shifts the *display* coordinates.
For BFS over the grid this is strictly easier — the propagation code lives in
grid-space and never needs to know about projection.

## Tradeoff (the weakest point)

Staggered's neighbour topology is non-uniform: a tile in an even row has
different screen-space neighbours than one in an odd row. The grid-space BFS
doesn't care, but anything that takes mouse coordinates and asks "which tile?"
has to handle the stagger. Mitigation: one helper, `screenToTile()`, written
once and tested.
