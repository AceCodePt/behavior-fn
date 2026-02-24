/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { enableAutoLoader } from "./auto-loader";
import { registerBehavior, type BehaviorFactory } from "./behavior-registry";
import { defineBehavioralHost } from "./behavioral-host";

describe("Auto-Loader", () => {
  let disconnect: (() => void) | undefined;
  let elementIdCounter = 0;
  
  /**
   * Helper to create an element with behavior and get the upgraded version.
   * Since auto-loader replaces elements, we need to re-query after creation.
   */
  function createElementWithBehavior<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    behaviorAttr: string,
    additionalAttrs: Record<string, string> = {}
  ): HTMLElementTagNameMap[K] {
    const id = `test-el-${elementIdCounter++}`;
    const element = document.createElement(tagName);
    element.setAttribute("behavior", behaviorAttr);
    element.setAttribute("id", id);
    
    // Add any additional attributes
    for (const [key, value] of Object.entries(additionalAttrs)) {
      element.setAttribute(key, value);
    }
    
    document.body.appendChild(element);
    
    // Return the element (will be replaced by auto-loader)
    // Caller should re-query after auto-loader processes
    return element;
  }
  
  function getUpgradedElement(id: string): HTMLElement | null {
    return document.getElementById(id);
  }

  // Mock behaviors for testing
  const mockRevealBehavior: BehaviorFactory = (el) => ({
    connectedCallback() {
      el.setAttribute("data-reveal-connected", "true");
    },
  });

  const mockLoggerBehavior: BehaviorFactory = (el) => ({
    connectedCallback() {
      el.setAttribute("data-logger-connected", "true");
    },
  });

  beforeEach(() => {
    // Clean up DOM
    document.body.innerHTML = "";

    // Register mock behaviors
    registerBehavior("reveal", mockRevealBehavior);
    registerBehavior("logger", mockLoggerBehavior);
  });

  afterEach(() => {
    // Clean up observer
    if (disconnect) {
      disconnect();
      disconnect = undefined;
    }
  });

  describe("Basic Functionality", () => {
    it("should properly upgrade elements with is attribute", () => {
      // NOTE: JSDOM doesn't support document.createElement(tag, { is: '...' })
      // So we can't test actual element replacement in the test environment.
      // This test verifies the end state is correct (implementation-agnostic).
      // In real browsers, elements ARE replaced. In tests, they're modified in-place.
      
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal");
      button.setAttribute("id", "test-upgrade");
      document.body.appendChild(button);
      
      // Enable auto-loader
      disconnect = enableAutoLoader();
      
      // Check end state: element should have is attribute and behavior should work
      const element = document.getElementById("test-upgrade");
      expect(element?.getAttribute("is")).toBe("behavioral-reveal");
      expect(element?.getAttribute("behavior")).toBe("reveal");
    });

    it("should add is attribute to elements with behavior attribute", () => {
      // Create element before enabling auto-loader
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal");
      button.setAttribute("id", "test-button");
      document.body.appendChild(button);

      // Enable auto-loader (replaces element)
      disconnect = enableAutoLoader();

      // Re-query to get the NEW upgraded element
      const upgradedButton = document.getElementById("test-button");
      
      // Check that is attribute was added to the new element
      expect(upgradedButton?.getAttribute("is")).toBe("behavioral-reveal");
      expect(upgradedButton?.getAttribute("behavior")).toBe("reveal");
    });

    it("should process elements added after enableAutoLoader()", async () => {
      // Enable auto-loader first
      disconnect = enableAutoLoader();

      // Create element after enabling
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal");
      button.setAttribute("id", "test-button-2");
      document.body.appendChild(button);

      // Wait for MutationObserver to process
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Re-query to get the upgraded element
      const upgradedButton = document.getElementById("test-button-2");
      
      // Check that is attribute was added
      expect(upgradedButton?.getAttribute("is")).toBe("behavioral-reveal");
    });

    it("should process multiple behaviors and sort them alphabetically", () => {
      const div = document.createElement("div");
      div.setAttribute("behavior", "reveal logger");
      div.setAttribute("id", "test-multi-behavior");
      document.body.appendChild(div);

      disconnect = enableAutoLoader();

      // Re-query to get upgraded element
      const upgraded = document.getElementById("test-multi-behavior");
      
      // Should sort to "logger reveal" -> "behavioral-logger-reveal"
      expect(upgraded?.getAttribute("is")).toBe("behavioral-logger-reveal");
    });

    it("should handle behaviors in different order consistently", () => {
      const div1 = document.createElement("div");
      div1.setAttribute("behavior", "reveal logger");
      div1.setAttribute("id", "test-order-1");
      document.body.appendChild(div1);

      const div2 = document.createElement("div");
      div2.setAttribute("behavior", "logger reveal");
      div2.setAttribute("id", "test-order-2");
      document.body.appendChild(div2);

      disconnect = enableAutoLoader();

      // Check end state: both should have the same is attribute (agnostic to how we got here)
      expect(document.getElementById("test-order-1")?.getAttribute("is")).toBe("behavioral-logger-reveal");
      expect(document.getElementById("test-order-2")?.getAttribute("is")).toBe("behavioral-logger-reveal");
    });
  });

  describe("Behavior-Based Host Pattern", () => {
    it("should use same behavioral host for different tag types with same behavior", () => {
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal");
      button.setAttribute("id", "test-button-host");
      document.body.appendChild(button);

      const dialog = document.createElement("dialog");
      dialog.setAttribute("behavior", "reveal");
      dialog.setAttribute("id", "test-dialog-host");
      document.body.appendChild(dialog);

      disconnect = enableAutoLoader();

      // Check end state: both should use the same behavioral host
      expect(document.getElementById("test-button-host")?.getAttribute("is")).toBe("behavioral-reveal");
      expect(document.getElementById("test-dialog-host")?.getAttribute("is")).toBe("behavioral-reveal");
    });

    it("should create different hosts for different behavior combinations", () => {
      const el1 = document.createElement("div");
      el1.setAttribute("behavior", "reveal");
      el1.setAttribute("id", "test-combo-1");
      document.body.appendChild(el1);

      const el2 = document.createElement("div");
      el2.setAttribute("behavior", "logger");
      el2.setAttribute("id", "test-combo-2");
      document.body.appendChild(el2);

      const el3 = document.createElement("div");
      el3.setAttribute("behavior", "reveal logger");
      el3.setAttribute("id", "test-combo-3");
      document.body.appendChild(el3);

      disconnect = enableAutoLoader();

      // Check end state
      expect(document.getElementById("test-combo-1")?.getAttribute("is")).toBe("behavioral-reveal");
      expect(document.getElementById("test-combo-2")?.getAttribute("is")).toBe("behavioral-logger");
      expect(document.getElementById("test-combo-3")?.getAttribute("is")).toBe("behavioral-logger-reveal");
    });
  });

  describe("Edge Cases", () => {
    it("should skip elements with existing is attribute", () => {
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal");
      button.setAttribute("is", "custom-button");
      document.body.appendChild(button);

      disconnect = enableAutoLoader();

      // Should keep the existing is attribute
      expect(button.getAttribute("is")).toBe("custom-button");
    });

    it("should handle empty behavior attribute", () => {
      const button = document.createElement("button");
      button.setAttribute("behavior", "");
      document.body.appendChild(button);

      disconnect = enableAutoLoader();

      // Should not add is attribute
      expect(button.hasAttribute("is")).toBe(false);
    });

    it("should handle whitespace-only behavior attribute", () => {
      const button = document.createElement("button");
      button.setAttribute("behavior", "   ");
      document.body.appendChild(button);

      disconnect = enableAutoLoader();

      // Should not add is attribute
      expect(button.hasAttribute("is")).toBe(false);
    });

    it("should handle unknown behaviors gracefully", () => {
      const button = document.createElement("button");
      button.setAttribute("behavior", "unknown-behavior");
      button.setAttribute("id", "test-unknown");
      document.body.appendChild(button);

      // Should not throw
      expect(() => {
        disconnect = enableAutoLoader();
      }).not.toThrow();

      // Check end state: should still add is attribute (even if behavior is unknown)
      expect(document.getElementById("test-unknown")?.getAttribute("is")).toBe("behavioral-unknown-behavior");
    });

    it("should handle mixed known and unknown behaviors", () => {
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal unknown-behavior");
      button.setAttribute("id", "test-mixed-unknown");
      document.body.appendChild(button);

      disconnect = enableAutoLoader();

      // Check end state: should add is attribute with sorted behaviors
      expect(document.getElementById("test-mixed-unknown")?.getAttribute("is")).toBe(
        "behavioral-reveal-unknown-behavior",
      );
    });

    it("should handle multiple spaces between behaviors", () => {
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal    logger");
      button.setAttribute("id", "test-spaces");
      document.body.appendChild(button);

      disconnect = enableAutoLoader();

      // Check end state
      expect(document.getElementById("test-spaces")?.getAttribute("is")).toBe("behavioral-logger-reveal");
    });

    it("should support comma-separated behaviors", () => {
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal, logger");
      button.setAttribute("id", "test-comma");
      document.body.appendChild(button);

      disconnect = enableAutoLoader();

      // Check end state
      expect(document.getElementById("test-comma")?.getAttribute("is")).toBe("behavioral-logger-reveal");
    });

    it("should handle hyphenated behavior names correctly", () => {
      // Register a mock hyphenated behavior
      registerBehavior("input-watcher", (el) => ({
        connectedCallback() {
          el.setAttribute("data-input-watcher-connected", "true");
        },
      }));

      const input = document.createElement("input");
      input.setAttribute("behavior", "input-watcher");
      input.setAttribute("id", "test-hyphen");
      document.body.appendChild(input);

      disconnect = enableAutoLoader();

      // Check end state
      expect(document.getElementById("test-hyphen")?.getAttribute("is")).toBe("behavioral-input-watcher");
    });

    it("should handle mixed comma and space separators", () => {
      const div = document.createElement("div");
      div.setAttribute("behavior", "reveal, logger input-watcher");
      div.setAttribute("id", "test-mixed-sep");
      document.body.appendChild(div);

      disconnect = enableAutoLoader();

      // Check end state: should sort to input-watcher, logger, reveal
      expect(document.getElementById("test-mixed-sep")?.getAttribute("is")).toBe(
        "behavioral-input-watcher-logger-reveal",
      );
    });

    it("should remove invalid characters from behavior names", () => {
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal123 logger456");
      button.setAttribute("id", "test-invalid-chars");
      document.body.appendChild(button);

      disconnect = enableAutoLoader();

      // Check end state: numbers should be removed, leaving "reveal logger"
      expect(document.getElementById("test-invalid-chars")?.getAttribute("is")).toBe("behavioral-logger-reveal");
    });

    it("should not process the same element multiple times", async () => {
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal");
      button.setAttribute("id", "test-no-reprocess");
      document.body.appendChild(button);

      disconnect = enableAutoLoader();

      // Check end state: get the initial is attribute
      const initialIs = document.getElementById("test-no-reprocess")?.getAttribute("is");
      expect(initialIs).toBe("behavioral-reveal");

      // Trigger a mutation by adding a different attribute
      document.getElementById("test-no-reprocess")?.setAttribute("data-test", "value");

      // Wait for MutationObserver
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Check end state: should still have the same is attribute
      expect(document.getElementById("test-no-reprocess")?.getAttribute("is")).toBe(initialIs);
    });

    it("should not update is attribute when behavior changes (Custom Elements limitation)", async () => {
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal");
      button.setAttribute("id", "test-no-update");
      document.body.appendChild(button);

      disconnect = enableAutoLoader();

      // Check end state
      expect(document.getElementById("test-no-update")?.getAttribute("is")).toBe("behavioral-reveal");

      // Change the behavior attribute
      document.getElementById("test-no-update")?.setAttribute("behavior", "logger");

      // Wait for MutationObserver
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Check end state: should NOT update the is attribute (Custom Elements can't be re-upgraded)
      // This is a fundamental limitation of the Custom Elements spec
      expect(document.getElementById("test-no-update")?.getAttribute("is")).toBe("behavioral-reveal");
    });
  });

  describe("Cleanup", () => {
    it("should stop observing when disconnect is called", async () => {
      disconnect = enableAutoLoader();

      // Disconnect immediately
      disconnect();
      disconnect = undefined;

      // Add element after disconnecting
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal");
      document.body.appendChild(button);

      // Wait for MutationObserver (which should not fire)
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should not have is attribute
      expect(button.hasAttribute("is")).toBe(false);
    });

    it("should allow re-enabling after disconnect", async () => {
      disconnect = enableAutoLoader();
      disconnect();

      // Re-enable
      disconnect = enableAutoLoader();

      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal");
      button.setAttribute("id", "test-re-enable");
      document.body.appendChild(button);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Check end state
      expect(document.getElementById("test-re-enable")?.getAttribute("is")).toBe("behavioral-reveal");
    });
  });

  describe("Nested Elements", () => {
    it("should process nested elements with behavior attributes", () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <div behavior="reveal" id="test-nested-div">
          <button behavior="logger" id="test-nested-button">Click</button>
        </div>
      `;
      document.body.appendChild(container);

      disconnect = enableAutoLoader();

      // Check end state: query by ID to get upgraded elements
      expect(document.getElementById("test-nested-div")?.getAttribute("is")).toBe("behavioral-reveal");
      expect(document.getElementById("test-nested-button")?.getAttribute("is")).toBe("behavioral-logger");
    });

    it("should process elements added in a subtree", async () => {
      disconnect = enableAutoLoader();

      const container = document.createElement("div");
      container.innerHTML = `
        <div behavior="reveal" id="test-subtree-div">
          <button behavior="logger" id="test-subtree-button">Click</button>
        </div>
      `;
      document.body.appendChild(container);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Check end state: query by ID
      expect(document.getElementById("test-subtree-div")?.getAttribute("is")).toBe("behavioral-reveal");
      expect(document.getElementById("test-subtree-button")?.getAttribute("is")).toBe("behavioral-logger");
    });
  });

  describe("Integration with defineBehavioralHost", () => {
    it("should not re-register already registered behavioral hosts", () => {
      // Pre-register a behavioral host
      defineBehavioralHost("button", "behavioral-reveal");

      // Add element with same behavior
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal");
      button.setAttribute("id", "test-no-re-register");
      document.body.appendChild(button);

      // Should not throw when trying to register again
      expect(() => {
        disconnect = enableAutoLoader();
      }).not.toThrow();

      // Check end state
      expect(document.getElementById("test-no-re-register")?.getAttribute("is")).toBe("behavioral-reveal");
    });
  });
});
