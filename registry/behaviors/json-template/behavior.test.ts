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
import definition from "./_behavior-definition";

const { name, schema, attributes } = definition;

describe("JSON Template Behavior - Curly Brace Syntax", () => {
  const tag = "div";
  const webcomponentTag = "test-json-template";

  beforeAll(() => {
    registerBehavior(name, jsonTemplateBehaviorFactory);
    defineBehavioralHost(tag, webcomponentTag, getObservedAttributes(schema));
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
      container.setAttribute(attributes["json-template-for"], "data-source");
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
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.innerHTML = `
        <template>
          <div>Username: {name}</div>
        </template>
      `;
      document.body.appendChild(container);

      expect(container.querySelector("div")?.textContent).toBe(
        "Username: Sagi",
      );
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
      container.setAttribute(attributes["json-template-for"], "data-source");
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
      container.setAttribute(attributes["json-template-for"], "data-source");
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

    it("should handle negative array indices (access from end)", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({
        items: ["a", "b", "c"],
      });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.innerHTML = `
        <template>
          <div>
            <span class="last">{items[-1]}</span>
            <span class="second-last">{items[-2]}</span>
            <span class="third-last">{items[-3]}</span>
          </div>
        </template>
      `;
      document.body.appendChild(container);

      expect(container.querySelector(".last")?.textContent).toBe("c");
      expect(container.querySelector(".second-last")?.textContent).toBe("b");
      expect(container.querySelector(".third-last")?.textContent).toBe("a");
    });

    it("should return empty string for out of bounds negative index", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({
        items: ["a", "b"],
      });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.innerHTML = `
        <template>
          <div>Value: {items[-5]}</div>
        </template>
      `;
      document.body.appendChild(container);

      expect(container.querySelector("div")?.textContent).toBe("Value: ");
    });

    it("should return empty string for negative index on empty array", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({
        items: [],
      });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.innerHTML = `
        <template>
          <div>Last: {items[-1]}</div>
        </template>
      `;
      document.body.appendChild(container);

      expect(container.querySelector("div")?.textContent).toBe("Last: ");
    });

    it("should handle negative indices with nested object paths", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({
        session: {
          turns: [
            { query: { text: "first" } },
            { query: { text: "last" } },
          ],
        },
      });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.innerHTML = `
        <template>
          <div>
            <span class="first">{session.turns[0].query.text}</span>
            <span class="last">{session.turns[-1].query.text}</span>
          </div>
        </template>
      `;
      document.body.appendChild(container);

      expect(container.querySelector(".first")?.textContent).toBe("first");
      expect(container.querySelector(".last")?.textContent).toBe("last");
    });

    it("should handle negative indices with fallback operators", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({
        messages: ["hello", "world"],
      });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.innerHTML = `
        <template>
          <div>
            <span class="valid">{messages[-1] || "no message"}</span>
            <span class="invalid">{messages[-5] || "no message"}</span>
          </div>
        </template>
      `;
      document.body.appendChild(container);

      expect(container.querySelector(".valid")?.textContent).toBe("world");
      expect(container.querySelector(".invalid")?.textContent).toBe("no message");
    });

    it("should handle negative indices in attribute values", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({
        colors: ["red", "green", "blue"],
      });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.innerHTML = `
        <template>
          <div 
            data-first="{colors[0]}" 
            data-last="{colors[-1]}"
            class="color-{colors[-2]}">Content</div>
        </template>
      `;
      document.body.appendChild(container);

      const div = container.querySelector("div");
      expect(div?.getAttribute("data-first")).toBe("red");
      expect(div?.getAttribute("data-last")).toBe("blue");
      expect(div?.className).toBe("color-green");
    });

    it("should handle multiple interpolations in one text node", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({
        firstName: "Sagi",
        lastName: "Cohen",
        age: 30,
      });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.innerHTML = `
        <template>
          <p>{firstName} {lastName} is {age} years old</p>
        </template>
      `;
      document.body.appendChild(container);

      expect(container.querySelector("p")?.textContent).toBe(
        "Sagi Cohen is 30 years old",
      );
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
      container.setAttribute(
        attributes[attributes["json-template-for"]],
        "data-source",
      );
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
      container.setAttribute(
        attributes[attributes["json-template-for"]],
        "data-source",
      );
      container.innerHTML = `
        <template>
          <button class="{base} btn-{modifier}">Click</button>
        </template>
      `;
      document.body.appendChild(container);

      expect(container.querySelector("button")?.className).toBe(
        "btn btn-primary",
      );
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
      container.setAttribute(
        attributes[attributes["json-template-for"]],
        "data-source",
      );
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
      script.textContent = JSON.stringify({
        title: "Modal Title",
        content: "Modal content here",
      });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
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
      expect(dialog?.querySelector("p")?.textContent).toBe(
        "Modal content here",
      );
    });
  });

  describe("Array Rendering", () => {
    it("should render root-level array (array as root data)", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify([
        { name: "Alice", age: 25 },
        { name: "Bob", age: 30 },
        { name: "Charlie", age: 35 },
      ]);
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.innerHTML = `
        <template>
          <div class="person">
            <h3>{name}</h3>
            <p>Age: {age}</p>
          </div>
        </template>
      `;
      document.body.appendChild(container);

      const people = container.querySelectorAll(".person");
      expect(people).toHaveLength(3);
      expect(people[0]?.querySelector("h3")?.textContent).toBe("Alice");
      expect(people[0]?.querySelector("p")?.textContent).toBe("Age: 25");
      expect(people[1]?.querySelector("h3")?.textContent).toBe("Bob");
      expect(people[1]?.querySelector("p")?.textContent).toBe("Age: 30");
      expect(people[2]?.querySelector("h3")?.textContent).toBe("Charlie");
      expect(people[2]?.querySelector("p")?.textContent).toBe("Age: 35");
    });

    it("should render root-level array with compact template syntax", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify([
        { title: "Buy groceries", priority: "high" },
        { title: "Walk the dog", priority: "medium" },
        { title: "Write documentation", priority: "high" },
      ]);
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.innerHTML = `
        <template>
          <div class="todo priority-{priority}">
            {title}
          </div>
        </template>
      `;
      document.body.appendChild(container);

      const items = container.querySelectorAll(".todo");
      expect(items).toHaveLength(3);
      expect(items[0]?.textContent?.trim()).toBe("Buy groceries");
      expect(items[0]?.classList.contains("priority-high")).toBe(true);
      expect(items[1]?.textContent?.trim()).toBe("Walk the dog");
      expect(items[1]?.classList.contains("priority-medium")).toBe(true);
      expect(items[2]?.textContent?.trim()).toBe("Write documentation");
      expect(items[2]?.classList.contains("priority-high")).toBe(true);
    });

    it("should render template once for empty root-level array with empty context", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify([]);
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.innerHTML = `
        <template>
          <div class="item">{name || "Guest"}</div>
        </template>
      `;
      document.body.appendChild(container);

      // Should render template once with empty context (fallback value)
      const items = container.querySelectorAll(".item");
      expect(items).toHaveLength(1);
      expect(items[0]?.textContent).toBe("Guest");
      
      // Template should still be present
      expect(container.querySelector("template")).toBeTruthy();
    });

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
      container.setAttribute(attributes["json-template-for"], "data-source");
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
            employees: [{ name: "Alice" }, { name: "Bob" }],
          },
          {
            name: "Sales",
            employees: [{ name: "Charlie" }],
          },
        ],
      });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
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
      container.setAttribute(attributes["json-template-for"], "data-source");
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

    it("should handle objects nested in arrays with deep property access", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify({
        team: [
          {
            name: "Sarah",
            profile: {
              email: "sarah@example.com",
              title: "Engineer",
              years: 5,
            },
            address: {
              city: "San Francisco",
              state: "CA",
            },
          },
          {
            name: "Marcus",
            profile: {
              email: "marcus@example.com",
              title: "Designer",
              years: 3,
            },
            address: {
              city: "Austin",
              state: "TX",
            },
          },
        ],
      });
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.innerHTML = `
        <template>
          <div>
            <template data-array="team">
              <div class="member">
                <h3>{name}</h3>
                <p>{profile.title} - {profile.email}</p>
                <p>{address.city}, {address.state}</p>
                <p>{profile.years} years experience</p>
              </div>
            </template>
          </div>
        </template>
      `;
      document.body.appendChild(container);

      const members = container.querySelectorAll(".member");
      expect(members).toHaveLength(2);

      // First member
      expect(members[0]?.querySelector("h3")?.textContent).toBe("Sarah");
      expect(members[0]?.querySelectorAll("p")[0]?.textContent).toBe(
        "Engineer - sarah@example.com",
      );
      expect(members[0]?.querySelectorAll("p")[1]?.textContent).toBe(
        "San Francisco, CA",
      );
      expect(members[0]?.querySelectorAll("p")[2]?.textContent).toBe(
        "5 years experience",
      );

      // Second member
      expect(members[1]?.querySelector("h3")?.textContent).toBe("Marcus");
      expect(members[1]?.querySelectorAll("p")[0]?.textContent).toBe(
        "Designer - marcus@example.com",
      );
      expect(members[1]?.querySelectorAll("p")[1]?.textContent).toBe(
        "Austin, TX",
      );
      expect(members[1]?.querySelectorAll("p")[2]?.textContent).toBe(
        "3 years experience",
      );
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
      container.setAttribute(attributes["json-template-for"], "data-source");
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
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.querySelector("div")?.textContent).toBe("Count: 42");
    });

    it("should handle root array transitions (empty -> populated -> empty)", async () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify([]);
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.innerHTML = `
        <template>
          <div class="item">{name || "Empty"}</div>
        </template>
      `;
      document.body.appendChild(container);

      // Initially empty - renders once with empty context
      expect(container.querySelectorAll(".item")).toHaveLength(1);
      expect(container.querySelectorAll(".item")[0]?.textContent).toBe("Empty");

      // Add items
      script.textContent = JSON.stringify([
        { name: "Alice" },
        { name: "Bob" },
      ]);
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.querySelectorAll(".item")).toHaveLength(2);
      expect(container.querySelectorAll(".item")[0]?.textContent).toBe("Alice");
      expect(container.querySelectorAll(".item")[1]?.textContent).toBe("Bob");

      // Clear array - back to single render with empty context
      script.textContent = JSON.stringify([]);
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.querySelectorAll(".item")).toHaveLength(1);
      expect(container.querySelectorAll(".item")[0]?.textContent).toBe("Empty");
      expect(container.querySelector("template")).toBeTruthy();
    });

    it("should update when root array items change", async () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify([{ name: "Alice" }]);
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.innerHTML = `
        <template>
          <div class="item">{name}</div>
        </template>
      `;
      document.body.appendChild(container);

      expect(container.querySelectorAll(".item")).toHaveLength(1);
      expect(container.querySelectorAll(".item")[0]?.textContent).toBe("Alice");

      // Update array
      script.textContent = JSON.stringify([
        { name: "Alice" },
        { name: "Bob" },
        { name: "Charlie" },
      ]);
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(container.querySelectorAll(".item")).toHaveLength(3);
      expect(container.querySelectorAll(".item")[0]?.textContent).toBe("Alice");
      expect(container.querySelectorAll(".item")[1]?.textContent).toBe("Bob");
      expect(container.querySelectorAll(".item")[2]?.textContent).toBe(
        "Charlie",
      );
    });

    it("should enable forms with empty array using fallback operators", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify([]);
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.innerHTML = `
        <template>
          <form>
            <input name="query" placeholder="{query || 'Enter query'}">
            <input name="session" value="{session || '-'}">
            <button type="submit">Submit</button>
          </form>
        </template>
      `;
      document.body.appendChild(container);

      // Form should render with fallback values
      const form = container.querySelector("form");
      expect(form).toBeTruthy();

      const queryInput = form?.querySelector(
        'input[name="query"]',
      ) as HTMLInputElement;
      const sessionInput = form?.querySelector(
        'input[name="session"]',
      ) as HTMLInputElement;

      expect(queryInput).toBeTruthy();
      expect(queryInput?.placeholder).toBe("Enter query");

      expect(sessionInput).toBeTruthy();
      expect(sessionInput?.value).toBe("-");

      expect(form?.querySelector("button")).toBeTruthy();
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
      container.setAttribute(attributes["json-template-for"], "data-source");
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
      container.setAttribute(attributes["json-template-for"], "data-source");
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
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

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
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "nonexistent");
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

      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.innerHTML = `<div>No template</div>`;
      document.body.appendChild(container);

      expect(consoleError).toHaveBeenCalled();
      const errorCall = consoleError.mock.calls[0];
      expect(errorCall[0]).toContain(
        "No <template> element found as direct child",
      );
    });

    it("should handle invalid JSON in data source", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = "{ invalid json }";
      document.body.appendChild(script);

      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
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
      container.setAttribute(attributes["json-template-for"], "data-source");
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

  describe("Fallback Operators", () => {
    describe("|| Operator (Logical OR)", () => {
      it("should use fallback for undefined values", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({ age: 30 });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{name || "Guest"}</div>
          </template>
        `;
        document.body.appendChild(container);

        expect(container.querySelector("div")?.textContent).toBe("Guest");
      });

      it("should use actual value when defined", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({ name: "Alice" });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{name || "Guest"}</div>
          </template>
        `;
        document.body.appendChild(container);

        expect(container.querySelector("div")?.textContent).toBe("Alice");
      });

      it("should use fallback for falsy values (0, false, empty string)", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({
          count: 0,
          active: false,
          message: "",
        });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>
              <span class="count">{count || 10}</span>
              <span class="active">{active || "N/A"}</span>
              <span class="message">{message || "No message"}</span>
            </div>
          </template>
        `;
        document.body.appendChild(container);

        expect(container.querySelector(".count")?.textContent).toBe("10");
        expect(container.querySelector(".active")?.textContent).toBe("N/A");
        expect(container.querySelector(".message")?.textContent).toBe(
          "No message",
        );
      });

      it("should support single quotes for string fallbacks", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({});
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{name || 'Anonymous'}</div>
          </template>
        `;
        document.body.appendChild(container);

        expect(container.querySelector("div")?.textContent).toBe("Anonymous");
      });

      it("should support numeric fallbacks", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({});
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{count || 42}</div>
          </template>
        `;
        document.body.appendChild(container);

        expect(container.querySelector("div")?.textContent).toBe("42");
      });

      it("should support boolean fallbacks", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({});
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{active || true}</div>
          </template>
        `;
        document.body.appendChild(container);

        expect(container.querySelector("div")?.textContent).toBe("true");
      });
    });

    describe("&& Operator (Logical AND)", () => {
      it("should use fallback when value is truthy", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({ 
          name: "Alice",
          count: 5,
          active: true 
        });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>
              <span class="name">{name && "Name exists"}</span>
              <span class="count">{count && "Has items"}</span>
              <span class="active">{active && "Active user"}</span>
            </div>
          </template>
        `;
        document.body.appendChild(container);

        expect(container.querySelector(".name")?.textContent).toBe("Name exists");
        expect(container.querySelector(".count")?.textContent).toBe("Has items");
        expect(container.querySelector(".active")?.textContent).toBe("Active user");
      });

      it("should NOT use fallback for falsy values", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({
          count: 0,
          active: false,
          message: "",
        });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>
              <span class="count">{count && "Has count"}</span>
              <span class="active">{active && "Is active"}</span>
              <span class="message">{message && "Has message"}</span>
            </div>
          </template>
        `;
        document.body.appendChild(container);

        expect(container.querySelector(".count")?.textContent).toBe("0");
        expect(container.querySelector(".active")?.textContent).toBe("false");
        expect(container.querySelector(".message")?.textContent).toBe("");
      });

      it("should render empty string for undefined/null values", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({
          name: null,
        });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>
              <span class="name">{name && "Name exists"}</span>
              <span class="missing">{missing && "Missing exists"}</span>
            </div>
          </template>
        `;
        document.body.appendChild(container);

        expect(container.querySelector(".name")?.textContent).toBe("");
        expect(container.querySelector(".missing")?.textContent).toBe("");
      });

      it("should work with numeric and boolean fallbacks", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({
          premium: true,
          hasAccess: 1,
        });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>
              <span class="premium">{premium && 100}</span>
              <span class="access">{hasAccess && true}</span>
            </div>
          </template>
        `;
        document.body.appendChild(container);

        expect(container.querySelector(".premium")?.textContent).toBe("100");
        expect(container.querySelector(".access")?.textContent).toBe("true");
      });
    });

    describe("?? Operator (Nullish Coalescing)", () => {
      it("should use fallback only for null/undefined", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({
          name: null,
          age: undefined,
        });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>
              <span class="name">{name ?? "Unknown"}</span>
              <span class="age">{age ?? "N/A"}</span>
            </div>
          </template>
        `;
        document.body.appendChild(container);

        expect(container.querySelector(".name")?.textContent).toBe("Unknown");
        expect(container.querySelector(".age")?.textContent).toBe("N/A");
      });

      it("should NOT use fallback for falsy non-nullish values", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({
          count: 0,
          active: false,
          message: "",
        });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>
              <span class="count">{count ?? 10}</span>
              <span class="active">{active ?? "N/A"}</span>
              <span class="message">{message ?? "No message"}</span>
            </div>
          </template>
        `;
        document.body.appendChild(container);

        expect(container.querySelector(".count")?.textContent).toBe("0");
        expect(container.querySelector(".active")?.textContent).toBe("false");
        expect(container.querySelector(".message")?.textContent).toBe("");
      });
    });

    describe("Fallbacks with Nested Paths", () => {
      it("should work with dot notation paths", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({
          user: { profile: { email: "test@example.com" } },
        });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>
              <span class="name">{user.profile.name || "Anonymous"}</span>
              <span class="email">{user.profile.email || "No email"}</span>
            </div>
          </template>
        `;
        document.body.appendChild(container);

        expect(container.querySelector(".name")?.textContent).toBe("Anonymous");
        expect(container.querySelector(".email")?.textContent).toBe(
          "test@example.com",
        );
      });

      it("should work with bracket notation", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({
          items: [{ title: "First" }],
        });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>
              <span class="first">{items[0].title || "Untitled"}</span>
              <span class="second">{items[1].title ?? "Missing"}</span>
            </div>
          </template>
        `;
        document.body.appendChild(container);

        expect(container.querySelector(".first")?.textContent).toBe("First");
        expect(container.querySelector(".second")?.textContent).toBe("Missing");
      });
    });

    describe("Fallbacks in Attributes", () => {
      it("should work in attribute values", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({ role: null, active: true });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div 
              data-role="{role ?? 'guest'}" 
              class="user-{role || 'default'}"
              data-status="{active && 'online'}">Content</div>
          </template>
        `;
        document.body.appendChild(container);

        const div = container.querySelector("div");
        expect(div?.getAttribute("data-role")).toBe("guest");
        expect(div?.className).toBe("user-default");
        expect(div?.getAttribute("data-status")).toBe("online");
      });
    });

    describe("Fallbacks in Array Templates", () => {
      it("should work within nested array templates", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({
          users: [
            { name: "Alice", role: "admin" },
            { name: null, role: "user" },
            { role: "guest" },
          ],
        });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <ul>
              <template data-array="users">
                <li>{name || "Anonymous"} - {role ?? "N/A"}</li>
              </template>
            </ul>
          </template>
        `;
        document.body.appendChild(container);

        const items = container.querySelectorAll("li");
        expect(items).toHaveLength(3);
        expect(items[0]?.textContent?.trim()).toBe("Alice - admin");
        expect(items[1]?.textContent?.trim()).toBe("Anonymous - user");
        expect(items[2]?.textContent?.trim()).toBe("Anonymous - guest");
      });
    });

    describe("Whitespace Handling", () => {
      it("should handle whitespace around operators", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({});
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{ name  ||  "Guest" }</div>
          </template>
        `;
        document.body.appendChild(container);

        expect(container.querySelector("div")?.textContent).toBe("Guest");
      });
    });

    describe("Mixed Operators", () => {
      it("should handle all three operators in different interpolations", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({ 
          verified: true,
          score: 0,
          status: null 
        });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <p>{verified && "✓"} Score: {score ?? "N/A"} - {status || "Unknown"}</p>
          </template>
        `;
        document.body.appendChild(container);

        expect(container.querySelector("p")?.textContent).toBe("✓ Score: 0 - Unknown");
      });
    });

    describe("Backward Compatibility", () => {
      it("should preserve old behavior when no operator is used", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({});
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>Value: {nonexistent}</div>
          </template>
        `;
        document.body.appendChild(container);

        // Should render empty string for missing value (old behavior)
        expect(container.querySelector("div")?.textContent).toBe("Value: ");
      });
    });

    describe("Edge Cases with Operators in Strings", () => {
      it("should handle || inside quoted fallback strings", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({});
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{message || "A || B"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // Should use the fallback string "A || B" (not split on inner ||)
        expect(container.querySelector("div")?.textContent).toBe("A || B");
      });

      it("should handle ?? inside quoted fallback strings", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({});
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{value ?? "X ?? Y"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // Should use the fallback string "X ?? Y" (not split on inner ??)
        expect(container.querySelector("div")?.textContent).toBe("X ?? Y");
      });

      it("should handle && inside quoted fallback strings", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({ active: true });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{active && "Fish && Chips"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // Should use the fallback string "Fish && Chips" (not split on inner &&)
        expect(container.querySelector("div")?.textContent).toBe("Fish && Chips");
      });

      it("should handle complex operator combinations in quoted strings", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({ hasOp: true });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{"&&" && "||"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // Should parse '&&' as a literal string (truthy)
        // and return the fallback "||"
        expect(container.querySelector("div")?.textContent).toBe("||");
      });

      it("should handle quoted literal on left with ||", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({});
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{"" || "fallback"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // Empty string literal is falsy, should use fallback
        expect(container.querySelector("div")?.textContent).toBe("fallback");
      });

      it("should handle quoted literal on left with ??", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({});
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{"" ?? "fallback"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // Empty string literal is NOT nullish, should keep empty string
        expect(container.querySelector("div")?.textContent).toBe("");
      });

      it("should handle single quotes in both operands", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({});
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{'||' && '&&'}</div>
          </template>
        `;
        document.body.appendChild(container);

        // '||' is truthy, should return '&&'
        expect(container.querySelector("div")?.textContent).toBe("&&");
      });

      it('should handle {"||" && "&&"}', () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({});
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{"||" && "&&"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // "||" is truthy, should return "&&"
        expect(container.querySelector("div")?.textContent).toBe("&&");
      });

      it('should handle {"||" || "&&"}', () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({});
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{"||" || "&&"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // "||" is truthy, should keep "||" (not use fallback)
        expect(container.querySelector("div")?.textContent).toBe("||");
      });

      it('should handle {"??" && "||"}', () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({});
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{"??" && "||"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // "??" is truthy, should return "||"
        expect(container.querySelector("div")?.textContent).toBe("||");
      });

      it('should handle {"??" || "&&"}', () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({});
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{"??" || "&&"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // "??" is truthy, should keep "??" (not use fallback)
        expect(container.querySelector("div")?.textContent).toBe("??");
      });

      it('should handle {"??" ?? "||"}', () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({});
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{"??" ?? "||"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // "??" is not nullish, should keep "??"
        expect(container.querySelector("div")?.textContent).toBe("??");
      });

      it('should handle {"&&" || "??"}', () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({});
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{"&&" || "??"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // "&&" is truthy, should keep "&&" (not use fallback)
        expect(container.querySelector("div")?.textContent).toBe("&&");
      });

      it('should handle {"&&" ?? "||"}', () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({});
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{"&&" ?? "||"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // "&&" is not nullish, should keep "&&"
        expect(container.querySelector("div")?.textContent).toBe("&&");
      });

      it('should handle all three operators as literals and operators', () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({});
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div class="a">{"||" && "&&"}</div>
            <div class="b">{"&&" || "??"}</div>
            <div class="c">{"??" ?? "||"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // All operator strings are truthy
        expect(container.querySelector(".a")?.textContent).toBe("&&");  // && returns fallback for truthy
        expect(container.querySelector(".b")?.textContent).toBe("&&");  // || keeps value when truthy
        expect(container.querySelector(".c")?.textContent).toBe("??");  // ?? keeps value when not nullish
      });

      it('should handle unquoted "undefined" as a path (not literal)', () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({ undefined: "has-value" });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{undefined ?? "??"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // "undefined" without quotes is a path, looks for data.undefined
        // data has undefined: "has-value", so returns "has-value"
        expect(container.querySelector("div")?.textContent).toBe("has-value");
      });

      it('should handle unquoted "undefined" path with missing property', () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({});
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{undefined ?? "??"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // "undefined" without quotes is a path, data.undefined doesn't exist
        // resolvePath returns undefined, ?? operator uses fallback "??"
        expect(container.querySelector("div")?.textContent).toBe("??");
      });

      it('should handle quoted "undefined" as literal string', () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({});
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{"undefined" ?? "??"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // "undefined" WITH quotes is a literal string (truthy)
        // ?? operator keeps the value when not nullish
        expect(container.querySelector("div")?.textContent).toBe("undefined");
      });

      it('should handle quoted "null" as literal string', () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({});
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{"null" ?? "??"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // "null" WITH quotes is a literal string (truthy, not actual null)
        // ?? operator keeps the value when not nullish
        expect(container.querySelector("div")?.textContent).toBe("null");
      });
    });

    describe("Deep Path Safety - Undefined Intermediate Properties", () => {
      it("should safely handle a.b.c where b is undefined (no errors)", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({
          a: {
            // b is missing
            other: "value"
          }
        });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{a.b.c}</div>
          </template>
        `;
        document.body.appendChild(container);

        // Should not throw error, should return empty string
        expect(container.querySelector("div")?.textContent).toBe("");
      });

      it("should safely handle a.b.c where a is undefined", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({
          other: "value"
        });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{a.b.c}</div>
          </template>
        `;
        document.body.appendChild(container);

        // Should not throw error, should return empty string
        expect(container.querySelector("div")?.textContent).toBe("");
      });

      it("should use fallback when intermediate property is undefined", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({
          user: {
            // profile is missing
            name: "John"
          }
        });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{user.profile.email || "no-email@example.com"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // Should use fallback when any part of path is undefined
        expect(container.querySelector("div")?.textContent).toBe("no-email@example.com");
      });

      it("should handle deeply nested missing paths with ??", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({
          app: {
            settings: {
              // theme is missing
            }
          }
        });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{app.settings.theme.color ?? "blue"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // Should use fallback when intermediate path is undefined
        expect(container.querySelector("div")?.textContent).toBe("blue");
      });

      it("should handle null intermediate values", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({
          user: null
        });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div>{user.profile.name ?? "Anonymous"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // Should handle null safely and use fallback
        expect(container.querySelector("div")?.textContent).toBe("Anonymous");
      });

      it("should not confuse 0 or false with undefined in path", () => {
        const script = document.createElement("script");
        script.type = "application/json";
        script.id = "data-source";
        script.textContent = JSON.stringify({
          counters: {
            value: 0,
            active: false
          }
        });
        document.body.appendChild(script);

        const container = document.createElement(tag, {
          is: webcomponentTag,
        }) as HTMLElement;
        container.setAttribute("behavior", "json-template");
        container.setAttribute(attributes["json-template-for"], "data-source");
        container.innerHTML = `
          <template>
            <div class="value">{counters.value.toString ?? "undefined"}</div>
            <div class="active">{counters.active.toString ?? "undefined"}</div>
          </template>
        `;
        document.body.appendChild(container);

        // 0 and false are valid values, accessing .toString on them should fail safely
        // Since 0 and false are primitives, they don't have properties, so returns undefined
        expect(container.querySelector(".value")?.textContent).toBe("undefined");
        expect(container.querySelector(".active")?.textContent).toBe("undefined");
      });
    });
  });

  describe("Array Slicing with json-template-slice", () => {
    it("should render first item only with slice='0:1'", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify([
        { name: "Alice" },
        { name: "Bob" },
        { name: "Charlie" },
      ]);
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.setAttribute(attributes["json-template-slice"], "0:1");
      container.innerHTML = `
        <template>
          <div class="item">{name}</div>
        </template>
      `;
      document.body.appendChild(container);

      const items = container.querySelectorAll(".item");
      expect(items).toHaveLength(1);
      expect(items[0]?.textContent).toBe("Alice");
    });

    it("should render last item only with slice='-1:'", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify([
        { name: "Alice" },
        { name: "Bob" },
        { name: "Charlie" },
      ]);
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.setAttribute(attributes["json-template-slice"], "-1:");
      container.innerHTML = `
        <template>
          <div class="item">{name}</div>
        </template>
      `;
      document.body.appendChild(container);

      const items = container.querySelectorAll(".item");
      expect(items).toHaveLength(1);
      expect(items[0]?.textContent).toBe("Charlie");
    });

    it("should render last N items with slice='-2:'", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify([
        { name: "Alice" },
        { name: "Bob" },
        { name: "Charlie" },
      ]);
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.setAttribute(attributes["json-template-slice"], "-2:");
      container.innerHTML = `
        <template>
          <div class="item">{name}</div>
        </template>
      `;
      document.body.appendChild(container);

      const items = container.querySelectorAll(".item");
      expect(items).toHaveLength(2);
      expect(items[0]?.textContent).toBe("Bob");
      expect(items[1]?.textContent).toBe("Charlie");
    });

    it("should render range with slice='1:3'", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify([
        { name: "Alice" },
        { name: "Bob" },
        { name: "Charlie" },
        { name: "David" },
      ]);
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.setAttribute(attributes["json-template-slice"], "1:3");
      container.innerHTML = `
        <template>
          <div class="item">{name}</div>
        </template>
      `;
      document.body.appendChild(container);

      const items = container.querySelectorAll(".item");
      expect(items).toHaveLength(2);
      expect(items[0]?.textContent).toBe("Bob");
      expect(items[1]?.textContent).toBe("Charlie");
    });

    it("should render first N items with slice=':2'", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify([
        { name: "Alice" },
        { name: "Bob" },
        { name: "Charlie" },
      ]);
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.setAttribute(attributes["json-template-slice"], ":2");
      container.innerHTML = `
        <template>
          <div class="item">{name}</div>
        </template>
      `;
      document.body.appendChild(container);

      const items = container.querySelectorAll(".item");
      expect(items).toHaveLength(2);
      expect(items[0]?.textContent).toBe("Alice");
      expect(items[1]?.textContent).toBe("Bob");
    });

    it("should render from index onwards with slice='1:'", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify([
        { name: "Alice" },
        { name: "Bob" },
        { name: "Charlie" },
      ]);
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.setAttribute(attributes["json-template-slice"], "1:");
      container.innerHTML = `
        <template>
          <div class="item">{name}</div>
        </template>
      `;
      document.body.appendChild(container);

      const items = container.querySelectorAll(".item");
      expect(items).toHaveLength(2);
      expect(items[0]?.textContent).toBe("Bob");
      expect(items[1]?.textContent).toBe("Charlie");
    });

    it("should handle empty array with slice", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify([]);
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.setAttribute(attributes["json-template-slice"], "0:1");
      container.innerHTML = `
        <template>
          <input class="input" value="{name || Guest}" />
        </template>
      `;
      document.body.appendChild(container);

      // Empty array with slice → renders once with empty context
      const inputs = container.querySelectorAll(".input");
      expect(inputs).toHaveLength(1);
      expect((inputs[0] as HTMLInputElement).value).toBe("Guest");
    });

    it("should handle out of bounds slice gracefully", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify([{ name: "Alice" }]);
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.setAttribute(attributes["json-template-slice"], "10:20");
      container.innerHTML = `
        <template>
          <div class="item">{name || Empty}</div>
        </template>
      `;
      document.body.appendChild(container);

      // slice(10, 20) on 1-item array → []
      // Empty result → render once with empty context
      const items = container.querySelectorAll(".item");
      expect(items).toHaveLength(1);
      expect(items[0]?.textContent).toBe("Empty");
    });

    it("should handle single number slice (negative)", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify([
        { name: "Alice" },
        { name: "Bob" },
        { name: "Charlie" },
      ]);
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.setAttribute(attributes["json-template-slice"], "-1");
      container.innerHTML = `
        <template>
          <div class="item">{name}</div>
        </template>
      `;
      document.body.appendChild(container);

      // slice(-1) → last item only
      const items = container.querySelectorAll(".item");
      expect(items).toHaveLength(1);
      expect(items[0]?.textContent).toBe("Charlie");
    });

    it("should handle single number slice (positive)", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify([
        { name: "Alice" },
        { name: "Bob" },
        { name: "Charlie" },
      ]);
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.setAttribute(attributes["json-template-slice"], "1");
      container.innerHTML = `
        <template>
          <div class="item">{name}</div>
        </template>
      `;
      document.body.appendChild(container);

      // slice(1) → from index 1 onwards
      const items = container.querySelectorAll(".item");
      expect(items).toHaveLength(2);
      expect(items[0]?.textContent).toBe("Bob");
      expect(items[1]?.textContent).toBe("Charlie");
    });

    it("should render all items when slice attribute is not present", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify([
        { name: "Alice" },
        { name: "Bob" },
        { name: "Charlie" },
      ]);
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      // No slice attribute
      container.innerHTML = `
        <template>
          <div class="item">{name}</div>
        </template>
      `;
      document.body.appendChild(container);

      // Default behavior: render all items
      const items = container.querySelectorAll(".item");
      expect(items).toHaveLength(3);
      expect(items[0]?.textContent).toBe("Alice");
      expect(items[1]?.textContent).toBe("Bob");
      expect(items[2]?.textContent).toBe("Charlie");
    });

    it("should work with fallback operators in sliced template", () => {
      const script = document.createElement("script");
      script.type = "application/json";
      script.id = "data-source";
      script.textContent = JSON.stringify([
        { session: { name: "session-123" } },
        { session: { name: "session-456" } },
      ]);
      document.body.appendChild(script);

      const container = document.createElement(tag, {
        is: webcomponentTag,
      }) as HTMLElement;
      container.setAttribute("behavior", "json-template");
      container.setAttribute(attributes["json-template-for"], "data-source");
      container.setAttribute(attributes["json-template-slice"], "0:1");
      container.innerHTML = `
        <template>
          <input class="session" value="{session.name || -}" />
        </template>
      `;
      document.body.appendChild(container);

      const inputs = container.querySelectorAll(".session");
      expect(inputs).toHaveLength(1);
      expect((inputs[0] as HTMLInputElement).value).toBe("session-123");
    });
  });
});
