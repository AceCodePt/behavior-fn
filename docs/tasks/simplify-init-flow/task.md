# Task: Simplify Init Flow

**Type:** Refactor (Regression)  
**Priority:** High  
**Estimated Complexity:** Medium

## Goal

Simplify the `behavior-fn init` command to ask only questions that directly affect code generation, while auto-detecting environment settings and using opinionated conventions for everything else.

## Context

Currently, the init flow may ask too many questions about paths and configuration that aren't interesting for the core value proposition. Users should be able to get started quickly with minimal friction.

**Core Principle:** Only ask questions that directly affect the generated code. Everything else should be auto-detected or follow conventions.

## Requirements

### 1. Detection Logic (No Questions)

Implement automatic detection for:

- **TypeScript:** Detect `tsconfig.json` existence
  - If exists → TypeScript mode
  - If not → JavaScript mode
  - Override: `--no-ts` flag

- **Package Manager:** Detect from lockfiles in order of preference:
  - `pnpm-lock.yaml` → pnpm
  - `bun.lockb` → bun  
  - `package-lock.json` → npm
  - `yarn.lock` → yarn
  - None found → default to npm
  - Override: `--pm=<pnpm|bun|npm|yarn>` flag

- **Project Structure:** Use conventions
  - Behaviors path: `./src/behaviors` (create if missing)
  - Config location: `./behavior.config.json` (root)
  - Override: `--path=<custom-path>` flag

### 2. Single Question Mode: `behavior-fn init`

Interactive mode that asks **only one question:**

```
┌─────────────────────────────────────────┐
│  Welcome to BehaviorCN! 🎯              │
└─────────────────────────────────────────┘

✓ Detected: TypeScript, pnpm

? Which schema validator would you like to use?
  ❯ Zod (recommended)
    TypeBox
    Valibot

✓ Created behavior.config.json
✓ Created src/behaviors/
✓ Ready! Run `behavior-fn add reveal` to add your first behavior.
```

### 3. Zero Question Mode: `behavior-fn init --quick`

Non-interactive mode with smart defaults:

```
✓ Detected TypeScript, pnpm
✓ Using Zod (default)
✓ Created behavior.config.json
✓ Created src/behaviors/
✓ Done! Run `behavior-fn add reveal`
```

Defaults for `--quick`:
- **Validator:** Zod (most popular)
- Everything else: detected or convention

### 4. Override Flags

Support flags for all options:

```bash
behavior-fn init --validator=typebox
behavior-fn init --validator=valibot
behavior-fn init --no-ts
behavior-fn init --path=./lib/behaviors
behavior-fn init --pm=bun
behavior-fn init --quick --validator=valibot
```

### 5. Config Generation

The `behavior.config.json` should reflect detected/chosen settings:

```json
{
  "validator": "zod",
  "typescript": true,
  "behaviorsPath": "./src/behaviors",
  "packageManager": "pnpm"
}
```

## Success Criteria

- [ ] Package manager detection works for pnpm, bun, npm, yarn (in that priority order)
- [ ] TypeScript detection works via `tsconfig.json`
- [ ] Interactive mode asks only about validator choice
- [ ] `--quick` flag skips all questions and uses Zod default
- [ ] All options can be overridden via CLI flags
- [ ] Generated `behavior.config.json` reflects all settings
- [ ] Error messages are helpful if detection fails
- [ ] Existing tests pass
- [ ] New tests cover detection logic

## Implementation Notes

### Detection Functions

Create utility functions for detection:

```typescript
// src/utils/detect.ts (or similar)

export function detectTypeScript(): boolean {
  // Check for tsconfig.json
}

export function detectPackageManager(): 'pnpm' | 'bun' | 'npm' | 'yarn' {
  // Check for lockfiles in priority order
}

export function detectProjectStructure(): {
  hasSrc: boolean;
  hasLib: boolean;
  // etc.
}
```

### Validator Question

Use a consistent prompt library (likely already in use) for the single question. The validator choice directly affects:
- Import statements in generated behaviors
- Schema syntax
- Package dependencies to install

### Config Structure

Ensure the config structure supports:
- All detected values
- Override capabilities
- Backwards compatibility if config already exists

## Files to Modify

Expected files (exact paths may vary):
- CLI init command implementation
- Config generation logic
- Detection utilities (new or existing)
- Init command tests
- CLI integration tests

## Testing Strategy

1. **Unit Tests:** Detection functions
   - Mock filesystem for different scenarios
   - Test each package manager lockfile
   - Test TypeScript detection
   
2. **Integration Tests:** Full init flow
   - Test interactive mode
   - Test `--quick` mode
   - Test various flag combinations
   - Test override flags

3. **Edge Cases:**
   - No lockfile present
   - Multiple lockfiles (priority order)
   - No tsconfig.json
   - Existing behavior.config.json
   - Invalid paths

## Dependencies

None. This is a refactor of existing functionality.

## Protocol Checklist

- [ ] **Plan:** Document architectural decisions in `LOG.md`
- [ ] **Data:** Define state manifest (what config values, their sources)
- [ ] **Schema:** Update or create schemas for config validation
- [ ] **Registry:** Update behaviors-registry.json if needed (likely N/A)
- [ ] **Test:** Write failing tests first (Red)
- [ ] **Develop:** Implement to make tests pass (Green)
- [ ] **Verify:** Run `pnpm check` and all tests
- [ ] **Document:** Update CLI documentation if needed

## Prohibited Patterns

- ❌ Asking questions about paths (use detection/convention)
- ❌ Asking about component strategy (doesn't affect code generation)
- ❌ Asking about styling approach (doesn't affect code generation)
- ❌ Hardcoding paths instead of using conventions
- ❌ Skipping detection and always prompting
- ❌ Using `any` types for detection results
- ❌ Not providing override flags for detected values

## References

- Current init command implementation
- Existing config structure
- Package manager detection patterns (may exist elsewhere)
- CLI prompting library documentation
