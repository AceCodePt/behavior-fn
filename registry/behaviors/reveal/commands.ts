import { REVEAL_ATTRS } from "./constants";

// Commands for reveal behavior
export const REVEAL_COMMANDS = {
  "--show": "--show",
  "--hide": "--hide",
  "--toggle": "--toggle",
} as const;

// Observed attributes - derived from REVEAL_ATTRS (single source of truth)
// This avoids bundling TypeBox schemas in CDN builds
export const REVEAL_OBSERVED_ATTRIBUTES = Object.values(REVEAL_ATTRS);
