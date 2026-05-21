/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { registerBehavior } from "~registry";
import { defineBehavioralHost } from "~host";
import { getObservedAttributes } from "~utils";
import { createBehavioralElement } from "~test-utils";
import definition from "./_behavior-definition";
import { dirtyBehaviorFactory } from "./behavior";

const { name } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

describe("Dirty-Input Behavior", () => {
  const TAG = "dirty-host";

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    
    registerBehavior(definition, dirtyBehaviorFactory);
    defineBehavioralHost("input", TAG, observedAttributes);
  });

  it("should be clean initially", () => {
    const el = createBehavioralElement("input", TAG, {
      behavior: name,
      value: "initial",
    });
    document.body.appendChild(el);

    expect(el.hasAttribute("dirty-state")).toBe(false);
  });

  it("should become dirty when value changes", () => {
    const el = createBehavioralElement("input", TAG, {
      behavior: name,
      value: "initial",
    });
    document.body.appendChild(el);

    el.value = "changed";
    el.dispatchEvent(new Event("input", { bubbles: true }));

    expect(el.hasAttribute("dirty-state")).toBe(true);
  });

  it("should become clean when value matches attribute baseline", () => {
    const el = createBehavioralElement("input", TAG, {
      behavior: name,
      value: "initial",
    });
    document.body.appendChild(el);

    el.value = "changed";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    expect(el.hasAttribute("dirty-state")).toBe(true);

    el.value = "initial";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    expect(el.hasAttribute("dirty-state")).toBe(false);
  });

  it("should update baseline when attribute is set", () => {
    const el = createBehavioralElement("input", TAG, {
      behavior: name,
      value: "initial",
    });
    document.body.appendChild(el);

    el.value = "new-baseline";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    expect(el.hasAttribute("dirty-state")).toBe(true);

    el.setAttribute("value", "new-baseline");
    // attributeChangedCallback handles it
    expect(el.hasAttribute("dirty-state")).toBe(false);
  });
});
