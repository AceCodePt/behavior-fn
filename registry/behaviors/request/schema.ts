import { Type, type Static } from "@sinclair/typebox";

export const schema = Type.Object({
  "request-method": Type.Optional(
    Type.Union([
      Type.Literal(""),
      Type.Literal("GET"),
      Type.Literal("POST"),
      Type.Literal("PUT"),
      Type.Literal("DELETE"),
      Type.Literal("PATCH"),
    ]),
  ),
  "request-trigger": Type.Optional(
    Type.Union([
      Type.String(),
      Type.Array(
        Type.Union([
          Type.String(),
          Type.Object({
            event: Type.String(),
            "sse-message": Type.Optional(Type.String()),
            "sse-close": Type.Optional(Type.String()),
            from: Type.Optional(Type.String()),
            delay: Type.Optional(Type.Number()),
            throttle: Type.Optional(Type.Number()),
            once: Type.Optional(Type.Boolean()),
            changed: Type.Optional(Type.Boolean()),
            consume: Type.Optional(Type.Boolean()),
          }),
        ]),
      ),
    ]),
  ),
  "request-target": Type.Optional(Type.String()),
  "request-swap": Type.Optional(
    Type.Union([
      Type.Literal(""),
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
  "request-indicator": Type.Optional(Type.String()),
  "request-confirm": Type.Optional(Type.String()),
  "request-push-url": Type.Optional(
    Type.Union([Type.String(), Type.Boolean()]),
  ),
  "request-vals": Type.Optional(Type.String()),
});

export type SchemaType = Static<typeof schema>;
