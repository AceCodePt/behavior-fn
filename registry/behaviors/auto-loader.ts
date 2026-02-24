import { defineBehavioralHost } from "./behavioral-host";
import { getBehavior } from "./behavior-registry";
import { parseBehaviorNames } from "./behavior-utils";

/**
 * Opt-in utility that automatically adds `is="behavioral-*"` attributes
 * to elements with `behavior` attributes.
 *
 * This eliminates the need for manual `is` attribute declaration while
 * maintaining the explicit, predictable core architecture.
 *
 * **Behavior-Based Host Pattern:**
 * - The `is` attribute describes **behaviors**, not tag types
 * - Multiple tag types can share the same behavioral host
 * - Example: `<button behavior="reveal">` and `<dialog behavior="reveal">`
 *   both use `is="behavioral-reveal"`
 *
 * **Tradeoffs:**
 * - ✅ Cleaner HTML syntax
 * - ✅ Closer to Alpine.js/HTMX patterns
 * - ⚠️ Adds ~2KB + MutationObserver overhead
 * - ⚠️ Less explicit (harder to debug)
 * - ⚠️ May have timing issues with dynamic UIs
 *
 * **Recommendation:** Use explicit `is` attributes for production apps.
 * Use auto-loader for prototypes or content-heavy sites where DX > explicitness.
 *
 * @returns Cleanup function to disconnect the observer
 *
 * @example
 * ```typescript
 * import { enableAutoLoader } from './behaviors/auto-loader';
 *
 * // Enable auto-loader
 * const disconnect = enableAutoLoader();
 *
 * // Later, if needed
 * disconnect();
 * ```
 *
 * @example
 * ```html
 * <!-- Before auto-loader -->
 * <button behavior="reveal">Toggle</button>
 *
 * <!-- After enableAutoLoader() processes the DOM -->
 * <button is="behavioral-reveal" behavior="reveal">Toggle</button>
 * ```
 */
export function enableAutoLoader(): () => void {
  // Track processed elements to prevent duplicate work
  const processedElements = new WeakSet<Element>();

  // Track registered behavioral hosts to avoid duplicate registration
  const registeredHosts = new Set<string>();

  /**
   * Process a single element with a behavior attribute.
   *
   * Note: Once an element is upgraded with an `is` attribute, it cannot be
   * re-upgraded. This is a fundamental limitation of Custom Elements.
   * Therefore, changing the `behavior` attribute after initial processing
   * will not update the behavioral host.
   */
  function processElement(element: Element): void {
    // Skip if already processed
    if (processedElements.has(element)) {
      return;
    }

    // Only process HTMLElements (not SVGElement, etc.)
    if (!(element instanceof HTMLElement)) {
      return;
    }

    // Skip if element already has an explicit `is` attribute
    // (either user-defined or previously set by auto-loader)
    if (element.hasAttribute("is")) {
      processedElements.add(element);
      return;
    }

    // Explicit check: element MUST have behavior attribute
    if (!element.hasAttribute("behavior")) {
      processedElements.add(element);
      return;
    }

    const behaviorAttr = element.getAttribute("behavior");

    // Parse behavior names using the canonical parser
    // This ensures consistency with behavioral-host.ts
    const behaviors = parseBehaviorNames(behaviorAttr);

    // Skip if no valid behaviors
    if (behaviors.length === 0) {
      processedElements.add(element);
      return;
    }

    // Create custom element name from sorted behaviors
    const customElementName = `behavioral-${behaviors.join("-")}`;

    // Get the tag name for registration
    const tagName = element.tagName.toLowerCase();

    // Check if this behavioral host is already registered
    if (!registeredHosts.has(customElementName)) {
      // Check if already registered in customElements
      if (!customElements.get(customElementName)) {
        // Collect observed attributes from all behaviors
        const observedAttributes: string[] = [];
        let hasUnknownBehavior = false;

        for (const behaviorName of behaviors) {
          const behaviorFactory = getBehavior(behaviorName);

          if (!behaviorFactory) {
            console.warn(
              `[AutoLoader] Unknown behavior "${behaviorName}" on element:`,
              element,
            );
            hasUnknownBehavior = true;
            continue;
          }

          // Try to get the behavior definition to extract schema
          // Note: We need to create a temporary element to get the factory
          // But we can't call the factory without an element
          // So we'll try to import the schema directly if available

          // For now, we'll register without observed attributes
          // The behavioral host will handle attribute observation through withBehaviors
        }

        // Register the behavioral host
        // Note: We pass an empty array for observedAttributes since withBehaviors
        // will handle attribute observation dynamically
        try {
          defineBehavioralHost(
            tagName as any,
            customElementName,
            observedAttributes,
          );
          registeredHosts.add(customElementName);
        } catch (error) {
          console.error(
            `[AutoLoader] Failed to register behavioral host "${customElementName}":`,
            error,
          );
          processedElements.add(element);
          return;
        }
      } else {
        registeredHosts.add(customElementName);
      }
    }

    // Replace the element with a properly upgraded custom element
    // This is necessary because the `is` attribute must be present at element creation time
    // to properly upgrade customized built-in elements.
    //
    // Note: This will break JavaScript references captured before auto-loader runs.
    // For CDN usage, either:
    // 1. Don't reference elements in JavaScript (use pure declarative approach)
    // 2. Query elements AFTER window load event (after auto-loader completes)
    try {
      // Create a new element with the `is` attribute from the start
      const newElement = document.createElement(tagName, {
        is: customElementName,
      });

      // Preserve ALL attributes from the original element
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        // Copy all attributes including behavior, id, class, data-*, etc.
        // The `is` attribute is already set via createElement options
        if (attr.name !== "is") {
          newElement.setAttribute(attr.name, attr.value);
        }
      }

      // Move all child nodes (preserves event listeners on children)
      while (element.firstChild) {
        newElement.appendChild(element.firstChild);
      }

      // Replace the old element with the upgraded element in the DOM
      if (element.parentNode) {
        element.parentNode.replaceChild(newElement, element);

        // Mark the NEW element as processed (not the old one)
        processedElements.add(newElement);

        console.log(
          `[AutoLoader] ✅ Upgraded <${tagName}#${newElement.id || "(no id)"}> to ${customElementName}`,
        );
      } else {
        // Element is not in the DOM yet, just mark it as processed
        // and set the is attribute (fallback, shouldn't normally happen)
        element.setAttribute("is", customElementName);
        processedElements.add(element);

        console.warn(
          `[AutoLoader] Element not in DOM, falling back to setAttribute:`,
          element,
        );
      }
    } catch (error) {
      console.error(
        `[AutoLoader] ❌ Failed to upgrade element:`,
        element,
        error,
      );

      // Fallback: just set the attribute (won't properly upgrade, but better than nothing)
      element.setAttribute("is", customElementName);
      processedElements.add(element);
    }
  }

  /**
   * Process all elements in a node tree.
   */
  function processTree(node: Node): void {
    if (!(node instanceof Element)) {
      return;
    }

    // Process the node itself
    processElement(node);

    // Process all descendants with behavior attribute
    const elements = node.querySelectorAll("[behavior]");
    for (let i = 0; i < elements.length; i++) {
      processElement(elements[i]);
    }
  }

  // Process existing elements in the DOM
  processTree(document.documentElement);

  // Set up MutationObserver to watch for new elements
  // Note: We don't observe behavior attribute changes because Custom Elements
  // cannot be re-upgraded once they have an `is` attribute.
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Process added nodes
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        processTree(mutation.addedNodes[i]);
      }
    }
  });

  // Start observing
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  // Return cleanup function
  return () => {
    observer.disconnect();
  };
}
