import { registerBehavior, dispatchCommand } from "~registry";
import definition from "./_behavior-definition";

const { attributes } = definition;

/**
 * Command behavior factory.
 * 
 * Enables any element to dispatch commands to targets.
 * Supports delay, throttle, multiple targets, and custom event triggers.
 */
export const commandBehaviorFactory = (el: HTMLElement) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastExec = 0;
  const handlers = new Map<string, EventListener>();

  const handler = (e: Event) => {
    const delayAttr = el.getAttribute(attributes["commanddelay"]);
    const throttleAttr = el.getAttribute(attributes["commandthrottle"]);
    
    e.preventDefault();
    if (e.cancelable) e.stopImmediatePropagation();

    const cmd = el.getAttribute(attributes["command"]) || el.getAttribute("command");
    const cmdFor = el.getAttribute(attributes["commandfor"]) || el.getAttribute("commandfor");
    
    if (!cmd || !cmdFor) return;

    const delay = delayAttr ? parseInt(delayAttr, 10) : 0;
    const throttle = throttleAttr ? parseInt(throttleAttr, 10) : 0;

    const execute = () => {
      // Parse space-separated targets and commands (no commas, no spaces in values)
      const targets = cmdFor.split(/\s+/).filter(Boolean);
      const commands = cmd.split(/\s+/).filter(Boolean);
      
      // Strategy: 1 target + N commands = dispatch all to target
      if (targets.length === 1 && commands.length > 1) {
        const targetEl = document.getElementById(targets[0]!);
        if (!targetEl) {
          console.warn(`[Command] Target not found: #${targets[0]}`);
          return;
        }
        commands.forEach(cmdName => dispatchCommand(targetEl, cmdName, el));
      } else {
        // N targets: map 1:1 or broadcast first command
        targets.forEach((id, i) => {
          const targetEl = document.getElementById(id);
          if (!targetEl) {
            console.warn(`[Command] Target not found: #${id}`);
            return;
          }
          const commandName = commands[i] || commands[0];
          if (commandName) {
            dispatchCommand(targetEl, commandName, el);
          }
        });
      }
    };

    // Throttle check
    if (throttle > 0) {
      const now = Date.now();
      if (now - lastExec < throttle) return;
      lastExec = now;
    }

    // Delay execution
    if (delay > 0) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(execute, delay);
    } else {
      execute();
    }
  };

  return {
    connectedCallback() {
      // Default: click for buttons/links, submit for forms
      const commandBy = el.getAttribute(attributes["commandby"]) || 
                        (el.tagName === "FORM" ? "submit" : "click");
      
      // Support space-separated events
      const events = commandBy.split(/\s+/).filter(Boolean);
      
      events.forEach(evt => {
        handlers.set(evt, handler);
        el.addEventListener(evt, handler);
      });
    },
    disconnectedCallback() {
      if (timeoutId) clearTimeout(timeoutId);
      handlers.forEach((listener, evt) => {
        el.removeEventListener(evt, listener);
      });
      handlers.clear();
    }
  };
};

registerBehavior(definition, commandBehaviorFactory);
