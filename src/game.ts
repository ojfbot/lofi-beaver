import * as ex from "excalibur";
import { PuzzleScene } from "./scenes/puzzle";
import { SpriteTestScene } from "./scenes/spritetest";
import { OverworldScene } from "./scenes/overworld";
import { PAPER, PALETTES, applyPalette } from "./palette";
import { spriteRegistry } from "./assets/sprite-loader";
import { fullGameConfig, parseLabConfig } from "./lab/config";
import { renderLabLauncher } from "./lab/launcher";

const TERRAIN = ["tile_grass", "tile_road", "tile_water"];
const WORLD = [
  ...TERRAIN,
  "house_rambler",
  "house_two_story",
  "house_cottage",
  "tree_birch",
  "beaver_avatar",
  "dam_segment",
  "landmark_pump_station",
  "heron",
  "vignette_pump_station",
  "vignette_pond_dusk",
  "vignette_heron",
  "vignette_ending_watershed",
  "vignette_ending_polite",
];

/** Sprites required per mode — the puzzle mode is legacy vector-drawn and
 * boots with no assets at all. */
const SPRITE_IDS: Record<string, string[]> = {
  overworld: WORLD,
  lab: WORLD,
  spritetest: TERRAIN,
  puzzle: [],
};

export async function startGame(): Promise<ex.Engine | null> {
  const search = new URLSearchParams(window.location.search);
  const mode = search.get("mode") ?? "overworld";

  // ?mode=lab with no combination chosen → the launcher (tooling, no engine)
  if (mode === "lab" && !search.get("dyn")) {
    renderLabLauncher();
    return null;
  }

  const config = mode === "lab" ? parseLabConfig(search) : fullGameConfig();

  const game = new ex.Engine({
    canvasElementId: "game",
    displayMode: ex.DisplayMode.FillScreen,
    backgroundColor: PAPER,
    antialiasing: false,
    pixelArt: true,
    suppressPlayButton: true,
    scenes: {
      puzzle: PuzzleScene,
      spritetest: SpriteTestScene,
      overworld: new OverworldScene(config),
    },
  });

  const ids = SPRITE_IDS[mode] ?? [];
  if (ids.length > 0) {
    const images = await spriteRegistry.load(ids);
    const loader = new ex.Loader(images);
    loader.suppressPlayButton = true;
    await game.start(loader);
    // Sprites stay pure white; the palette arrives via the multiply overlay.
    applyPalette(game, PALETTES.day);
  } else {
    await game.start();
  }

  const scene: "puzzle" | "spritetest" | "overworld" =
    mode === "puzzle" ? "puzzle" : mode === "spritetest" ? "spritetest" : "overworld";
  await game.goToScene(scene);
  return game;
}
