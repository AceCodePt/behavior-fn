# LOG: Create CLI 'create' Command

**Date:** 2026-02-23  
**Branch:** `create-cli-create-command`  
**Status:** ✅ Complete

## Summary

Implemented two CLI commands for managing behaviors in the registry:
1. `behavior-fn create <name>` - Scaffolds new behaviors with all necessary files
2. `behavior-fn remove <name>` - Removes behaviors from the registry

## Architectural Decision

**Pattern:** Command Handler with Template Generation

The `create` command is a developer tool for contributors to scaffold new behaviors in the source registry. It follows a straightforward approach:

1. **Validation Layer:** Validates behavior name (kebab-case, uniqueness, format)
2. **Template Generation:** Uses string templates to generate four required files
3. **File System Operations:** Creates directory and writes files
4. **Registry Update:** Atomically updates the JSON registry

**Why this approach:**
- Simple and direct - no complex abstractions needed
- Template-based generation ensures consistency
- Atomic registry updates prevent partial states
- Clear error messages guide users

## Implementation Details

### Create Command

The `create` command scaffolds new behaviors in the source registry.

### Remove Command  

The `remove` command deletes behaviors from the registry with safety checks:
- Prevents removal of `core` behavior
- Validates behavior exists before removal
- Reloads registry to get latest state
- Removes directory recursively
- Updates registry JSON atomically

### Files Created

1. **`src/templates/behavior-templates.ts`**
   - Template generator functions for each file type
   - Utility functions for name transformations (kebab-case → camelCase, CONSTANT_CASE)
   - Generates:
     - `_behavior-definition.ts`: Imports schema and uses `uniqueBehaviorDef`
     - `schema.ts`: Empty TypeBox schema with helpful comments
     - `behavior.ts`: Factory function returning empty event handler object
     - `behavior.test.ts`: Basic test structure with vitest setup

2. **`src/utils/validation.ts`**
   - `isKebabCase()`: Validates kebab-case format (allows numbers)
   - `validateBehaviorName()`: Comprehensive name validation
   - `behaviorExists()`: Checks registry for duplicates

3. **Modified `index.ts`**
   - Added `createBehavior()` async function for scaffolding new behaviors
   - Added `removeBehavior()` async function for removing behaviors
   - Handles both dev and built scenarios (detects `__dirname` context)
   - Updates registry JSON atomically
   - Provides helpful output and safety checks

4. **`tests/create-command.test.ts`**
   - 12 comprehensive tests covering validation, template generation, and removal
   - Tests both success and error cases

5. **`docs/guides/contributing-behaviors.md`**
   - Comprehensive guide for creating and managing behaviors
   - Covers schema design, implementation patterns, testing strategies
   - Includes common patterns and best practices
   - Step-by-step walkthrough with examples

### Key Design Decisions

1. **Path Resolution:** The command detects whether it's running from source (`index.ts` exists) or from built code (`dist/`) and adjusts paths accordingly. This allows it to work in development.

2. **Lazy Jiti Import:** To avoid bundling issues with jiti (which uses dynamic requires), we import it lazily only when needed by the `add` command, not the `create` command.

3. **Atomic Registry Updates:** The registry JSON is read, modified, and written atomically to prevent corruption.

4. **Naming Conventions:**
   - Behavior names: kebab-case (e.g., `my-behavior`)
   - Factory names: camelCase + "BehaviorFactory" (e.g., `myBehaviorBehaviorFactory`)
   - Definition constants: CONSTANT_CASE + "_DEFINITION" (e.g., `MY_BEHAVIOR_DEFINITION`)

5. **Build Configuration:**
   - Created `tsup.config.ts` to properly handle bundling
   - Changed package.json to use `tsup` without inline arguments
   - Ensures registry files are copied correctly to dist/

## State Manifest

| State | Source | Validation |
|-------|--------|------------|
| `behaviorName` | CLI arg | kebab-case string via `validateBehaviorName()` |
| `registry` | `behaviors-registry.json` | JSON array of behavior entries |
| `behaviorDir` | Derived from name | File system path check |
| `templateFiles` | Generated in-memory | String content |
| `registryRoot` | Detected from `__dirname` | File system checks |

## Testing

All tests pass (113 tests total, including 12 new tests for create/remove commands):
- Validation tests for kebab-case, empty names, invalid formats
- Template generation tests for all four file types
- Remove command tests for existence checks
- Error case tests for duplicate names, existing directories, missing arguments, core protection

## Breaking Changes

None. This is a new feature that doesn't affect existing commands.

## Migration Notes

None required. The `create` command is for contributors, not end users.

## Next Steps

1. ✅ Implement the create command
2. ✅ Write tests
3. ✅ Update documentation (README.md)
4. ✅ Verify all tests pass
5. 🔄 User review and approval for commit

## Verification

```bash
# Build the CLI
pnpm build

# Test the create command
node dist/index.js create test-behavior

# Verify files created
ls -la registry/behaviors/test-behavior/

# Test the remove command
node dist/index.js remove test-behavior

# Verify files removed
ls -la registry/behaviors/test-behavior/ # Should error

# Test error cases
node dist/index.js remove non-existent # Should error
node dist/index.js remove core # Should prevent removal

# Run tests
pnpm test

# Check help text
node dist/index.js
```

All verification steps completed successfully.
