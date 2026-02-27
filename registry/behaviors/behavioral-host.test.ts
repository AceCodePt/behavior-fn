/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { withBehaviors } from "./behavioral-host";
import { registerBehavior, type BehaviorInstance, type CommandEvent } from "~registry";

describe("Behavioral Host", () => {
  const behaviorName = "mock-behavior";

  const mockBehavior = {
    connectedCallback: vi.fn(),
    disconnectedCallback: vi.fn(),
    attributeChangedCallback: vi.fn(),
    onClick: vi.fn(),
    onCommand: vi.fn(),
  };

  class TestBase extends HTMLElement {
    onClick(e: MouseEvent) {
      // Base implementation
    }
    onCommand(e: CommandEvent<string>) {
      // Base implementation
    }
    attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ) {
      // Base implementation
    }
  }

  // Register behavior once
  beforeAll(() => {
    registerBehavior(behaviorName, () => mockBehavior);
  });

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it('should instantiate behavior when "behavior" attribute is present', async () => {
    const HostClass = withBehaviors(TestBase);
    customElements.define("test-host-instantiate", HostClass);
    const el = new HostClass();
    el.setAttribute("behavior", behaviorName);
    document.body.appendChild(el);

    // Give time for promises to resolve
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockBehavior.connectedCallback).toHaveBeenCalled();
  });

  it("should delegate click events to behavior", async () => {
    const HostClass = withBehaviors(TestBase);
    customElements.define("test-host-click", HostClass);
    const el = new HostClass();
    el.setAttribute("behavior", behaviorName);
    document.body.appendChild(el);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockBehavior.connectedCallback).toHaveBeenCalled();

    // Call the method directly (simulating auto-wc or manual call)
    // Note: Since we don't use auto-wc here, we manually call onClick
    // The test verifies that withBehaviors intercepts this call.
    const clickEvent = new MouseEvent("click");
    el.dispatchEvent(clickEvent);

    expect(mockBehavior.onClick).toHaveBeenCalled();
  });

  it("should delegate attribute changes to behavior", async () => {
    const HostClass = withBehaviors(TestBase);
    customElements.define("test-host-attr", HostClass);
    const el = new HostClass();
    el.setAttribute("behavior", behaviorName);
    document.body.appendChild(el);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockBehavior.connectedCallback).toHaveBeenCalled();

    el.setAttribute("data-test", "value");

    // We need to wait for MutationObserver or manual callback
    // withBehaviors overrides attributeChangedCallback
    el.attributeChangedCallback("data-test", null, "value");

    expect(mockBehavior.attributeChangedCallback).toHaveBeenCalledWith(
      "data-test",
      null,
      "value",
    );
  });

  it("should handle behavior removal", async () => {
    const HostClass = withBehaviors(TestBase);
    customElements.define("test-host-remove", HostClass);
    const el = new HostClass();
    el.setAttribute("behavior", behaviorName);
    document.body.appendChild(el);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockBehavior.connectedCallback).toHaveBeenCalled();

    el.remove();
    el.disconnectedCallback(); // Manually call if needed, but remove() triggers it

    // disconnectedCallback might be async in the mixin due to _ensured?
    // The code says: this._ensured(() => { ... })
    // _ensured executes immediately if didEnsure is true.

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockBehavior.disconnectedCallback).toHaveBeenCalled();
  });

  it("should delegate command events", async () => {
    const HostClass = withBehaviors(TestBase);
    customElements.define("test-host-command", HostClass);
    const el = new HostClass();
    el.setAttribute("behavior", behaviorName);
    document.body.appendChild(el);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockBehavior.connectedCallback).toHaveBeenCalled();

    const commandEvent = new CustomEvent("command", {
      bubbles: true,
      detail: { command: "test" },
    });
    // @ts-ignore
    commandEvent.command = "test";
    // @ts-ignore
    commandEvent.source = document.createElement("button");

    el.dispatchEvent(commandEvent);

    expect(mockBehavior.onCommand).toHaveBeenCalled();
  });
});

