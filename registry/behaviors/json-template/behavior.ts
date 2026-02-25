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
 * Interpolates curly brace patterns {path} in a string with values from data.
 * Returns the interpolated string.
 */
function interpolateString(text: string, data: unknown): string {
  // Match all {path} patterns
  return text.replace(/\{([^}]+)\}/g, (match, path) => {
    const value = resolvePath(data, path.trim());
    
    // Return empty string for undefined/null (graceful degradation)
    if (value === undefined || value === null) {
      return "";
    }
    
    // Convert to string for primitives
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    
    // For objects/arrays, return empty (can't interpolate complex types)
    return "";
  });
}

/**
 * Processes interpolation on a cloned DOM tree.
 * 
 * 1. Interpolates all text nodes containing {path} patterns
 * 2. Interpolates all attribute values containing {path} patterns
 * 3. Detects and renders arrays using nested <template data-array="path">
 */
function processInterpolation(
  element: Node,
  data: unknown,
): void {
  // Process text nodes
  if (element.nodeType === Node.TEXT_NODE) {
    const textNode = element as Text;
    const text = textNode.textContent || "";
    
    if (text.includes("{")) {
      textNode.textContent = interpolateString(text, data);
    }
    return;
  }

  // Only process element nodes beyond this point
  if (element.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const el = element as Element;

  // Check for array template marker
  const arrayPath = el.getAttribute("data-array");
  if (arrayPath && el instanceof HTMLTemplateElement) {
    // This is an array template marker - resolve the array data
    const arrayData = resolvePath(data, arrayPath);
    
    if (!Array.isArray(arrayData)) {
      console.error(
        `[json-template] Expected array at path "${arrayPath}", got ${typeof arrayData}`,
      );
      return;
    }

    // Find parent to insert rendered items
    const parent = el.parentElement;
    if (!parent) {
      console.error(
        `[json-template] Array template has no parent element`,
      );
      return;
    }

    // Render each array item
    for (const item of arrayData) {
      const itemClone = el.content.cloneNode(true) as DocumentFragment;
      
      // Process interpolation for this item
      for (const child of Array.from(itemClone.childNodes)) {
        processInterpolation(child, item);
      }

      // Insert before the template
      parent.insertBefore(itemClone, el);
    }
    
    // Array template processed - don't recurse into it
    return;
  }

  // Process attributes (interpolate any attribute values)
  for (const attr of Array.from(el.attributes)) {
    if (attr.value.includes("{")) {
      attr.value = interpolateString(attr.value, data);
    }
  }

  // Recursively process children
  for (const child of Array.from(el.childNodes)) {
    processInterpolation(child, data);
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

    // Process interpolation (all done off-DOM in the DocumentFragment)
    for (const child of Array.from(clone.childNodes)) {
      processInterpolation(child, jsonData);
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
