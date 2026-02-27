/**
 * Template generators for scaffolding new behaviors
 */

export function generateBehaviorDefinition(behaviorName: string): string {
  return `import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const ${toConstantCase(behaviorName)}_DEFINITION = uniqueBehaviorDef({
  name: "${behaviorName}",
  schema,
});

export default ${toConstantCase(behaviorName)}_DEFINITION;
`;
}

export function generateConstants(behaviorName: string): string {
  const constantsName = `${toConstantCase(behaviorName)}_ATTRS`;
  
  return `/**
 * Attribute name constants for the ${behaviorName} behavior.
 * 
 * This file contains ONLY attribute name constants - no schema validation logic.
 * Separated from schema.ts to keep CDN bundles lightweight (~50KB smaller).
 * 
 * The ${behaviorName} behavior [TODO: add description].
 */
export const ${constantsName} = {
  // Add your attribute constants here
  // Example:
  // /** Description of what this attribute does */
  // MY_ATTRIBUTE: "${behaviorName}-my-attribute",
} as const;
`;
}

export function generateSchema(behaviorName: string): string {
  const constantsName = `${toConstantCase(behaviorName)}_ATTRS`;
  
  return `import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";
import { ${constantsName} } from "./constants";

// Re-export constants for convenience
export { ${constantsName} };

/**
 * Schema for ${behaviorName} behavior
 * Define your attributes here using TypeBox
 */
export const schema = Type.Object({
  // Add your attribute definitions here using the constants
  // Example:
  // [${constantsName}.MY_ATTRIBUTE]: Type.Optional(Type.String()),
});

export type SchemaType = InferSchema<typeof schema>;
`;
}

export function generateBehavior(behaviorName: string): string {
  const factoryName = toCamelCase(behaviorName) + "BehaviorFactory";
  const constantsName = `${toConstantCase(behaviorName)}_ATTRS`;
  
  return `import { ${constantsName} } from "./constants";

/**
 * ${capitalize(behaviorName)} Behavior Implementation
 * 
 * This factory creates the behavior instance for the element.
 * Return an object with event handler methods (e.g., onClick, onMouseEnter)
 * that will be automatically wired by the behavioral host.
 */
export const ${factoryName} = (el: HTMLElement) => {
  return {
    // Add your event handlers here
    // Example:
    // onClick(e: MouseEvent) {
    //   const myAttr = el.getAttribute(${constantsName}.MY_ATTRIBUTE);
    //   console.log('Element clicked!', myAttr);
    // },
  };
};
`;
}

export function generateTest(behaviorName: string): string {
  const factoryName = toCamelCase(behaviorName) + "BehaviorFactory";
  
  return `/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { defineBehavioralHost } from "../behavioral-host";
import { ${factoryName} } from "./behavior";
import { registerBehavior } from "~registry";
import { getObservedAttributes } from "~utils";
import definition from "./_behavior-definition";

const { name } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

describe("${capitalize(behaviorName)} Behavior", () => {
  beforeAll(() => {
    registerBehavior(definition, ${factoryName});
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined", () => {
    expect(${factoryName}).toBeDefined();
    expect(name).toBe("${behaviorName}");
  });

  // Add your tests here
  it.todo("should implement behavior logic");
});
`;
}

// Utility functions
function toConstantCase(str: string): string {
  return str.toUpperCase().replace(/-/g, "_");
}

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function capitalize(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
