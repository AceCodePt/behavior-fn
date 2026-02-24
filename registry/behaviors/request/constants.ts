/**
 * Attribute name constants for the request behavior.
 * 
 * This file contains ONLY attribute name constants - no schema validation logic.
 * Separated from schema.ts to keep CDN bundles lightweight (~50KB smaller).
 * 
 * The request behavior provides HTMX-style declarative HTTP requests.
 */
export const REQUEST_ATTRS = {
  /** URL to send the request to */
  URL: "request-url",
  
  /** HTTP method (GET, POST, PUT, DELETE, PATCH) */
  METHOD: "request-method",
  
  /** Event that triggers the request (e.g., "click", "input") */
  TRIGGER: "request-trigger",
  
  /** Selector for element to update with response */
  TARGET: "request-target",
  
  /** How to swap content (innerHTML, outerHTML, beforebegin, etc.) */
  SWAP: "request-swap",
  
  /** Selector for loading indicator element */
  INDICATOR: "request-indicator",
  
  /** Confirmation message before sending request */
  CONFIRM: "request-confirm",
  
  /** Whether to push URL to browser history */
  PUSH_URL: "request-push-url",
  
  /** JSON values to include with request */
  VALS: "request-vals",
  
  /** Strategy for merging JSON responses into script tags */
  JSON_STRATEGY: "request-json-strategy",
} as const;
