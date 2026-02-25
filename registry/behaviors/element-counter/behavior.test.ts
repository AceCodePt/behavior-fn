/** @vitest-environment jsdom */
import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  vi,
  afterEach,
} from "vitest";
import { getObservedAttributes } from "~utils";
import { defineBehavioralHost } from "../behavioral-host";
import { registerBehavior } from "../behavior-registry";
import { elementCounterBehaviorFactory } from "./behavior";
import definition from "./_behavior-definition";

// Extract at module level for cleaner test code
const { name, attributes } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

describe("Element Counter Behavior", () => {
  beforeAll(() => {
    registerBehavior(name, elementCounterBehaviorFactory);
  });

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should count elements in the root and update textContent", async () => {
    const tag = "span";
    const webcomponentTag = "test-element-counter-span";
    defineBehavioralHost(tag, webcomponentTag, observedAttributes);

    // Create root element
    const root = document.createElement("div");
    root.id = "test-root";
    document.body.appendChild(root);

    // Create counter element
    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLElement;
    el.setAttribute("behavior", name);
    document.body.appendChild(el);
    el.setAttribute(attributes["element-counter-root"], "test-root");
    el.setAttribute(attributes["element-counter-selector"], ".item");

    // Initial count should be 0
    expect(el.textContent).toBe("0");

    // Add items to root
    const item1 = document.createElement("div");
    item1.className = "item";
    root.appendChild(item1);

    // Wait for MutationObserver
    await vi.waitFor(() => {
      expect(el.textContent).toBe("1");
    });

    const item2 = document.createElement("div");
    item2.className = "item";
    root.appendChild(item2);

    await vi.waitFor(() => {
      expect(el.textContent).toBe("2");
    });

    // Remove an item
    root.removeChild(item1);

    await vi.waitFor(() => {
      expect(el.textContent).toBe("1");
    });
  });

  it("should update value if the element is an input", async () => {
    const tag = "input";
    const webcomponentTag = "test-element-counter-input";
    defineBehavioralHost(tag, webcomponentTag, observedAttributes);

    const root = document.createElement("div");
    root.id = "test-root-input";
    document.body.appendChild(root);

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLInputElement;
    el.setAttribute("behavior", name);
    el.setAttribute(attributes["element-counter-root"], "test-root-input");
    el.setAttribute(attributes["element-counter-selector"], ".item");
    document.body.appendChild(el);

    expect(el.value).toBe("0");

    const item = document.createElement("div");
    item.className = "item";
    root.appendChild(item);

    await vi.waitFor(() => {
      expect(el.value).toBe("1");
    });
  });
});
