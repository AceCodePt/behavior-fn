# Task: Standardize on Tilde (~) Aliases Across CLI and Registry

## Goal

Standardize all path aliases to use the `~` prefix (e.g., `~registry`, `~utils`, `~host`) instead of the `@/` prefix (e.g., `@/behavior-registry`, `@/behavioral-host`). This creates consistency between registry source code and user-installed code, establishing `~` as the BehaviorFN canonical alias convention.

## Context

**Why This Change Is Needed:**

Currently, there's an inconsistency in how aliases are used:

1. **Registry behaviors use `~` aliases internally:**
   ```typescript
   import { registerBehavior } from '~registry';
   import { defineBehavioralHost } from '~host';
   import { getObservedAttributes } from '~utils';
   ```

2. **CLI `init` command suggests `@/` aliases to users:**
   ```json
   {
     "alias": "@/behavior-registry",
     "alias": "@/behavioral-host",
     "alias": "@/behavior-utils"
   }
   ```

3. **Rewrite logic transforms `~` → user's chosen alias during installation:**
   - If user has `alias: "@/behavior-registry"`, `~registry` becomes `@/behavior-registry`
   - If user has no alias, `~registry` becomes relative path

**Problems with Current Approach:**

1. **Mental Mapping Required:** Users see `~registry` in registry source but `@/behavior-registry` in their code
2. **Inconsistent Grep:** Searching for `~registry` won't find user's code (uses `@/`)
3. **Documentation Confusion:** Examples must show both forms
4. **No Distinctive Convention:** `@/` is generic, doesn't signal "BehaviorFN core import"
5. **Unnecessary Translation Layer:** The rewrite adds cognitive overhead

**Benefits of Standardizing on `~`:**

1. **Perfect Consistency:** Registry source and user code use identical imports
2. **Framework Agnostic:** `~` doesn't conflict with framework conventions (most use `@/` for src)
3. **Distinctive Brand:** `~` becomes the BehaviorFN signature for core imports
4. **Simpler Mental Model:** One canonical name per file across entire ecosystem
5. **Grep-Friendly:** `~registry` finds all references (registry + user code)
6. **Shorter & Cleaner:** `~registry` vs `@/behavior-registry`

**No Backwards Compatibility Needed:**

Since we don't have users yet (pre-1.0, beta phase), we can make this breaking change freely without migration concerns.

## Requirements

### 1. Update Init Command

**File:** `src/commands/init.ts`

- Change default aliases from `@/` prefix to `~` prefix
- Update help text and output messages
- Update tsconfig.json example in "Next steps" output

**Example Config Output:**
```json
{
  "validator": "zod",
  "paths": {
    "behaviors": "src/behaviors",
    "utils": {
      "path": "src/behavior-utils.ts",
      "alias": "~utils"
    },
    "registry": {
      "path": "src/behaviors/behavior-registry.ts",
      "alias": "~registry"
    },
    "testUtils": {
      "path": "tests/utils/command-test-harness.ts",
      "alias": "~test-utils"
    },
    "host": {
      "path": "src/behavioral-host.ts",
      "alias": "~host"
    },
    "types": {
      "path": "src/types.ts",
      "alias": "~types"
    }
  }
}
```

