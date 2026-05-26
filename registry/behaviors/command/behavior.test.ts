/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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
    defineBehavioralHost("input", TAG, observedAttributes);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should dispatch command on click (default)", () => {
    const target = document.createElement("div");
    target.id = "target";
    document.body.appendChild(target);

    const commandHandler = vi.fn();
    target.addEventListener("command", commandHandler);

    const el = createBehavioralElement("button", TAG, {
      behavior: name,
      command: "show",
      commandfor: "target",
    });
    document.body.appendChild(el);

    el.click();
    
    expect(commandHandler).toHaveBeenCalledTimes(1);
    expect(commandHandler.mock.calls[0][0].command).toBe("show");
  });

  it("should support commanddelay", async () => {
    const target = document.createElement("div");
    target.id = "target";
    document.body.appendChild(target);

    const commandHandler = vi.fn();
    target.addEventListener("command", commandHandler);

    const el = createBehavioralElement("button", TAG, {
      behavior: name,
      command: "test",
      commandfor: "target",
      [attributes["commanddelay"]]: "100",
    });
    document.body.appendChild(el);

    el.click();
    expect(commandHandler).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    await vi.runAllTimersAsync();
    
    expect(commandHandler).toHaveBeenCalledTimes(1);
  });

  it("should support commandthrottle", () => {
    const target = document.createElement("div");
    target.id = "target";
    document.body.appendChild(target);

    const commandHandler = vi.fn();
    target.addEventListener("command", commandHandler);

    const el = createBehavioralElement("button", TAG, {
      behavior: name,
      command: "test",
      commandfor: "target",
      [attributes["commandthrottle"]]: "100",
    });
    document.body.appendChild(el);

    el.click();
    el.click();
    el.click();

    expect(commandHandler).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    el.click();

    expect(commandHandler).toHaveBeenCalledTimes(2);
  });

  it.skip("should support custom trigger via commandby", () => {
    const target = document.createElement("div");
    target.id = "target";
    document.body.appendChild(target);

    const commandHandler = vi.fn();
    target.addEventListener("command", commandHandler);

    const el = createBehavioralElement("input", TAG, {
      behavior: name,
      command: "update",
      commandfor: "target",
      commandby: "input",
    });
    document.body.appendChild(el);

    el.dispatchEvent(new Event("input", { bubbles: true }));
    
    expect(commandHandler).toHaveBeenCalledTimes(1);
    expect(commandHandler.mock.calls[0][0].command).toBe("update");
  });

  it("should support multiple targets (space-separated)", () => {
    const target1 = document.createElement("div");
    target1.id = "target1";
    const target2 = document.createElement("div");
    target2.id = "target2";
    document.body.appendChild(target1);
    document.body.appendChild(target2);

    const handler1 = vi.fn();
    const handler2 = vi.fn();
    target1.addEventListener("command", handler1);
    target2.addEventListener("command", handler2);

    const el = createBehavioralElement("button", TAG, {
      behavior: name,
      command: "show",
      commandfor: "target1 target2",
    });
    document.body.appendChild(el);

    el.click();

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
    expect(handler1.mock.calls[0][0].command).toBe("show");
    expect(handler2.mock.calls[0][0].command).toBe("show");
  });

  it("should support multiple commands to single target", () => {
    const target = document.createElement("div");
    target.id = "target";
    document.body.appendChild(target);

    const commandHandler = vi.fn();
    target.addEventListener("command", commandHandler);

    const el = createBehavioralElement("button", TAG, {
      behavior: name,
      command: "show focus",
      commandfor: "target",
    });
    document.body.appendChild(el);

    el.click();

    expect(commandHandler).toHaveBeenCalledTimes(2);
    expect(commandHandler.mock.calls[0][0].command).toBe("show");
    expect(commandHandler.mock.calls[1][0].command).toBe("focus");
  });

  it("should map commands 1:1 with multiple targets", () => {
    const target1 = document.createElement("div");
    target1.id = "target1";
    const target2 = document.createElement("div");
    target2.id = "target2";
    document.body.appendChild(target1);
    document.body.appendChild(target2);

    const handler1 = vi.fn();
    const handler2 = vi.fn();
    target1.addEventListener("command", handler1);
    target2.addEventListener("command", handler2);

    const el = createBehavioralElement("button", TAG, {
      behavior: name,
      command: "show hide",
      commandfor: "target1 target2",
    });
    document.body.appendChild(el);

    el.click();

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
    expect(handler1.mock.calls[0][0].command).toBe("show");
    expect(handler2.mock.calls[0][0].command).toBe("hide");
  });

  it("should clean up event listeners on disconnect", () => {
    const target = document.createElement("div");
    target.id = "target";
    document.body.appendChild(target);

    const commandHandler = vi.fn();
    target.addEventListener("command", commandHandler);

    const el = createBehavioralElement("button", TAG, {
      behavior: name,
      command: "test",
      commandfor: "target",
    });
    document.body.appendChild(el);

    el.click();
    expect(commandHandler).toHaveBeenCalledTimes(1);

    el.remove();

    const newEl = createBehavioralElement("button", TAG, {
      behavior: name,
      command: "test",
      commandfor: "target",
    });
    document.body.appendChild(newEl);

    newEl.click();
    expect(commandHandler).toHaveBeenCalledTimes(2);
  });
});
