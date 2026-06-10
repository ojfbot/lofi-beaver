/**
 * Location panel — the Glagstone "Iron Mine" move: click a house, get its
 * household in a small ornate-bordered card. Auto-replaces on next click;
 * dismisses on its own click or when the world is clicked elsewhere.
 * DOM canvas, 1-bit quantized, palette via the multiply overlay.
 */
import { drawOrnatePanel, quantizeCanvas1Bit } from "./panel";
import type { Resident } from "../story/residents";

export class LocationPanel {
  private el: HTMLCanvasElement;
  private visible = false;

  constructor() {
    this.el = document.createElement("canvas");
    Object.assign(this.el.style, {
      position: "fixed",
      right: "12px",
      bottom: "12px",
      zIndex: "5",
      display: "none",
      cursor: "pointer",
      imageRendering: "pixelated",
    });
    document.body.appendChild(this.el);
    this.el.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      this.hide();
    });
  }

  get isVisible(): boolean {
    return this.visible;
  }

  show(resident: Resident, flooded: boolean): void {
    const w = 320;
    const h = 150;
    this.el.width = w;
    this.el.height = h;
    const ctx = this.el.getContext("2d")!;
    drawOrnatePanel(ctx, 0, 0, w, h);

    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.font = "10px monospace";
    ctx.fillText(resident.address.toUpperCase(), w / 2, 30);
    ctx.font = "bold 15px monospace";
    ctx.fillText(resident.name, w / 2, 50);
    ctx.font = "10px monospace";
    ctx.fillText(flooded ? "— WATER IN THE CRAWLSPACE —" : "— DRY, FOR NOW —", w / 2, 68);
    ctx.font = "11px monospace";
    wrap(ctx, flooded ? resident.flooded : resident.dry, w / 2, 90, w - 50, 15);

    quantizeCanvas1Bit(ctx, "panel");
    this.el.style.display = "block";
    this.visible = true;
  }

  hide(): void {
    this.el.style.display = "none";
    this.visible = false;
  }
}

function wrap(
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
