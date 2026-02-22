import { type BehaviorInstance, ensureBehavior, getBehavior } from "~registry";
import {
  type Constructor,
  type EventInterceptors,
  defineAutoWebComponent,
  type TagName,
} from "auto-wc";

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

    constructor(...args: any[]) {
      super(...args);
      this.ensuringPromise.promise.then(() => {
        this.didEnsure = true;
      });
    }

    override connectedCallback() {
      super.connectedCallback?.();
      this._registerBehaviors();
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
      });
    }

    private async _registerBehaviors() {
      const behaviorAttr = this.getAttribute("behavior");
      const behaviorNames = behaviorAttr
        ? behaviorAttr
            // Remvoe all none important charachters
            .replace(/[^a-zA-Z- ,]/, "")
            // Split in any fashion that groups charachters with -
            .split(/[^a-zA-z-]+/)
            .filter(Boolean)
        : [];

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
) {
  const customElementName = name || `behavioral-${tagName}`;

  if (customElements.get(customElementName)) {
    return;
  }

  // Define the component using auto-wc
  defineAutoWebComponent(customElementName, tagName, withBehaviors, {
    observedAttributes: observedAttributes,
  });
}
