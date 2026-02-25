# Task: Add Array Swap Strategies to Request Behavior

## Goal

Extend the `request` behavior to support accumulating data in JSON array script tags by adding new swap strategies that push or spread items into arrays.

## Context

Currently, the `request` behavior has limited JSON strategy support:
- `replace` - replaces entire JSON content
- `appendArray` - spreads response array into existing array (requires both to be arrays)
- `prependArray` - spreads response array before existing array (requires both to be arrays)

**The Problem:**
When building reactive UIs like chat interfaces, notifications, or activity feeds, we need to:
1. Append individual objects (not arrays) to an array
2. Support both append (add to end) and prepend (add to start)
3. Support both single items and spreading arrays

**Use Cases:**
- Chat applications: Append each message object to messages array
- Notifications: Prepend new notification to feed
- Infinite scroll: Append array of items for pagination
- Real-time feeds: Prepend array of new posts

## Requirements

- Add four new swap strategies that work when target is `<script type="application/json">` containing an array:
  - `appendToArray` - Push response (object or value) to end of array
  - `appendSpreadToArray` - Spread response array items to end of existing array
  - `prependToArray` - Push response (object or value) to start of array
  - `prependSpreadToArray` - Spread response array items to start of existing array
- These strategies should only activate when target is a JSON script tag
- Gracefully handle edge cases (empty arrays, non-array existing data, invalid JSON)
- Update schema to include new swap strategy literals
- Maintain backward compatibility with existing swap strategies

## Definition of Done

- [ ] `appendToArray` strategy implemented and pushes response to end of array
- [ ] `appendSpreadToArray` strategy implemented and spreads array to end
- [ ] `prependToArray` strategy implemented and pushes response to start of array
- [ ] `prependSpreadToArray` strategy implemented and spreads array to start
- [ ] Schema updated with new swap strategy literals
- [ ] Tests cover all four strategies with various data types (objects, primitives, arrays)
- [ ] Tests cover edge cases (empty arrays, non-array data, invalid JSON)
- [ ] All existing tests still pass (backward compatibility verified)
- [ ] Documentation updated (already done in `JSON-TEMPLATE-PATTERNS.md`)
- [ ] **User Review**: Changes verified and commit authorized
