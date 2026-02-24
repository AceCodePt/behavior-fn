/**
 * Attribute name constants for the logger behavior.
 * 
 * This file contains ONLY attribute name constants - no schema validation logic.
 * Separated from schema.ts to keep CDN bundles lightweight (~50KB smaller).
 */
export const LOGGER_ATTRS = {
  /** Event that triggers logging (e.g., "click", "mouseenter") */
  TRIGGER: "logger-trigger",
} as const;
