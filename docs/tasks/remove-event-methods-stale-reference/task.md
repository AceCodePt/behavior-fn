# Remove event-methods.ts Stale Reference

**Type**: Bug Fix (Critical)  
**Priority**: Urgent  
**Created**: 2026-02-27

## Problem

The `behavior-fn init` command fails with `ENOENT` error when trying to install the `core` behavior:

```
Error: ENOENT: no such file or directory, open '.../event-methods.ts'
```

## Root Cause

The `event-methods.ts` file was removed from the codebase (moved to `auto-wc` dependency), but stale references remain in:

1. **Registry JSON** (`registry/behaviors-registry.json` line 13):
   ```json
   {
     "name": "core",
     "files": [
       { "path": "event-methods.ts" }  // ← File doesn't exist
     ]
   }
   ```

2. **CLI Install Logic** (`index.ts` lines 146-149):
   ```typescript
   } else if (file.path === "event-methods.ts") {
     targetDir = path.dirname(config.paths.registry);
     fileName = "event-methods.ts";
   }
   ```

## Context

The `EventInterceptors` interface (originally in `event-methods.ts`) was migrated to the `auto-wc` external package. The behaviors now import from `auto-wc`:

```typescript
// registry/behaviors/behavior-registry.ts
import { type EventInterceptors } from "auto-wc";
```

This migration was completed but the cleanup of stale references was missed.

## Goal

Remove all references to `event-methods.ts` so that `behavior-fn init` works correctly.

## Requirements

1. ✅ Remove `event-methods.ts` entry from `registry/behaviors-registry.json`
2. ✅ Remove special handling for `event-methods.ts` in `index.ts` (lines 146-149)
3. ✅ Verify `behavior-fn init` works end-to-end
4. ✅ Verify no other references to `event-methods.ts` exist in the codebase

## Testing

1. **Integration Test**: Run `pnpx behavior-fn init` in a fresh directory and verify:
   - No ENOENT errors
   - All core files are installed correctly
   - Generated `behavior.config.json` is valid

2. **Code Search**: Grep for `event-methods` across the codebase to ensure no orphaned references

## Files to Modify

1. `registry/behaviors-registry.json` - Remove line 13
2. `index.ts` - Remove lines 146-149

## Success Criteria

- ✅ `behavior-fn init` completes successfully without errors
- ✅ No references to `event-methods.ts` remain in source code
- ✅ All existing tests pass
- ✅ User can initialize a new project and install behaviors

## Notes

This is a **critical bug** that completely blocks the CLI from working. It should be fixed immediately and released as a patch version (0.2.3).
