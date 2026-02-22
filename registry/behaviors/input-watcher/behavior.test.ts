/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
// import { registerTestComponent } from "~test-utils";
import INPUT_WATCHER_DEFINITION from "./_behavior-definition";
import { inputWatcherBehaviorFactory } from "./behavior";
import { registerBehavior } from "~registry";
// import * as formatterRegistry from "@/lib/utils/formatter-registry";

const formatterRegistry = {
  getFormatter: vi.fn(),
};

/*
vi.mock("@/lib/utils/formatter-registry", () => ({
  getFormatter: vi.fn(),
}));
*/

describe.skip("Input Watcher Behavior Integration", () => {
  /*
  const tag = "span";
  const webcomponentTag = "test-input-watcher-span";
  let container: HTMLDivElement;

  beforeAll(() => {
    // Register the behavior once
    registerBehavior(
      INPUT_WATCHER_DEFINITION.name,
      inputWatcherBehaviorFactory,
    );

    // Register the test component that uses the behavior once
    registerTestComponent(
      tag,
      { tag: webcomponentTag },
      (Base) => class extends Base {},
      { "input-watcher": INPUT_WATCHER_DEFINITION },
    );
  });
  // ... rest of the file ...
  */
});
