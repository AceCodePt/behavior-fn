# Multi-Registry Support - Implementation Log

## Task Overview

Enable users to install behaviors from multiple registries using namespace syntax (`@namespace/behavior-name`), similar to shadcn/ui's registry system.

## Planning Session

**Date:** 2026-02-24  
**Participants:** Architect Agent, User  
**Status:** Planning Complete ✅

### Key Decisions Made

1. **Config File:** Keep `behavior.json` (not `components.json`)
2. **Registry Format:** Individual JSON files per behavior
3. **No Dependencies:** Behaviors remain isolated, no cross-behavior dependencies
4. **Security:** Basic implementation now, comprehensive hardening in backlog
5. **Backwards Compatibility:** Maintained for convenience (non-namespaced names use built-in registry)

### Architecture Consensus

- **Namespace Syntax:** `@namespace/behavior-name` (e.g., `@community/tooltip`)
- **Config Structure:** Optional `registries` field in `behavior.json`
- **URL Templates:** Support `{name}` placeholder for dynamic resolution
- **Environment Variables:** Expand `${VAR_NAME}` in headers/params
- **Advanced Config:** Support headers, params for authentication

### Deferred Features

- **Consolidated Format:** Future flag `--format consolidated` (backlog task created)
- **Registry Discovery:** Public directory (backlog task created)
- **Versioning:** `@namespace/name@1.2.3` syntax (future)
- **Official Hosting:** Decision deferred to post-v1.0

### Related Backlog Tasks Created

1. [Security Hardening for Multi-Registry](../security-hardening-registries/task.md)
2. [Consolidated Registry Format Support](../consolidated-registry-format/task.md)
3. [Registry Discovery and Directory](../registry-discovery-directory/task.md)

## Implementation Progress

### Phase 1: Core Registry Support
**Status:** Not Started  
**Estimated:** 2-3 days

- [ ] Add `registries` field to config types
- [ ] Create `RegistryResolver` class
- [ ] Implement namespace parsing
- [ ] Implement URL template resolution
- [ ] Add environment variable expansion
- [ ] Create HTTP fetcher for remote JSON
- [ ] Validate registry responses
- [ ] Update `installBehavior()` for remote sources
- [ ] Write comprehensive unit tests

### Phase 2: Registry Management CLI
**Status:** Not Started  
**Estimated:** 1-2 days

- [ ] `behavior-fn registries list`
- [ ] `behavior-fn registries add <namespace> <url>`
- [ ] `behavior-fn registries remove <namespace>`
- [ ] `behavior-fn registries info <namespace>`
- [ ] Update `behavior-fn add` for namespaces
- [ ] Improve error messages

### Phase 3: Security & Preview
**Status:** Not Started  
**Estimated:** 1-2 days

- [ ] `--dry-run` flag implementation
- [ ] Preview mode (show files without writing)
- [ ] Confirmation prompt for new registries
- [ ] Warning for third-party registries
- [ ] Create backlog security task

### Phase 4: Documentation & Tooling
**Status:** Not Started  
**Estimated:** 2 days

- [ ] Update README with examples
- [ ] Create "Creating Registries" guide
- [ ] Create registry template repository
- [ ] Document registry JSON schema
- [ ] Add authentication examples
- [ ] Migration guide

## Technical Notes

### Registry Response Schema

```typescript
interface RegistryBehaviorResponse {
  $schema: string;
  name: string;
  version: string;
  description?: string;
  dependencies?: string[];
  files: Array<{
    path: string;
    content: string;
  }>;
}
```

### Namespace Parsing Logic

```typescript
function parseNamespace(input: string): { namespace?: string; name: string } {
  const match = input.match(/^@([^/]+)\/(.+)$/);
  if (match) {
    return { namespace: `@${match[1]}`, name: match[2] };
  }
  return { name: input }; // No namespace = default registry
}
```

### Environment Variable Expansion

```typescript
function expandEnvVars(input: string): string {
  return input.replace(/\$\{([^}]+)\}/g, (_, varName) => {
    return process.env[varName] || '';
  });
}
```

## Open Questions

### Answered ✅
- ~~Should we use `behavior.json` or `components.json`?~~ → `behavior.json` (less disruptive)
- ~~Individual files or consolidated?~~ → Individual (better caching)
- ~~Support cross-behavior dependencies?~~ → No (keep behaviors isolated)
- ~~Backwards compatibility important?~~ → Nice-to-have, not critical

### Pending 🤔
1. **Default Registry Hosting:** Bundle with CLI or host online?
   - *Leaning toward:* Bundle for now, host post-v1.0
2. **Cache Strategy:** How long to cache remote responses?
   - *Proposal:* 1 hour TTL, file-based cache in `~/.behavior-fn/cache/`
3. **Offline Mode:** Support pre-downloaded registries?
   - *Proposal:* Defer to future (nice-to-have)

## Challenges & Solutions

### Challenge 1: Environment Variable Security
**Issue:** Environment variables in config could leak sensitive tokens  
**Solution:** 
- Document best practices (use `.env` files, not commit tokens)
- Add warning if `behavior.json` contains literal tokens (not `${VAR}`)

### Challenge 2: Registry Response Size
**Issue:** Large behaviors with many files could be slow to fetch  
**Solution:**
- Individual files keep payloads small
- Future: Add compression support (gzip)

### Challenge 3: Namespace Conflicts
**Issue:** What if two registries use the same namespace?  
**Solution:**
- Namespaces are locally scoped (defined in user's `behavior.json`)
- No global namespace registry (avoids central authority)

## Testing Strategy

### Unit Tests
- Namespace parsing (valid/invalid inputs)
- URL template resolution
- Environment variable expansion
- Registry response validation

### Integration Tests
- Full CLI workflow (add, list, remove)
- HTTP mocking for remote fetches
- File installation from remote sources

### Manual Testing Checklist
- [ ] Install from mock third-party registry
- [ ] Test authentication with Bearer token
- [ ] Verify `--dry-run` shows preview
- [ ] Confirm backwards compatibility (non-namespaced names)

## Next Steps

**Awaiting approval to proceed with Phase 1 implementation.**

Once approved:
1. Create feature branch/worktree
2. Begin Phase 1 implementation
3. Update this LOG with progress

---

## Change Log

### 2026-02-24 - Planning Complete
- Completed planning session with user
- Locked in key architectural decisions
- Created task document and backlog tasks
- Documented architecture and implementation phases
- Awaiting approval to begin implementation
