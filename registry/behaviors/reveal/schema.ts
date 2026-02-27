import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

/**
 * Schema for reveal behavior.
 * 
 * The schema keys define the HTML attributes that control reveal behavior.
 * uniqueBehaviorDef automatically extracts these keys to create definition.attributes.
 * 
 * Pattern: { "reveal-delay": "reveal-delay", "reveal-duration": "reveal-duration", ... }
 */
export const schema = Type.Object({
  /** Delay before revealing (CSS time value, e.g., "300ms") */
  "reveal-delay": Type.Optional(Type.String({ description: "CSS time value for delay" })),
  
  /** Duration of reveal animation (CSS time value, e.g., "200ms") */
  "reveal-duration": Type.Optional(Type.String({ description: "CSS time value for duration" })),
  
  /** ID of anchor element for positioning */
  "reveal-anchor": Type.Optional(Type.String({ description: "ID of the anchor element" })),
  
  /** Auto-handle popover/dialog states */
  "reveal-auto": Type.Optional(Type.Boolean({ description: "Whether to auto-handle popover/dialog states" })),
  
  /** Selector for target element to watch */
  "reveal-when-target": Type.Optional(Type.String({ description: "Selector for the target element to watch" })),
  
  /** Attribute name on target to watch */
  "reveal-when-attribute": Type.Optional(Type.String({ description: "Attribute name on the target to watch" })),
  
  /** Value that triggers reveal */
  "reveal-when-value": Type.Optional(Type.String({ description: "Value of the attribute that triggers reveal" })),
  
  /** Standard HTML hidden attribute */
  "hidden": Type.Optional(Type.Boolean({ description: "Whether the element is hidden" })),
  
  /** Standard HTML open attribute (dialog/details) */
  "open": Type.Optional(Type.Boolean({ description: "Whether the dialog/details is open" })),
  
  /** Standard HTML popover attribute */
  "popover": Type.Optional(Type.String({ description: "Popover state (auto/manual)" })),
});

export type Schema = InferSchema<typeof schema>;
export type SchemaType = Schema;
