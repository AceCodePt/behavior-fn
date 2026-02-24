// --- Math Parser Implementation ---
type TokenType = "NUMBER" | "ID" | "OPERATOR" | "LPAREN" | "RPAREN";

interface Token {
  type: TokenType;
  value: string;
}

export class MathParser {
  private tokens: Token[] = [];
  private rpn: Token[] = [];

  constructor(private expression: string) {
    this.tokenize();
    this.rpn = this.shuntingYard();
  }

  public getDependencies(): string[] {
    const deps: string[] = [];
    const regex = /#([\w-]+)/g;
    let match = regex.exec(this.expression);
    while (match !== null) {
      if (match[1]) {
        deps.push(match[1]);
      }
      match = regex.exec(this.expression);
    }
    return deps;
  }

  public evaluate(context: Record<string, number>): number {
    return this.evaluateRPN(this.rpn, context);
  }

  private tokenize() {
    this.tokens = [];
    // Regex matches: whitespace, IDs (#...), numbers, operators
    const regex = /(\s+)|(#[\w-]+)|(\d+(?:\.\d+)?)|([+\-*/()])/g;
    let match = regex.exec(this.expression);

    while (match !== null) {
      const result = match; // Capture match to avoid undefined issues
      const [_, space, id, num, op] = result;
      if (!space) {
        if (id) {
          this.tokens.push({ type: "ID", value: id.substring(1) }); // Remove #
        } else if (num) {
          this.tokens.push({ type: "NUMBER", value: num });
        } else if (op) {
          const type =
            op === "(" ? "LPAREN" : op === ")" ? "RPAREN" : "OPERATOR";
          this.tokens.push({ type, value: op });
        }
      }
      match = regex.exec(this.expression);
    }
  }

  private shuntingYard(): Token[] {
    const output: Token[] = [];
    const operators: Token[] = [];
    const precedence: Record<string, number> = {
      "+": 1,
      "-": 1,
      "*": 2,
      "/": 2,
    };

    for (const token of this.tokens) {
      if (token.type === "NUMBER" || token.type === "ID") {
        output.push(token);
      } else if (token.type === "OPERATOR") {
        let top = operators[operators.length - 1];
        while (
          top &&
          top.type === "OPERATOR" &&
          (precedence[top.value] ?? 0) >= (precedence[token.value] ?? 0)
        ) {
          const op = operators.pop();
          if (op) output.push(op);
          top = operators[operators.length - 1];
        }
        operators.push(token);
      } else if (token.type === "LPAREN") {
        operators.push(token);
      } else if (token.type === "RPAREN") {
        let top = operators[operators.length - 1];
        while (top && top.type !== "LPAREN") {
          const op = operators.pop();
          if (op) output.push(op);
          top = operators[operators.length - 1];
        }
        if (operators.length === 0) {
          throw new Error("Mismatched parentheses");
        }
        operators.pop(); // Pop LPAREN
      }
    }

    while (operators.length > 0) {
      const top = operators[operators.length - 1];
      if (top && top.type === "LPAREN") {
        throw new Error("Mismatched parentheses");
      }
      const op = operators.pop();
      if (op) output.push(op);
    }

    return output;
  }

  private evaluateRPN(rpn: Token[], context: Record<string, number>): number {
    const stack: number[] = [];

    for (const token of rpn) {
      if (token.type === "NUMBER") {
        stack.push(parseFloat(token.value));
      } else if (token.type === "ID") {
        const val = context[token.value];
        if (val === undefined)
          throw new Error(`Missing value for #${token.value}`);
        stack.push(val);
      } else if (token.type === "OPERATOR") {
        if (stack.length < 2) throw new Error("Invalid expression");
        const b = stack.pop();
        const a = stack.pop();

        if (a === undefined || b === undefined)
          throw new Error("Invalid stack");

        switch (token.value) {
          case "+":
            stack.push(a + b);
            break;
          case "-":
            stack.push(a - b);
            break;
          case "*":
            stack.push(a * b);
            break;
          case "/":
            if (b === 0) throw new Error("Division by zero");
            stack.push(a / b);
            break;
        }
      }
    }

    if (stack.length !== 1) throw new Error("Invalid expression");
    return stack[0] ?? 0;
  }
}

// --- Behavior Implementation ---

import { COMPUTE_ATTRS } from "./schema";

const evaluatingElements = new Set<HTMLElement>();

export const computeBehaviorFactory = (el: HTMLElement) => {
  let cleanupFns: (() => void)[] = [];

  const setup = () => {
    // Cleanup previous listeners if any
    cleanupFns.forEach((fn) => {
      fn();
    });
    cleanupFns = [];

    const formula = el.getAttribute(COMPUTE_ATTRS.FORMULA);
    if (!formula) return; // Return empty object if no formula

    const parser = new MathParser(formula);
    const dependencies = parser.getDependencies();

    const calculate = () => {
      if (evaluatingElements.has(el)) {
        console.error(`Circular dependency detected in formula: ${formula}`);
        return;
      }

      evaluatingElements.add(el);

      const context: Record<string, number> = {};
      try {
        for (const id of dependencies) {
          const depEl = document.getElementById(id);
          let val = 0;
          if (depEl) {
            if (
              depEl instanceof HTMLInputElement &&
              depEl.type === "checkbox"
            ) {
              val = depEl.checked ? 1 : 0;
            } else if (
              depEl instanceof HTMLInputElement ||
              depEl instanceof HTMLTextAreaElement ||
              depEl instanceof HTMLSelectElement
            ) {
              const rawVal = depEl.value;
              val = parseFloat(rawVal || "0");
            } else {
              console.error(
                `[Compute] Invalid dependency #${id}. Only input, textarea, and select elements can be used in formulas.`,
              );
              val = 0;
            }
          } else {
            console.warn(`[Compute] Dependency #${id} NOT FOUND in DOM`);
          }
          if (isNaN(val)) val = 0;
          context[id] = val;
        }

        const result = parser.evaluate(context);

        if (
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement
        ) {
          el.value = String(result);
          // Dispatch input event so other listeners know it changed
          el.dispatchEvent(new Event("input", { bubbles: true }));
        } else {
          el.textContent = String(result);
          // Dispatch change event so dependent outputs know it changed
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
      } catch (err) {
        console.error(
          `[Compute] Error evaluating formula "${formula}" for element`,
          el,
        );
        console.error(`[Compute] Dependencies:`, dependencies);
        console.error(`[Compute] Context:`, context);
        console.error(`[Compute] Error details:`, err);
        el.textContent = "Error";
      } finally {
        evaluatingElements.delete(el);
      }
    };

    // Attach listeners
    dependencies.forEach((id) => {
      const depEl = document.getElementById(id);
      if (depEl) {
        const handler = () => calculate();
        depEl.addEventListener("input", handler);
        // Also listen for change just in case
        depEl.addEventListener("change", handler);
        cleanupFns.push(() => {
          depEl.removeEventListener("input", handler);
          depEl.removeEventListener("change", handler);
        });
      } else {
        console.warn(`Dependency #${id} not found for formula in`, el);
      }
    });

    // Initial calculation
    calculate();
  };

  return {
    connectedCallback() {
      setup();
    },
    attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ) {
      if (name === COMPUTE_ATTRS.FORMULA && oldValue !== newValue) {
        setup();
      }
    },
    disconnectedCallback() {
      cleanupFns.forEach((fn) => {
        fn();
      });
      cleanupFns = [];
    },
  };
};
