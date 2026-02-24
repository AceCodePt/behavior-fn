/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import { defineBehavioralHost } from "../behavioral-host";
import { contentSetterBehaviorFactory } from "./behavior";
import { registerBehavior } from "~registry";
import { getObservedAttributes } from "~utils";
import definition from "./_behavior-definition";
import { CONTENT_SETTER_ATTRS } from "./schema";
import { dispatchCommand } from "../command-test-harness";

const { name } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

describe("Content Setter Behavior", () => {
  const tag = "div";
  const webcomponentTag = "test-content-setter-div";

  beforeAll(() => {
    registerBehavior(name, contentSetterBehaviorFactory);
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
      el.setAttribute(CONTENT_SETTER_ATTRS.ATTRIBUTE, "textContent");
      el.setAttribute(CONTENT_SETTER_ATTRS.VALUE, "Hello World!");
      el.textContent = "Original Text";
      document.body.appendChild(el);

      dispatchCommand(el, definition.command["--set-content"]);

      expect(el.textContent).toBe("Hello World!");
    });

    it("should set data attribute when attribute is attribute name", () => {
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      el.setAttribute("behavior", "content-setter");
      el.setAttribute(CONTENT_SETTER_ATTRS.ATTRIBUTE, "data-theme");
      el.setAttribute(CONTENT_SETTER_ATTRS.VALUE, "dark");
      document.body.appendChild(el);

      dispatchCommand(el, definition.command["--set-content"]);

      expect(el.getAttribute("data-theme")).toBe("dark");
    });

    it("should set ARIA attribute", () => {
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      el.setAttribute("behavior", "content-setter");
      el.setAttribute(CONTENT_SETTER_ATTRS.ATTRIBUTE, "aria-hidden");
      el.setAttribute(CONTENT_SETTER_ATTRS.VALUE, "true");
      document.body.appendChild(el);

      dispatchCommand(el, definition.command["--set-content"]);

      expect(el.getAttribute("aria-hidden")).toBe("true");
    });

    it("should work with explicit mode='set'", () => {
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      el.setAttribute("behavior", "content-setter");
      el.setAttribute(CONTENT_SETTER_ATTRS.ATTRIBUTE, "data-status");
      el.setAttribute(CONTENT_SETTER_ATTRS.VALUE, "active");
      el.setAttribute(CONTENT_SETTER_ATTRS.MODE, "set");
      document.body.appendChild(el);

      dispatchCommand(el, definition.command["--set-content"]);

      expect(el.getAttribute("data-status")).toBe("active");
    });
  });

  describe("Toggle Mode", () => {
    it("should toggle attribute value between value and empty string", () => {
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      el.setAttribute("behavior", "content-setter");
      el.setAttribute(CONTENT_SETTER_ATTRS.ATTRIBUTE, "data-active");
      el.setAttribute(CONTENT_SETTER_ATTRS.VALUE, "true");
      el.setAttribute(CONTENT_SETTER_ATTRS.MODE, "toggle");
      document.body.appendChild(el);

      // First toggle: should set to "true"
      dispatchCommand(el, definition.command["--set-content"]);
      expect(el.getAttribute("data-active")).toBe("true");

      // Second toggle: should set to empty string
      dispatchCommand(el, definition.command["--set-content"]);
      expect(el.getAttribute("data-active")).toBe("");

      // Third toggle: should set back to "true"
      dispatchCommand(el, definition.command["--set-content"]);
      expect(el.getAttribute("data-active")).toBe("true");
    });

    it("should toggle textContent between value and original text", () => {
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      el.setAttribute("behavior", "content-setter");
      el.setAttribute(CONTENT_SETTER_ATTRS.ATTRIBUTE, "textContent");
      el.setAttribute(CONTENT_SETTER_ATTRS.VALUE, "New Text");
      el.setAttribute(CONTENT_SETTER_ATTRS.MODE, "toggle");
      el.textContent = "Original Text";
      document.body.appendChild(el);

      // Store original text on first connection
      const originalText = el.textContent;

      // First toggle: should set to "New Text"
      dispatchCommand(el, definition.command["--set-content"]);
      expect(el.textContent).toBe("New Text");

      // Second toggle: should restore original
      dispatchCommand(el, definition.command["--set-content"]);
      expect(el.textContent).toBe(originalText);

      // Third toggle: should set to "New Text" again
      dispatchCommand(el, definition.command["--set-content"]);
      expect(el.textContent).toBe("New Text");
    });

    it("should start with value if attribute doesn't exist initially", () => {
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      el.setAttribute("behavior", "content-setter");
      el.setAttribute(CONTENT_SETTER_ATTRS.ATTRIBUTE, "data-new");
      el.setAttribute(CONTENT_SETTER_ATTRS.VALUE, "value");
      el.setAttribute(CONTENT_SETTER_ATTRS.MODE, "toggle");
      document.body.appendChild(el);

      // First toggle: should set to value
      dispatchCommand(el, definition.command["--set-content"]);
      expect(el.getAttribute("data-new")).toBe("value");

      // Second toggle: should clear
      dispatchCommand(el, definition.command["--set-content"]);
      expect(el.getAttribute("data-new")).toBe("");
    });
  });

  describe("Remove Mode", () => {
    it("should remove attribute in remove mode", () => {
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      el.setAttribute("behavior", "content-setter");
      el.setAttribute(CONTENT_SETTER_ATTRS.ATTRIBUTE, "data-temp");
      el.setAttribute(CONTENT_SETTER_ATTRS.VALUE, "");
      el.setAttribute(CONTENT_SETTER_ATTRS.MODE, "remove");
      el.setAttribute("data-temp", "temporary value");
      document.body.appendChild(el);

      expect(el.hasAttribute("data-temp")).toBe(true);

      dispatchCommand(el, definition.command["--set-content"]);

      expect(el.hasAttribute("data-temp")).toBe(false);
    });

    it("should not error if attribute doesn't exist when removing", () => {
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      el.setAttribute("behavior", "content-setter");
      el.setAttribute(CONTENT_SETTER_ATTRS.ATTRIBUTE, "data-nonexistent");
      el.setAttribute(CONTENT_SETTER_ATTRS.VALUE, "");
      el.setAttribute(CONTENT_SETTER_ATTRS.MODE, "remove");
      document.body.appendChild(el);

      expect(() => {
        dispatchCommand(el, definition.command["--set-content"]);
      }).not.toThrow();
    });

    it("should error when using remove mode with textContent", () => {
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      el.setAttribute("behavior", "content-setter");
      el.setAttribute(CONTENT_SETTER_ATTRS.ATTRIBUTE, "textContent");
      el.setAttribute(CONTENT_SETTER_ATTRS.VALUE, "");
      el.setAttribute(CONTENT_SETTER_ATTRS.MODE, "remove");
      el.textContent = "Original";
      document.body.appendChild(el);

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      dispatchCommand(el, definition.command["--set-content"]);

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
      el.setAttribute(CONTENT_SETTER_ATTRS.VALUE, "some value");
      document.body.appendChild(el);

      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      dispatchCommand(el, definition.command["--set-content"]);

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
      el.setAttribute(CONTENT_SETTER_ATTRS.ATTRIBUTE, "data-test");
      document.body.appendChild(el);

      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      dispatchCommand(el, definition.command["--set-content"]);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("content-setter-value"),
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
