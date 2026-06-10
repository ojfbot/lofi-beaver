/**
 * The residents of Willow Bend — one household per house prop, assigned in
 * map-parse order (stable: parseWorld scans row-major). Click a house to
 * meet them; their line changes once the water reaches the crawlspace.
 */
import type { ParsedWorld, WorldProp } from "../maps/world";
import { isHouse } from "../sim/ending";

export interface Resident {
  address: string;
  name: string;
  dry: string;
  flooded: string;
}

const ROSTER: Resident[] = [
  {
    address: "2 Willow Bend Ct",
    name: "THE HENDERSONS",
    dry: "They have opinions about your lodge. They are drafting a letter.",
    flooded: "The letter is postponed. The koi have been moved upstairs.",
  },
  {
    address: "4 Willow Bend Ct",
    name: "THE OKAFORS",
    dry: "Their sprinklers run at dawn, rain or shine. Mostly shine.",
    flooded: "The sprinklers have been outcompeted.",
  },
  {
    address: "6 Willow Bend Ct",
    name: "THE PRICE-WHITTAKERS",
    dry: "Two kayaks in the garage, never used. They bought them ironically.",
    flooded: "The kayaks are no longer ironic.",
  },
  {
    address: "8 Willow Bend Ct",
    name: "MS. ALVAREZ",
    dry: "Keeps a rain gauge and a journal. Suspects something. Tells no one.",
    flooded: "Her journal's latest entry is just an underline.",
  },
  {
    address: "11 Swale View Ln",
    name: "THE NAKAMURAS",
    dry: "Their lawn has won awards. The awards are displayed facing the street.",
    flooded: "The lawn is now a wetland of distinction.",
  },
  {
    address: "13 Swale View Ln",
    name: "THE BERGSTROMS",
    dry: "He measures the pond level every morning and emails the HOA.",
    flooded: "The emails have stopped. He is on the roof with binoculars, thrilled.",
  },
  {
    address: "15 Swale View Ln",
    name: "THE DELGADOS",
    dry: "Their gutters are immaculate. Their downspouts point at the neighbors.",
    flooded: "The downspouts have been outflanked.",
  },
  {
    address: "3 Retention Way",
    name: "OLD MR. FINCH",
    dry: "Remembers when this was all cattails. Says so, often, to the mailbox.",
    flooded: "Stands on his porch saying 'told you' to no one in particular.",
  },
];

const FALLBACK: Resident = {
  address: "WILLOW BEND",
  name: "VACANT",
  dry: "The listing says 'water views pending.'",
  flooded: "The listing was accurate.",
};

/** Stable assignment: nth house prop (map scan order) → nth roster entry. */
export function buildResidentLookup(
  world: ParsedWorld,
): Map<WorldProp, Resident> {
  const map = new Map<WorldProp, Resident>();
  let i = 0;
  for (const prop of world.props) {
    if (!isHouse(prop.kind)) continue;
    map.set(prop, ROSTER[i] ?? FALLBACK);
    i += 1;
  }
  return map;
}
