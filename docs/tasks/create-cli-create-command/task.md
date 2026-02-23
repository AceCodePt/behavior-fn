# Task: Create CLI 'create' Command

## Goal

Add a `create` command to the CLI that scaffolds a new behavior, including necessary files and registry updates, to streamline the creation of new behaviors.

## Context

Currently, creating a new behavior requires manually creating a directory, multiple files (`_behavior-definition.ts`, `behavior.ts`, `behavior.test.ts`), and manually updating the `behaviors-registry.json`. This is tedious and error-prone. A CLI command to automate this process will improve developer experience and ensure consistency.

## Requirements

-   The CLI should accept a `create` command.
-   The command should prompt for the behavior name.
-   It should create the behavior directory in `registry/behaviors/<name>`.
-   It should scaffold the following files with basic templates:
    -   `_behavior-definition.ts` (Schema)
    -   `behavior.ts` (Implementation)
    -   `behavior.test.ts` (Tests)
-   It should automatically register the new behavior in `registry/behaviors-registry.json`.
-   It should verify that the behavior name does not already exist.

## Definition of Done

-   [ ] `behavior-fn create <name>` works as expected.
-   [ ] New behavior files are created with correct templates.
-   [ ] `behaviors-registry.json` is updated correctly.
-   [ ] Basic tests for the new command (if applicable) or manual verification.
-   [ ] Documentation updated to include the new command.
-   [ ] **User Review**: Changes verified and commit authorized.
