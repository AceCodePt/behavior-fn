/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { registerBehavior } from "~registry";
import { defineBehavioralHost } from "~host";
import { getObservedAttributes } from "~utils";
import { createBehavioralElement, createMockResponse } from "~test-utils";
import definition from "./_behavior-definition";
import { requestBehaviorFactory } from "./behavior";

const { name, attributes } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

describe("Request Behavior", () => {
  const TAG = "request-host";

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    
    registerBehavior(definition, requestBehaviorFactory);
    defineBehavioralHost("div", TAG, observedAttributes);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should perform fetch on click", async () => {
    const el = createBehavioralElement("div", TAG, {
      behavior: name,
      [attributes["request-url"]]: "/api/test",
      [attributes["request-method"]]: "GET",
    });
    document.body.appendChild(el);

    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(createMockResponse({ text: () => Promise.resolve("Success") }) as any);

    el.click();

    // Wait for DOM update
    await vi.waitFor(() => expect(el.innerHTML).toBe("Success"));
    
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/test"),
      expect.objectContaining({ method: "GET" })
    );
    expect(el.getAttribute("request-state")).toBe("loaded");
  });

  it("should support JSON encoding", async () => {
    const el = createBehavioralElement("div", TAG, {
      behavior: name,
      [attributes["request-url"]]: "/api/json",
      [attributes["request-method"]]: "POST",
      [attributes["request-encoding"]]: "json",
      [attributes["request-vals"]]: '{"foo": "bar"}',
    });
    document.body.appendChild(el);

    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(createMockResponse({ text: () => Promise.resolve("OK") }) as any);

    el.click();

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    
    const options = fetchMock.mock.calls[0][1];
    expect(options?.body).toBe(JSON.stringify({ foo: "bar" }));
    expect((options?.headers as any)["Content-Type"]).toBe("application/json");
  });

  it("should fire request-after-swap event", async () => {
    const el = createBehavioralElement("div", TAG, {
      behavior: name,
      [attributes["request-url"]]: "/api/swap",
    });
    document.body.appendChild(el);

    const handler = vi.fn();
    el.addEventListener("request-after-swap", handler);

    vi.mocked(fetch).mockResolvedValue(createMockResponse({ text: () => Promise.resolve("<p>Swapped</p>") }) as any);

    el.click();

    await vi.waitFor(() => expect(handler).toHaveBeenCalled());
    expect(el.innerHTML).toBe("<p>Swapped</p>");
  });
});
