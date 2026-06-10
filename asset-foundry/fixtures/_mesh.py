"""Small mesh builders shared by the prop fixtures. Pure bmesh — no operators,
no selection state. All props are authored with the tile-footprint center at
world origin and ground at Z=0 (the anchor contract in _sprite_lib)."""
import bpy
import bmesh
import math


def link_mesh(name: str, build) -> bpy.types.Object:
    """Create mesh+object, run build(bm), link into the scene. Recalculates
    face normals outward — hand-wound faces are otherwise a coin flip, and an
    inward normal renders black under the sun (invisible against PAPER)."""
    mesh = bpy.data.meshes.new(f"{name}_mesh")
    bm = bmesh.new()
    build(bm)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def add_box(name: str, cx: float, cy: float, cz: float,
            sx: float, sy: float, sz: float) -> bpy.types.Object:
    """Axis-aligned box centered at (cx, cy, cz) with half-extents (sx, sy, sz)."""
    def build(bm: bmesh.types.BMesh):
        verts = []
        for dz in (-1, 1):
            for dy in (-1, 1):
                for dx in (-1, 1):
                    verts.append(bm.verts.new((cx + dx * sx, cy + dy * sy, cz + dz * sz)))
        faces = [
            (0, 1, 3, 2), (4, 6, 7, 5),  # bottom, top
            (0, 4, 5, 1), (2, 3, 7, 6),  # -y, +y
            (0, 2, 6, 4), (1, 5, 7, 3),  # -x, +x
        ]
        for f in faces:
            bm.faces.new([verts[i] for i in f])
    return link_mesh(name, build)


def add_prism_roof(name: str, cx: float, cy: float,
                   hw: float, hd: float, z0: float, z1: float,
                   ridge_axis: str = "x") -> bpy.types.Object:
    """Gable roof: rectangle (±hw, ±hd) at z0 rising to a ridge line at z1."""
    def build(bm: bmesh.types.BMesh):
        if ridge_axis == "x":
            corners = [(-hw, -hd), (hw, -hd), (hw, hd), (-hw, hd)]
            ridge = [(-hw, 0.0), (hw, 0.0)]
        else:
            corners = [(-hw, -hd), (hw, -hd), (hw, hd), (-hw, hd)]
            ridge = [(0.0, -hd), (0.0, hd)]
        vs = [bm.verts.new((cx + x, cy + y, z0)) for x, y in corners]
        rs = [bm.verts.new((cx + x, cy + y, z1)) for x, y in ridge]
        if ridge_axis == "x":
            bm.faces.new([vs[0], vs[1], rs[1], rs[0]])  # front slope
            bm.faces.new([vs[2], vs[3], rs[0], rs[1]])  # back slope
            bm.faces.new([vs[0], rs[0], vs[3]])         # gable -x
            bm.faces.new([vs[1], vs[2], rs[1]])         # gable +x
        else:
            bm.faces.new([vs[0], rs[0], rs[1], vs[3]])
            bm.faces.new([vs[1], vs[2], rs[1], rs[0]])
            bm.faces.new([vs[0], vs[1], rs[0]])
            bm.faces.new([vs[2], vs[3], rs[1]])
        bm.faces.new([vs[3], vs[2], vs[1], vs[0]])      # underside
    return link_mesh(name, build)


def add_cylinder(name: str, cx: float, cy: float, z0: float, z1: float,
                 r0: float, r1: float, sides: int = 6,
                 sway: float = 0.0) -> bpy.types.Object:
    """Tapered cylinder (trunk). Optional sinusoidal sway along +X."""
    def build(bm: bmesh.types.BMesh):
        segs = 4
        rings = []
        for s in range(segs + 1):
            t = s / segs
            z = z0 + t * (z1 - z0)
            r = r0 * (1 - t) + r1 * t
            off = sway * math.sin(t * math.pi)
            ring = [
                bm.verts.new((
                    cx + off + math.cos((i / sides) * math.tau) * r,
                    cy + math.sin((i / sides) * math.tau) * r,
                    z,
                ))
                for i in range(sides)
            ]
            rings.append(ring)
        for s in range(segs):
            a, b = rings[s], rings[s + 1]
            for i in range(sides):
                j = (i + 1) % sides
                bm.faces.new([a[i], a[j], b[j], b[i]])
        bm.faces.new(rings[-1])
    return link_mesh(name, build)


def add_cone_canopy(name: str, cx: float, cy: float, z0: float, z1: float,
                    r: float, sides: int = 8) -> bpy.types.Object:
    """Cone of triangles — reads as conifer/birch canopy once dithered."""
    def build(bm: bmesh.types.BMesh):
        base = [
            bm.verts.new((
                cx + math.cos((i / sides) * math.tau) * r,
                cy + math.sin((i / sides) * math.tau) * r,
                z0,
            ))
            for i in range(sides)
        ]
        tip = bm.verts.new((cx, cy, z1))
        for i in range(sides):
            j = (i + 1) % sides
            bm.faces.new([base[i], base[j], tip])
        bm.faces.new(list(reversed(base)))
    return link_mesh(name, build)
