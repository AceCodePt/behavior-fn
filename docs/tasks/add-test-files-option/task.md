# Task: Add Test Files Import Option

**Type:** Enhancement (Progression)  
**Priority:** Medium  
**Estimated Complexity:** Low

## Goal

Add an optional prompt to the `behavior-fn add` command that asks users whether they want to include test files when importing a behavior.

## Context

Currently, when using `behavior-fn add <behavior>`, all files associated with the behavior are copied to the user's project, including test files (`behavior.test.ts`). While test files serve as excellent documentation and examples, not all users want them in their project:

- **Minimal Setup Users:** Some users prefer a lean setup without test files
- **Custom Testing Approach:** Teams may have their own testing conventions and don't need the reference tests
- **Learning Users:** New users may find the test files helpful as examples

Following the shadcn/ui philosophy of "ask what affects code generation," this is an optional enhancement that gives users control over what gets installed.

## Requirements

### 1. Interactive Prompt

When running `behavior-fn add <behavior>`, ask:

```
? Include test files? (Y/n)
  ❯ Yes - Install behavior.test.ts (recommended for learning)
    No - Skip test files
```

**Default:** Yes (recommended for transparency and learning)

### 2. Flag-Based Override

Support explicit flags to skip the prompt:

```bash
behavior-fn add reveal --tests        # Include tests (explicit)
behavior-fn add reveal --no-tests     # Exclude tests (explicit)
behavior-fn add reveal -t             # Short form for --tests
behavior-fn add reveal                # Interactive prompt (default: Yes)
```

### 3. Config-Based Preference

Allow users to set a preference in `behavior.json`:

```json
{
  "validator": "zod",
  "typescript": true,
  "behaviorsPath": "./src/behaviors",
  "packageManager": "pnpm",
  "includeTests": false  // Optional: skip prompt if set
}
```

If `includeTests` is set in config, skip the prompt and use the config value. CLI flags always override config.

### 4. File Filtering Logic

When `includeTests: false` or `--no-tests` is specified:
- **Skip:** `behavior.test.ts` files
- **Install:** All other behavior files (behavior.ts, schema.ts, etc.)
- **Keep:** Shared test utilities (`command-test-harness.ts`) should still be installed if needed by other behaviors

### 5. Test Utilities Handling

The `command-test-harness.ts` file is a shared testing utility:
- Install it on first behavior addition (if tests are included)
- Track whether any installed behavior has test files
- Only remove it if ALL behaviors are installed without tests
- Provide a separate command to add/remove test utilities explicitly:
  ```bash
  behavior-fn add-utils test-harness    # Add test utilities
  behavior-fn remove-utils test-harness # Remove test utilities
  ```

## Success Criteria

- [ ] Interactive mode asks about test file inclusion with clear options
- [ ] Default behavior includes test files (backward compatible, learning-friendly)
- [ ] `--tests` and `--no-tests` flags work correctly
- [ ] `-t` short flag works as alias for `--tests`
- [ ] Config-based `includeTests` preference is respected
- [ ] CLI flags override config preferences
- [ ] Test files are correctly filtered when `--no-tests` is used
- [ ] Shared test utilities are handled intelligently
- [ ] Existing behaviors work without breaking changes
- [ ] All existing tests pass
- [ ] New tests cover the test file filtering logic

## Definition of Done

- [ ] Prompt added to `behavior-fn add` command flow
- [ ] `--tests`, `--no-tests`, and `-t` flags implemented
- [ ] Config option `includeTests` added and documented
- [ ] File filtering logic correctly excludes `behavior.test.ts` files
- [ ] Test utilities handling implemented
- [ ] Tests written for new filtering logic
- [ ] Documentation updated (`docs/guides/using-behaviors.md` or CLI help)
- [ ] Backward compatibility maintained (default includes tests)
- [ ] **User Review**: Changes verified and commit authorized

## Implementation Notes

### Files to Modify

- `index.ts` - Main CLI entry point
  - Add prompt for test file inclusion
  - Add `--tests` and `--no-tests` flag parsing
  - Implement file filtering logic in `installBehavior` function
  
- `behavior.json` config schema
  - Add optional `includeTests` field
  
- Config loading logic
  - Read and validate `includeTests` config option
  
- CLI help text
  - Document new flags and behavior

### File Filtering Implementation

In the `installBehavior` function (around line 74-200 in `index.ts`):

```typescript
async function installBehavior(
  name: string,
  config: Config,
  validatorType: number = 0,
  platform?: PlatformStrategy,
  includeTests: boolean = true, // New parameter
) {
  // ... existing code ...
  
  // Install files
  for (const file of behavior.files) {
    // Skip test files if not requested
    if (!includeTests && file.path.includes('.test.ts')) {
      continue;
    }
    
    // ... rest of installation logic ...
  }
}
```

### Prompt Implementation

Add prompt before calling `installBehavior`:

```typescript
// Check for CLI flags first
let includeTests = true; // default
if (flags.tests) includeTests = true;
if (flags['no-tests']) includeTests = false;

// Check config preference if no flag provided
if (includeTests === true && config.includeTests === false) {
  includeTests = false;
}

// Ask user if not explicitly set
if (!flags.tests && !flags['no-tests'] && config.includeTests === undefined) {
  const response = await prompts({
    type: 'confirm',
    name: 'includeTests',
    message: 'Include test files?',
    initial: true, // Default to Yes
  });
  includeTests = response.includeTests;
}
```

### Test Utilities Strategy

Track test file installations:
- When installing a behavior with tests, mark it in a metadata file
- When removing behaviors, check if any remaining behaviors have tests
- Provide explicit utility management commands

## Testing Strategy

1. **Unit Tests:**
   - Test file filtering logic
   - Test config preference reading
   - Test flag parsing
   
2. **Integration Tests:**
   - Test `behavior-fn add reveal` with default (includes tests)
   - Test `behavior-fn add reveal --no-tests` (excludes tests)
   - Test `behavior-fn add reveal --tests` (includes tests)
   - Test config preference being respected
   - Test CLI flag overriding config
   
3. **Edge Cases:**
   - Multiple behaviors with mixed test preferences
   - Shared test utilities handling
   - Backward compatibility with existing installations

## Dependencies

None. This is an enhancement to existing functionality.

## Protocol Checklist

- [ ] **Plan:** Document architectural decisions in `LOG.md`
- [ ] **Data:** Define state manifest (config fields, prompt options)
- [ ] **Schema:** Update config validation schema if needed
- [ ] **Registry:** No changes needed (registry structure unchanged)
- [ ] **Test:** Write failing tests first (Red)
- [ ] **Develop:** Implement to make tests pass (Green)
- [ ] **Verify:** Run `pnpm check` and all tests
- [ ] **Document:** Update CLI documentation and guides

## Prohibited Patterns

- ❌ Making test file inclusion a required question (it should be optional/skippable)
- ❌ Breaking backward compatibility (default must include tests)
- ❌ Not supporting CLI flag overrides
- ❌ Hardcoding test file detection patterns (use consistent `.test.ts` pattern)
- ❌ Removing shared test utilities when they might still be needed
- ❌ Using `any` types for config or flag values
- ❌ Not providing clear user feedback about what's being installed

## References

- Current `installBehavior` function in `index.ts`
- Existing config structure and loading logic
- Registry structure in `registry/behaviors-registry.json`
- Behavior file structure pattern (`behavior.ts`, `behavior.test.ts`, `schema.ts`)
- shadcn/ui CLI patterns for optional features
