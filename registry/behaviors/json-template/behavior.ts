import { JSON_TEMPLATE_ATTRS } from "./constants";

/**
 * Resolves a path in a data object using dot notation and bracket notation.
 * 
 * Examples:
 * - "name" → data.name
 * - "user.profile.name" → data.user.profile.name
 * - "items[0].title" → data.items[0].title
 * - "users[1].address.city" → data.users[1].address.city
 * - "obj['name']" → data.obj.name
 * - "obj[\"name\"]" → data.obj.name
 * - "user['first-name']" → data.user["first-name"]
 * - "user['email.address']" → data.user["email.address"] (dot inside brackets preserved)
 */
function resolvePath(data: unknown, path: string): unknown {
  if (!path || path.trim() === "") return undefined;

  // Smart split: split by dots, but preserve content inside brackets
  // We need to handle: user.items[0].name and user['first-name'].items[0]['item-name']
  const parts: string[] = [];
  let currentPart = "";
  let insideBrackets = 0;
  let insideQuote = "";

  for (let i = 0; i < path.length; i++) {
    const char = path[i];

    if (char === "[" && !insideQuote) {
      insideBrackets++;
      currentPart += char;
    } else if (char === "]" && !insideQuote) {
      insideBrackets--;
      currentPart += char;
    } else if ((char === '"' || char === "'") && insideBrackets > 0) {
      if (!insideQuote) {
        insideQuote = char;
      } else if (insideQuote === char) {
        insideQuote = "";
      }
      currentPart += char;
    } else if (char === "." && insideBrackets === 0) {
      // Dot outside brackets - this is a separator
      if (currentPart) {
        parts.push(currentPart);
        currentPart = "";
      }
    } else {
      currentPart += char;
    }
  }

  // Push the last part
  if (currentPart) {
    parts.push(currentPart);
  }

  let current: unknown = data;

  for (let part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // Handle multiple bracket notations in a single part
    // Example: items[0]['item-title'] needs to be processed as:
    // 1. Access 'items'
    // 2. Access [0]
    // 3. Access ['item-title']
    
    // Extract property name before any brackets (if exists)
    const beforeBrackets = part.match(/^([^[]+)(?=\[)/);
    if (beforeBrackets) {
      const propName = beforeBrackets[1];
      if (typeof current === "object" && propName in current) {
        current = (current as Record<string, unknown>)[propName];
        // Remove the property name from the part, leaving only brackets
        part = part.slice(propName.length);
      } else {
        return undefined;
      }
    }

    // Now process all bracket notations in sequence
    // Match all brackets: [0], ['name'], ["name"]
    const bracketMatches = part.matchAll(/\[(['"]?)(.+?)\1\]/g);
    
    for (const match of bracketMatches) {
      if (current === null || current === undefined) {
        return undefined;
      }

      const quote = match[1];
      const keyOrIndex = match[2];

      if (quote) {
        // Quoted property access: obj["name"] or obj['name']
        if (typeof current === "object" && keyOrIndex in current) {
          current = (current as Record<string, unknown>)[keyOrIndex];
        } else {
          return undefined;
        }
      } else {
        // Array index: arr[0]
        const index = Number.parseInt(keyOrIndex, 10);
        if (Array.isArray(current) && index >= 0 && index < current.length) {
          current = current[index];
        } else {
          return undefined;
        }
      }
    }

    // If no brackets were processed, treat it as a simple property access
    if (!beforeBrackets && !part.includes("[")) {
      if (typeof current === "object" && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
  }

  return current;
}

/**
 * Processes data bindings on a cloned DOM tree.
 * 
 * For each element with a data-key attribute:
 * 1. If it has json-template-item: treat the data as an array and render items
 * 2. Otherwise: resolve the path and set textContent for simple values
 */
function processBindings(
  node: Node,
  data: unknown,
  isArrayItem = false,
): void {
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const element = node as HTMLElement;
  const dataKey = element.getAttribute(JSON_TEMPLATE_ATTRS.DATA_KEY);

  if (dataKey) {
    const value = resolvePath(data, dataKey);
    const itemTemplateId = element.getAttribute(JSON_TEMPLATE_ATTRS.ITEM_TEMPLATE);

    if (itemTemplateId) {
      // Array rendering
      if (!Array.isArray(value)) {
        if (value !== undefined) {
          console.error(
            `[json-template] Expected array at path "${dataKey}", got ${typeof value}`,
          );
        }
        return;
      }

      // Find item template
      const itemTemplate = document.getElementById(itemTemplateId);
      if (!itemTemplate) {
        console.error(
          `[json-template] Item template not found: ${itemTemplateId}`,
        );
        return;
      }

      if (!(itemTemplate instanceof HTMLTemplateElement)) {
        console.error(
          `[json-template] Element with id "${itemTemplateId}" is not a template element`,
        );
        return;
      }

      // Clear container
      element.innerHTML = "";

      // Render each item
      for (const item of value) {
        const itemClone = itemTemplate.content.cloneNode(true) as DocumentFragment;
        
        // Process bindings for this item (relative to item data)
        for (const child of Array.from(itemClone.children)) {
          processBindings(child, item, true);
        }

        element.appendChild(itemClone);
      }
    } else {
      // Simple value binding
      if (value === undefined) {
        console.error(
          `[json-template] Data path not found: "${dataKey}"`,
        );
        return;
      }

      // Only bind simple values (string, number)
      if (typeof value === "string" || typeof value === "number") {
        element.textContent = String(value);
      }
      // Objects, booleans, and other types are ignored
    }
  }

  // Recursively process children (unless we just did array rendering)
  if (!element.hasAttribute(JSON_TEMPLATE_ATTRS.ITEM_TEMPLATE)) {
    for (const child of Array.from(element.childNodes)) {
      processBindings(child, data, isArrayItem);
    }
  }
}

export const jsonTemplateBehaviorFactory = (el: HTMLElement) => {
  if (!(el instanceof HTMLTemplateElement)) {
    console.warn(
      "[json-template] This behavior should only be used on <template> elements",
    );
  }

  let mutationObserver: MutationObserver | null = null;
  let sourceElement: HTMLScriptElement | null = null;

  const render = () => {
    // Get attributes
    const sourceId = el.getAttribute(JSON_TEMPLATE_ATTRS.SOURCE);
    const targetId = el.getAttribute(JSON_TEMPLATE_ATTRS.TARGET);

    // Target attribute is required - this is a fatal error (throw)
    if (!targetId) {
      throw new Error(
        "[json-template] The json-template-target attribute is required",
      );
    }

    // Find source element
    if (sourceId) {
      const sourceEl = document.getElementById(sourceId);
      if (!sourceEl) {
        console.error(
          `[json-template] Source element not found: ${sourceId}`,
        );
        return;
      }
      sourceElement = sourceEl as HTMLScriptElement;
    } else {
      console.error("[json-template] json-template-source attribute is missing");
      return;
    }

    // Find target element
    const targetElement = document.getElementById(targetId);
    if (!targetElement) {
      console.error(
        `[json-template] Target element not found: ${targetId}`,
      );
      return;
    }

    // Parse JSON from source
    let jsonData: unknown;
    try {
      const jsonText = sourceElement.textContent || "";
      jsonData = JSON.parse(jsonText);
    } catch (error) {
      console.error(
        `[json-template] Invalid JSON in source element:`,
        error,
      );
      return;
    }

    // Clone template content
    if (!(el instanceof HTMLTemplateElement)) {
      console.error("[json-template] Element is not a template element");
      return;
    }

    const clone = el.content.cloneNode(true) as DocumentFragment;

    // Process data bindings (all done off-DOM in the DocumentFragment)
    for (const child of Array.from(clone.children)) {
      processBindings(child, jsonData);
    }

    // Single DOM operation: replace target content atomically
    // This prevents flickering and reduces reflows
    targetElement.replaceChildren(clone);
  };

  const setupMutationObserver = () => {
    if (!sourceElement) return;

    mutationObserver = new MutationObserver(() => {
      render();
    });

    mutationObserver.observe(sourceElement, {
      characterData: true,
      childList: true,
      subtree: true,
    });
  };

  return {
    connectedCallback() {
      render();
      setupMutationObserver();
    },
    disconnectedCallback() {
      mutationObserver?.disconnect();
    },
  };
};
