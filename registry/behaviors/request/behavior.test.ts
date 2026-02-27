/** @vitest-environment jsdom */
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
} from "vitest";
import { dispatchCommand } from "~test-utils";
import { getObservedAttributes } from "~utils";
import { requestBehaviorFactory } from "./behavior";
import { registerBehavior } from "~registry";
import { defineBehavioralHost } from "../behavioral-host";
import definition from "./_behavior-definition";

const { name, commands, attributes } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

const TEST_TAGS = {
  button: "test-request-btn",
  div: "test-request-div",
  form: "test-request-form",
  input: "test-request-input",
} as const;

describe("Request Behavior", () => {
  beforeAll(async () => {
    // Register behavior with full definition (not just name)
    registerBehavior(definition, requestBehaviorFactory);
    defineBehavioralHost("button", TEST_TAGS.button, observedAttributes);
    defineBehavioralHost("div", TEST_TAGS.div, observedAttributes);
    defineBehavioralHost("form", TEST_TAGS.form, observedAttributes);
    defineBehavioralHost("input", TEST_TAGS.input, observedAttributes);
  });

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: {
            get: () => null,
          },
          text: () => Promise.resolve("<div>Response</div>"),
        } as unknown as Response),
      ),
    );

    document.body.innerHTML = "";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should perform a GET request on click by default", async () => {
    const el = document.createElement("button", {
      is: TEST_TAGS.button,
    }) as HTMLElement;
    el.setAttribute("behavior", name);
    el.setAttribute(attributes["request-url"], "http://example.com");
    document.body.appendChild(el);

    await vi.runAllTimersAsync();

    el.click();
    await vi.runAllTimersAsync();

    expect(fetch).toHaveBeenCalledWith(
      "http://example.com",
      expect.objectContaining({
        method: "GET",
      }),
    );

    expect(el.innerHTML).toBe("<div>Response</div>");
  });

  it("should respect request-method", async () => {
    const el = document.createElement("button", {
      is: TEST_TAGS.button,
    }) as HTMLElement;
    el.setAttribute("behavior", name);
    el.setAttribute(attributes["request-url"], "http://example.com");
    el.setAttribute(attributes["request-method"], "POST");
    document.body.appendChild(el);

    await vi.runAllTimersAsync();

    el.click();
    await vi.runAllTimersAsync();

    expect(fetch).toHaveBeenCalledWith(
      "http://example.com",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it('should handle request-trigger "load"', async () => {
    const el = document.createElement("div", {
      is: TEST_TAGS.div,
    }) as HTMLElement;
    el.setAttribute("behavior", name);
    el.setAttribute(attributes["request-url"], "http://example.com/load");
    el.setAttribute(attributes["request-trigger"], "load");
    document.body.appendChild(el);

    await vi.runAllTimersAsync();

    expect(fetch).toHaveBeenCalledWith(
      "http://example.com/load",
      expect.any(Object),
    );
  });

  it("should handle request-target", async () => {
    const target = document.createElement("div");
    target.id = "my-target";
    document.body.appendChild(target);

    const el = document.createElement("button", {
      is: TEST_TAGS.button,
    }) as HTMLElement;
    el.setAttribute("behavior", name);
    el.setAttribute(attributes["request-url"], "http://example.com");
    el.setAttribute(attributes["request-target"], "my-target");
    document.body.appendChild(el);

    await vi.runAllTimersAsync();

    el.click();
    await vi.runAllTimersAsync();

    expect(target.innerHTML).toBe("<div>Response</div>");
    expect(el.innerHTML).toBe("");
  });

  it("should handle --trigger command", async () => {
    const el = document.createElement("button", {
      is: TEST_TAGS.button,
    }) as HTMLElement;
    el.setAttribute("behavior", name);
    el.setAttribute(attributes["request-url"], "http://example.com/cmd");
    document.body.appendChild(el);

    await vi.runAllTimersAsync();

    dispatchCommand(el, commands["--trigger"]);
    await vi.runAllTimersAsync();

    expect(fetch).toHaveBeenCalledWith(
      "http://example.com/cmd",
      expect.any(Object),
    );
  });

  describe("Form Data Handling", () => {
    it("should include form data in GET request (query params)", async () => {
      const form = document.createElement("form", {
        is: TEST_TAGS.form,
      }) as HTMLFormElement;
      form.setAttribute("behavior", name);
      form.setAttribute(attributes["request-url"], "http://example.com/search");
      form.setAttribute(attributes["request-method"], "GET");

      const input = document.createElement("input");
      input.name = "q";
      input.value = "test query";
      form.appendChild(input);

      document.body.appendChild(form);
      await vi.runAllTimersAsync();

      form.dispatchEvent(new Event("submit", { cancelable: true }));
      await vi.runAllTimersAsync();

      const call = vi.mocked(fetch).mock.calls[0];
      if (!call) throw new Error("Fetch not called");
      expect(call[0]).toContain("http://example.com/search?q=test+query");
      expect(call[1]?.method).toBe("GET");
    });

    it("should include input value when element is an input", async () => {
      const input = document.createElement("input", {
        is: TEST_TAGS.input,
      }) as HTMLInputElement;
      input.setAttribute("behavior", name);
      input.setAttribute(attributes["request-url"], "http://example.com/update");
      input.setAttribute(attributes["request-method"], "POST");
      input.name = "email";
      input.value = "test@example.com";

      document.body.appendChild(input);
      await vi.runAllTimersAsync();

      input.dispatchEvent(new Event("change"));
      await vi.runAllTimersAsync();

      const call = vi.mocked(fetch).mock.calls[0];
      if (!call) throw new Error("Fetch not called");
      expect(call[1]?.body).toBeInstanceOf(FormData);
      const formData = call[1]?.body as FormData;
      expect(formData.get("email")).toBe("test@example.com");
    });
  });

  describe("Swap Strategies", () => {
    const strategies = [
      {
        swap: "outerHTML",
        check: () => {
          expect(document.body.innerHTML).toContain("<div>Response</div>");
          expect(document.getElementById("target")).toBeNull();
        },
      },
      {
        swap: "beforebegin",
        check: (target: HTMLElement) => {
          expect(target.previousElementSibling?.outerHTML).toBe(
            "<div>Response</div>",
          );
        },
      },
      {
        swap: "afterbegin",
        check: (target: HTMLElement) => {
          expect(target.firstElementChild?.outerHTML).toBe(
            "<div>Response</div>",
          );
        },
      },
      {
        swap: "beforeend",
        check: (target: HTMLElement) => {
          expect(target.lastElementChild?.outerHTML).toBe(
            "<div>Response</div>",
          );
        },
      },
      {
        swap: "afterend",
        check: (target: HTMLElement) => {
          expect(target.nextElementSibling?.outerHTML).toBe(
            "<div>Response</div>",
          );
        },
      },
      {
        swap: "delete",
        check: () => {
          expect(document.getElementById("target")).toBeNull();
        },
      },
      {
        swap: "none",
        check: (target: HTMLElement) => {
          expect(target.innerHTML).toContain("<span>Original</span>");
        },
      },
    ];

    strategies.forEach(({ swap, check }) => {
      it(`should handle request-swap "${swap}"`, async () => {
        const target = document.createElement("div");
        target.id = "target";
        target.innerHTML = "<span>Original</span>";
        document.body.appendChild(target);

        const el = document.createElement("button", {
          is: TEST_TAGS.button,
        }) as HTMLElement;
        el.setAttribute("behavior", name);
        el.setAttribute(attributes["request-url"], "http://example.com");
        el.setAttribute(attributes["request-target"], "target");
        el.setAttribute(attributes["request-swap"], swap);
        document.body.appendChild(el);

        await vi.runAllTimersAsync();

        el.click();
        await vi.runAllTimersAsync();

        check(target);
      });
    });
  });

  describe("Indicators", () => {
    it("should toggle data-request-loading on indicator element", async () => {
      const indicator = document.createElement("div");
      indicator.id = "loading-spinner";
      document.body.appendChild(indicator);

      const el = document.createElement("button", {
        is: TEST_TAGS.button,
      }) as HTMLElement;
      el.setAttribute("behavior", name);
      el.setAttribute(attributes["request-url"], "http://example.com");
      el.setAttribute(attributes["request-indicator"], "loading-spinner");
      document.body.appendChild(el);

      // Mock fetch to delay response so we can check loading state
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });
      vi.mocked(fetch).mockReturnValue(fetchPromise as any);

      await vi.runAllTimersAsync();

      el.click();
      // We need to wait for the microtask that sets the attribute
      await Promise.resolve();

      expect(indicator.hasAttribute("data-request-loading")).toBe(true);

      resolveFetch!({
        ok: true,
        headers: { get: () => null },
        text: () => Promise.resolve("Done"),
      });

      await vi.runAllTimersAsync();
      expect(indicator.hasAttribute("data-request-loading")).toBe(false);
    });
  });

  describe("Confirmations", () => {
    it("should show confirmation dialog and abort if cancelled", async () => {
      const el = document.createElement("button", {
        is: TEST_TAGS.button,
      }) as HTMLElement;
      el.setAttribute("behavior", name);
      el.setAttribute(attributes["request-url"], "http://example.com");
      el.setAttribute(attributes["request-confirm"], "Are you sure?");
      document.body.appendChild(el);

      vi.spyOn(window, "confirm").mockReturnValue(false);

      await vi.runAllTimersAsync();
      el.click();
      await vi.runAllTimersAsync();

      expect(window.confirm).toHaveBeenCalledWith("Are you sure?");
      expect(fetch).not.toHaveBeenCalled();
    });

    it("should show confirmation dialog and proceed if confirmed", async () => {
      const el = document.createElement("button", {
        is: TEST_TAGS.button,
      }) as HTMLElement;
      el.setAttribute("behavior", name);
      el.setAttribute(attributes["request-url"], "http://example.com");
      el.setAttribute(attributes["request-confirm"], "Are you sure?");
      document.body.appendChild(el);

      vi.spyOn(window, "confirm").mockReturnValue(true);

      await vi.runAllTimersAsync();
      el.click();
      await vi.runAllTimersAsync();

      expect(window.confirm).toHaveBeenCalledWith("Are you sure?");
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle fetch errors and cleanup indicator", async () => {
      const indicator = document.createElement("div");
      indicator.id = "error-indicator";
      document.body.appendChild(indicator);

      const el = document.createElement("button", {
        is: TEST_TAGS.button,
      }) as HTMLElement;
      el.setAttribute("behavior", name);
      el.setAttribute(attributes["request-url"], "http://example.com/error");
      el.setAttribute(attributes["request-indicator"], "error-indicator");
      document.body.appendChild(el);

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: { get: () => null },
      } as unknown as Response);

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await vi.runAllTimersAsync();
      el.click();
      await vi.runAllTimersAsync();

      expect(consoleSpy).toHaveBeenCalled();
      expect(indicator.hasAttribute("data-request-loading")).toBe(false);
    });
  });

  describe("Advanced Triggers", () => {
    it("should handle trigger with delay", async () => {
      const el = document.createElement("button", {
        is: TEST_TAGS.button,
      }) as HTMLElement;
      el.setAttribute("behavior", name);
      el.setAttribute(attributes["request-url"], "http://example.com");
      el.setAttribute(
        attributes["request-trigger"],
        JSON.stringify([{ event: "click", delay: 500 }]),
      );
      document.body.appendChild(el);

      await vi.runAllTimersAsync();
      el.click();

      // Should not have called fetch yet
      expect(fetch).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      expect(fetch).toHaveBeenCalled();
    });

    it("should handle trigger from another element", async () => {
      const triggerBtn = document.createElement("button");
      triggerBtn.id = "external-trigger";
      document.body.appendChild(triggerBtn);

      const el = document.createElement("div", {
        is: TEST_TAGS.div,
      }) as HTMLElement;
      el.setAttribute("behavior", name);
      el.setAttribute(attributes["request-url"], "http://example.com");
      el.setAttribute(
        attributes["request-trigger"],
        JSON.stringify([{ event: "click", from: "external-trigger" }]),
      );
      document.body.appendChild(el);

      await vi.runAllTimersAsync();
      triggerBtn.click();
      await vi.runAllTimersAsync();

      expect(fetch).toHaveBeenCalled();
    });

    it("should handle multiple triggers", async () => {
      const el = document.createElement("button", {
        is: TEST_TAGS.button,
      }) as HTMLElement;
      el.setAttribute("behavior", name);
      el.setAttribute(attributes["request-url"], "http://example.com");
      el.setAttribute(
        attributes["request-trigger"],
        JSON.stringify(["click", "mouseenter"]),
      );
      document.body.appendChild(el);

      await vi.runAllTimersAsync();
      el.dispatchEvent(new Event("mouseenter"));
      await vi.runAllTimersAsync();

      expect(fetch).toHaveBeenCalledTimes(1);

      el.click();
      await vi.runAllTimersAsync();

      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("Request Collapsing", () => {
    it("should collapse multiple concurrent GET requests to the same URL", async () => {
      // Mock fetch to delay response
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });
      vi.mocked(fetch).mockReturnValue(fetchPromise as any);

      const el1 = document.createElement("div", {
        is: TEST_TAGS.div,
      }) as HTMLElement;
      el1.setAttribute("behavior", name);
      el1.setAttribute(attributes["request-url"], "http://example.com/collapsed");
      el1.setAttribute(attributes["request-trigger"], "load");

      const el2 = document.createElement("div", {
        is: TEST_TAGS.div,
      }) as HTMLElement;
      el2.setAttribute("behavior", name);
      el2.setAttribute(attributes["request-url"], "http://example.com/collapsed");
      el2.setAttribute(attributes["request-trigger"], "load");

      document.body.appendChild(el1);
      document.body.appendChild(el2);

      await vi.runAllTimersAsync();

      expect(fetch).toHaveBeenCalledTimes(1);

      // Resolve the fetch
      resolveFetch!({
        ok: true,
        headers: { get: () => null },
        text: () => Promise.resolve("<div>Collapsed Response</div>"),
      });

      await vi.runAllTimersAsync();
      expect(el1.innerHTML).toBe("<div>Collapsed Response</div>");
      expect(el2.innerHTML).toBe("<div>Collapsed Response</div>");
    });

    it("should NOT collapse POST requests", async () => {
      const resolvers: Array<(value: any) => void> = [];

      vi.mocked(fetch).mockImplementation(() => {
        return new Promise((resolve) => {
          resolvers.push(resolve);
        }) as any;
      });

      const el1 = document.createElement("button", {
        is: TEST_TAGS.button,
      }) as HTMLElement;
      el1.setAttribute("behavior", name);
      el1.setAttribute(attributes["request-url"], "http://example.com/post");
      el1.setAttribute(attributes["request-method"], "POST");

      const el2 = document.createElement("button", {
        is: TEST_TAGS.button,
      }) as HTMLElement;
      el2.setAttribute("behavior", name);
      el2.setAttribute(attributes["request-url"], "http://example.com/post");
      el2.setAttribute(attributes["request-method"], "POST");

      document.body.appendChild(el1);
      document.body.appendChild(el2);

      await vi.runAllTimersAsync();
      el1.click();
      el2.click();

      await vi.runAllTimersAsync();
      expect(fetch).toHaveBeenCalledTimes(2);

      resolvers.forEach((resolve) => {
        resolve({
          ok: true,
          headers: { get: () => null },
          text: () => Promise.resolve("Done"),
        });
      });

      await vi.runAllTimersAsync();
      expect(el1.innerHTML).toBe("Done");
      expect(el2.innerHTML).toBe("Done");
    });
  });

  describe("Server-Sent Events (SSE)", () => {
    let mockEventSource: any;

    beforeEach(() => {
      mockEventSource = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        close: vi.fn(),
      };
      vi.stubGlobal(
        "EventSource",
        vi.fn().mockImplementation(function (this: any) {
          return mockEventSource;
        }),
      );
    });

    it("should initialize EventSource and listen for messages", async () => {
      const el = document.createElement("div", {
        is: TEST_TAGS.div,
      }) as HTMLElement;
      el.setAttribute("behavior", name);
      el.setAttribute(attributes["request-url"], "http://example.com/sse");
      el.setAttribute(
        attributes["request-trigger"],
        JSON.stringify([{ event: "sse", "sse-message": "update" }]),
      );
      document.body.appendChild(el);

      await vi.runAllTimersAsync();

      expect(global.EventSource).toHaveBeenCalledWith("http://example.com/sse");
      expect(mockEventSource.addEventListener).toHaveBeenCalledWith(
        "update",
        expect.any(Function),
      );

      // Simulate message
      const listener = mockEventSource.addEventListener.mock.calls.find(
        (call: any) => call[0] === "update",
      )[1];
      const sseData = "<div>SSE Payload</div>";
      listener(new MessageEvent("update", { data: sseData }));

      await vi.runAllTimersAsync();

      expect(fetch).not.toHaveBeenCalled();
      expect(el.innerHTML).toBe(sseData);
    });

    it("should close EventSource on sse-close event", async () => {
      const el = document.createElement("div", {
        is: TEST_TAGS.div,
      }) as HTMLElement;
      el.setAttribute("behavior", name);
      el.setAttribute(attributes["request-url"], "http://example.com/sse");
      el.setAttribute(
        attributes["request-trigger"],
        JSON.stringify([{ event: "sse", "sse-close": "end" }]),
      );
      document.body.appendChild(el);

      await vi.runAllTimersAsync();

      expect(mockEventSource.addEventListener).toHaveBeenCalledWith(
        "end",
        expect.any(Function),
      );

      // Simulate close event
      const listener = mockEventSource.addEventListener.mock.calls.find(
        (call: any) => call[0] === "end",
      )[1];
      listener();

      expect(mockEventSource.close).toHaveBeenCalled();
    });

    it("should close EventSource on --close-sse command", async () => {
      const el = document.createElement("div", {
        is: TEST_TAGS.div,
      }) as HTMLElement;
      el.setAttribute("behavior", name);
      el.setAttribute(attributes["request-url"], "http://example.com/sse");
      el.setAttribute(attributes["request-trigger"], JSON.stringify([{ event: "sse" }]));
      document.body.appendChild(el);

      await vi.runAllTimersAsync();

      dispatchCommand(el, commands["--close-sse"]);
      expect(mockEventSource.close).toHaveBeenCalled();
    });

    it('should set request-state="loading" when SSE starts and "loaded" on message', async () => {
      const el = document.createElement("div", {
        is: TEST_TAGS.div,
      }) as HTMLElement;
      el.setAttribute("behavior", name);
      el.setAttribute(attributes["request-url"], "http://example.com/sse");
      el.setAttribute(attributes["request-trigger"], JSON.stringify([{ event: "sse" }]));
      document.body.appendChild(el);

      await vi.runAllTimersAsync();

      expect(el.getAttribute("request-state")).toBe("loading");
      expect(el.getAttribute("aria-busy")).toBe("true");

      // Simulate message
      const listener = mockEventSource.addEventListener.mock.calls.find(
        (call: any) => call[0] === "message",
      )[1];

      if (!listener) throw new Error("SSE message listener not found");

      listener(new MessageEvent("message", { data: "<div>SSE</div>" }));

      await vi.runAllTimersAsync();
      expect(el.getAttribute("request-state")).toBe("loaded");
      expect(el.getAttribute("aria-busy")).toBe("false");
    });

    describe("SSE Swap Strategies", () => {
      const sseStrategies = [
        {
          swap: "outerHTML",
          check: (el: HTMLElement) => {
            expect(document.body.innerHTML).toContain("<div>SSE Payload</div>");
            expect(document.body.contains(el)).toBe(false);
          },
        },
        {
          swap: "beforebegin",
          check: (el: HTMLElement) => {
            expect(el.previousElementSibling?.outerHTML).toBe(
              "<div>SSE Payload</div>",
            );
          },
        },
        {
          swap: "afterbegin",
          check: (el: HTMLElement) => {
            expect(el.firstElementChild?.outerHTML).toBe(
              "<div>SSE Payload</div>",
            );
          },
        },
        {
          swap: "beforeend",
          check: (el: HTMLElement) => {
            expect(el.lastElementChild?.outerHTML).toBe(
              "<div>SSE Payload</div>",
            );
          },
        },
        {
          swap: "afterend",
          check: (el: HTMLElement) => {
            expect(el.nextElementSibling?.outerHTML).toBe(
              "<div>SSE Payload</div>",
            );
          },
        },
        {
          swap: "delete",
          check: (el: HTMLElement) => {
            expect(document.body.contains(el)).toBe(false);
          },
        },
        {
          swap: "none",
          check: (el: HTMLElement) => {
            expect(el.innerHTML).toBe("Original");
          },
        },
      ];

      sseStrategies.forEach(({ swap, check }) => {
        it(`should handle SSE payload with swap "${swap}"`, async () => {
          const el = document.createElement("div", {
            is: TEST_TAGS.div,
          }) as HTMLElement;
          el.innerHTML = "Original";
          el.setAttribute("behavior", name);
          el.setAttribute(attributes["request-url"], "http://example.com/sse");
          el.setAttribute(
            attributes["request-trigger"],
            JSON.stringify([{ event: "sse" }]),
          );
          el.setAttribute(attributes["request-swap"], swap);
          document.body.appendChild(el);

          await vi.runAllTimersAsync();

          const listener = mockEventSource.addEventListener.mock.calls.find(
            (call: any) => call[0] === "message",
          )[1];
          const sseData = "<div>SSE Payload</div>";
          listener(new MessageEvent("message", { data: sseData }));

          await vi.runAllTimersAsync();

          check(el);
        });
      });
    });
  });

  describe("State Management", () => {
    it("should set request-state and aria-busy attributes during fetch", async () => {
      const el = document.createElement("button", {
        is: TEST_TAGS.button,
      }) as HTMLElement;
      el.setAttribute("behavior", name);
      el.setAttribute(attributes["request-url"], "http://example.com");
      document.body.appendChild(el);

      // Mock fetch to delay response
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });
      vi.mocked(fetch).mockReturnValue(fetchPromise as any);

      await vi.runAllTimersAsync();

      el.click();
      // Wait for microtask
      await Promise.resolve();

      expect(el.getAttribute("request-state")).toBe("loading");
      expect(el.getAttribute("aria-busy")).toBe("true");

      resolveFetch!({
        ok: true,
        headers: { get: () => null },
        text: () => Promise.resolve("Done"),
      });

      await vi.runAllTimersAsync();
      expect(el.getAttribute("request-state")).toBe("loaded");
      expect(el.getAttribute("aria-busy")).toBe("false");
    });

    it('should set request-state="error" on fetch failure', async () => {
      const el = document.createElement("button", {
        is: TEST_TAGS.button,
      }) as HTMLElement;
      el.setAttribute("behavior", name);
      el.setAttribute(attributes["request-url"], "http://example.com/error");
      document.body.appendChild(el);

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      vi.spyOn(console, "error").mockImplementation(() => {});

      await vi.runAllTimersAsync();
      el.click();
      await vi.runAllTimersAsync();

      expect(el.getAttribute("request-state")).toBe("error");
      expect(el.getAttribute("aria-busy")).toBe("false");
    });
  });

  describe("JSON Script Tag Updates", () => {
    beforeEach(() => {
      // Override fetch to return JSON responses
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            headers: {
              get: () => null,
            },
            text: () => Promise.resolve('{"count": 5}'),
          } as unknown as Response),
        ),
      );
    });

    it("should replace JSON content with innerHTML strategy", async () => {
      const scriptEl = document.createElement("script");
      scriptEl.type = "application/json";
      scriptEl.id = "data-store";
      scriptEl.textContent = '{"count": 1}';
      document.body.appendChild(scriptEl);

      const el = document.createElement("button", {
        is: TEST_TAGS.button,
      }) as HTMLElement;
      el.setAttribute("behavior", name);
      el.setAttribute(attributes["request-url"], "http://example.com/data");
      el.setAttribute(attributes["request-target"], "data-store");
      el.setAttribute(attributes["request-swap"], "innerHTML");
      document.body.appendChild(el);

      await vi.runAllTimersAsync();
      el.click();
      await vi.runAllTimersAsync();

      const updatedScript = document.getElementById("data-store") as HTMLScriptElement;
      expect(updatedScript.textContent).toBe(JSON.stringify({ count: 5 }, null, 2));
    });

    // New array swap strategies tests
    describe("appendToArray strategy", () => {
      it("should push object to end of array", async () => {
        vi.stubGlobal(
          "fetch",
          vi.fn(() =>
            Promise.resolve({
              ok: true,
              status: 200,
              headers: { get: () => null },
              text: () => Promise.resolve('{"id": 3, "name": "New Item"}'),
            } as unknown as Response),
          ),
        );

        const scriptEl = document.createElement("script");
        scriptEl.type = "application/json";
        scriptEl.id = "data-store";
        scriptEl.textContent = '[{"id": 1}, {"id": 2}]';
        document.body.appendChild(scriptEl);

        const el = document.createElement("button", {
          is: TEST_TAGS.button,
        }) as HTMLElement;
        el.setAttribute("behavior", name);
        el.setAttribute(attributes["request-url"], "http://example.com/data");
        el.setAttribute(attributes["request-target"], "data-store");
        el.setAttribute(attributes["request-swap"], "appendToArray");
        document.body.appendChild(el);

        await vi.runAllTimersAsync();
        el.click();
        await vi.runAllTimersAsync();

        const updatedScript = document.getElementById("data-store") as HTMLScriptElement;
        const expected = [{ id: 1 }, { id: 2 }, { id: 3, name: "New Item" }];
        expect(JSON.parse(updatedScript.textContent || "[]")).toEqual(expected);
      });

      it("should push primitive to end of array", async () => {
        vi.stubGlobal(
          "fetch",
          vi.fn(() =>
            Promise.resolve({
              ok: true,
              status: 200,
              headers: { get: () => null },
              text: () => Promise.resolve('"new-string"'),
            } as unknown as Response),
          ),
        );

        const scriptEl = document.createElement("script");
        scriptEl.type = "application/json";
        scriptEl.id = "data-store";
        scriptEl.textContent = '["a", "b"]';
        document.body.appendChild(scriptEl);

        const el = document.createElement("button", {
          is: TEST_TAGS.button,
        }) as HTMLElement;
        el.setAttribute("behavior", name);
        el.setAttribute(attributes["request-url"], "http://example.com/data");
        el.setAttribute(attributes["request-target"], "data-store");
        el.setAttribute(attributes["request-swap"], "appendToArray");
        document.body.appendChild(el);

        await vi.runAllTimersAsync();
        el.click();
        await vi.runAllTimersAsync();

        const updatedScript = document.getElementById("data-store") as HTMLScriptElement;
        const expected = ["a", "b", "new-string"];
        expect(JSON.parse(updatedScript.textContent || "[]")).toEqual(expected);
      });

      it("should push to empty array", async () => {
        vi.stubGlobal(
          "fetch",
          vi.fn(() =>
            Promise.resolve({
              ok: true,
              status: 200,
              headers: { get: () => null },
              text: () => Promise.resolve('{"id": 1}'),
            } as unknown as Response),
          ),
        );

        const scriptEl = document.createElement("script");
        scriptEl.type = "application/json";
        scriptEl.id = "data-store";
        scriptEl.textContent = '[]';
        document.body.appendChild(scriptEl);

        const el = document.createElement("button", {
          is: TEST_TAGS.button,
        }) as HTMLElement;
        el.setAttribute("behavior", name);
        el.setAttribute(attributes["request-url"], "http://example.com/data");
        el.setAttribute(attributes["request-target"], "data-store");
        el.setAttribute(attributes["request-swap"], "appendToArray");
        document.body.appendChild(el);

        await vi.runAllTimersAsync();
        el.click();
        await vi.runAllTimersAsync();

        const updatedScript = document.getElementById("data-store") as HTMLScriptElement;
        const expected = [{ id: 1 }];
        expect(JSON.parse(updatedScript.textContent || "[]")).toEqual(expected);
      });

      it("should warn when existing data is not an array", async () => {
        const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        vi.stubGlobal(
          "fetch",
          vi.fn(() =>
            Promise.resolve({
              ok: true,
              status: 200,
              headers: { get: () => null },
              text: () => Promise.resolve('{"id": 1}'),
            } as unknown as Response),
          ),
        );

        const scriptEl = document.createElement("script");
        scriptEl.type = "application/json";
        scriptEl.id = "data-store";
        scriptEl.textContent = '{"existing": "object"}';
        document.body.appendChild(scriptEl);

        const el = document.createElement("button", {
          is: TEST_TAGS.button,
        }) as HTMLElement;
        el.setAttribute("behavior", name);
        el.setAttribute(attributes["request-url"], "http://example.com/data");
        el.setAttribute(attributes["request-target"], "data-store");
        el.setAttribute(attributes["request-swap"], "appendToArray");
        document.body.appendChild(el);

        await vi.runAllTimersAsync();
        el.click();
        await vi.runAllTimersAsync();

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("appendToArray requires existing data to be an array"),
        );

        const updatedScript = document.getElementById("data-store") as HTMLScriptElement;
        expect(updatedScript.textContent).toBe('{"existing": "object"}');
      });
    });

    describe("appendSpreadToArray strategy", () => {
      it("should spread array to end of existing array", async () => {
        vi.stubGlobal(
          "fetch",
          vi.fn(() =>
            Promise.resolve({
              ok: true,
              status: 200,
              headers: { get: () => null },
              text: () => Promise.resolve('[{"id": 3}, {"id": 4}]'),
            } as unknown as Response),
          ),
        );

        const scriptEl = document.createElement("script");
        scriptEl.type = "application/json";
        scriptEl.id = "data-store";
        scriptEl.textContent = '[{"id": 1}, {"id": 2}]';
        document.body.appendChild(scriptEl);

        const el = document.createElement("button", {
          is: TEST_TAGS.button,
        }) as HTMLElement;
        el.setAttribute("behavior", name);
        el.setAttribute(attributes["request-url"], "http://example.com/data");
        el.setAttribute(attributes["request-target"], "data-store");
        el.setAttribute(attributes["request-swap"], "appendSpreadToArray");
        document.body.appendChild(el);

        await vi.runAllTimersAsync();
        el.click();
        await vi.runAllTimersAsync();

        const updatedScript = document.getElementById("data-store") as HTMLScriptElement;
        const expected = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
        expect(JSON.parse(updatedScript.textContent || "[]")).toEqual(expected);
      });

      it("should spread to empty array", async () => {
        vi.stubGlobal(
          "fetch",
          vi.fn(() =>
            Promise.resolve({
              ok: true,
              status: 200,
              headers: { get: () => null },
              text: () => Promise.resolve('[{"id": 1}]'),
            } as unknown as Response),
          ),
        );

        const scriptEl = document.createElement("script");
        scriptEl.type = "application/json";
        scriptEl.id = "data-store";
        scriptEl.textContent = '[]';
        document.body.appendChild(scriptEl);

        const el = document.createElement("button", {
          is: TEST_TAGS.button,
        }) as HTMLElement;
        el.setAttribute("behavior", name);
        el.setAttribute(attributes["request-url"], "http://example.com/data");
        el.setAttribute(attributes["request-target"], "data-store");
        el.setAttribute(attributes["request-swap"], "appendSpreadToArray");
        document.body.appendChild(el);

        await vi.runAllTimersAsync();
        el.click();
        await vi.runAllTimersAsync();

        const updatedScript = document.getElementById("data-store") as HTMLScriptElement;
        const expected = [{ id: 1 }];
        expect(JSON.parse(updatedScript.textContent || "[]")).toEqual(expected);
      });

      it("should warn when response is not an array", async () => {
        const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        vi.stubGlobal(
          "fetch",
          vi.fn(() =>
            Promise.resolve({
              ok: true,
              status: 200,
              headers: { get: () => null },
              text: () => Promise.resolve('{"id": 1}'),
            } as unknown as Response),
          ),
        );

        const scriptEl = document.createElement("script");
        scriptEl.type = "application/json";
        scriptEl.id = "data-store";
        scriptEl.textContent = '[{"id": 0}]';
        document.body.appendChild(scriptEl);

        const el = document.createElement("button", {
          is: TEST_TAGS.button,
        }) as HTMLElement;
        el.setAttribute("behavior", name);
        el.setAttribute(attributes["request-url"], "http://example.com/data");
        el.setAttribute(attributes["request-target"], "data-store");
        el.setAttribute(attributes["request-swap"], "appendSpreadToArray");
        document.body.appendChild(el);

        await vi.runAllTimersAsync();
        el.click();
        await vi.runAllTimersAsync();

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("appendSpreadToArray requires response to be an array"),
        );

        const updatedScript = document.getElementById("data-store") as HTMLScriptElement;
        expect(updatedScript.textContent).toBe('[{"id": 0}]');
      });

      it("should warn when existing data is not an array", async () => {
        const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        vi.stubGlobal(
          "fetch",
          vi.fn(() =>
            Promise.resolve({
              ok: true,
              status: 200,
              headers: { get: () => null },
              text: () => Promise.resolve('[{"id": 1}]'),
            } as unknown as Response),
          ),
        );

        const scriptEl = document.createElement("script");
        scriptEl.type = "application/json";
        scriptEl.id = "data-store";
        scriptEl.textContent = '{"existing": "object"}';
        document.body.appendChild(scriptEl);

        const el = document.createElement("button", {
          is: TEST_TAGS.button,
        }) as HTMLElement;
        el.setAttribute("behavior", name);
        el.setAttribute(attributes["request-url"], "http://example.com/data");
        el.setAttribute(attributes["request-target"], "data-store");
        el.setAttribute(attributes["request-swap"], "appendSpreadToArray");
        document.body.appendChild(el);

        await vi.runAllTimersAsync();
        el.click();
        await vi.runAllTimersAsync();

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("appendSpreadToArray requires existing data to be an array"),
        );

        const updatedScript = document.getElementById("data-store") as HTMLScriptElement;
        expect(updatedScript.textContent).toBe('{"existing": "object"}');
      });
    });

    describe("prependToArray strategy", () => {
      it("should push object to start of array", async () => {
        vi.stubGlobal(
          "fetch",
          vi.fn(() =>
            Promise.resolve({
              ok: true,
              status: 200,
              headers: { get: () => null },
              text: () => Promise.resolve('{"id": 0, "name": "First"}'),
            } as unknown as Response),
          ),
        );

        const scriptEl = document.createElement("script");
        scriptEl.type = "application/json";
        scriptEl.id = "data-store";
        scriptEl.textContent = '[{"id": 1}, {"id": 2}]';
        document.body.appendChild(scriptEl);

        const el = document.createElement("button", {
          is: TEST_TAGS.button,
        }) as HTMLElement;
        el.setAttribute("behavior", name);
        el.setAttribute(attributes["request-url"], "http://example.com/data");
        el.setAttribute(attributes["request-target"], "data-store");
        el.setAttribute(attributes["request-swap"], "prependToArray");
        document.body.appendChild(el);

        await vi.runAllTimersAsync();
        el.click();
        await vi.runAllTimersAsync();

        const updatedScript = document.getElementById("data-store") as HTMLScriptElement;
        const expected = [{ id: 0, name: "First" }, { id: 1 }, { id: 2 }];
        expect(JSON.parse(updatedScript.textContent || "[]")).toEqual(expected);
      });

      it("should push primitive to start of array", async () => {
        vi.stubGlobal(
          "fetch",
          vi.fn(() =>
            Promise.resolve({
              ok: true,
              status: 200,
              headers: { get: () => null },
              text: () => Promise.resolve('"first"'),
            } as unknown as Response),
          ),
        );

        const scriptEl = document.createElement("script");
        scriptEl.type = "application/json";
        scriptEl.id = "data-store";
        scriptEl.textContent = '["a", "b"]';
        document.body.appendChild(scriptEl);

        const el = document.createElement("button", {
          is: TEST_TAGS.button,
        }) as HTMLElement;
        el.setAttribute("behavior", name);
        el.setAttribute(attributes["request-url"], "http://example.com/data");
        el.setAttribute(attributes["request-target"], "data-store");
        el.setAttribute(attributes["request-swap"], "prependToArray");
        document.body.appendChild(el);

        await vi.runAllTimersAsync();
        el.click();
        await vi.runAllTimersAsync();

        const updatedScript = document.getElementById("data-store") as HTMLScriptElement;
        const expected = ["first", "a", "b"];
        expect(JSON.parse(updatedScript.textContent || "[]")).toEqual(expected);
      });

      it("should push to empty array", async () => {
        vi.stubGlobal(
          "fetch",
          vi.fn(() =>
            Promise.resolve({
              ok: true,
              status: 200,
              headers: { get: () => null },
              text: () => Promise.resolve('{"id": 1}'),
            } as unknown as Response),
          ),
        );

        const scriptEl = document.createElement("script");
        scriptEl.type = "application/json";
        scriptEl.id = "data-store";
        scriptEl.textContent = '[]';
        document.body.appendChild(scriptEl);

        const el = document.createElement("button", {
          is: TEST_TAGS.button,
        }) as HTMLElement;
        el.setAttribute("behavior", name);
        el.setAttribute(attributes["request-url"], "http://example.com/data");
        el.setAttribute(attributes["request-target"], "data-store");
        el.setAttribute(attributes["request-swap"], "prependToArray");
        document.body.appendChild(el);

        await vi.runAllTimersAsync();
        el.click();
        await vi.runAllTimersAsync();

        const updatedScript = document.getElementById("data-store") as HTMLScriptElement;
        const expected = [{ id: 1 }];
        expect(JSON.parse(updatedScript.textContent || "[]")).toEqual(expected);
      });

      it("should warn when existing data is not an array", async () => {
        const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        vi.stubGlobal(
          "fetch",
          vi.fn(() =>
            Promise.resolve({
              ok: true,
              status: 200,
              headers: { get: () => null },
              text: () => Promise.resolve('{"id": 1}'),
            } as unknown as Response),
          ),
        );

        const scriptEl = document.createElement("script");
        scriptEl.type = "application/json";
        scriptEl.id = "data-store";
        scriptEl.textContent = '{"existing": "object"}';
        document.body.appendChild(scriptEl);

        const el = document.createElement("button", {
          is: TEST_TAGS.button,
        }) as HTMLElement;
        el.setAttribute("behavior", name);
        el.setAttribute(attributes["request-url"], "http://example.com/data");
        el.setAttribute(attributes["request-target"], "data-store");
        el.setAttribute(attributes["request-swap"], "prependToArray");
        document.body.appendChild(el);

        await vi.runAllTimersAsync();
        el.click();
        await vi.runAllTimersAsync();

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("prependToArray requires existing data to be an array"),
        );

        const updatedScript = document.getElementById("data-store") as HTMLScriptElement;
        expect(updatedScript.textContent).toBe('{"existing": "object"}');
      });
    });

    describe("prependSpreadToArray strategy", () => {
      it("should spread array to start of existing array", async () => {
        vi.stubGlobal(
          "fetch",
          vi.fn(() =>
            Promise.resolve({
              ok: true,
              status: 200,
              headers: { get: () => null },
              text: () => Promise.resolve('[{"id": -1}, {"id": 0}]'),
            } as unknown as Response),
          ),
        );

        const scriptEl = document.createElement("script");
        scriptEl.type = "application/json";
        scriptEl.id = "data-store";
        scriptEl.textContent = '[{"id": 1}, {"id": 2}]';
        document.body.appendChild(scriptEl);

        const el = document.createElement("button", {
          is: TEST_TAGS.button,
        }) as HTMLElement;
        el.setAttribute("behavior", name);
        el.setAttribute(attributes["request-url"], "http://example.com/data");
        el.setAttribute(attributes["request-target"], "data-store");
        el.setAttribute(attributes["request-swap"], "prependSpreadToArray");
        document.body.appendChild(el);

        await vi.runAllTimersAsync();
        el.click();
        await vi.runAllTimersAsync();

        const updatedScript = document.getElementById("data-store") as HTMLScriptElement;
        const expected = [{ id: -1 }, { id: 0 }, { id: 1 }, { id: 2 }];
        expect(JSON.parse(updatedScript.textContent || "[]")).toEqual(expected);
      });

      it("should spread to empty array", async () => {
        vi.stubGlobal(
          "fetch",
          vi.fn(() =>
            Promise.resolve({
              ok: true,
              status: 200,
              headers: { get: () => null },
              text: () => Promise.resolve('[{"id": 1}]'),
            } as unknown as Response),
          ),
        );

        const scriptEl = document.createElement("script");
        scriptEl.type = "application/json";
        scriptEl.id = "data-store";
        scriptEl.textContent = '[]';
        document.body.appendChild(scriptEl);

        const el = document.createElement("button", {
          is: TEST_TAGS.button,
        }) as HTMLElement;
        el.setAttribute("behavior", name);
        el.setAttribute(attributes["request-url"], "http://example.com/data");
        el.setAttribute(attributes["request-target"], "data-store");
        el.setAttribute(attributes["request-swap"], "prependSpreadToArray");
        document.body.appendChild(el);

        await vi.runAllTimersAsync();
        el.click();
        await vi.runAllTimersAsync();

        const updatedScript = document.getElementById("data-store") as HTMLScriptElement;
        const expected = [{ id: 1 }];
        expect(JSON.parse(updatedScript.textContent || "[]")).toEqual(expected);
      });

      it("should warn when response is not an array", async () => {
        const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        vi.stubGlobal(
          "fetch",
          vi.fn(() =>
            Promise.resolve({
              ok: true,
              status: 200,
              headers: { get: () => null },
              text: () => Promise.resolve('{"id": 1}'),
            } as unknown as Response),
          ),
        );

        const scriptEl = document.createElement("script");
        scriptEl.type = "application/json";
        scriptEl.id = "data-store";
        scriptEl.textContent = '[{"id": 0}]';
        document.body.appendChild(scriptEl);

        const el = document.createElement("button", {
          is: TEST_TAGS.button,
        }) as HTMLElement;
        el.setAttribute("behavior", name);
        el.setAttribute(attributes["request-url"], "http://example.com/data");
        el.setAttribute(attributes["request-target"], "data-store");
        el.setAttribute(attributes["request-swap"], "prependSpreadToArray");
        document.body.appendChild(el);

        await vi.runAllTimersAsync();
        el.click();
        await vi.runAllTimersAsync();

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("prependSpreadToArray requires response to be an array"),
        );

        const updatedScript = document.getElementById("data-store") as HTMLScriptElement;
        expect(updatedScript.textContent).toBe('[{"id": 0}]');
      });

      it("should warn when existing data is not an array", async () => {
        const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        vi.stubGlobal(
          "fetch",
          vi.fn(() =>
            Promise.resolve({
              ok: true,
              status: 200,
              headers: { get: () => null },
              text: () => Promise.resolve('[{"id": 1}]'),
            } as unknown as Response),
          ),
        );

        const scriptEl = document.createElement("script");
        scriptEl.type = "application/json";
        scriptEl.id = "data-store";
        scriptEl.textContent = '{"existing": "object"}';
        document.body.appendChild(scriptEl);

        const el = document.createElement("button", {
          is: TEST_TAGS.button,
        }) as HTMLElement;
        el.setAttribute("behavior", name);
        el.setAttribute(attributes["request-url"], "http://example.com/data");
        el.setAttribute(attributes["request-target"], "data-store");
        el.setAttribute(attributes["request-swap"], "prependSpreadToArray");
        document.body.appendChild(el);

        await vi.runAllTimersAsync();
        el.click();
        await vi.runAllTimersAsync();

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("prependSpreadToArray requires existing data to be an array"),
        );

        const updatedScript = document.getElementById("data-store") as HTMLScriptElement;
        expect(updatedScript.textContent).toBe('{"existing": "object"}');
      });
    });

    it("should maintain backward compatibility with HTML swap strategies", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            headers: {
              get: () => null,
            },
            text: () => Promise.resolve("<p>HTML Response</p>"),
          } as unknown as Response),
        ),
      );

      const el = document.createElement("button", {
        is: TEST_TAGS.button,
      }) as HTMLElement;
      el.setAttribute("behavior", name);
      el.setAttribute(attributes["request-url"], "http://example.com");
      el.setAttribute(attributes["request-swap"], "innerHTML");
      document.body.appendChild(el);

      await vi.runAllTimersAsync();
      el.click();
      await vi.runAllTimersAsync();

      expect(el.innerHTML).toBe("<p>HTML Response</p>");
    });
  });
});
