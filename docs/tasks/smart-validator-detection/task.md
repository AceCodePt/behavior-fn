# Smart Validator Detection in Init

## Goal
Enhance the CLI `init` command to automatically detect existing validation libraries in the user's project (`package.json`) and intelligently suggest the matching validator as the default option.

## Requirements

1.  **Package Analysis**:
    - Read `package.json` from the current working directory (`process.cwd()`).
    - Inspect both `dependencies` and `devDependencies`.
    - Detect presence of:
        - `zod`
        - `valibot`
        - `arktype`
        - `@sinclair/typebox`

2.  **Smart Suggestion**:
    - If **one** validator is found, make it the `initial` selection in the prompt.
    - If **multiple** are found, prioritize them in this order: `zod` > `valibot` > `arktype` > `typebox`.
    - If **none** are found, default to `zod`.

3.  **User Override**:
    - The user must still see the full list of options.
    - The detection only changes the *default cursor position*, it does not lock the choice.

## Implementation Details

- Use `fs.readFileSync` to read `package.json`.
- Safely handle missing `package.json`.
- Map detected package names to the `value` used in the `prompts` choices.
