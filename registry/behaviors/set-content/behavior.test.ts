/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { registerBehavior } from "~registry";
import { defineBehavioralHost } from "~host";
import { getObservedAttributes } from "~utils";
import { dispatchCommand, createBehavioralElement, createCommandSource } from "~test-utils";
import definition from "./_behavior-definition";
import { setContentBehaviorFactory } from "./behavior";

const { name, attributes, command } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

describe("Set-Content Behavior", () => {
  const TAG = "set-content-host";

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    
    registerBehavior(definition, setContentBehaviorFactory);
    defineBehavioralHost("div", TAG, observedAttributes);
  });

  it("should set textContent from command source innerText", () => {
    const el = createBehavioralElement("div", TAG, {
      behavior: name,
    });
    el.textContent = "Original";
    document.body.appendChild(el);

    const source = createCommandSource();
    source.innerText = "New Content";

    dispatchCommand(el, command["set"], source);

    expect(el.textContent).toBe("New Content");
  });

  it("should set textContent from set-content-value attribute", () => {
    const el = createBehavioralElement("div", TAG, {
      behavior: name,
      [attributes["set-content-value"]]: "Fixed Content",
    });
    document.body.appendChild(el);

    const source = createCommandSource();
    source.innerText = "Ignored Source";

    dispatchCommand(el, command["set"], source);

    expect(el.textContent).toBe("Fixed Content");
  });

  it("should toggle textContent", () => {
    const el = createBehavioralElement("div", TAG, {
      behavior: name,
      [attributes["set-content-value"]]: "Toggled",
    });
    el.textContent = "Original";
    document.body.appendChild(el);

    const source = createCommandSource();

    // First toggle
    dispatchCommand(el, command["toggle"], source);
    expect(el.textContent).toBe("Toggled");

    // Second toggle
    dispatchCommand(el, command["toggle"], source);
    expect(el.textContent).toBe("Original");
  });
});
