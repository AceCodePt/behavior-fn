/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { registerBehavior } from "~registry";
import { defineBehavioralHost } from "~host";
import { getObservedAttributes } from "~utils";
import { createBehavioralElement, dispatchCommand } from "~test-utils";
import definition from "./_behavior-definition";
import { revealBehaviorFactory } from "./behavior";

const { name, attributes, command } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

describe("Reveal Behavior", () => {
  const TAG = "reveal-host";

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    
    registerBehavior(definition, revealBehaviorFactory);
    defineBehavioralHost("div", TAG, observedAttributes);
  });

  it("should toggle visibility on standard elements", () => {
    const el = createBehavioralElement("div", TAG, {
      behavior: name,
    });
    el.hidden = true;
    document.body.appendChild(el);

    expect(el.getAttribute("reveal-state")).toBe("closed");

    dispatchCommand(el, command["show"]);
    expect(el.hidden).toBe(false);
    expect(el.getAttribute("reveal-state")).toBe("open");

    dispatchCommand(el, command["hide"]);
    expect(el.hidden).toBe(true);
    expect(el.getAttribute("reveal-state")).toBe("closed");
  });

  it("should handle popover state", () => {
    // JSDOM might not support Popover API fully, but we check attributes
    const el = createBehavioralElement("div", TAG, {
      behavior: name,
      popover: "auto",
    });
    // Mock popover methods if missing
    el.showPopover = vi.fn(() => el.setAttribute("popover-open", ""));
    el.hidePopover = vi.fn(() => el.removeAttribute("popover-open"));
    el.matches = vi.fn((s) => s === ":popover-open" ? el.hasAttribute("popover-open") : false);
    
    document.body.appendChild(el);

    dispatchCommand(el, command["show"]);
    expect(el.showPopover).toHaveBeenCalled();
    
    // updateState would be called by 'toggle' event in real browser
    // but here we might need to manually trigger it if JSDOM doesn't fire it
    el.dispatchEvent(new Event("toggle")); 
    expect(el.getAttribute("reveal-state")).toBe("open");
  });
});
