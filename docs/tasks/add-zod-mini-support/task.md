# Task: Add Zod Mini Support

## Goal

Add `zod-mini` (functional API) as a first-class validator option in `behavior-fn`. This involves creating a transformer that outputs functional Zod code (e.g., `z.string()`) and ensuring it's detectable and selectable during installation.

## Context

`zod-mini` is a lightweight alternative to Zod that offers a functional API for better tree-shaking and smaller bundle sizes. Currently, `behavior-fn` only supports the standard, method-chaining Zod API. Adding `zod-mini` support will allow developers to optimize their bundle sizes without sacrificing type safety or validation capabilities.

## Requirements

-   Create a new transformer `src/transformers/toZodMini.ts` that converts the internal schema format to functional Zod code (e.g., using `z.min(z.string(), 5)` instead of `z.string().min(5)`).
-   Update `src/utils/detect-validator.ts` to detect `zod` and potentially offer `zod-mini` as an option alongside standard Zod.
-   Update `index.ts` to include `zod-mini` in the validator selection prompt and handle its installation logic (using the new transformer).
-   Ensure the generated code imports from the correct location (likely `zod/mini` or `@zod/mini` depending on the latest convention).

## Definition of Done

-   [ ] `src/transformers/toZodMini.ts` is implemented and handles all supported schema types (string, number, boolean, object, array, union, optional, default).
-   [ ] `src/utils/detect-validator.ts` correctly identifies `zod` as a trigger for `zod-mini` availability.
-   [ ] `index.ts` prompts the user to choose between "Zod" and "Zod Mini" if `zod` is installed.
-   [ ] Running `behavior-fn add <behavior>` with "Zod Mini" selected generates functional Zod code.
-   [ ] All existing tests pass.
-   [ ] Documentation updated to reflect `zod-mini` support.
-   [ ] **User Review**: Changes verified and commit authorized.

> **Note:** Do not include implementation details, code snippets, or technical designs here. The detailed execution plan belongs in the `LOG.md` file created during the **Plan** phase of the PDSRTDD workflow.
