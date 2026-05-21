/**
 * Command Dispatcher
 * 
 * Custom command protocol inspired by Invoker Commands API but extended with
 * command-by, throttling, and other features the native API doesn't provide.
 * 
 * Why no `--` prefix by default?
 * - Cleaner HTML
 * - AI-friendly patterns
 * - Extends beyond native capabilities
 * 
 * Accepts both `command="show"` (canonical) and `command="--show"` (compatibility).
 * Defers to native API when `--` prefix detected and browser supports it.
 */

import { dispatchCommand } from "~registry";

function normalizeCommand(command: string): string {
  return command.startsWith('--') ? command.slice(2) : command;
}

function hasNativeInvokerSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return 'CommandEvent' in window;
  } catch {
    return false;
  }
}

export function enableCommandDispatcher(): () => void {
  const hasNativeSupport = hasNativeInvokerSupport();

  function handleClick(event: Event) {
    const trigger = (event.target as HTMLElement).closest('[commandfor]') as HTMLElement | null;
    if (!trigger) return;

    const commandForAttr = trigger.getAttribute('commandfor');
    const commandAttr = trigger.getAttribute('command');
    
    if (!commandForAttr || !commandAttr) return;

    // Defer to native API for -- prefixed commands
    if (commandAttr.startsWith('--') && hasNativeSupport) return;

    if (event.cancelable) event.preventDefault();

    const targetIds = commandForAttr.split(/[\s,]+/).filter(Boolean);
    const commands = commandAttr.split(/[\s,]+/).filter(Boolean);

    // 1 target + N commands: dispatch all commands to that target
    if (targetIds.length === 1 && commands.length > 1) {
      const targetElement = document.getElementById(targetIds[0]!);
      if (!targetElement) {
        console.warn(`[CommandDispatcher] Target element not found: #${targetIds[0]}`);
        return;
      }

      commands.forEach(rawCommand => {
        dispatchCommand(targetElement, normalizeCommand(rawCommand), trigger);
      });
    } else {
      // N targets: map commands 1:1 or broadcast first command
      targetIds.forEach((targetId, index) => {
        const targetElement = document.getElementById(targetId);
        if (!targetElement) {
          console.warn(`[CommandDispatcher] Target element not found: #${targetId}`);
          return;
        }

        const rawCommand = commands[index] || commands[0];
        if (!rawCommand) return;

        dispatchCommand(targetElement, normalizeCommand(rawCommand), trigger);
      });
    }
  }

  function handleNativeCommand(event: Event) {
    const commandEvent = event as any;
    // Native API handles -- prefixed commands, we skip
    if (commandEvent.command?.startsWith('--')) return;
  }

  document.addEventListener('click', handleClick, true);
  if (hasNativeSupport) {
    document.addEventListener('command', handleNativeCommand, true);
  }

  return () => {
    document.removeEventListener('click', handleClick, true);
    if (hasNativeSupport) {
      document.removeEventListener('command', handleNativeCommand, true);
    }
  };
}
