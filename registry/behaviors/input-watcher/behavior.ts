import { type BehaviorFactory } from "~registry";
import { hasValue } from "~utils";
import definition from "./_behavior-definition";

const { ATTRS } = definition;

export const inputWatcherBehavior: BehaviorFactory = (host) => {
  let targets: Element[] = [];
  let cleanupFns: Array<() => void> = [];

  const getTargets = () => {
    const selector = host.getAttribute(ATTRS["input-watcher-target"]);
    if (!selector) return [];

    const result: Element[] = [];
    const parts = selector
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const part of parts) {
      try {
        const els = document.querySelectorAll(part);
        els.forEach((el) => {
          result.push(el);
        });
      } catch (e) {
        console.warn(`[Input Watcher] Invalid selector: ${part}`);
      }
    }
    return result;
  };

  const readValue = (el: Element) => {
    const attr = host.getAttribute(ATTRS["input-watcher-attr"]);
    if (attr) {
      return el.getAttribute(attr) ?? "";
    }
    // Try value property
    if (hasValue(el)) {
      return String(el.value);
    }
    return el.textContent ?? "";
  };

  const update = () => {
    if (targets.length === 0) return;

    const values = targets.map(readValue);
    const format = host.getAttribute(ATTRS["input-watcher-format"]);

    let output = "";

    if (format) {
      output = format;
      // Replace {value} with first value (common case)
      output = output.replace(/{value}/g, String(values[0]));
      // Replace {0}, {1}... for indexed access
      values.forEach((val, idx) => {
        output = output.replace(new RegExp(`\\{${idx}\\}`, "g"), String(val));
      });
    } else {
      // Default: join with space
      output = values.join(" ");
    }

    host.textContent = output;
  };

  const setup = () => {
    // Cleanup old listeners
    cleanupFns.forEach((fn) => {
      fn();
    });

    cleanupFns = [];
    targets = [];

    targets = getTargets();

    const eventsStr = host.getAttribute(ATTRS["input-watcher-events"]);
    const events = eventsStr
      ? eventsStr.split(",").map((e) => e.trim())
      : ["input", "change"];

    targets.forEach((target) => {
      events.forEach((eventName) => {
        const handler = () => {
          update();
        };
        target.addEventListener(eventName, handler);
        cleanupFns.push(() => {
          target.removeEventListener(eventName, handler);
        });
      });
    });

    // Initial update
    update();
  };

  return {
    connectedCallback() {
      setup();
    },
    disconnectedCallback() {
      cleanupFns.forEach((fn) => {
        fn();
      });

      cleanupFns = [];
    },
    attributeChangedCallback(name) {
      if (name.startsWith("input-watcher-")) {
        setup();
      }
    },
  };
};
