import {
  registerBehavior,
  type BehaviorInstance,
  type CommandEvent,
} from "~registry";
import REQUEST_DEFINITION from "./_behavior-definition";

interface TriggerConfig {
  event: string;
  "sse-message"?: string;
  "sse-close"?: string;
  from?: string;
  delay?: number;
  throttle?: number;
  once?: boolean;
  changed?: boolean;
  consume?: boolean;
}

interface RequestProps {
  "request-method"?: string;
  "request-url"?: string;
  "request-trigger"?: string;
  "request-target"?: string;
  "request-swap"?: string;
  "request-indicator"?: string;
  "request-confirm"?: string;
  "request-push-url"?: string;
  "request-vals"?: string;
}

// Global registry for collapsing concurrent GET requests
const requestRegistry = new Map<string, Promise<string>>();

export const requestBehaviorFactory = (el: HTMLElement) => {
  let activeProps: RequestProps | undefined;

  // Store active listeners for cleanup
  const activeListeners: Array<{
    target: EventTarget;
    type: string;
    listener: EventListener;
  }> = [];

  // Store active timeouts for debouncing
  const debounceTimeouts = new Map<string, number>();

  // Store last values for 'changed' trigger
  const lastValues = new Map<EventTarget, string>();

  // SSE Management
  let eventSource: EventSource | undefined;

  let lastLoadedUrl: string | undefined;

  const setState = (state: "loading" | "loaded" | "error") => {
    // Set state attribute (for reveal behavior to watch)
    el.setAttribute("request-state", state);

    // Set aria-busy (for screen readers)
    if (state === "loading") {
      el.setAttribute("aria-busy", "true");
    } else {
      el.setAttribute("aria-busy", "false");
    }
  };

  const cleanup = () => {
    // Remove all listeners
    for (const { target, type, listener } of activeListeners) {
      target.removeEventListener(type, listener);
    }
    activeListeners.length = 0;

    // Clear all timeouts
    for (const timeoutId of debounceTimeouts.values()) {
      window.clearTimeout(timeoutId);
    }
    debounceTimeouts.clear();

    // Clear last values
    lastValues.clear();

    // Close SSE
    if (eventSource) {
      eventSource.close();
      eventSource = undefined;
    }
  };

  const getFormData = () => {
    if (el instanceof HTMLFormElement) {
      return new FormData(el);
    }
    if (
      el instanceof HTMLInputElement ||
      el instanceof HTMLSelectElement ||
      el instanceof HTMLTextAreaElement
    ) {
      if (el.form) {
        return new FormData(el.form);
      }
      const formData = new FormData();
      if (el.name) {
        formData.append(el.name, el.value);
      }
      return formData;
    }
    return new FormData();
  };

  const prepareRequest = (
    url: string,
    method: string,
    formData: FormData,
    vals: Record<string, any> = {},
  ): { finalUrl: string; fetchOptions: RequestInit } => {
    const fetchOptions: RequestInit = {
      method,
      headers: { "X-Requested-With": "XMLHttpRequest" },
    };

    // Merge vals into formData
    for (const [key, value] of Object.entries(vals)) {
      formData.append(key, String(value));
    }

    let finalUrl = url;
    if (method === "GET") {
      const params = new URLSearchParams();
      for (const [key, value] of formData.entries()) {
        if (typeof value === "string") params.append(key, value);
      }
      const queryString = params.toString();
      if (queryString) {
        finalUrl = `${finalUrl}${finalUrl.includes("?") ? "&" : "?"}${queryString}`;
      }
    } else {
      fetchOptions.body = formData;
    }

    return { finalUrl, fetchOptions };
  };

  const executeRequest = async (
    finalUrl: string,
    fetchOptions: RequestInit,
  ): Promise<string> => {
    const method = fetchOptions.method?.toUpperCase() || "GET";

    if (method === "GET") {
      let promise = requestRegistry.get(finalUrl);
      if (!promise) {
        promise = (async () => {
          try {
            const response = await fetch(finalUrl, fetchOptions);
            if (!response.ok) {
              throw new Error(`Request failed with status ${response.status}`);
            }
            return await response.text();
          } finally {
            requestRegistry.delete(finalUrl);
          }
        })();
        requestRegistry.set(finalUrl, promise);
      }
      return await promise;
    }

    const response = await fetch(finalUrl, fetchOptions);

    const redirectUrl =
      response.headers?.get("X-Redirect") ||
      response.headers?.get("HX-Redirect") ||
      response.headers?.get("Location");

    if (redirectUrl) {
      window.location.href = redirectUrl;
      // Return a dummy string to satisfy the return type,
      // though the page will be navigating away.
      return "";
    }

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return await response.text();
  };

  const applySwap = (target: HTMLElement, html: string, swap: string) => {
    switch (swap) {
      case "innerHTML":
        target.innerHTML = html;
        break;
      case "outerHTML":
        target.outerHTML = html;
        break;
      case "beforebegin":
        target.insertAdjacentHTML("beforebegin", html);
        break;
      case "afterbegin":
        target.insertAdjacentHTML("afterbegin", html);
        break;
      case "beforeend":
        target.insertAdjacentHTML("beforeend", html);
        break;
      case "afterend":
        target.insertAdjacentHTML("afterend", html);
        break;
      case "delete":
        target.remove();
        break;
      case "none":
        // Do nothing with the response
        break;
    }
  };

  const handleEvent = async (e?: Event) => {
    if (e && e.cancelable) {
      e.preventDefault();
    }

    if (!activeProps) return;

    const {
      "request-url": url,
      "request-method": rawMethod = "",
      "request-confirm": confirmMessage,
      "request-indicator": indicatorSelector,
      "request-target": rawTargetSelector = "",
      "request-swap": rawSwap = "",
    } = activeProps;

    const method = rawMethod || "GET";
    const swap = rawSwap || "innerHTML";

    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    const indicator = indicatorSelector
      ? document.getElementById(indicatorSelector)
      : null;
    const target = rawTargetSelector
      ? document.getElementById(rawTargetSelector)
      : el;

    if (!target) {
      console.error(`[RequestBehavior] Target not found: ${rawTargetSelector}`);
      return;
    }

    if (indicator) {
      indicator.setAttribute("data-request-loading", "");
    }

    // Only set loading if this isn't an SSE message (which means data already arrived)
    if (!(e instanceof MessageEvent)) {
      setState("loading");
    }

    try {
      let html: string;
      if (e instanceof MessageEvent) {
        html = typeof e.data === "string" ? e.data : JSON.stringify(e.data);
        setState("loaded");
      } else {
        const formData = getFormData();

        let vals = {};
        if (activeProps["request-vals"]) {
          try {
            vals = JSON.parse(activeProps["request-vals"]);
          } catch (e) {
            console.warn("[RequestBehavior] Failed to parse request-vals:", e);
          }
        }

        const { finalUrl, fetchOptions } = prepareRequest(
          url as string,
          method,
          formData,
          vals,
        );
        html = await executeRequest(finalUrl, fetchOptions);
        setState("loaded");

        if (activeProps?.["request-push-url"]) {
          const urlObj = new URL(finalUrl, window.location.origin);
          const pushUrlVal = activeProps["request-push-url"];

          const pushUrl =
            pushUrlVal && pushUrlVal !== "true" && pushUrlVal !== ""
              ? new URL(pushUrlVal, window.location.origin)
              : new URL(window.location.href);

          pushUrl.search = urlObj.search;
          window.history.pushState({}, "", pushUrl.toString());
        }
      }

      // Focus Preservation
      const activeElement = document.activeElement;
      const activeElementId = activeElement?.id;
      const hadFocus = el.contains(activeElement) || el === activeElement;

      applySwap(target, html, swap);

      if (hadFocus && activeElementId) {
        const newElement = document.getElementById(activeElementId);
        if (newElement) {
          newElement.focus();
        }
      }
    } catch (error) {
      setState("error");
      console.error("[RequestBehavior] Error executing request:", error);
    } finally {
      if (indicator) {
        indicator.removeAttribute("data-request-loading");
      }
    }
  };

  const setupListeners = (props: RequestProps) => {
    cleanup();
    activeProps = props;

    const triggerValue = props["request-trigger"];
    let triggers: TriggerConfig[] = [];

    if (triggerValue) {
      try {
        // Try parsing as JSON array
        const parsed = JSON.parse(triggerValue);
        if (Array.isArray(parsed)) {
          triggers = parsed.map((t) => {
            if (typeof t === "string") {
              return {
                event: t,
                "sse-message": "",
                "sse-close": "",
                from: "",
                delay: 0,
                throttle: 0,
                once: false,
                changed: false,
                consume: false,
              };
            }
            return t;
          });
        } else if (typeof parsed === "string") {
          // Single string event
          triggers = [
            {
              event: parsed,
              "sse-message": "",
              "sse-close": "",
              from: "",
              delay: 0,
              throttle: 0,
              once: false,
              changed: false,
              consume: false,
            },
          ];
        }
      } catch (e) {
        // Not JSON, treat as single event string
        triggers = [
          {
            event: triggerValue,
            "sse-message": "",
            "sse-close": "",
            from: "",
            delay: 0,
            throttle: 0,
            once: false,
            changed: false,
            consume: false,
          },
        ];
      }
    } else {
      const defaultEvent =
        el instanceof HTMLFormElement
          ? "submit"
          : el instanceof HTMLInputElement ||
              el instanceof HTMLSelectElement ||
              el instanceof HTMLTextAreaElement
            ? "change"
            : "click";
      triggers = [
        {
          event: defaultEvent,
          "sse-message": "",
          "sse-close": "",
          from: "",
          delay: 0,
          throttle: 0,
          once: false,
          changed: false,
          consume: false,
        },
      ];
    }

    let hasLoadTrigger = false;

    for (const trigger of triggers) {
      const { event, from, delay } = trigger;

      if (event === "load") {
        hasLoadTrigger = true;
        const url = props["request-url"] as string;
        if (lastLoadedUrl !== url) {
          lastLoadedUrl = url;

          if (delay && delay > 0) {
            const timeoutId = window.setTimeout(() => {
              handleEvent();
            }, delay);
            debounceTimeouts.set("load", timeoutId);
          } else {
            handleEvent();
          }
        }
        continue;
      }

      if (event === "sse") {
        if (!eventSource) {
          setState("loading");
          eventSource = new EventSource(props["request-url"] as string);
          eventSource.addEventListener("error", () => {
            setState("error");
          });
        }

        const messageEvent = trigger["sse-message"] || "message";
        eventSource.addEventListener(messageEvent, handleEvent);

        if (trigger["sse-close"]) {
          eventSource.addEventListener(trigger["sse-close"], () => {
            eventSource?.close();
            eventSource = undefined;
          });
        }
        continue;
      }

      const target = from ? document.getElementById(from) : el;
      if (!target) {
        console.warn(`[RequestBehavior] Trigger target not found: ${from}`);
        continue;
      }

      const listener = (e: Event) => {
        const targetEl = e.target;
        if (trigger.changed && targetEl && "value" in targetEl) {
          const currentValue = String((targetEl as any).value);
          if (lastValues.get(targetEl) === currentValue) {
            return;
          }
          lastValues.set(targetEl, currentValue);
        }

        if (delay && delay > 0) {
          const key = `${from || "self"}:${event}`;
          const existingTimeout = debounceTimeouts.get(key);
          if (existingTimeout) {
            window.clearTimeout(existingTimeout);
          }

          const timeoutId = window.setTimeout(() => {
            debounceTimeouts.delete(key);
            handleEvent(e);
          }, delay);

          debounceTimeouts.set(key, timeoutId);
        } else {
          handleEvent(e);
        }
      };

      target.addEventListener(event, listener);
      activeListeners.push({ target, type: event, listener });
    }

    if (!hasLoadTrigger) {
      lastLoadedUrl = undefined;
    }
  };

  return {
    connectedCallback(this: BehaviorInstance<RequestProps>) {
      if (this.props) setupListeners(this.props);
    },
    disconnectedCallback() {
      cleanup();
    },
    attributeChangedCallback(this: BehaviorInstance<RequestProps>) {
      if (this.props) setupListeners(this.props);
    },
    onCommand(
      this: BehaviorInstance<RequestProps>,
      e: CommandEvent<keyof typeof REQUEST_DEFINITION.command>,
    ) {
      if (e.command === REQUEST_DEFINITION.command["--trigger"]) {
        handleEvent(e);
      }
      if (e.command === REQUEST_DEFINITION.command["--close-sse"]) {
        if (eventSource) {
          eventSource.close();
          eventSource = undefined;
        }
      }
    },
  };
};

registerBehavior(REQUEST_DEFINITION.name, requestBehaviorFactory);
