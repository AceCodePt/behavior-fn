/** @vitest-environment jsdom */
import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  vi,
  afterEach,
} from "vitest";
import { dispatchCommand } from "~test-utils";
import { getObservedAttributes } from "~utils";
import { defineBehavioralHost } from "../behavioral-host";
import { registerBehavior } from "../behavior-registry";
import { revealBehaviorFactory } from "./behavior";
import definition from "./_behavior-definition";

const { name, attributes, commands } = definition;

describe("Reveal Behavior", () => {
  const tag = "div";
  const webcomponentTagForDiv = "test-reveal-div";
  const webcomponentTagForDialog = "test-reveal-dialog";

  beforeAll(() => {
    // Register behavior with full definition (not just name)
    registerBehavior(definition, revealBehaviorFactory);
    defineBehavioralHost(
      tag,
      webcomponentTagForDiv,
      getObservedAttributes(definition.schema),
    );
  });

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should apply styles from attributes", async () => {
    const el = document.createElement(tag, {
      is: webcomponentTagForDiv,
    }) as HTMLElement;
    el.setAttribute("behavior", "reveal");
    el.setAttribute(attributes["reveal-delay"], "100ms");
    el.setAttribute(attributes["reveal-duration"], "200ms");
    document.body.appendChild(el);

    expect(el.style.getPropertyValue("--reveal-delay")).toBe("100ms");
    expect(el.style.getPropertyValue("--reveal-duration")).toBe("200ms");
  });

  it("should handle --show, --hide, and --toggle commands", async () => {
    const el = document.createElement(tag, {
      is: webcomponentTagForDiv,
    }) as HTMLElement;
    el.setAttribute("behavior", "reveal");
    document.body.appendChild(el);

    dispatchCommand(el, commands["--hide"]);
    expect(el.hidden).toBe(true);

    dispatchCommand(el, commands["--show"]);
    expect(el.hidden).toBe(false);

    dispatchCommand(el, commands["--toggle"]);
    expect(el.hidden).toBe(true);

    dispatchCommand(el, commands["--toggle"]);
    expect(el.hidden).toBe(false);
  });

  it("should automatically sync ARIA attributes on triggers", async () => {
    const targetId = "reveal-target";

    // Create trigger
    const trigger = document.createElement("button");
    trigger.setAttribute("commandfor", targetId);
    trigger.setAttribute("command", commands["--toggle"]);
    document.body.appendChild(trigger);

    // Create target
    const el = document.createElement(tag, {
      is: webcomponentTagForDiv,
    }) as HTMLElement;
    el.id = targetId;
    el.setAttribute("behavior", "reveal");
    document.body.appendChild(el);

    // Initial sync
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(targetId);

    // Hide via command
    dispatchCommand(el, commands["--hide"]);
    expect(el.hidden).toBe(true);

    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    // Show via command
    dispatchCommand(el, commands["--show"]);
    expect(el.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("should handle popover API when popover attribute is present", async () => {
    const tag = "div";
    const webcomponentTag = "test-reveal-div-popover";

    defineBehavioralHost(tag, webcomponentTag, getObservedAttributes(definition.schema));

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as any;
    el.setAttribute("behavior", "reveal");
    el.setAttribute("popover", "auto");

    // Mock Popover API
    el.showPopover = vi.fn();
    el.hidePopover = vi.fn();
    const originalMatches = el.matches;
    el.matches = vi.fn((selector: string) => {
      if (selector === ":popover-open") {
        return (
          el.showPopover.mock.calls.length > el.hidePopover.mock.calls.length
        );
      }
      return originalMatches.call(el, selector);
    });

    document.body.appendChild(el);
    await vi.runAllTimersAsync();

    dispatchCommand(el, commands["--show"]);
    expect(el.showPopover).toHaveBeenCalled();

    dispatchCommand(el, commands["--hide"]);
    expect(el.hidePopover).toHaveBeenCalled();

    // Toggle to show (currently hidden because hide was called last)
    dispatchCommand(el, commands["--toggle"]);
    expect(el.showPopover).toHaveBeenCalledTimes(2);

    // Toggle to hide (currently shown because show was called last)
    dispatchCommand(el, commands["--toggle"]);
    expect(el.hidePopover).toHaveBeenCalledTimes(2);
  });

  it("should sync ARIA attributes for popovers on toggle event", async () => {
    const tag = "div";
    const webcomponentTag = "test-reveal-div-popover-aria";
    const targetId = "popover-target";

    defineBehavioralHost(tag, webcomponentTag, getObservedAttributes(definition.schema));

    // Create trigger
    const trigger = document.createElement("button");
    trigger.setAttribute("commandfor", targetId);
    trigger.setAttribute("command", commands["--toggle"]);
    document.body.appendChild(trigger);

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as any;
    el.id = targetId;
    el.setAttribute("behavior", "reveal");
    el.setAttribute("popover", "auto");

    // Mock matches
    let isOpen = false;
    el.matches = vi.fn((selector: string) => {
      if (selector === ":popover-open") {
        return isOpen;
      }
      return false;
    });

    document.body.appendChild(el);
    await vi.runAllTimersAsync();

    // Initial sync (hidden)
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    // Simulate popover opening
    isOpen = true;
    el.dispatchEvent(new Event("toggle"));

    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    // Simulate popover closing
    isOpen = false;
    el.dispatchEvent(new Event("toggle"));

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("should handle Dialog API when element is a dialog", async () => {
    const tag = "dialog";
    const webcomponentTag = "test-reveal-dialog";

    defineBehavioralHost(tag, webcomponentTag, getObservedAttributes(definition.schema));

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLDialogElement;
    el.setAttribute("behavior", "reveal");

    // Mock Dialog API
    el.showModal = vi.fn(() => {
      el.setAttribute("open", "");
    });
    el.close = vi.fn(() => {
      el.removeAttribute("open");
    });

    document.body.appendChild(el);
    await vi.runAllTimersAsync();

    dispatchCommand(el, commands["--show"]);
    expect(el.showModal).toHaveBeenCalled();
    expect(el.open).toBe(true);

    dispatchCommand(el, commands["--hide"]);
    expect(el.close).toHaveBeenCalled();
    expect(el.open).toBe(false);

    // Toggle to show
    dispatchCommand(el, commands["--toggle"]);
    expect(el.showModal).toHaveBeenCalledTimes(2);
    expect(el.open).toBe(true);

    // Toggle to hide
    dispatchCommand(el, commands["--toggle"]);
    expect(el.close).toHaveBeenCalledTimes(2);
    expect(el.open).toBe(false);
  });

  it("should sync ARIA attributes for dialogs on close event and mutation", async () => {
    const tag = "dialog";
    const webcomponentTag = "test-reveal-dialog-aria";
    const targetId = "dialog-target";

    defineBehavioralHost(tag, webcomponentTag, getObservedAttributes(definition.schema));

    // Create trigger
    const trigger = document.createElement("button");
    trigger.setAttribute("commandfor", targetId);
    trigger.setAttribute("command", commands["--toggle"]);
    document.body.appendChild(trigger);

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLDialogElement;
    el.id = targetId;
    el.setAttribute("behavior", "reveal");

    // Mock Dialog API
    el.showModal = vi.fn(() => {
      el.setAttribute("open", "");
    });
    el.close = vi.fn(() => {
      el.removeAttribute("open");
      el.dispatchEvent(new Event("close"));
    });

    document.body.appendChild(el);
    await vi.runAllTimersAsync();

    // Initial sync (hidden)
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    // Show via command
    dispatchCommand(el, commands["--show"]);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    // Close via event
    el.close();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("should automatically show/hide popover based on content when reveal-auto is true", async () => {
    const tag = "div";
    const webcomponentTag = "test-reveal-auto";

    defineBehavioralHost(tag, webcomponentTag, getObservedAttributes(definition.schema));

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as any;
    el.setAttribute("behavior", "reveal");
    el.setAttribute(attributes["reveal-auto"], "true");
    el.setAttribute(attributes["popover"], "auto");

    // Mock Popover API
    el.showPopover = vi.fn();
    el.hidePopover = vi.fn();
    let isOpen = false;
    el.matches = vi.fn((selector: string) => {
      if (selector === ":popover-open") return isOpen;
      return false;
    });
    el.showPopover.mockImplementation(() => {
      isOpen = true;
    });
    el.hidePopover.mockImplementation(() => {
      isOpen = false;
    });

    document.body.appendChild(el);
    await vi.runAllTimersAsync();

    // Initially empty, should not show
    expect(el.showPopover).not.toHaveBeenCalled();

    // Add content
    el.innerHTML = "<span>Some content</span>";

    // MutationObserver is async
    await vi.runAllTimersAsync();
    expect(el.showPopover).toHaveBeenCalled();

    // Clear content
    el.innerHTML = "";
    await vi.runAllTimersAsync();
    expect(el.hidePopover).toHaveBeenCalled();
  });

  it("should setup anchoring when reveal-anchor is provided", async () => {
    const anchorId = "my-anchor";
    const anchorEl = document.createElement("div");
    anchorEl.id = anchorId;
    document.body.appendChild(anchorEl);

    const el = document.createElement(tag, {
      is: webcomponentTagForDiv,
    }) as HTMLElement;
    el.id = "my-popover";
    el.setAttribute("behavior", "reveal");
    el.setAttribute(attributes["reveal-anchor"], anchorId);
    document.body.appendChild(el);

    await vi.runAllTimersAsync();

    const anchorName = anchorEl.style.getPropertyValue("anchor-name");
    expect(anchorName).toContain("--anchor-my-popover");
    expect(el.style.getPropertyValue("position-anchor")).toBe(
      "--anchor-my-popover",
    );
  });

  it("should show/hide based on target attribute changes", async () => {
    const targetId = "watch-target";
    const targetEl = document.createElement("div");
    targetEl.id = targetId;
    document.body.appendChild(targetEl);

    const el = document.createElement(tag, {
      is: webcomponentTagForDiv,
    }) as HTMLElement;
    el.setAttribute("behavior", "reveal");
    el.setAttribute(attributes["reveal-when-target"], `#${targetId}`);
    el.setAttribute(attributes["reveal-when-attribute"], "data-state");
    el.setAttribute(attributes["reveal-when-value"], "active");
    el.hidden = true;
    document.body.appendChild(el);

    await vi.runAllTimersAsync();

    // Initial state: data-state is null, so hidden should be true
    expect(el.hidden).toBe(true);

    // Change attribute to matching value
    targetEl.setAttribute("data-state", "active");

    // MutationObserver is async
    await vi.runAllTimersAsync();
    expect(el.hidden).toBe(false);

    // Change attribute to non-matching value
    targetEl.setAttribute("data-state", "inactive");
    await vi.runAllTimersAsync();
    expect(el.hidden).toBe(true);
  });

  describe("Focus Restoration", () => {
    it("should restore focus to the opener when a hidden element is hidden", async () => {
      const opener = document.createElement("button");
      document.body.appendChild(opener);
      opener.focus();

      const el = document.createElement(tag, {
        is: webcomponentTagForDiv,
      }) as HTMLElement;
      el.setAttribute("behavior", "reveal");
      document.body.appendChild(el);
      await vi.runAllTimersAsync();

      // Show with opener
      dispatchCommand(el, commands["--show"], opener);
      expect(el.hidden).toBe(false);

      // Hide
      dispatchCommand(el, commands["--hide"]);
      expect(el.hidden).toBe(true);
      expect(document.activeElement).toBe(opener);
    });

    it("should restore focus to the opener when a popover is closed", async () => {
      const opener = document.createElement("button");
      document.body.appendChild(opener);
      opener.focus();

      const el = document.createElement("div", {
        is: webcomponentTagForDiv,
      }) as any;

      el.setAttribute("behavior", "reveal");
      el.setAttribute(attributes["popover"], "auto");

      // Mock Popover API
      let isOpen = false;
      el.showPopover = vi.fn(() => {
        isOpen = true;
        el.dispatchEvent(new Event("toggle"));
      });
      el.hidePopover = vi.fn(() => {
        isOpen = false;
        el.dispatchEvent(new Event("toggle"));
      });
      el.matches = vi.fn((selector: string) => {
        if (selector === ":popover-open") return isOpen;
        return false;
      });

      document.body.appendChild(el);
      await vi.runAllTimersAsync();

      // Show with opener
      dispatchCommand(el, commands["--show"], opener);
      expect(isOpen).toBe(true);

      // Hide
      el.hidePopover();
      expect(isOpen).toBe(false);
      expect(document.activeElement).toBe(opener);
    });

    it("should restore focus to the opener when a dialog is closed", async () => {
      const opener = document.createElement("button");
      document.body.appendChild(opener);
      opener.focus();

      const el = document.createElement("dialog", {
        is: webcomponentTagForDialog,
      }) as HTMLDialogElement;

      el.setAttribute("behavior", "reveal");

      // Mock Dialog API
      el.showModal = vi.fn(() => {
        el.setAttribute(attributes["open"], "");
      });
      el.close = vi.fn(() => {
        el.removeAttribute("open");
        el.dispatchEvent(new Event("close"));
      });

      document.body.appendChild(el);
      await vi.runAllTimersAsync();

      // Show with opener
      dispatchCommand(el, commands["--show"], opener);
      expect(el.hasAttribute("open")).toBe(true);

      // Close
      el.close();
      expect(el.hasAttribute("open")).toBe(false);
      expect(document.activeElement).toBe(opener);
    });

    it("should NOT restore focus if opener is removed from DOM", async () => {
      const opener = document.createElement("button");
      document.body.appendChild(opener);
      opener.focus();

      const el = document.createElement(tag, {
        is: webcomponentTagForDiv,
      }) as HTMLElement;
      el.setAttribute("behavior", "reveal");
      document.body.appendChild(el);
      await vi.runAllTimersAsync();

      // Show with opener
      dispatchCommand(el, commands["--show"], opener);

      // Remove opener
      document.body.removeChild(opener);

      // Hide
      dispatchCommand(el, commands["--hide"]);
      expect(document.activeElement).not.toBe(opener);
    });

    it("should NOT restore focus if opener is inside the closing element", async () => {
      const el = document.createElement(tag, {
        is: webcomponentTagForDiv,
      }) as HTMLElement;
      el.setAttribute("behavior", "reveal");

      const opener = document.createElement("button");
      el.appendChild(opener);
      document.body.appendChild(el);
      opener.focus();

      const focusSpy = vi.spyOn(opener, "focus");

      await vi.runAllTimersAsync();

      // Show with opener (opener is inside el)
      dispatchCommand(el, commands["--show"], opener);

      // Hide
      dispatchCommand(el, commands["--hide"]);
      expect(focusSpy).not.toHaveBeenCalled();
    });

    it("should use the last opener if multiple show commands are issued", async () => {
      const opener1 = document.createElement("button");
      const opener2 = document.createElement("button");
      document.body.appendChild(opener1);
      document.body.appendChild(opener2);

      const el = document.createElement(tag, {
        is: webcomponentTagForDiv,
      }) as HTMLElement;
      el.setAttribute("behavior", "reveal");
      document.body.appendChild(el);
      await vi.runAllTimersAsync();

      // Show with opener1
      dispatchCommand(el, commands["--show"], opener1);

      // Show with opener2
      dispatchCommand(el, commands["--show"], opener2);

      // Hide
      dispatchCommand(el, commands["--hide"]);
      expect(document.activeElement).toBe(opener2);
    });

    it("should NOT restore focus to the original opener if toggled hide by a different element", async () => {
      const opener = document.createElement("button");
      document.body.appendChild(opener);
      opener.focus();

      const el = document.createElement(tag, {
        is: webcomponentTagForDiv,
      }) as HTMLElement;
      el.setAttribute("behavior", "reveal");
      el.hidden = true;
      document.body.appendChild(el);
      await vi.runAllTimersAsync();

      // Toggle to show with opener
      dispatchCommand(el, commands["--toggle"], opener);
      expect(el.hidden).toBe(false);

      // Move focus to another button
      const other = document.createElement("button");
      document.body.appendChild(other);
      other.focus();
      expect(document.activeElement).toBe(other);

      // Toggle to hide with other
      dispatchCommand(el, commands["--toggle"], other);
      expect(el.hidden).toBe(true);

      // Focus should stay on other, not jump back to opener
      expect(document.activeElement).toBe(other);
    });
  });
});
