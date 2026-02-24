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

Support comma-separated values in both attributes:

```html
<!-- Multiple commands to multiple targets (1:1 mapping) -->
<button commandfor="modal, form" command="--toggle, --clear">
  Toggle & Clear
</button>

<!-- Single command to multiple targets (broadcast) -->
<button commandfor="modal, panel" command="--hide">
  Hide Both
</button>

<!-- Multiple commands to single target -->
<button commandfor="modal" command="--show, --focus">
  Show & Focus
</button>
```

### Behavior

**Valid States:**

1. **Single Target, Single/Multiple Commands:** One `commandfor` ID with one or more `command` values
   - `commandfor="modal"` + `command="--show"`
   - `commandfor="modal"` + `command="--show, --focus"`
   - → Target receives all commands sequentially

2. **Single/Multiple Targets, Single Command:** One or more `commandfor` IDs with one `command` value (broadcast)
   - `commandfor="modal"` + `command="--hide"`
   - `commandfor="modal, panel"` + `command="--hide"`
   - → All targets receive the same command

3. **Exact Index Mapping:** Multiple `commandfor` IDs with equal count of `command` values
   - `commandfor="modal, form"` + `command="--toggle, --clear"` (2 targets, 2 commands)
   - → `modal` receives `--toggle`, `form` receives `--clear`
   - **Requires exact length match**

**Invalid State:**

4. **Mismatched Counts (both > 1):** Multiple `commandfor` IDs with different count of multiple `command` values
   - `commandfor="modal, form, panel"` + `command="--toggle, --clear"` (3 ≠ 2)
   - `commandfor="modal, form"` + `command="--show, --hide, --toggle"` (2 ≠ 3)
   - → **Error:** Log error and do NOT dispatch any commands

**Additional Rules:**

5. **Whitespace Handling:** Trim whitespace around comma-separated values

6. **Missing Targets:** If a target element is not found by ID, log warning but continue processing other valid targets

### Technical Considerations

- **Event Sequencing:** Commands should be dispatched synchronously in order
- **Source Preservation:** All dispatched CommandEvents must reference the original trigger button as `source`
- **Backward Compatibility:** Single command/single target behavior must remain unchanged
- **Performance:** Parsing and validation should be efficient (consider caching parsed values)

## Scope

### In Scope
- Parsing comma-separated `command` and `commandfor` attributes
- Dispatching multiple CommandEvents from a single button click
- Supporting 1:1 mapping, broadcast, and multi-command modes
- Error handling for edge cases
- Tests covering all scenarios

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
- [ ] **Valid State 1:** Single target with single/multiple commands works
- [ ] **Valid State 2:** Single/multiple targets with single command works (broadcast)
- [ ] **Valid State 3:** Exact index mapping works when counts match (N targets, N commands)
- [ ] **Invalid State:** Mismatched counts (both > 1, different lengths) logs error and prevents dispatch
- [ ] Missing target elements log warning but don't stop other dispatches
- [ ] Existing single command/single target behavior remains unchanged
- [ ] All tests pass including edge cases
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
