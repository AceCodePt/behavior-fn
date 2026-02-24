# Task: Compound Invoker Commands Support

## Classification

**Type:** Progression (New Feature)

## Goal

Enable buttons to trigger multiple commands targeting multiple elements simultaneously using comma-separated syntax in both `command` and `commandfor` attributes.

## Context

Currently, the Invoker Commands API implementation supports a single command targeting a single element:

```html
<button commandfor="modal" command="--toggle">Toggle Modal</button>
```

**Problem:** Users need to trigger multiple actions with a single button click. For example:
- Toggle a modal AND clear a form
- Show a dialog AND hide another element
- Trigger multiple behaviors on different elements at once

**Example Use Cases:**
1. **Multi-action buttons:** "Save & Close" button that triggers save on a form and closes a dialog
2. **Coordinated UI:** Toggle one panel while hiding another
3. **Batch operations:** Trigger the same command on multiple elements

## Requirements

### Syntax

Support comma-separated values with strict validation rules:

```html
<!-- ✅ VALID: Single command to multiple targets (broadcast) -->
<button commandfor="modal, panel" command="--hide">
  Hide Both
</button>

<!-- ✅ VALID: Multiple commands to single target -->
<button commandfor="modal" command="--show, --focus">
  Show & Focus
</button>

<!-- ✅ VALID: Single command to single target (existing behavior) -->
<button commandfor="modal" command="--toggle">
  Toggle Modal
</button>

<!-- ❌ INVALID: Multiple commands to multiple targets -->
<button commandfor="modal, form" command="--toggle, --clear">
  <!-- This is NOT allowed -->
</button>
```

### Behavior

**Valid Patterns:**

1. **Single Target → Single Command (1→1):**
   - `commandfor="modal"` + `command="--toggle"`
   - → Standard behavior, `modal` receives `--toggle`

2. **Single Target → Multiple Commands (1→N):**
   - `commandfor="modal"` + `command="--show, --focus"`
   - → `modal` receives `--show` command, then `--focus` command (sequentially)

3. **Multiple Targets → Single Command (N→1, Broadcast):**
   - `commandfor="modal, panel"` + `command="--hide"`
   - → `modal` receives `--hide`, then `panel` receives `--hide`

**Invalid Pattern:**

4. **Multiple Targets → Multiple Commands (N→M where N>1 and M>1):**
   - `commandfor="modal, form"` + `command="--toggle, --clear"`
   - → **ERROR:** This is ambiguous and not supported
   - **Rationale:** It's unclear if this means:
     - Paired mapping (modal gets --toggle, form gets --clear)?
     - All commands to all targets (both get both commands)?
     - This creates confusion, so we reject it entirely

**Implementation Rules:**

1. **Whitespace Handling:** Trim whitespace around comma-separated values

2. **Validation:** 
   - If both `command` AND `commandfor` have multiple (>1) values, log an error and **do nothing**
   - If a target element is not found, log warning but continue processing other targets

3. **Event Sequencing:** 
   - Commands are dispatched synchronously in the order specified
   - For broadcast (N→1), iterate through targets in order
   - For multi-command (1→N), iterate through commands in order

### Technical Considerations

- **Event Sequencing:** Commands should be dispatched synchronously in order
- **Source Preservation:** All dispatched CommandEvents must reference the original trigger button as `source`
- **Backward Compatibility:** Single command/single target behavior must remain unchanged
- **Performance:** Parsing and validation should be efficient (consider caching parsed values)

## Scope

### In Scope
- Parsing comma-separated `command` and `commandfor` attributes
- Dispatching multiple CommandEvents from a single button click
- Supporting 1→1, 1→N (multi-command), and N→1 (broadcast) modes
- Validation to reject invalid N→M patterns (where N>1 and M>1)
- Error handling for edge cases (missing targets, invalid patterns)
- Tests covering all valid scenarios and invalid pattern rejection

### Out of Scope
- Polyfilling the native Invoker Commands API (if it exists)
- Changes to individual behavior implementations (they should work as-is)
- Adding new command types or modifying command semantics
- UI/UX guidance (documentation only)

## Implementation Notes

This will likely require:
1. A new utility function to parse comma-separated attribute values
2. Modification to the command event dispatcher/polyfill
3. Test coverage for the parsing logic and dispatch behavior
4. Updates to `command-test-harness.ts` to support compound commands in tests

**Architectural Questions to Resolve During Planning:**
- Where does the parsing happen? (Browser polyfill? Behavioral host? Both?)
- Should we cache parsed values or parse on every click?
- How do we handle dynamic attribute changes?
- Should behaviors be aware of compound commands, or should this be transparent?

## Dependencies

None (independent feature)

## Success Criteria

- [ ] Comma-separated `command` and `commandfor` attributes parse correctly
- [ ] Single command to single target (1→1) works (existing behavior unchanged)
- [ ] Broadcast mode (N→1) works when `commandfor` has multiple values, `command` is single
- [ ] Multi-command mode (1→N) works when `commandfor` is single, `command` has multiple values
- [ ] **Invalid pattern (N→M)** is rejected with clear error when both attributes have multiple values
- [ ] Missing target elements log warnings but don't break other dispatches
- [ ] Commands are dispatched in the correct order
- [ ] All tests pass (including tests for invalid patterns)
- [ ] Documentation updated

## Protocol Checklist

- [ ] **Plan & Data:** Define parsing logic, event dispatch flow, and state manifest
- [ ] **Schema:** Update TypeScript types if needed (CommandEvent, attributes)
- [ ] **Registry:** No registry changes expected
- [ ] **Test:** Write tests for parsing and dispatch scenarios (Red)
- [ ] **Develop:** Implement parsing and dispatch logic (Green)
- [ ] **Verify:** Run `pnpm check` and all tests
- [ ] **Review:** Present changes, wait for approval before commit

## Prohibited Patterns

- ❌ Do NOT use string concatenation for building command strings
- ❌ Do NOT modify individual behavior implementations unnecessarily
- ❌ Do NOT add new dependencies
- ❌ Do NOT break backward compatibility with existing single command usage
- ❌ Do NOT use `any` types—maintain strict type safety

## Related Files

- `registry/behaviors/command-test-harness.ts` - Test utilities
- `types.d.ts` - CommandEvent type definition
- `registry/behaviors/behavioral-host.ts` - Event delegation
- `registry/behaviors/reveal/behavior.ts` - Example command consumer
- `registry/behaviors/request/behavior.ts` - Example command consumer
