import definition from "./_behavior-definition";

/**
 * Auto-grow behavior factory.
 * 
 * Automatically adjusts the height of textarea elements to fit their content
 * as the user types, eliminating the need for internal scrolling.
 * 
 * Features:
 * - Validates element is a textarea (warns if not)
 * - Disables internal scrolling (overflow-y: hidden)
 * - Disables manual resize handles (resize: none)
 * - Auto-adjusts height based on scrollHeight on input
 * 
 * @param el - The element to attach the behavior to (should be textarea)
 * @returns Behavior object with lifecycle and event handlers
 */
export const autoGrowBehaviorFactory = (el: HTMLElement) => {
  // Type guard: ensure element is a textarea
  if (!(el instanceof HTMLTextAreaElement)) {
    console.warn(
      `[AutoGrow] Behavior attached to non-textarea element: <${el.tagName.toLowerCase()}>`,
    );
    return {};
  }

  return {
    /**
     * Initialize styles when the element is connected to the DOM.
     * Sets up the textarea for auto-growth by disabling scrolling and manual resize.
     */
    connectedCallback() {
      el.style.overflowY = "hidden";
      el.style.resize = "none";
    },

    /**
     * Handle input events to dynamically adjust height.
     * Uses the two-step process:
     * 1. Set height to 'auto' to allow shrinking
     * 2. Set height to scrollHeight to match content
     */
    onInput() {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    },
  };
};
