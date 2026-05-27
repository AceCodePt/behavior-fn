/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { registerBehavior } from "~registry";
import { defineBehavioralHost } from "~host";
import { getObservedAttributes } from "~utils";
import { dispatchCommand, createBehavioralElement, createCommandSource } from "~test-utils";
import definition from "./_behavior-definition";
import { setValueBehaviorFactory } from "./behavior";

const { name, attributes, command } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

describe("Set-Value Behavior", () => {
  const TAG = "set-value-host";

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    
    registerBehavior(definition, setValueBehaviorFactory);
    defineBehavioralHost("input", TAG, observedAttributes);
  });

  it("should set input value from command-value (event.value)", () => {
    const el = createBehavioralElement("input", TAG, {
      behavior: name,
    });
    document.body.appendChild(el);

    const source = createCommandSource();

    dispatchCommand(el, command["set"], source, "Hello from command-value");

    expect(el.value).toBe("Hello from command-value");
  });

  it("should use empty string if no command-value", () => {
    const el = createBehavioralElement("input", TAG, {
      behavior: name,
    });
    el.value = "Initial Value";
    document.body.appendChild(el);

    const source = createCommandSource();
    source.textContent = "Button Text (should be ignored)";

    dispatchCommand(el, command["set"], source);

    expect(el.value).toBe("");
  });

  it("should dispatch input and change events after setting value", () => {
    const el = createBehavioralElement("input", TAG, {
      behavior: name,
    });
    document.body.appendChild(el);

    const inputHandler = vi.fn();
    const changeHandler = vi.fn();
    el.addEventListener("input", inputHandler);
    el.addEventListener("change", changeHandler);

    const source = createCommandSource();

    dispatchCommand(el, command["set"], source, "Test Value");

    expect(inputHandler).toHaveBeenCalled();
    expect(changeHandler).toHaveBeenCalled();
  });

  it("should submit parent form for set-and-submit command", () => {
    const form = document.createElement("form");
    const el = createBehavioralElement("input", TAG, {
      behavior: name,
    });
    form.appendChild(el);
    document.body.appendChild(form);

    const submitSpy = vi.spyOn(form, "requestSubmit").mockImplementation(() => {});
    
    const source = createCommandSource();

    dispatchCommand(el, command["set-and-submit"], source, "Submit Value");

    expect(el.value).toBe("Submit Value");
    expect(submitSpy).toHaveBeenCalled();
  });

  it("should reset input value to its attribute baseline", () => {
    const el = createBehavioralElement("input", TAG, {
      behavior: name,
      value: "initial",
    });
    document.body.appendChild(el);

    el.value = "changed";
    expect(el.value).toBe("changed");

    dispatchCommand(el, command["reset"]);

    expect(el.value).toBe("initial");
  });

  it("should set input value when button with command-value is clicked (integration)", () => {
    // Define behavioral host for button (command protocol is built into behavioral host)
    defineBehavioralHost("button", "button-test-host", []);

    // Create input with set-value behavior
    const input = createBehavioralElement("input", TAG, {
      behavior: name,
      id: "test-input",
    });
    document.body.appendChild(input);

    // Create button with command attributes (no behavior needed - command protocol is in host)
    const button = document.createElement("button", { is: "button-test-host" }) as HTMLButtonElement;
    button.setAttribute("commandfor", "test-input");
    button.setAttribute("command", "set");
    button.setAttribute("command-value", "Value from button click");
    document.body.appendChild(button);

    // Initially empty
    expect(input.value).toBe("");

    // Click the button
    button.click();

    // Input value should be set from command-value
    expect(input.value).toBe("Value from button click");
  });
});
