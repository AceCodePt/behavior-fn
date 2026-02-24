/**
 * Attribute name constants for the json-template behavior.
 * 
 * This file contains ONLY attribute name constants - no schema validation logic.
 * It exists separately from schema.ts to keep CDN bundles lightweight.
 * 
 * Architecture:
 * - constants.ts: Attribute names only (imported by behavior.ts for CDN)
 * - schema.ts: TypeBox schemas + re-exports constants (used by CLI transformation)
 * - behavior.ts: Behavior logic (imports from constants.ts to avoid TypeBox in CDN)
 * 
 * Why this matters:
 * - CDN bundles don't need TypeBox (~50KB savings per bundle)
 * - CLI still has full schema validation via schema.ts
 * - Keeps behavior.ts dependency chain clean for browser builds
 */
export const JSON_TEMPLATE_ATTRS = {
  /** ID of the <script type="application/json"> element containing the data */
  SOURCE: "json-template-source",
  
  /** ID of the element where rendered content will be inserted */
  TARGET: "json-template-target",
  
  /** JSON path for data binding (on descendant elements in template content) */
  DATA_KEY: "data-key",
  
  /** ID of template to use for rendering array items (on elements with data-key) */
  ITEM_TEMPLATE: "json-template-item",
} as const;
