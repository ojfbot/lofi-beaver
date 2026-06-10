"""vignette_pond_dusk — ink-sketch of the pond remembering it was a wetland:
rippled water, cattails, two birches leaning in, the moon. Story-beat panel
for the water-rising beat."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import math
import random
import bpy
import bmesh
from _sprite_lib import run_vignette, make_material
from _mesh import add_cylinder, add_cone_canopy


def build_scene():
    water_mat = make_material(0.4)
    reed_mat = make_material(0.65)
    trunk_mat = make_material(0.9)
    leaf_mat = make_material(0.55)
    moon_mat = make_material(1.0)
    dark = make_material(0.1)
    objs = []

    # rippled pond
    bpy.ops.mesh.primitive_plane_add(size=6.0, location=(0.0, -0.6, 0.0))
    pond = bpy.context.active_object
    bm = bmesh.new()
    bm.from_mesh(pond.data)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=24, use_grid_fill=True)
    for v in bm.verts:
        v.co.z += math.sin(v.co.x * 4.0) * 0.02 + math.sin((v.co.x + v.co.y) * 2.5) * 0.015
    bm.to_mesh(pond.data)
    bm.free()
    pond.data.materials.append(water_mat)
    objs.append(pond)

    # two birches leaning over the water
    random.seed(5)
    for (tx, ty, lean, h) in [(-2.2, 1.4, 0.18, 2.4), (2.4, 1.2, -0.22, 2.0)]:
        trunk = add_cylinder(f"trunk_{tx}", tx, ty, 0.0, h, 0.09, 0.04, sway=0.12)
        trunk.rotation_euler = (0.0, lean, 0.0)
        trunk.data.materials.append(trunk_mat)
        objs.append(trunk)
        for i in range(3):
            z0 = h * 0.5 + i * 0.4
            canopy = add_cone_canopy(f"canopy_{tx}_{i}", tx + lean * z0, ty, z0, z0 + 0.7, 0.55 - i * 0.12)
            canopy.data.materials.append(leaf_mat)
            objs.append(canopy)

    # cattails
    for i in range(12):
        x = random.uniform(-2.6, 2.6)
        y = random.uniform(-2.2, -1.4)
        h = random.uniform(0.5, 1.0)
        reed = add_cylinder(f"reed_{i}", x, y, 0.0, h, 0.02, 0.012, sides=4)
        reed.rotation_euler = (random.uniform(-0.15, 0.15), random.uniform(-0.15, 0.15), 0)
        reed.data.materials.append(reed_mat)
        objs.append(reed)
        head = add_cylinder(f"reedhead_{i}", x, y, h, h + 0.18, 0.04, 0.035, sides=4)
        head.data.materials.append(dark)
        objs.append(head)

    # the moon — a flat disk high behind, unlit-bright
    bpy.ops.mesh.primitive_circle_add(vertices=24, radius=0.45, fill_type="NGON",
                                      location=(-1.6, 3.2, 3.2))
    moon = bpy.context.active_object
    moon.rotation_euler = (math.radians(60), 0.0, math.radians(45))  # face the camera
    moon.data.materials.append(moon_mat)
    objs.append(moon)

    return objs


run_vignette("vignette_pond_dusk", (960, 720), build_scene, aim_z=1.1, view_units=8.0)
