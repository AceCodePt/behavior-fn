/**
 * Attribute name constants for the compound-commands behavior.
 * 
 * This behavior enables buttons to dispatch multiple commands to multiple targets.
 * It reads the standard `commandfor` and `command` attributes.
 */
export const COMPOUND_COMMANDS_ATTRS = {
  /** Target element IDs (comma-separated for multiple targets) */
  COMMANDFOR: "commandfor",
  /** Command values (comma-separated for multiple commands) */
  COMMAND: "command",
} as const;
