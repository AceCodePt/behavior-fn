# Fix Config File Handling and Add Command Issues

**Type**: Bug Fix (Critical)  
**Priority**: Urgent  
**Created**: 2026-02-27

## Problem

The CLI has multiple critical issues preventing proper usage:

1. **Dual Config Files**: Both `behavior.json` and `behavior.config.json` exist, causing confusion
2. **Redundant Validator Prompt**: `add` command asks for validator even though it was chosen during `init`
3. **Missing Directory Creation**: Writing behavior files fails because subdirectories aren't created

### Error Examples

```bash
# Issue 2: Redundant prompt
$ behavior-fn add reveal
✔ Multiple validators detected. Which one should be used? › Zod Mini
# ❌ Should read from config, not prompt

# Issue 3: Directory not created
Installing behavior: reveal...
Error: ENOENT: no such file or directory, open '.../reveal/_behavior-definition.ts'
# ❌ Should create reveal/ directory before writing
```

## Root Causes

### 1. Dual Config Files
```typescript
// index.ts
const CONFIG_FILE = "behavior.json";           // Old name
const NEW_CONFIG_FILE = "behavior.config.json"; // New name
```

The code references both files but creates only the new one during `init`. This creates confusion about which file is canonical.

### 2. Validator Not Read from Config

The `add` command doesn't read the validator from config:

```typescript
// Current: prompts every time
const validatorChoice = await promptForValidator();

// Expected: read from config
const config = loadConfig();
const validatorChoice = config.validator || await promptForValidator();
```

### 3. Incomplete Directory Creation

The `installBehavior` function only creates the base behaviors directory, not subdirectories:

```typescript
// Current: only creates targetDir
if (!fs.existsSync(absoluteTargetDir)) {
  fs.mkdirSync(absoluteTargetDir, { recursive: true });
}

// Problem: For "reveal/_behavior-definition.ts", targetDir is "behaviors"
// but we need "behaviors/reveal/" to exist
```

## Goal

Create a cohesive, reliable config and installation workflow where:
1. Single source of truth config file
2. Validator choice persisted and reused
3. All necessary directories created automatically

## Requirements

### 1. Config File Consolidation
- ✅ Use `behavior.config.json` as the canonical config file
- ✅ Add `validator` field to config schema:
  ```typescript
  interface Config {
    validator: PackageName; // "zod" | "valibot" | etc.
    paths: { ... };
    aliases: { ... };
    optionalFiles?: { ... };
  }
  ```
- ✅ Migration: If `behavior.json` exists and `behavior.config.json` doesn't:
  - Read old config
  - Create new config with migrated data
  - Warn user to delete `behavior.json`
- ✅ If both exist, prefer `behavior.config.json` and warn about duplicate

### 2. Add Command Validator Logic
- ✅ Read validator from `behavior.config.json`
- ✅ Only prompt for validator if:
  - Config file doesn't exist (invalid project)
  - Config doesn't have `validator` field (old config)
- ✅ Save validator choice to config if prompted

### 3. Fix Directory Creation
- ✅ For each file in `behavior.files`, extract the full directory path
- ✅ Create the complete directory structure before writing:
  ```typescript
  const fullPath = path.join(absoluteTargetDir, fileName);
  const fileDir = path.dirname(fullPath);
  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content);
  ```

## Implementation Plan

### Phase 1: Config Schema Update
1. Add `validator: PackageName` field to `Config` interface
2. Update `init` command to save validator to config
3. Update config file name constants (remove `CONFIG_FILE`, keep only `NEW_CONFIG_FILE`)

### Phase 2: Migration Logic
1. Create `migrateConfig()` function:
   - Check for `behavior.json`
   - If exists and no `behavior.config.json`, migrate
   - Warn about legacy file
2. Update `loadConfig()` to call migration logic

### Phase 3: Add Command Fix
1. Modify `add` command to:
   ```typescript
   const config = loadConfig();
   if (!config) {
     console.error("No behavior.config.json found. Run 'behavior-fn init' first.");
     process.exit(1);
   }
   
   let validatorChoice = config.validator;
   if (!validatorChoice) {
     // Old config or corrupted - prompt and save
     validatorChoice = await promptForValidator();
     config.validator = validatorChoice;
     fs.writeFileSync('behavior.config.json', JSON.stringify(config, null, 2));
   }
   ```

### Phase 4: Directory Creation Fix
1. In `installBehavior()`, before writing each file:
   ```typescript
   const fullPath = path.join(absoluteTargetDir, fileName);
   const fileDir = path.dirname(fullPath);
   
   // Ensure complete directory structure exists
   if (!fs.existsSync(fileDir)) {
     fs.mkdirSync(fileDir, { recursive: true });
   }
   
   fs.writeFileSync(fullPath, content);
   ```

## Files to Modify

1. **index.ts**:
   - Update `Config` interface (add `validator` field)
   - Remove `CONFIG_FILE` constant usage
   - Add `migrateConfig()` function
   - Update `loadConfig()` to handle migration
   - Fix `init` command to save validator
   - Fix `add` command to read validator from config
   - Fix directory creation in `installBehavior()`

2. **src/types/init.ts** (if exists):
   - Update config type definitions

## Testing

### Test Cases

1. **Config Migration**:
   ```bash
   # Create old behavior.json
   echo '{"paths":{"behaviors":"./src/behaviors"}}' > behavior.json
   
   # Run init or add
   behavior-fn add reveal
   
   # Verify:
   # - behavior.config.json created
   # - Warning shown about behavior.json
   # - Validator field exists in new config
   ```

2. **Add Command No Prompt**:
   ```bash
   # After init with Zod Mini
   behavior-fn add reveal
   
   # Verify:
   # - No validator prompt
   # - Uses Zod Mini automatically
   # - Files created successfully
   ```

3. **Directory Creation**:
   ```bash
   # Fresh project
   behavior-fn init
   behavior-fn add reveal
   
   # Verify:
   # - src/components/behaviors/reveal/ directory created
   # - All files written successfully
   # - No ENOENT errors
   ```

4. **Both Configs Exist**:
   ```bash
   # Create both files
   echo '{"validator":"zod"}' > behavior.json
   echo '{"validator":"valibot"}' > behavior.config.json
   
   behavior-fn add reveal
   
   # Verify:
   # - Uses behavior.config.json (valibot)
   # - Warning about duplicate configs
   ```

## Success Criteria

- ✅ Single canonical config file: `behavior.config.json`
- ✅ Validator persisted in config and reused automatically
- ✅ No redundant prompts on `add` command
- ✅ All directories created recursively before file writes
- ✅ Graceful migration from old config format
- ✅ Clear error messages when config is missing/invalid
- ✅ All existing tests pass
- ✅ Integration test: `init` → `add reveal` works end-to-end

## Notes

This consolidates three related bugs into one cohesive fix. The issues are interdependent (config format affects validator storage, which affects add command, which affects file writing), so fixing them together ensures consistency.

**Breaking Change**: Users with `behavior.json` will need to migrate to `behavior.config.json`, but migration is automatic with a warning.
