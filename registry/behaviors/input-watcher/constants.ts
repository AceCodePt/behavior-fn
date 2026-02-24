/**
 * Attribute name constants for the input-watcher behavior.
 * 
 * This file contains ONLY attribute name constants - no schema validation logic.
 * Separated from schema.ts to keep CDN bundles lightweight (~50KB smaller).
 * 
 * The input-watcher behavior updates elements with formatted values from inputs.
 */
export const INPUT_WATCHER_ATTRS = {
  /** Selector or ID list of input elements to watch */
  TARGET: "input-watcher-target",
  
  /** Format string with placeholders (e.g., "Value: {value}") */
  FORMAT: "input-watcher-format",
  
  /** Events to listen to (comma-separated, default: "input,change") */
  EVENTS: "input-watcher-events",
  
  /** Attribute to read from target (default: value property) */
  ATTR: "input-watcher-attr",
} as const;
