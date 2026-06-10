"""tile_grass — 1×1 ground diamond, 2 variants (frames). Subdivided plane with
random normal jitter so the lambert gradient gives the dither a living texture."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import bmesh
import random
from _sprite_lib import run_sprite


def build_frame(frame: int):
    bpy.ops.mesh.primitive_plane_add(size=1.06, location=(0, 0, 0))
    plane = bpy.context.active_object
    bm = bmesh.new()
    bm.from_mesh(plane.data)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=7, use_grid_fill=True)
    for v in bm.verts:
        v.co.z += random.uniform(-0.012, 0.012)
    # variant 1 gets a few taller grass tufts
    if frame == 1:
        tuft_verts = random.sample(list(bm.verts), 6)
        for v in tuft_verts:
            v.co.z += random.uniform(0.015, 0.03)
    bm.to_mesh(plane.data)
    bm.free()
    return [plane]


run_sprite("tile_grass", (64, 32), 2, build_frame, footprint=(1, 1))
