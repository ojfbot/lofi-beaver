---
id: 20260609-2125-techdebt-adobe-firefly-node-layer
type: techdebt
title: "Pluggable Adobe Firefly node layer feeding the vignette pipeline"
actor: code-claude
to: any
session_id: 2026-06-09
refs:
  - file:asset-foundry/fixtures/_sprite_lib.py
  - file:decisions/adr/0007-three-state-sprites-display-layer-palette.md
  - file:../asset-foundry/decisions/adr/draft-sprite-output-modality.md
hook: vignette-pipeline
status: live
created_at: 2026-06-09T21:25:00-05:00
labels:
  project: lofi-beaver
  repo: lofi-beaver
  phase: post-slice-4
---

## Context

Slice 4 ships story vignettes as Blender Freestyle line-art renders of the
same 3D sources as the sprites (`run_vignette` in
`asset-foundry/fixtures/_sprite_lib.py`, banded 1-bit quantization). This
keeps one source of truth but caps the illustrations at "procedural sketch"
quality — Glagstone's hand-inked panels have looser, gestural linework.

## The debt

Design and integrate a **pluggable Adobe Firefly layer** for the vignette
path, conceived as nodes in a node-based pipeline (Blender compositor/geometry
nodes or an equivalent external node graph) so it can feed INTO Blender
rather than bypass it:

- **Machine interface:** the Adobe MCP (Firefly image gen + image ops —
  `image_apply_halftone`, `image_vectorize`, generative APIs) callable as a
  pipeline stage: render → Firefly stylize ("rough ink pen sketch") →
  re-quantize through `banded_1bit` so the 1-bit purity gate still holds.
- **Human interface:** the same insertion point usable from the Adobe UI for
  hand-touched panels (artist draws over the Freestyle base, drops the file
  back into `asset-foundry/dist/sprites/`, validator re-gates it).
- Gate: output must still pass the vignette validation (dims, 1-bit purity,
  coverage) — the stylize layer is allowed to change *which* pixels are ink,
  never the pixel vocabulary.

## Why not now

The Freestyle path proves the panel/beat machinery end-to-end and is fully
deterministic + offline. The Firefly layer adds external API dependency and
auth; it should arrive as its own slice with a shadow stage (generate
alongside Freestyle, compare, then switch).
