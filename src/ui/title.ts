/**
 * Title card — full-screen black, the pond-dusk sketch in an ornate frame,
 * the wordmark, and "click to begin". DOM canvas under the palette overlay;
 * 1-bit quantized so even the type is bitmap-crunched.
 */
import { spriteRegistry } from "../assets/sprite-loader";
import { drawOrnatePanel, quantizeCanvas1Bit } from "./panel";

export class TitleCard {
  private scrim: HTMLDivElement;
  private panel: HTMLCanvasElement;
  private open = true;
  private onBegin?: () => void;

  constructor() {
    this.scrim = document.createElement("div");
    Object.assign(this.scrim.style, {
      position: "fixed",
      inset: "0",
      background: "#000000",
      zIndex: "7",
      cursor: "pointer",
    });
    this.panel = document.createElement("canvas");
    Object.assign(this.panel.style, {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      imageRendering: "pixelated",
    });
    this.scrim.appendChild(this.panel);
    document.body.appendChild(this.scrim);
    this.scrim.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      this.dismiss();
    });
  }

  get isOpen(): boolean {
    return this.open;
  }

  show(onBegin: () => void): void {
    this.onBegin = onBegin;
    this.draw();
  }

  private dismiss(): void {
    if (!this.open) return;
    this.open = false;
    this.scrim.remove();
    this.onBegin?.();
  }

  private draw(): void {
    const sheet = spriteRegistry.get("vignette_pond_dusk");
    const img = sheet.image.image;

    const w = Math.min(window.innerWidth * 0.66, 700);
    const sketchH = (w - 36) * (sheet.meta.frame.h / sheet.meta.frame.w) * 0.62;
    const h = sketchH + 220;
    this.panel.width = w;
    this.panel.height = h;

    const ctx = this.panel.getContext("2d")!;
    drawOrnatePanel(ctx, 0, 0, w, h);

    // the pond sketch, letterboxed (crop vertically to its middle band)
    ctx.imageSmoothingEnabled = false;
    const srcH = sheet.meta.frame.h * 0.62;
    const srcY = (sheet.meta.frame.h - srcH) / 2;
    ctx.drawImage(img, 0, srcY, sheet.meta.frame.w, srcH, 18, 18, w - 36, sketchH);

    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.font = "bold 54px monospace";
    ctx.fillText("LOFI BEAVER", w / 2, sketchH + 84);
    ctx.font = "15px monospace";
    ctx.fillText("a WILLOW BEND season — 1-bit prototype", w / 2, sketchH + 112);
    ctx.font = "12px monospace";
    ctx.fillText("WASD walk · click near you to dam · dusk comes anyway", w / 2, sketchH + 152);
    ctx.font = "13px monospace";
    ctx.fillText("· click to begin ·", w / 2, sketchH + 190);

    quantizeCanvas1Bit(ctx, "panel");
  }
}
