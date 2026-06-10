"""tile_water — 1×1 water diamond, 4 animated frames. Sine ripples whose phase
advances per frame; mid albedo so the stipple reads as moving water against
both grass (denser) and road (sparser)."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import bmesh
import math
from _sprite_lib import run_sprite


def build_frame(frame: int):
    bpy.ops.mesh.primitive_plane_add(size=1.06, location=(0, 0, 0))
    plane = bpy.context.active_object
    bm = bmesh.new()
    bm.from_mesh(plane.data)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=11, use_grid_fill=True)
    phase = frame * (2.0 * math.pi / 4.0)
    for v in bm.verts:
        ripple = (
            math.sin(v.co.x * 14.0 + phase) * 0.012
            + math.sin((v.co.x + v.co.y) * 9.0 - phase * 1.3) * 0.008
        )
        v.co.z += ripple
    bm.to_mesh(plane.data)
    bm.free()
    return [plane]


run_sprite("tile_water", (64, 32), 4, build_frame, footprint=(1, 1), default_albedo=0.16)
