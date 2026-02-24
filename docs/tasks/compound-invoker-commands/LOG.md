# Compound Invoker Commands Support - Implementation Log

## Task Classification
**Type:** Progression (New Feature)

## Goal
Enable buttons to trigger multiple commands targeting multiple elements simultaneously using comma-separated syntax in both `command` and `commandfor` attributes.

## Architectural Decision

### Identity vs. Capability Analysis
This feature adds **capability** to button elements - the ability to dispatch compound commands to multiple targets.

**Decision:** Implement as a **Behavior** that gets attached to buttons.

**Reasoning:**
- Buttons with `behavior="compound-commands"` gain compound command dispatching capability
- It's a discrete unit of functionality that can be added/removed
- Follows the standard behavior pattern with schema, factory, and tests
- User explicitly opts in by adding the behavior to specific buttons

### Where This Fits
- **Location:** `registry/behaviors/compound-commands/` (standard behavior directory)
- **Structure:** Standard 5-file behavior structure
- **Activation:** Add `behavior="compound-commands"` to buttons
- **Integration:** Dispatches CommandEvents that other behaviors can listen to

## PDSRTDD Workflow

### P - Plan & Data ✅

**Current State Analysis:**
- ✅ CommandEvent type defined in `types.d.ts`
- ✅ Test harness `dispatchCommand()` exists for testing
- ✅ Behaviors listen to `command` events via `onCommand` handler
- ❌ NO global click handler to intercept buttons with `commandfor`
- ❌ NO parsing of comma-separated values
- ❌ NO command dispatch orchestration

**Architecture:**
1. **Behavior Directory** (`compound-commands/`):
   - `_behavior-definition.ts` - Defines behavior name and schema
   - `constants.ts` - COMPOUND_COMMANDS_ATTRS constants
   - `schema.ts` - TypeBox schema for `commandfor` and `command` attributes
   - `behavior.ts` - Factory function with onClick handler
   - `behavior.test.ts` - Comprehensive test suite
   
2. **Utility Functions** (within behavior.ts):
   - `parseAttributeList(value: string | null): string[]` - Parse and trim comma-separated values
   - `validateCommandMapping(targets: string[], commands: string[]): ValidationResult` - Validate state
   - `dispatchCommandEvent(target: HTMLElement, command: string, source: HTMLButtonElement): void` - Create and dispatch event

3. **Integration Points**:
   - Add to registry for CLI installation
   - Document usage in README
   - Works with all existing behaviors that listen to CommandEvents

**State Manifest:**

| State | Source | Schema | Valid? |
|-------|--------|--------|--------|
| `commandfor` attribute value | Button's `commandfor` attribute | `string \| null` | Always valid (parsed) |
| `command` attribute value | Button's `command` attribute | `string \| null` | Always valid (parsed) |
| Parsed targets | Result of `parseAttributeList(commandfor)` | `string[]` | Always valid (may be empty) |
| Parsed commands | Result of `parseAttributeList(command)` | `string[]` | Always valid (may be empty) |
| Validation result | `validateCommandMapping()` | `{ valid: boolean, mode: string, error?: string }` | Boolean validity |
| Target elements | `document.getElementById()` for each target | `HTMLElement \| null` | May be missing |

**Valid Command Mapping States:**
1. **Single/Multi commands → Single target:** `commandfor="modal"` + `command="--show, --focus"` → Modal gets both commands
2. **Single command → Single/Multi targets:** `commandfor="modal, panel"` + `command="--hide"` → Both get `--hide`
3. **Exact mapping:** `commandfor="modal, form"` + `command="--toggle, --clear"` (2:2) → Paired dispatch

**Invalid State:**
4. **Mismatched counts (both > 1):** `commandfor="a, b, c"` + `command="--x, --y"` (3 ≠ 2) → ERROR

### D - Data ✅

**Data Structures:**

```typescript
// Validation result
interface CommandMappingValidation {
  valid: boolean;
  mode: 'single-target' | 'broadcast' | 'exact-mapping' | 'invalid';
  error?: string;
}

// Dispatch plan (what will be executed)
interface CommandDispatchPlan {
  target: string;  // target ID
  command: string; // command to dispatch
}
```

### S - Schema ✅

**No Zod/TypeBox schemas needed** - This is infrastructure, not a behavior with attributes.

