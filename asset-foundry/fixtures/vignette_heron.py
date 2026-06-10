"""vignette_heron — THE FIRST HERON: the bird standing in the new shallows
between two drowned mailboxes. The wetland sends its surveyor."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import math
import random
import bpy
import bmesh
from _sprite_lib import run_vignette, make_material
from _mesh import add_box, add_cylinder


def build_scene():
    feather = make_material(0.9)
    dark = make_material(0.1)
    water_mat = make_material(0.38)
    reed_mat = make_material(0.6)
    post_mat = make_material(0.75)
    objs = []

    # shallow water everywhere
    bpy.ops.mesh.primitive_plane_add(size=7.0, location=(0.0, 0.0, 0.0))
    water = bpy.context.active_object
    bm = bmesh.new()
    bm.from_mesh(water.data)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=20, use_grid_fill=True)
    for v in bm.verts:
        v.co.z += math.sin(v.co.x * 3.0) * 0.02 + math.sin((v.co.y + v.co.x) * 2.0) * 0.015
    bm.to_mesh(water.data)
    bm.free()
    water.data.materials.append(water_mat)
    objs.append(water)

    # the heron, large, center-left
    for sx in (-0.08, 0.1):
        leg = add_cylinder(f"leg_{sx}", -0.8 + sx, 0.0, 0.0, 0.85, 0.025, 0.018, sides=5)
        leg.data.materials.append(dark)
        objs.append(leg)
    body = add_box("body", -0.84, 0.0, 1.05, 0.3, 0.17, 0.17)
    body.data.materials.append(feather)
    objs.append(body)
    tail = add_box("tail", -1.16, 0.0, 1.12, 0.1, 0.08, 0.05)
    tail.data.materials.append(dark)
    objs.append(tail)
    neck = add_cylinder("neck", 0.0, 0.0, 0.0, 0.75, 0.06, 0.04, sides=6)
    neck.rotation_euler = (0.0, 0.22, 0.0)
    neck.location = (-0.56, 0.0, 1.12)
    neck.data.materials.append(feather)
    objs.append(neck)
    head = add_box("head", -0.36, 0.0, 1.86, 0.1, 0.075, 0.065)
    head.data.materials.append(feather)
    objs.append(head)
    beak = add_cylinder("beak", 0.0, 0.0, 0.0, 0.38, 0.032, 0.001, sides=4)
    beak.rotation_euler = (0.0, 1.5, 0.0)
    beak.location = (-0.26, 0.0, 1.84)
    beak.data.materials.append(dark)
    objs.append(beak)
    crest = add_cylinder("crest", 0.0, 0.0, 0.0, 0.16, 0.015, 0.001, sides=4)
    crest.rotation_euler = (0.0, -0.9, 0.0)
    crest.location = (-0.44, 0.0, 1.9)
    crest.data.materials.append(dark)
    objs.append(crest)

    # two drowned mailboxes, leaning
    random.seed(3)
    for i, (mx, my, lean) in enumerate([(0.9, -0.7, 0.12), (1.9, 0.5, -0.2)]):
        post = add_cylinder(f"post_{i}", 0.0, 0.0, 0.0, 0.7, 0.035, 0.03, sides=5)
        post.rotation_euler = (lean, lean * 0.5, 0.0)
        post.location = (mx, my, -0.05)
        post.data.materials.append(post_mat)
        objs.append(post)
        box = add_box(f"mailbox_{i}", mx + lean * 0.5, my, 0.72, 0.14, 0.09, 0.08)
        box.rotation_euler = (0.0, 0.0, lean)
        box.data.materials.append(dark if i == 0 else post_mat)
        objs.append(box)

    # reeds colonizing
    for i in range(10):
        x = random.uniform(-2.6, 2.6)
        y = random.uniform(-2.4, -1.2)
        h = random.uniform(0.5, 1.1)
        reed = add_cylinder(f"reed_{i}", x, y, 0.0, h, 0.02, 0.012, sides=4)
        reed.rotation_euler = (random.uniform(-0.15, 0.15), random.uniform(-0.15, 0.15), 0)
        reed.data.materials.append(reed_mat)
        objs.append(reed)
        head_r = add_cylinder(f"reedhead_{i}", x, y, h, h + 0.17, 0.04, 0.035, sides=4)
        head_r.data.materials.append(dark)
        objs.append(head_r)

    return objs


run_vignette("vignette_heron", (960, 720), build_scene, aim_z=0.85, view_units=6.0)
