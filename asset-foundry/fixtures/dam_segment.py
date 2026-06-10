"""dam_segment — beaver-built stick lattice across a tile, 1×1 footprint.
Crossed tapered sticks over a low mud mound."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import math
import random
from _sprite_lib import run_sprite, make_material
from _mesh import add_cylinder, add_box


def build_frame(frame: int):
    stick_mat = make_material(0.85)
    mud_mat = make_material(0.4)
    objs = []

    mound = add_box("mound", 0.0, 0.0, 0.07, 0.42, 0.2, 0.07)
    mound.data.materials.append(mud_mat)
    objs.append(mound)

    for i in range(7):
        t = (i / 6.0) * 2 - 1  # -1..1 across the tile diagonal
        lean = random.uniform(-0.35, 0.35)
        stick = add_cylinder(
            f"stick_{i}", t * 0.4, random.uniform(-0.08, 0.08),
            0.0, 0.42 + random.uniform(-0.06, 0.1), 0.035, 0.02, sides=5,
        )
        stick.rotation_euler = (lean, random.uniform(-0.2, 0.2), math.radians(random.uniform(0, 360)))
        stick.data.materials.append(stick_mat)
        objs.append(stick)

    return objs


run_sprite("dam_segment", (64, 48), 1, build_frame, footprint=(1, 1), aim_z=0.18, outline=True)
