import definition from "./_behavior-definition";

const { ATTRS } = definition;

/**
 * Parse a comma-separated attribute value into an array of trimmed strings.
 * Filters out empty segments.
 *
 * @param value The attribute value to parse
 * @returns Array of trimmed non-empty strings
 */
function parseAttributeList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Validate the mapping between target IDs and commands.
 *
 * Valid patterns:
 * - Single target + any commands (targetCount <= 1)
 * - Any targets + single command (commandCount <= 1)
 * - Equal counts (targetCount === commandCount)
 *
 * @param targetCount Number of target IDs
 * @param commandCount Number of commands
 * @returns true if valid, false if invalid
 */
function isValidCommandMapping(
  targetCount: number,
  commandCount: number,
): boolean {
  return targetCount <= 1 || commandCount <= 1 || targetCount === commandCount;
}

/**
 * Dispatch a CommandEvent to a target element.
 *
 * @param target The target element to receive the command
 * @param command The command string (e.g., "--show")
 * @param source The button that triggered the command
 */
function dispatchCommandEvent(
  target: HTMLElement,
  command: string,
  source: HTMLButtonElement,
): void {
  const event = new Event("command", {
    bubbles: true,
    cancelable: true,
    composed: true,
  }) as any;

  // Attach command and source properties
  Object.defineProperty(event, "command", {
    value: command,
    enumerable: true,
    configurable: false,
  });

  Object.defineProperty(event, "source", {
    value: source,
    enumerable: true,
    configurable: false,
  });

  target.dispatchEvent(event);
}

/**
 * Compound Commands Behavior Factory
 * 
 * This behavior enables buttons to dispatch multiple commands to multiple targets
 * using comma-separated syntax in `commandfor` and `command` attributes.
 * 
 * @param el The button element (should be HTMLButtonElement)
 * @returns Behavior instance with onClick handler
 */
export const compoundCommandsBehaviorFactory = (el: HTMLElement) => {
  // Type guard: ensure element is a button
  if (!(el instanceof HTMLButtonElement)) {
    console.warn(
      "[CompoundCommands] This behavior should only be used on <button> elements",
    );
  }

  return {
    onClick(event: MouseEvent) {
      const button = el as HTMLButtonElement;
      
      const commandForAttr = button.getAttribute(ATTRS["commandfor"]);
      const commandAttr = button.getAttribute(ATTRS["command"]);

      // Both attributes must be present
      if (!commandForAttr || !commandAttr) {
        return;
      }

      // Parse comma-separated values
      const targetIds = parseAttributeList(commandForAttr);
      const commands = parseAttributeList(commandAttr);

      const targetCount = targetIds.length;
      const commandCount = commands.length;

      // Validate the mapping
      if (!isValidCommandMapping(targetCount, commandCount)) {
        console.error(
          `[CompoundCommands] Invalid command mapping on button:`,
          button,
          `${targetCount} targets but ${commandCount} commands. Use single command for broadcast or match counts exactly.`,
        );
        return;
      }

      // Determine dispatch plan based on counts
      let dispatchPlan: Array<{ targetId: string; command: string }> = [];

      if (targetCount <= 1) {
        // Single target receives all commands
        const targetId = targetIds[0];
        if (targetId) {
          dispatchPlan = commands.map((cmd) => ({ targetId, command: cmd }));
        }
      } else if (commandCount <= 1) {
        // All targets receive the single command (broadcast)
        const command = commands[0];
        if (command) {
          dispatchPlan = targetIds.map((targetId) => ({ targetId, command }));
        }
      } else {
        // Exact mapping (N:N) - already validated that counts match
        dispatchPlan = targetIds.map((targetId, i) => ({
          targetId,
          command: commands[i],
        }));
      }

      // Execute dispatch plan
      for (const { targetId, command } of dispatchPlan) {
        const targetElement = document.getElementById(targetId);
        if (!targetElement) {
          console.warn(
            `[CompoundCommands] Target not found: ${targetId}`,
          );
          continue;
        }

        dispatchCommandEvent(targetElement, command, button);
      }
    },
  };
};
