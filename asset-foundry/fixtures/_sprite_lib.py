"""Shared helpers for 1-bit isometric sprite fixtures (the lofi-beaver sprite modality).

This is the target-side brassboard of a future asset-foundry output modality
(see decisions/adr/0006-sprite-pipeline-target-side-hybrid.md). The contract
mirrors asset-foundry's fixture contract (§4.4): deterministic seed, fresh
scene, headless render, one FOUNDRY_SUMMARY line on stdout. Output is a
white-on-transparent 1-bit mask PNG (multi-frame = horizontal strip) — palette
is applied at runtime by the game (tint), which is what keeps the 1-bit
invariant structural.

Camera contract (frozen by the Slice-1 spike, Blender 5.1.1 / BLENDER_EEVEE):
  yaw 45°, elevation 30° (sin 30° = 0.5 ⇒ exact 2:1 diamond, 64×32 tile)
  ppu = 64/√2 ≈ 45.2548 px per world unit
  ortho_scale = canvas_px_w × √2 / 64
  anchor = world origin projected via world_to_camera_view (tile canvas → 32,16)

Each fixture imports via:
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from _sprite_lib import run_sprite, make_material
and defines  build_frame(frame: int) -> list[bpy.types.Object]
"""
import bpy
import json
import math
import os
import sys
import tempfile
import numpy as np
from mathutils import Vector

TILE_W = 64                      # px — on-screen diamond width of a 1×1 world tile
PPU = TILE_W / math.sqrt(2.0)    # ≈ 45.2548 px / world unit
ELEV_DEG = 30.0                  # sin 30° = 0.5 → 2:1 diamond
YAW_DEG = 45.0
SUN_EULER = (math.radians(50), 0.0, math.radians(30))  # fixed: lights the camera-facing -y + x walls (three-tone iso read)

EXPECTED_BLENDER = (5, 1)

BAYER8 = np.array([
    [ 0, 32,  8, 40,  2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44,  4, 36, 14, 46,  6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [ 3, 35, 11, 43,  1, 33,  9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47,  7, 39, 13, 45,  5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21],
], dtype=np.float32)


def resolve_engine() -> str:
    engines = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
    for candidate in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "BLENDER_WORKBENCH"):
        if candidate in engines:
            return candidate
    raise RuntimeError(f"no usable render engine among {engines}")


def assert_blender_version() -> None:
    if bpy.app.version[:2] != EXPECTED_BLENDER:
        raise RuntimeError(
            f"sprite pipeline frozen against Blender {EXPECTED_BLENDER[0]}.{EXPECTED_BLENDER[1]}.x, "
            f"running {bpy.app.version_string} — re-verify camera/engine constants before bumping"
        )


def parse_argv():
    """Return out_png path from argv after `--` (default: ./out.png)."""
    argv = sys.argv
    sep = argv.index("--") if "--" in argv else len(argv)
    extras = argv[sep + 1:]
    return extras[0] if extras else "out.png"


def fresh_scene(asset_id: str, frame: int) -> None:
    import random
    random.seed((hash(asset_id) & 0xFFFF) + frame * 7919)
    bpy.ops.wm.read_factory_settings(use_empty=True)


def make_material(albedo: float = 1.0) -> bpy.types.Material:
    """Plain diffuse gray — the sprite carries *shading*, not color. Lower
    albedo ⇒ sparser dither ⇒ reads darker on paper."""
    mat = bpy.data.materials.new(f"sprite_albedo_{albedo:.2f}")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfDiffuse")
    bsdf.inputs["Color"].default_value = (albedo, albedo, albedo, 1.0)
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def _add_sun(energy: float = 4.5) -> None:
    sun_data = bpy.data.lights.new("sun", type="SUN")
    sun_data.energy = energy
    sun = bpy.data.objects.new("sun", sun_data)
    bpy.context.collection.objects.link(sun)
    sun.rotation_euler = SUN_EULER


