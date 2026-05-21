/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { registerBehavior } from "~registry";
import { defineBehavioralHost } from "~host";
import { getObservedAttributes } from "~utils";
import { createBehavioralElement } from "~test-utils";
import definition from "./_behavior-definition";
import { storageBehaviorFactory } from "./behavior";

const { name, attributes } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

describe("Storage Behavior", () => {
  const TAG = "storage-host";

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    
    registerBehavior(definition, storageBehaviorFactory);
    defineBehavioralHost("input", TAG, observedAttributes);
  });

  it("should sync value from localStorage on connect", () => {
    localStorage.setItem("test-key", "saved-value");

    const el = createBehavioralElement("input", TAG, {
      behavior: name,
      [attributes["storage-key"]]: "test-key",
    });
    document.body.appendChild(el);

    expect(el.value).toBe("saved-value");
  });

  it("should sync value to localStorage on input", () => {
    const el = createBehavioralElement("input", TAG, {
      behavior: name,
      [attributes["storage-key"]]: "test-key",
    });
    document.body.appendChild(el);

    el.value = "new-value";
    el.dispatchEvent(new Event("input", { bubbles: true }));

    expect(localStorage.getItem("test-key")).toBe("new-value");
  });

  it("should support sessionStorage", () => {
    sessionStorage.setItem("session-key", "secret");

    const el = createBehavioralElement("input", TAG, {
      behavior: name,
      [attributes["storage-key"]]: "session-key",
      [attributes["storage-type"]]: "session",
    });
    document.body.appendChild(el);

    expect(el.value).toBe("secret");
    
    el.value = "changed";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    expect(sessionStorage.getItem("session-key")).toBe("changed");
  });
});
