import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

export const TriggerSchema = Type.Object({
  event: Type.String(),
  "sse-message": Type.Optional(Type.String()),
  "sse-messages": Type.Optional(Type.Array(Type.String())),
  "sse-close": Type.Optional(Type.String()),
  from: Type.Optional(Type.String()),
  delay: Type.Optional(Type.Number()),
  throttle: Type.Optional(Type.Number()),
  once: Type.Optional(Type.Boolean()),
  changed: Type.Optional(Type.Boolean()),
  consume: Type.Optional(Type.Boolean()),
  keys: Type.Optional(Type.Array(Type.String())),
});

export const schema = Type.Object({
  "request-url": Type.Optional(Type.String()),
  "request-method": Type.Optional(
    Type.Union([
      Type.Literal("GET"),
      Type.Literal("POST"),
      Type.Literal("PUT"),
      Type.Literal("DELETE"),
      Type.Literal("PATCH"),
    ]),
  ),
  "request-encoding": Type.Optional(
    Type.Union([Type.Literal("form"), Type.Literal("json")])
  ),
  "request-trigger": Type.Optional(
    Type.Union([
      Type.String(),
      Type.Array(Type.Union([Type.String(), TriggerSchema])),
      TriggerSchema,
    ]),
  ),
  "request-target": Type.Optional(Type.String()),
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
    ]),
  ),
  "request-confirm": Type.Optional(Type.String()),
  "request-push-url": Type.Optional(
    Type.Union([Type.String(), Type.Boolean()]),
  ),
  "request-vals": Type.Optional(Type.String()),
  "request-include": Type.Optional(Type.String()),
});

export type TriggerConfig = InferSchema<typeof TriggerSchema>;
export type RequestConfig = InferSchema<typeof schema>;
