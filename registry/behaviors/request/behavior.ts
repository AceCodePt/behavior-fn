import {
  registerBehavior,
  type BehaviorInstance,
  type CommandEvent,
} from "~registry";
import { hasValue } from "~utils";
import definition from "./_behavior-definition";
import { REQUEST_ATTRS, type TriggerConfig } from "./schema";

const { command, name } = definition;

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

    const url = getAttr(REQUEST_ATTRS.URL);
    if (!url) return;

    const method = getAttr(REQUEST_ATTRS.METHOD) || "GET";
    const confirmMsg = getAttr(REQUEST_ATTRS.CONFIRM);

    if (confirmMsg && !window.confirm(confirmMsg)) return;

    const targetId = getAttr(REQUEST_ATTRS.TARGET);
    const target = targetId ? document.getElementById(targetId) : el;

    if (!target) {
      console.error(`[Request] Target not found: ${targetId}`);
      return;
    }

    const indicatorId = getAttr(REQUEST_ATTRS.INDICATOR);
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
        const valsStr = getAttr(REQUEST_ATTRS.VALS);
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

        const pushUrlVal = getAttr(REQUEST_ATTRS.PUSH_URL);
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

      const swap = getAttr(REQUEST_ATTRS.SWAP) || "innerHTML";
      const activeElement = document.activeElement;
      const hadFocus = el.contains(activeElement) || el === activeElement;
      const activeId = activeElement?.id;

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

    const triggerAttr = getAttr(REQUEST_ATTRS.TRIGGER);
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
        const currentUrl = getAttr(REQUEST_ATTRS.URL);
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
        const url = getAttr(REQUEST_ATTRS.URL);
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
        if (changed && targetEl && targetEl instanceof Element && hasValue(targetEl)) {
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
    connectedCallback(this: BehaviorInstance) {
      setupListeners();
    },
    disconnectedCallback() {
      cleanup();
    },
    attributeChangedCallback(this: BehaviorInstance) {
      setupListeners();
    },
    onCommand(this: BehaviorInstance, e: CommandEvent<keyof typeof command>) {
      if (e.command === command["--trigger"]) handleEvent(e);
      if (e.command === command["--close-sse"]) {
        eventSource?.close();
        eventSource = undefined;
      }
    },
  };
};

registerBehavior(name, requestBehaviorFactory);
