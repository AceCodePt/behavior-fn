import { registerBehavior } from "~registry";
import definition from "./_behavior-definition";

const { attributes } = definition;

export const storageBehaviorFactory = (el: HTMLElement) => {
  const getKey = () => el.getAttribute(attributes["storage-key"]);
  const getType = () => el.getAttribute(attributes["storage-type"]) === "session" ? sessionStorage : localStorage;
  const getAttr = () => el.getAttribute(attributes["storage-attr"]) || "value";

  const syncFromStorage = () => {
    const key = getKey();
    if (!key) return;

    const stored = getType().getItem(key);
    if (stored !== null) {
      const attr = getAttr();
      if (attr in el) {
        (el as any)[attr] = stored;
      } else {
        el.setAttribute(attr, stored);
      }
    }
  };

  const syncToStorage = () => {
    const key = getKey();
    if (!key) return;

    const attr = getAttr();
    const value = attr in el ? String((el as any)[attr]) : el.getAttribute(attr);
    
    if (value !== null) {
      getType().setItem(key, value);
    }
  };

  return {
    connectedCallback() {
      syncFromStorage();
      el.addEventListener("input", syncToStorage);
      el.addEventListener("change", syncToStorage);
    },
    disconnectedCallback() {
      el.removeEventListener("input", syncToStorage);
      el.removeEventListener("change", syncToStorage);
    },
  };
};

registerBehavior(definition, storageBehaviorFactory);
