# Task: Add CLI Apply TSConfig Flag Command

## Goal

Implement an `apply-tsconfig-flag` command in the CLI that intelligently scans for TypeScript configuration files in the project, prompts the user to select one (or auto-applies if only one exists), and applies BehaviorFN-specific compiler options to ensure optimal type safety and compatibility.

## Context

**Why This Is Needed:**

TypeScript configuration is critical for BehaviorFN to work correctly with Web Components. Users need to ensure their `tsconfig.json` includes specific compiler options for:
1. **Custom Elements Support**: `"customElements": "scoped"` or proper element definitions
2. **Module Resolution**: Correct `moduleResolution` for path aliases
3. **Type Safety**: Strict mode and proper lib includes for DOM APIs
4. **Path Aliases**: Proper `paths` configuration for behavior imports

**Current Pain Points:**
1. **Manual Configuration**: Users must manually edit their tsconfig.json after initialization
2. **Multiple Configs**: Projects often have multiple tsconfig files (tsconfig.json, tsconfig.app.json, tsconfig.node.json, tsconfig.build.json) and it's unclear which one to modify
3. **Missed Files**: Easy to miss non-standard config file names (e.g., tsconfig.lib.json, tsconfig.spec.json)
4. **Configuration Drift**: No easy way to reapply or verify tsconfig settings after project changes

**Use Cases:**
- Developer initializes BehaviorFN in an existing project with multiple tsconfig files
- Monorepo with workspace-specific tsconfig files needs selective application
- Framework setup (Next.js, Astro, Vite) with specialized tsconfig structures
- Developer wants to update tsconfig after changing BehaviorFN configuration

## Requirements

1. **Intelligent Config Discovery**: The command must:
   - Scan the project directory (excluding `node_modules/`) for all files matching `tsconfig*.json` pattern
   - Present a user-friendly list showing relative paths from project root
   - Support glob patterns for discovery (e.g., `**/tsconfig*.json`)
   - Detect and warn about extended configs (files with `"extends"` field)

2. **Smart Auto-Apply Logic**: When exactly one tsconfig file exists (not in node_modules):
   - Skip the selection prompt entirely
   - Display which file was detected
   - Show a confirmation of the changes to be applied
   - Proceed with automatic application (with option to cancel)

3. **Flexible Selection Interface**: When multiple configs exist:
   - Display numbered list of all discovered tsconfig files
   - Show relative paths for clarity
   - Allow manual string input for custom paths not in the scan results
   - Support tab completion or fuzzy matching for file paths
   - Validate that manually entered paths exist and are valid JSON

4. **Configuration Application**: The command must:
   - Merge BehaviorFN-required compiler options into the selected tsconfig
   - Preserve existing user configuration (non-destructive merge)
   - Add path aliases from `behavior.config.json` to `compilerOptions.paths`
   - Ensure proper `lib`, `target`, and `moduleResolution` settings
   - Handle both flat and nested `compilerOptions` structures
   - Preserve comments in JSON files where possible (use JSON5 or comment-preserving parser)

5. **Required Compiler Options**: Apply these settings:
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "ESNext",
       "moduleResolution": "bundler",
       "lib": ["ES2022", "DOM", "DOM.Iterable"],
       "customElements": "scoped",
       "allowSyntheticDefaultImports": true,
       "esModuleInterop": true,
       "strict": true,
       "skipLibCheck": true,
       "paths": {
         "~registry": ["<from-config>"],
         "~host": ["<from-config>"],
         "~utils": ["<from-config>"],
         "~test-utils": ["<from-config>"],
         "~types": ["<from-config>"]
       }
     }
   }
   ```

6. **User Feedback & Safety**: The command should:
   - Create a backup of the original tsconfig before modification (`.tsconfig.backup.json` with timestamp)
   - Show a diff or summary of changes to be applied
   - Prompt for confirmation before writing (with `--yes` flag to skip)
   - Validate JSON syntax after modification
   - Rollback on error using the backup

7. **Edge Cases**:
   - Handle configs that extend other configs (`"extends": "./base.json"`)
   - Warn if selected config is in node_modules (likely a mistake)
   - Handle invalid JSON files gracefully with clear error messages
   - Support both `tsconfig.json` and `.json` files with TypeScript comments
   - Handle read-only or permission-denied files

## Definition of Done

- [ ] `behavior-fn apply-tsconfig-flag` command implemented in `index.ts`
- [ ] Command scans project for all `tsconfig*.json` files (excluding node_modules)
- [ ] Auto-apply logic when exactly one config exists (with confirmation)
- [ ] Interactive selection prompt when multiple configs exist
- [ ] Manual path input option for configs not in scan results
- [ ] Backup mechanism creates timestamped copies before modification
- [ ] Non-destructive merge preserves existing user configuration
- [ ] Path aliases from `behavior.config.json` are correctly applied
- [ ] User confirmation prompt with `--yes` flag to bypass
- [ ] Clear console output showing discovered files and changes
- [ ] JSON validation before and after modification
- [ ] Error handling for edge cases (invalid JSON, permissions, etc.)
- [ ] Documentation updated in CLI help text and README
- [ ] All tests pass
- [ ] **User Review**: Changes verified and commit authorized

## Technical Notes (Guidance, Not Prescription)

**Suggested Approach:**

1. **Add Command Handler** in `index.ts`:
   ```typescript
   if (command === "apply-tsconfig-flag") {
     await applyTsConfigFlag();
     process.exit(0);
   }
   ```

2. **Create Helper Functions**:
   - `scanTsConfigs(cwd: string): string[]` - Find all tsconfig files
   - `selectTsConfig(configs: string[]): Promise<string>` - Interactive selection or auto
   - `applyBehaviorFNConfig(configPath: string, behaviorConfig: Config): void` - Merge options
   - `createTsConfigBackup(configPath: string): string` - Backup utility
   - `mergeTsConfig(existing: any, additions: any): any` - Deep merge preserving user settings

3. **File Discovery Pattern**:
   ```typescript
   import { glob } from 'fast-glob'; // or use node:fs + recursion
   
   const configs = await glob('**/tsconfig*.json', {
     cwd,
     ignore: ['**/node_modules/**'],
     absolute: false
   });
   ```

4. **Selection Logic**:
   ```typescript
   if (configs.length === 0) {
     console.error('No tsconfig files found');
     process.exit(1);
   } else if (configs.length === 1) {
     console.log(`✓ Found single tsconfig: ${configs[0]}`);
     // Show changes and confirm
     const confirmed = await confirmChanges();
     if (confirmed) applyConfig(configs[0]);
   } else {
     // Multiple configs - show selection prompt
     const selected = await promptSelection(configs);
     applyConfig(selected);
   }
   ```

5. **Custom Path Input**:
   ```typescript
   const response = await prompts({
     type: 'autocomplete',
     name: 'config',
     message: 'Select tsconfig file (or type custom path):',
     choices: configs.map(c => ({ title: c, value: c })),
     suggest: (input, choices) => {
       // Allow manual input
       if (!choices.find(c => c.value === input)) {
         return [{ title: `Custom: ${input}`, value: input }];
       }
       return choices.filter(c => c.title.includes(input));
     }
   });
   ```

**Flags to Support:**
- `--yes` or `-y`: Skip all confirmation prompts (auto-apply)
- `--config <path>`: Skip selection, directly apply to specified config
- `--no-backup`: Skip backup creation (use with caution)
- `--dry-run`: Show what would be changed without writing

**Example Usage:**
```bash
# Interactive mode (scan and select)
behavior-fn apply-tsconfig-flag

