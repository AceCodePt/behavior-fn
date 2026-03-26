import {
  type BehaviorInstance,
  ensureBehavior,
  getBehavior,
  type CommandEvent,
} from "~registry";
import {
  type Constructor,
  type EventInterceptors,
  defineAutoWebComponent,
  type TagName,
} from "auto-wc";
import { parseBehaviorNames } from "./behavior-utils";

let commandAttributeGuardInstalled = false;
const shouldReportCommandContractViolations =
  typeof process === "undefined" || process.env.NODE_ENV !== "test";

function validateCommandAttributesRequireIs(el: Element): void {
  if (!(el instanceof HTMLElement)) return;

  const hasCommand = el.hasAttribute("command");
  const hasCommandFor = el.hasAttribute("commandfor");
  const hasCommandBy = el.hasAttribute("commandby");

  if (!hasCommand && !hasCommandFor && !hasCommandBy) return;

  if (!el.hasAttribute("is")) {
    if (shouldReportCommandContractViolations) {
      console.error(
        "[CommandDispatch] Element with command attributes must include an 'is' behavioral host attribute:",
        el,
      );
    }
  }

  if (hasCommand !== hasCommandFor) {
    if (shouldReportCommandContractViolations) {
      console.error(
        "[CommandDispatch] 'command' and 'commandfor' must be provided together:",
        el,
      );
    }
  }
}

function installCommandAttributeGuard(): void {
  if (commandAttributeGuardInstalled || typeof document === "undefined") return;
  commandAttributeGuardInstalled = true;

  const validateTree = (root: ParentNode) => {
    root
      .querySelectorAll("[command], [commandfor], [commandby]")
      .forEach((node) => {
        validateCommandAttributesRequireIs(node);
      });
  };

  const runInitialValidation = () => {
    validateTree(document);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runInitialValidation, {
      once: true,
    });
  } else {
    runInitialValidation();
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "attributes") {
        if (mutation.target instanceof Element) {
          validateCommandAttributesRequireIs(mutation.target);
        }
        return;
      }

      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        validateCommandAttributesRequireIs(node);
        validateTree(node);
      });
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["command", "commandfor", "commandby", "is"],
  });
}

/**
 * Default commandby resolution based on element type.
 */
function getDefaultCommandBy(el: HTMLElement): string {
  if (el instanceof HTMLButtonElement) return "click";
  if (el instanceof HTMLFormElement) return "submit";
  if (el instanceof HTMLSelectElement) return "change";
  if (el instanceof HTMLInputElement) {
    const discrete = new Set([
      "checkbox",
      "radio",
      "file",
      "date",
      "time",
      "datetime-local",
      "month",
      "week",
    ]);
    return discrete.has(el.type) ? "change" : "input";
  }
  if (el instanceof HTMLTextAreaElement) return "input";
  return "click"; // everything else (div, span, a, output, etc.)
}

/**
 * Parse a flexible attribute value into an array of trimmed strings.
 * Supports: single value, comma-separated, space-separated.
 */
