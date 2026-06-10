"""heron — the wetland's first returning witness (beaverGame Mode B lore:
frogs → ducks → heron). 2 frames: standing tall / head down fishing.
1×1 footprint, wades at the water's edge."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _sprite_lib import run_sprite, make_material
from _mesh import add_box, add_cylinder


def build_frame(frame: int):
    feather = make_material(0.88)
    dark = make_material(0.15)
    objs = []

    # stilt legs
    for sx in (-0.06, 0.07):
        leg = add_cylinder(f"leg_{sx}", sx, 0.0, 0.0, 0.5, 0.016, 0.012, sides=4)
        leg.data.materials.append(dark)
        objs.append(leg)

    body = add_box("body", -0.02, 0.0, 0.62, 0.17, 0.1, 0.1)
    body.data.materials.append(feather)
    objs.append(body)

    tail = add_box("tail", -0.2, 0.0, 0.66, 0.06, 0.05, 0.03)
    tail.data.materials.append(dark)
    objs.append(tail)

    if frame == 0:
        # standing tall: S-neck up, head high, beak level
        neck = add_cylinder("neck", 0.14, 0.0, 0.66, 1.05, 0.035, 0.025, sides=5)
        neck.rotation_euler = (0.0, 0.25, 0.0)
        neck.data.materials.append(feather)
        objs.append(neck)
        head = add_box("head", 0.26, 0.0, 1.08, 0.06, 0.045, 0.04)
        head.data.materials.append(feather)
        objs.append(head)
        beak = add_cylinder("beak", 0.0, 0.0, 0.0, 0.22, 0.02, 0.001, sides=4)
        beak.rotation_euler = (0.0, 1.45, 0.0)
        beak.location = (0.32, 0.0, 1.07)
        beak.data.materials.append(dark)
        objs.append(beak)
    else:
        # fishing: neck arched down toward the shallows
        neck = add_cylinder("neck", 0.0, 0.0, 0.0, 0.5, 0.035, 0.025, sides=5)
        neck.rotation_euler = (0.0, 1.1, 0.0)
        neck.location = (0.12, 0.0, 0.66)
        neck.data.materials.append(feather)
        objs.append(neck)
        head = add_box("head", 0.5, 0.0, 0.5, 0.055, 0.045, 0.04)
        head.data.materials.append(feather)
        objs.append(head)
        beak = add_cylinder("beak", 0.0, 0.0, 0.0, 0.2, 0.018, 0.001, sides=4)
        beak.rotation_euler = (0.0, 2.5, 0.0)
        beak.location = (0.56, 0.0, 0.44)
        beak.data.materials.append(dark)
        objs.append(beak)

    return objs


run_sprite("heron", (48, 64), 2, build_frame, footprint=(1, 1), aim_z=0.46, outline=True)