# Auto-apply to specific config
behavior-fn apply-tsconfig-flag --config tsconfig.app.json

# Non-interactive mode (auto-select if single, or error if multiple)
behavior-fn apply-tsconfig-flag --yes

# Dry run to preview changes
behavior-fn apply-tsconfig-flag --dry-run --config tsconfig.json
```

**Expected Output (Single Config):**
```
Scanning for TypeScript configuration files...

✓ Found single tsconfig: ./tsconfig.json

The following changes will be applied:
  + compilerOptions.paths["~registry"] = ["./src/behaviors/behavior-registry.ts"]
  + compilerOptions.paths["~host"] = ["./src/behaviors/behavioral-host.ts"]
  + compilerOptions.paths["~utils"] = ["./src/behaviors/behavior-utils.ts"]
  + compilerOptions.customElements = "scoped"
  
Backup will be created at: .tsconfig.backup.20260301-123045.json

Apply these changes? (y/n)

✓ Backup created
✓ Configuration applied successfully

✅ tsconfig.json updated!
```

**Expected Output (Multiple Configs):**
```
Scanning for TypeScript configuration files...

Found 3 TypeScript configuration files:
  1. tsconfig.json
  2. tsconfig.app.json
  3. tsconfig.node.json

? Select tsconfig file to modify (or type custom path):
❯ tsconfig.json
  tsconfig.app.json
  tsconfig.node.json
  [Type custom path...]

[After selection, proceed with confirmation and application]
```

**Expected Output (Manual Input):**
```
? Select tsconfig file to modify: packages/web/tsconfig.build.json

✓ Validating packages/web/tsconfig.build.json...

The following changes will be applied:
  [... changes ...]
  
Apply these changes? (y/n)
```

## Constraints

**What MUST Be Preserved:**
- All existing `compilerOptions` not related to BehaviorFN
- User's `include` and `exclude` patterns
- Comments in tsconfig (if parser supports it)
- Existing `extends` references
- Non-compilerOptions fields (`references`, `files`, etc.)

**What WILL Be Merged/Overwritten:**
- `compilerOptions.paths` - BehaviorFN aliases added (existing preserved)
- `compilerOptions.customElements` - Set to "scoped" if not present
- `compilerOptions.lib` - Ensured to include ES2022, DOM, DOM.Iterable
- `compilerOptions.moduleResolution` - Set to "bundler" if not present

**Validation Requirements:**
- Validate that `behavior.config.json` exists before running
- Validate JSON syntax of selected tsconfig
- Validate that manual input paths exist
- Validate that paths in `behavior.config.json` are valid

## Related Files

- `index.ts` - Main CLI entry point (add `apply-tsconfig-flag` command handler)
- `src/schemas/config.ts` - Config schema (read path aliases from here)
- `src/utils/validation.ts` - JSON validation utilities
- `src/utils/detect.ts` - Environment detection (reuse TypeScript detection)

## Dependencies

None - this task can be executed immediately. However, it should be run after `init` in typical user workflows.

## Future Enhancements (Out of Scope)

- Validate that applied config matches BehaviorFN requirements (verification mode)
- Support for `jsconfig.json` (JavaScript projects)
- Interactive editor mode to modify other compiler options
- Integration with `behavior-fn init` as optional step
- Watch mode to auto-apply on config changes
