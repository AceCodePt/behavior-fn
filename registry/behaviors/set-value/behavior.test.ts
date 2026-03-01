/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from "vitest";
import { defineBehavioralHost } from "~host";
import { setValueBehaviorFactory } from "./behavior";
import { registerBehavior } from "~registry";
import { getObservedAttributes } from "~utils";
import { dispatchCommand, createCommandSource } from "~test-utils";
import definition from "./_behavior-definition";

// Module-level extraction (REQUIRED pattern)
const { name, command } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

describe("Set-Value Behavior", () => {
  beforeAll(() => {
    // CORRECT: Pass full definition object
    registerBehavior(definition, setValueBehaviorFactory);
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Element Type Validation", () => {
    it("should throw error when factory called with non-form element (div)", () => {
      const el = document.createElement("div");
      
      // Directly test the factory function
      expect(() => {
        setValueBehaviorFactory(el);
      }).toThrow(/The behavior "set-value" is limited to input, textarea, and select elements/);
    });

    it("should throw error when factory called with non-form element (button)", () => {
      const el = document.createElement("button");
      
      expect(() => {
        setValueBehaviorFactory(el);
      }).toThrow(/The behavior "set-value" is limited to input, textarea, and select elements/);
    });

    it("should not throw when attached to input element", async () => {
      const tag = "input";
      const webcomponentTag = "test-set-value-input";
      defineBehavioralHost(tag, webcomponentTag, observedAttributes);

      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLInputElement;
      el.setAttribute("behavior", name);
      
      // Should not throw
      expect(() => {
        document.body.appendChild(el);
      }).not.toThrow();
    });

    it("should not throw when attached to textarea element", async () => {
      const tag = "textarea";
      const webcomponentTag = "test-set-value-textarea";
      defineBehavioralHost(tag, webcomponentTag, observedAttributes);

      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLTextAreaElement;
      el.setAttribute("behavior", name);
      
      expect(() => {
        document.body.appendChild(el);
      }).not.toThrow();
    });

    it("should not throw when attached to select element", async () => {
      const tag = "select";
      const webcomponentTag = "test-set-value-select";
      defineBehavioralHost(tag, webcomponentTag, observedAttributes);

      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLSelectElement;
      el.setAttribute("behavior", name);
      
      expect(() => {
        document.body.appendChild(el);
      }).not.toThrow();
    });
  });

  describe("--set-value Command", () => {
    it("should set input value from command source innerText", async () => {
      const tag = "input";
      const webcomponentTag = "test-set-value-basic";
      defineBehavioralHost(tag, webcomponentTag, observedAttributes);

      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLInputElement;
      el.setAttribute("behavior", name);
      document.body.appendChild(el);

      // Create command source with innerText
      const source = createCommandSource();
      source.innerText = "Hello World";

      // Dispatch command
      dispatchCommand(el, command!["--set-value"], source);

      expect(el.value).toBe("Hello World");
    });

    it("should dispatch input event after setting value", async () => {
      const tag = "input";
      const webcomponentTag = "test-set-value-input-event";
      defineBehavioralHost(tag, webcomponentTag, observedAttributes);

      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLInputElement;
      el.setAttribute("behavior", name);
      document.body.appendChild(el);

      const inputHandler = vi.fn();
      el.addEventListener("input", inputHandler);

      const source = createCommandSource();
      source.innerText = "Test Value";

      dispatchCommand(el, command!["--set-value"], source);

      expect(inputHandler).toHaveBeenCalledTimes(1);
      expect(inputHandler.mock.calls[0][0]).toBeInstanceOf(Event);
      expect((inputHandler.mock.calls[0][0] as Event).bubbles).toBe(true);
    });

    it("should dispatch change event after setting value", async () => {
      const tag = "input";
      const webcomponentTag = "test-set-value-change-event";
      defineBehavioralHost(tag, webcomponentTag, observedAttributes);

      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLInputElement;
      el.setAttribute("behavior", name);
      document.body.appendChild(el);

      const changeHandler = vi.fn();
      el.addEventListener("change", changeHandler);

      const source = createCommandSource();
      source.innerText = "Changed Value";

      dispatchCommand(el, command!["--set-value"], source);

      expect(changeHandler).toHaveBeenCalledTimes(1);
      expect(changeHandler.mock.calls[0][0]).toBeInstanceOf(Event);
      expect((changeHandler.mock.calls[0][0] as Event).bubbles).toBe(true);
    });

    it("should work with textarea elements", async () => {
      const tag = "textarea";
      const webcomponentTag = "test-set-value-textarea-cmd";
      defineBehavioralHost(tag, webcomponentTag, observedAttributes);

      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLTextAreaElement;
      el.setAttribute("behavior", name);
      document.body.appendChild(el);

      const source = createCommandSource();
      source.innerText = "Multi\nline\ntext";

      dispatchCommand(el, command!["--set-value"], source);

      expect(el.value).toBe("Multi\nline\ntext");
    });

    it("should work with select elements", async () => {
      const tag = "select";
      const webcomponentTag = "test-set-value-select-cmd";
      defineBehavioralHost(tag, webcomponentTag, observedAttributes);

      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLSelectElement;
      el.innerHTML = `
        <option value="opt1">Option 1</option>
        <option value="opt2">Option 2</option>
      `;
      el.setAttribute("behavior", name);
      document.body.appendChild(el);

      const source = createCommandSource();
      source.innerText = "opt2";

      dispatchCommand(el, command!["--set-value"], source);

      expect(el.value).toBe("opt2");
    });

    it("should overwrite existing value", async () => {
      const tag = "input";
      const webcomponentTag = "test-set-value-overwrite";
      defineBehavioralHost(tag, webcomponentTag, observedAttributes);

      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLInputElement;
      el.setAttribute("behavior", name);
      el.value = "Old Value";
      document.body.appendChild(el);

      const source = createCommandSource();
      source.innerText = "New Value";

      dispatchCommand(el, command!["--set-value"], source);

      expect(el.value).toBe("New Value");
    });
  });

  describe("--set-value-and-submit Command", () => {
    it("should set value and submit parent form", async () => {
      const tag = "input";
      const webcomponentTag = "test-set-value-submit";
      defineBehavioralHost(tag, webcomponentTag, observedAttributes);

      const form = document.createElement("form");
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLInputElement;
      el.setAttribute("behavior", name);
      form.appendChild(el);
      document.body.appendChild(form);

      const submitHandler = vi.fn((e) => e.preventDefault());
      form.addEventListener("submit", submitHandler);

      const source = createCommandSource();
      source.innerText = "Submit Value";

      dispatchCommand(el, command!["--set-value-and-submit"], source);

      expect(el.value).toBe("Submit Value");
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });

    it("should use requestSubmit() not submit()", async () => {
      const tag = "input";
      const webcomponentTag = "test-set-value-request-submit";
      defineBehavioralHost(tag, webcomponentTag, observedAttributes);

      const form = document.createElement("form");
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLInputElement;
      el.setAttribute("behavior", name);
      form.appendChild(el);
      document.body.appendChild(form);

      // Mock requestSubmit to verify it's called
      const requestSubmitSpy = vi.spyOn(form, "requestSubmit");
      const submitHandler = vi.fn((e) => e.preventDefault());
      form.addEventListener("submit", submitHandler);

      const source = createCommandSource();
      source.innerText = "Test";

      dispatchCommand(el, command!["--set-value-and-submit"], source);

      expect(requestSubmitSpy).toHaveBeenCalledTimes(1);
    });

    it("should not throw when element has no parent form", async () => {
      const tag = "input";
      const webcomponentTag = "test-set-value-no-form";
      defineBehavioralHost(tag, webcomponentTag, observedAttributes);

      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLInputElement;
      el.setAttribute("behavior", name);
      document.body.appendChild(el);

      const source = createCommandSource();
      source.innerText = "No Form Value";

      // Should not throw
      expect(() => {
        dispatchCommand(el, command!["--set-value-and-submit"], source);
      }).not.toThrow();

      expect(el.value).toBe("No Form Value");
    });

    it("should dispatch input and change events before submit", async () => {
      const tag = "input";
      const webcomponentTag = "test-set-value-events-before-submit";
      defineBehavioralHost(tag, webcomponentTag, observedAttributes);

      const form = document.createElement("form");
      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLInputElement;
      el.setAttribute("behavior", name);
      form.appendChild(el);
      document.body.appendChild(form);

      const eventOrder: string[] = [];

      el.addEventListener("input", () => eventOrder.push("input"));
      el.addEventListener("change", () => eventOrder.push("change"));
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        eventOrder.push("submit");
      });

      const source = createCommandSource();
      source.innerText = "Event Order Test";

      dispatchCommand(el, command!["--set-value-and-submit"], source);

      expect(eventOrder).toEqual(["input", "change", "submit"]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty innerText", async () => {
      const tag = "input";
      const webcomponentTag = "test-set-value-empty";
      defineBehavioralHost(tag, webcomponentTag, observedAttributes);

      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLInputElement;
      el.setAttribute("behavior", name);
      el.value = "Initial";
      document.body.appendChild(el);

      const source = createCommandSource();
      source.innerText = "";

      dispatchCommand(el, command!["--set-value"], source);

      expect(el.value).toBe("");
    });

    it("should handle innerText with whitespace", async () => {
      const tag = "input";
      const webcomponentTag = "test-set-value-whitespace";
      defineBehavioralHost(tag, webcomponentTag, observedAttributes);

      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLInputElement;
      el.setAttribute("behavior", name);
      document.body.appendChild(el);

      const source = createCommandSource();
      source.innerText = "  Padded Text  ";

      dispatchCommand(el, command!["--set-value"], source);

      expect(el.value).toBe("  Padded Text  ");
    });

    it("should ignore unrelated command", async () => {
      const tag = "input";
      const webcomponentTag = "test-set-value-ignore";
      defineBehavioralHost(tag, webcomponentTag, observedAttributes);

      const el = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLInputElement;
      el.setAttribute("behavior", name);
      el.value = "Original";
      document.body.appendChild(el);

      const source = createCommandSource();
      source.innerText = "Should Not Set";

      dispatchCommand(el, "--unrelated-command", source);

      expect(el.value).toBe("Original");
    });
  });
});
