"""house_two_story — the colonial, 2×2 tile footprint, tall dither-shaded roof."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _sprite_lib import run_sprite, make_material
from _mesh import add_box, add_prism_roof


def build_frame(frame: int):
    wall = make_material(0.95)
    roof = make_material(0.45)
    dark = make_material(0.06)
    objs = []

    body = add_box("body", 0.0, 0.0, 0.85, 0.8, 0.7, 0.85)
    body.data.materials.append(wall)
    objs.append(body)

    main_roof = add_prism_roof("roof", 0.0, 0.0, 1.68, 0.95, 0.85, 2.35, ridge_axis="x")
    main_roof.data.materials.append(roof)
    objs.append(main_roof)

    chimney = add_box("chimney", 0.45, 0.3, 2.25, 0.08, 0.08, 0.28)
    chimney.data.materials.append(wall)
    objs.append(chimney)

    door = add_box("door", 0.0, -0.71, 0.32, 0.14, 0.012, 0.32)
    door.data.materials.append(dark)
    objs.append(door)

    for wz, n in ((0.55, "lo"), (1.25, "hi")):
        for wx in (-0.5, 0.5):
            win = add_box(f"win_{n}_{wx}", wx, -0.71, wz, 0.14, 0.012, 0.16)
            win.data.materials.append(dark)
            objs.append(win)

    return objs


run_sprite("house_two_story", (128, 128), 1, build_frame, footprint=(2, 2), aim_z=1.22, outline=True)
