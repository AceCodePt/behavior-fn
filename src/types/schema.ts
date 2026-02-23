import type { TObject } from "@sinclair/typebox";

/**
 * Behavior schemas are TypeBox TObject schemas at the API level.
 * They represent HTML element attributes (always objects at the root).
 */
export type AttributeSchema = TObject;

/**
 * Alias for backward compatibility and clarity in behavior context
 */
export type BehaviorSchema = AttributeSchema;

/**
 * Runtime JSON Schema property structure.
 * This is what TypeBox schemas become when evaluated - plain JSON Schema objects.
 * 
 * We need this because TypeBox's TSchema type is generic and doesn't provide
 * the specific structure we need to introspect at runtime in our transformers.
 */
export interface JSONSchemaProperty {
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  default?: unknown;
  enum?: string[];
  anyOf?: JSONSchemaProperty[];
  const?: string | number | boolean;
  properties?: Record<string, JSONSchemaProperty>;
  items?: JSONSchemaProperty;
  required?: string[];
  [key: string]: unknown;
}

/**
 * Runtime JSON Schema object (root level).
 * This is what TObject becomes at runtime - a plain JSON Schema object.
 */
export interface JSONSchemaObject {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  [key: string]: unknown;
}
