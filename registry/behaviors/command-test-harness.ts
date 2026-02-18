import buildCommandClassGenerator from "@/components/extends/_strict-element";
import type {
  WebComponentDef,
  BehaviorDef,
} from "@/components/html/_registry-core";
import type { StrictEventMethods } from "~registry";

type TagToClass<T extends keyof HTMLElementTagNameMap> =
  HTMLElementTagNameMap[T];

type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * Registers a Web Component for testing using the strict element generator.
 * This ensures the component is registered exactly as it would be in the application.
 */
export function registerTestComponent<
  T extends keyof HTMLElementTagNameMap,
  C extends string,
  N extends string,
>(
  tag: T,
  def: WebComponentDef<C>,
  factory: (
    base: Constructor<TagToClass<T> & StrictEventMethods<C, N>>,
  ) => Constructor<TagToClass<T>> &
    Pick<WebComponentDef<C>, "observedAttributes">,
  behaviors?: Record<string, BehaviorDef<string>>,
) {
  // buildCommandClassGenerator handles the check for existing custom elements
  buildCommandClassGenerator(def, tag, factory, behaviors);
}

/**
 * Dispatches a CommandEvent to a target element.
 * This mimics the browser's Command API behavior or our polyfill.
 */
export function dispatchCommand<T extends string>(
  target: HTMLElement,
  command: T,
  source: HTMLElement = document.createElement("button"),
): CommandEvent<T> {
  const event = new Event("command", {
    bubbles: true,
    cancelable: true,
    composed: true,
  }) as CommandEvent<T>;

  // Assign the properties that CommandEvent expects
  Object.defineProperty(event, "command", { value: command });
  Object.defineProperty(event, "source", { value: source });

  target.dispatchEvent(event);
  return event;
}

/**
 * Helper to create a mock source element for commands
 */
export function createCommandSource(id?: string): HTMLButtonElement {
  const btn = document.createElement("button");
  if (id) btn.id = id;
  return btn;
}
