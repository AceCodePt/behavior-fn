# Task: Audit and Align Documentation

**Status:** Pending  
**Created:** 2026-02-26  
**Priority:** High  
**Complexity:** Medium  

## Context

After recent refactoring (removing `window.BehaviorFN`, using `BehaviorDef` pattern), we need to ensure all documentation is accurate and aligned with the current implementation.

## Goal

Audit all documentation files to ensure:
1. Code examples match current API signatures
2. Architecture descriptions match implementation
3. No references to deprecated patterns (`window.BehaviorFN`, old `registerBehavior` signature)
4. All guides reflect current best practices
5. Cross-references between docs are accurate

## Files to Audit

### Architecture Docs (`docs/architecture/`)
- [ ] `behavior-system.md` - Core behavior system architecture
- [ ] `command-protocol.md` - Command event protocol
- [ ] `reactive-protocol.md` - Reactive behavior patterns
- [ ] `why-jiti.md` - Build system decisions

### Guides (`docs/guides/`)
- [ ] `auto-loader.md` - Auto-loader usage and patterns
- [ ] `behavior-definition-standard.md` - **CRITICAL** - Behavior definition contract
- [ ] `cdn-usage.md` - CDN loading patterns
- [ ] `contributing-behaviors.md` - How to add new behaviors
- [ ] `creating-platforms.md` - Platform detection
- [ ] `json-template-behavior.md` - JSON template usage
- [ ] `manual-loading.md` - Manual behavior loading
- [ ] `testing-behaviors.md` - Testing patterns
- [ ] `type-safe-registries.md` - Registry type safety
- [ ] `using-behaviors.md` - End-user guide

### Contributing Docs (`docs/contributing/`)
- [ ] `adding-behaviors.md` - Behavior contribution guide
- [ ] `agent-prompts/architect.md` - Agent instructions

## Key Changes to Verify

### 1. Registry Pattern
**Old:**
```typescript
registerBehavior(name: string, factory: BehaviorFactory, schema: BehaviorSchema)
```

**New:**
```typescript
registerBehavior(definition: BehaviorDef, factory: BehaviorFactory)
// OR (legacy/test)
registerBehavior(name: string, factory: BehaviorFactory)
```

### 2. Schema Access
**Old:**
```typescript
const schema = getBehaviorSchema(name);
```

**New:**
```typescript
const def = getBehaviorDef(name);
const schema = def.schema;
```

### 3. No Window Global
**Old:**
```typescript
window.BehaviorFN.behaviorMetadata[name]
```

**New:**
```typescript
// Everything in ESM registry - no window global
const def = getBehaviorDef(name);
```

### 4. CDN Loading
**Old:**
```typescript
// Metadata stored in window.BehaviorFN
```

**New:**
```typescript
// Definition stored in ESM registry
import { getBehaviorDef } from './behavior-fn-core.js';
```

## Acceptance Criteria

- [ ] All code examples compile and run correctly
- [ ] No references to `window.BehaviorFN`
- [ ] All `registerBehavior` calls use correct signature
- [ ] All `getBehaviorSchema` changed to `getBehaviorDef`
- [ ] Architecture diagrams match implementation
- [ ] Cross-references between docs are valid
- [ ] New patterns (BehaviorDef, ESM-only) are documented

## Testing

1. Run all code examples from docs
2. Verify links work
3. Check for broken references
4. Validate against current test suite

## Notes

- Focus on high-impact guides first (behavior-definition-standard, cdn-usage, auto-loader)
- Update examples to show both signatures (primary and legacy)
- Add migration notes where appropriate
