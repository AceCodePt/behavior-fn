# Task: Replace @standard-schema/spec with auto-wc in Core Dependencies

**Type:** Bug Fix / Dependency Update  
**Priority:** High  
**Estimated Complexity:** Low

## Goal

Replace `@standard-schema/spec` with `auto-wc` in the core behavior's dependencies to ensure that `auto-wc` is automatically installed when users run `behavior-fn init`.

## Context

Currently, the core behavior lists `@standard-schema/spec` as a dependency in `registry/behaviors-registry.json`, but this package is no longer needed. However, `auto-wc` is a critical runtime dependency that is:

1. **Used by core files:** Imported in `behavioral-host.ts` and `behavior-registry.ts`
2. **Not automatically installed:** When users run `behavior-fn init`, they receive files that import from `auto-wc`, but the package itself is never installed
3. **Causes import errors:** Users will encounter module resolution errors when trying to use the behavioral host system

The `auto-wc` package provides essential functionality for:
- Event handler wiring (`EventInterceptors` type)
- Component definition utilities (`defineBehavioralHost`)
- Standard event handling patterns

## Current State

**Registry entry (`registry/behaviors-registry.json`):**
```json
{
  "name": "core",
  "dependencies": [
    "@standard-schema/spec"
  ],
  "files": [...]
}
```

**Files that import auto-wc:**
- `registry/behaviors/behavioral-host.ts` - imports `defineBehavioralHost`, `registerBehavior`, etc.
- `registry/behaviors/behavior-registry.ts` - imports `EventInterceptors` type

## Requirements

### 1. Update Registry Dependencies

Replace `@standard-schema/spec` with `auto-wc` in the core behavior registry:

```json
{
  "name": "core",
  "dependencies": [
    "auto-wc"
  ],
  "files": [...]
}
```

### 2. Verify Installation Flow

Ensure that when `behavior-fn init` is executed:
1. The core behavior is installed (line 588 in `index.ts`)
2. Dependencies are installed via `installBehavior()` (lines 235-246)
3. `auto-wc` is successfully installed via the package manager

### 3. Test Installation

Verify in a fresh test project:
```bash
# In a test directory
behavior-fn init
# Should install auto-wc automatically

# Verify it's in package.json
cat package.json | grep auto-wc
# Should show: "auto-wc": "^0.1.4" (or current version)

# Verify imports work
# Files should successfully import from auto-wc without errors
```

### 4. Remove @standard-schema/spec if Unused

Check if `@standard-schema/spec` is still imported anywhere:
```bash
grep -r "@standard-schema/spec" registry/behaviors/
```

If not used, it can be safely removed. If still used, document where and why.

## Success Criteria

- [x] `auto-wc` is listed in core behavior dependencies
- [x] `@standard-schema/spec` is removed from core dependencies
- [x] `behavior-fn init` automatically installs `auto-wc`
- [x] No import errors when using behavioral-host system
- [x] Package manager correctly resolves `auto-wc` version
- [x] Existing behaviors continue to work without breaking changes

## Definition of Done

- [x] Registry updated with correct dependency
- [x] Test installation verified in clean environment
- [x] No TypeScript import errors
- [x] All existing tests pass
- [x] Documentation reviewed (if dependency change affects user-facing docs)
- [x] **Commit authorized and branch name provided**

## Implementation Notes

### Files to Modify

1. **`registry/behaviors-registry.json`** (Primary change)
   - Line 4-6: Replace `@standard-schema/spec` with `auto-wc`

### Installation Flow (No changes needed)

The existing `installBehavior()` function already handles dependency installation:

```typescript
// lines 235-246 in index.ts
if (behavior.dependencies && behavior.dependencies.length > 0) {
  console.log(
    `Installing dependencies: ${behavior.dependencies.join(", ")}...`,
  );
  try {
    execSync(`pnpm add ${behavior.dependencies.join(" ")}`, {
      stdio: "inherit",
    });
  } catch (e) {
    console.error("Failed to install dependencies.");
  }
}
```

This will automatically pick up `auto-wc` once the registry is updated.

### Version Pinning

Check the current version in the main `package.json` (line 26):
```json
"auto-wc": "^0.1.4"
```

The registry doesn't specify versions—they're resolved by the package manager. Consider if we need to:
- Pin to a specific version
- Use caret range (current: `^0.1.4`)
- Document minimum required version

**Recommendation:** Use the same version strategy as the main package (caret range for flexibility).

## Testing Strategy

### 1. Manual Testing

```bash
# Create a test project
mkdir test-auto-wc-install
cd test-auto-wc-install
npm init -y

# Run init with the updated registry
behavior-fn init

# Verify auto-wc is installed
cat package.json | grep auto-wc
ls node_modules/auto-wc

# Check that files can be imported without errors
node -e "require('./src/behaviors/behavior-registry')"
```

### 2. Automated Testing

Add or update tests to verify:
- Core behavior dependencies include `auto-wc`
- Dependencies are correctly installed during init
- No import errors occur in generated files

### 3. Regression Testing

Run full test suite to ensure:
```bash
pnpm test
pnpm build
```

All existing tests should pass without modification.

## Dependencies

None. This is a self-contained change to the registry.

## Protocol Checklist

- [x] **Plan:** Task documented with clear context and requirements
- [x] **Data:** No data structure changes (only dependency list)
- [x] **Schema:** No schema changes needed
- [x] **Registry:** Update behaviors-registry.json
- [ ] **Test:** Verify installation in clean environment
- [ ] **Develop:** Update registry file
- [ ] **Verify:** Run tests and manual verification
- [ ] **Document:** Update if dependency change affects user docs

## Prohibited Patterns

- ❌ Removing `auto-wc` from main `package.json` (still needed for development)
- ❌ Breaking existing behavior imports
- ❌ Hardcoding version numbers in registry
- ❌ Skipping installation verification
- ❌ Not checking for usage of `@standard-schema/spec` before removal

## References

- Current registry: `registry/behaviors-registry.json`
- Installation logic: `index.ts` lines 95-249 (`installBehavior` function)
- Files using auto-wc:
  - `registry/behaviors/behavioral-host.ts`
  - `registry/behaviors/behavior-registry.ts`
- Main package.json: Line 26 (`"auto-wc": "^0.1.4"`)

## Risk Assessment

**Low Risk** - This is a straightforward dependency replacement that:
- Fixes a real bug (missing runtime dependency)
- Doesn't change any code logic
- Only affects the installation process
- Can be easily reverted if issues arise

**Potential Issues:**
- Version conflicts if user already has `auto-wc` installed
- Package manager resolution differences (pnpm/npm/yarn/bun)

**Mitigation:**
- Test across multiple package managers
- Document any peer dependency requirements
- Provide clear error messages if installation fails
