/**
 * Vignette overlay — a full-screen story panel: solid black scrim, ornate-
 * bordered white panel with the Freestyle ink-sketch, title + caption.
 * Click to dismiss.
 *
 * DOM, not an Excalibur ScreenElement: it sits between the game canvas and
 * the multiply palette overlay (z-index 6 < 10), drawn pure white/black so
 * the palette tints it like the rest of the world — and a solid scrim keeps
 * the 2-color histogram invariant intact while a panel is open.
 */
import { spriteRegistry } from "../assets/sprite-loader";
import { drawOrnatePanel, quantizeCanvas1Bit } from "./panel";
import type { StoryBeat } from "../story/beats";

export class VignetteOverlay {
  private scrim: HTMLDivElement;
  private panel: HTMLCanvasElement;
  private beat: StoryBeat | null = null;
  private onDismiss?: () => void;

  constructor() {
    this.scrim = document.createElement("div");
    Object.assign(this.scrim.style, {
      position: "fixed",
      inset: "0",
      background: "#000000",
      display: "none",
      zIndex: "6",
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
    return this.beat !== null;
  }

  show(beat: StoryBeat, onDismiss?: () => void): void {
    this.beat = beat;
    this.onDismiss = onDismiss;
    this.scrim.style.display = "block";
    this.draw();
  }

  dismiss(): void {
    if (!this.beat) return;
    this.beat = null;
    this.scrim.style.display = "none";
    this.onDismiss?.();
    this.onDismiss = undefined;
  }

  private draw(): void {
    if (!this.beat) return;
    const sheet = spriteRegistry.get(this.beat.vignetteId);
    const img = sheet.image.image;

    const pw = Math.min(window.innerWidth * 0.72, 760);
    const innerW = pw - 36;
    const imgH = innerW * (sheet.meta.frame.h / sheet.meta.frame.w);
    const ph = imgH + 132;
    this.panel.width = pw;
    this.panel.height = ph;

    const ctx = this.panel.getContext("2d")!;
    drawOrnatePanel(ctx, 0, 0, pw, ph);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 18, 18, innerW, imgH);

    ctx.fillStyle = "#000000";
    ctx.font = "bold 17px monospace";
    ctx.textAlign = "center";
    ctx.fillText(this.beat.title, pw / 2, imgH + 48);
    ctx.font = "13px monospace";
    wrapText(ctx, this.beat.text, pw / 2, imgH + 72, innerW - 40, 18);
    ctx.font = "11px monospace";
    ctx.fillText("· click to continue ·", pw / 2, ph - 20);

    quantizeCanvas1Bit(ctx, "panel");
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const words = text.split(" ");
  let line = "";
  let y = startY;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      ctx.fillText(line, cx, y);
      line = word;
      y += lineHeight;
    } else {
      line = candidate;
    }
  }
  if (line) ctx.fillText(line, cx, y);
}
