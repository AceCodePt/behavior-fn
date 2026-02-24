/**
 * Attribute name constants for the content-setter behavior.
 * 
 * This file contains ONLY attribute name constants - no schema validation logic.
 * Separated from schema.ts to keep CDN bundles lightweight.
 */
export const CONTENT_SETTER_ATTRS = {
  /** The attribute to modify. Use "textContent" for text content updates. */
  ATTRIBUTE: "content-setter-attribute",
  /** The value to set on the target */
  VALUE: "content-setter-value",
  /** How to apply the value: "set" (default), "toggle", or "remove" */
  MODE: "content-setter-mode",
} as const;
