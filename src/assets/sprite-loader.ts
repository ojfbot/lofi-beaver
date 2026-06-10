/**
 * Sprite registry — loads foundry-generated 1-bit masks + metadata.
 *
 * Contract with the sprite pipeline (asset-foundry/sprites.yaml →
 * public/assets/sprites/): every `<id>_v1.png` ships with a sibling
 * `<id>_v1.sprite.json` (frame grid, anchor, footprint) and a
 * `<id>_v1.validation.json` that must declare status "validated" — in dev
 * mode this loader refuses unvalidated art (ports beaverGame's load-glb.ts
 * tripwire across the repo seam).
 *
 * Masks are white-on-transparent and are drawn PURE WHITE — the palette is
 * applied by the multiply overlay (palette.ts applyPalette). Never set
 * sprite.tint: Excalibur 0.30.3 silently drops tinted sprites on the actor
 * draw path (tile graphics tolerate tint; actors do not).
 */
import * as ex from "excalibur";

export interface SpriteMeta {
  asset_id: string;
  kind: "sprite" | "vignette";
  pixel_size: [number, number];
  frame: { count: number; w: number; h: number };
  anchor_px: [number, number];
  tile_footprint: [number, number];
  palette_independent: boolean;
  ppu: number;
}

export interface LoadedSprite {
  meta: SpriteMeta;
  image: ex.ImageSource;
  /** One Sprite per frame (frame 0 = leftmost in the strip). */
  frames: ex.Sprite[];
  /** Animation over all frames; undefined for single-frame sprites. */
  animation?: ex.Animation;
}

const BASE = "/assets/sprites";

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  const type = res.headers.get("content-type") ?? "";
  // Vite's SPA fallback returns 200 text/html for missing files — sniff it.
  if (!res.ok || type.includes("text/html")) {
    throw new Error(`missing or invalid asset file: ${url}`);
  }
  return res.json();
}

export class SpriteRegistry {
  private sprites = new Map<string, LoadedSprite>();

  get(id: string): LoadedSprite {
    const s = this.sprites.get(id);
    if (!s) {
      throw new Error(`sprite "${id}" not loaded — is it in sprites.yaml and loaded at boot?`);
    }
    return s;
  }

  has(id: string): boolean {
    return this.sprites.has(id);
  }

  ids(): string[] {
    return [...this.sprites.keys()];
  }


  async load(ids: string[], opts?: { animMs?: number }): Promise<ex.ImageSource[]> {
    const animMs = opts?.animMs ?? 220;
    const images: ex.ImageSource[] = [];
    for (const id of ids) {
      if (import.meta.env.DEV) {
        const validation = (await fetchJson(`${BASE}/${id}_v1.validation.json`)) as {
          status?: string;
        };
        if (validation.status !== "validated") {
          throw new Error(
            `sprite "${id}" is not validated (status: ${validation.status}) — run pnpm sprites && pnpm sprites:validate`,
          );
        }
      }
      const meta = (await fetchJson(`${BASE}/${id}_v1.sprite.json`)) as SpriteMeta;
      const image = new ex.ImageSource(`${BASE}/${id}_v1.png`, {
        filtering: ex.ImageFiltering.Pixel,
      });
      images.push(image);

      const frames: ex.Sprite[] = [];
      for (let i = 0; i < meta.frame.count; i++) {
        const sprite = new ex.Sprite({
          image,
          sourceView: {
            x: i * meta.frame.w,
            y: 0,
            width: meta.frame.w,
            height: meta.frame.h,
          },
        });
          frames.push(sprite);
      }
      const animation =
        meta.frame.count > 1
          ? new ex.Animation({
              frames: frames.map((graphic) => ({ graphic, duration: animMs })),
              strategy: ex.AnimationStrategy.Loop,
            })
          : undefined;

      this.sprites.set(id, { meta, image, frames, animation });
    }
    return images;
  }
}

/** Singleton registry — one set of shared graphics for the whole game. */
export const spriteRegistry = new SpriteRegistry();
