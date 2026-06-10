"""vignette_pump_station — ink-sketch close-up of the pump station at the
pond edge: blockhouse, pipe stack, cattails, water lapping the pad.
Freestyle line art, threshold (no dither) — the story-beat panel for
'the pump station ran all night'."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import math
import random
import bpy
from _sprite_lib import run_vignette, make_material
from _mesh import add_box, add_cylinder


def build_scene():
    concrete = make_material(0.85)
    metal = make_material(0.5)
    dark = make_material(0.1)
    water_mat = make_material(0.35)
    reed_mat = make_material(0.6)
    objs = []

    pad = add_box("pad", 0.0, 0.0, 0.06, 0.9, 0.9, 0.06)
    pad.data.materials.append(concrete)
    objs.append(pad)

    house = add_box("house", -0.1, 0.0, 0.75, 0.6, 0.5, 0.62)
    house.data.materials.append(concrete)
    objs.append(house)

    roof = add_box("roof", -0.1, 0.0, 1.45, 0.68, 0.58, 0.07)
    roof.data.materials.append(metal)
    objs.append(roof)

    door = add_box("door", -0.1, -0.52, 0.5, 0.2, 0.02, 0.38)
    door.data.materials.append(dark)
    objs.append(door)

    pipe = add_cylinder("pipe", 0.68, 0.25, 0.0, 1.9, 0.1, 0.1, sides=8)
    pipe.data.materials.append(metal)
    objs.append(pipe)

    vent = add_box("vent", 0.68, 0.25, 1.98, 0.18, 0.18, 0.08)
    vent.data.materials.append(metal)
    objs.append(vent)

    # water plane lapping the pad's south edge
    bpy.ops.mesh.primitive_plane_add(size=4.0, location=(0.0, -2.4, 0.01))
    water = bpy.context.active_object
    water.data.materials.append(water_mat)
    objs.append(water)

    # cattail reeds
    random.seed(11)
    for i in range(9):
        x = random.uniform(-1.8, 1.8)
        y = random.uniform(-1.9, -1.1)
        h = random.uniform(0.5, 0.95)
        reed = add_cylinder(f"reed_{i}", x, y, 0.0, h, 0.018, 0.012, sides=4)
        reed.rotation_euler = (random.uniform(-0.12, 0.12), random.uniform(-0.12, 0.12), 0)
        reed.data.materials.append(reed_mat)
        objs.append(reed)
        head = add_cylinder(f"reedhead_{i}", x, y, h, h + 0.16, 0.035, 0.03, sides=4)
        head.data.materials.append(dark)
        objs.append(head)

    return objs


run_vignette("vignette_pump_station", (960, 720), build_scene, aim_z=0.7, view_units=6.5)
