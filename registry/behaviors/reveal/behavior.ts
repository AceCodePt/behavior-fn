import { type CommandEvent } from "~registry";
import definition from "./_behavior-definition";
import { REVEAL_ATTRS } from "./constants";

const { command: REVEAL_COMMANDS } = definition;

export const revealBehaviorFactory = (el: HTMLElement) => {
  const isPopover = () => el.hasAttribute("popover");
  const isDialog = () => el instanceof HTMLDialogElement;

  let openerElement: HTMLElement | null = null;

  const isCurrentlyVisible = () => {
    if (isPopover()) return el.matches(":popover-open");
    if (isDialog()) return (el as HTMLDialogElement).open;
    return !el.hidden;
  };

  const restoreFocus = () => {
    if (
      openerElement &&
      document.contains(openerElement) &&
      !el.contains(openerElement)
    ) {
      openerElement.focus();
    }
    openerElement = null;
  };

  const applyStyles = () => {
    const revealDelay = el.getAttribute(REVEAL_ATTRS.DELAY);
    const revealDuration = el.getAttribute(REVEAL_ATTRS.DURATION);
    const revealAnchor = el.getAttribute(REVEAL_ATTRS.ANCHOR);
    if (revealDelay) {
      el.style.setProperty("--reveal-delay", revealDelay);
    }
    if (revealDuration) {
      el.style.setProperty("--reveal-duration", revealDuration);
    }
    if (revealAnchor) {
      setupAnchoring(revealAnchor);
    }
  };

  const setupAnchoring = (anchorId: string) => {
    const anchorEl = document.getElementById(anchorId);
    if (!anchorEl) {
      console.warn(`[Reveal] Anchor not found: ${anchorId}`);
      return;
    }

    // Use the popover's ID to create a unique anchor name for this specific relationship
    // or reuse the existing one if already set
    let uniqueName = el.style.getPropertyValue("position-anchor").trim();
    if (!uniqueName || !uniqueName.startsWith("--anchor-")) {
      uniqueName = `--anchor-${el.id || Math.random().toString(36).slice(2, 9)}`;
      el.style.setProperty("position-anchor", uniqueName);
    }

    // Add the unique name to the anchor element's anchor-name list
    const currentNames = anchorEl.style
      .getPropertyValue("anchor-name")
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);

    if (!currentNames.includes(uniqueName)) {
      currentNames.push(uniqueName);
      anchorEl.style.setProperty("anchor-name", currentNames.join(", "));
    }
  };

  const syncPopover = () => {
    if (!el.hasAttribute("reveal-auto")) return;
    if (!isPopover()) return;

    const hasContent = el.innerHTML.trim().length > 0;

    if (hasContent) {
      if (!el.matches(":popover-open")) {
        try {
          if ("showPopover" in el && typeof el.showPopover === "function") {
            el.showPopover();
          }
        } catch (e) {
          console.warn("[Reveal] Failed to auto-show popover:", e);
        }
      }
    } else {
      if (el.matches(":popover-open")) {
        try {
          if ("hidePopover" in el && typeof el.hidePopover === "function") {
            el.hidePopover();
          }
        } catch (e) {
          // Ignore
        }
      }
    }
  };

  const syncAria = () => {
    if (!el.id) {
      return;
    }
    let isVisible = false;
    if (isPopover()) {
      isVisible = el.matches(":popover-open");
    } else if (isDialog()) {
      isVisible = (el as HTMLDialogElement).open;
    } else {
      isVisible = !el.hidden;
    }

    const triggers = document.querySelectorAll(`[commandfor="${el.id}"]`);
    triggers.forEach((trigger) => {
      trigger.setAttribute("aria-expanded", isVisible ? "true" : "false");
      if (!trigger.hasAttribute("aria-controls")) {
        trigger.setAttribute("aria-controls", el.id);
      }
    });
  };

  const onToggle = () => {
    syncAria();

    // Handle focus restoration for popovers and dialogs
    if (isPopover()) {
      if (!el.matches(":popover-open")) {
        restoreFocus();
      }
    } else if (isDialog()) {
      if (!(el as HTMLDialogElement).open) {
        restoreFocus();
      }
    }
  };

  let attributeObserver: MutationObserver | null = null;

  const setupAttributeWatcher = () => {
    const targetSelector = el.getAttribute(REVEAL_ATTRS.WHEN_TARGET);
    const attribute = el.getAttribute(REVEAL_ATTRS.WHEN_ATTRIBUTE);
    const value = el.getAttribute(REVEAL_ATTRS.WHEN_VALUE);

    // Only set up if all three are provided
    if (!targetSelector || !attribute || !value) return;

    const targetEl = document.querySelector(targetSelector);
    if (!targetEl) {
      console.warn(`[Reveal] Watch target not found: ${targetSelector}`);
      return;
    }

    const checkAndToggle = () => {
      const currentValue = targetEl.getAttribute(attribute);

      if (currentValue === value) {
        // Show element
        if (isPopover()) {
          el.showPopover?.();
        } else if (isDialog()) {
          (el as HTMLDialogElement).showModal();
        } else {
          el.removeAttribute("hidden");
        }
      } else {
        // Hide element
        if (isPopover()) {
          el.hidePopover?.();
        } else if (isDialog()) {
          (el as HTMLDialogElement).close();
        } else {
          el.setAttribute("hidden", "");
        }
      }
    };

    // Initial check
    checkAndToggle();

    // Watch for attribute changes
    attributeObserver = new MutationObserver(checkAndToggle);
    attributeObserver.observe(targetEl, {
      attributes: true,
      attributeFilter: [attribute],
    });
  };

  const observer = new MutationObserver(() => {
    syncPopover();
  });

  return {
    connectedCallback() {
      observer.observe(el, {
        childList: true,
        characterData: true,
        subtree: true,
      });
      if (isPopover()) {
        el.addEventListener("toggle", onToggle);
      } else if (isDialog()) {
        el.addEventListener("close", onToggle);
      }
      applyStyles();
      setupAttributeWatcher();
      syncAria();
      syncPopover();
    },
    disconnectedCallback() {
      observer.disconnect();
      attributeObserver?.disconnect();
      if (isPopover()) {
        el.removeEventListener("toggle", onToggle);
      } else if (isDialog()) {
        el.removeEventListener("close", onToggle);
      }
    },
    attributeChangedCallback(
      name: string,
      _oldValue: string | null,
      _newValue: string | null,
    ) {
      if (
        name === "reveal-delay" ||
        name === "reveal-duration" ||
        name === "reveal-anchor"
      ) {
        applyStyles();
      }

      if (name === "reveal-auto") {
        syncPopover();
      }

      if (name === "hidden" || name === "open" || name === "popover") {
        syncAria();
      }

      if (
        name === "reveal-when-target" ||
        name === "reveal-when-attribute" ||
        name === "reveal-when-value"
      ) {
        attributeObserver?.disconnect();
        setupAttributeWatcher();
      }
    },
    onCommand(e: CommandEvent<keyof typeof REVEAL_COMMANDS>) {
      const cmd = REVEAL_COMMANDS;
      const popover = isPopover();
      const dialog = isDialog();

      if (e.command === cmd["--show"]) {
        if (e.source instanceof HTMLElement) {
          openerElement = e.source;
        }
        if (popover) {
          el.showPopover?.();
        } else if (dialog) {
          (el as HTMLDialogElement).showModal();
        } else {
          el.removeAttribute("hidden");
        }
      } else if (e.command === cmd["--hide"]) {
        if (popover) {
          el.hidePopover?.();
        } else if (dialog) {
          (el as HTMLDialogElement).close();
        } else {
          el.setAttribute("hidden", "");
          restoreFocus();
        }
      } else if (e.command === cmd["--toggle"]) {
        const currentlyVisible = isCurrentlyVisible();
        if (!currentlyVisible && e.source instanceof HTMLElement) {
          openerElement = e.source;
        } else if (currentlyVisible) {
          openerElement = null;
        }

        if (popover) {
          if (el.matches(":popover-open")) {
            el.hidePopover?.();
          } else {
            el.showPopover?.();
          }
        } else if (dialog) {
          const d = el as HTMLDialogElement;
          if (d.open) {
            d.close();
          } else {
            d.showModal();
          }
        } else {
          if (el.hasAttribute("hidden")) {
            el.removeAttribute("hidden");
          } else {
            el.setAttribute("hidden", "");
            restoreFocus();
          }
        }
      }
    },
  };
};
