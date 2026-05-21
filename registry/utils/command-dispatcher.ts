/**
 * Command Dispatcher
 * 
 * Provides command dispatch functionality for elements with `commandfor` and `command` attributes.
 * 
 * **Philosophy:**
 * BehaviorFN implements a custom command protocol inspired by the browser's Invoker Commands API,
 * but with significant extensions (command-by, throttling, etc.).
 * 
 * **Command Naming:**
 * - Canonical: `command="show"` (no prefix)
 * - Compatible: `command="--show"` (prefix allowed, normalized internally)
 * - Native API: If browser supports native Invoker Commands with `--` prefix, we defer to it
 * 
 * **Why no prefix by default?**
 * - Cleaner, more readable HTML
 * - AI-friendly (simpler patterns)
 * - Extends beyond native API capabilities
 * 
 * @example
 * ```typescript
 * import { enableCommandDispatcher } from './command-dispatcher';
 * 
 * // Enable command dispatcher
 * const disconnect = enableCommandDispatcher();
 * 
 * // Later, if needed
 * disconnect();
 * ```
 * 
 * @example
 * ```html
 * <!-- Canonical (recommended) -->
 * <button commandfor="modal" command="show">Open</button>
 * 
 * <!-- Also works (compatibility) -->
 * <button commandfor="modal" command="--show">Open</button>
 * 
 * <dialog is="behavioral-reveal" id="modal" behavior="reveal">Content</dialog>
 * ```
 */

import { dispatchCommand } from "~registry";

/**
 * Normalize command name by stripping `--` prefix if present.
 * 
 * @param command - Raw command string (e.g., "show" or "--show")
 * @returns Normalized command without prefix (e.g., "show")
 */
function normalizeCommand(command: string): string {
  return command.startsWith('--') ? command.slice(2) : command;
}

/**
 * Check if the browser natively supports Invoker Commands API.
 * 
 * Detection: Check if CommandEvent is available and if the browser
 * fires it for `--` prefixed commands.
 */
function hasNativeInvokerSupport(): boolean {
  // Check if CommandEvent constructor exists
  if (typeof window === 'undefined') return false;
  
  try {
    // Check if CommandEvent is defined
    return 'CommandEvent' in window;
  } catch {
    return false;
  }
}

/**
 * Enable command dispatcher for elements with `commandfor` and `command` attributes.
 * 
 * Automatically dispatches CommandEvent to target elements when trigger elements are activated.
 * 
 * **Behavior:**
 * - For `--` prefixed commands: Check if native API handles it, if not, we handle it
 * - For non-prefixed commands: Always handle via our dispatcher
 * 
 * @returns Cleanup function to disconnect the dispatcher
 */
export function enableCommandDispatcher(): () => void {
  const hasNativeSupport = hasNativeInvokerSupport();
  const processedElements = new WeakSet<Element>();

  /**
   * Handle click events on elements with commandfor attribute.
   */
  function handleClick(event: Event) {
    const target = event.target as HTMLElement;
    
    // Find the closest element with commandfor attribute
    const trigger = target.closest('[commandfor]') as HTMLElement | null;
    if (!trigger) return;

    const commandForAttr = trigger.getAttribute('commandfor');
    const commandAttr = trigger.getAttribute('command');
    
    if (!commandForAttr || !commandAttr) return;

    // If command has `--` prefix and browser supports native API, skip our logic
    // (let browser handle it)
    if (commandAttr.startsWith('--') && hasNativeSupport) {
      // Browser will dispatch native CommandEvent, we don't interfere
      return;
    }

    // Prevent default behavior for our custom commands
    if (event.cancelable) {
      event.preventDefault();
    }

    // Parse targets (comma or space separated)
    const targetIds = commandForAttr.split(/[\s,]+/).filter(Boolean);
    
    // Parse commands (comma or space separated)
    const commands = commandAttr.split(/[\s,]+/).filter(Boolean);

    // Strategy:
    // - If 1 target + N commands: Dispatch all N commands to that target
    // - If N targets + 1 command: Dispatch same command to all N targets (broadcast)
    // - If N targets + N commands: Map 1:1 (target[i] gets command[i])
    // - Otherwise: Map with fallback (target[i] gets command[i] || command[0])

    if (targetIds.length === 1 && commands.length > 1) {
      // Multiple commands to single target
      const targetElement = document.getElementById(targetIds[0]!);
      if (!targetElement) {
        console.warn(`[CommandDispatcher] Target element not found: #${targetIds[0]}`);
        return;
      }

      commands.forEach(rawCommand => {
        const normalizedCommand = normalizeCommand(rawCommand);
        dispatchCommand(targetElement, normalizedCommand, trigger);
      });
    } else {
      // Standard mapping: targets get corresponding commands (or first command as fallback)
      targetIds.forEach((targetId, index) => {
        const targetElement = document.getElementById(targetId);
        if (!targetElement) {
          console.warn(`[CommandDispatcher] Target element not found: #${targetId}`);
          return;
        }

        // Use corresponding command, or fallback to first command
        const rawCommand = commands[index] || commands[0];
        if (!rawCommand) return;

        // Normalize command (strip `--` if present)
        const normalizedCommand = normalizeCommand(rawCommand);

        // Dispatch command
        dispatchCommand(targetElement, normalizedCommand, trigger);
      });
    }
  }

  /**
   * Handle command events dispatched by the browser (native Invoker Commands API).
   * 
   * If the browser fires a native CommandEvent with `--` prefix, we skip our logic
   * to avoid double-dispatch.
   */
  function handleNativeCommand(event: Event) {
    const commandEvent = event as any; // CommandEvent type may not be available
    
    // If command has `--` prefix, it's native - we already skipped our click handler
    // Nothing to do here
    if (commandEvent.command?.startsWith('--')) {
      // Native API is handling it
      return;
    }
  }

  // Attach global click listener
  document.addEventListener('click', handleClick, true);

  // If native support exists, also listen for native command events
  // (though we won't process `--` prefixed ones)
  if (hasNativeSupport) {
    document.addEventListener('command', handleNativeCommand, true);
  }

  // Return cleanup function
  return () => {
    document.removeEventListener('click', handleClick, true);
    if (hasNativeSupport) {
      document.removeEventListener('command', handleNativeCommand, true);
    }
  };
}
