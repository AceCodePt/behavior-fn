/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { registerBehavior } from "~registry";
import { defineBehavioralHost } from "~host";
import { getObservedAttributes } from "~utils";
import { createBehavioralElement } from "~test-utils";
import definition from "./_behavior-definition";
import { commandBehaviorFactory } from "./behavior";

const { name, attributes } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

describe("Command Behavior", () => {
  const TAG = "command-host";

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    vi.useFakeTimers();
    
    registerBehavior(definition, commandBehaviorFactory);
    defineBehavioralHost("button", TAG, observedAttributes);
  });

  it("should support delayed command execution", async () => {
    const target = document.createElement("div");
    target.id = "target";
    document.body.appendChild(target);

    const commandHandler = vi.fn();
    target.addEventListener("command", commandHandler);

    const el = createBehavioralElement("button", TAG, {
      behavior: name,
      command: "test",
      commandfor: "target",
      [attributes["command-delay"]]: "100",
    });
    document.body.appendChild(el);

    el.click();
    expect(commandHandler).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    
    // Command is dispatched asynchronously via import() in our implementation
    await vi.runAllTimersAsync();
    
    expect(commandHandler).toHaveBeenCalled();
  });
});
