import { registerBehavior } from "~registry";
import { parseNumericValue } from "~utils";
import definition from "./_behavior-definition";

const { attributes } = definition;

// --- Math Parser Implementation ---
type TokenType =
  | "NUMBER"
  | "ID"
  | "OPERATOR"
  | "LPAREN"
  | "RPAREN"
  | "UNARY_MINUS"
  | "FUNCTION"
  | "COMMA";

interface Token {
  type: TokenType;
  value: string;
  argCount?: number;
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
    const regex = /(\s+)|(#[\w-]+)|(\d+(?:\.\d+)?)|([+\-*/(),])|([a-zA-Z]+)/g;
    let match = regex.exec(this.expression);
    let lastToken: Token | null = null;

    while (match !== null) {
      const result = match;
      const [_, space, id, num, op, func] = result;
      if (!space) {
        let token: Token | null = null;
        if (id) {
          token = { type: "ID", value: id.substring(1) };
        } else if (num) {
          token = { type: "NUMBER", value: num };
        } else if (op) {
          if (op === "-") {
            if (
              lastToken === null ||
              lastToken.type === "OPERATOR" ||
              lastToken.type === "UNARY_MINUS" ||
              lastToken.type === "LPAREN" ||
              lastToken.type === "COMMA"
            ) {
              token = { type: "UNARY_MINUS", value: "-" };
            } else {
              token = { type: "OPERATOR", value: "-" };
            }
          } else if (op === ",") {
            token = { type: "COMMA", value: "," };
          } else {
            const type =
              op === "(" ? "LPAREN" : op === ")" ? "RPAREN" : "OPERATOR";
            token = { type, value: op };
          }
        } else if (func) {
          token = { type: "FUNCTION", value: func.toLowerCase() };
        }

        if (token) {
          this.tokens.push(token);
          lastToken = token;
        }
      }
      match = regex.exec(this.expression);
    }
  }

  private shuntingYard(): Token[] {
    const output: Token[] = [];
    const operators: Token[] = [];
    const argCountStack: number[] = [];

    const precedence: Record<string, number> = {
      "+": 1,
      "-": 1,
      "*": 2,
      "/": 2,
      UNARY_MINUS: 3,
    };

    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i]!;
      if (token.type === "NUMBER" || token.type === "ID") {
        output.push(token);
      } else if (token.type === "FUNCTION") {
        operators.push(token);
        argCountStack.push(0);
      } else if (token.type === "COMMA") {
        while (
          operators.length > 0 &&
          operators[operators.length - 1]!.type !== "LPAREN"
        ) {
          const op = operators.pop();
          if (op) output.push(op);
        }
        if (operators.length === 0) {
          throw new Error(
            "Comma outside of function or mismatched parentheses",
          );
        }
        if (argCountStack.length > 0) {
          const lastIdx = argCountStack.length - 1;
          argCountStack[lastIdx] = (argCountStack[lastIdx] ?? 0) + 1;
        }
      } else if (token.type === "OPERATOR" || token.type === "UNARY_MINUS") {
        const tokenPrecedence =
          token.type === "UNARY_MINUS"
            ? (precedence["UNARY_MINUS"] ?? 0)
            : (precedence[token.value] ?? 0);

        let top = operators[operators.length - 1];
        while (top && (top.type === "OPERATOR" || top.type === "UNARY_MINUS")) {
          const topPrecedence =
            top.type === "UNARY_MINUS"
              ? (precedence["UNARY_MINUS"] ?? 0)
              : (precedence[top.value] ?? 0);

          if (topPrecedence >= tokenPrecedence) {
            const op = operators.pop();
            if (op) output.push(op);
            top = operators[operators.length - 1];
          } else {
            break;
          }
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
        operators.pop();

        if (
          operators.length > 0 &&
          operators[operators.length - 1]!.type === "FUNCTION"
        ) {
          const funcToken = operators.pop()!;
          let count = argCountStack.pop()!;
          if (this.tokens[i - 1]!.type !== "LPAREN") {
            count++;
          }
          funcToken.argCount = count;
          output.push(funcToken);
        }
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
      } else if (token.type === "UNARY_MINUS") {
        if (stack.length < 1) throw new Error("Invalid expression");
        const a = stack.pop();
        if (a === undefined) throw new Error("Invalid stack");
        stack.push(-a);
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
            if (b === 0) {
              stack.push(0);
            } else {
              stack.push(a / b);
            }
            break;
        }
      } else if (token.type === "FUNCTION") {
        const count = token.argCount ?? 0;
        if (stack.length < count)
          throw new Error(`Insufficient arguments for function ${token.value}`);
        const args: number[] = [];
        for (let i = 0; i < count; i++) {
          const arg = stack.pop();
          if (arg !== undefined) args.unshift(arg);
        }
        if (token.value === "min") {
          if (count < 1)
            throw new Error("min() requires at least one argument");
          stack.push(Math.min(...args));
        } else if (token.value === "max") {
          if (count < 1)
            throw new Error("max() requires at least one argument");
          stack.push(Math.max(...args));
        } else if (token.value === "floor") {
          if (count !== 1)
            throw new Error("floor() requires exactly one argument");
          stack.push(Math.floor(args[0]!));
        } else if (token.value === "ceil") {
          if (count !== 1)
            throw new Error("ceil() requires exactly one argument");
          stack.push(Math.ceil(args[0]!));
        } else if (token.value === "round") {
          if (count !== 1)
            throw new Error("round() requires exactly one argument");
          stack.push(Math.round(args[0]!));
        } else {
          throw new Error(`Unknown function: ${token.value}`);
        }
      }
    }

    if (stack.length !== 1) throw new Error("Invalid expression");
    return stack[0] ?? 0;
  }
}

