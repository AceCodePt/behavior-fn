import { type StandardSchemaV1 } from "@standard-schema/spec";
import { type Static, type TSchema } from "@sinclair/typebox";

/**
 * Universal schema inference helper.
 * Prioritizes Standard Schema, then falls back to library-specific inference.
 */
export type InferSchema<T> = T extends StandardSchemaV1
  ? StandardSchemaV1.InferOutput<T>
  : T extends TSchema
    ? Static<T>
    : T extends { _output: infer O } // Zod
      ? O
      : T extends { infer: infer O } // ArkType
        ? O
        : T extends { _types: { output: infer O } } // Valibot
          ? O
          : unknown;

/**
 * Supported schema types for behaviors.
 * This can be expanded as needed, but Standard Schema is the preferred interface.
 */
export type BehaviorSchema = StandardSchemaV1 | TSchema | object;
