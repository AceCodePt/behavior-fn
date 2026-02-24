# Task: Simplify Init Flow

**Type:** Refactor (Regression)  
**Priority:** High  
**Estimated Complexity:** Medium

## Goal

Simplify the `behavior-fn init` command to match the shadcn/ui experience: ask only questions that directly affect code generation, while auto-detecting environment settings and providing smart defaults.

## Context

Currently, the init flow may ask too many questions. After reviewing shadcn/ui's approach, we should ask only what's necessary for code generation (validator choice and installation paths), while auto-detecting everything else.

**Core Principle:** Follow shadcn/ui's model - ask questions that affect generated code (validator, paths), auto-detect environment (package manager, TypeScript), and provide a `--defaults` flag for zero-question setup.

**Reference:** shadcn/ui asks about framework, TypeScript, styling approach, base color, and component/utils paths - all things that directly affect generated code.

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

- **Project Structure:** Detect with smart defaults
  - Detect if `src/` directory exists
  - Default behaviors path: `./src/behaviors` if src exists, else `./behaviors`
  - Config location: `./behavior.config.json` (always root)
  - Override: `--path=<custom-path>` flag

### 2. Interactive Mode: `behavior-fn init`

Interactive mode that asks **two questions** (following shadcn/ui pattern):

```
┌─────────────────────────────────────────┐
│  Welcome to BehaviorFN! 🎯              │
└─────────────────────────────────────────┘

✓ Detected: TypeScript, pnpm

? Which schema validator would you like to use?
  ❯ Zod (recommended)
    TypeBox (fastest)
    Valibot (smallest)

? Where would you like to install behaviors?
  ./src/behaviors ▐

✓ Created behavior.config.json
✓ Created src/behaviors/
✓ Ready! Run `behavior-fn add reveal` to add your first behavior.
```

**Smart Path Default:**
- If `src/` directory exists → suggest `./src/behaviors`
- If `lib/` directory exists → suggest `./lib/behaviors`
- Otherwise → suggest `./behaviors`

### 3. Zero Question Mode: `behavior-fn init --defaults`

Non-interactive mode with smart defaults (following shadcn/ui `--defaults` flag):

```
✓ Detected TypeScript, pnpm
✓ Using defaults: Zod, ./src/behaviors
✓ Created behavior.config.json
✓ Created src/behaviors/
✓ Done! Run `behavior-fn add reveal`
```

Defaults for `--defaults`:
- **Validator:** Zod (most popular)
- **Path:** `./src/behaviors` (if src exists), else `./behaviors`
- Everything else: detected

### 4. Override Flags

Support flags for all options (following shadcn/ui pattern):

```bash
behavior-fn init --validator=typebox      # Override validator choice
behavior-fn init --validator=valibot
behavior-fn init --path=./lib/behaviors   # Override installation path
behavior-fn init --no-ts                  # Force JavaScript mode
behavior-fn init --pm=bun                 # Override package manager
behavior-fn init --defaults               # Skip all questions
behavior-fn init -d                       # Short form of --defaults
behavior-fn init -y                       # Skip confirmation prompts (like shadcn)
behavior-fn init --defaults --validator=valibot  # Combine flags
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
- [ ] Interactive mode asks two questions: validator choice and installation path
- [ ] Path suggestion is smart (detects src/, lib/ directories)
- [ ] `--defaults` flag skips all questions and uses Zod + smart path default
- [ ] `-d` short flag works as alias for `--defaults`
- [ ] `-y` flag skips confirmation prompts
- [ ] All options can be overridden via CLI flags
- [ ] Flag combinations work correctly (e.g., `--defaults --validator=valibot`)
- [ ] Generated `behavior.config.json` reflects all settings
- [ ] Error messages are helpful if detection fails
- [ ] Existing tests pass
- [ ] New tests cover detection logic and interactive flow

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
  suggestedBehaviorsPath: string;
}
```

### Interactive Prompts

Use a consistent prompt library (likely already in use) for the two questions:

1. **Validator Question** - Affects:
   - Import statements in generated behaviors
   - Schema syntax
   - Package dependencies to install

2. **Path Question** - Affects:
   - Where behavior files are generated
   - Import paths in user code
   - Directory structure created
   
Provide smart default based on detected project structure (src/, lib/, or root)

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
   - Test interactive mode (both questions)
   - Test `--defaults` mode
   - Test `-d` and `-y` short flags
   - Test various flag combinations
   - Test override flags
   - Test smart path suggestions based on project structure

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

- ❌ Asking about component strategy (doesn't affect code generation)
- ❌ Asking about styling approach (doesn't affect code generation)
- ❌ Asking more than 2 questions in interactive mode
- ❌ Not providing smart path defaults based on project structure
- ❌ Hardcoding paths without detection logic
- ❌ Skipping detection and always prompting for environment settings
- ❌ Using `any` types for detection results
- ❌ Not providing override flags for all detected/prompted values
- ❌ Not supporting `--defaults`, `-d`, and `-y` flags

## References

- Current init command implementation
- Existing config structure
- Package manager detection patterns (may exist elsewhere)
- CLI prompting library documentation
- **shadcn/ui CLI:** `npx shadcn@latest init --help` for reference implementation
- shadcn/ui asks: framework, TypeScript, styling, base color, component paths (all affect code generation)