// --- Behavior Implementation ---

const evaluatingElements = new Set<HTMLElement>();

export const computeBehaviorFactory = (el: HTMLElement) => {
  let cleanupFns: (() => void)[] = [];
  let retryTimeout: ReturnType<typeof setTimeout> | null = null;
  let mutationObserver: MutationObserver | null = null;

  const setState = (state: "pending" | "ready" | "invalid") => {
    el.setAttribute("compute-state", state);
  };

  const calculate = () => {
    if (evaluatingElements.has(el)) {
      return;
    }

    evaluatingElements.add(el);

    const formula = el.getAttribute(attributes["compute-formula"]);
    if (!formula) {
      evaluatingElements.delete(el);
      return;
    }

    const parser = new MathParser(formula);
    const dependencies = parser.getDependencies();
    const context: Record<string, number> = {};

    try {
      for (const id of dependencies) {
        const depEl = document.getElementById(id);
        let val = 0;
        if (depEl) {
          if (
            depEl instanceof HTMLInputElement &&
            (depEl.type === "checkbox" || depEl.type === "radio")
          ) {
            val = depEl.checked ? 1 : 0;
          } else {
            val = parseNumericValue(
              depEl instanceof HTMLInputElement ||
                depEl instanceof HTMLTextAreaElement ||
                depEl instanceof HTMLSelectElement
                ? depEl.value
                : depEl.getAttribute("value") ?? depEl.textContent,
            );
          }
        }
        context[id] = val;
      }

      let result = parser.evaluate(context);

      const precisionAttr = el.getAttribute(attributes["compute-precision"]);
      if (precisionAttr !== null) {
        const precision = parseInt(precisionAttr, 10);
        if (!isNaN(precision)) {
          result = parseFloat(result.toFixed(precision));
        }
      }

      const newValue = String(result);
      const isInput = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT";
      const currentValue = isInput ? (el as HTMLInputElement).value : el.getAttribute("value");

      if (currentValue !== newValue) {
        if (!el.hasAttribute("dirty-state")) {
          if (isInput) {
            (el as HTMLInputElement).value = newValue;
          } else {
            el.setAttribute("value", newValue);
            el.textContent = newValue;
          }
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
      setState("ready");
    } catch (err) {
      const isInput = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT";
      const fallback = el.getAttribute(attributes["compute-invalid-value"]);
      if (fallback !== null) {
        if (isInput) (el as HTMLInputElement).value = fallback;
        else el.textContent = fallback;
      } else {
        if (isInput) (el as HTMLInputElement).value = "0";
        else el.textContent = "Error";
      }
      setState("invalid");
    } finally {
      evaluatingElements.delete(el);
    }
  };

  const setup = () => {
    cleanup();
    const formula = el.getAttribute(attributes["compute-formula"]);
    if (!formula) return;

    const parser = new MathParser(formula);
    const dependencies = parser.getDependencies();
    const strategy = el.getAttribute(attributes["compute-ready-strategy"]) || "observe";

    const bindListeners = () => {
      dependencies.forEach((id) => {
        const depEl = document.getElementById(id);
        if (depEl) {
          const handler = () => calculate();
          depEl.addEventListener("input", handler);
          depEl.addEventListener("change", handler);
          cleanupFns.push(() => {
            depEl.removeEventListener("input", handler);
            depEl.removeEventListener("change", handler);
          });
        }
      });
      calculate();
    };

    const checkReady = () => {
      return dependencies.every((id) => document.getElementById(id));
    };

    const handleFailure = () => {
      const isInput = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT";
      const fallback = el.getAttribute(attributes["compute-invalid-value"]);
      if (fallback !== null) {
        if (isInput) (el as HTMLInputElement).value = fallback;
        else el.textContent = fallback;
      }
      setState("invalid");
    };

    if (checkReady()) {
      bindListeners();
    } else if (strategy === "defer") {
      requestAnimationFrame(() => {
        if (checkReady()) bindListeners();
        else handleFailure();
      });
    } else if (strategy === "retry") {
      let count = 0;
      const max = parseInt(el.getAttribute(attributes["compute-retry-count"]) || "10", 10);
      const delay = parseInt(el.getAttribute(attributes["compute-retry-delay"]) || "10", 10);
      
      const attempt = () => {
        if (checkReady()) {
          bindListeners();
        } else if (count < max) {
          count++;
          retryTimeout = setTimeout(attempt, delay);
        } else {
          handleFailure();
        }
      };
      attempt();
    } else {
      // Default: observe
      setState("pending");
      mutationObserver = new MutationObserver(() => {
        if (checkReady()) {
          mutationObserver?.disconnect();
          mutationObserver = null;
          bindListeners();
        }
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    }
  };

  const cleanup = () => {
    cleanupFns.forEach((fn) => fn());
    cleanupFns = [];
    if (retryTimeout) clearTimeout(retryTimeout);
    mutationObserver?.disconnect();
  };

  return {
    connectedCallback() {
      setup();
    },
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
      if (oldValue !== newValue && Object.values(attributes).includes(name as any)) {
        setup();
      }
    },
    disconnectedCallback() {
      cleanup();
    },
  };
};

registerBehavior(definition, computeBehaviorFactory);
