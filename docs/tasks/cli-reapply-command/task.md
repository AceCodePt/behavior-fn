# Task: Add CLI Reapply Command

## Goal

Implement a `reapply` command in the CLI that regenerates behavior files based on the current `behavior.config.json` configuration. This allows users to update their installed behaviors when configuration changes (e.g., switching validators, changing paths, toggling aliases) without having to manually reinstall each behavior.

## Context

**Why This Is Needed:**

Currently, when users modify their `behavior.config.json` (e.g., changing validator from "zod" to "valibot", updating paths, or adding/removing aliases), there is no mechanism to propagate these changes to already-installed behaviors. Users would need to manually remove and re-add each behavior to apply configuration changes.

**Current Pain Points:**
1. **Validator Changes**: Switching validators requires manually reinstalling all behaviors to regenerate schema transformations.
2. **Path Changes**: Updating file paths in config requires manual file moves and import rewrites.
3. **Alias Changes**: Adding or removing path aliases requires manually updating all import statements.
4. **Config Drift**: No way to ensure installed behaviors match the current configuration state.

**Use Cases:**
- Developer switches from Zod to Valibot for smaller bundle size
- Project refactoring moves behaviors to a different directory structure
- Team standardizes on path aliases after initially using relative imports
- Upgrading BehaviorFN version with new transformation logic

## Requirements

1. **Command Interface**: Implement `behavior-fn reapply` command that:
   - Reads the current `behavior.config.json` to determine which behaviors are installed
   - Regenerates all installed behavior files using current configuration
   - Preserves user customizations where possible (see Constraints)

2. **Detection of Installed Behaviors**: The command must:
   - Detect which behaviors are currently installed by scanning the behaviors directory
   - Use the file system as the source of truth (not a separate manifest)
   - Handle both core and optional behaviors

3. **Transformation Consistency**: All transformations must:
   - Use the same logic as the `add` command (reuse `installBehavior` function)
   - Apply validator-specific schema transformations
   - Perform import rewriting based on current alias configuration
   - Apply platform-specific transformations

4. **User Confirmation**: The command should:
   - Display which behaviors will be regenerated
   - Show configuration changes (old vs new if detectable)
   - Prompt for confirmation before overwriting files (with `--yes` flag to skip)
   - Warn if user customizations will be lost

5. **Safety & Rollback**: The command must:
   - Create backups of existing files before overwriting (in `.behavior-backup/` directory with timestamp)
   - Provide clear error messages if regeneration fails
   - Allow partial success (continue if one behavior fails, report at end)

6. **Edge Cases**:
   - Handle missing behaviors in registry (skip with warning)
   - Handle config file structure changes (validate schema)
   - Handle removed behaviors (detect and optionally remove)
   - Handle test files based on current `optionalFiles.tests` config

## Definition of Done

- [ ] `behavior-fn reapply` command implemented in `index.ts`
- [ ] Command detects installed behaviors by scanning filesystem
- [ ] Command regenerates files using current `behavior.config.json`
- [ ] Backup mechanism creates timestamped copies before overwriting
- [ ] User confirmation prompt with `--yes` flag to bypass
- [ ] Clear console output showing progress and results
- [ ] Error handling for missing registry entries and config issues
- [ ] Test files are handled according to current config (`optionalFiles.tests`)
- [ ] Documentation updated in CLI help text and README
- [ ] All tests pass
- [ ] **User Review**: Changes verified and commit authorized

## Technical Notes (Guidance, Not Prescription)

**Suggested Approach:**
1. Add `reapply` command handler in `index.ts` alongside `init`, `add`, `create`, `remove`
2. Create helper function `detectInstalledBehaviors(config: Config): string[]` that:
   - Scans the `config.paths.behaviors` directory
   - Returns array of behavior names (directory names)
   - Filters out non-behavior directories
3. Reuse existing `installBehavior` function to regenerate files
4. Add backup utility: `createBackup(filePath: string): void`
5. Add confirmation prompt with summary of changes

**Flags to Support:**
- `--yes` or `-y`: Skip confirmation prompt (CI/CD friendly)
- `--no-backup`: Skip backup creation (for clean reapply)
- `--with-tests` / `--no-tests`: Override config for test files

**Example Usage:**
```bash
# Interactive mode (with confirmation)
behavior-fn reapply

# Non-interactive mode (CI/CD)
behavior-fn reapply --yes

# Reapply without creating backups
behavior-fn reapply --yes --no-backup

# Force include/exclude test files
behavior-fn reapply --with-tests
behavior-fn reapply --no-tests
```

**Expected Output:**
```
Detected installed behaviors:
  - core
  - reveal
  - logger
  - request
  
Configuration:
  Validator: zod
  Behaviors path: src/components/behaviors
  Aliases: enabled
  
This will regenerate 4 behaviors. Continue? (y/n)

✓ Backed up to .behavior-backup/2026-03-01-123045/
✓ Regenerated core
✓ Regenerated reveal
✓ Regenerated logger
✓ Regenerated request

✅ Reapply complete! All behaviors regenerated.
```

## Constraints

**What MUST Be Preserved:**
- **Behavior Logic**: User customizations in `behavior.ts` should NOT be overwritten
  - **Solution**: Only regenerate infrastructure files (`_behavior-definition.ts`, `schema.ts`, `behavior.test.ts`) by default
  - **Alternative**: Add `--force` flag to overwrite everything with registry versions

**What WILL Be Overwritten:**
- Schema transformations (must match current validator)
- Import statements (must match current alias config)
- Test files (must match current config and validator)
- Behavior definitions (auto-generated metadata)

**Recommendation**: 
- By default, only regenerate files that are "infrastructure" (schema, definition, imports)
- Add `--force-all` flag to overwrite user `behavior.ts` files from registry
- Always regenerate test files (they're reference implementations)

## Related Files

- `index.ts` - Main CLI entry point (add `reapply` command handler)
- `src/schemas/config.ts` - Config schema (already complete)
- `src/utils/validation.ts` - Validation utilities
- Registry: `registry/behaviors-registry.json` - Behavior registry

## Dependencies

None - this task can be executed immediately.
