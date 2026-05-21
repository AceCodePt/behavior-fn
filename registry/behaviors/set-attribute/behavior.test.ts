/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { registerBehavior } from "~registry";
import { defineBehavioralHost } from "~host";
import { getObservedAttributes } from "~utils";
import { createBehavioralElement, dispatchCommand, createCommandSource } from "~test-utils";
import definition from "./_behavior-definition";
import { setAttributeBehaviorFactory } from "./behavior";

const { name, attributes, command } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

describe("Set-Attribute Behavior", () => {
  const TAG = "set-attr-host";

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    
    registerBehavior(definition, setAttributeBehaviorFactory);
    defineBehavioralHost("div", TAG, observedAttributes);
  });

  it("should set attribute from source innerText", () => {
    const el = createBehavioralElement("div", TAG, {
      behavior: name,
      [attributes["set-attribute-name"]]: "data-test",
    });
    document.body.appendChild(el);

    const source = createCommandSource();
    source.innerText = "value-from-source";

    dispatchCommand(el, command["set"], source);

    expect(el.getAttribute("data-test")).toBe("value-from-source");
  });

  it("should set attribute from set-attribute-value if present", () => {
    const el = createBehavioralElement("div", TAG, {
      behavior: name,
      [attributes["set-attribute-name"]]: "data-test",
      [attributes["set-attribute-value"]]: "fixed-value",
    });
    document.body.appendChild(el);

    const source = createCommandSource();
    source.innerText = "ignored";

    dispatchCommand(el, command["set"], source);

    expect(el.getAttribute("data-test")).toBe("fixed-value");
  });

  it("should toggle attribute", () => {
    const el = createBehavioralElement("div", TAG, {
      behavior: name,
      [attributes["set-attribute-name"]]: "disabled",
      [attributes["set-attribute-value"]]: "",
    });
    document.body.appendChild(el);

    dispatchCommand(el, command["toggle"]);
    expect(el.hasAttribute("disabled")).toBe(true);

    dispatchCommand(el, command["toggle"]);
    expect(el.hasAttribute("disabled")).toBe(false);
  });

  it("should remove attribute", () => {
    const el = createBehavioralElement("div", TAG, {
      behavior: name,
      [attributes["set-attribute-name"]]: "data-temp",
      "data-temp": "true",
    });
    document.body.appendChild(el);

    expect(el.hasAttribute("data-temp")).toBe(true);

    dispatchCommand(el, command["remove"]);
    expect(el.hasAttribute("data-temp")).toBe(false);
  });
});
