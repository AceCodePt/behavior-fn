/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { enableAutoLoader } from "./auto-loader";
import { registerBehavior, type BehaviorFactory } from "./behavior-registry";
import { defineBehavioralHost } from "./behavioral-host";

describe("Auto-Loader", () => {
  let disconnect: (() => void) | undefined;

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
    it("should add is attribute to elements with behavior attribute", () => {
      // Create element before enabling auto-loader
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal");
      document.body.appendChild(button);

      // Enable auto-loader
      disconnect = enableAutoLoader();

      // Check that is attribute was added
      expect(button.getAttribute("is")).toBe("behavioral-reveal");
    });

    it("should process elements added after enableAutoLoader()", async () => {
      // Enable auto-loader first
      disconnect = enableAutoLoader();

      // Create element after enabling
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal");
      document.body.appendChild(button);

      // Wait for MutationObserver to process
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Check that is attribute was added
      expect(button.getAttribute("is")).toBe("behavioral-reveal");
    });

    it("should process multiple behaviors and sort them alphabetically", () => {
      const div = document.createElement("div");
      div.setAttribute("behavior", "reveal logger");
      document.body.appendChild(div);

      disconnect = enableAutoLoader();

      // Should sort to "logger reveal" -> "behavioral-logger-reveal"
      expect(div.getAttribute("is")).toBe("behavioral-logger-reveal");
    });

    it("should handle behaviors in different order consistently", () => {
      const div1 = document.createElement("div");
      div1.setAttribute("behavior", "reveal logger");
      document.body.appendChild(div1);

      const div2 = document.createElement("div");
      div2.setAttribute("behavior", "logger reveal");
      document.body.appendChild(div2);

      disconnect = enableAutoLoader();

      // Both should have the same is attribute
      expect(div1.getAttribute("is")).toBe("behavioral-logger-reveal");
      expect(div2.getAttribute("is")).toBe("behavioral-logger-reveal");
    });
  });

  describe("Behavior-Based Host Pattern", () => {
    it("should use same behavioral host for different tag types with same behavior", () => {
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal");
      document.body.appendChild(button);

      const dialog = document.createElement("dialog");
      dialog.setAttribute("behavior", "reveal");
      document.body.appendChild(dialog);

      disconnect = enableAutoLoader();

      // Both should use the same behavioral host
      expect(button.getAttribute("is")).toBe("behavioral-reveal");
      expect(dialog.getAttribute("is")).toBe("behavioral-reveal");
    });

    it("should create different hosts for different behavior combinations", () => {
      const el1 = document.createElement("div");
      el1.setAttribute("behavior", "reveal");
      document.body.appendChild(el1);

      const el2 = document.createElement("div");
      el2.setAttribute("behavior", "logger");
      document.body.appendChild(el2);

      const el3 = document.createElement("div");
      el3.setAttribute("behavior", "reveal logger");
      document.body.appendChild(el3);

      disconnect = enableAutoLoader();

      expect(el1.getAttribute("is")).toBe("behavioral-reveal");
      expect(el2.getAttribute("is")).toBe("behavioral-logger");
      expect(el3.getAttribute("is")).toBe("behavioral-logger-reveal");
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
      document.body.appendChild(button);

      // Should not throw
      expect(() => {
        disconnect = enableAutoLoader();
      }).not.toThrow();

      // Should still add is attribute (even if behavior is unknown)
      expect(button.getAttribute("is")).toBe("behavioral-unknown-behavior");
    });

    it("should handle mixed known and unknown behaviors", () => {
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal unknown-behavior");
      document.body.appendChild(button);

      disconnect = enableAutoLoader();

      // Should add is attribute with sorted behaviors
      expect(button.getAttribute("is")).toBe(
        "behavioral-reveal-unknown-behavior",
      );
    });

    it("should handle multiple spaces between behaviors", () => {
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal    logger");
      document.body.appendChild(button);

      disconnect = enableAutoLoader();

      expect(button.getAttribute("is")).toBe("behavioral-logger-reveal");
    });

    it("should support comma-separated behaviors", () => {
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal, logger");
      document.body.appendChild(button);

      disconnect = enableAutoLoader();

      expect(button.getAttribute("is")).toBe("behavioral-logger-reveal");
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
      document.body.appendChild(input);

      disconnect = enableAutoLoader();

      expect(input.getAttribute("is")).toBe("behavioral-input-watcher");
    });

    it("should handle mixed comma and space separators", () => {
      const div = document.createElement("div");
      div.setAttribute("behavior", "reveal, logger input-watcher");
      document.body.appendChild(div);

      disconnect = enableAutoLoader();

      // Should sort to: input-watcher, logger, reveal
      expect(div.getAttribute("is")).toBe(
        "behavioral-input-watcher-logger-reveal",
      );
    });

    it("should remove invalid characters from behavior names", () => {
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal123!@# logger456");
      document.body.appendChild(button);

      disconnect = enableAutoLoader();

      // Numbers and special chars should be removed, leaving "reveal logger"
      expect(button.getAttribute("is")).toBe("behavioral-logger-reveal");
    });

    it("should not process the same element multiple times", async () => {
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal");
      document.body.appendChild(button);

      disconnect = enableAutoLoader();

      // Get the initial is attribute
      const initialIs = button.getAttribute("is");
      expect(initialIs).toBe("behavioral-reveal");

      // Trigger a mutation by adding a different attribute
      button.setAttribute("data-test", "value");

      // Wait for MutationObserver
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should still have the same is attribute
      expect(button.getAttribute("is")).toBe(initialIs);
    });

    it("should not update is attribute when behavior changes (Custom Elements limitation)", async () => {
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal");
      document.body.appendChild(button);

      disconnect = enableAutoLoader();

      expect(button.getAttribute("is")).toBe("behavioral-reveal");

      // Change the behavior attribute
      button.setAttribute("behavior", "logger");

      // Wait for MutationObserver
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should NOT update the is attribute (Custom Elements can't be re-upgraded)
      // This is a fundamental limitation of the Custom Elements spec
      expect(button.getAttribute("is")).toBe("behavioral-reveal");
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
      document.body.appendChild(button);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(button.getAttribute("is")).toBe("behavioral-reveal");
    });
  });

  describe("Nested Elements", () => {
    it("should process nested elements with behavior attributes", () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <div behavior="reveal">
          <button behavior="logger">Click</button>
        </div>
      `;
      document.body.appendChild(container);

      disconnect = enableAutoLoader();

      const div = container.querySelector("div");
      const button = container.querySelector("button");

      expect(div?.getAttribute("is")).toBe("behavioral-reveal");
      expect(button?.getAttribute("is")).toBe("behavioral-logger");
    });

    it("should process elements added in a subtree", async () => {
      disconnect = enableAutoLoader();

      const container = document.createElement("div");
      container.innerHTML = `
        <div behavior="reveal">
          <button behavior="logger">Click</button>
        </div>
      `;
      document.body.appendChild(container);

      await new Promise((resolve) => setTimeout(resolve, 0));

      const div = container.querySelector("div");
      const button = container.querySelector("button");

      expect(div?.getAttribute("is")).toBe("behavioral-reveal");
      expect(button?.getAttribute("is")).toBe("behavioral-logger");
    });
  });

  describe("Integration with defineBehavioralHost", () => {
    it("should not re-register already registered behavioral hosts", () => {
      // Pre-register a behavioral host
      defineBehavioralHost("button", "behavioral-reveal");

      // Add element with same behavior
      const button = document.createElement("button");
      button.setAttribute("behavior", "reveal");
      document.body.appendChild(button);

      // Should not throw when trying to register again
      expect(() => {
        disconnect = enableAutoLoader();
      }).not.toThrow();

      expect(button.getAttribute("is")).toBe("behavioral-reveal");
    });
  });
});
