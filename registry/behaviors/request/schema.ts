import { Type, type Static } from "@sinclair/typebox";

export const REQUEST_ATTRS = {
  URL: "request-url",
  METHOD: "request-method",
  TRIGGER: "request-trigger",
  TARGET: "request-target",
  SWAP: "request-swap",
  INDICATOR: "request-indicator",
  CONFIRM: "request-confirm",
  PUSH_URL: "request-push-url",
  VALS: "request-vals",
} as const;

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

export const schema = Type.Object({
  [REQUEST_ATTRS.URL]: Type.Optional(Type.String()),
  [REQUEST_ATTRS.METHOD]: Type.Optional(
    Type.Union([
      Type.Literal("GET"),
      Type.Literal("POST"),
      Type.Literal("PUT"),
      Type.Literal("DELETE"),
      Type.Literal("PATCH"),
    ]),
  ),
  [REQUEST_ATTRS.TRIGGER]: Type.Optional(
    Type.Union([
      Type.String(),
      Type.Array(Type.Union([Type.String(), TriggerSchema])),
      TriggerSchema,
    ]),
  ),
  [REQUEST_ATTRS.TARGET]: Type.Optional(Type.String()),
  [REQUEST_ATTRS.SWAP]: Type.Optional(
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
  [REQUEST_ATTRS.INDICATOR]: Type.Optional(Type.String()),
  [REQUEST_ATTRS.CONFIRM]: Type.Optional(Type.String()),
  [REQUEST_ATTRS.PUSH_URL]: Type.Optional(
    Type.Union([Type.String(), Type.Boolean()]),
  ),
  [REQUEST_ATTRS.VALS]: Type.Optional(Type.String()),
});

export type TriggerConfig = Static<typeof TriggerSchema>;
export type RequestConfig = Static<typeof schema>;
