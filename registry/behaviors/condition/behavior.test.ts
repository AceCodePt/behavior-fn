/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { registerBehavior } from "~registry";
import { defineBehavioralHost } from "~host";
import { getObservedAttributes } from "~utils";
import { createBehavioralElement } from "~test-utils";
import definition from "./_behavior-definition";
import { conditionBehaviorFactory } from "./behavior";

const { name, attributes } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

describe("Condition Behavior", () => {
  const TAG = "condition-host";

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    
    registerBehavior(definition, conditionBehaviorFactory);
    defineBehavioralHost("div", TAG, observedAttributes);
  });

  it("should fire command when numeric comparison matches", async () => {
    const watchEl = document.createElement("div");
    watchEl.id = "source";
    watchEl.setAttribute("data-count", "0");
    document.body.appendChild(watchEl);

    const targetEl = document.createElement("div");
    targetEl.id = "target";
    document.body.appendChild(targetEl);

    const commandHandler = vi.fn();
    targetEl.addEventListener("command", commandHandler);

    const el = createBehavioralElement("div", TAG, {
      behavior: name,
      [attributes["condition-watch"]]: "source",
      [attributes["condition-on"]]: "data-count",
      [attributes["condition-op"]]: ">",
      [attributes["condition-value"]]: "5",
      [attributes["condition-command"]]: "notify",
      [attributes["condition-commandfor"]]: "target",
    });
    document.body.appendChild(el);

    // Trigger update
    watchEl.setAttribute("data-count", "10");
    
    // MutationObserver is async
    await vi.waitFor(() => expect(commandHandler).toHaveBeenCalled());
    
    expect(commandHandler.mock.calls[0][0].command).toBe("notify");
  });

  it("should fire command when string equality matches", async () => {
    const watchEl = document.createElement("div");
    watchEl.id = "source";
    watchEl.setAttribute("data-status", "inactive");
    document.body.appendChild(watchEl);

    const targetEl = document.createElement("div");
    targetEl.id = "target";
    document.body.appendChild(targetEl);

    const commandHandler = vi.fn();
    targetEl.addEventListener("command", commandHandler);

    const el = createBehavioralElement("div", TAG, {
      behavior: name,
      [attributes["condition-watch"]]: "source",
      [attributes["condition-on"]]: "data-status",
      [attributes["condition-op"]]: "==",
      [attributes["condition-value"]]: "active",
      [attributes["condition-command"]]: "activate",
      [attributes["condition-commandfor"]]: "target",
    });
    document.body.appendChild(el);

    watchEl.setAttribute("data-status", "active");
    
    await vi.waitFor(() => expect(commandHandler).toHaveBeenCalled());
    expect(commandHandler.mock.calls[0][0].command).toBe("activate");
  });
});
