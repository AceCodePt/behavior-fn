# Task: Add Fallback Operator to JSON-Template Behavior

## Goal

Enhance the JSON-template behavior to support fallback/default values when interpolating paths that resolve to `undefined` or `null`. This allows templates to gracefully handle missing data with user-specified defaults instead of rendering empty strings.

## Context

Currently, the JSON-template behavior interpolates `{path}` expressions by resolving paths in the data object. When a path doesn't exist or resolves to `null`/`undefined`, it renders an empty string. This behavior is acceptable for some use cases, but many real-world scenarios require fallback values for better UX (e.g., showing "Guest" when username is missing, or "N/A" for unavailable data).

Common templating systems (Handlebars, Vue, etc.) support fallback operators like `||` or `??` to provide default values. Adding this capability to our JSON-template behavior would make it more robust and user-friendly without breaking existing functionality.

## Requirements

- Support a fallback operator syntax within `{path}` interpolations (e.g., `{user.name || "Guest"}` or `{price ?? "N/A"}`)
- Preserve backward compatibility: existing templates without fallback operators should continue to work unchanged (empty string for undefined/null)
- Handle three operators with their standard JavaScript semantics:
  - `||`: Returns fallback if value is falsy (undefined, null, false, 0, "", NaN)
  - `??`: Returns fallback only if value is nullish (undefined or null)
  - `&&`: Returns fallback if value is truthy (the inverse of `||`)
- Support literal string fallbacks with proper quote handling (single or double quotes)
- Support numeric and boolean literal fallbacks
- Fallback values should be literals only (not nested path resolution) for initial implementation
- Work correctly in both text content and attribute interpolations
- Work correctly in both root-level templates and nested array templates

## Definition of Done

- [ ] Fallback operator parsing implemented in interpolation logic
- [ ] All three operators (`||`, `??`, `&&`) supported with correct semantics
- [ ] String, numeric, and boolean literal fallbacks supported
- [ ] Quote handling (single/double) works correctly for string literals
- [ ] Backward compatibility verified: templates without fallbacks unchanged
- [ ] Tests cover:
  - [ ] Text content interpolation with fallbacks
  - [ ] Attribute interpolation with fallbacks
  - [ ] Both `||` and `??` operators
  - [ ] All literal types (string, number, boolean)
  - [ ] Nested object paths with fallbacks
  - [ ] Array templates with fallbacks
  - [ ] Edge cases (empty strings, 0, false vs undefined/null)
- [ ] All existing tests continue to pass
- [ ] Documentation updated with fallback operator examples
- [ ] **User Review**: Changes verified and commit authorized

> **Note:** Do not include implementation details, code snippets, or technical designs here. The detailed execution plan belongs in the `LOG.md` file created during the **Plan** phase of the PDSRTDD workflow.
