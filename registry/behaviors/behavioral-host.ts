import {
  defineAutoWebComponent,
  type Constructor,
  type EventInterceptors,
  type TagName,
} from "auto-wc";
import {
  ensureBehavior,
  getBehavior,
  getBehaviorDef,
  dispatchCommand,
} from "./behavior-registry";
import { parseBehaviorNames } from "./behavior-utils";

/**
 * Gets a command attribute value, supporting both hyphenated and non-hyphenated forms.
 * 
 * Both forms are first-class citizens:
 * - commandfor (native Invoker Commands API spec)
 * - command-for (alternative hyphenated form for consistency)
 * - command-by (always hyphenated)
 * - command-value (always hyphenated)
 * 
 * For command-for: We check BOTH commandfor and command-for.
 * For command-by/command-value: Hyphenated form only.
 */
function getCommandAttribute(
  element: Element,
  name: "command-for" | "command-by" | "command-value"
): string | null {
  // For command-for, support both native commandfor and hyphenated command-for
  if (name === "command-for") {
    return element.getAttribute("commandfor") || element.getAttribute("command-for");
  }
  
  // For command-by and command-value, use hyphenated form only
  return element.getAttribute(name);
}

/**
 * Validates that elements with command protocol attributes are behavioral hosts.
 */
const validateCommandAttributesRequireIs = (node: Element) => {
  if (
    !node.hasAttribute("command") &&
    !node.hasAttribute("commandfor") &&
    !node.hasAttribute("command-for") &&
    !node.hasAttribute("command-by")
  ) {
    return;
  }

  const isBehavioral = node.hasAttribute("behavior");
  const isWebComponent = node.hasAttribute("is");

  if (!isBehavioral && !isWebComponent) {
    console.error(
      `[CommandProtocol] Element with [command], [commandfor]/[command-for], or [command-by] must also have a [behavior] attribute or be a behavioral Web Component ([is="behavioral-..."]).`,
      node,
    );
  }
};

/**
 * Installs a guard that validates command attributes on all elements.
 */
let isGuardInstalled = false;
export function installCommandAttributeGuard() {
  if (isGuardInstalled) return;
  isGuardInstalled = true;

  const validateTree = (root: ParentNode) => {
    root
      .querySelectorAll("[command], [commandfor], [command-for], [command-by]")
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
    attributeFilter: ["command", "commandfor", "command-for", "command-by", "command-value", "is"],
  });
}

/**
 * Default command-by resolution based on element type.
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
  return "click";
}

/**
 * Parse a flexible attribute value into an array of trimmed strings.
 */
function parseFlexibleList(value: string | null): string[] {
  if (!value) return [];
  if (value.includes(",")) {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
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
  commandValue?: string | null,
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
    dispatchCommand(targetElement, cmd, source, commandValue);
  }
}

/**
 * Mixin that adds behavior loading and life-cycle management to an element.
 */
export function withBehaviors<
  T extends Constructor<HTMLElement & EventInterceptors>,
>(Base: T): T {
  return class extends Base {
    private _behaviors = new Map<string, any>();
    private _behaviorCleanupFns: Array<() => void> = [];
    private _commandCleanupFns: Array<() => void> = [];
    private didEnsure = false;
    private ensuringPromise = (() => {
      let resolve: () => void;
      let reject: (reason?: any) => void;
      const promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve: resolve!, reject: reject! };
    })();

    constructor(...args: any[]) {
      super(...args);
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

      if (["commandfor", "command-for", "command", "command-by", "command-value"].includes(name)) {
        this._wireCommandDispatch();
      }
    }

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
      const behaviorNames = parseBehaviorNames(behaviorAttr);

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
      this._commandCleanupFns.forEach((cleanup) => {
        cleanup();
      });
      this._commandCleanupFns = [];

      const commandFor = getCommandAttribute(this, "command-for");
      const command = this.getAttribute("command");

      if (commandFor && command) {
        const commandBy =
          getCommandAttribute(this, "command-by") || getDefaultCommandBy(this);
        const commandValue = getCommandAttribute(this, "command-value");

        const events = commandBy.split(/\s+/).filter(Boolean);

        for (const eventName of events) {
          const handler = (e: Event) => {
            if (eventName === "submit") {
              e.preventDefault();
            }
            dispatchCommands(this, commandFor, command, commandValue);
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
    new Set([...observedAttributes, "commandfor", "command", "command-by"]),
  );

  defineAutoWebComponent(
    customElementName,
    tagName,
    (base) => (factory ? withBehaviors(factory(base)) : withBehaviors(base)),
    {
      observedAttributes: allObservedAttributes,
    },
  );
}
