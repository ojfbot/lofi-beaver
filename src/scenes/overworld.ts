/**
 * Overworld — the Willow Bend story-world scene (default mode), and the
 * substrate of the Mechanics Lab (ADR-0008).
 *
 * Every mechanic is a composable *dynamic* gated by LabConfig: the clock,
 * the flood, dams, the pump, beats/endings, residents, the heron. The
 * shipped game is fullGameConfig(); `?mode=lab&dyn=…` boots any other
 * combination over the same grid (Wright-style toy prototyping).
 *
 * Terrain: ex.IsometricMap (64×32) with foundry-generated tile masks.
 * Props and the avatar are Actors with IsometricEntityComponent for depth
 * sorting; multi-tile props sit at their footprint center (what the sprite
 * anchor encodes).
 */
import * as ex from "excalibur";
import { spriteRegistry } from "../assets/sprite-loader";
import { parseWorld, type ParsedWorld, type WorldProp } from "../maps/world";
import { WILLOW_BEND } from "../maps/willow-bend";
import { Beaver } from "../avatar/beaver";
import { TILE_W, TILE_H, PALETTES, applyPalette } from "../palette";
import { DayCycle, type DayPhase } from "../sim/day-cycle";
import { ActionBudget, validateDamPlacement } from "../sim/actions";
import { propagate, isWet } from "../flood/propagate";
import { placeDam, type Grid } from "../flood/grid";
import { runPump } from "../sim/pump";
import { DayStrip } from "../ui/day-strip";
import { VignetteOverlay } from "../ui/vignette";
import { TitleCard } from "../ui/title";
import { LocationPanel } from "../ui/location-panel";
import { LabChip } from "../ui/lab-chip";
import { BEATS, type BeatState } from "../story/beats";
import { buildResidentLookup, type Resident } from "../story/residents";
import { pickEnding, floodedHouses, isHouse } from "../sim/ending";
import { blockedKey } from "../maps/world";
import { fullGameConfig, type LabConfig, type DynamicId } from "../lab/config";

export class OverworldScene extends ex.Scene {
  worldData: ParsedWorld = parseWorld(WILLOW_BEND);
  grid: Grid = this.worldData.grid;
  map!: ex.IsometricMap;
  beaver!: Beaver;
  cycle!: DayCycle;
  budget!: ActionBudget;
  dayStrip: DayStrip | null = null;
  vignette = new VignetteOverlay();
  title: TitleCard | null = null;
  locationPanel = new LocationPanel();
  seasonOver = false;
  private config: LabConfig;
  private shownBeats = new Set<string>();
  private residentByProp!: Map<WorldProp, Resident>;
  private propByCell = new Map<string, WorldProp>();
  private pumpPos: { x: number; y: number } | null = null;
  private heronSpawned = false;
  private suppressNextClick = false;
  private engineRef!: ex.Engine;

  constructor(config: LabConfig = fullGameConfig()) {
    super();
    this.config = config;
    this.budget = new ActionBudget(config.params.budget);
  }

  private has(d: DynamicId): boolean {
    return this.config.dynamics.has(d);
  }

