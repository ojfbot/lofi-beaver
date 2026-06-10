import * as ex from "excalibur";

export const INK = ex.Color.fromHex("#e8e0d0");
export const PAPER = ex.Color.fromHex("#050505");

export const TILE_W = 64;
export const TILE_H = 32;

/**
 * Day/night palette pairs for the overworld.
 *
 * Sprites and new UI are drawn PURE WHITE on the canvas; the palette is
 * applied by a `mix-blend-mode: multiply` overlay div (see applyPalette).
 * White × ink = ink, paper stays paper — the 1-bit invariant holds at the
 * canvas level by construction, and a palette swap is one DOM write.
 * (Per-sprite tint is unusable: Excalibur 0.30.3 drops tinted sprites on the
 * actor draw path — see ADR-0007.)
 */
export interface Palette1Bit {
  ink: string;
  paper: string;
}

/**
 * Paper is ALWAYS pure black: sprite paper pixels are #000 and the multiply
 * overlay maps any background × ink, so a non-black engine background would
 * produce a second, slightly-off paper tone (the histogram gate catches it).
 * Day/night differ only in ink.
 */
export const PALETTES: Record<"day" | "night", Palette1Bit> = {
  day: { ink: "#e8e0d0", paper: "#000000" },
  night: { ink: "#aebad0", paper: "#000000" },
};

const OVERLAY_ID = "palette-overlay";

/** Mount (once) and recolor the multiply overlay; swap engine background. */
export function applyPalette(engine: ex.Engine, palette: Palette1Bit): void {
  engine.backgroundColor = ex.Color.fromHex(palette.paper);
  let overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      mixBlendMode: "multiply",
      zIndex: "10",
    });
    document.body.appendChild(overlay);
  }
  overlay.style.background = palette.ink;
}
