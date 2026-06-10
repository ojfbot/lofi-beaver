import { startGame } from "./game";

const game = await startGame();

declare global {
  interface Window {
    __lofi?: { game?: typeof game; scene?: unknown };
  }
}
window.__lofi = { ...(window.__lofi ?? {}), game };
