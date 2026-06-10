# 0001 — Excalibur.js over PixiJS for the iso renderer

**Status:** Accepted, 2026-05-09

## Context

`lofi-beaver` is a *mechanic-validation* prototype, not a vertical slice. The
target is "playable in two weeks" and the question we're answering — *do the
tile-aware BFS flood rules feel correct?* — is orthogonal to render-layer
choice. So the deciding axis is iteration velocity, not bundle size or
ceiling-of-customisation.

The two finalists were PixiJS v8 and Excalibur.js. Phaser 4 was eliminated for
weight and post-v4 isometric uncertainty. Raw Canvas 2D was eliminated for
re-inventing input/scene/timing.

## Decision

Excalibur.js.

## Why

- Native `IsometricMap` primitive. PixiJS has no built-in iso; you write the
  projection math, pointer-to-tile inversion, and z-ordering yourself. ~2
  helper functions if it goes well, ~1 week of fiddly bugs if it doesn't.
- TypeScript-first. The whole project is TS; matching the engine's primary
  language removes friction.
- Tiled plugin (`@excaliburjs/plugin-tiled`) for M4. PixiJS would require
  hand-rolling the Tiled JSON loader.
- Scene/Engine/Loader primitives are sufficient for a prototype — no need to
  bolt on a state library.

## Tradeoffs (the weakest point)

Excalibur is a heavier framework lock-in than Pixi. If this prototype graduates
to a vertical slice and we discover we need a custom renderer (e.g., a real
Bayer-dither shader pass), Excalibur's graphics-context abstraction is harder
to escape than Pixi's direct WebGL access.

Mitigation: the prototype's render needs are deliberately small (1-bit tiles,
no dynamic lighting, no shader effects). If we hit Excalibur's ceiling, that's
a signal the prototype is succeeding and graduating — the rewrite cost is
acceptable at that point.

## Alternatives rejected

- **PixiJS v8 + custom iso math.** Smallest bundle, fullest control. Wrong
  axis for a prototype: control matters less than time-to-playable.
- **Phaser 4.** Heavier, isometric-plugin status post-v4 unclear, less
  TypeScript-idiomatic.
- **Raw Canvas 2D.** Maximum minimalism, but re-implements input, scene,
  game loop, asset loading. Pure novelty cost.
- **Three.js orthographic camera at iso angle.** Overkill; we'd be paying for
  a 3D pipeline we don't use.
