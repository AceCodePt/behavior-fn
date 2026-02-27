/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, beforeAll, vi, afterEach } from "vitest";
import { defineBehavioralHost } from "~host";
import { compoundCommandsBehaviorFactory } from "./behavior";
import { registerBehavior } from "~registry";
import { getObservedAttributes } from "~utils";
import { getCommandEvent } from "~test-utils";
import definition from "./_behavior-definition";

const { attributes } = definition;

describe("Compound Commands Behavior", () => {
  const tag = "button";
  const webcomponentTag = "test-compound-commands-btn";

  beforeAll(() => {
    registerBehavior(definition, compoundCommandsBehaviorFactory);
    defineBehavioralHost(tag, webcomponentTag, getObservedAttributes(definition.schema));
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should dispatch single command to single target", async () => {
    const button = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLButtonElement;
    button.setAttribute("behavior", definition.name);
    button.setAttribute(attributes["commandfor"], "target");
    button.setAttribute(attributes["command"], "--show");
    document.body.appendChild(button);

    const target = document.createElement("div");
    target.id = "target";
    document.body.appendChild(target);

    const commandHandler = vi.fn();
    target.addEventListener("command", commandHandler);

    await vi.waitFor(() => {
      button.click();

      expect(commandHandler).toHaveBeenCalledTimes(1);
      const event = getCommandEvent(commandHandler);
      expect(event.type).toBe("command");
      expect(event.command).toBe("--show");
      expect(event.source).toBe(button);
    });
  });

  it("should dispatch multiple commands to single target sequentially", async () => {
    const button = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLButtonElement;
    button.setAttribute("behavior", definition.name);
    button.setAttribute(attributes["commandfor"], "target");
    button.setAttribute(attributes["command"], "--show, --focus");
    document.body.appendChild(button);

    const target = document.createElement("div");
    target.id = "target";
    document.body.appendChild(target);

    const commandHandler = vi.fn();
    target.addEventListener("command", commandHandler);

    await vi.waitFor(() => {
      button.click();

      expect(commandHandler).toHaveBeenCalledTimes(2);

      const event1 = getCommandEvent(commandHandler, 0);
      expect(event1.command).toBe("--show");
      expect(event1.source).toBe(button);

      const event2 = getCommandEvent(commandHandler, 1);
      expect(event2.command).toBe("--focus");
      expect(event2.source).toBe(button);
    });
  });

  it("should broadcast single command to multiple targets", async () => {
    const button = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLButtonElement;
    button.setAttribute("behavior", definition.name);
    button.setAttribute(attributes["commandfor"], "target1, target2");
    button.setAttribute(attributes["command"], "--hide");
    document.body.appendChild(button);

    const target1 = document.createElement("div");
    target1.id = "target1";
    const handler1 = vi.fn();
    target1.addEventListener("command", handler1);
    document.body.appendChild(target1);

    const target2 = document.createElement("div");
    target2.id = "target2";
    const handler2 = vi.fn();
    target2.addEventListener("command", handler2);
    document.body.appendChild(target2);

    await vi.waitFor(() => {
      button.click();

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);

      const event1 = getCommandEvent(handler1);
      expect(event1.command).toBe("--hide");
      expect(event1.source).toBe(button);

      const event2 = getCommandEvent(handler2);
      expect(event2.command).toBe("--hide");
      expect(event2.source).toBe(button);
    });
  });

  it("should dispatch with exact mapping (2:2)", async () => {
    const button = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLButtonElement;
    button.setAttribute("behavior", definition.name);
    button.setAttribute(attributes["commandfor"], "target1, target2");
    button.setAttribute(attributes["command"], "--toggle, --clear");
    document.body.appendChild(button);

    const target1 = document.createElement("div");
    target1.id = "target1";
    const handler1 = vi.fn();
    target1.addEventListener("command", handler1);
    document.body.appendChild(target1);

    const target2 = document.createElement("div");
    target2.id = "target2";
    const handler2 = vi.fn();
    target2.addEventListener("command", handler2);
    document.body.appendChild(target2);

    await vi.waitFor(() => {
      button.click();

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);

      const event1 = getCommandEvent(handler1);
      expect(event1.command).toBe("--toggle");
      expect(event1.source).toBe(button);

      const event2 = getCommandEvent(handler2);
      expect(event2.command).toBe("--clear");
      expect(event2.source).toBe(button);
    });
  });

  it("should dispatch with exact mapping (3:3)", async () => {
    const button = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLButtonElement;
    button.setAttribute("behavior", definition.name);
    button.setAttribute(attributes["commandfor"], "a, b, c");
    button.setAttribute(attributes["command"], "--x, --y, --z");
    document.body.appendChild(button);

    const targetA = document.createElement("div");
    targetA.id = "a";
    const handlerA = vi.fn();
    targetA.addEventListener("command", handlerA);
    document.body.appendChild(targetA);

    const targetB = document.createElement("div");
    targetB.id = "b";
    const handlerB = vi.fn();
    targetB.addEventListener("command", handlerB);
    document.body.appendChild(targetB);

    const targetC = document.createElement("div");
    targetC.id = "c";
    const handlerC = vi.fn();
    targetC.addEventListener("command", handlerC);
    document.body.appendChild(targetC);

    await vi.waitFor(() => {
      button.click();

      expect(handlerA).toHaveBeenCalledTimes(1);
      expect(handlerB).toHaveBeenCalledTimes(1);
      expect(handlerC).toHaveBeenCalledTimes(1);

      const eventA = getCommandEvent(handlerA);
      expect(eventA.command).toBe("--x");

      const eventB = getCommandEvent(handlerB);
      expect(eventB.command).toBe("--y");

      const eventC = getCommandEvent(handlerC);
      expect(eventC.command).toBe("--z");
    });
  });

  it("should log warning if target not found but continue processing", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const button = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLButtonElement;
    button.setAttribute("behavior", definition.name);
    button.setAttribute(attributes["commandfor"], "missing, exists");
    button.setAttribute(attributes["command"], "--hide");
    document.body.appendChild(button);

    const target = document.createElement("div");
    target.id = "exists";
    const handler = vi.fn();
    target.addEventListener("command", handler);
    document.body.appendChild(target);

    await vi.waitFor(() => {
      button.click();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Target not found: missing"),
      );
      expect(handler).toHaveBeenCalledTimes(1);
    });

    consoleWarnSpy.mockRestore();
  });

  it("should log error and prevent dispatch on mismatched counts", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const button = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLButtonElement;
    button.setAttribute("behavior", definition.name);
    button.setAttribute(attributes["commandfor"], "a, b, c");
    button.setAttribute(attributes["command"], "--x, --y");
    document.body.appendChild(button);

    const target1 = document.createElement("div");
    target1.id = "a";
    const handler1 = vi.fn();
    target1.addEventListener("command", handler1);
    document.body.appendChild(target1);

    const target2 = document.createElement("div");
    target2.id = "b";
    const handler2 = vi.fn();
    target2.addEventListener("command", handler2);
    document.body.appendChild(target2);

    const target3 = document.createElement("div");
    target3.id = "c";
    const handler3 = vi.fn();
    target3.addEventListener("command", handler3);
    document.body.appendChild(target3);

    await vi.waitFor(() => {
      button.click();

      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorCall = consoleErrorSpy.mock.calls[0];
      expect(errorCall[0]).toContain("Invalid command mapping");
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(handler3).not.toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it("should not dispatch if commandfor attribute is missing", async () => {
    const button = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLButtonElement;
    button.setAttribute("behavior", definition.name);
    button.setAttribute(attributes["command"], "--show");
    document.body.appendChild(button);

    const target = document.createElement("div");
    target.id = "target";
    const handler = vi.fn();
    target.addEventListener("command", handler);
    document.body.appendChild(target);

    await vi.waitFor(() => {
      button.click();
      expect(handler).not.toHaveBeenCalled();
    });
  });

  it("should not dispatch if command attribute is missing", async () => {
    const button = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLButtonElement;
    button.setAttribute("behavior", definition.name);
    button.setAttribute(attributes["commandfor"], "target");
    document.body.appendChild(button);

    const target = document.createElement("div");
    target.id = "target";
    const handler = vi.fn();
    target.addEventListener("command", handler);
    document.body.appendChild(target);

    await vi.waitFor(() => {
      button.click();
      expect(handler).not.toHaveBeenCalled();
    });
  });

  it("should handle whitespace in comma-separated values", async () => {
    const button = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLButtonElement;
    button.setAttribute("behavior", definition.name);
    button.setAttribute(attributes["commandfor"], "  target1 , target2  ");
    button.setAttribute(attributes["command"], " --hide ");
    document.body.appendChild(button);

    const target1 = document.createElement("div");
    target1.id = "target1";
    const handler1 = vi.fn();
    target1.addEventListener("command", handler1);
    document.body.appendChild(target1);

    const target2 = document.createElement("div");
    target2.id = "target2";
    const handler2 = vi.fn();
    target2.addEventListener("command", handler2);
    document.body.appendChild(target2);

    await vi.waitFor(() => {
      button.click();

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  it("should preserve event source as original button", async () => {
    const button = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLButtonElement;
    button.id = "trigger-btn";
    button.setAttribute("behavior", definition.name);
    button.setAttribute(attributes["commandfor"], "target");
    button.setAttribute(attributes["command"], "--show");
    document.body.appendChild(button);

    const target = document.createElement("div");
    target.id = "target";
    document.body.appendChild(target);

    const commandHandler = vi.fn();
    target.addEventListener("command", commandHandler);

    await vi.waitFor(() => {
      button.click();

      expect(commandHandler).toHaveBeenCalledTimes(1);
      const event = getCommandEvent(commandHandler);
      expect(event.source).toBe(button);
      expect(event.source.id).toBe("trigger-btn");
    });
  });

  it("should work with reveal behavior pattern", async () => {
    const button = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLButtonElement;
    button.setAttribute("behavior", definition.name);
    button.setAttribute(attributes["commandfor"], "modal");
    button.setAttribute(attributes["command"], "--toggle");
    document.body.appendChild(button);

    const modal = document.createElement("div");
    modal.id = "modal";
    modal.setAttribute("hidden", "");
    document.body.appendChild(modal);

    // Simulate reveal behavior's onCommand handler
    modal.addEventListener("command", (e: Event) => {
      const commandEvent = e as Event & { command?: string };
      if (commandEvent.command === "--toggle") {
        if (modal.hasAttribute("hidden")) {
          modal.removeAttribute("hidden");
        } else {
          modal.setAttribute("hidden", "");
        }
      }
    });

    await vi.waitFor(() => {
      expect(modal.hasAttribute("hidden")).toBe(true);

      button.click();
      expect(modal.hasAttribute("hidden")).toBe(false);

      button.click();
      expect(modal.hasAttribute("hidden")).toBe(true);
    });
  });
});
