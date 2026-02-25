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

describe("JSON Template Behavior - Curly Brace Syntax", () => {
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

  describe("Text Content Interpolation", () => {
    it("should interpolate simple values in text content", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({ name: "Sagi", age: 30 });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      container.innerHTML = `
        <template>
          <div>
            <h2>{name}</h2>
            <p>Age: {age}</p>
          </div>
        </template>
      `;
      document.body.appendChild(container);

      expect(container.querySelector("h2")?.textContent).toBe("Sagi");
      expect(container.querySelector("p")?.textContent).toBe("Age: 30");
      expect(container.querySelector("template")).toBeTruthy();
    });

    it("should interpolate mixed static and dynamic text", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({ name: "Sagi", type: "user" });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      container.innerHTML = `
        <template>
          <div>Username: {name}</div>
        </template>
      `;
      document.body.appendChild(container);

      expect(container.querySelector("div")?.textContent).toBe("Username: Sagi");
    });

    it("should handle nested object paths with dot notation", () => {
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
            <span>{user.profile.name}</span>
            <span>{user.profile.email}</span>
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
            <span>{items[0].title}</span>
            <span>{items[1].price}</span>
          </div>
        </template>
      `;
      document.body.appendChild(container);

      const spans = container.querySelectorAll("span");
      expect(spans[0]?.textContent).toBe("First");
      expect(spans[1]?.textContent).toBe("20");
    });

    it("should handle multiple interpolations in one text node", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({ firstName: "Sagi", lastName: "Cohen", age: 30 });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      container.innerHTML = `
        <template>
          <p>{firstName} {lastName} is {age} years old</p>
        </template>
      `;
      document.body.appendChild(container);

      expect(container.querySelector("p")?.textContent).toBe("Sagi Cohen is 30 years old");
    });
  });

  describe("Attribute Interpolation", () => {
    it("should interpolate values in attributes", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({ type: "user", id: "123" });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      container.innerHTML = `
        <template>
          <div data-type="{type}" data-id="{id}">Content</div>
        </template>
      `;
      document.body.appendChild(container);

      const div = container.querySelector("div");
      expect(div?.getAttribute("data-type")).toBe("user");
      expect(div?.getAttribute("data-id")).toBe("123");
    });

    it("should handle multiple interpolations in one attribute", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({ base: "btn", modifier: "primary" });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      container.innerHTML = `
        <template>
          <button class="{base} btn-{modifier}">Click</button>
        </template>
      `;
      document.body.appendChild(container);

      expect(container.querySelector("button")?.className).toBe("btn btn-primary");
    });

    it("should preserve non-interpolated attributes", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({ id: "dynamic-id" });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      container.innerHTML = `
        <template>
          <div id="{id}" class="static-class" data-static="value">Content</div>
        </template>
      `;
      document.body.appendChild(container);

      const div = container.querySelector("div");
      expect(div?.id).toBe("dynamic-id");
      expect(div?.className).toBe("static-class");
      expect(div?.getAttribute("data-static")).toBe("value");
    });

    it("should support web component is attribute", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({ title: "Modal Title", content: "Modal content here" });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      container.innerHTML = `
        <template>
          <dialog is="behavioral-reveal" behavior="reveal">
            <h2>{title}</h2>
            <p>{content}</p>
          </dialog>
        </template>
      `;
      document.body.appendChild(container);

      const dialog = container.querySelector("dialog");
      expect(dialog?.getAttribute("is")).toBe("behavioral-reveal");
      expect(dialog?.getAttribute("behavior")).toBe("reveal");
      expect(dialog?.querySelector("h2")?.textContent).toBe("Modal Title");
      expect(dialog?.querySelector("p")?.textContent).toBe("Modal content here");
    });
  });

  describe("Array Rendering", () => {
    it("should render arrays using implicit nested template", () => {
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
          <ul>
            <template data-array="users">
              <li>{name} ({age})</li>
            </template>
          </ul>
        </template>
      `;
      document.body.appendChild(container);

      const items = container.querySelectorAll("li");
      expect(items).toHaveLength(2);
      expect(items[0]?.textContent?.trim()).toBe("Alice (25)");
      expect(items[1]?.textContent?.trim()).toBe("Bob (30)");
    });

    it("should handle nested arrays", () => {
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
          <div>
            <template data-array="departments">
              <div class="dept">
                <h3>{name}</h3>
                <ul>
                  <template data-array="employees">
                    <li>{name}</li>
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

    it("should preserve nested template after rendering", () => {
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
          <div>
            <template data-array="users">
              <p>{name}</p>
            </template>
          </div>
        </template>
      `;
      document.body.appendChild(container);

      const outerDiv = container.querySelector("div");
      const nestedTemplate = outerDiv?.querySelector("template");
      
      expect(nestedTemplate).toBeTruthy();
      expect(nestedTemplate?.getAttribute("data-array")).toBe("users");
      
      // Should have rendered content AND kept template
      const renderedItems = outerDiv?.querySelectorAll("p");
      expect(renderedItems?.length).toBe(1);
      expect(renderedItems?.[0]?.textContent).toBe("Alice");
    });
  });

  describe("Reactivity", () => {
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
          <div>Count: {count}</div>
        </template>
      `;
      document.body.appendChild(container);

      expect(container.querySelector("div")?.textContent).toBe("Count: 1");

      // Update data
      script.textContent = JSON.stringify({ count: 42 });
      
      // Wait for MutationObserver
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(container.querySelector("div")?.textContent).toBe("Count: 42");
    });
  });

  describe("Edge Cases", () => {
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
          <div>{name}</div>
        </template>
      `;
      document.body.appendChild(container);

      // Should not crash, just not render
      expect(container.querySelector("div")).toBeNull();
      expect(container.querySelector("template")).toBeTruthy();
    });

    it("should handle missing data paths gracefully", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({ foo: "bar" });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      container.innerHTML = `
        <template>
          <div>Value: {nonexistent.path}</div>
        </template>
      `;
      document.body.appendChild(container);

      // Should render with empty string for missing value
      expect(container.querySelector("div")?.textContent).toBe("Value: ");
    });

    it("should require json-template-for attribute", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.innerHTML = `<template><div>{name}</div></template>`;
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
      container.innerHTML = `<template><div>{name}</div></template>`;
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
      container.innerHTML = `<template><div>{name}</div></template>`;
      document.body.appendChild(container);

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining("Invalid JSON in source element"),
        expect.anything(),
      );
    });

    it("should handle literal curly braces in text", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({ name: "Sagi" });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute("json-template-for", "data-source");
      container.innerHTML = `
        <template>
          <div>Hello {name}</div>
        </template>
      `;
      document.body.appendChild(container);

      // For now, we don't support escaping - this will be interpolated
      expect(container.querySelector("div")?.textContent).toBe("Hello Sagi");
    });
  });
});
