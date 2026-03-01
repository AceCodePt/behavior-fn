# Task: Implement Auto-Grow Behavior

## Goal

Add an `auto-grow` behavior that automatically adjusts the height of textarea elements to fit their content as the user types.

## Context

Textareas with fixed heights often force users to scroll within a small box to view or edit longer content. An auto-grow behavior provides a better user experience by dynamically resizing the textarea to show all content without internal scrolling. This is a common UX pattern for modern web applications (e.g., comment boxes, messaging interfaces, note-taking apps).

## Requirements

- The behavior MUST only apply to `<textarea>` elements and warn when attached to other element types
- The textarea MUST automatically expand its height to fit content when the user types
- The behavior MUST prevent internal scrolling by setting `overflow-y: hidden`
- The behavior MUST disable manual resize handles by setting `resize: none`
- The behavior MUST follow the Behavior Definition Standard (4-file structure with schema-first approach)
- The implementation MUST use the `onInput` event handler pattern
- The behavior MUST handle the `connectedCallback` lifecycle for initial setup

## Definition of Done

- [ ] `schema.ts` created with TypeBox schema definition
- [ ] `_behavior-definition.ts` created using `uniqueBehaviorDef`
- [ ] `behavior.ts` implemented with auto-grow logic
- [ ] `behavior.test.ts` created with comprehensive tests:
  - [ ] Test that behavior only works on textarea elements
  - [ ] Test that console warning is shown for non-textarea elements
  - [ ] Test that textarea height auto-adjusts on input
  - [ ] Test that overflow-y is set to hidden
  - [ ] Test that resize is set to none
- [ ] Behavior registered in `registry/behaviors-registry.json`
- [ ] All tests pass (`pnpm test`)
- [ ] Type checking passes (`pnpm check`)
- [ ] **User Review**: Changes verified and commit authorized

## Notes

The provided implementation reference:
```typescript
export const autoGrowBehaviorFactory = (el: HTMLElement) => {
  if (!(el instanceof HTMLTextAreaElement)) {
    console.warn(
      `[AutoGrow] Behavior attached to non-textarea element: <${el.tagName.toLowerCase()}>`,
    );
    return {};
  }

  return {
    connectedCallback() {
      el.style.overflowY = 'hidden';
      el.style.resize = 'none';
    },
    onInput() {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    },
  };
};
```

This behavior has no configurable attributes (no schema properties needed), but must still follow the 4-file structure for consistency.
