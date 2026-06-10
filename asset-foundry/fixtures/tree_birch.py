"""tree_birch — 1×1 footprint, 2 variants. Trunk + stacked cone canopies; the
geometry idiom ports beaverGame's birch_sapling (trunk sway, layered foliage)
into the sprite modality."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import random
from _sprite_lib import run_sprite, make_material
from _mesh import add_cylinder, add_cone_canopy


def build_frame(frame: int):
    trunk_mat = make_material(0.9)
    leaf_mat = make_material(0.55)
    objs = []

    height = 1.5 if frame == 0 else 1.75
    sway = 0.05 if frame == 0 else 0.08

    trunk = add_cylinder("trunk", 0.0, 0.0, 0.0, height, 0.06, 0.025, sway=sway)
    trunk.data.materials.append(trunk_mat)
    objs.append(trunk)

    layers = 2 if frame == 0 else 3
    for i in range(layers):
        z0 = height * 0.55 + i * 0.28
        r = (0.36 - i * 0.08) * (1.0 + random.uniform(-0.08, 0.08))
        canopy = add_cone_canopy(f"canopy_{i}", sway * 0.7, 0.0, z0, z0 + 0.5, r)
        canopy.data.materials.append(leaf_mat)
        objs.append(canopy)

    return objs


run_sprite("tree_birch", (64, 96), 2, build_frame, footprint=(1, 1), aim_z=0.78, outline=True)
