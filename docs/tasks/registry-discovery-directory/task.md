# Task: Registry Discovery and Directory

## Goal

Create a public directory of community registries where users can discover, search, and browse third-party behavior registries.

## Context

**Why:** With multi-registry support, the ecosystem can grow beyond the official registry. However, users need a way to:
- Discover community registries
- Browse available behaviors across registries
- Evaluate registry quality and trustworthiness
- Submit their own registries

**Inspiration:** npm registry, shadcn/ui directory, awesome lists.

**Current State:** No discovery mechanism exists.

## Requirements

### Functional

1. **Registry Index:** Public JSON file listing known registries
2. **Search Interface:** Web UI to search/browse registries
3. **Submission System:** Allow community to submit new registries
4. **Quality Metrics:** Display stats (behavior count, last updated, downloads, etc.)
5. **Categories/Tags:** Organize registries by domain (forms, animations, accessibility, etc.)

### Non-Functional

1. **Performance:** Fast search, lazy loading for large lists
2. **Moderation:** Review process for new submissions
3. **Trust Signals:** Verified badges, maintainer info, GitHub stars
4. **Accessibility:** WCAG 2.1 AA compliant

## Architecture

### Registry Index Format

```json
{
  "$schema": "https://behavior-fn.dev/schema/registry-index.json",
  "version": "1.0.0",
  "registries": [
    {
      "namespace": "@official",
      "name": "BehaviorFN Official Registry",
      "description": "Core behaviors maintained by the BehaviorFN team",
      "url": "https://behavior-fn.dev/r/{name}.json",
      "homepage": "https://behavior-fn.dev",
      "maintainer": {
        "name": "BehaviorFN Team",
        "email": "team@behavior-fn.dev",
        "github": "behavior-fn"
      },
      "verified": true,
      "tags": ["official", "core"],
      "stats": {
        "behaviorCount": 25,
        "lastUpdated": "2026-02-24T00:00:00Z",
        "githubStars": 1200
      }
    },
    {
      "namespace": "@acme",
      "name": "Acme UI Behaviors",
      "description": "Enterprise UI behaviors for forms and data visualization",
      "url": "https://acme.com/r/{name}.json",
      "homepage": "https://acme.com/behaviors",
      "maintainer": {
        "name": "Acme Corp",
        "github": "acme-corp"
      },
      "verified": false,
      "tags": ["forms", "data-viz", "enterprise"],
      "stats": {
        "behaviorCount": 12,
        "lastUpdated": "2026-02-20T00:00:00Z",
        "githubStars": 340
      }
    }
  ]
}
```

### Web UI Components

```
/
├── Search Bar (autocomplete, filters)
├── Registry Cards (grid/list view)
│   ├── Name, description, tags
│   ├── Stats (behaviors, stars, last updated)
│   ├── Verified badge
│   └── Quick install command
├── Filters (tags, verified, popularity)
└── Submit Registry CTA
```

### CLI Integration

```bash
# Search registries
behavior-fn registries search "forms"

# List all registries in directory
behavior-fn registries browse

# Add registry from directory
behavior-fn registries add @acme  # Auto-resolves URL from directory
```

## Implementation Phases

### Phase 1: Registry Index (1-2 days)

- [ ] Define `registry-index.json` schema
- [ ] Create initial index with official registry
- [ ] Host index at `https://behavior-fn.dev/registry-index.json`
- [ ] Add CLI command to fetch and cache index

**Test Cases:**
- Schema validates correctly
- CLI fetches and parses index
- Cache invalidation works

---

### Phase 2: Search & Browse CLI (1 day)

- [ ] `behavior-fn registries browse` - list all
- [ ] `behavior-fn registries search <query>` - filter by tags/name
- [ ] `behavior-fn registries add @namespace` - auto-resolve URL

**Test Cases:**
- Search returns relevant results
- Browse displays all registries
- Auto-resolve finds correct URL

---

### Phase 3: Web Directory (3-4 days)

- [ ] Next.js/React app for directory
- [ ] Search and filter UI
- [ ] Registry detail pages
- [ ] Responsive design
- [ ] Deploy to Vercel/Cloudflare

**Test Cases:**
- Search autocomplete works
- Filters apply correctly
- Accessibility standards met
- Mobile-friendly

---

### Phase 4: Submission System (2-3 days)

- [ ] GitHub-based submission workflow (PRs)
- [ ] Validation checks (schema, reachability, etc.)
- [ ] Automated testing in CI
- [ ] Review checklist for maintainers
- [ ] Auto-update stats (cron job)

**Test Cases:**
- PR template validates correctly
- CI checks pass for valid submissions
- Stats update automatically

---

## Submission Workflow

1. **Community Member:** Opens PR to `behavior-fn/registry-index`
2. **CI:** Validates schema, checks URL reachability, runs tests
3. **Maintainer:** Reviews registry quality, checks for malicious content
4. **Merge:** Registry added to index, auto-deployed to website

## Quality Criteria

For a registry to be **verified**:
- ✅ Open source (public GitHub repo)
- ✅ At least 5 behaviors
- ✅ All behaviors have tests
- ✅ Documentation exists
- ✅ Active maintenance (updated in last 3 months)
- ✅ No known security issues

## Success Criteria

1. ✅ Registry index is live and accessible
2. ✅ Web directory is deployed and functional
3. ✅ CLI commands for search/browse work
4. ✅ Submission workflow is documented
5. ✅ At least 3 community registries listed
6. ✅ Verified badge system is operational

## Related Tasks

- **Blocked by:** [Multi-Registry Support](../multi-registry-support/task.md)
- **Blocks:** None
- **Related:** [Security Hardening for Multi-Registry](../security-hardening-registries/task.md)

## Priority

**Low** - Defer until multi-registry system is stable and community adoption grows.

## Estimated Effort

**7-10 days** across all phases.

## Future Enhancements

- **Analytics:** Track registry usage, popular behaviors
- **Ratings/Reviews:** Community feedback on registries
- **Monetization:** Allow paid/premium registries
- **API:** Public API for programmatic access to directory
