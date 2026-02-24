# Task: Consolidated Registry Format Support

## Goal

Add support for a consolidated registry format where all behaviors are served from a single `behaviors-registry.json` file, as an alternative to individual behavior JSON files.

## Context

**Why:** Currently, the multi-registry system fetches individual JSON files per behavior (e.g., `tooltip.json`, `reveal.json`). While this is optimal for caching and bandwidth, some use cases benefit from a consolidated format:
- Internal registries with few behaviors (easier to manage one file)
- Offline/air-gapped environments (download once, install many)
- Static hosting without dynamic routing (GitHub Pages, etc.)

**Current State:** Only individual file format is supported.

**Trade-offs:**
- ✅ **Individual:** Better caching, smaller payloads, lazy loading
- ✅ **Consolidated:** Simpler hosting, offline-friendly, fewer HTTP requests

## Requirements

### Functional

1. **Format Detection:** Auto-detect whether registry uses individual or consolidated format
2. **Generation Flag:** `behavior-fn build-registry --format consolidated` to generate single file
3. **Index Support:** Consolidated file includes an index for fast lookups
4. **Version Tracking:** Track format version for future migrations
5. **Backwards Compatible:** Individual file format remains default

### Non-Functional

1. **Performance:** Consolidated file should be lazy-parsed (don't load everything into memory)
2. **Developer Experience:** Clear documentation on when to use each format
3. **Migration:** Easy conversion between formats

## Architecture

### Consolidated Format

```json
{
  "$schema": "https://behavior-fn.dev/schema/registry.json",
  "version": "1.0.0",
  "format": "consolidated",
  "behaviors": {
    "tooltip": {
      "name": "tooltip",
      "version": "1.0.0",
      "dependencies": ["@floating-ui/dom"],
      "files": [
        {
          "path": "tooltip/_behavior-definition.ts",
          "content": "..."
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
    },
    "reveal": {
      "name": "reveal",
      "version": "1.0.0",
      "dependencies": [],
      "files": [ ... ]
    }
  }
}
```

### Registry Config

```json
{
  "registries": {
    "@individual": "https://example.com/r/{name}.json",
    "@consolidated": "https://example.com/registry.json"
  }
}
```

### CLI Commands

```bash
# Build consolidated registry from individual behaviors
behavior-fn build-registry --format consolidated --output registry.json

# Build individual files (default)
behavior-fn build-registry --format individual --output dist/

# Convert between formats
behavior-fn convert-registry consolidated.json --to individual --output dist/
behavior-fn convert-registry dist/ --to consolidated --output registry.json
```

## Implementation Phases

### Phase 1: Format Detection (1 day)

- [ ] Update `RegistryResolver` to detect format
- [ ] Add format field to registry response schema
- [ ] Implement fallback detection (try individual, then consolidated)

**Test Cases:**
- Detect individual file format
- Detect consolidated file format
- Fall back gracefully if first attempt fails

---

### Phase 2: Build Tool (1-2 days)

- [ ] Create `behavior-fn build-registry` command
- [ ] Support `--format` flag (consolidated | individual)
- [ ] Support `--output` flag
- [ ] Generate consolidated JSON from `registry/behaviors/`
- [ ] Generate individual files from consolidated JSON

**Test Cases:**
- Build consolidated from source
- Build individual files from source
- Validate output format
- Handle missing behaviors gracefully

---

### Phase 3: Conversion Tool (1 day)

- [ ] Create `behavior-fn convert-registry` command
- [ ] Support bidirectional conversion
- [ ] Preserve all metadata (versions, dependencies, etc.)
- [ ] Validate before and after conversion

**Test Cases:**
- Convert individual → consolidated
- Convert consolidated → individual
- Round-trip conversion preserves data
- Handle malformed input gracefully

---

### Phase 4: Documentation (1 day)

- [ ] Document format differences
- [ ] Add decision guide (when to use which format)
- [ ] Update registry creation guide
- [ ] Add examples for both formats

**Deliverables:**
- Clear comparison table (individual vs. consolidated)
- Recommendations based on use case
- Migration guide

---

## Decision Guide (Documentation)

### Use **Individual Files** when:
- ✅ Hosting on CDN or cloud storage
- ✅ Many behaviors (>10)
- ✅ Users install selectively (not all behaviors)
- ✅ Frequent updates to individual behaviors

### Use **Consolidated File** when:
- ✅ Small registry (<10 behaviors)
- ✅ Static hosting (GitHub Pages)
- ✅ Offline/air-gapped environments
- ✅ Users typically install all behaviors

## Success Criteria

1. ✅ Format auto-detection works for both types
2. ✅ `build-registry` generates valid consolidated files
3. ✅ `convert-registry` supports bidirectional conversion
4. ✅ Performance is acceptable for large consolidated files (>50 behaviors)
5. ✅ Documentation clearly explains trade-offs
6. ✅ Backwards compatible with existing registries

## Related Tasks

- **Blocked by:** [Multi-Registry Support](../multi-registry-support/task.md)
- **Blocks:** None
- **Related:** None

## Priority

**Low** - Nice-to-have, defer until community demand emerges.

## Estimated Effort

**3-4 days** across all phases.
