import * as ex from "excalibur";
import { INK } from "../palette";

export type GameState =
  | { kind: "playing" }
  | { kind: "won" }
  | { kind: "lost"; reason: "time" | "budget" | "spill" };

export interface HudData {
  title: string;
  puzzleIndex: number;
  puzzleTotal: number;
  timeRemaining: number;
  damBudget: number;
  damsPlaced: number;
  state: GameState;
}

export class Hud extends ex.ScreenElement {
  private getData: () => HudData;
  private font: ex.Font;

  constructor(getData: () => HudData) {
    super({ pos: ex.vec(16, 16), anchor: ex.vec(0, 0) });
    this.getData = getData;
    this.font = new ex.Font({
      family: "monospace",
      size: 18,
      color: INK,
      smoothing: false,
    });
  }

  override onInitialize(): void {
    this.graphics.onPostDraw = (gfx) => {
      const d = this.getData();
      const lines = [
        `lofi-beaver  ${d.puzzleIndex + 1}/${d.puzzleTotal}  ${d.title}`,
        ``,
        `time   ${pad(Math.max(0, d.timeRemaining).toFixed(1), 5)}s`,
        `dams   ${d.damBudget - d.damsPlaced}/${d.damBudget}`,
        stateLabel(d.state),
        ``,
        `click   place dam`,
        `R       restart`,
        `N       next puzzle`,
      ];
      const text = new ex.Text({
        text: lines.join("\n"),
        font: this.font,
      });
      text.draw(gfx, 0, 0);
    };
  }
}

function stateLabel(s: GameState): string {
  if (s.kind === "playing") return "flood the target.";
  if (s.kind === "won") return "FLOODED.  R restart  N next";
  switch (s.reason) {
    case "time":   return "TIME UP.  press R";
    case "budget": return "OUT OF DAMS.  press R";
    case "spill":  return "SPILL.  press R";
  }
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : " ".repeat(n - s.length) + s;
}
