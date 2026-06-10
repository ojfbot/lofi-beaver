/**
 * The Mechanics Lab launcher — `?mode=lab` with no `dyn` parameter.
 *
 * A tooling screen, not gameplay: it lists every dynamic with a toggle,
 * exposes the parameter knobs, and offers named presets (each a Wright-style
 * toy isolating a question). RUN navigates to the composed lab URL — which
 * is shareable, and several can run side-by-side in parallel tabs.
 *
 * Note: this screen is exempt from the 2-color histogram gate (ADR-0008) —
 * it uses styled DOM text. Gameplay screens remain strictly 1-bit.
 */
import { DYNAMICS, DEFAULT_PARAMS, labUrl, type DynamicId, type LabParams } from "./config";

interface Preset {
  name: string;
  blurb: string;
  dyn: DynamicId[];
  params?: Partial<LabParams>;
}

const PRESETS: Preset[] = [
  {
    name: "CLASSIC SEASON",
    blurb: "the shipped game, knobs exposed",
    dyn: ["title", "clock", "flood", "dams", "beats", "residents", "heron"],
  },
  {
    name: "TOY POND",
    blurb: "no clock, no story — press N to step nights; pure CA toy",
    dyn: ["flood", "dams"],
    params: { nightTicks: 6 },
  },
  {
    name: "PUMP WARS",
    blurb: "fast flood vs strong pump, big dam budget — the tug-of-war",
    dyn: ["clock", "flood", "dams", "pump", "residents"],
    params: { nightTicks: 18, budget: 9, pumpPower: 10, seasonDays: 7 },
  },
  {
    name: "DELUGE WITNESS",
    blurb: "no dams — watch the water take the season",
    dyn: ["clock", "flood", "beats", "residents", "heron"],
    params: { nightTicks: 24 },
  },
  {
    name: "QUIET TOWN",
    blurb: "no flood at all — ambient walk among the households",
    dyn: ["clock", "residents"],
  },
];

export function renderLabLauncher(): void {
  const ink = "#e8e0d0";
  const root = document.createElement("div");
  Object.assign(root.style, {
    position: "fixed",
    inset: "0",
    background: "#000",
    color: ink,
    fontFamily: "monospace",
    overflow: "auto",
    padding: "40px",
    zIndex: "20",
  });

  const checked = new Set<DynamicId>(["clock", "flood", "dams"]);
  const params: LabParams = { ...DEFAULT_PARAMS };

  const h = (tag: string, style: Record<string, string>, text?: string) => {
    const el = document.createElement(tag);
    Object.assign(el.style, style);
    if (text) el.textContent = text;
    return el;
  };

  root.appendChild(h("div", { fontSize: "30px", fontWeight: "bold", letterSpacing: "6px" }, "MECHANICS LAB"));
  root.appendChild(
    h(
      "div",
      { fontSize: "12px", margin: "6px 0 24px", opacity: "0.8" },
      "compose dynamics over the Willow Bend substrate · weird combinations encouraged · share the URL · run tabs in parallel",
    ),
  );

  // presets
  const presetRow = h("div", { display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "26px" });
  for (const preset of PRESETS) {
    const btn = h(
      "button",
      {
        background: "#000",
        color: ink,
        border: `1px solid ${ink}`,
        fontFamily: "monospace",
        fontSize: "12px",
        padding: "8px 12px",
        cursor: "pointer",
        textAlign: "left",
      },
    );
    const name = h("div", { fontWeight: "bold" }, preset.name);
    const blurb = h("div", { opacity: "0.7" }, preset.blurb);
    btn.appendChild(name);
    btn.appendChild(blurb);
    btn.addEventListener("click", () => {
      window.location.href = labUrl(preset.dyn, preset.params ?? {});
    });
    presetRow.appendChild(btn);
  }
  root.appendChild(presetRow);

  // dynamics toggles
  const grid = h("div", { display: "grid", gridTemplateColumns: "repeat(2, minmax(280px, 420px))", gap: "8px", marginBottom: "24px" });
  for (const d of DYNAMICS) {
    const row = h("label", { display: "flex", gap: "10px", alignItems: "baseline", cursor: "pointer", fontSize: "13px" });
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = checked.has(d.id);
    box.addEventListener("change", () => (box.checked ? checked.add(d.id) : checked.delete(d.id)));
    row.appendChild(box);
    const span = h("span", {});
    span.appendChild(h("b", {}, d.label));
    span.appendChild(h("span", { opacity: "0.65" }, ` — ${d.blurb}`));
    row.appendChild(span);
    grid.appendChild(row);
  }
  root.appendChild(grid);

  // knobs
  const knobRow = h("div", { display: "flex", gap: "18px", marginBottom: "28px", fontSize: "12px", flexWrap: "wrap" });
  const knob = (label: string, field: keyof LabParams, step: string) => {
    const wrap = h("label", { display: "flex", flexDirection: "column", gap: "4px" });
    wrap.appendChild(h("span", { opacity: "0.8" }, label));
    const input = document.createElement("input");
    input.type = "number";
    input.step = step;
    input.value = String(params[field]);
    Object.assign(input.style, {
      background: "#000",
      color: ink,
      border: `1px solid ${ink}`,
      fontFamily: "monospace",
      width: "90px",
      padding: "4px",
    });
    input.addEventListener("change", () => {
      const n = Number(input.value);
      if (Number.isFinite(n) && n > 0) params[field] = n;
    });
    wrap.appendChild(input);
    return wrap;
  };
  knobRow.appendChild(knob("night ticks", "nightTicks", "1"));
  knobRow.appendChild(knob("tick dt", "nightDt", "0.1"));
  knobRow.appendChild(knob("dam budget", "budget", "1"));
  knobRow.appendChild(knob("season days", "seasonDays", "1"));
  knobRow.appendChild(knob("pump power", "pumpPower", "1"));
  root.appendChild(knobRow);

  const run = h(
    "button",
    {
      background: ink,
      color: "#000",
      border: "none",
      fontFamily: "monospace",
      fontWeight: "bold",
      fontSize: "16px",
      padding: "12px 34px",
      cursor: "pointer",
      letterSpacing: "3px",
    },
    "RUN ▸",
  );
  run.addEventListener("click", () => {
    window.location.href = labUrl(checked, params);
  });
  root.appendChild(run);

  root.appendChild(
    h("div", { fontSize: "11px", marginTop: "26px", opacity: "0.6" }, "in-game: WASD walk · click to dam · N steps a night when DAY CYCLE is off"),
  );

  document.body.appendChild(root);
}
