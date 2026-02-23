# Task: Add Zod Mini Support

## Goal

Add support for Zod Mini as a schema validator for behaviors.

## Context

Zod Mini offers a lighter alternative to Zod with better tree-shaking capabilities. Adding support allows users to optimize bundle size when using behaviors, aligning with modern web development practices.

## Requirements

-   Detect `zod` dependency and offer Zod Mini as an option alongside standard Zod.
-   Implement `toZodMini` transformer to generate functional Zod Mini code (using `zod/mini` imports).
-   Ensure existing Zod support remains functional and distinct.

## Definition of Done

-   [ ] `toZodMini` transformer implemented.
-   [ ] CLI detects `zod` and prompts/allows selection of Zod Mini.
-   [ ] Code generated with `toZodMini` is valid TypeScript using `zod/mini`.
-   [ ] All tests pass.
-   [ ] **User Review**: Changes verified and commit authorized.

> **Note:** Do not include implementation details, code snippets, or technical designs here. The detailed execution plan belongs in the `LOG.md` file created during the **Plan** phase of the PDSRTDD workflow.
