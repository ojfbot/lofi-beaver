"""landmark_pump_station — the buried-wetland tell: a small utility blockhouse
by the retention pond, pipe stack and vent. Vignette co-star. 1×1 footprint."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _sprite_lib import run_sprite, make_material
from _mesh import add_box, add_cylinder


def build_frame(frame: int):
    concrete = make_material(0.8)
    metal = make_material(0.45)
    dark = make_material(0.06)
    objs = []

    pad = add_box("pad", 0.0, 0.0, 0.03, 0.46, 0.46, 0.03)
    pad.data.materials.append(concrete)
    objs.append(pad)

    house = add_box("house", -0.05, 0.0, 0.36, 0.3, 0.26, 0.3)
    house.data.materials.append(concrete)
    objs.append(house)

    roof = add_box("roof", -0.05, 0.0, 0.7, 0.34, 0.3, 0.04)
    roof.data.materials.append(metal)
    objs.append(roof)

    door = add_box("door", -0.05, -0.27, 0.26, 0.1, 0.012, 0.2)
    door.data.materials.append(dark)
    objs.append(door)

    pipe = add_cylinder("pipe", 0.33, 0.12, 0.0, 0.95, 0.05, 0.05, sides=6)
    pipe.data.materials.append(metal)
    objs.append(pipe)

    vent = add_box("vent", 0.33, 0.12, 0.99, 0.09, 0.09, 0.04)
    vent.data.materials.append(metal)
    objs.append(vent)

    return objs


run_sprite("landmark_pump_station", (96, 96), 1, build_frame, footprint=(1, 1), aim_z=0.62, outline=True)
