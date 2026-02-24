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
      if (typeof current === "object" && current !== null && propName in current) {
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
        if (typeof current === "object" && current !== null && keyOrIndex in current) {
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
      if (typeof current === "object" && current !== null && part in current) {
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
  element: Node,
  data: unknown,
  isArrayItem: boolean = false,
): void {
  // Only process element nodes (ignore text nodes, comments, etc.)
  if (element.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const el = element as Element;

  // Check for data-key attribute
  const dataKey = el.getAttribute(JSON_TEMPLATE_ATTRS.DATA_KEY);
  if (!dataKey) {
    // No binding on this element, recurse to children
    for (const child of Array.from(el.childNodes)) {
      processBindings(child, data, isArrayItem);
    }
    return;
  }

  // We have a data-key, process the binding
  {
    const value = resolvePath(data, dataKey);
    
    // Check if this is array rendering (either explicit via attribute or implicit via nested template)
    const itemTemplateId = el.getAttribute(JSON_TEMPLATE_ATTRS.ITEM_TEMPLATE);
    const nestedTemplate = el.querySelector(':scope > template');
    const isArrayWithTemplate = Array.isArray(value) && (itemTemplateId || nestedTemplate);
    
    if (isArrayWithTemplate) {
      // Array rendering - find the template
      let itemTemplate: HTMLTemplateElement | null = null;
      
      if (itemTemplateId) {
        // Explicit template via ID
        const templateById = document.getElementById(itemTemplateId);
        if (!templateById) {
          console.error(
            `[json-template] Item template not found: ${itemTemplateId}`,
          );
          return;
        }
        if (!(templateById instanceof HTMLTemplateElement)) {
          console.error(
            `[json-template] Element with id "${itemTemplateId}" is not a template element`,
          );
          return;
        }
        itemTemplate = templateById;
      } else if (nestedTemplate instanceof HTMLTemplateElement) {
        // Implicit template (nested as direct child)
        itemTemplate = nestedTemplate;
      }
      
      if (!itemTemplate) {
        console.error(
          `[json-template] Could not find item template for array at "${dataKey}"`,
        );
        return;
      }

      // Clear container (preserve nested template if implicit)
      if (nestedTemplate && !itemTemplateId) {
        // Implicit pattern: keep the template, clear everything else
        const nodesToRemove: ChildNode[] = [];
        el.childNodes.forEach(node => {
          if (node !== nestedTemplate) {
            nodesToRemove.push(node);
          }
        });
        nodesToRemove.forEach(node => {
          if (node.parentNode) {
            node.parentNode.removeChild(node);
          }
        });
      } else {
        // Explicit pattern: clear everything
        (el as HTMLElement).innerHTML = "";
      }

      // Render each item
      for (const item of value) {
        const itemClone = itemTemplate.content.cloneNode(true) as DocumentFragment;
        
        // Process bindings for this item (relative to item data)
        for (const child of Array.from(itemClone.children)) {
          processBindings(child, item, true);
        }

        // Insert before the template (if implicit) or at end (if explicit)
        if (nestedTemplate && !itemTemplateId) {
          el.insertBefore(itemClone, nestedTemplate);
        } else {
          el.appendChild(itemClone);
        }
      }
      
      // Array was rendered - items were already processed
      // Do NOT recurse to children (would double-process rendered items)
      return;
    } else if (itemTemplateId || nestedTemplate) {
      // Has template but value is not an array
      if (value !== undefined) {
        console.error(
          `[json-template] Expected array at path "${dataKey}", got ${typeof value}`,
        );
      }
      return;
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
        el.textContent = String(value);
      }
      // Objects, booleans, and other types are ignored
      // Fall through to recurse into children for nested bindings
    }
  }

  // Recursively process children
  // This handles:
  // - Elements without data-key that contain elements with data-key
  // - Nested objects (e.g., data-key="user" with children that have data-key="name", "email", etc.)
  // - Mixed content (elements with bindings alongside static content)
  // 
  // Note: Array rendering returns early above, so we don't double-process array items
  for (const child of Array.from(el.childNodes)) {
    processBindings(child, data, isArrayItem);
  }
}

export const jsonTemplateBehaviorFactory = (el: HTMLElement) => {
  let mutationObserver: MutationObserver | null = null;
  let sourceElement: HTMLScriptElement | null = null;
  let templateElement: HTMLTemplateElement | null = null;

  const render = () => {
    // Get the data source ID (like "for" attribute in label)
    const dataSourceId = el.getAttribute(JSON_TEMPLATE_ATTRS.FOR);
    
    if (!dataSourceId) {
      console.error("[json-template] json-template-for attribute is required");
      return;
    }

    // Find the data source element
    const sourceEl = document.getElementById(dataSourceId);
    if (!sourceEl) {
      console.error(
        `[json-template] Data source element not found: ${dataSourceId}`,
      );
      return;
    }
    sourceElement = sourceEl as HTMLScriptElement;

    // Find the template (should be a direct child of el)
    const template = el.querySelector(':scope > template');
    if (!template || !(template instanceof HTMLTemplateElement)) {
      console.error(
        "[json-template] No <template> element found as direct child. Container children:",
        Array.from(el.children).map(c => c.tagName),
      );
      return;
    }
    templateElement = template;

    // Parse JSON from source
    let jsonData: unknown;
    const jsonText = (sourceElement.textContent || "").trim();
    
    // Skip rendering if source is empty (not an error - just waiting for data)
    if (!jsonText) {
      return;
    }
    
    try {
      jsonData = JSON.parse(jsonText);
    } catch (error) {
      console.error(
        `[json-template] Invalid JSON in source element:`,
        error,
      );
      return;
    }

    // Clone template content
    const clone = templateElement.content.cloneNode(true) as DocumentFragment;

    // Process data bindings (all done off-DOM in the DocumentFragment)
    for (const child of Array.from(clone.children)) {
      processBindings(child, jsonData);
    }

    // Clear existing rendered content (preserve template)
    // Remove all child nodes except the template element
    const nodesToRemove: Node[] = [];
    el.childNodes.forEach(node => {
      if (node !== templateElement) {
        nodesToRemove.push(node);
      }
    });
    nodesToRemove.forEach(node => {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });
    
    // Insert rendered content before the template
    // This keeps template at the end (hidden)
    el.insertBefore(clone, templateElement);
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
