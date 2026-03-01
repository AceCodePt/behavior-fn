import { type CommandEvent } from "~registry";
import definition from "./_behavior-definition";

const { attributes, command } = definition;

export const contentSetterBehaviorFactory = (el: HTMLElement) => {
  // Store original values for toggle mode
  let originalTextContent: string | null = null;

  // Track toggle state for each attribute (true = showing value, false = showing original)
  const toggleStates = new Map<string, boolean>();

  return {
    connectedCallback() {
      // Store original textContent on connection
      originalTextContent = el.textContent;
    },

    onCommand(e: CommandEvent<string>) {
      if (!command || e.command !== command["--set-content"]) {
        return;
      }

      const targetAttribute = el.getAttribute(
        attributes["content-setter-attribute"],
      );
      const value = el.getAttribute(attributes["content-setter-value"]);
      const mode = el.getAttribute(attributes["content-setter-mode"]) || "set";

      // Validation
      if (!targetAttribute) {
        console.warn(
          `[Content Setter] Missing required attribute: ${attributes["content-setter-attribute"]}`,
        );
        return;
      }

      if (value === null) {
        console.warn(
          `[Content Setter] Missing required attribute: ${attributes["content-setter-value"]}`,
        );
        return;
      }

      // Check for invalid remove mode usage
      if (mode === "remove" && targetAttribute === "textContent") {
        console.error(
          "[Content Setter] Cannot use 'remove' mode with textContent. Use 'set' or 'toggle' mode instead.",
        );
        return;
      }

      // Determine if we're working with textContent or an attribute
      const isTextContent = targetAttribute === "textContent";

      // Handle different modes
      if (mode === "remove") {
        // Remove mode: only valid for attributes
        el.removeAttribute(targetAttribute);
      } else if (mode === "toggle") {
        // Toggle mode: switch between value and original/empty
        const currentState = toggleStates.get(targetAttribute) || false;

        if (isTextContent) {
          // Toggle textContent between value and original
          if (currentState) {
            // Currently showing value, restore original
            el.textContent = originalTextContent;
          } else {
            // Currently showing original, set to value
            el.textContent = value;
          }
        } else {
          // Toggle attribute between value and empty string
          if (currentState) {
            // Currently showing value, set to empty
            el.setAttribute(targetAttribute, "");
          } else {
            // Currently showing empty, set to value
            el.setAttribute(targetAttribute, value);
          }
        }

        // Flip the toggle state
        toggleStates.set(targetAttribute, !currentState);
      } else {
        // Set mode (default): just set the value
        if (isTextContent) {
          el.textContent = value;
        } else {
          el.setAttribute(targetAttribute, value);
        }
      }
    },
  };
};
