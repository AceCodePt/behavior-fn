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

export function generateSchema(behaviorName: string): string {
  return `import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";

/**
 * Schema for ${behaviorName} behavior
 * Define your attributes here using TypeBox
 */
export const schema = Type.Object({
  // Add your attribute definitions here
  // Example:
  // "my-attribute": Type.Optional(Type.String()),
});

export type SchemaType = InferSchema<typeof schema>;
`;
}

export function generateBehavior(behaviorName: string): string {
  const factoryName = toCamelCase(behaviorName) + "BehaviorFactory";
  
  return `/**
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
    //   console.log('Element clicked!');
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
    registerBehavior(name, ${factoryName});
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