  override onInitialize(engine: ex.Engine): void {
    this.engineRef = engine;
    this.map = new ex.IsometricMap({
      pos: ex.vec(0, 0),
      tileWidth: TILE_W,
      tileHeight: TILE_H,
      columns: this.worldData.width,
      rows: this.worldData.height,
    });
    this.syncTerrainGraphics();
    this.add(this.map);

    for (const prop of this.worldData.props) {
      this.add(this.makeProp(prop));
      if (prop.kind === "landmark_pump_station") {
        this.pumpPos = { x: prop.x, y: prop.y };
      }
    }

    this.beaver = new Beaver(this.worldData, this.map);
    this.add(this.beaver);
    // UI chrome is DOM (palette-tinted by the multiply overlay), not entities
    if (this.has("clock")) this.dayStrip = new DayStrip(this.config.params.seasonDays);
    if (this.config.lab) new LabChip(this.config);

    this.camera.strategy.lockToActor(this.beaver);
    this.camera.zoom = 2;

    this.residentByProp = buildResidentLookup(this.worldData);
    for (const prop of this.worldData.props) {
      if (!isHouse(prop.kind)) continue;
      for (let dy = 0; dy < prop.footprint[1]; dy++) {
        for (let dx = 0; dx < prop.footprint[0]; dx++) {
          this.propByCell.set(blockedKey(prop.x + dx, prop.y + dy), prop);
        }
      }
    }

    this.cycle = new DayCycle({
      onPhase: (phase, day) => this.onPhase(phase, day),
    });
    if (this.has("title")) {
      // the season starts when the title card is dismissed; the dismissing
      // click's pointer-up still reaches the engine, so swallow it
      this.title = new TitleCard();
      this.title.show(() => {
        this.suppressNextClick = true;
        if (this.has("clock")) this.cycle.begin();
      });
    } else if (this.has("clock")) {
      this.cycle.begin();
    }

    this.input.pointers.primary.on("up", (evt) => {
      if (this.suppressNextClick) {
        this.suppressNextClick = false;
        return;
      }
      // a click that dismisses the story panel never falls through to a dam
      if ((this.title?.isOpen ?? false) || this.vignette.isOpen) {
        this.vignette.dismiss();
        return;
      }
      const t = this.map.worldToTile(evt.worldPos);
      const houseProp = this.propByCell.get(blockedKey(t.x, t.y));
      if (houseProp && this.has("residents")) {
        this.showResident(houseProp);
        return;
      }
      this.locationPanel.hide();
      if (this.has("dams")) this.tryPlaceDam(evt.worldPos);
    });

    // Snap-script probe + lab hooks
    const w = window as unknown as { __lofi?: Record<string, unknown> };
    w.__lofi = {
      ...(w.__lofi ?? {}),
      worldProbe: () => ({
        avatarTile: this.beaver.tile(),
        props: this.worldData.props.length,
        sources: this.worldData.sources,
        size: [this.worldData.width, this.worldData.height],
        day: this.cycle.day,
        phase: this.cycle.phase,
        budgetRemaining: this.budget.remaining,
        wetCount: this.grid.cells.filter(isWet).length,
        damCount: this.grid.cells.filter((c) => c.damPlaced).length,
        floodedHouses: floodedHouses(this.worldData, this.grid),
        heron: this.heronSpawned,
        seasonOver: this.seasonOver,
        lab: {
          enabled: this.config.lab,
          dynamics: [...this.config.dynamics],
          params: this.config.params,
        },
      }),
      // test hooks
      advancePhase: () => this.cycle.skipToNextPhase(),
      floodNights: (n: number) => {
        for (let i = 0; i < n; i++) this.resolveNight();
      },
    };
  }

  override onPreUpdate(engine: ex.Engine, deltaMs: number): void {
    // the title, story panels, and the season's end all stop the clock
    if (
      this.has("clock") &&
      !this.vignette.isOpen &&
      !(this.title?.isOpen ?? false) &&
      !this.seasonOver
    ) {
      this.cycle.update(deltaMs / 1000);
    }
    // sandbox stepping: no clock → N resolves a night on demand
    if (
      this.config.lab &&
      !this.has("clock") &&
      engine.input.keyboard.wasPressed(ex.Keys.N)
    ) {
      this.resolveNight();
      this.budget.resetDaily();
    }
    this.dayStrip?.setState(
      this.cycle.day,
      this.budget.remaining,
      this.budget.perDay,
    );
  }

  private onPhase(phase: DayPhase, _day: number): void {
    switch (phase) {
      case "dawn":
        applyPalette(this.engineRef, PALETTES.day);
        this.budget.resetDaily();
        if (this.cycle.day > this.config.params.seasonDays && !this.seasonOver) {
          this.endSeason();
        } else if (this.has("beats")) {
          this.checkBeats();
        }
        break;
      case "dusk":
        applyPalette(this.engineRef, PALETTES.night);
        break;
      case "night":
        this.resolveNight();
        break;
    }
  }

