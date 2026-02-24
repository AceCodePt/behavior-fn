# Task: Multi-Registry Support

## Goal

Enable users to install behaviors from multiple registries (official, third-party, private) using namespace syntax, similar to shadcn/ui's registry system.

## Context

**Why:** Currently, behavior-fn only supports a single, built-in registry bundled with the CLI. Users cannot:
- Install behaviors from community registries
- Use private company registries
- Mix behaviors from different sources
- Publish custom behavior libraries

**Impact:** This limits ecosystem growth and prevents organizations from creating internal behavior libraries.

**Inspiration:** shadcn/ui's multi-registry system with namespace support (`@namespace/component`).

## Requirements

### Functional

1. **Config Evolution:** Extend `behavior.json` with optional `registries` field
2. **Namespace Syntax:** Support `@namespace/behavior-name` for installations
3. **Registry Types:** Support URL templates and advanced config (headers, params)
4. **Environment Variables:** Expand `${VAR_NAME}` in headers/params
5. **Backwards Compatible:** `behavior-fn add reveal` still uses built-in registry
6. **Registry Management CLI:** CRUD operations for registries in config
7. **Security:** `--dry-run` flag to preview before installing
8. **Individual Files:** Each registry serves individual behavior JSON files

### Non-Functional

1. **Simplicity:** NO cross-behavior dependencies (behaviors are isolated)
2. **Security:** Basic safeguards now, comprehensive hardening later (backlog)
3. **Performance:** Simple caching for remote responses
4. **Developer Experience:** Clear error messages, helpful prompts

## Architecture

### Config Schema (`behavior.json`)

```json
{
  "paths": { ... },
  "aliases": { ... },
  "registries": {
    "@official": "https://behavior-fn.dev/r/{name}.json",
    "@community": "https://registry.behaviors.community/{name}.json",
    "@private": {
      "url": "https://internal.company.com/behaviors/{name}.json",
      "headers": {
        "Authorization": "Bearer ${BEHAVIOR_REGISTRY_TOKEN}"
      },
      "params": {
        "version": "latest"
      }
    }
  }
}
```

### Registry Response Format

Each endpoint must return:

```json
{
  "$schema": "https://behavior-fn.dev/schema/behavior.json",
  "name": "tooltip",
  "version": "1.0.0",
  "description": "Tooltip behavior with positioning",
  "dependencies": ["@floating-ui/dom"],
  "files": [
    {
      "path": "tooltip/_behavior-definition.ts",
      "content": "export const name = 'tooltip';\n..."
    },
    {
      "path": "tooltip/schema.ts",
      "content": "..."
    },
    {
      "path": "tooltip/behavior.ts",
      "content": "..."
    },
    {
      "path": "tooltip/behavior.test.ts",
      "content": "..."
    }
  ]
}
```

### CLI Commands

```bash
# Backwards compatible - built-in registry
behavior-fn add reveal

# Namespaced - third-party registry
behavior-fn add @community/tooltip

# Registry management
behavior-fn registries list
behavior-fn registries add @acme https://acme.com/r/{name}.json
behavior-fn registries remove @acme
behavior-fn registries info @acme

# Security preview
behavior-fn add @community/tooltip --dry-run
```

## Implementation Phases

### Phase 1: Core Registry Support (2-3 days)

**Goal:** Basic multi-registry fetching works

- [ ] Add `registries` field to config TypeScript types
- [ ] Create `src/registry/resolver.ts` with `RegistryResolver` class
- [ ] Implement namespace parsing (`@namespace/name` → `{ namespace, name }`)
- [ ] Implement URL template resolution (`{name}` placeholder)
- [ ] Add environment variable expansion (`${VAR_NAME}`)
- [ ] Create HTTP fetcher for remote behavior JSON
- [ ] Validate registry response against schema
- [ ] Update `installBehavior()` to support remote sources
- [ ] Write comprehensive unit tests

**Test Cases:**
- Parse valid namespaced names
- Parse non-namespaced names (default registry)
- Resolve URL templates correctly
- Expand environment variables
- Handle missing environment variables gracefully
- Validate registry responses
- Reject invalid schemas

