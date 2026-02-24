import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";
import { COMPOUND_COMMANDS_ATTRS } from "./constants";

export { COMPOUND_COMMANDS_ATTRS };

/**
 * Schema for compound-commands behavior.
 * 
 * This behavior adds compound command support to buttons using the Invoker Commands API.
 * 
 * Attributes:
 * - `commandfor`: Target element ID(s), comma-separated for multiple targets
 * - `command`: Command value(s), comma-separated for multiple commands
 * 
 * Valid patterns:
 * 1. Single target + multiple commands: commandfor="modal" command="--show, --focus"
 * 2. Multiple targets + single command: commandfor="modal, panel" command="--hide"
 * 3. Equal counts (N:N): commandfor="modal, form" command="--toggle, --clear"
 * 
 * Invalid pattern:
 * - Mismatched counts (both > 1): commandfor="a, b, c" command="--x, --y" (3 ≠ 2)
 */
export const schema = Type.Object({
  [COMPOUND_COMMANDS_ATTRS.COMMANDFOR]: Type.Optional(Type.String()),
  [COMPOUND_COMMANDS_ATTRS.COMMAND]: Type.Optional(Type.String()),
});

export type SchemaType = InferSchema<typeof schema>;
