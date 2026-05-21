/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { registerBehavior } from "~registry";
import { defineBehavioralHost } from "~host";
import { getObservedAttributes } from "~utils";
import { createBehavioralElement } from "~test-utils";
import definition from "./_behavior-definition";
import { formatBehaviorFactory } from "./behavior";

const { name, attributes } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

describe("Format Behavior", () => {
  const TAG = "format-host";

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    
    registerBehavior(definition, formatBehaviorFactory);
    defineBehavioralHost("input", TAG, observedAttributes);
  });

  it("should format initial value and set attribute baseline", () => {
    const el = createBehavioralElement("input", TAG, {
      behavior: name,
      [attributes["format-type"]]: "currency",
      value: "1000",
    });
    document.body.appendChild(el);

    // Initial load: 1000 -> $1,000.00
    expect(el.value).toBe("$1,000.00");
    expect(el.getAttribute("value")).toBe("$1,000.00");
  });

  it("should format on blur (default strategy)", () => {
    const el = createBehavioralElement("input", TAG, {
      behavior: name,
      [attributes["format-type"]]: "number",
      value: "1000",
    });
    document.body.appendChild(el);

    el.value = "2000";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    expect(el.value).toBe("2000"); // No live change

    el.dispatchEvent(new Event("blur", { bubbles: true }));
    expect(el.value).toBe("2,000");
  });

  it("should format on input (live strategy)", () => {
    const el = createBehavioralElement("input", TAG, {
      behavior: name,
      [attributes["format-type"]]: "number",
      [attributes["format-strategy"]]: "live",
      value: "100",
    });
    document.body.appendChild(el);

    el.value = "1000";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    expect(el.value).toBe("1,000");
  });
});
