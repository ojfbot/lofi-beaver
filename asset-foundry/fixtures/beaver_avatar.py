"""beaver_avatar — 4 frames = 4 facing directions (grid +x, +y, -x, -y).
Body capsule-ish box + head + flat tail, whole model yawed per frame.
Ports beaverGame's beaver_basic proportions into the sprite modality."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import math
import bpy
from _sprite_lib import run_sprite, make_material
from _mesh import add_box

# frame k faces grid direction: 0:+x  1:+y  2:-x  3:-y
FRAME_YAW = [0.0, math.pi / 2, math.pi, -math.pi / 2]


def build_frame(frame: int):
    fur = make_material(0.7)
    dark = make_material(0.25)
    objs = []

    body = add_box("body", 0.0, 0.0, 0.14, 0.2, 0.13, 0.11)
    body.data.materials.append(fur)
    objs.append(body)

    head = add_box("head", 0.24, 0.0, 0.2, 0.09, 0.09, 0.08)
    head.data.materials.append(fur)
    objs.append(head)

    tail = add_box("tail", -0.3, 0.0, 0.07, 0.13, 0.08, 0.02)
    tail.data.materials.append(dark)
    objs.append(tail)

    for sy in (-1, 1):
        for sx in (-1, 1):
            leg = add_box(f"leg_{sx}_{sy}", sx * 0.12, sy * 0.1, 0.04, 0.035, 0.03, 0.04)
            leg.data.materials.append(dark)
            objs.append(leg)

    yaw = FRAME_YAW[frame]
    for o in objs:
        o.rotation_euler = (0.0, 0.0, yaw)
        bpy.context.view_layer.objects.active = o

    return objs


run_sprite("beaver_avatar", (48, 48), 4, build_frame, footprint=(1, 1), aim_z=0.26, outline=True)
