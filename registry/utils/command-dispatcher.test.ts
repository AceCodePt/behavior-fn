/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { enableCommandDispatcher } from "./command-dispatcher";
import { registerBehavior } from "~registry";

describe("Command Dispatcher", () => {
  let disconnect: (() => void) | undefined;

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (disconnect) {
      disconnect();
      disconnect = undefined;
    }
  });

  describe("Basic Dispatch", () => {
    it("should dispatch command on click", () => {
      const target = document.createElement("div");
      target.id = "target";
      document.body.appendChild(target);

      const button = document.createElement("button");
      button.setAttribute("commandfor", "target");
      button.setAttribute("command", "show");
      document.body.appendChild(button);

      const commandHandler = vi.fn();
      target.addEventListener("command", commandHandler);

      disconnect = enableCommandDispatcher();

      button.click();

      expect(commandHandler).toHaveBeenCalledTimes(1);
      const event = commandHandler.mock.calls[0][0] as any;
      expect(event.command).toBe("show");
      expect(event.source).toBe(button);
    });

    it("should dispatch non-prefixed commands", () => {
      const target = document.createElement("div");
      target.id = "target";
      document.body.appendChild(target);

      const button = document.createElement("button");
      button.setAttribute("commandfor", "target");
      button.setAttribute("command", "toggle");
      document.body.appendChild(button);

      const commandHandler = vi.fn();
      target.addEventListener("command", commandHandler);

      disconnect = enableCommandDispatcher();

      button.click();

      expect(commandHandler).toHaveBeenCalledTimes(1);
      const event = commandHandler.mock.calls[0][0] as any;
      expect(event.command).toBe("toggle");
    });

    it("should normalize --prefixed commands", () => {
      const target = document.createElement("div");
      target.id = "target";
      document.body.appendChild(target);

      const button = document.createElement("button");
      button.setAttribute("commandfor", "target");
      button.setAttribute("command", "--show");
      document.body.appendChild(button);

      const commandHandler = vi.fn();
      target.addEventListener("command", commandHandler);

      disconnect = enableCommandDispatcher();

      button.click();

      expect(commandHandler).toHaveBeenCalledTimes(1);
      const event = commandHandler.mock.calls[0][0] as any;
      // Command should be normalized (prefix stripped)
      expect(event.command).toBe("show");
    });
  });

  describe("Multiple Targets", () => {
    it("should dispatch to multiple targets (comma-separated)", () => {
      const target1 = document.createElement("div");
      target1.id = "target1";
      const target2 = document.createElement("div");
      target2.id = "target2";
      document.body.appendChild(target1);
      document.body.appendChild(target2);

      const button = document.createElement("button");
      button.setAttribute("commandfor", "target1, target2");
      button.setAttribute("command", "show");
      document.body.appendChild(button);

      const handler1 = vi.fn();
      const handler2 = vi.fn();
      target1.addEventListener("command", handler1);
      target2.addEventListener("command", handler2);

      disconnect = enableCommandDispatcher();

      button.click();

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler1.mock.calls[0][0].command).toBe("show");
      expect(handler2.mock.calls[0][0].command).toBe("show");
    });

    it("should dispatch to multiple targets (space-separated)", () => {
      const target1 = document.createElement("div");
      target1.id = "target1";
      const target2 = document.createElement("div");
      target2.id = "target2";
      document.body.appendChild(target1);
      document.body.appendChild(target2);

      const button = document.createElement("button");
      button.setAttribute("commandfor", "target1 target2");
      button.setAttribute("command", "hide");
      document.body.appendChild(button);

      const handler1 = vi.fn();
      const handler2 = vi.fn();
      target1.addEventListener("command", handler1);
      target2.addEventListener("command", handler2);

      disconnect = enableCommandDispatcher();

      button.click();

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe("Multiple Commands", () => {
    it("should dispatch multiple commands to single target", () => {
      const target = document.createElement("div");
      target.id = "target";
      document.body.appendChild(target);

      const button = document.createElement("button");
      button.setAttribute("commandfor", "target");
      button.setAttribute("command", "show, focus");
      document.body.appendChild(button);

      const commandHandler = vi.fn();
      target.addEventListener("command", commandHandler);

      disconnect = enableCommandDispatcher();

      button.click();

      expect(commandHandler).toHaveBeenCalledTimes(2);
      expect(commandHandler.mock.calls[0][0].command).toBe("show");
      expect(commandHandler.mock.calls[1][0].command).toBe("focus");
    });

    it("should map commands 1:1 with targets", () => {
      const target1 = document.createElement("div");
      target1.id = "target1";
      const target2 = document.createElement("div");
      target2.id = "target2";
      document.body.appendChild(target1);
      document.body.appendChild(target2);

      const button = document.createElement("button");
      button.setAttribute("commandfor", "target1, target2");
      button.setAttribute("command", "show, hide");
      document.body.appendChild(button);

      const handler1 = vi.fn();
      const handler2 = vi.fn();
      target1.addEventListener("command", handler1);
      target2.addEventListener("command", handler2);

      disconnect = enableCommandDispatcher();

      button.click();

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler1.mock.calls[0][0].command).toBe("show");
      expect(handler2.mock.calls[0][0].command).toBe("hide");
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing target gracefully", () => {
      const button = document.createElement("button");
      button.setAttribute("commandfor", "nonexistent");
      button.setAttribute("command", "show");
      document.body.appendChild(button);

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      disconnect = enableCommandDispatcher();

      expect(() => button.click()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Target element not found: #nonexistent")
      );

      consoleSpy.mockRestore();
    });

    it("should handle missing command attribute", () => {
      const target = document.createElement("div");
      target.id = "target";
      document.body.appendChild(target);

      const button = document.createElement("button");
      button.setAttribute("commandfor", "target");
      // No command attribute
      document.body.appendChild(button);

      const commandHandler = vi.fn();
      target.addEventListener("command", commandHandler);

      disconnect = enableCommandDispatcher();

      button.click();

      expect(commandHandler).not.toHaveBeenCalled();
    });

    it("should handle missing commandfor attribute", () => {
      const button = document.createElement("button");
      button.setAttribute("command", "show");
      // No commandfor attribute
      document.body.appendChild(button);

      disconnect = enableCommandDispatcher();

      expect(() => button.click()).not.toThrow();
    });

    it("should work with nested trigger elements", () => {
      const target = document.createElement("div");
      target.id = "target";
      document.body.appendChild(target);

      const button = document.createElement("button");
      button.setAttribute("commandfor", "target");
      button.setAttribute("command", "show");
      
      const icon = document.createElement("span");
      icon.textContent = "★";
      button.appendChild(icon);
      
      document.body.appendChild(button);

      const commandHandler = vi.fn();
      target.addEventListener("command", commandHandler);

      disconnect = enableCommandDispatcher();

      // Click on nested icon
      icon.click();

      expect(commandHandler).toHaveBeenCalledTimes(1);
      expect(commandHandler.mock.calls[0][0].command).toBe("show");
    });
  });

  describe("Extended Features Override Native API", () => {
    it("should handle --prefixed commands with multiple targets (extended feature)", () => {
      const target1 = document.createElement("div");
      target1.id = "target1";
      const target2 = document.createElement("div");
      target2.id = "target2";
      document.body.appendChild(target1);
      document.body.appendChild(target2);

      const button = document.createElement("button");
      button.setAttribute("commandfor", "target1, target2");
      button.setAttribute("command", "--show");
      document.body.appendChild(button);

      const handler1 = vi.fn();
      const handler2 = vi.fn();
      target1.addEventListener("command", handler1);
      target2.addEventListener("command", handler2);

      disconnect = enableCommandDispatcher();

      button.click();

      // Should dispatch even with -- prefix because of multiple targets
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler1.mock.calls[0][0].command).toBe("show");
    });

    it("should handle --prefixed commands with multiple commands (extended feature)", () => {
      const target = document.createElement("div");
      target.id = "target";
      document.body.appendChild(target);

      const button = document.createElement("button");
      button.setAttribute("commandfor", "target");
      button.setAttribute("command", "--show, --focus");
      document.body.appendChild(button);

      const commandHandler = vi.fn();
      target.addEventListener("command", commandHandler);

      disconnect = enableCommandDispatcher();

      button.click();

      // Should dispatch both commands even with -- prefix
      expect(commandHandler).toHaveBeenCalledTimes(2);
      expect(commandHandler.mock.calls[0][0].command).toBe("show");
      expect(commandHandler.mock.calls[1][0].command).toBe("focus");
    });

    it("should handle --prefixed commands with command-by (extended feature)", () => {
      const target = document.createElement("div");
      target.id = "target";
      document.body.appendChild(target);

      const button = document.createElement("button");
      button.setAttribute("commandfor", "target");
      button.setAttribute("command", "--show");
      button.setAttribute("command-by", "mouseenter");
      document.body.appendChild(button);

      const commandHandler = vi.fn();
      target.addEventListener("command", commandHandler);

      disconnect = enableCommandDispatcher();

      button.click();

      // Should dispatch because of command-by extended feature
      expect(commandHandler).toHaveBeenCalledTimes(1);
      expect(commandHandler.mock.calls[0][0].command).toBe("show");
    });
  });

  describe("Cleanup", () => {
    it("should stop dispatching after disconnect", () => {
      const target = document.createElement("div");
      target.id = "target";
      document.body.appendChild(target);

      const button = document.createElement("button");
      button.setAttribute("commandfor", "target");
      button.setAttribute("command", "show");
      document.body.appendChild(button);

      const commandHandler = vi.fn();
      target.addEventListener("command", commandHandler);

      disconnect = enableCommandDispatcher();
      
      // First click should work
      button.click();
      expect(commandHandler).toHaveBeenCalledTimes(1);

      // Disconnect
      disconnect();
      disconnect = undefined;

      // Second click should not dispatch
      button.click();
      expect(commandHandler).toHaveBeenCalledTimes(1); // Still 1, not 2
    });
  });
});