def _setup_iso_camera(px_w: int, px_h: int, aim_z: float):
    cam_data = bpy.data.cameras.new("iso_cam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = px_w * math.sqrt(2.0) / TILE_W
    cam_data.clip_start = 0.1
    cam_data.clip_end = 200.0
    cam = bpy.data.objects.new("iso_cam", cam_data)
    bpy.context.collection.objects.link(cam)
    cam.rotation_euler = (math.radians(90.0 - ELEV_DEG), 0.0, math.radians(YAW_DEG))
    direction = cam.rotation_euler.to_matrix() @ Vector((0.0, 0.0, 1.0))
    cam.location = direction * 50.0 + Vector((0.0, 0.0, aim_z))
    bpy.context.scene.camera = cam

    scene = bpy.context.scene
    scene.render.engine = resolve_engine()
    scene.render.resolution_x = px_w
    scene.render.resolution_y = px_h
    scene.render.resolution_percentage = 100
    scene.render.filter_size = 0.01
    scene.render.film_transparent = True
    scene.render.dither_intensity = 0.0
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    if hasattr(scene, "eevee"):
        try:
            scene.eevee.taa_render_samples = 1
        except AttributeError:
            pass
    return cam


def _anchor_px(cam, px_w: int, px_h: int) -> list:
    from bpy_extras.object_utils import world_to_camera_view
    co = world_to_camera_view(bpy.context.scene, cam, Vector((0.0, 0.0, 0.0)))
    return [round(co.x * px_w, 2), round((1.0 - co.y) * px_h, 2)]


def _render_frame_pixels(px_w: int, px_h: int) -> np.ndarray:
    """Render current scene, reload as float RGBA array (row 0 = top)."""
    tmp = os.path.join(tempfile.gettempdir(), f"sprite_raw_{os.getpid()}.png")
    bpy.context.scene.render.filepath = tmp
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(tmp)
    img.colorspace_settings.name = "Non-Color"
    px = np.array(img.pixels[:], dtype=np.float32).reshape(px_h, px_w, 4)
    bpy.data.images.remove(img)
    os.remove(tmp)
    return px[::-1]


def quantize_1bit(px: np.ndarray, gamma: float = 1.0) -> np.ndarray:
    """RGBA float (top-down) → three-state 1-bit sprite. Bayer indexed by
    final-canvas pixel coords so the pattern is phase-locked across every
    sprite rendered through the fixed camera (⇒ seamless tiling).

    Pixel states:
      ink   — (1,1,1,1) white; the runtime palette overlay multiplies it to INK
      paper — (0,0,0,1) opaque black; the model's silhouette OCCLUDES what's
              behind it (a prop's shadow side must cover bright terrain
              underneath, not let it show through)
      void  — (0,0,0,0) outside the silhouette; terrain/background shows through
    """
    h, w, _ = px.shape
    lum = 0.2126 * px[:, :, 0] + 0.7152 * px[:, :, 1] + 0.0722 * px[:, :, 2]
    if gamma != 1.0:
        lum = np.power(np.clip(lum, 0.0, 1.0), 1.0 / gamma)
    yy, xx = np.mgrid[0:h, 0:w]
    thresh = (BAYER8[yy % 8, xx % 8] + 0.5) / 64.0
    ink = lum > thresh
    solid = px[:, :, 3] > 0.5
    mask = np.zeros((h, w, 4), dtype=np.float32)
    mask[solid & ~ink] = (0.0, 0.0, 0.0, 1.0)
    mask[solid & ink] = (1.0, 1.0, 1.0, 1.0)
    return mask


def threshold_1bit(px: np.ndarray, cutoff: float = 0.5) -> np.ndarray:
    """Pure threshold (no dither) — same three-state output as quantize_1bit."""
    h, w, _ = px.shape
    lum = 0.2126 * px[:, :, 0] + 0.7152 * px[:, :, 1] + 0.0722 * px[:, :, 2]
    ink = lum > cutoff
    solid = px[:, :, 3] > 0.5
    mask = np.zeros((h, w, 4), dtype=np.float32)
    mask[solid & ~ink] = (0.0, 0.0, 0.0, 1.0)
    mask[solid & ink] = (1.0, 1.0, 1.0, 1.0)
    return mask


def banded_1bit(px: np.ndarray, lo: float = 0.28, hi: float = 0.72) -> np.ndarray:
    """The vignette quantizer: deep shadow → paper, highlight → ink, and the
    midtone band → Bayer texture (reads as pen hatching at panel scale).
    Freestyle lines (near-black, incl. their AA fringe) land below `lo`."""
    h, w, _ = px.shape
    lum = 0.2126 * px[:, :, 0] + 0.7152 * px[:, :, 1] + 0.0722 * px[:, :, 2]
    yy, xx = np.mgrid[0:h, 0:w]
    band_t = np.clip((lum - lo) / max(hi - lo, 1e-6), 0.0, 1.0)
    dithered = band_t > (BAYER8[yy % 8, xx % 8] + 0.5) / 64.0
    ink = (lum >= hi) | ((lum > lo) & dithered)
    solid = px[:, :, 3] > 0.5
    mask = np.zeros((h, w, 4), dtype=np.float32)
    mask[solid & ~ink] = (0.0, 0.0, 0.0, 1.0)
    mask[solid & ink] = (1.0, 1.0, 1.0, 1.0)
    return mask


def add_outline(mask: np.ndarray) -> np.ndarray:
    """1px opaque-black contour in the void ring around the silhouette —
    props need a dark edge to read against light dithered terrain."""
    solid = mask[:, :, 3] > 0.5
    ring = np.zeros_like(solid)
    ring[1:, :] |= solid[:-1, :]
    ring[:-1, :] |= solid[1:, :]
    ring[:, 1:] |= solid[:, :-1]
    ring[:, :-1] |= solid[:, 1:]
    ring &= ~solid
    out = mask.copy()
    out[ring] = (0.0, 0.0, 0.0, 1.0)
    return out


def save_rgba(arr: np.ndarray, path: str) -> None:
    """arr: float32 (h, w, 4), row 0 = top."""
    h, w, _ = arr.shape
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    img = bpy.data.images.new(os.path.basename(path), width=w, height=h, alpha=True, float_buffer=False)
    img.colorspace_settings.name = "Non-Color"
    img.pixels = arr[::-1].ravel().tolist()
    img.filepath_raw = path
    img.file_format = "PNG"
    img.save()
    bpy.data.images.remove(img)


def run_sprite(asset_id, canvas_px, frames, build_frame, *,
               aim_z: float = 0.0, gamma: float = 1.0,
               footprint=(1, 1), default_albedo: float = 1.0,
               sun_energy: float = 4.5, outline: bool = False) -> None:
    """Full sprite pipeline: per frame — fresh scene, build, light, camera,
    render, quantize — then assemble the horizontal strip and emit summary.

    build_frame(frame) returns the frame's objects; objects without a material
    get the default-albedo diffuse. Scene is rebuilt per frame (deterministic
    seed varies by frame) so variants and animation phases are pure functions
    of the frame index.
    """
    assert_blender_version()
    out_path = parse_argv()
    fw, fh = canvas_px
    strip = np.zeros((fh, fw * frames, 4), dtype=np.float32)
    anchor = None

    for frame in range(frames):
        fresh_scene(asset_id, frame)
        objs = build_frame(frame)
        default_mat = make_material(default_albedo)
        for o in objs:
            if o.data is not None and len(o.data.materials) == 0:
                o.data.materials.append(default_mat)
        _add_sun(sun_energy)
        cam = _setup_iso_camera(fw, fh, aim_z)
        if anchor is None:
            anchor = _anchor_px(cam, fw, fh)
        px = _render_frame_pixels(fw, fh)
        frame_mask = quantize_1bit(px, gamma=gamma)
        if outline:
            frame_mask = add_outline(frame_mask)
        strip[:, frame * fw:(frame + 1) * fw] = frame_mask

    save_rgba(strip, out_path)
    coverage = [
        round(float((strip[:, i * fw:(i + 1) * fw, 3] > 0.5).sum()) / (fw * fh), 4)
        for i in range(frames)
    ]
    print("FOUNDRY_SUMMARY " + json.dumps({
        "asset_id": asset_id,
        "kind": "sprite",
        "pixel_size": [fw * frames, fh],
        "frame": {"count": frames, "w": fw, "h": fh},
        "anchor_px": anchor,
        "tile_footprint": list(footprint),
        "palette_independent": True,
        "ppu": round(PPU, 4),
        "camera": {"yaw_deg": YAW_DEG, "elev_deg": ELEV_DEG},
        "ink_coverage_per_frame": coverage,
        "blender": bpy.app.version_string,
    }))


def run_vignette(asset_id, canvas_px, build_scene, *,
                 aim_z: float = 0.6,
                 line_thickness: float = 3.2,
                 view_units: float = 6.0,
                 band=(0.28, 0.72)) -> None:
    """Vignette pipeline: same camera language, high-res, Freestyle line art,
    pure threshold to 1-bit (no dither) — clean ink-sketch panels.

    Unlike sprites, vignettes are close-ups: ortho width is `view_units`
    world units (not tile-locked ppu)."""
    assert_blender_version()
    out_path = parse_argv()
    w, h = canvas_px
    fresh_scene(asset_id, 0)
    objs = build_scene()
    mat = make_material(1.0)
    for o in objs:
        if o.data is not None and len(o.data.materials) == 0:
            o.data.materials.append(mat)
    _add_sun()
    cam = _setup_iso_camera(w, h, aim_z)
    cam.data.ortho_scale = view_units

    scene = bpy.context.scene
    scene.render.use_freestyle = True
    scene.render.line_thickness = line_thickness
    view_layer = bpy.context.view_layer
    if view_layer.freestyle_settings.linesets:
        lineset = view_layer.freestyle_settings.linesets[0]
    else:
        lineset = view_layer.freestyle_settings.linesets.new("ink")
    lineset.select_silhouette = True
    lineset.select_border = True
    lineset.select_crease = True

    px = _render_frame_pixels(w, h)
    mask = banded_1bit(px, lo=band[0], hi=band[1])
    save_rgba(mask, out_path)
    coverage = round(float((mask[:, :, 3] > 0.5).sum()) / (w * h), 4)
    print("FOUNDRY_SUMMARY " + json.dumps({
        "asset_id": asset_id,
        "kind": "vignette",
        "pixel_size": [w, h],
        "frame": {"count": 1, "w": w, "h": h},
        "anchor_px": [w / 2, h / 2],
        "tile_footprint": [0, 0],
        "palette_independent": True,
        "ppu": round(PPU, 4),
        "camera": {"yaw_deg": YAW_DEG, "elev_deg": ELEV_DEG},
        "ink_coverage_per_frame": [coverage],
        "blender": bpy.app.version_string,
    }))