**Example tsconfig.json Output:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "~registry": ["./src/behaviors/behavior-registry"],
      "~host": ["./src/behavioral-host"],
      "~utils": ["./src/behavior-utils"],
      "~test-utils": ["./tests/utils/command-test-harness"],
      "~types": ["./src/types"]
    }
  }
}
```

### 2. Update Apply-TSConfig-Flag Command

**File:** `src/commands/apply-tsconfig-flag.ts`

No code changes needed (already uses `extractPathAliases()` which reads from config), but:

- Update example output in command help text
- Ensure tests use `~` aliases in fixtures

**File:** `src/utils/tsconfig.ts`

No changes needed - `extractPathAliases()` already reads whatever aliases are in the config.

### 3. Update Tests

**Files:**
- `tests/add-command-integration.test.ts`
- `tests/add-command-test-files.test.ts`
- `tests/index.test.ts`
- `tests/tsconfig-utils.test.ts`
- Any other tests that mock `behavior.config.json`

Change all test fixtures from:
```typescript
aliases: {
  utils: "@/behavior-utils",
  registry: "@/behaviors/behavior-registry",
  // ...
}
```

To:
```typescript
paths: {
  utils: {
    path: "src/behavior-utils.ts",
    alias: "~utils"
  },
  registry: {
    path: "src/behaviors/behavior-registry.ts",
    alias: "~registry"
  },
  // ...
}
```

### 4. Update Documentation

**Files:**
- `README.md` - Update all tsconfig examples
- `docs/tasks/cli-apply-tsconfig-flag/LOG.md` - Update example outputs
- `AGENTS.md` - Update any alias references
- Any other docs showing path alias configuration

Change all references from `@/behavior-*` to `~*` pattern.

### 5. Verify Rewrite Logic

**File:** `src/commands/shared.ts`

The `rewriteImports()` function already handles this correctly:
```typescript
// Registry source has: import { x } from '~registry'
// Gets rewritten to: import { x } from '~registry'  (if alias is '~registry')
// Or: import { x } from '../path/to/registry'  (if no alias)
```

Verify that:
- `~` aliases are preserved when config has matching `~` alias
- `~` aliases are converted to relative paths when no alias in config
- All registry behaviors get properly rewritten during `add` and `reapply`

### 6. Update CLI Help Text

**File:** `index.ts`

Update help text for `apply-tsconfig-flag` command to show `~` examples.

## Definition of Done

- [ ] `src/commands/init.ts` generates config with `~` aliases (not `@/`)
- [ ] `src/commands/init.ts` shows tsconfig example with `~` aliases in output
- [ ] All test fixtures updated to use `~` aliases
- [ ] `tests/tsconfig-utils.test.ts` expectations updated for `~` format
- [ ] `tests/add-command-integration.test.ts` fixtures updated
- [ ] `tests/add-command-test-files.test.ts` fixtures updated
- [ ] `tests/index.test.ts` fixtures updated
- [ ] `README.md` updated with `~` examples
- [ ] `docs/tasks/cli-apply-tsconfig-flag/LOG.md` updated
- [ ] CLI help text updated
- [ ] All tests pass (no regressions)
- [ ] TypeScript compilation succeeds
- [ ] Build succeeds
- [ ] Verify `behavior-fn init` generates config with `~` aliases
- [ ] Verify `behavior-fn apply-tsconfig-flag` applies `~` aliases to tsconfig
- [ ] Verify `behavior-fn reapply` preserves `~` aliases
- [ ] Verify `behavior-fn add <behavior>` rewrites `~` imports correctly
- [ ] **User Review**: Changes verified and commit authorized

## Technical Notes

### Alias Mapping (Before → After)

| Old Alias | New Alias |
|-----------|-----------|
| `@/behavior-registry` | `~registry` |
| `@/behavioral-host` | `~host` |
| `@/behavior-utils` | `~utils` |
| `@/test-utils` | `~test-utils` |
| `@/types` | `~types` |

### Files That Need Updates

1. **Command Files:**
   - `src/commands/init.ts` - Default alias generation

2. **Test Files (Config Fixtures):**
   - `tests/add-command-integration.test.ts`
   - `tests/add-command-test-files.test.ts`
   - `tests/index.test.ts`
   - `tests/tsconfig-utils.test.ts`

3. **Documentation Files:**
   - `README.md`
   - `docs/tasks/cli-apply-tsconfig-flag/LOG.md`
   - `AGENTS.md` (if any alias references)

4. **Help Text:**
   - `index.ts` - Command help output

### Testing Strategy

**Unit Tests:**
- Test `extractPathAliases()` with `~` aliases
- Test `getBehaviorFNCompilerOptions()` generates correct tsconfig with `~`
- Test `rewriteImports()` preserves `~` aliases correctly

**Integration Tests:**
- Run `init` and verify generated config has `~` aliases
- Run `apply-tsconfig-flag` and verify tsconfig has `~` paths
- Run `add <behavior>` and verify imports are rewritten correctly
- Run `reapply` and verify `~` aliases are preserved

**Manual Testing:**
```bash
# Create fresh test project
mkdir test-tilde-aliases && cd test-tilde-aliases
npm init -y

