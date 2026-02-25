/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, beforeAll, afterEach } from "vitest";
import { defineBehavioralHost } from "../behavioral-host";
import { inputWatcherBehavior } from "./behavior";
import { registerBehavior } from "~registry";
import { getObservedAttributes } from "~utils";
import definition from "./_behavior-definition";

const { name, schema, attributes } = definition;
const observedAttributes = getObservedAttributes(schema);

describe("Input Watcher Behavior", () => {
  const tag = "div";
  const webcomponentTag = "test-input-watcher";

  beforeAll(() => {
    try {
      registerBehavior(name, inputWatcherBehavior);
    } catch (e) {
      // ignore
    }
    // Define the custom element once
    defineBehavioralHost(tag, webcomponentTag, observedAttributes);
  });

  let host: HTMLElement;
  let input: HTMLInputElement;

  beforeEach(() => {
    document.body.innerHTML = "";

    // Create input
    input = document.createElement("input");
    input.id = "test-input";
    document.body.appendChild(input);

    // Create host
    host = document.createElement(tag, { is: webcomponentTag });
    host.setAttribute("behavior", "input-watcher");
    document.body.appendChild(host);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should update host text content when input changes", async () => {
    host.setAttribute(attributes["input-watcher-target"], "#test-input");

    // Wait for microtasks (behavior attachment)
    await new Promise((resolve) => setTimeout(resolve, 0));

    input.value = "Hello";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(host.textContent).toBe("Hello");
  });

  it("should format output with {value}", async () => {
    host.setAttribute(attributes["input-watcher-target"], "#test-input");
    host.setAttribute(attributes["input-watcher-format"], "Value: {value}");

    await new Promise((resolve) => setTimeout(resolve, 0));

    input.value = "World";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(host.textContent).toBe("Value: World");
  });

  it("should support multiple inputs and indexed format", async () => {
    const input2 = document.createElement("input");
    input2.id = "test-input-2";
    document.body.appendChild(input2);

    host.setAttribute(
      attributes["input-watcher-target"],
      "#test-input, #test-input-2",
    );
    host.setAttribute(attributes["input-watcher-format"], "{0} - {1}");

    await new Promise((resolve) => setTimeout(resolve, 0));

    input.value = "A";
    input2.value = "B";

    input.dispatchEvent(new Event("input", { bubbles: true }));
    input2.dispatchEvent(new Event("input", { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(host.textContent).toBe("A - B");
  });

  it("should read from attribute if specified", async () => {
    host.setAttribute(attributes["input-watcher-target"], "#test-input");
    host.setAttribute(attributes["input-watcher-attr"], "data-value");

    await new Promise((resolve) => setTimeout(resolve, 0));

    input.setAttribute("data-value", "Custom");
    // Trigger mutation or input event?
    // If watching attributes, we need mutation observer on target?
    // Or just listen to events and read attribute?
    // The requirement said "listen to events". So input event should trigger read.
    input.dispatchEvent(new Event("input", { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(host.textContent).toBe("Custom");
  });
});
