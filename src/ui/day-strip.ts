/**
 * Day strip — the Glagstone-style season timeline pinned to the top of the
 * screen: one box per day with the current day filled, plus action pips for
 * the remaining daily budget.
 *
 * DOM canvas, not an Excalibur ScreenElement: it sits between the game canvas
 * and the multiply palette overlay (z-index 5 < 10), drawn PURE WHITE so the
 * palette tints it exactly like the world. (ScreenElements inherit camera
 * zoom in Excalibur 0.30, which mangles fixed UI.)
 */
import { quantizeCanvas1Bit } from "./panel";

const BOX = 14;
const GAP = 6;
const PIP_R = 3;
const PAD = 10;

export class DayStrip {
  private el: HTMLCanvasElement;
  private day = 0;
  private budgetRemaining = -1;
  private budgetPerDay = 0;

  constructor(private seasonDays: number = 14) {
    const width = this.seasonDays * (BOX + GAP) + 2 * PAD;
    const height = BOX + PIP_R * 2 + 14 + 2 * PAD;
    this.el = document.createElement("canvas");
    this.el.width = width;
    this.el.height = height;
    Object.assign(this.el.style, {
      position: "fixed",
      top: "8px",
      left: "50%",
      transform: "translateX(-50%)",
      pointerEvents: "none",
      zIndex: "5",
      imageRendering: "pixelated",
    });
    document.body.appendChild(this.el);
  }

  setState(day: number, budgetRemaining: number, budgetPerDay: number): void {
    day = Math.min(day, this.seasonDays); // day N+1 dawn = the ending; strip stays full
    if (
      day === this.day &&
      budgetRemaining === this.budgetRemaining &&
      budgetPerDay === this.budgetPerDay
    ) {
      return;
    }
    this.day = day;
    this.budgetRemaining = budgetRemaining;
    this.budgetPerDay = budgetPerDay;
    this.draw();
  }

  private draw(): void {
    const ctx = this.el.getContext("2d")!;
    // opaque paper backing — white marks over white-dithered terrain would
    // vanish under the multiply overlay (the prop-silhouette lesson)
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, this.el.width, this.el.height);
    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = 1;

    for (let d = 0; d < this.seasonDays; d++) {
      const x = PAD + d * (BOX + GAP);
      const y = PAD;
      if (d + 1 < this.day) {
        ctx.fillRect(x + BOX / 2 - 1, y + BOX / 2 - 1, 2, 2); // past: a dot
      } else if (d + 1 === this.day) {
        ctx.fillRect(x, y, BOX, BOX);
      } else {
        ctx.strokeRect(x + 0.5, y + 0.5, BOX - 1, BOX - 1);
      }
    }

    const pipY = PAD + BOX + 8;
    const baseX = PAD + (this.day - 1) * (BOX + GAP) + BOX / 2;
    for (let i = 0; i < this.budgetPerDay; i++) {
      const px = baseX + (i - (this.budgetPerDay - 1) / 2) * (PIP_R * 2 + 4);
      ctx.beginPath();
      ctx.arc(px, pipY, PIP_R, 0, Math.PI * 2);
      if (i < this.budgetRemaining) ctx.fill();
      else ctx.stroke();
    }

    quantizeCanvas1Bit(ctx, "panel");
  }
}