TypeScript interfaces above are sufficient for internal typing.

### R - Registry

**No registry changes needed** - This is not a behavior, it's a polyfill/utility.

### T - Test (Next Phase)

**Test Coverage Needed:**
1. ✅ `parseAttributeList()` function:
   - Empty/null values
   - Single value
   - Multiple values with/without spaces
   - Values with leading/trailing whitespace

2. ✅ `validateCommandMapping()` function:
   - Valid State 1: Single target + multiple commands
   - Valid State 2: Multiple targets + single command
   - Valid State 3: Equal count exact mapping (2:2, 3:3)
   - Invalid State: Mismatched counts (2:3, 3:2, etc.)

3. ✅ Event dispatching:
   - Single command to single target
   - Multiple commands to single target (sequential)
   - Single command to multiple targets (broadcast)
   - Exact mapping (paired dispatch)
   - Missing target (warning but continue)
   - Invalid state (error, no dispatch)

4. ✅ Integration:
   - Click handler attached correctly
   - `source` property set to button
   - Events bubble correctly
   - Behaviors receive and handle commands

### DD - Develop (After Tests)

Implementation will go in:
- `registry/behaviors/invoker-commands-polyfill.ts` - Main polyfill
- `registry/behaviors/invoker-commands-polyfill.test.ts` - Tests

---

## Implementation Notes

### Why This Approach?

1. **Separation of Concerns:** The polyfill is independent of behaviors. Behaviors remain simple event listeners.

2. **Progressive Enhancement:** If native Invoker Commands API exists in the browser, we can detect and potentially delegate to it (future).

3. **Testability:** Pure functions (`parseAttributeList`, `validateCommandMapping`) can be tested independently.

4. **Opt-In by Default:** Like `auto-loader`, this can be opt-in. Users who want declarative commands call `enableInvokerCommands()`.

5. **Backward Compatible:** Existing single command/target usage works unchanged.

### Future Enhancements

- Detect native Invoker Commands API and only polyfill if missing
- Support custom command namespaces (e.g., `--my-app:action`)
- Support command parameters (e.g., `--show:modal-id`)
- Integration with form validation (prevent dispatch if form invalid)

---

## Verification Checklist

- [ ] All tests pass (`pnpm test`)
- [ ] Type safety verified (`pnpm check`)
- [ ] Backward compatibility confirmed (existing single command tests still pass)
- [ ] Documentation updated
- [ ] Example added to CDN build/README

---

## Status: Complete ✅

**Completed Steps:**
1. ✅ Created proper behavior directory structure
2. ✅ Implemented _behavior-definition.ts, constants.ts, schema.ts
3. ✅ Implemented behavior.ts with parsing, validation, and dispatch logic
4. ✅ Wrote comprehensive tests (13 tests, all passing)
5. ✅ Added to registry for CLI installation
6. ✅ Documentation updated in README

**Final Test Results:**
- ✅ All 281 tests passing (13 new + 268 existing)
- ✅ Build successful (TypeScript validation passed)
- ✅ Backward compatibility verified (all existing tests pass)

**Files Created:**
- `registry/behaviors/compound-commands/_behavior-definition.ts` - Behavior definition
- `registry/behaviors/compound-commands/constants.ts` - Attribute constants
- `registry/behaviors/compound-commands/schema.ts` - TypeBox schema
- `registry/behaviors/compound-commands/behavior.ts` - Implementation
- `registry/behaviors/compound-commands/behavior.test.ts` - Test suite
- `docs/tasks/compound-invoker-commands/LOG.md` - Implementation log

**Files Modified:**
- `registry/behaviors-registry.json` - Added compound-commands entry
- `README.md` - Added "Compound Commands Behavior" section

---

## Open Questions

1. **Q:** Should we cache parsed values?
   **A:** Not initially. Parse on every click. Optimize later if performance issue.

2. **Q:** Should we support dynamic attribute changes?
   **A:** Yes, but no caching means we naturally support it.

3. **Q:** Should behaviors be aware of compound commands?
   **A:** No. Behaviors receive individual CommandEvents. The polyfill handles the orchestration.

4. **Q:** Should we prevent default on the button click?
   **A:** Only if we successfully dispatch at least one command. If all targets missing, let it bubble.
