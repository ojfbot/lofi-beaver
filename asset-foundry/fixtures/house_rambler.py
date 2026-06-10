"""house_rambler — low single-story + attached garage, 2×2 tile footprint.
Walls light, roof mid (dither texture), window/door insets near-black."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _sprite_lib import run_sprite, make_material
from _mesh import add_box, add_prism_roof


def build_frame(frame: int):
    wall = make_material(0.95)
    roof = make_material(0.5)
    dark = make_material(0.06)
    objs = []

    body = add_box("body", -0.15, 0.0, 0.42, 0.75, 0.85, 0.42)
    body.data.materials.append(wall)
    objs.append(body)

    garage = add_box("garage", 0.72, -0.35, 0.32, 0.26, 0.45, 0.32)
    garage.data.materials.append(wall)
    objs.append(garage)

    main_roof = add_prism_roof("roof", -0.15, 0.0, 0.88, 0.95, 0.84, 1.3, ridge_axis="y")
    main_roof.data.materials.append(roof)
    objs.append(main_roof)

    garage_roof = add_prism_roof("garage_roof", 0.72, -0.35, 0.34, 0.52, 0.64, 0.92, ridge_axis="y")
    garage_roof.data.materials.append(roof)
    objs.append(garage_roof)

    door = add_box("door", -0.15, -0.86, 0.3, 0.14, 0.012, 0.3)
    door.data.materials.append(dark)
    objs.append(door)

    for wx in (-0.55, 0.28):
        win = add_box(f"win_{wx}", wx, -0.86, 0.48, 0.16, 0.012, 0.14)
        win.data.materials.append(dark)
        objs.append(win)

    garage_door = add_box("garage_door", 0.72, -0.81, 0.26, 0.2, 0.012, 0.24)
    garage_door.data.materials.append(dark)
    objs.append(garage_door)

    return objs


run_sprite("house_rambler", (128, 96), 1, build_frame, footprint=(2, 2), aim_z=0.36, outline=True)
