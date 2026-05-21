import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

export const schema = Type.Object({
  /** Formula for computation (e.g., "#price * #qty") */
  "compute-formula": Type.String(),

  /** Decimal places for rounding (optional) */
  "compute-precision": Type.Optional(Type.Number()),

  /** Fallback value when computation fails or is invalid (e.g., "0", "Invalid") */
  "compute-invalid-value": Type.Optional(Type.String()),

  /** Strategy for finding dependencies (default: "observe") */
  "compute-ready-strategy": Type.Optional(
    Type.Union([
      Type.Literal("observe"),
      Type.Literal("defer"),
      Type.Literal("retry"),
    ]),
  ),

  /** Max retries for the "retry" strategy */
  "compute-retry-count": Type.Optional(Type.Number()),

  /** Delay between retries in ms for the "retry" strategy */
  "compute-retry-delay": Type.Optional(Type.Number()),
});

export type SchemaType = InferSchema<typeof schema>;
