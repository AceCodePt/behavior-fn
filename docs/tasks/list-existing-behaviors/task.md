# Task: Add CLI Command to List Available Behaviors

## Goal

Provide a CLI command that displays all available behaviors in the registry, allowing users to discover what behaviors exist and their basic metadata (name, description, attributes, commands).

## Context

Currently, users need to manually browse the `registry/behaviors/` directory or read documentation to discover what behaviors are available. A `behavior-fn list` (or similar) command would improve discoverability and developer experience by providing an easy way to see all available behaviors, their purposes, and their APIs at a glance.

## Requirements

- Add a new CLI command (e.g., `behavior-fn list` or `behavior-fn behaviors`) that outputs available behaviors
- Display essential metadata for each behavior:
  - Behavior name
  - Description (if available from schema/definition)
  - Attributes (from schema)
  - Commands (if any)
- Support optional filtering or search capabilities
- Format output in a readable way (table, list, or structured format)
- Consider adding a `--json` flag for machine-readable output

## Definition of Done

- [ ] CLI command implemented and functional
- [ ] Command displays all behaviors from the registry
- [ ] Output includes behavior name, attributes, and commands
- [ ] Documentation updated with new command usage
- [ ] All tests pass
- [ ] `pnpm check` passes
- [ ] **User Review**: Changes verified and commit authorized
