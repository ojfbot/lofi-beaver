"""tile_road — 1×1 asphalt diamond, darker than grass (albedo 0.4 ⇒ sparse
dither), with slim raised curb strips along the two through-edges."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from _sprite_lib import run_sprite, make_material


def build_frame(frame: int):
    objs = []
    bpy.ops.mesh.primitive_plane_add(size=1.06, location=(0, 0, 0))
    road = bpy.context.active_object
    road.data.materials.append(make_material(0.55))
    objs.append(road)
    curb_mat = make_material(0.9)
    for y in (-0.46, 0.46):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, y, 0.012))
        curb = bpy.context.active_object
        curb.scale = (0.5, 0.04, 0.012)
        curb.data.materials.append(curb_mat)
        objs.append(curb)
    return objs


run_sprite("tile_road", (64, 32), 1, build_frame, footprint=(1, 1))
