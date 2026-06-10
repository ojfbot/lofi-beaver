// Tile-type registry and propagation properties.
// Six types — enough variety to exercise BFS rules, few enough to author and
// visually distinguish in 1-bit. See decisions/adr/0001-… for the framing.

export type TileType =
  | "lot"        // single-family residence — win-condition tile, floods binary
  | "arterial"   // main road, low BFS cost (water flows faster)
  | "culdesac"   // dead-end road, same cost as arterial; trapping topology
  | "swale"      // drainage easement — drains water at sinkRate per second
  | "pond"       // retention pond — absorbs to capacity, then propagates
  | "curb";      // wall — blocks lateral flow; dams render as curb variants

export interface TileProps {
  /** If true, the tile cannot accumulate water and blocks neighbours from spreading through it. */
  blocks: boolean;
  /** Higher cost = fills slower. Inverse of "conductivity". */
  cost: number;
  /** Water units removed per second from this cell (swales only). */
  sinkRate: number;
  /** Inflow capacity absorbed before the cell starts accumulating water (ponds only). */
  capacity: number;
}

export const TILES: Record<TileType, TileProps> = {
  lot:      { blocks: false, cost: 2.0, sinkRate: 0,   capacity: 0 },
  arterial: { blocks: false, cost: 1.0, sinkRate: 0,   capacity: 0 },
  culdesac: { blocks: false, cost: 1.0, sinkRate: 0,   capacity: 0 },
  swale:    { blocks: false, cost: 2.0, sinkRate: 1.5, capacity: 0 },
  pond:     { blocks: false, cost: 2.0, sinkRate: 0,   capacity: 4.0 },
  curb:     { blocks: true,  cost: 0,   sinkRate: 0,   capacity: 0 },
};

export function effectiveBlocks(type: TileType, damPlaced: boolean): boolean {
  return TILES[type].blocks || damPlaced;
}