**Deliverables:**
- `behavior-fn add @acme/tooltip` works
- Environment variables in config are expanded
- Clear validation errors for malformed responses

---

### Phase 2: Registry Management CLI (1-2 days)

**Goal:** Users can manage registries via CLI

- [ ] `behavior-fn registries list` command
- [ ] `behavior-fn registries add <namespace> <url>` command
- [ ] `behavior-fn registries remove <namespace>` command
- [ ] `behavior-fn registries info <namespace>` command
- [ ] Update `behavior-fn add` to parse namespaces
- [ ] Improve error messages (network failures, auth errors, etc.)
- [ ] Add helpful hints for common issues

**Test Cases:**
- Add registry to config
- List all registries
- Remove registry from config
- Show registry details
- Handle invalid namespace syntax
- Handle duplicate namespaces

**Deliverables:**
- Full CRUD for registries
- User-friendly CLI output
- Integration tests for commands

---

### Phase 3: Security & Preview (1-2 days)

**Goal:** Users can safely preview before installing

- [ ] Add `--dry-run` flag to `add` command
- [ ] Preview mode: show files without writing
- [ ] Confirmation prompt for first-time registry usage
- [ ] Warning message for non-official registries
- [ ] **Create backlog task:** Comprehensive security hardening

**Test Cases:**
- Dry-run shows files but doesn't write
- First-time registry prompts for confirmation
- User can abort installation
- Warning appears for third-party registries

**Deliverables:**
- `--dry-run` flag works
- Clear security warnings
- Backlog task created for future hardening

---

### Phase 4: Documentation & Tooling (2 days)

**Goal:** Community can create and use registries

- [ ] Update README with multi-registry examples
- [ ] Create `docs/guides/creating-registries.md`
- [ ] Create registry template repository (GitHub template)
- [ ] Document registry JSON schema (`docs/registry-schema.md`)
- [ ] Add authentication examples (Bearer token, API keys)
- [ ] Migration guide for adding registries to existing projects

**Deliverables:**
- Complete documentation
- Template repository for custom registries
- Clear examples of public/private setups

---

## Key Decisions

### ✅ Locked In

1. **Config File:** Keep `behavior.json` (not `components.json`)
2. **Registry Format:** Individual JSON files per behavior
3. **No Dependencies:** Behaviors are isolated, no cross-behavior deps
4. **Security:** Basic now, comprehensive later (backlog)
5. **Backwards Compat:** Not critical (pre-1.0), but maintain for convenience

### 🤔 Deferred to Future

1. **Consolidated Format:** `--format consolidated` flag (backlog)
2. **Registry Discovery:** Public directory of registries (backlog)
3. **Versioning:** `@acme/tooltip@1.2.3` syntax (backlog)
4. **Official Hosting:** Where to host the official registry (post-v1.0)

---

## Testing Strategy

### Unit Tests
- Namespace parsing
- URL template resolution
- Environment variable expansion
- Registry response validation
- Config file updates

### Integration Tests
- Full CLI workflows
- HTTP fetching with mocked responses
- File installation from remote sources
- Error handling and recovery

### Manual Testing
- Install from real third-party registry
- Test authentication with private registry
- Verify dry-run preview
- Confirm backwards compatibility

---

## Success Criteria

1. ✅ `behavior-fn add @namespace/name` works
2. ✅ `behavior-fn registries` commands work
3. ✅ Environment variables expand correctly
4. ✅ `--dry-run` shows preview without installing
5. ✅ Clear warnings for third-party registries
6. ✅ Backwards compatible with non-namespaced names
7. ✅ Documentation complete with examples
8. ✅ Template repository available

---

## Related Tasks

- **Blocked by:** None
- **Blocks:** None
- **Related:**
  - [Backlog] Security Hardening for Multi-Registry
  - [Backlog] Consolidated Registry Format Support
  - [Backlog] Registry Discovery and Directory

---

## Notes

- Behaviors remain isolated - no cross-behavior dependencies
- Future consolidation flag: `--format consolidated` for single-file registries
- Security is basic for now, comprehensive hardening in backlog
- Official registry hosting decision deferred to post-v1.0
