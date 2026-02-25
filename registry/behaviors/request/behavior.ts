import { type CommandEvent } from "~registry";
import { hasValue } from "~utils";
import definition from "./_behavior-definition";
import type { TriggerConfig } from "./schema";

const { attributes, commands } = definition;

// Global registry for collapsing concurrent GET requests
const requestRegistry = new Map<string, Promise<string>>();

export const requestBehaviorFactory = (el: HTMLElement) => {
  // State
  const activeListeners: Array<{
    target: EventTarget;
    type: string;
    listener: EventListener;
  }> = [];
  const debounceTimeouts = new Map<string, number>();
  const lastValues = new Map<EventTarget, string>();
  let eventSource: EventSource | undefined;
  let lastLoadedUrl: string | undefined;

  // Helpers
  const getAttr = (name: string) => el.getAttribute(name);
  const setAttr = (name: string, value: string) => el.setAttribute(name, value);

  const setState = (state: "loading" | "loaded" | "error") => {
    // Only set if changed to avoid unnecessary DOM updates
    if (getAttr("request-state") !== state) {
      setAttr("request-state", state);
    }
    const busy = state === "loading" ? "true" : "false";
    if (getAttr("aria-busy") !== busy) {
      setAttr("aria-busy", busy);
    }
  };

  const cleanup = () => {
    for (const { target, type, listener } of activeListeners) {
      target.removeEventListener(type, listener);
    }
    activeListeners.length = 0;

    for (const timeoutId of debounceTimeouts.values()) {
      window.clearTimeout(timeoutId);
    }
    debounceTimeouts.clear();
    lastValues.clear();

    if (eventSource) {
      eventSource.close();
      eventSource = undefined;
    }
  };

  const getFormData = (): FormData => {
    if (el instanceof HTMLFormElement) return new FormData(el);
    if (
      el instanceof HTMLInputElement ||
      el instanceof HTMLSelectElement ||
      el instanceof HTMLTextAreaElement
    ) {
      if (el.form) return new FormData(el.form);
      const fd = new FormData();
      if (el.name) fd.append(el.name, el.value);
      return fd;
    }
    return new FormData();
  };

  const executeRequest = async (
    url: string,
    options: RequestInit,
  ): Promise<string> => {
    const method = options.method?.toUpperCase() || "GET";

    if (method === "GET") {
      let promise = requestRegistry.get(url);
      if (!promise) {
        promise = (async () => {
          try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`Status ${res.status}`);
            return await res.text();
          } finally {
            requestRegistry.delete(url);
          }
        })();
        requestRegistry.set(url, promise);
      }
      return await promise;
    }

    const res = await fetch(url, options);

    const redirect =
      res.headers.get("X-Redirect") ||
      res.headers.get("HX-Redirect") ||
      res.headers.get("Location");

    if (redirect) {
      window.location.href = redirect;
      return "";
    }

    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.text();
  };

  const handleEvent = async (e?: Event) => {
    if (e?.cancelable) e.preventDefault();

    const url = getAttr(attributes["request-url"]);
    if (!url) return;

    const method = getAttr(attributes["request-method"]) || "GET";
    const confirmMsg = getAttr(attributes["request-confirm"]);

    if (confirmMsg && !window.confirm(confirmMsg)) return;

    const targetId = getAttr(attributes["request-target"]);
    const target = targetId ? document.getElementById(targetId) : el;

    if (!target) {
      console.error(`[Request] Target not found: ${targetId}`);
      return;
    }

    const indicatorId = getAttr(attributes["request-indicator"]);
    const indicator = indicatorId ? document.getElementById(indicatorId) : null;

    if (indicator) indicator.setAttribute("data-request-loading", "");

    const isSSE = e instanceof MessageEvent;
    if (!isSSE) setState("loading");

    try {
      let html = "";

      if (isSSE) {
        html = typeof e.data === "string" ? e.data : JSON.stringify(e.data);
        setState("loaded");
      } else {
        const formData = getFormData();
        const valsStr = getAttr(attributes["request-vals"]);
        if (valsStr) {
          try {
            const vals = JSON.parse(valsStr);
            for (const [k, v] of Object.entries(vals)) {
              formData.append(k, String(v));
            }
          } catch (err) {
            console.warn("[Request] Invalid request-vals JSON", err);
          }
        }

        let finalUrl = url;
        const options: RequestInit = {
          method,
          headers: { "X-Requested-With": "XMLHttpRequest" },
        };

        if (method === "GET") {
          const params = new URLSearchParams();
          for (const [k, v] of formData.entries()) {
            if (typeof v === "string") params.append(k, v);
          }
          const qs = params.toString();
          if (qs) {
            finalUrl += (finalUrl.includes("?") ? "&" : "?") + qs;
          }
        } else {
          options.body = formData;
        }

        html = await executeRequest(finalUrl, options);
        setState("loaded");

        const pushUrlVal = getAttr(attributes["request-push-url"]);
        if (pushUrlVal) {
          const urlObj = new URL(finalUrl, window.location.origin);
          const pushUrl =
            pushUrlVal !== "true" && pushUrlVal !== ""
              ? new URL(pushUrlVal, window.location.origin)
              : new URL(window.location.href);
          pushUrl.search = urlObj.search;
          window.history.pushState({}, "", pushUrl.toString());
        }
      }

      // Track focus for restoration after swap
      const activeElement = document.activeElement;
      const hadFocus = el.contains(activeElement) || el === activeElement;
      const activeId = activeElement?.id;

      // Check for JSON script tag update strategy
      const jsonStrategy = getAttr(attributes["request-json-strategy"]);
      const isScriptTag =
        target instanceof HTMLScriptElement &&
        target.type === "application/json";

      if (jsonStrategy && isScriptTag) {
        try {
          // Parse existing JSON
          const existingText = target.textContent?.trim() || "{}";
          let existingData: unknown;
          try {
            existingData = JSON.parse(existingText);
          } catch (err) {
            console.warn("[Request] Invalid existing JSON in script tag", err);
            existingData = null;
          }

          // Parse response JSON
          let responseData: unknown;
          try {
            responseData = JSON.parse(html);
          } catch (err) {
            console.warn("[Request] Invalid JSON in response", err);
            return; // Cannot proceed without valid response
          }

          // Apply strategy
          let finalData: unknown;
          switch (jsonStrategy) {
            case "replace":
              finalData = responseData;
              break;

            case "appendArray":
              if (
                !Array.isArray(existingData) ||
                !Array.isArray(responseData)
              ) {
                console.warn(
                  "[Request] appendArray requires both existing and response to be arrays",
                );
                return;
              }
              finalData = [...existingData, ...responseData];
              break;

            case "prependArray":
              if (
                !Array.isArray(existingData) ||
                !Array.isArray(responseData)
              ) {
                console.warn(
                  "[Request] prependArray requires both existing and response to be arrays",
                );
                return;
              }
              finalData = [...responseData, ...existingData];
              break;

            default:
              finalData = responseData;
          }

          // Update script content with formatted JSON
          target.textContent = JSON.stringify(finalData, null, 2);
        } catch (err) {
          console.error("[Request] Error processing JSON strategy", err);
        }
      } else {
        // Existing HTML swap logic
        const swap = getAttr(attributes["request-swap"]) || "innerHTML";

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
            break;
        }
      }

      // Restore focus if needed
      if (hadFocus && activeId) {
        const newEl = document.getElementById(activeId);
        newEl?.focus();
      }
    } catch (err) {
      setState("error");
      console.error("[Request] Error:", err);
    } finally {
      if (indicator) indicator.removeAttribute("data-request-loading");
    }
  };

  const setupListeners = () => {
    cleanup();

    const triggerAttr = getAttr(attributes["request-trigger"]);
    let triggers: TriggerConfig[] = [];

    if (triggerAttr) {
      try {
        const parsed = JSON.parse(triggerAttr);
        if (Array.isArray(parsed)) {
          triggers = parsed.map((t) =>
            typeof t === "string" ? { event: t } : t,
          );
        } else if (typeof parsed === "string") {
          triggers = [{ event: parsed }];
        } else {
          triggers = [parsed];
        }
      } catch {
        triggers = [{ event: triggerAttr }];
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
      triggers = [{ event: defaultEvent }];
    }

    let hasLoadTrigger = false;

    for (const trigger of triggers) {
      const { event, from, delay, changed } = trigger;

      if (event === "load") {
        hasLoadTrigger = true;
        const currentUrl = getAttr(attributes["request-url"]);
        if (lastLoadedUrl !== currentUrl) {
          lastLoadedUrl = currentUrl || undefined;
          if (delay) {
            debounceTimeouts.set("load", window.setTimeout(handleEvent, delay));
          } else {
            handleEvent();
          }
        }
        continue;
      }

      if (event === "sse") {
        const url = getAttr(attributes["request-url"]);
        if (url && !eventSource) {
          setState("loading");
          eventSource = new EventSource(url);
          eventSource.addEventListener("error", () => setState("error"));
        }

        if (eventSource) {
          const msgEvent = trigger["sse-message"] || "message";
          eventSource.addEventListener(msgEvent, handleEvent);

          if (trigger["sse-close"]) {
            eventSource.addEventListener(trigger["sse-close"], () => {
              eventSource?.close();
              eventSource = undefined;
            });
          }
        }
        continue;
      }

      const target = from ? document.getElementById(from) : el;
      if (!target) continue;

      const listener = (e: Event) => {
        const targetEl = e.target;
        if (
          changed &&
          targetEl &&
          targetEl instanceof Element &&
          hasValue(targetEl)
        ) {
          const val = String(targetEl.value);
          if (lastValues.get(targetEl) === val) return;
          lastValues.set(targetEl, val);
        }

        if (delay) {
          const key = `${from || "self"}:${event}`;
          if (debounceTimeouts.has(key)) {
            window.clearTimeout(debounceTimeouts.get(key));
          }
          debounceTimeouts.set(
            key,
            window.setTimeout(() => {
              debounceTimeouts.delete(key);
              handleEvent(e);
            }, delay),
          );
        } else {
          handleEvent(e);
        }
      };

      target.addEventListener(event, listener);
      activeListeners.push({ target, type: event, listener });
    }

    if (!hasLoadTrigger) lastLoadedUrl = undefined;
  };

  return {
    onCommand(e: CommandEvent<string>) {
      if (e.command === commands["--trigger"]) {
        handleEvent(e);
      } else if (e.command === commands["--close-sse"]) {
        if (eventSource) {
          eventSource.close();
          eventSource = undefined;
        }
      }
    },
    connectedCallback() {
      setupListeners();
    },
    disconnectedCallback() {
      cleanup();
    },
    attributeChangedCallback(
    ) {
      setupListeners();
    },
  };
};
