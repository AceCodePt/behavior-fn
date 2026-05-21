import { registerBehavior } from "~registry";
import definition from "./_behavior-definition";

const { attributes } = definition;

/**
 * Command behavior factory.
 * 
 * Provides advanced control (delay, throttle) over the standard Command Protocol.
 * Leverages the core 'command', 'commandfor', and 'command-by' attributes.
 */
export const commandBehaviorFactory = (el: HTMLElement) => {
  let timeoutId: any = null;
  let lastExec = 0;

  const handler = (e: Event) => {
    const delayAttr = el.getAttribute(attributes["command-delay"]);
    const throttleAttr = el.getAttribute(attributes["command-throttle"]);
    
    // If no advanced features are needed, let the core handle it.
    if (!delayAttr && !throttleAttr) return;

    // We have advanced features, so we take over.
    e.stopImmediatePropagation();

    const cmd = el.getAttribute(attributes["command-value"]) || el.getAttribute("command");
    const cmdFor = el.getAttribute(attributes["command-for"]) || el.getAttribute("commandfor");
    if (!cmd || !cmdFor) return;

    const delay = delayAttr ? parseInt(delayAttr, 10) : 0;
    const throttle = throttleAttr ? parseInt(throttleAttr, 10) : 0;

    const execute = () => {
      import("~registry").then(({ dispatchCommand }) => {
        const targets = cmdFor.split(/[\s,]+/).filter(Boolean);
        const commands = cmd.split(/[\s,]+/).filter(Boolean);
        
        targets.forEach((id, i) => {
          const targetEl = document.getElementById(id);
          const commandName = commands[i] || commands[0];
          if (targetEl && commandName) {
            dispatchCommand(targetEl, commandName, el);
          }
        });
      });
    };

    if (throttle > 0) {
      const now = Date.now();
      if (now - lastExec < throttle) return;
      lastExec = now;
    }

    if (delay > 0) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(execute, delay);
    } else {
      execute();
    }
  };

  return {
    connectedCallback() {
      const commandBy = el.getAttribute("command-by") || (el.tagName === "FORM" ? "submit" : "click");
      const events = commandBy.split(/\s+/).filter(Boolean);
      
      events.forEach(evt => el.addEventListener(evt, handler));
    },
    disconnectedCallback() {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };
};

registerBehavior(definition, commandBehaviorFactory);
