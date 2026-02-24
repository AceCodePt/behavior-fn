/**
 * Attribute name constants for the element-counter behavior.
 * 
 * Separated from schema.ts to avoid bundling TypeBox in CDN builds.
 */
export const ELEMENT_COUNTER_ATTRS = {
  ROOT: "element-counter-root",
  SELECTOR: "element-counter-selector",
} as const;
