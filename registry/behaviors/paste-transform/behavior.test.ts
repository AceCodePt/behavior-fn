/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { registerBehavior } from "~registry";
import { defineBehavioralHost } from "~host";
import { getObservedAttributes } from "~utils";
import { createBehavioralElement } from "~test-utils";
import definition from "./_behavior-definition";
import { pasteTransformBehaviorFactory } from "./behavior";

const { name, attributes } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

describe("Paste-Transform Behavior", () => {
  const TAG = "paste-host";

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    
    registerBehavior(definition, pasteTransformBehaviorFactory);
    defineBehavioralHost("input", TAG, observedAttributes);
  });

  it("should transform pasted text using regex patterns", () => {
    const el = createBehavioralElement("input", TAG, {
      behavior: name,
      [attributes["paste-transform-patterns"]]: "-,_",
      [attributes["paste-transform-replaces"]]: " , ",
    });
    document.body.appendChild(el);

    const pasteEvent = new Event("paste", { bubbles: true, cancelable: true }) as any;
    pasteEvent.clipboardData = {
      getData: () => "foo-bar_baz",
    };

    el.dispatchEvent(pasteEvent);

    expect(el.value).toBe("foo bar baz");
    expect(pasteEvent.defaultPrevented).toBe(true);
  });
});