  private checkBeats(): void {
    const state: BeatState = {
      day: this.cycle.day,
      wetCount: this.grid.cells.filter(isWet).length,
      damCount: this.grid.cells.filter((c) => c.damPlaced).length,
    };
    const beat = BEATS.find((b) => !this.shownBeats.has(b.id) && b.when(state));
    if (beat) {
      this.shownBeats.add(beat.id);
      this.vignette.show(beat);
      if (beat.id === "first-heron" && this.has("heron")) this.spawnHeron();
    }
  }

  private showResident(prop: WorldProp): void {
    const resident = this.residentByProp.get(prop);
    if (!resident) return;
    let flooded = false;
    for (let dy = 0; dy < prop.footprint[1] && !flooded; dy++) {
      for (let dx = 0; dx < prop.footprint[0] && !flooded; dx++) {
        const cell = this.grid.cells[(prop.y + dy) * this.grid.width + (prop.x + dx)];
        if (cell && isWet(cell)) flooded = true;
      }
    }
    this.locationPanel.show(resident, flooded);
  }

  /** The wetland sends its surveyor: a heron wades in at the water's edge. */
  private spawnHeron(): void {
    if (this.heronSpawned) return;
    this.heronSpawned = true;
    const tile = this.findHeronPerch();
    const sheet = spriteRegistry.get("heron");
    const meta = sheet.meta;
    const actor = new ex.Actor({
      pos: this.map.tileToWorld(ex.vec(tile.x, tile.y)).add(ex.vec(0, TILE_H / 2)),
      width: TILE_W / 2,
      height: TILE_H / 2,
      anchor: ex.vec(
        meta.anchor_px[0] / meta.frame.w,
        meta.anchor_px[1] / meta.frame.h,
      ),
    });
    // unhurried idle: stand tall, occasionally fish
    actor.graphics.use(
      new ex.Animation({
        frames: [
          { graphic: sheet.frames[0]!, duration: 2600 },
          { graphic: sheet.frames[1]!, duration: 1100 },
        ],
        strategy: ex.AnimationStrategy.Loop,
      }),
    );
    actor.addComponent(new ex.IsometricEntityComponent(this.map));
    this.add(actor);
  }

