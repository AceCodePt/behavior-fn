# Engineering Log: Add Zod Mini Support

## Architectural Decisions

### 1. Separate Transformer for Zod Mini
We will implement `toZodMini.ts` as a separate transformer from `toZod.ts`.
-   **Reasoning**: Zod Mini uses a functional API (`z.optional(z.string())`) whereas standard Zod uses a method chaining API (`z.string().optional()`). The code generation logic is sufficiently different to warrant a separate module rather than complicating `toZod.ts` with conditionals.

### 2. Validator Detection Strategy
The `detectValidatorFromPackageJson` function will be updated to return both `0` (Zod) and `4` (Zod Mini) when the `zod` dependency is present.
-   **Reasoning**: Both variants use the same npm package. The choice is stylistic and architectural (functional vs. OO). By returning both, the existing CLI logic will interpret this as "multiple validators detected" and prompt the user to choose their preferred style.

### 3. CLI Integration
We will update `getValidatorType` in `index.ts` to recognize the new validator type ID (`4`) and offer "Zod Mini" as a choice in the prompt.
-   **Reasoning**: This provides a seamless user experience, allowing them to opt-in to the lightweight variant without manual configuration changes.

## Implementation Plan

1.  Create `src/transformers/toZodMini.ts`.
2.  Update `src/utils/detect-validator.ts`.
3.  Update `index.ts` to wire up the new transformer.
4.  Add unit tests for `toZodMini` in `tests/transformers.test.ts`.
