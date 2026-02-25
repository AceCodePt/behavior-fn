# Migrate JSON-Template Behavior to Option B Pattern

## Goal
Migrate `json-template` behavior to use auto-extracted ATTRS with bracket notation.

## Context
- ✅ Schema migrated to literal keys
- ✅ Definition cleaned up
- ✅ `behavior.ts` uses bracket notation
- ✅ Tests don't import constants (never did)

## Status
**Behavior Code:** ✅ Complete  
**Test File:** ✅ Complete

## Success Criteria
- [x] Schema uses literal keys
- [x] Definition uses auto-extraction
- [x] behavior.ts uses bracket notation
- [x] All 23 tests pass: `npm test -- registry/behaviors/json-template/behavior.test.ts`

## Reference
This migration is complete and serves as a working example alongside:
- `registry/behaviors/reveal/behavior.ts`
- `registry/behaviors/logger/behavior.ts`
