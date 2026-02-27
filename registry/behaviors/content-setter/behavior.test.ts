/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import { defineBehavioralHost } from "../behavioral-host";
import { contentSetterBehaviorFactory } from "./behavior";
import { registerBehavior } from "~registry";
import { getObservedAttributes } from "~utils";
import definition from "./_behavior-definition";
import { dispatchCommand } from "../command-test-harness";

const { name, attributes, commands: command } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

describe("Content Setter Behavior", () => {
  const tag = "div";
  const webcomponentTag = "test-content-setter-div";

  beforeAll(() => {
    registerBehavior(definition, contentSetterBehaviorFactory);
    defineBehavioralHost(tag, webcomponentTag, observedAttributes);
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("Set Mode (default)", () => {
    it("should set textContent when attribute is 'textContent'", () => {
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      el.setAttribute("behavior", "content-setter");
      el.setAttribute(attributes["content-setter-attribute"], "textContent");
      el.setAttribute(attributes["content-setter-value"], "Hello World!");
      el.textContent = "Original Text";
      document.body.appendChild(el);

      dispatchCommand(el, command["--set-content"]);

      expect(el.textContent).toBe("Hello World!");
    });

    it("should set data attribute when attribute is attribute name", () => {
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      el.setAttribute("behavior", "content-setter");
      el.setAttribute(attributes["content-setter-attribute"], "data-theme");
      el.setAttribute(attributes["content-setter-value"], "dark");
      document.body.appendChild(el);

      dispatchCommand(el, command["--set-content"]);

      expect(el.getAttribute("data-theme")).toBe("dark");
    });

    it("should set ARIA attribute", () => {
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      el.setAttribute("behavior", "content-setter");
      el.setAttribute(attributes["content-setter-attribute"], "aria-hidden");
      el.setAttribute(attributes["content-setter-value"], "true");
      document.body.appendChild(el);

      dispatchCommand(el, command["--set-content"]);

      expect(el.getAttribute("aria-hidden")).toBe("true");
    });

    it("should work with explicit mode='set'", () => {
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      el.setAttribute("behavior", "content-setter");
      el.setAttribute(attributes["content-setter-attribute"], "data-status");
      el.setAttribute(attributes["content-setter-value"], "active");
      el.setAttribute(attributes["content-setter-mode"], "set");
      document.body.appendChild(el);

      dispatchCommand(el, command["--set-content"]);

      expect(el.getAttribute("data-status")).toBe("active");
    });
  });

  describe("Toggle Mode", () => {
    it("should toggle attribute value between value and empty string", () => {
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      el.setAttribute("behavior", "content-setter");
      el.setAttribute(attributes["content-setter-attribute"], "data-active");
      el.setAttribute(attributes["content-setter-value"], "true");
      el.setAttribute(attributes["content-setter-mode"], "toggle");
      document.body.appendChild(el);

      // First toggle: should set to "true"
      dispatchCommand(el, command["--set-content"]);
      expect(el.getAttribute("data-active")).toBe("true");

      // Second toggle: should set to empty string
      dispatchCommand(el, command["--set-content"]);
      expect(el.getAttribute("data-active")).toBe("");

      // Third toggle: should set back to "true"
      dispatchCommand(el, command["--set-content"]);
      expect(el.getAttribute("data-active")).toBe("true");
    });

    it("should toggle textContent between value and original text", () => {
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      el.setAttribute("behavior", "content-setter");
      el.setAttribute(attributes["content-setter-attribute"], "textContent");
      el.setAttribute(attributes["content-setter-value"], "New Text");
      el.setAttribute(attributes["content-setter-mode"], "toggle");
      el.textContent = "Original Text";
      document.body.appendChild(el);

      // Store original text on first connection
      const originalText = el.textContent;

      // First toggle: should set to "New Text"
      dispatchCommand(el, command["--set-content"]);
      expect(el.textContent).toBe("New Text");

      // Second toggle: should restore original
      dispatchCommand(el, command["--set-content"]);
      expect(el.textContent).toBe(originalText);

      // Third toggle: should set to "New Text" again
      dispatchCommand(el, command["--set-content"]);
      expect(el.textContent).toBe("New Text");
    });

    it("should start with value if attribute doesn't exist initially", () => {
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      el.setAttribute("behavior", "content-setter");
      el.setAttribute(attributes["content-setter-attribute"], "data-new");
      el.setAttribute(attributes["content-setter-value"], "value");
      el.setAttribute(attributes["content-setter-mode"], "toggle");
      document.body.appendChild(el);

      // First toggle: should set to value
      dispatchCommand(el, command["--set-content"]);
      expect(el.getAttribute("data-new")).toBe("value");

      // Second toggle: should clear
      dispatchCommand(el, command["--set-content"]);
      expect(el.getAttribute("data-new")).toBe("");
    });
  });

  describe("Remove Mode", () => {
    it("should remove attribute in remove mode", () => {
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      el.setAttribute("behavior", "content-setter");
      el.setAttribute(attributes["content-setter-attribute"], "data-temp");
      el.setAttribute(attributes["content-setter-value"], "");
      el.setAttribute(attributes["content-setter-mode"], "remove");
      el.setAttribute("data-temp", "temporary value");
      document.body.appendChild(el);

      expect(el.hasAttribute("data-temp")).toBe(true);

      dispatchCommand(el, command["--set-content"]);

      expect(el.hasAttribute("data-temp")).toBe(false);
    });

    it("should not error if attribute doesn't exist when removing", () => {
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      el.setAttribute("behavior", "content-setter");
      el.setAttribute(attributes["content-setter-attribute"], "data-nonexistent");
      el.setAttribute(attributes["content-setter-value"], "");
      el.setAttribute(attributes["content-setter-mode"], "remove");
      document.body.appendChild(el);

      expect(() => {
        dispatchCommand(el, command["--set-content"]);
      }).not.toThrow();
    });

    it("should error when using remove mode with textContent", () => {
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      el.setAttribute("behavior", "content-setter");
      el.setAttribute(attributes["content-setter-attribute"], "textContent");
      el.setAttribute(attributes["content-setter-value"], "");
      el.setAttribute(attributes["content-setter-mode"], "remove");
      el.textContent = "Original";
      document.body.appendChild(el);

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      dispatchCommand(el, command["--set-content"]);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Cannot use 'remove' mode with textContent"),
      );

      // Verify textContent wasn't changed
      expect(el.textContent).toBe("Original");

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Error Handling", () => {
    it("should warn if content-setter-attribute is missing", () => {
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      el.setAttribute("behavior", "content-setter");
      el.setAttribute(attributes["content-setter-value"], "some value");
      document.body.appendChild(el);

      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      dispatchCommand(el, command["--set-content"]);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("content-setter-attribute"),
      );

      consoleWarnSpy.mockRestore();
    });

    it("should warn if content-setter-value is missing", () => {
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      el.setAttribute("behavior", "content-setter");
      el.setAttribute(attributes["content-setter-attribute"], "data-test");
      document.body.appendChild(el);

      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      dispatchCommand(el, command["--set-content"]);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("content-setter-value"),
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
