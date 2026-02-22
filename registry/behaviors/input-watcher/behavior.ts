import { getFormatter } from "@/lib/utils/formatter-registry";
import { registerBehavior, type BehaviorFactory } from "~registry";
import INPUT_WATCHER_DEFINITION from "./_behavior-definition";

interface InputWatcherProps {
  "watcher-for": string;
  "watcher-format"?: string;
}

export const inputWatcherBehaviorFactory: BehaviorFactory = (host) => {
  let targetElements: HTMLElement[] = [];

  const update = () => {
    const props: InputWatcherProps = {
      "watcher-for": host.getAttribute("watcher-for") ?? "",
      "watcher-format": host.getAttribute("watcher-format") ?? undefined,
    };

    const values: any[] = [];
    // ... (rest of the function)
    for (const target of targetElements) {
      let value: any;
      if (target.getAttribute("is") === "range-slider") {
        value = {
          min: parseFloat(target.getAttribute("min-value") || "0"),
          max: parseFloat(target.getAttribute("max-value") || "0"),
        };
      } else if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement
      ) {
        value = target.value;
      } else {
        value = (target as any).value ?? "";
      }
      values.push(value);
    }

    if (values.length === 0) return;

    const input = values.length === 1 ? values[0] : values;

    if (props["watcher-format"]) {
      const formatter = getFormatter(props["watcher-format"]);
      if (formatter) {
        host.textContent = formatter(input);
        return;
      }
    }

    host.textContent =
      typeof input === "object" ? JSON.stringify(input) : String(input);
  };

  const connect = () => {
    const targetIds = (host.getAttribute("watcher-for") || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    targetElements = targetIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    for (const target of targetElements) {
      target.addEventListener("input", update);
      target.addEventListener("change", update);
    }

    // Initial sync
    update();
  };

  const disconnect = () => {
    for (const target of targetElements) {
      target.removeEventListener("input", update);
      target.removeEventListener("change", update);
    }
    targetElements = [];
  };

  return {
    connectedCallback: () => {
      connect();
    },
    disconnectedCallback: () => {
      disconnect();
    },
    attributeChangedCallback: (name) => {
      if (name === "watcher-for") {
        disconnect();
        connect();
      } else if (name === "watcher-format") {
        update();
      }
    },
  };
};

registerBehavior(INPUT_WATCHER_DEFINITION.name, inputWatcherBehaviorFactory);
