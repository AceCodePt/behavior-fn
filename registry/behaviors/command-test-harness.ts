import type { CommandEvent } from "~registry";

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
