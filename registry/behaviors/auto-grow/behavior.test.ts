/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from "vitest";
import { defineBehavioralHost } from "~host";
import { autoGrowBehaviorFactory } from "./behavior";
import { registerBehavior } from "~registry";
import { getObservedAttributes } from "~utils";
import definition from "./_behavior-definition";

// Module-level extraction (REQUIRED pattern)
const { name } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

describe("Auto-Grow Behavior", () => {
  beforeAll(() => {
    // CORRECT: Pass full definition object
    registerBehavior(definition, autoGrowBehaviorFactory);
  });

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should warn when attached to non-textarea element", async () => {
    const tag = "div";
    const webcomponentTag = "test-auto-grow-div";
    defineBehavioralHost(tag, webcomponentTag, observedAttributes);

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLElement;
    el.setAttribute("behavior", name);
    document.body.appendChild(el);

    await vi.waitFor(() => {
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("[AutoGrow] Behavior attached to non-textarea element: <div>"),
      );
    });
  });

  it("should not warn when attached to textarea element", async () => {
    const tag = "textarea";
    const webcomponentTag = "test-auto-grow-textarea";
    defineBehavioralHost(tag, webcomponentTag, observedAttributes);

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLTextAreaElement;
    el.setAttribute("behavior", name);
    document.body.appendChild(el);

    await vi.waitFor(() => {
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  it("should set overflow-y to hidden on connect", async () => {
    const tag = "textarea";
    const webcomponentTag = "test-auto-grow-overflow";
    defineBehavioralHost(tag, webcomponentTag, observedAttributes);

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLTextAreaElement;
    el.setAttribute("behavior", name);
    document.body.appendChild(el);

    await vi.waitFor(() => {
      expect(el.style.overflowY).toBe("hidden");
    });
  });

  it("should set resize to none on connect", async () => {
    const tag = "textarea";
    const webcomponentTag = "test-auto-grow-resize";
    defineBehavioralHost(tag, webcomponentTag, observedAttributes);

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLTextAreaElement;
    el.setAttribute("behavior", name);
    document.body.appendChild(el);

    await vi.waitFor(() => {
      expect(el.style.resize).toBe("none");
    });
  });

  it("should adjust height on input", async () => {
    const tag = "textarea";
    const webcomponentTag = "test-auto-grow-height";
    defineBehavioralHost(tag, webcomponentTag, observedAttributes);

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLTextAreaElement;
    el.setAttribute("behavior", name);
    document.body.appendChild(el);

    // Wait for initialization
    await vi.waitFor(() => {
      expect(el.style.overflowY).toBe("hidden");
    });

    // Simulate scrollHeight (jsdom doesn't compute layout)
    Object.defineProperty(el, "scrollHeight", {
      configurable: true,
      value: 150,
    });

    // Trigger input event
    el.value = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";
    el.dispatchEvent(new Event("input", { bubbles: true }));

    await vi.waitFor(() => {
      expect(el.style.height).toBe("150px");
    });
  });

  it("should set height to auto then scrollHeight on each input", async () => {
    const tag = "textarea";
    const webcomponentTag = "test-auto-grow-auto-height";
    defineBehavioralHost(tag, webcomponentTag, observedAttributes);

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLTextAreaElement;
    el.setAttribute("behavior", name);
    document.body.appendChild(el);

    // Wait for initialization
    await vi.waitFor(() => {
      expect(el.style.overflowY).toBe("hidden");
    });

    // Mock scrollHeight
    let scrollHeightValue = 100;
    Object.defineProperty(el, "scrollHeight", {
      configurable: true,
      get() {
        return scrollHeightValue;
      },
    });

    // First input
    el.value = "Short text";
    el.dispatchEvent(new Event("input", { bubbles: true }));

    await vi.waitFor(() => {
      expect(el.style.height).toBe("100px");
    });

    // Change scrollHeight and trigger another input
    scrollHeightValue = 200;
    el.value = "Much longer text\n".repeat(10);
    el.dispatchEvent(new Event("input", { bubbles: true }));

    await vi.waitFor(() => {
      expect(el.style.height).toBe("200px");
    });
  });

  it("should handle empty textarea", async () => {
    const tag = "textarea";
    const webcomponentTag = "test-auto-grow-empty";
    defineBehavioralHost(tag, webcomponentTag, observedAttributes);

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLTextAreaElement;
    el.setAttribute("behavior", name);
    document.body.appendChild(el);

    // Wait for initialization
    await vi.waitFor(() => {
      expect(el.style.overflowY).toBe("hidden");
    });

    // Mock minimal scrollHeight for empty textarea
    Object.defineProperty(el, "scrollHeight", {
      configurable: true,
      value: 40,
    });

    el.value = "";
    el.dispatchEvent(new Event("input", { bubbles: true }));

    await vi.waitFor(() => {
      expect(el.style.height).toBe("40px");
    });
  });
});
