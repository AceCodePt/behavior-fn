import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

export const TriggerSchema = Type.Object({
  event: Type.String(),
  "sse-message": Type.Optional(Type.String()),
  "sse-close": Type.Optional(Type.String()),
  from: Type.Optional(Type.String()),
  delay: Type.Optional(Type.Number()),
  throttle: Type.Optional(Type.Number()),
  once: Type.Optional(Type.Boolean()),
  changed: Type.Optional(Type.Boolean()),
  consume: Type.Optional(Type.Boolean()),
});

/**
 * Schema for request behavior.
 * 
 * The request behavior provides HTMX-style declarative HTTP requests.
 * uniqueBehaviorDef automatically extracts attribute keys to create definition.attributes.
 */
export const schema = Type.Object({
  /** URL to send the request to */
  "request-url": Type.Optional(Type.String()),
  
  /** HTTP method (GET, POST, PUT, DELETE, PATCH) */
  "request-method": Type.Optional(
    Type.Union([
      Type.Literal("GET"),
      Type.Literal("POST"),
      Type.Literal("PUT"),
      Type.Literal("DELETE"),
      Type.Literal("PATCH"),
    ]),
  ),
  
  /** Event that triggers the request (e.g., "click", "input") */
  "request-trigger": Type.Optional(
    Type.Union([
      Type.String(),
      Type.Array(Type.Union([Type.String(), TriggerSchema])),
      TriggerSchema,
    ]),
  ),
  
  /** Selector for element to update with response */
  "request-target": Type.Optional(Type.String()),
  
  /** How to swap content (innerHTML, outerHTML, beforebegin, etc.) */
  "request-swap": Type.Optional(
    Type.Union([
      Type.Literal("none"),
      Type.Literal("afterbegin"),
      Type.Literal("afterend"),
      Type.Literal("beforebegin"),
      Type.Literal("beforeend"),
      Type.Literal("innerHTML"),
      Type.Literal("outerHTML"),
      Type.Literal("delete"),
      Type.Literal("appendToArray"),
      Type.Literal("appendSpreadToArray"),
      Type.Literal("prependToArray"),
      Type.Literal("prependSpreadToArray"),
    ]),
  ),
  
  /** Selector for loading indicator element */
  "request-indicator": Type.Optional(Type.String()),
  
  /** Confirmation message before sending request */
  "request-confirm": Type.Optional(Type.String()),
  
  /** Whether to push URL to browser history */
  "request-push-url": Type.Optional(
    Type.Union([Type.String(), Type.Boolean()]),
  ),
  
  /** JSON values to include with request */
  "request-vals": Type.Optional(Type.String()),
});

export type TriggerConfig = InferSchema<typeof TriggerSchema>;
export type RequestConfig = InferSchema<typeof schema>;
