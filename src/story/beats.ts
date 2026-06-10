/**
 * Story beats — checked at DAWN. Each fires once, opening a vignette panel.
 * Conditions read the simulation, so the water's progress drives the story.
 */
export interface BeatState {
  day: number;
  wetCount: number;
  damCount: number;
}

export interface StoryBeat {
  id: string;
  vignetteId: string;
  title: string;
  text: string;
  when: (s: BeatState) => boolean;
}

export const BEATS: StoryBeat[] = [
  {
    id: "pump-station",
    vignetteId: "vignette_pump_station",
    title: "THE PUMP STATION",
    text: "It ran all night again. The HOA newsletter calls it routine maintenance. The herons call it dinner bell.",
    when: (s) => s.day >= 2,
  },
  {
    id: "pond-remembers",
    vignetteId: "vignette_pond_dusk",
    title: "THE POND REMEMBERS",
    text: "Before the cul-de-sacs, this was all wetland. The water has started checking its old mail.",
    when: (s) => s.wetCount >= 10,
  },
  {
    id: "first-heron",
    vignetteId: "vignette_heron",
    title: "THE FIRST HERON",
    text: "It stood in the new shallows all morning, between the mailboxes, auditing. The wetland has sent its surveyor.",
    when: (s) => s.wetCount >= 16,
  },
];
