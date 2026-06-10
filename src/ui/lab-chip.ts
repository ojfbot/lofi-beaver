/**
 * Lab chip — bottom-left badge naming the active dynamic combination so
 * screenshots of parallel lab tabs are self-identifying. DOM canvas,
 * 1-bit quantized, paper backing plate (the HUD occlusion rule).
 */
import { quantizeCanvas1Bit } from "./panel";
import type { LabConfig } from "../lab/config";

export class LabChip {
  constructor(config: LabConfig) {
    const lines = [
      "LAB · " + [...config.dynamics].join(" "),
      `ticks ${config.params.nightTicks} · dt ${config.params.nightDt} · budget ${config.params.budget}` +
        (config.dynamics.has("pump") ? ` · pump ${config.params.pumpPower}` : "") +
        (config.dynamics.has("clock") ? "" : " · [N] step night"),
    ];
    const el = document.createElement("canvas");
    const ctx0 = el.getContext("2d")!;
    ctx0.font = "11px monospace";
    const width = Math.ceil(Math.max(...lines.map((l) => ctx0.measureText(l).width))) + 20;
    el.width = width;
    el.height = 42;
    Object.assign(el.style, {
      position: "fixed",
      left: "10px",
      bottom: "10px",
      pointerEvents: "none",
      zIndex: "5",
      imageRendering: "pixelated",
    });
    const ctx = el.getContext("2d")!;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, 42);
    ctx.fillStyle = "#ffffff";
    ctx.font = "11px monospace";
    ctx.fillText(lines[0]!, 10, 17);
    ctx.fillText(lines[1]!, 10, 33);
    quantizeCanvas1Bit(ctx, "panel");
    document.body.appendChild(el);
  }
}
