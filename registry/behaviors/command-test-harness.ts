import type { CommandEvent } from "~registry";
import type { Mock } from "vitest";

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

/**
 * Type-safe helper to create behavioral elements with proper typing.
 * Eliminates need for `as any` when creating elements with `is` attribute.
 * 
 * @example
 * ```typescript
 * const el = createBehavioralElement("div", "test-reveal-div", {
 *   behavior: "reveal",
 *   "reveal-delay": "100ms",
 * });
 * // el is typed as HTMLDivElement
 * ```
 * 
 * @param tagName - HTML tag name (e.g., "div", "button")
 * @param webcomponentTag - Custom element name for the `is` attribute
 * @param attributes - Optional attributes to set on the element
 * @returns Properly typed HTML element
 */
export function createBehavioralElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  webcomponentTag: string,
  attributes?: Record<string, string>,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tagName, { 
    is: webcomponentTag 
  }) as HTMLElementTagNameMap[K];
  
  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      el.setAttribute(key, value);
    }
  }
  
  return el;
}

/**
 * Type-safe helper to extract CommandEvent from mock function calls.
 * Eliminates need for `as any` when accessing mock call arguments.
 * 
 * @example
 * ```typescript
 * const commandHandler = vi.fn();
 * target.addEventListener("command", commandHandler);
 * button.click();
 * 
 * const event = getCommandEvent(commandHandler);
 * expect(event.command).toBe("--show");
 * expect(event.source).toBe(button);
 * ```
 * 
 * @param mockFn - Vitest mock function
 * @param callIndex - Which call to extract (default: 0 = first call)
 * @returns CommandEvent with proper typing
 */
export function getCommandEvent<T = string>(
  mockFn: Mock,
  callIndex: number = 0,
): CommandEvent<T> {
  const call = mockFn.mock.calls[callIndex];
  if (!call) {
    throw new Error(`Mock function was not called at index ${callIndex}`);
  }
  return call[0] as CommandEvent<T>;
}

/**
 * Type for partial Response object used in fetch mocks.
 * Includes commonly mocked Response properties.
 * 
 * @example
 * ```typescript
 * vi.stubGlobal("fetch", vi.fn(() =>
 *   Promise.resolve(createMockResponse({
 *     text: () => Promise.resolve("<div>Response</div>"),
 *   }))
 * ));
 * ```
 */
export type MockResponse = Pick<
  Response,
  "ok" | "status" | "statusText" | "headers" | "text" | "json" | "blob" | "arrayBuffer"
>;

/**
 * Helper to create a mock Response object with sensible defaults.
 * 
 * @example
 * ```typescript
 * vi.stubGlobal("fetch", vi.fn(() =>
 *   Promise.resolve(createMockResponse({
 *     text: () => Promise.resolve("<div>Success</div>"),
 *   }))
 * ));
 * ```
 */
export function createMockResponse(
  overrides: Partial<MockResponse> = {}
): MockResponse {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers(),
    text: () => Promise.resolve(""),
    json: () => Promise.resolve({}),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    ...overrides,
  };
}
