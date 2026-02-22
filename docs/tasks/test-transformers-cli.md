# Test Transformers and CLI Logic

## Goal
Ensure the core code generation logic (transformers) and CLI auto-detection features are robust and covered by tests.

## Requirements

1.  **Transformer Tests**:
    - Create unit tests for `toZod`, `toValibot`, `toArkType`, and `toTypeBox`.
    - Verify they generate correct TypeScript code for:
        - Strings (min, max, pattern)
        - Numbers (min, max)
        - Booleans
        - Enums
        - Objects (nested, optional, defaults)
    - Verify they export `observedAttributes` correctly.

2.  **CLI Logic Tests**:
    - Refactor `detectValidatorFromPackageJson` into a testable utility.
    - Test detection logic with various `package.json` configurations (Zod, Valibot, ArkType, TypeBox, Mixed, None).

## Implementation Details

- Create `tests/transformers.test.ts`.
- Create `src/utils/detect-validator.ts`.
- Create `tests/detect-validator.test.ts`.
