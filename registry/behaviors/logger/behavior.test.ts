/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import { defineBehavioralHost } from "../behavioral-host";
import { loggerBehaviorFactory } from "./behavior";
import { registerBehavior } from "~registry";
import { getObservedAttributes } from "~utils";
import definition from "./_behavior-definition";

const { name, attributes } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

describe("Logger Behavior", () => {
  beforeAll(() => {
    registerBehavior(definition, loggerBehaviorFactory);
  });
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("should log on click by default", async () => {
    const tag = "button";
    const webcomponentTag = "test-logger-btn-1";
    defineBehavioralHost(tag, webcomponentTag, observedAttributes);

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLElement;
    el.setAttribute("behavior", "logger");
    el.setAttribute(attributes["logger-trigger"], "click");
    document.body.appendChild(el);

    await vi.waitFor(() => {
      el.click();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("[Logger] Element <button> clicked!"),
        expect.any(Object),
      );
    });
  });

  it("should log on mouseenter when configured", async () => {
    const tag = "div";
    const webcomponentTag = "test-logger-div-mouseenter";
    defineBehavioralHost(tag, webcomponentTag, observedAttributes);

    const el = document.createElement(tag, {
      is: webcomponentTag,
    });
    el.setAttribute("behavior", "logger");
    el.setAttribute(attributes["logger-trigger"], "mouseenter");
    document.body.appendChild(el);

    await vi.waitFor(() => {
      el.dispatchEvent(new MouseEvent("mouseenter"));
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("[Logger] Element <div> mouse entered!"),
        expect.any(Object),
      );
    });
  });
});
