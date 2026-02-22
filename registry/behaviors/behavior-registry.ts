import { type EventInterceptors } from "auto-wc";

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

const factoryRegistry = new Map<string, BehaviorFactory>();
const loaderRegistry = new Map<string, BehaviorLoader>();
const loadingStates = new Map<string, Promise<void>>();

export function registerBehavior(name: string, factory: BehaviorFactory) {
  if (factoryRegistry.has(name)) {
    console.warn(`Behavior "${name}" is already registered.`);
    return;
  }
  factoryRegistry.set(name, factory);
}

export function getBehavior(name: string): BehaviorFactory | undefined {
  return factoryRegistry.get(name);
}

/**
 * Ensures a behavior is loaded and registered.
 * If the behavior is already registered, returns immediately.
 * If it's currently loading, returns the existing promise.
 * Otherwise, triggers the loader and returns a new promise.
 */
export function ensureBehavior(name: string): Promise<void> | void {
  // 1. Check if already registered
  if (factoryRegistry.has(name)) return;

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
      if (!factoryRegistry.has(name)) {
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
