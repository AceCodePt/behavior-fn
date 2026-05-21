/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { registerBehavior } from "~registry";
import { defineBehavioralHost } from "~host";
import { getObservedAttributes } from "~utils";
import { createBehavioralElement } from "~test-utils";
import definition from "./_behavior-definition";
import { computeBehaviorFactory } from "./behavior";

const { name, attributes } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

describe("Compute Behavior", () => {
  const TAG = "compute-host";

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    vi.useFakeTimers();
    
    registerBehavior(definition, computeBehaviorFactory);
    defineBehavioralHost("div", TAG, observedAttributes);
  });

  it("should calculate formula based on dependencies", async () => {
    const dep1 = document.createElement("input");
    dep1.id = "a";
    dep1.value = "10";
    document.body.appendChild(dep1);

    const dep2 = document.createElement("input");
    dep2.id = "b";
    dep2.value = "20";
    document.body.appendChild(dep2);

    const el = createBehavioralElement("div", TAG, {
      behavior: name,
      [attributes["compute-formula"]]: "#a + #b",
    });
    document.body.appendChild(el);

    // Wait for MutationObserver (observe strategy is default)
    await vi.runAllTimersAsync();
    
    expect(el.textContent).toBe("30");
  });

  it("should update when dependencies change", async () => {
    const dep = document.createElement("input");
    dep.id = "a";
    dep.value = "10";
    document.body.appendChild(dep);

    const el = createBehavioralElement("div", TAG, {
      behavior: name,
      [attributes["compute-formula"]]: "#a * 2",
    });
    document.body.appendChild(el);

    await vi.runAllTimersAsync();
    expect(el.textContent).toBe("20");

    dep.value = "50";
    dep.dispatchEvent(new Event("input", { bubbles: true }));
    
    expect(el.textContent).toBe("100");
  });

  it("should respect compute-precision", async () => {
    const dep = document.createElement("input");
    dep.id = "a";
    dep.value = "10";
    document.body.appendChild(dep);

    const el = createBehavioralElement("div", TAG, {
      behavior: name,
      [attributes["compute-formula"]]: "#a / 3",
      [attributes["compute-precision"]]: "2",
    });
    document.body.appendChild(el);

    await vi.runAllTimersAsync();
    expect(el.textContent).toBe("3.33");
  });

  it("should use compute-invalid-value on error", async () => {
    const el = createBehavioralElement("div", TAG, {
      behavior: name,
      [attributes["compute-formula"]]: "10 / 0", // Should return 0 by policy but let's force an error
      [attributes["compute-invalid-value"]]: "Invalid",
    });
    // Force error by missing dependency if formula had one
    document.body.appendChild(el);

    // 10 / 0 returns 0 in our new implementation.
    // Let's use a non-existent dependency to trigger error.
    el.setAttribute(attributes["compute-formula"], "#missing + 10");
    // Change formula triggers setup
    
    await vi.runAllTimersAsync();
    // In 'observe' mode it stays pending if missing.
    // Let's use 'retry' which fails after max retries.
    el.setAttribute(attributes["compute-ready-strategy"], "retry");
    el.setAttribute(attributes["compute-retry-count"], "1");
    el.setAttribute(attributes["compute-retry-delay"], "10");
    
    // Wait for retries
    await vi.runAllTimersAsync();
    
    expect(el.getAttribute("compute-state")).toBe("invalid");
    expect(el.textContent).toBe("Invalid");
  });
});
