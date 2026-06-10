/**
 * The Mechanics Lab — Will Wright-style composable dynamics (ADR-0008).
 *
 * Every gameplay mechanic is a *dynamic*: a layer over the shared flood-grid
 * substrate that can be switched on/off and parameterized from the URL.
 * `?mode=lab&dyn=flood,dams&ticks=6` boots a toy; weird combinations are the
 * point (Spore's prototyping discipline: many cheap toys, each isolating a
 * dynamic, searching the possibility space — Gingold/Hecker GDC 2006).
 *
 * The shipped game is just one configuration: fullGameConfig().
 */
export type DynamicId =
  | "title" // title card gates the season start
  | "clock" // dawn→day→dusk→night cycle (off = sandbox; N steps a night)
  | "flood" // nightly BFS propagation from the spring
  | "dams" // click-to-dam with daily budget
  | "pump" // the suburb fights back: pump station drains cells nightly
  | "beats" // dawn story beats + season endings
  | "residents" // clickable household cards
  | "heron"; // wildlife return (spawned by its beat)

export interface DynamicInfo {
  id: DynamicId;
  label: string;
  blurb: string;
}

export const DYNAMICS: DynamicInfo[] = [
  { id: "title", label: "TITLE CARD", blurb: "season starts on click" },
  { id: "clock", label: "DAY CYCLE", blurb: "dawn/day/dusk/night; off = sandbox, N steps a night" },
  { id: "flood", label: "FLOOD", blurb: "the spring spreads each night (BFS)" },
  { id: "dams", label: "DAMS", blurb: "click near the beaver to dam; daily budget" },
  { id: "pump", label: "PUMP STATION", blurb: "suburb drains wet cells near the pump each night" },
  { id: "beats", label: "STORY BEATS", blurb: "dawn vignettes + season endings" },
  { id: "residents", label: "RESIDENTS", blurb: "click houses for household cards" },
  { id: "heron", label: "HERON", blurb: "the wetland sends its surveyor" },
];

export interface LabParams {
  /** propagation ticks per night */
  nightTicks: number;
  /** dt per propagation tick (seconds of sim-time) */
  nightDt: number;
  /** dam actions per day */
  budget: number;
  /** season length in days */
  seasonDays: number;
  /** wet cells the pump drains per night */
  pumpPower: number;
}

export const DEFAULT_PARAMS: LabParams = {
  nightTicks: 12,
  nightDt: 0.5,
  budget: 3,
  seasonDays: 14,
  pumpPower: 6,
};

export interface LabConfig {
  /** true when launched through ?mode=lab (enables lab chip + N-step) */
  lab: boolean;
  dynamics: Set<DynamicId>;
  params: LabParams;
}

/** The shipped game: every dynamic except the pump (balance ships later). */
export function fullGameConfig(): LabConfig {
  return {
    lab: false,
    dynamics: new Set(DYNAMICS.map((d) => d.id).filter((id) => id !== "pump")),
    params: { ...DEFAULT_PARAMS },
  };
}

const PARAM_KEYS: Record<string, keyof LabParams> = {
  ticks: "nightTicks",
  dt: "nightDt",
  budget: "budget",
  days: "seasonDays",
  pump: "pumpPower",
};

/** Parse `?mode=lab&dyn=flood,dams&ticks=6&dt=0.5&budget=9&days=7&pump=10`. */
export function parseLabConfig(search: URLSearchParams): LabConfig {
  const dynRaw = search.get("dyn") ?? "";
  const known = new Set(DYNAMICS.map((d) => d.id));
  const dynamics =
    dynRaw === "all"
      ? new Set<DynamicId>(DYNAMICS.map((d) => d.id))
      : new Set<DynamicId>(
          dynRaw
            .split(",")
            .map((s) => s.trim())
            .filter((s): s is DynamicId => known.has(s as DynamicId)),
        );
  const params = { ...DEFAULT_PARAMS };
  for (const [key, field] of Object.entries(PARAM_KEYS)) {
    const raw = search.get(key);
    if (raw === null) continue;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) params[field] = n;
  }
  return { lab: true, dynamics, params };
}

/** Build a lab URL for a combination (the launcher + sharing). */
export function labUrl(dynamics: Iterable<DynamicId>, params: Partial<LabParams> = {}): string {
  const q = new URLSearchParams({ mode: "lab", dyn: [...dynamics].join(",") });
  const reverse: Record<keyof LabParams, string> = {
    nightTicks: "ticks",
    nightDt: "dt",
    budget: "budget",
    seasonDays: "days",
    pumpPower: "pump",
  };
  for (const [field, value] of Object.entries(params) as Array<[keyof LabParams, number]>) {
    if (value !== DEFAULT_PARAMS[field]) q.set(reverse[field], String(value));
  }
  return `/?${q.toString()}`;
}
