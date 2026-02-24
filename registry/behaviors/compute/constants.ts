/**
 * Attribute name constants for the compute behavior.
 * 
 * This file contains ONLY attribute name constants - no schema validation logic.
 * Separated from schema.ts to keep CDN bundles lightweight (~50KB smaller).
 * 
 * The compute behavior evaluates mathematical formulas and updates element content.
 */
export const COMPUTE_ATTRS = {
  /** Mathematical formula to evaluate (e.g., "2 + 2", "Math.sqrt(16)") */
  FORMULA: "compute-formula",
} as const;
