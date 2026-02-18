/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { registerTestComponent } from "~test-utils";
import ELEMENT_COUNTER_DEFINITION, {
  ELEMENT_COUNTER_ATTRS,
} from "./_behavior-definition";
import { elementCounterBehaviorFactory } from "./behavior";
import { registerBehavior } from "~registry";

describe("Element Counter Behavior", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    registerBehavior(
      ELEMENT_COUNTER_DEFINITION.name,
      elementCounterBehaviorFactory,
    );
  });

  it("should count elements in the root and update textContent", async () => {
    const tag = "span";
    const webcomponentTag = "test-element-counter";

    registerTestComponent(
      tag,
      { tag: webcomponentTag },
      (Base) => {
        return class extends Base {};
      },
      { "element-counter": ELEMENT_COUNTER_DEFINITION },
    );

    // Create root element
    const root = document.createElement("div");
    root.id = "test-root";
    document.body.appendChild(root);

    // Create counter element
    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLElement;
    el.setAttribute("behavior", "element-counter");
    el.setAttribute(ELEMENT_COUNTER_ATTRS.ROOT, "test-root");
    el.setAttribute(ELEMENT_COUNTER_ATTRS.SELECTOR, ".item");
    document.body.appendChild(el);

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

    registerTestComponent(
      tag,
      { tag: webcomponentTag },
      (Base) => {
        return class extends Base {};
      },
      { "element-counter": ELEMENT_COUNTER_DEFINITION },
    );

    const root = document.createElement("div");
    root.id = "test-root-input";
    document.body.appendChild(root);

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLInputElement;
    el.setAttribute("behavior", "element-counter");
    el.setAttribute(ELEMENT_COUNTER_ATTRS.ROOT, "test-root-input");
    el.setAttribute(ELEMENT_COUNTER_ATTRS.SELECTOR, ".item");
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