function parseFlexibleList(value: string | null): string[] {
  if (!value) return [];
  // If it contains commas, split by comma
  if (value.includes(",")) {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  // Otherwise split by whitespace
  return value.split(/\s+/).filter(Boolean);
}

/**
 * Validate command mapping between targets and commands.
 */
function isValidCommandMapping(
  targetCount: number,
  commandCount: number,
): boolean {
  return targetCount <= 1 || commandCount <= 1 || targetCount === commandCount;
}

/**
 * Dispatch commands from a source element to target elements.
 */
function dispatchCommands(
  source: HTMLElement,
  commandfor: string,
  command: string,
): void {
  const targetIds = parseFlexibleList(commandfor);
  const commands = parseFlexibleList(command);

  const targetCount = targetIds.length;
  const commandCount = commands.length;

  if (!isValidCommandMapping(targetCount, commandCount)) {
    console.error(
      `[CommandDispatch] Invalid command mapping on element:`,
      source,
      `${targetCount} targets but ${commandCount} commands. Use single command for broadcast or match counts exactly.`,
    );
    return;
  }

  let dispatchPlan: Array<{ targetId: string; command: string }> = [];

  if (targetCount <= 1) {
    const targetId = targetIds[0];
    if (targetId) {
      dispatchPlan = commands.map((cmd) => ({ targetId, command: cmd }));
    }
  } else if (commandCount <= 1) {
    const cmd = commands[0];
    if (cmd) {
      dispatchPlan = targetIds.map((targetId) => ({ targetId, command: cmd }));
    }
  } else {
    dispatchPlan = targetIds.map((targetId, i) => ({
      targetId,
      command: commands[i]!,
    }));
  }

  for (const { targetId, command: cmd } of dispatchPlan) {
    const targetElement = document.getElementById(targetId);
    if (!targetElement) {
      console.warn(`[CommandDispatch] Target not found: ${targetId}`);
      continue;
    }

    const baseEvent = new Event("command", {
      bubbles: true,
      cancelable: true,
      composed: true,
    });

    const event = baseEvent as CommandEvent<string>;

    Object.defineProperty(event, "command", {
      value: cmd,
      writable: false,
      enumerable: true,
      configurable: false,
    });

    Object.defineProperty(event, "source", {
      value: source,
      writable: false,
      enumerable: true,
      configurable: false,
    });

    targetElement.dispatchEvent(event);
  }
}

/**
 * Mixin that adds behavior support to a base class.
 */
export function withBehaviors<
  T extends Constructor<HTMLElement & EventInterceptors>,
>(Base: T) {
  return class extends Base {
    private didEnsure = false;
    private ensuringPromise = Promise.withResolvers();
    private _behaviors = new Map<string, BehaviorInstance>();
    private _behaviorCleanupFns: Array<() => void> = [];
    private _commandCleanupFns: Array<() => void> = [];

    constructor(...args: any[]) {
      super(...args);
      this.ensuringPromise.promise.then(() => {
        this.didEnsure = true;
      });
    }

    override connectedCallback() {
      super.connectedCallback?.();
      this._registerBehaviors();
      this._ensured(() => {
        this._wireCommandDispatch();
      });
    }

    override attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ): void {
      super.attributeChangedCallback?.(name, oldValue, newValue);
      this._ensured(() => {
        for (const behavior of this._behaviors.values()) {
          behavior.attributeChangedCallback?.(name, oldValue, newValue);
        }
      });

      if (["commandfor", "command", "commandby"].includes(name)) {
        this._wireCommandDispatch();
      }
    }

    /* 
      This function is to allow for both sync and async manner to run
    */
    _ensured(fn: () => void) {
      if (this.didEnsure) {
        return fn();
      }
      return this.ensuringPromise.promise.then(fn);
    }

    override disconnectedCallback() {
      super.disconnectedCallback?.();

      this._ensured(() => {
        for (const behavior of this._behaviors.values()) {
          behavior.disconnectedCallback?.();
        }
        this._behaviors.clear();
        this._behaviorCleanupFns.forEach((cleanup) => {
          cleanup();
        });
        this._behaviorCleanupFns = [];
        this._commandCleanupFns.forEach((cleanup) => {
          cleanup();
        });
        this._commandCleanupFns = [];
      });
    }

    private async _registerBehaviors() {
      const behaviorAttr = this.getAttribute("behavior");
      // Parse behavior names using the canonical parser
      // This ensures consistency with auto-loader.ts
      const behaviorNames = parseBehaviorNames(behaviorAttr);

      // This needs explanation.
      // First iteration - if all of the behavior exists (non-promise from ensureBehavior)
      // Then just changed the nesured to true
      // Why? Both testing an runtime are reasonable to assume that changes will happen
      // in the first iteration where the behaviors exists.
      const promises = behaviorNames.map(ensureBehavior).filter(Boolean);
      if (promises.length === 0) {
        this.didEnsure = true;
      } else {
        Promise.all(promises).then(
          this.ensuringPromise.resolve,
          this.ensuringPromise.reject,
        );
      }

      this._ensured(() => {
        behaviorNames.forEach((name) => {
          const factory = getBehavior(name);
          if (factory) {
            const behavior = factory(this);
            this._behaviors.set(name, behavior);
            behavior.connectedCallback?.();

            Object.keys(behavior).forEach((prop) => {
              const key = prop as keyof typeof behavior;
              if (/^on[A-Z]/.test(key) && typeof behavior[key] === "function") {
                const eventName = key.substring(2).toLowerCase();
                const handler = behavior[key].bind(behavior) as EventListener;
                this.addEventListener(eventName, handler);
                this._behaviorCleanupFns.push(() => {
                  this.removeEventListener(eventName, handler);
                });
              }
            });
          }
        });
      });
    }

    private _wireCommandDispatch() {
      // Clean up existing command listeners
      this._commandCleanupFns.forEach((cleanup) => {
        cleanup();
      });
      this._commandCleanupFns = [];

      const commandfor = this.getAttribute("commandfor");
      const command = this.getAttribute("command");

      if (commandfor && command) {
        const commandby =
          this.getAttribute("commandby") || getDefaultCommandBy(this);

        // Support multiple commandby events (space-separated)
        const events = commandby.split(/\s+/).filter(Boolean);

        for (const eventName of events) {
          const handler = (e: Event) => {
            // For forms, we usually want to prevent default if it's a command
            if (eventName === "submit") {
              e.preventDefault();
            }
            dispatchCommands(this, commandfor, command);
          };
          this.addEventListener(eventName, handler);
          this._commandCleanupFns.push(() => {
            this.removeEventListener(eventName, handler);
          });
        }
      }
    }
  };
}

/**
 * Defines a behavioral host custom element.
 * @param tagName The HTML tag name to extend (e.g., 'div', 'button').
 * @param name Optional custom element name. Defaults to `behavioral-${tagName}`.
 */
export function defineBehavioralHost<K extends TagName>(
  tagName: K,
  name?: string,
  observedAttributes: string[] = [],
  factory?: <T extends Constructor<HTMLElement & EventInterceptors>>(
    Base: T,
  ) => T,
) {
  installCommandAttributeGuard();

  const customElementName = name || `behavioral-${tagName}`;

  if (customElements.get(customElementName)) {
    return;
  }

  const allObservedAttributes = Array.from(
    new Set([...observedAttributes, "commandfor", "command", "commandby"]),
  );

  // Define the component using auto-wc
  defineAutoWebComponent(
    customElementName,
    tagName,
    (base) => (factory ? withBehaviors(factory(base)) : withBehaviors(base)),
    {
      observedAttributes: allObservedAttributes,
    },
  );
}
