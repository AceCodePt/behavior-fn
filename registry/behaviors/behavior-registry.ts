import { type EventInterceptors } from "auto-wc";
import { type BehaviorDef } from "./behavior-utils";

export type CommandEvent<C = string> = Event & {
  source: HTMLElement;
  command: C;
};

export interface BehaviorInstance extends Partial<EventInterceptors> {
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  attributeChangedCallback?(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void;
}

export type BehaviorFactory = (el: HTMLElement) => BehaviorInstance;
export type BehaviorLoader = () => Promise<unknown>;

export interface BehaviorRegistration {
  definition: BehaviorDef;
  factory: BehaviorFactory;
}

const behaviorRegistry = new Map<string, BehaviorRegistration>();
const loaderRegistry = new Map<string, BehaviorLoader>();
const loadingStates = new Map<string, Promise<void>>();

/**
 * Register a behavior with its definition and factory.
 * 
 * @param definition - The behavior definition (name, schema, commands)
 * @param factory - The behavior factory function
 */
export function registerBehavior(
  definition: BehaviorDef,
  factory: BehaviorFactory,
): void;

/**
 * Register a behavior with just name and factory (for testing).
 * Creates a minimal definition with empty schema.
 * 
 * @param name - The behavior name
 * @param factory - The behavior factory function
 */
export function registerBehavior(
  name: string,
  factory: BehaviorFactory,
): void;

export function registerBehavior(
  definitionOrName: BehaviorDef | string,
  factory: BehaviorFactory,
) {
  let definition: BehaviorDef;
  let name: string;

  if (typeof definitionOrName === "string") {
    // Legacy/test signature: registerBehavior(name, factory)
    name = definitionOrName;
    definition = {
      name,
      schema: { type: "object", properties: {} },
    };
  } else {
    // New signature: registerBehavior(definition, factory)
    definition = definitionOrName;
    name = definition.name;
  }

  if (behaviorRegistry.has(name)) {
    console.warn(`Behavior "${name}" is already registered.`);
    return;
  }

  behaviorRegistry.set(name, { definition, factory });
}

export function getBehavior(name: string): BehaviorFactory | undefined {
  return behaviorRegistry.get(name)?.factory;
}

export function getBehaviorDef(name: string): BehaviorDef | undefined {
  return behaviorRegistry.get(name)?.definition;
}

/**
 * Ensures a behavior is loaded and registered.
 * If the behavior is already registered, returns immediately.
 * If it's currently loading, returns the existing promise.
 * Otherwise, triggers the loader and returns a new promise.
 */
export function ensureBehavior(name: string): Promise<void> | void {
  // 1. Check if already registered
  if (behaviorRegistry.has(name)) return;

  // 2. Check if currently loading
  const existingLoad = loadingStates.get(name);
  if (existingLoad) return existingLoad;

  // 3. Get the loader
  const loader = loaderRegistry.get(name);
  if (!loader) {
    console.error(`[BehaviorRegistry] No loader found for behavior: "${name}"`);
    return;
  }

  // 4. Start loading
  const loadPromise = (async () => {
    try {
      await loader();
      if (!behaviorRegistry.has(name)) {
        throw new Error(
          `Behavior "${name}" did not call registerBehavior after being loaded.`,
        );
      }
    } finally {
      loadingStates.delete(name);
    }
  })();

  loadingStates.set(name, loadPromise);
  return loadPromise;
}
