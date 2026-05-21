import { type CommandEvent, registerBehavior } from "~registry";
import { parseNumericValue } from "~utils";
import definition from "./_behavior-definition";

const { attributes, command } = definition;

const requestRegistry = new Map<string, Promise<string>>();

export const requestBehaviorFactory = (el: HTMLElement) => {
  const activeListeners: Array<{
    target: EventTarget;
    type: string;
    listener: EventListener;
  }> = [];
  const debounceTimeouts = new Map<string, number>();
  let eventSource: EventSource | undefined;
  let abortController: AbortController | undefined;

  const setState = (state: "loading" | "loaded" | "error") => {
    el.setAttribute("request-state", state);
    el.setAttribute("aria-busy", state === "loading" ? "true" : "false");
  };

  const getFormData = (): FormData => {
    let fd: FormData;
    if (el instanceof HTMLFormElement) fd = new FormData(el);
    else {
      fd = new FormData();
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
        if (el.name) fd.append(el.name, el.value);
      }
    }

    const include = el.getAttribute(attributes["request-include"]);
    if (include) {
      document.querySelectorAll(include).forEach((target) => {
        if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) {
          const key = target.name || target.id;
          if (key) {
            const val = target.getAttribute("behavior")?.includes("format") 
              ? String(parseNumericValue(target.value))
              : target.value;
            fd.append(key, val);
          }
        }
      });
    }
    return fd;
  };

  const handleEvent = async (e?: Event) => {
    if (e?.cancelable) e.preventDefault();
    const url = el.getAttribute(attributes["request-url"]);
    if (!url) return;

    const confirmMsg = el.getAttribute(attributes["request-confirm"]);
    if (confirmMsg && !window.confirm(confirmMsg)) return;

    abortController?.abort();
    abortController = new AbortController();
    setState("loading");

    try {
      const method = el.getAttribute(attributes["request-method"]) || "GET";
      const encoding = el.getAttribute(attributes["request-encoding"]) || "form";
      const formData = getFormData();
      const valsStr = el.getAttribute(attributes["request-vals"]);
      if (valsStr) {
        const vals = JSON.parse(valsStr);
        for (const [k, v] of Object.entries(vals)) formData.append(k, String(v));
      }

      let finalUrl = url;
      const options: RequestInit = {
        method,
        signal: abortController.signal,
        headers: { "X-Requested-With": "XMLHttpRequest" },
      };

      if (method === "GET") {
        const params = new URLSearchParams();
        for (const [k, v] of formData.entries()) params.append(k, String(v));
        const qs = params.toString();
        if (qs) finalUrl += (finalUrl.includes("?") ? "&" : "?") + qs;
      } else if (encoding === "json") {
        const obj: Record<string, any> = {};
        formData.forEach((v, k) => { obj[k] = v; });
        options.body = JSON.stringify(obj);
        (options.headers as any)["Content-Type"] = "application/json";
      } else {
        options.body = formData;
      }

      const res = await fetch(finalUrl, options);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const html = await res.text();

      const targetId = el.getAttribute(attributes["request-target"]);
      const target = targetId ? document.getElementById(targetId) : el;
      if (target) {
        const swap = el.getAttribute(attributes["request-swap"]) || "innerHTML";
        switch (swap) {
          case "innerHTML": target.innerHTML = html; break;
          case "outerHTML": target.outerHTML = html; break;
          case "beforebegin": target.insertAdjacentHTML("beforebegin", html); break;
          case "afterbegin": target.insertAdjacentHTML("afterbegin", html); break;
          case "beforeend": target.insertAdjacentHTML("beforeend", html); break;
          case "afterend": target.insertAdjacentHTML("afterend", html); break;
          case "delete": target.remove(); break;
        }
        el.dispatchEvent(new CustomEvent("request-after-swap", { bubbles: true, detail: { html } }));
      }

      setState("loaded");
      el.dispatchEvent(new CustomEvent("request-success", { bubbles: true, detail: { html } }));
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setState("error");
        el.dispatchEvent(new CustomEvent("request-error", { bubbles: true, detail: { error: err } }));
      }
    }
  };

  return {
    connectedCallback() {
      const trigger = el.getAttribute(attributes["request-trigger"]) || (el instanceof HTMLFormElement ? "submit" : "click");
      const listener = (e: Event) => handleEvent(e);
      el.addEventListener(trigger, listener);
      activeListeners.push({ target: el, type: trigger, listener });
    },
    disconnectedCallback() {
      activeListeners.forEach(({ target, type, listener }) => target.removeEventListener(type, listener));
      abortController?.abort();
      eventSource?.close();
    },
    onCommand(e: CommandEvent<string>) {
      if (e.command === command["trigger"]) handleEvent();
      else if (e.command === command["abort"]) abortController?.abort();
    }
  };
};

registerBehavior(definition, requestBehaviorFactory);
