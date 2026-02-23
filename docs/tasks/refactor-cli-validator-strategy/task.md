# Refactor CLI to use Validator Strategy Pattern

## Goal
Refactor the `index.ts` CLI entry point to use a Strategy Pattern for handling different schema validators (Zod, Valibot, ArkType, TypeBox, Zod Mini). This will replace the current scattered `if/else` logic with a centralized, extensible design.

## Context
Currently, validator-specific logic is scattered across multiple locations in `index.ts`:
1. Schema transformation calls.
2. `behavior-utils.ts` `getObservedAttributes` injection.
3. `types.ts` file generation.
4. Validator selection prompts.

This makes adding new validators (like Zod Mini recently) error-prone and requires modifying `index.ts` in multiple places. A Strategy pattern will encapsulate all validator-specific logic into dedicated classes.

## Requirements
- [ ] Define `ValidatorStrategy` interface in `src/strategies/validator-strategy.ts`.
  - Must include `packageName` typed as strict union: `PackageName = "zod" | "valibot" | "arktype" | "@sinclair/typebox" | "zod-mini"`.
- [ ] Implement strategies for all supported validators:
  - `ZodStrategy`
  - `ZodMiniStrategy`
  - `ValibotStrategy`
  - `TypeBoxStrategy`
  - `ArkTypeStrategy`
- [ ] Create a strategy registry in `src/strategies/index.ts`.
- [ ] Refactor `index.ts` to use `getStrategy(id)` instead of conditional logic.
- [ ] Ensure `behavior-utils.ts` and `types.ts` generation logic remains functionally identical (regression testing).

## Technical Implementation
- **Interface:**
  ```typescript
  export type PackageName = "zod" | "valibot" | "arktype" | "@sinclair/typebox" | "zod-mini";
  
  export interface ValidatorStrategy {
    id: number;
    label: string;
    packageName: PackageName;
    transformSchema(schemaObject: any, rawContent: string): string;
    getObservedAttributesCode(): string;
    getUtilsImports(): string;
    getTypesFileContent(): string;
  }
  ```

## Verification
- Run `behavior-fn add <behavior>` with different validators selected.
- Verify the generated files (`behavior-utils.ts`, `types.ts`, `schema.ts`) match the expected output.
