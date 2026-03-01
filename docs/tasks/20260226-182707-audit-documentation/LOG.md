# Documentation Audit - Execution Log

**Status:** In Progress  
**Branch:** `audit-documentation-and-align-with-current-implementation`  
**Started:** 2026-02-27

## Audit Scope

This task audits all documentation to ensure alignment with the current implementation after recent refactoring that:
1. Removed `window.BehaviorFN` global
2. Introduced `BehaviorDef` pattern
3. Changed `registerBehavior` signature
4. Replaced `getBehaviorSchema` with `getBehaviorDef`
5. Moved to ESM-only with auto-registration

## Implementation Analysis

### Current Architecture (Confirmed from Source)

#### 1. Behavior Registry (`registry/behaviors/behavior-registry.ts`)
- **Primary signature:** `registerBehavior(definition: BehaviorDef, factory: BehaviorFactory)`
- **Legacy signature:** `registerBehavior(name: string, factory: BehaviorFactory)` (for testing)
- **Schema access:** `getBehaviorDef(name)` returns full definition (includes schema)
- **No window global:** Everything is ESM-based

#### 2. Behavior Definition (`registry/behaviors/behavior-utils.ts`)
- Uses `uniqueBehaviorDef()` helper
- Auto-extracts `attributes` from schema properties
- Validates that command keys match values
- File structure still shows 4 files per behavior:
  - `_behavior-definition.ts`
  - `schema.ts`
  - `behavior.ts`
  - `behavior.test.ts`
- **Note:** `constants.ts` mentioned in AGENTS.md but NOT present in actual behaviors

#### 3. Key Differences from Documentation

**AGENTS.md claims 5-file structure:**
```
├── _behavior-definition.ts
├── constants.ts         # ❌ NOT PRESENT IN ACTUAL BEHAVIORS
├── schema.ts
├── behavior.ts
└── behavior.test.ts
```

**Actual structure (4 files):**
```
├── _behavior-definition.ts
├── schema.ts
├── behavior.ts
└── behavior.test.ts
```

## Issues Found

### Critical Issues

#### 1. AGENTS.md - Incorrect File Structure
**Location:** `AGENTS.md` line 436-459  
**Issue:** Documents 5-file structure including `constants.ts`, but actual behaviors only have 4 files
**Impact:** Misleading for contributors
**Fix:** Remove `constants.ts` from documented structure

#### 2. AGENTS.md - Wrong Property Name [RESOLVED]
**Location:** `AGENTS.md` line 322  
**Issue:** Uses `command:` but actual implementation uses `commands:` (plural)
**Actual code:** `commands: { "--show": "--show" }`
**Fix:** Change all references from `command:` to `commands:`
**Resolution:** This was identified as the CORRECT pattern. A separate refactoring task updated the implementation from `commands:` (plural) to `command:` (singular) to align with the Invoker Commands API standard.

#### 3. README.md - Legacy Pattern Examples
**Location:** Multiple sections showing `registerBehavior` usage
**Issue:** Examples show old pattern without BehaviorDef
**Example (line 189):**
```typescript
registerBehavior("reveal", revealBehaviorFactory);
```
**Should be:**
```typescript
import definition from "./behaviors/reveal/_behavior-definition";
registerBehavior(definition, revealBehaviorFactory);
```

#### 4. README.md - Missing Import for `getObservedAttributes`
**Location:** Line 193
**Issue:** Uses `getObservedAttributes(revealSchema)` without showing import
**Fix:** Add import and update to use definition object

### Documentation Files Status

#### Architecture Docs (`docs/architecture/`)
- [ ] `behavior-system.md` - Not yet audited
- [ ] `command-protocol.md` - Not yet audited
- [ ] `reactive-protocol.md` - Not yet audited
- [ ] `why-jiti.md` - Not yet audited

