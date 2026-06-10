"""vignette_ending_polite — ENDING TWO: the pond stayed polite. Three intact
houses in a tidy row, the retention pond small and square behind its fence,
one beaver-gnawed fence post the only evidence. For now."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import random
import bpy
from _sprite_lib import run_vignette, make_material
from _mesh import add_box, add_prism_roof, add_cylinder


def build_scene():
    wall = make_material(0.92)
    roof = make_material(0.5)
    dark = make_material(0.08)
    lawn = make_material(0.62)
    water_mat = make_material(0.35)
    post_mat = make_material(0.7)
    objs = []

    # immaculate lawn
    bpy.ops.mesh.primitive_plane_add(size=9.0, location=(0.0, 0.0, 0.0))
    ground = bpy.context.active_object
    ground.data.materials.append(lawn)
    objs.append(ground)

    # three identical houses, perfectly spaced (cookie-cutter authenticity)
    for i, hx in enumerate([-2.2, 0.0, 2.2]):
        body = add_box(f"body_{i}", hx, 0.9, 0.45, 0.7, 0.6, 0.45)
        body.data.materials.append(wall)
        objs.append(body)
        r = add_prism_roof(f"roof_{i}", hx, 0.9, 0.9, 0.82, 0.72, 1.35, ridge_axis="x")
        r.data.materials.append(roof)
        objs.append(r)
        door = add_box(f"door_{i}", hx, 0.29, 0.26, 0.12, 0.012, 0.26)
        door.data.materials.append(dark)
        objs.append(door)
        win = add_box(f"win_{i}", hx - 0.4, 0.29, 0.5, 0.13, 0.012, 0.13)
        win.data.materials.append(dark)
        objs.append(win)

    # the retention pond: small, square, fenced — exactly as zoned
    pond = add_box("pond", -0.4, -1.7, 0.005, 0.9, 0.55, 0.005)
    pond.data.materials.append(water_mat)
    objs.append(pond)

    random.seed(4)
    fence_pts = []
    for t in range(7):
        fence_pts.append((-1.5 + t * 0.38, -1.05))
    for t in range(4):
        fence_pts.append((-1.5, -1.05 - (t + 1) * 0.35))
        fence_pts.append((0.78, -1.05 - (t + 1) * 0.35))
    for i, (fx, fy) in enumerate(fence_pts):
        gnawed = i == 3  # the only evidence
        h = 0.18 if gnawed else 0.42
        post = add_cylinder(f"post_{i}", fx, fy, 0.0, h, 0.035, 0.03, sides=5)
        post.data.materials.append(dark if gnawed else post_mat)
        objs.append(post)

    return objs


run_vignette("vignette_ending_polite", (960, 720), build_scene, aim_z=0.55, view_units=8.5)
