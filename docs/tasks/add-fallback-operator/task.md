# Task: Add Fallback Operator to JSON-Template Behavior

## Goal

Add support for fallback values in curly brace interpolation using the `||` operator, enabling conditional rendering with default values.

## Context

Currently, the `json-template` behavior interpolates values using `{path}` syntax. When a path doesn't exist or is `null`/`undefined`, it returns an empty string.

**The Problem:**
When building reactive forms and UIs, we often need default values:
- Session tokens that default to `"-"` for new sessions
- User names that default to `"Guest"`
- Counts that default to `0`
- Any conditional value where we want a meaningful fallback

**Current Behavior:**
```html
{session.name}  → "" (empty string if session doesn't exist)
```

**Desired Behavior:**
```html
{session.name || "-"}     → "-" (if session doesn't exist)
{user.name || "Guest"}    → "Guest" (if user.name is undefined)
{count || 0}              → "0" (if count is undefined)
{items[0].title || "Untitled"}  → "Untitled" (if no items or no title)
```

**Use Cases:**
- Chat forms: `<input name="session" value="{[0].session.name || -}">`
- User greetings: `<p>Hello, {user.name || "Guest"}!</p>`
- Default values: `<span>Count: {items.length || 0}</span>`
- Conditional text: `<p>{status || "Unknown"}</p>`

## Requirements

- Extend `interpolateString` function to parse and handle `||` operator
- Support string fallbacks with and without quotes: `{path || "default"}` or `{path || default}`
- Support numeric fallbacks: `{path || 0}`
- Support fallbacks for nested paths: `{user.profile.name || "Anonymous"}`
- Support fallbacks for array access: `{items[0].title || "No title"}`
- Maintain backward compatibility (expressions without `||` work as before)
- Gracefully handle malformed expressions

## Definition of Done

- [ ] Fallback operator parsing implemented in `interpolateString` function
- [ ] String fallbacks work (with and without quotes)
- [ ] Numeric fallbacks work
- [ ] Nested path fallbacks work
- [ ] Array access fallbacks work
- [ ] Tests cover all fallback scenarios
- [ ] Tests verify fallback only applies when value is `undefined`, `null`, or empty string
- [ ] Tests verify fallback doesn't apply when value is `0`, `false`, or other falsy but valid values
- [ ] All existing tests still pass (backward compatibility verified)
- [ ] Documentation updated (already done in `JSON-TEMPLATE-PATTERNS.md`)
- [ ] **User Review**: Changes verified and commit authorized
