import { registerBehavior } from "~registry";
import { parseNumericValue } from "~utils";
import definition from "./_behavior-definition";

const { attributes } = definition;

const separatorCache = new Map<string, { decimal: string; group: string }>();

function getLocaleSeparators(locale: string) {
  if (separatorCache.has(locale)) {
    return separatorCache.get(locale)!;
  }
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
  const decimal = parts.find((p) => p.type === "decimal")?.value || ".";
  const group = parts.find((p) => p.type === "group")?.value || ",";
  const result = { decimal, group };
  separatorCache.set(locale, result);
  return result;
}

function preserveCursor(
  oldValue: string,
  newValue: string,
  oldCursorPos: number,
  locale: string,
): number {
  const { decimal } = getLocaleSeparators(locale);
  const isDataChar = (char: string) => /[\d\-]/.test(char) || char === decimal;

  let realCharsBefore = 0;
  for (let i = 0; i < oldCursorPos && i < oldValue.length; i++) {
    const char = oldValue[i];
    if (char && isDataChar(char)) {
      realCharsBefore++;
    }
  }

  let count = 0;
  for (let i = 0; i < newValue.length; i++) {
    if (count === realCharsBefore) return i;
    const char = newValue[i];
    if (char && isDataChar(char)) {
      count++;
    }
  }
  return newValue.length;
}

export const formatBehaviorFactory = (el: HTMLElement) => {
  const isInput = el.tagName === "INPUT" || el.tagName === "TEXTAREA";

  const getOptions = () => {
    const type = el.getAttribute(attributes["format-type"]) as any;
    const locale = el.getAttribute(attributes["format-locale"]) || "en-US";
    const currency = el.getAttribute(attributes["format-currency"]) || "USD";
    const dateStyle = el.getAttribute(attributes["format-date-style"]) as any;
    const notation = el.getAttribute(attributes["format-notation"]) as any;

    const minFractionDigits = el.getAttribute(attributes["format-min-fraction-digits"]);
    const maxFractionDigits = el.getAttribute(attributes["format-max-fraction-digits"]);

    return {
      type,
      locale,
      currency,
      dateStyle: dateStyle || undefined,
      notation: notation || undefined,
      minFractionDigits: minFractionDigits ? parseInt(minFractionDigits, 10) : undefined,
      maxFractionDigits: maxFractionDigits ? parseInt(maxFractionDigits, 10) : undefined,
    };

  };

  const formatValue = (raw: string, isBlur = false) => {
    const opts = getOptions();
    if (!raw) return "";

    if (opts.type === "date") {
      const date = new Date(raw);
      if (isNaN(date.getTime())) return raw;
      return new Intl.DateTimeFormat(opts.locale, {
        dateStyle: opts.dateStyle || "medium",
      }).format(date);
    }

    const num = parseNumericValue(raw, opts.locale);
    const numberOptions: Intl.NumberFormatOptions = {
      style: opts.type === "currency" ? "currency" : opts.type === "percent" ? "percent" : "decimal",
      currency: opts.currency,
      minimumFractionDigits: isBlur ? opts.minFractionDigits : 0,
      maximumFractionDigits: opts.maxFractionDigits,
      notation: opts.notation,
    };

    return new Intl.NumberFormat(opts.locale, numberOptions).format(
      opts.type === "percent" ? num / 100 : num
    );
  };

  const updateDisplay = (isInitial = false) => {
    const strategy = el.getAttribute(attributes["format-strategy"]) || "blur";
    if (strategy === "live" && !isInitial) return;

    if (isInput) {
      const input = el as HTMLInputElement;
      const formatted = formatValue(input.value, true);
      input.value = formatted;
      if (isInitial) {
        input.setAttribute("value", formatted);
      }
    } else {
      const val = el.getAttribute("value") || el.textContent || "";
      const formatted = formatValue(val, true);
      el.textContent = formatted;
      if (isInitial) {
        el.setAttribute("value", formatted);
      }
    }
  };

  return {
    connectedCallback() {
      updateDisplay(true);
    },
    onInput() {
      const strategy = el.getAttribute(attributes["format-strategy"]);
      if (strategy !== "live" || !isInput) return;

      const input = el as HTMLInputElement;
      const oldValue = input.value;
      const cursorPos = input.selectionStart || 0;
      const opts = getOptions();

      const formatted = formatValue(oldValue, false);
      const newPos = preserveCursor(oldValue, formatted, cursorPos, opts.locale);

      input.value = formatted;
      input.setSelectionRange(newPos, newPos);
    },
    onBlur() {
      updateDisplay();
    },
    onChange() {
      updateDisplay();
    },
    attributeChangedCallback(name: string) {
      if (name === "value") {
        updateDisplay();
      }
    },
  };
};

registerBehavior(definition, formatBehaviorFactory);
