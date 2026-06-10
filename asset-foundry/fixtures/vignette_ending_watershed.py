"""vignette_ending_watershed — ENDING ONE: the water won. A house sits
hip-deep in the reborn wetland, the dam holds, cattails everywhere, the
heron presiding. Sketching one of the endings."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import math
import random
import bpy
import bmesh
from _sprite_lib import run_vignette, make_material
from _mesh import add_box, add_prism_roof, add_cylinder


def build_scene():
    wall = make_material(0.92)
    roof = make_material(0.45)
    dark = make_material(0.08)
    water_mat = make_material(0.36)
    reed_mat = make_material(0.6)
    stick_mat = make_material(0.8)
    feather = make_material(0.9)
    objs = []

    # the risen water
    bpy.ops.mesh.primitive_plane_add(size=9.0, location=(0.0, 0.0, 0.0))
    water = bpy.context.active_object
    bm = bmesh.new()
    bm.from_mesh(water.data)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=24, use_grid_fill=True)
    for v in bm.verts:
        v.co.z += math.sin(v.co.x * 2.8) * 0.025 + math.sin((v.co.x + v.co.y) * 1.7) * 0.02
    bm.to_mesh(water.data)
    bm.free()
    water.data.materials.append(water_mat)
    objs.append(water)

    # the house, hip-deep (sunk: body center low so water hits mid-wall)
    body = add_box("body", 0.6, 0.4, 0.32, 0.95, 0.8, 0.62)
    body.data.materials.append(wall)
    objs.append(body)
    main_roof = add_prism_roof("roof", 0.6, 0.4, 0.92, 1.12, 0.95, 1.7, ridge_axis="x")
    main_roof.data.materials.append(roof)
    objs.append(main_roof)
    # upstairs window — the only dry room
    win = add_box("win", 0.6, -0.42, 0.72, 0.16, 0.012, 0.16)
    win.data.materials.append(dark)
    objs.append(win)
    chimney = add_box("chimney", 1.15, 0.7, 1.6, 0.1, 0.1, 0.3)
    chimney.data.materials.append(wall)
    objs.append(chimney)

    # the dam, proud, foreground
    mound = add_box("mound", -1.7, -1.3, 0.12, 0.7, 0.25, 0.12)
    mound.data.materials.append(make_material(0.4))
    objs.append(mound)
    random.seed(9)
    for i in range(9):
        t = (i / 8.0) * 2 - 1
        stick = add_cylinder(
            f"stick_{i}", -1.7 + t * 0.65, -1.3 + random.uniform(-0.1, 0.1),
            0.0, 0.6 + random.uniform(-0.1, 0.15), 0.05, 0.03, sides=5)
        stick.rotation_euler = (random.uniform(-0.4, 0.4), random.uniform(-0.3, 0.3), 0.0)
        stick.data.materials.append(stick_mat)
        objs.append(stick)

    # heron on the dam
    for sx in (-0.05, 0.06):
        leg = add_cylinder(f"hleg_{sx}", -1.5 + sx, -1.25, 0.24, 0.78, 0.018, 0.014, sides=4)
        leg.data.materials.append(dark)
        objs.append(leg)
    hbody = add_box("hbody", -1.52, -1.25, 0.92, 0.19, 0.11, 0.11)
    hbody.data.materials.append(feather)
    objs.append(hbody)
    hneck = add_cylinder("hneck", 0.0, 0.0, 0.0, 0.5, 0.04, 0.028, sides=5)
    hneck.rotation_euler = (0.0, 0.2, 0.0)
    hneck.location = (-1.34, -1.25, 0.98)
    hneck.data.materials.append(feather)
    objs.append(hneck)
    hhead = add_box("hhead", -1.2, -1.25, 1.46, 0.065, 0.05, 0.045)
    hhead.data.materials.append(feather)
    objs.append(hhead)
    hbeak = add_cylinder("hbeak", 0.0, 0.0, 0.0, 0.26, 0.02, 0.001, sides=4)
    hbeak.rotation_euler = (0.0, 1.5, 0.0)
    hbeak.location = (-1.13, -1.25, 1.44)
    hbeak.data.materials.append(dark)
    objs.append(hbeak)

    # cattails reclaiming the yard
    for i in range(14):
        x = random.uniform(-3.4, 3.0)
        y = random.uniform(-2.6, -0.6)
        if abs(x - 0.6) < 1.3 and abs(y - 0.4) < 1.2:
            continue  # not through the house
        h = random.uniform(0.5, 1.15)
        reed = add_cylinder(f"reed_{i}", x, y, 0.0, h, 0.02, 0.012, sides=4)
        reed.rotation_euler = (random.uniform(-0.15, 0.15), random.uniform(-0.15, 0.15), 0)
        reed.data.materials.append(reed_mat)
        objs.append(reed)
        rh = add_cylinder(f"reedhead_{i}", x, y, h, h + 0.18, 0.04, 0.035, sides=4)
        rh.data.materials.append(dark)
        objs.append(rh)

    return objs


run_vignette("vignette_ending_watershed", (960, 720), build_scene, aim_z=0.8, view_units=8.5)
