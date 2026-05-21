import { registerBehavior } from "~registry";
import definition from './_behavior-definition';

const { attributes } = definition;

/**
 * No-propagate behavior factory.
 *
 * Stops specified events from bubbling up the DOM tree.
 * Useful for nested interactive elements where the parent also has a click handler.
 *
 * Attributes:
 * - no-propagate-events: Comma-separated list of events to stop (defaults to 'click')
 *
 * @param el - The element to attach the behavior to
 * @returns Behavior object with lifecycle and event handlers
 */
export const noPropagateBehaviorFactory = (el: HTMLElement) => {
  const getEvents = () => {
    const attr = el.getAttribute(attributes['no-propagate-events']);
    if (!attr) {
      return ['click'];
    }

    try {
      const parsed = JSON.parse(attr);
      if (Array.isArray(parsed)) {
        return parsed.map((s) => String(s).trim()).filter(Boolean);
      }
    } catch {
      // Not JSON, fall back to comma-separated
    }

    return attr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const handler = (e: Event) => {
    e.stopPropagation();
  };

  let activeEvents: string[] = [];

  const updateListeners = () => {
    const newEvents = getEvents();
    // Check if events actually changed
    if (
      activeEvents.length === newEvents.length &&
      activeEvents.every((val, index) => val === newEvents[index])
    ) {
      return;
    }

    // Remove old
    activeEvents.forEach((evt) => el.removeEventListener(evt, handler));
    // Add new
    activeEvents = newEvents;
    activeEvents.forEach((evt) => el.addEventListener(evt, handler));
  };

  return {
    connectedCallback() {
      updateListeners();
    },
    disconnectedCallback() {
      activeEvents.forEach((evt) => el.removeEventListener(evt, handler));
    },
    attributeChangedCallback(name: string) {
      if (name === attributes['no-propagate-events']) {
        updateListeners();
      }
    },
  };
};

registerBehavior(definition, noPropagateBehaviorFactory);