# Initialize BehaviorFN
behavior-fn init --defaults

# Check generated config
cat behavior.config.json  # Should have "alias": "~registry", etc.

# Apply to tsconfig
behavior-fn apply-tsconfig-flag --yes

# Check tsconfig
cat tsconfig.json  # Should have "~registry": [...], etc.

# Add a behavior
behavior-fn add reveal

# Check installed behavior imports
cat src/behaviors/reveal/behavior.ts  # Should have import from '~registry'
```

## Breaking Changes

**Impact:** Breaking change for any early adopters (if any exist)

**Migration Path (for documentation only, not implementing):**

If users already have `@/` aliases in their `behavior.config.json`:

1. **Manual Migration:**
   ```json
   // Old (before this change)
   {
     "paths": {
       "registry": {
         "path": "src/behaviors/behavior-registry.ts",
         "alias": "@/behavior-registry"
       }
     }
   }
   
   // New (after this change)
   {
     "paths": {
       "registry": {
         "path": "src/behaviors/behavior-registry.ts",
         "alias": "~registry"
       }
     }
   }
   ```

2. **Update tsconfig.json:**
   ```json
   // Old
   {
     "compilerOptions": {
       "paths": {
         "@/behavior-registry": ["./src/behaviors/behavior-registry"]
       }
     }
   }
   
   // New
   {
     "compilerOptions": {
       "paths": {
         "~registry": ["./src/behaviors/behavior-registry"]
       }
     }
   }
   ```

3. **Run reapply:**
   ```bash
   behavior-fn reapply --yes
   ```

## Constraints

**What MUST Change:**
- All default aliases in `init` command from `@/` to `~`
- All test fixtures using `@/` to `~`
- All documentation examples showing `@/` to `~`
- Help text examples

**What MUST NOT Change:**
- The `rewriteImports()` logic (already works correctly)
- The config schema structure (only default values change)
- The `--no-aliases` flag behavior (still generates relative paths)

**What Is Optional:**
- Users can still manually configure different aliases if they want (flexibility preserved)
- The system respects whatever alias is in the config file

## Related Files

- `src/commands/init.ts` - Default alias generation (PRIMARY CHANGE)
- `src/commands/shared.ts` - Rewrite logic (verify only, no changes needed)
- `src/commands/apply-tsconfig-flag.ts` - Help text updates
- `src/utils/tsconfig.ts` - No changes (reads from config)
- `tests/**/*.test.ts` - Fixture updates
- `docs/**/*.md` - Documentation updates
- `README.md` - Example updates

## Dependencies

**Blocks:**
- Any documentation work showing alias examples

**Blocked By:**
- None - can be executed immediately

**Related:**
- This task affects the output of `apply-tsconfig-flag` command (just implemented)
- Ensures consistency with existing `reapply` command

## Rationale

### Why `~` Is Better Than `@/`

1. **Consistency:** Registry source uses `~`, user code uses `~` → perfect match
2. **Distinction:** `~` signals "BehaviorFN core" vs `@/` signals "user src"
3. **No Conflicts:** Frameworks (Next, Vite, Astro) use `@/` for their own mappings
4. **Grep-Friendly:** Unique prefix makes searching easier
5. **Shorter:** Less typing, less visual noise
6. **Established Precedent:** Nuxt uses `~` for module imports, Sass uses `~` for node_modules

### Examples of `~` in the Wild

- **Nuxt.js:** `~` for module imports, `@` for src alias
- **Sass/SCSS:** `~` for importing from node_modules
- **Webpack:** `~` for module resolution
- **Vite:** Supports `~` for custom aliases

This establishes `~` as a recognizable pattern for "special imports" in the JavaScript ecosystem.

## Future Enhancements (Out of Scope)

- Custom alias prefix configuration (let users choose `~`, `@/`, `#`, etc.)
- Validation that user's chosen alias doesn't conflict with framework conventions
- CLI command to migrate from old `@/` aliases to new `~` aliases
- Auto-detection of alias conflicts in tsconfig.json
