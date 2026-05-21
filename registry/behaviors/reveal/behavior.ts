import { type CommandEvent, registerBehavior } from "~registry";
import definition from "./_behavior-definition";

const { attributes, command } = definition;

export const revealBehaviorFactory = (el: HTMLElement) => {
  const isPopover = () => el.hasAttribute("popover");
  const isDialog = () => el instanceof HTMLDialogElement;

  const updateState = () => {
    const isVisible = isPopover() ? el.matches(":popover-open") : isDialog() ? (el as HTMLDialogElement).open : !el.hidden;
    el.setAttribute("reveal-state", isVisible ? "open" : "closed");
    
    // ARIA sync
    if (el.id) {
      document.querySelectorAll(`[commandfor="${el.id}"]`).forEach(btn => {
        btn.setAttribute("aria-expanded", isVisible ? "true" : "false");
        btn.setAttribute("aria-controls", el.id);
      });
    }
  };

  const setupAnchoring = () => {
    const anchorId = el.getAttribute(attributes["reveal-anchor"]);
    if (!anchorId) return;
    const anchorEl = document.getElementById(anchorId);
    if (!anchorEl) return;

    let uniqueName = el.style.getPropertyValue("position-anchor").trim();
    if (!uniqueName || !uniqueName.startsWith("--anchor-")) {
      uniqueName = `--anchor-${el.id || Math.random().toString(36).slice(2, 9)}`;
      el.style.setProperty("position-anchor", uniqueName);
    }
    const current = anchorEl.style.getPropertyValue("anchor-name").split(",").map(n => n.trim());
    if (!current.includes(uniqueName)) {
      current.push(uniqueName);
      anchorEl.style.setProperty("anchor-name", current.filter(Boolean).join(", "));
    }
  };

  return {
    connectedCallback() {
      updateState();
      setupAnchoring();
      if (isPopover()) el.addEventListener("toggle", updateState);
      else if (isDialog()) el.addEventListener("close", updateState);
    },
    disconnectedCallback() {
      if (isPopover()) el.removeEventListener("toggle", updateState);
      else if (isDialog()) el.removeEventListener("close", updateState);
    },
    onCommand(e: CommandEvent<string>) {
      if (!command) return;
      const cmd = e.command;

      if (cmd === command["show"]) {
        if (isPopover()) el.showPopover?.();
        else if (isDialog()) (el as HTMLDialogElement).showModal();
        else el.hidden = false;
      } else if (cmd === command["hide"]) {
        if (isPopover()) el.hidePopover?.();
        else if (isDialog()) (el as HTMLDialogElement).close();
        else el.hidden = true;
      } else if (cmd === command["toggle"]) {
        if (isPopover()) el.matches(":popover-open") ? el.hidePopover?.() : el.showPopover?.();
        else if (isDialog()) {
          const d = el as HTMLDialogElement;
          d.open ? d.close() : d.showModal();
        } else el.hidden = !el.hidden;
      }
      updateState();
    },
  };
};

registerBehavior(definition, revealBehaviorFactory);