#### Guides (`docs/guides/`)
- [ ] `auto-loader.md` - Not yet audited
- [ ] `behavior-definition-standard.md` - **CRITICAL** - Not yet audited
- [ ] `cdn-usage.md` - Not yet audited
- [ ] `contributing-behaviors.md` - Not yet audited
- [ ] `creating-platforms.md` - Not yet audited
- [ ] `json-template-behavior.md` - Not yet audited
- [ ] `manual-loading.md` - Not yet audited
- [ ] `testing-behaviors.md` - Not yet audited
- [ ] `type-safe-registries.md` - Not yet audited
- [ ] `using-behaviors.md` - Not yet audited

#### Contributing Docs (`docs/contributing/`)
- [x] `agent-prompts/architect.md` - Issues found (see above)
- [ ] `adding-behaviors.md` - Not yet audited

## Audit Progress

### Phase 1: Initial Analysis ✅
- [x] Review task requirements
- [x] Analyze current implementation
- [x] Identify key changes
- [x] Document architecture findings

### Phase 2: Core Documentation (In Progress)
- [x] Fix AGENTS.md critical issues
  - Fixed file structure (4 files not 5, removed constants.ts)
  - Fixed property names (command → commands, ATTRS → attributes, COMMANDS → commands)
  - Updated all code examples to match implementation
- [x] Fix README.md examples
  - Updated CLI usage example to use BehaviorDef pattern
  - Fixed imports (behavior-utils instead of utils, added definition import)
- [x] Audit behavior-definition-standard.md
  - Fixed all command → commands references
  - Fixed all ATTRS/COMMANDS → attributes/commands references
  - Validated examples match actual implementation
- [ ] Audit cdn-usage.md
- [ ] Audit auto-loader.md

### Phase 3: Guides & Contributing
- [ ] Review all guides
- [ ] Update contributing docs
- [ ] Fix cross-references

### Phase 4: Architecture Docs
- [ ] Review architecture docs
- [ ] Update diagrams if needed

### Phase 5: Validation
- [ ] Test code examples
- [ ] Verify cross-references
- [ ] Final review

## Completed Fixes

### AGENTS.md ✅
1. ✅ Fixed file structure from 5 files to 4 files (removed `constants.ts`)
2. ✅ Fixed property name: `command:` → `commands:` throughout
3. ✅ Fixed access pattern: `ATTRS` → `attributes`, `COMMANDS` → `commands`
4. ✅ Updated all code examples to match implementation
5. ✅ Removed references to `OBSERVED_ATTRIBUTES` property

### README.md ✅
1. ✅ Updated CLI usage example to use BehaviorDef pattern
2. ✅ Fixed import: `./behaviors/utils` → `./behaviors/behavior-utils`
3. ✅ Added definition import: `import definition from "./behaviors/reveal/_behavior-definition"`
4. ✅ Updated registerBehavior call: `registerBehavior(definition, revealBehaviorFactory)`
5. ✅ Fixed getObservedAttributes call: `getObservedAttributes(definition.schema)`

### docs/guides/behavior-definition-standard.md ✅
1. ✅ Fixed all 15+ instances of `command` → `commands`
2. ✅ Fixed all property access: `ATTRS` → `attributes`, `COMMANDS` → `commands`
3. ✅ Updated test extraction pattern
4. ✅ Fixed validation examples
5. ✅ Updated migration checklist

## Remaining Work

### Low Priority (Working patterns, but could be improved)
- [ ] docs/guides/contributing-behaviors.md - Uses legacy `registerBehavior(name, factory)` pattern (still works)
- [ ] Architecture docs - Need review for any stale references

### Verification Needed
- [ ] Test that all code examples actually compile
- [ ] Verify cross-references between docs
- [ ] Check for any broken links

## Notes

### Current Implementation Patterns (Verified from Source)
- `uniqueBehaviorDef` returns object with `attributes` property (lowercase)
- Access pattern: `definition.attributes["reveal-delay"]`
- Commands property: `definition.commands` (lowercase, plural)
- Commands are optional, accessed via `definition.commands`
- File structure: 4 files per behavior (no `constants.ts`)
- Legacy pattern still works: `registerBehavior(name, factory)` for testing
