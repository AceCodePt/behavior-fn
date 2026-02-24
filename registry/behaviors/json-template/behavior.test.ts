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
import { defineBehavioralHost } from "../behavioral-host";
import { registerBehavior } from "../behavior-registry";
import { jsonTemplateBehaviorFactory } from "./behavior";
import JSON_TEMPLATE_DEFINITION from "./_behavior-definition";

describe("JSON Template Behavior", () => {
  const tag = "div";
  const webcomponentTag = "test-json-template";

  beforeAll(() => {
    registerBehavior(JSON_TEMPLATE_DEFINITION.name, jsonTemplateBehaviorFactory);
    defineBehavioralHost(
      tag,
      webcomponentTag,
      getObservedAttributes(JSON_TEMPLATE_DEFINITION.schema),
    );
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Core Functionality", () => {
    it("should render simple value bindings (string, number) on connectedCallback", () => {
      // Setup data source
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({ name: "Sagi", age: 30 });
      document.body.appendChild(script);

      // Setup container with template (new implicit pattern)
      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      container.innerHTML = `
        <template>
          <div>
            <h2 data-key="name"></h2>
            <p>Age: <span data-key="age"></span></p>
          </div>
        </template>
      `;
      document.body.appendChild(container);

      // Verify rendering (content should be in container)
      expect(container.querySelector("h2")?.textContent).toBe("Sagi");
      expect(container.querySelector("span")?.textContent).toBe("30");
      // Template should still exist
      expect(container.querySelector("template")).toBeTruthy();
    });

    it("should handle nested object paths (dot notation)", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({
        user: {
          profile: {
            name: "Sagi",
            email: "sagi@example.com",
          },
        },
      });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      container.innerHTML = `
        <template>
          <div>
            <span data-key="user.profile.name"></span>
            <span data-key="user.profile.email"></span>
          </div>
        </template>
      `;
      document.body.appendChild(container);

      const spans = container.querySelectorAll("span");
      expect(spans[0]?.textContent).toBe("Sagi");
      expect(spans[1]?.textContent).toBe("sagi@example.com");
    });

    it("should handle array access with bracket notation", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({
        items: [
          { title: "First", price: 10 },
          { title: "Second", price: 20 },
        ],
      });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      container.innerHTML = `
        <template>
          <div>
            <span data-key="items[0].title"></span>
            <span data-key="items[1].price"></span>
          </div>
        </template>
      `;
      document.body.appendChild(container);

      const spans = container.querySelectorAll("span");
      expect(spans[0]?.textContent).toBe("First");
      expect(spans[1]?.textContent).toBe("20");
    });

    it("should render array items using implicit nested template", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({
        users: [
          { name: "Alice", age: 25 },
          { name: "Bob", age: 30 },
        ],
      });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      container.innerHTML = `
        <template>
          <ul data-key="users">
            <template>
              <li>
                <span data-key="name"></span> (<span data-key="age"></span>)
              </li>
            </template>
          </ul>
        </template>
      `;
      document.body.appendChild(container);

      const items = container.querySelectorAll("li");
      expect(items).toHaveLength(2);
      expect(items[0]?.textContent?.trim()).toContain("Alice");
      expect(items[0]?.textContent?.trim()).toContain("25");
      expect(items[1]?.textContent?.trim()).toContain("Bob");
      expect(items[1]?.textContent?.trim()).toContain("30");
      
      // Template should still exist (preserved for re-rendering)
      const ul = container.querySelector("ul");
      expect(ul?.querySelector("template")).toBeTruthy();
    });

    it("should render array items using explicit template ID (backward compatibility)", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({
        users: [
          { name: "Alice", age: 25 },
          { name: "Bob", age: 30 },
        ],
      });
      document.body.appendChild(script);

      // Create external item template
      const itemTemplate = document.createElement("template");
      itemTemplate.id = "user-item";
      itemTemplate.innerHTML = `
        <li>
          <span data-key="name"></span> (<span data-key="age"></span>)
        </li>
      `;
      document.body.appendChild(itemTemplate);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      container.innerHTML = `
        <template>
          <ul data-key="users" json-template-item="user-item">
          </ul>
        </template>
      `;
      document.body.appendChild(container);

      const items = container.querySelectorAll("li");
      expect(items).toHaveLength(2);
      expect(items[0]?.textContent?.trim()).toContain("Alice");
      expect(items[0]?.textContent?.trim()).toContain("25");
      expect(items[1]?.textContent?.trim()).toContain("Bob");
      expect(items[1]?.textContent?.trim()).toContain("30");
    });

    it("should render nested arrays using multiple implicit templates", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({
        departments: [
          { 
            name: "Engineering", 
            employees: [
              { name: "Alice" },
              { name: "Bob" }
            ]
          },
          { 
            name: "Sales", 
            employees: [
              { name: "Charlie" }
            ]
          },
        ],
      });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      container.innerHTML = `
        <template>
          <div data-key="departments">
            <template>
              <div class="dept">
                <h3 data-key="name"></h3>
                <ul data-key="employees">
                  <template>
                    <li data-key="name"></li>
                  </template>
                </ul>
              </div>
            </template>
          </div>
        </template>
      `;
      document.body.appendChild(container);

      const depts = container.querySelectorAll(".dept");
      expect(depts).toHaveLength(2);
      
      const firstDeptEmployees = depts[0]?.querySelectorAll("li");
      expect(firstDeptEmployees).toHaveLength(2);
      expect(firstDeptEmployees[0]?.textContent).toBe("Alice");
      expect(firstDeptEmployees[1]?.textContent).toBe("Bob");
      
      const secondDeptEmployees = depts[1]?.querySelectorAll("li");
      expect(secondDeptEmployees).toHaveLength(1);
      expect(secondDeptEmployees[0]?.textContent).toBe("Charlie");
    });

    it("should prefer explicit template ID over implicit nested template", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({
        users: [
          { name: "Alice" },
          { name: "Bob" },
        ],
      });
      document.body.appendChild(script);

      // Create external template (should be used)
      const externalTemplate = document.createElement("template");
      externalTemplate.id = "external-template";
      externalTemplate.innerHTML = `<li>External: <span data-key="name"></span></li>`;
      document.body.appendChild(externalTemplate);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      container.innerHTML = `
        <template>
          <ul data-key="users" json-template-item="external-template">
            <template>
              <li>Internal: <span data-key="name"></span></li>
            </template>
          </ul>
        </template>
      `;
      document.body.appendChild(container);

      const items = container.querySelectorAll("li");
      expect(items).toHaveLength(2);
      // Should use external template
      expect(items[0]?.textContent?.trim()).toContain("External: Alice");
      expect(items[1]?.textContent?.trim()).toContain("External: Bob");
    });

    it("should preserve implicit nested template after rendering", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({
        users: [{ name: "Alice" }],
      });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      container.innerHTML = `
        <template>
          <div data-key="users">
            <template>
              <p data-key="name"></p>
            </template>
          </div>
        </template>
      `;
      document.body.appendChild(container);

      const outerDiv = container.querySelector("div[data-key='users']");
      const nestedTemplate = outerDiv?.querySelector("template");
      
      expect(nestedTemplate).toBeTruthy();
      expect(nestedTemplate?.innerHTML).toContain("<p data-key=\"name\"></p>");
      
      // Should have rendered content AND kept template
      expect(outerDiv).toBeTruthy();
      const renderedItems = outerDiv!.querySelectorAll("p");
      expect(renderedItems.length).toBe(1);
      expect(renderedItems[0]?.textContent).toBe("Alice");
    });

    it("should update when data source changes", async () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({ count: 1 });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      container.innerHTML = `
        <template>
          <div>
            <span data-key="count"></span>
          </div>
        </template>
      `;
      document.body.appendChild(container);

      expect(container.querySelector("span")?.textContent).toBe("1");

      // Update data
      script.textContent = JSON.stringify({ count: 42 });
      
      // Wait for MutationObserver
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(container.querySelector("span")?.textContent).toBe("42");
    });

    it("should handle empty data source gracefully", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = "";
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      container.innerHTML = `
        <template>
          <div data-key="name"></div>
        </template>
      `;
      document.body.appendChild(container);

      // Should not crash, just not render
      expect(container.querySelector("div")).toBeNull();
      // Template should still exist
      expect(container.querySelector("template")).toBeTruthy();
    });

    it("should handle missing data paths gracefully", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({ foo: "bar" });
      document.body.appendChild(script);

      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      container.innerHTML = `
        <template>
          <div>
            <span data-key="nonexistent.path"></span>
          </div>
        </template>
      `;
      document.body.appendChild(container);

      // Should log error about missing path
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining("Data path not found"),
      );
    });
  });

  describe("Edge Cases", () => {
    it("should require json-template-for attribute", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      // Missing json-template-for
      container.innerHTML = `<template><div></div></template>`;
      document.body.appendChild(container);

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining("json-template-for attribute is required"),
      );
    });

    it("should error if data source element not found", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "nonexistent");
      container.innerHTML = `<template><div></div></template>`;
      document.body.appendChild(container);

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining("Data source element not found"),
      );
    });

    it("should error if no template element found as child", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({ foo: "bar" });
      document.body.appendChild(script);

      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      // No template child
      container.innerHTML = `<div>No template</div>`;
      document.body.appendChild(container);

      expect(consoleError).toHaveBeenCalled();
      const errorCall = consoleError.mock.calls[0];
      expect(errorCall[0]).toContain("No <template> element found as direct child");
    });

    it("should handle invalid JSON in data source", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = "{ invalid json }";
      document.body.appendChild(script);

      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      container.innerHTML = `<template><div></div></template>`;
      document.body.appendChild(container);

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining("Invalid JSON in source element"),
        expect.anything(),
      );
    });
  });
});
