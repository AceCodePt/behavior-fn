/** @vitest-environment jsdom */
import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  vi,
  afterEach,
} from "vitest";
import { getObservedAttributes } from "~utils";
import { registerBehavior } from "~registry";
import { defineBehavioralHost } from "~host";
import { elementCounterBehaviorFactory } from "./behavior";
import definition from "./_behavior-definition";

const { name, attributes } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

describe("Element Counter Behavior", () => {
  beforeAll(() => {
    registerBehavior(definition, elementCounterBehaviorFactory);
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  const flushMutations = () => new Promise(resolve => setTimeout(resolve, 0));

  it("should count elements in the root and update textContent and value attribute", async () => {
    const TAG = "counter-host";
    defineBehavioralHost("span", TAG, observedAttributes);

    const root = document.createElement("div");
    root.id = "test-root";
    document.body.appendChild(root);

    const el = document.createElement("span", { is: TAG }) as HTMLElement;
    el.setAttribute("behavior", name);
    el.setAttribute(attributes["element-counter-root"], "test-root");
    el.setAttribute(attributes["element-counter-selector"], ".item");
    document.body.appendChild(el);

    expect(el.textContent).toBe("0");
    expect(el.getAttribute("value")).toBe("0");

    const item1 = document.createElement("div");
    item1.className = "item";
    root.appendChild(item1);

    await flushMutations();
    expect(el.textContent).toBe("1");
    expect(el.getAttribute("value")).toBe("1");
  });

  it("should dispatch change event when count updates", async () => {
    const TAG = "counter-event-host";
    defineBehavioralHost("div", TAG, observedAttributes);

    const root = document.createElement("div");
    root.id = "event-root";
    document.body.appendChild(root);

    const el = document.createElement("div", { is: TAG }) as HTMLElement;
    el.setAttribute("behavior", name);
    el.setAttribute(attributes["element-counter-root"], "event-root");
    el.setAttribute(attributes["element-counter-selector"], ".item");
    document.body.appendChild(el);

    const handler = vi.fn();
    el.addEventListener("change", handler);

    const item = document.createElement("div");
    item.className = "item";
    root.appendChild(item);

    await flushMutations();
    expect(handler).toHaveBeenCalled();
  });
});
