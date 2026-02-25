import definition from "./_behavior-definition";

const { attributes } = definition;

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
      if (
        typeof current === "object" &&
        current !== null &&
        propName in current
      ) {
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
        if (
          typeof current === "object" &&
          current !== null &&
          keyOrIndex in current
        ) {
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
 * Parses an interpolation expression to extract path, operator, and fallback value.
 * Handles operators correctly when they appear inside quoted strings.
 *
 * Examples:
 * - "name" → { path: "name", operator: null, fallback: null }
 * - "name || 'Guest'" → { path: "name", operator: "||", fallback: "Guest" }
 * - "count ?? 0" → { path: "count", operator: "??", fallback: 0 }
 * - "active && true" → { path: "active", operator: "&&", fallback: true }
 * - "message || 'A || B'" → { path: "message", operator: "||", fallback: "A || B" }
 */
function parseInterpolation(expr: string): {
  path: string;
  operator: "||" | "??" | "&&" | null;
  fallback: string | number | boolean | null;
} {
  const trimmed = expr.trim();

  // Find operator that's NOT inside quotes
  // We need to scan the string and track quote state
  let operatorIndex = -1;
  let operator: "||" | "??" | "&&" | null = null;
  let insideQuote = "";

  // Check for ?? first (longer match to avoid false positive with ||)
  for (let i = 0; i < trimmed.length - 1; i++) {
    const char = trimmed[i];
    const nextChar = trimmed[i + 1];

    // Track quote state
    if ((char === '"' || char === "'") && !insideQuote) {
      insideQuote = char;
    } else if (char === insideQuote && trimmed[i - 1] !== "\\") {
      // Close quote (not escaped)
      insideQuote = "";
    }

    // Check for operators outside quotes
    if (!insideQuote) {
      if (char === "?" && nextChar === "?") {
        operatorIndex = i;
        operator = "??";
        break;
      }
    }
  }

  // If no ?? found, check for || and &&
  if (operator === null) {
    insideQuote = "";
    for (let i = 0; i < trimmed.length - 1; i++) {
      const char = trimmed[i];
      const nextChar = trimmed[i + 1];

      // Track quote state
      if ((char === '"' || char === "'") && !insideQuote) {
        insideQuote = char;
      } else if (char === insideQuote && trimmed[i - 1] !== "\\") {
        // Close quote (not escaped)
        insideQuote = "";
      }

      // Check for operators outside quotes
      if (!insideQuote) {
        if (char === "|" && nextChar === "|") {
          operatorIndex = i;
          operator = "||";
          break;
        }
        if (char === "&" && nextChar === "&") {
          operatorIndex = i;
          operator = "&&";
          break;
        }
      }
    }
  }

  // No operator found - return simple path
  if (operator === null || operatorIndex === -1) {
    return { path: trimmed, operator: null, fallback: null };
  }

  // Extract path and fallback
  const pathExpr = trimmed.slice(0, operatorIndex).trim();
  const fallbackExpr = trimmed.slice(operatorIndex + 2).trim();

  // Parse path - could be a property path OR a literal value
  let path: string;
  
  // Check if path is a quoted literal (e.g., "&&" or '||')
  // This allows expressions like {"&&" && "||"}
  const pathQuotedMatch = pathExpr.match(/^(['"])(.*)\1$/);
  if (pathQuotedMatch) {
    // Path is a quoted literal - treat it as a special marker
    // We'll store it with a prefix so resolvePath returns the literal value
    path = `__LITERAL__:${pathQuotedMatch[2]}`;
  } else {
    // Normal path
    path = pathExpr;
  }

  // Parse fallback value
  let fallback: string | number | boolean | null = null;

  // Check for quoted string (single or double quotes)
  const quotedMatch = fallbackExpr.match(/^(['"])(.*)\1$/);
  if (quotedMatch) {
    fallback = quotedMatch[2];
  } else if (fallbackExpr === "true") {
    fallback = true;
  } else if (fallbackExpr === "false") {
    fallback = false;
  } else {
    // Try to parse as number
    const num = Number(fallbackExpr);
    if (!Number.isNaN(num)) {
      fallback = num;
    } else {
      // Unquoted string or invalid - treat as string
      fallback = fallbackExpr;
    }
  }

  return { path, operator, fallback };
}

/**
 * Interpolates curly brace patterns {path} in a string with values from data.
 * Supports fallback operators: || (logical OR), ?? (nullish coalescing), and && (logical AND).
 * Returns the interpolated string.
 *
 * Examples:
 * - {name} → resolves name, returns "" if undefined/null
 * - {name || "Guest"} → resolves name, returns "Guest" if falsy
 * - {name ?? "Guest"} → resolves name, returns "Guest" if nullish (undefined/null)
 * - {premium && "Pro"} → resolves premium, returns "Pro" if truthy
 */
function interpolateString(text: string, data: unknown): string {
  // Match all {path} patterns
  return text.replace(/\{([^}]+)\}/g, (_, expr) => {
    const { path, operator, fallback } = parseInterpolation(expr);
    
    // Check if path is a literal value (starts with __LITERAL__:)
    let value: unknown;
    if (path.startsWith("__LITERAL__:")) {
      // Extract the literal string value
      value = path.slice("__LITERAL__:".length);
    } else {
      // Normal path resolution
      value = resolvePath(data, path);
    }

    // Apply operator semantics
    let finalValue: unknown = value;

    if (operator === "||") {
      // Logical OR: use fallback if value is falsy
      if (!value) {
        finalValue = fallback;
      }
    } else if (operator === "??") {
      // Nullish coalescing: use fallback only if value is null/undefined
      if (value === null || value === undefined) {
        finalValue = fallback;
      }
    } else if (operator === "&&") {
      // Logical AND: use fallback if value is truthy
      if (value) {
        finalValue = fallback;
      }
    } else {
      // No operator: use old behavior (empty string for undefined/null)
      if (value === undefined || value === null) {
        return "";
      }
    }

    // Convert to string for primitives
    if (
      typeof finalValue === "string" ||
      typeof finalValue === "number" ||
      typeof finalValue === "boolean"
    ) {
      return String(finalValue);
    }

    // For undefined/null after operator check, return empty
    if (finalValue === undefined || finalValue === null) {
      return "";
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
function processInterpolation(element: Node, data: unknown): void {
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
      console.error(`[json-template] Array template has no parent element`);
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
    const dataSourceId = el.getAttribute(attributes["json-template-for"]);

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
    const template = el.querySelector(":scope > template");
    if (!template || !(template instanceof HTMLTemplateElement)) {
      console.error(
        "[json-template] No <template> element found as direct child. Container children:",
        Array.from(el.children).map((c) => c.tagName),
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
      console.error(`[json-template] Invalid JSON in source element:`, error);
      return;
    }

    // Special case: If root data is an array, render template for each item
    if (Array.isArray(jsonData)) {
      // Root is an array - render template once per item
      const fragment = document.createDocumentFragment();

      for (const item of jsonData) {
        const itemClone = templateElement.content.cloneNode(
          true,
        ) as DocumentFragment;

        // Process interpolation for this item
        for (const child of Array.from(itemClone.childNodes)) {
          processInterpolation(child, item);
        }

        fragment.appendChild(itemClone);
      }

      // Clear existing rendered content (preserve template)
      const nodesToRemove: Node[] = [];
      el.childNodes.forEach((node) => {
        if (node !== templateElement) {
          nodesToRemove.push(node);
        }
      });
      nodesToRemove.forEach((node) => {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      });

      // Insert rendered content before the template
      el.insertBefore(fragment, templateElement);
      return;
    }

    // Normal case: Root is an object
    const clone = templateElement.content.cloneNode(true) as DocumentFragment;

    // Process interpolation (all done off-DOM in the DocumentFragment)
    for (const child of Array.from(clone.childNodes)) {
      processInterpolation(child, jsonData);
    }

    // Clear existing rendered content (preserve template)
    // Remove all child nodes except the template element
    const nodesToRemove: Node[] = [];
    el.childNodes.forEach((node) => {
      if (node !== templateElement) {
        nodesToRemove.push(node);
      }
    });
    nodesToRemove.forEach((node) => {
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
