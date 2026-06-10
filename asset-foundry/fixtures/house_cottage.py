"""house_cottage — small infill-lot cottage, 1×1 tile footprint, steep roof."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _sprite_lib import run_sprite, make_material
from _mesh import add_box, add_prism_roof


def build_frame(frame: int):
    wall = make_material(0.95)
    roof = make_material(0.5)
    dark = make_material(0.06)
    objs = []

    body = add_box("body", 0.0, 0.0, 0.34, 0.38, 0.34, 0.34)
    body.data.materials.append(wall)
    objs.append(body)

    main_roof = add_prism_roof("roof", 0.0, 0.0, 0.66, 0.48, 0.42, 1.12, ridge_axis="x")
    main_roof.data.materials.append(roof)
    objs.append(main_roof)

    door = add_box("door", 0.0, -0.35, 0.22, 0.1, 0.012, 0.22)
    door.data.materials.append(dark)
    objs.append(door)

    win = add_box("win", -0.22, -0.35, 0.4, 0.1, 0.012, 0.1)
    win.data.materials.append(dark)
    objs.append(win)

    return objs


run_sprite("house_cottage", (64, 80), 1, build_frame, footprint=(1, 1), aim_z=0.2, outline=True)