  /** First dry, unblocked tile adjacent to water, scanning out from the pond. */
  private findHeronPerch(): { x: number; y: number } {
    const w = this.grid.width;
    const isWater = (x: number, y: number) => {
      const cell = this.grid.cells[y * w + x];
      return !!cell && (this.worldData.terrain[y]![x] === "water" || isWet(cell));
    };
    let best: { x: number; y: number } | null = null;
    let bestDist = Infinity;
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < w; x++) {
        if (isWater(x, y) || this.worldData.blocked.has(blockedKey(x, y))) continue;
        const nearWater =
          (x > 0 && isWater(x - 1, y)) ||
          (x < w - 1 && isWater(x + 1, y)) ||
          (y > 0 && isWater(x, y - 1)) ||
          (y < this.grid.height - 1 && isWater(x, y + 1));
        if (!nearWater) continue;
        const d = Math.abs(x - 12.5) + Math.abs(y - 13);
        if (d < bestDist) {
          bestDist = d;
          best = { x, y };
        }
      }
    }
    return best ?? { x: 15, y: 12 };
  }

  /** Dawn after the last day: the watershed's state picks the ending. */
  private endSeason(): void {
    this.seasonOver = true;
    const ending = pickEnding(this.worldData, this.grid);
    this.vignette.show({
      id: `ending-${ending.id}`,
      vignetteId: ending.vignetteId,
      title: ending.title,
      text: ending.text,
      when: () => true,
    });
  }

  /** The v0 flood core as the nightly resolver — water finds its old paths;
   * then the pump (if running) claws some of it back. */
  private resolveNight(): void {
    if (this.has("flood")) {
      let g = this.grid;
      for (let i = 0; i < this.config.params.nightTicks; i++) {
        g = propagate({
          grid: g,
          sources: this.worldData.sources,
          dt: this.config.params.nightDt,
        });
      }
      this.grid = g;
    }
    if (this.has("pump") && this.pumpPos) {
      runPump(this.grid, this.pumpPos, this.config.params.pumpPower);
    }
    this.syncTerrainGraphics();
  }

  private tryPlaceDam(worldPos: ex.Vector): void {
    const t = this.map.worldToTile(worldPos);
    const target = { x: t.x, y: t.y };
    const check = validateDamPlacement(
      this.worldData,
      this.grid,
      this.budget,
      this.beaver.tile(),
      target,
    );
    if (!check.ok) return;
    if (!placeDam(this.grid, target.x, target.y)) return;
    this.budget.spend("dam");
    this.add(this.makeDamActor(target.x, target.y));
  }

  /** Tile graphics from terrain + current water state (wet cells flood over). */
  private syncTerrainGraphics(): void {
    const grass = spriteRegistry.get("tile_grass");
    const road = spriteRegistry.get("tile_road");
    const water = spriteRegistry.get("tile_water");
    const waterGfx = water.animation ?? water.frames[0]!;

    for (const tile of this.map.tiles) {
      const kind = this.worldData.terrain[tile.y]![tile.x]!;
      const cell = this.grid.cells[tile.y * this.grid.width + tile.x]!;
      tile.clearGraphics();
      if (kind === "water" || isWet(cell)) {
        tile.addGraphic(waterGfx);
      } else if (kind === "road") {
        tile.addGraphic(road.frames[0]!);
      } else if (kind === "swale") {
        // No dedicated swale sprite yet — the tufted grass variant reads
        // as the unmown easement strip.
        tile.addGraphic(grass.frames[1]!);
      } else {
        tile.addGraphic(grass.frames[(tile.x * 7 + tile.y * 13) % 2]!);
      }
    }
  }

  private makeDamActor(x: number, y: number): ex.Actor {
    const sheet = spriteRegistry.get("dam_segment");
    const meta = sheet.meta;
    const actor = new ex.Actor({
      pos: this.map.tileToWorld(ex.vec(x, y)).add(ex.vec(0, TILE_H / 2)),
      width: TILE_W,
      height: TILE_H,
      anchor: ex.vec(
        meta.anchor_px[0] / meta.frame.w,
        meta.anchor_px[1] / meta.frame.h,
      ),
    });
    actor.graphics.use(sheet.frames[0]!);
    actor.addComponent(new ex.IsometricEntityComponent(this.map));
    return actor;
  }

  private makeProp(prop: WorldProp): ex.Actor {
    const sheet = spriteRegistry.get(prop.kind);
    const meta = sheet.meta;
    const [fw, fh] = prop.footprint;
    // Fixtures center models on the footprint center; for a 2×2 that's the
    // shared corner of the 4 cells — tile coords (x + 0.5, y + 0.5).
    const center = this.map.tileToWorld(
      ex.vec(prop.x + (fw - 1) / 2, prop.y + (fh - 1) / 2),
    );
    const actor = new ex.Actor({
      pos: center.add(ex.vec(0, TILE_H / 2)),
      width: fw * TILE_W,
      height: fh * TILE_H,
      // Actor.anchor drives graphics placement (assigning graphics.anchor
      // directly gets clobbered by the actor's own anchor every frame).
      anchor: ex.vec(
        meta.anchor_px[0] / meta.frame.w,
        meta.anchor_px[1] / meta.frame.h,
      ),
    });
    actor.graphics.use(sheet.frames[prop.variant % sheet.frames.length]!);
    actor.addComponent(new ex.IsometricEntityComponent(this.map));
    return actor;
  }
}
