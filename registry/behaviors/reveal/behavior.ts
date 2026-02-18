import {
  registerBehavior,
  type BehaviorInstance,
  type CommandEvent,
} from "~registry";
import REVEAL_DEFINITION from "./_behavior-definition";

interface RevealProps {
  "reveal-delay"?: string;
  "reveal-duration"?: string;
  "reveal-anchor"?: string;
  "reveal-auto"?: string;
  "reveal-when-target"?: string;
  "reveal-when-attribute"?: string;
  "reveal-when-value"?: string;
}

export const revealBehaviorFactory = (el: HTMLElement) => {
  const isPopover = () => el.hasAttribute("popover");
  const isDialog = () => el instanceof HTMLDialogElement;

  let currentProps: RevealProps | undefined;
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

  const applyStyles = (props: RevealProps) => {
    currentProps = props;
    if (props["reveal-delay"]) {
      el.style.setProperty("--reveal-delay", props["reveal-delay"]);
    }
    if (props["reveal-duration"]) {
      el.style.setProperty("--reveal-duration", props["reveal-duration"]);
    }
    if (props["reveal-anchor"]) {
      setupAnchoring(props["reveal-anchor"]);
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
    if (!currentProps?.["reveal-auto"]) return;
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

  const setupAttributeWatcher = (props: RevealProps) => {
    const targetSelector = props["reveal-when-target"];
    const attribute = props["reveal-when-attribute"];
    const value = props["reveal-when-value"];

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

  const observer = new MutationObserver((mutations) => {
    let shouldSyncAria = false;
    let shouldSyncPopover = false;

    for (const mutation of mutations) {
      if (mutation.type === "attributes") {
        if (
          mutation.attributeName === "hidden" ||
          mutation.attributeName === "open"
        ) {
          shouldSyncAria = true;
        }
      } else {
        shouldSyncPopover = true;
      }
    }

    if (shouldSyncAria) syncAria();
    if (shouldSyncPopover) syncPopover();
  });

  return {
    connectedCallback(this: BehaviorInstance<RevealProps>) {
      currentProps = this.props;
      observer.observe(el, {
        attributes: true,
        attributeFilter: ["hidden", "open"],
        childList: true,
        characterData: true,
        subtree: true,
      });
      if (isPopover()) {
        el.addEventListener("toggle", onToggle);
      } else if (isDialog()) {
        el.addEventListener("close", onToggle);
      }
      if (this.props) {
        applyStyles(this.props);
        setupAttributeWatcher(this.props);
      }
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
    attributeChangedCallback(this: BehaviorInstance<RevealProps>) {
      if (this.props) {
        applyStyles(this.props);
        syncPopover();
        // Re-setup attribute watcher if config changed
        attributeObserver?.disconnect();
        setupAttributeWatcher(this.props);
      }
    },
    onCommand(
      this: BehaviorInstance<RevealProps>,
      e: CommandEvent<keyof typeof REVEAL_DEFINITION.command>,
    ) {
      const cmd = REVEAL_DEFINITION.command;
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

registerBehavior(REVEAL_DEFINITION.name, revealBehaviorFactory);
