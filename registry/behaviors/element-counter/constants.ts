/**
 * Attribute name constants for the element-counter behavior.
 * 
 * This file contains ONLY attribute name constants - no schema validation logic.
 * Separated from schema.ts to keep CDN bundles lightweight (~50KB smaller).
 * 
 * The element-counter behavior counts matching elements and displays the count.
 */
export const ELEMENT_COUNTER_ATTRS = {
  /** Selector for root element to search within (default: document) */
  ROOT: "element-counter-root",
  
  /** CSS selector for elements to count */
  SELECTOR: "element-counter-selector",
} as const;
