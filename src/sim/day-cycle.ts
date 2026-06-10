/**
 * The daily clock: DAWN → DAY → DUSK → NIGHT → (day+1) DAWN …
 *
 * Pure state machine driven by update(dtSec); the scene reacts to phase
 * transitions via the onPhase callback (palette swaps, nightly flood resolve,
 * action-budget reset, story-beat checks). Durations are injectable so tests
 * can step through a full day in milliseconds.
 */
export type DayPhase = "dawn" | "day" | "dusk" | "night";

export interface DayCycleOptions {
  durations?: Partial<Record<DayPhase, number>>;
  /** Called on entering a phase. Day has already advanced when dawn fires. */
  onPhase?: (phase: DayPhase, day: number) => void;
}

const PHASE_ORDER: DayPhase[] = ["dawn", "day", "dusk", "night"];

const DEFAULT_DURATIONS: Record<DayPhase, number> = {
  dawn: 2,
  day: 40,
  dusk: 3,
  night: 1.5,
};

export class DayCycle {
  day = 1;
  phase: DayPhase = "dawn";
  phaseElapsed = 0;
  private durations: Record<DayPhase, number>;
  private onPhase?: (phase: DayPhase, day: number) => void;

  constructor(opts: DayCycleOptions = {}) {
    this.durations = { ...DEFAULT_DURATIONS, ...opts.durations };
    this.onPhase = opts.onPhase;
  }

  /** Fire the initial phase callback (call once after construction). */
  begin(): void {
    this.onPhase?.(this.phase, this.day);
  }

  /** Jump exactly to the next phase boundary (test/snap-scenario hook). */
  skipToNextPhase(): void {
    this.update(this.durations[this.phase] - this.phaseElapsed);
  }

  update(dtSec: number): void {
    this.phaseElapsed += dtSec;
    while (this.phaseElapsed >= this.durations[this.phase]) {
      this.phaseElapsed -= this.durations[this.phase];
      const idx = PHASE_ORDER.indexOf(this.phase);
      const next = PHASE_ORDER[(idx + 1) % PHASE_ORDER.length]!;
      if (next === "dawn") this.day += 1;
      this.phase = next;
      this.onPhase?.(this.phase, this.day);
    }
  }
}
