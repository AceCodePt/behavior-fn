/**
 * Attribute name constants for the reveal behavior.
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
export const REVEAL_ATTRS = {
  /** Delay before revealing (CSS time value, e.g., "300ms") */
  DELAY: "reveal-delay",
  
  /** Duration of reveal animation (CSS time value, e.g., "200ms") */
  DURATION: "reveal-duration",
  
  /** ID of anchor element for positioning */
  ANCHOR: "reveal-anchor",
  
  /** Auto-handle popover/dialog states */
  AUTO: "reveal-auto",
  
  /** Selector for target element to watch */
  WHEN_TARGET: "reveal-when-target",
  
  /** Attribute name on target to watch */
  WHEN_ATTRIBUTE: "reveal-when-attribute",
  
  /** Value that triggers reveal */
  WHEN_VALUE: "reveal-when-value",
  
  /** Standard HTML hidden attribute */
  HIDDEN: "hidden",
  
  /** Standard HTML open attribute (dialog/details) */
  OPEN: "open",
  
  /** Standard HTML popover attribute */
  POPOVER: "popover",
} as const;
