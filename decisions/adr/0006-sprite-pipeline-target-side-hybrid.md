# 0006 — Sprite pipeline lives target-side; contract designed foundry-native ("true hybrid")

**Status:** Accepted, 2026-06-09

## Context

asset-foundry outputs `.glb` only — no sprite/pixel modality exists. The
reboot (ADR-0005) needs a `Blender model → fixed iso ortho camera → low-res
render → 1-bit Bayer quantize → sprite strip + metadata` pipeline. Building it
inside asset-foundry core first would mean churning the Zod schema, LangGraph
graph, and validator on every dither/camera iteration while the visual
language was still unsettled.

## Decision

All pipeline **code** lives in this repo's target directory
(`asset-foundry/fixtures/_sprite_lib.py`, `_mesh.py`, per-asset fixtures,
`sprites.yaml`, `scripts/render-sprites.ts`, `scripts/validate-sprites.ts`).
asset-foundry core is untouched. The **contract** is designed as if
foundry-native so promotion later is a discriminated-union extension:

- Manifest: `sprites.yaml` (`id, kind: sprite|vignette, canvas_px, frames,
  footprint`) — deliberately *not* wedged into `world.yaml` (core Zod strips
  unknown keys).
- Fixture contract mirrors §4.4: deterministic seed, fresh scene per frame,
  headless render, one `FOUNDRY_SUMMARY` JSON line
  (with a `"kind"` discriminator).
- Output per asset: `<id>_v1.png` (horizontal frame strip) +
  `<id>_v1.sprite.json` (frame grid, anchor_px, footprint, ppu, camera) +
  `<id>_v1.validation.json` with sprite gates: exact dims, **1-bit purity**
  (every pixel ink/paper/void exactly), ink coverage ∈ [0.01, 0.95], anchor
  in bounds. The game's loader refuses unvalidated art in dev (ports
  beaverGame's `load-glb.ts` tripwire).

Frozen camera contract (verified live on Blender 5.1.1 / `BLENDER_EEVEE`):
yaw 45°, elevation 30° (sin 30° = ½ ⇒ exact 2:1 diamond), `ppu = 64/√2`,
`ortho_scale = canvas_px_w·√2/64`, Bayer 8×8 indexed by canvas coords
(phase-locked ⇒ seamless tiling), sun azimuth 30° (lights the camera-facing
walls; three-tone iso read).

## Promotion TPMs (data-gated, RIDM-style)

Promote into asset-foundry core (as a `sprite` output modality) only when:

1. ≥ 12 distinct assets have shipped through the pipeline with zero manual
   pixel retouches — **met 2026-06-09 (14 assets)**.
2. Camera/dither constants unchanged across two consecutive slices —
   **met** (frozen in Slice 1, unchanged through Slice 4).
3. Validator gate pass rate 100% on regeneration from clean checkout —
   **met** (12/12 validated).
4. A second consumer target is identified — **open** (candidates: beaverGame
   minimap/UI sprites, carrier-pigeon).

The corresponding asset-foundry draft ADR is staged at
`asset-foundry/decisions/adr/draft-sprite-output-modality.md`; promotion is a
future decision, not part of this delivery.
