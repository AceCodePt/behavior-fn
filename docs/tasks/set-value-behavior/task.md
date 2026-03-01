# Task: Implement Set-Value Behavior

## Goal

Add a `set-value` behavior that allows elements (typically buttons) to set the value of form input elements using the Invoker Commands API, with optional form submission.

## Context

Form inputs often need to be populated programmatically from external sources like suggestion lists, templates, or preset values. The `set-value` behavior provides a declarative way to set input values using command buttons, eliminating the need for custom JavaScript. This is particularly useful for:
- Auto-complete or suggestion systems
- Template insertion (e.g., canned responses in chat)
- Quick-fill buttons for common form values
- Copy-paste workflows with visual feedback

## Requirements

- The behavior MUST only apply to `HTMLInputElement`, `HTMLTextAreaElement`, and `HTMLSelectElement` and throw an error for other element types
- The behavior MUST support two commands:
  - `--set-value`: Set the input value from the command source's `innerText`
  - `--set-value-and-submit`: Set the value AND submit the parent form
- The behavior MUST dispatch both `input` and `change` events (bubbling) after setting the value to trigger reactive systems
- The behavior MUST follow the Behavior Definition Standard (4-file structure with schema-first approach)
- The implementation MUST use the `onCommand` event handler pattern
- The behavior MUST use `form.requestSubmit()` (not `submit()`) to allow validation

## Definition of Done

- [ ] `schema.ts` created with TypeBox schema definition
- [ ] `_behavior-definition.ts` created using `uniqueBehaviorDef` with commands defined
- [ ] `behavior.ts` implemented with set-value logic
- [ ] `behavior.test.ts` created with comprehensive tests:
  - [ ] Test that behavior only works on input/textarea/select elements
  - [ ] Test that error is thrown for non-form elements
  - [ ] Test that `--set-value` command sets value from source innerText
  - [ ] Test that `input` and `change` events are dispatched
  - [ ] Test that `--set-value-and-submit` sets value and submits form
  - [ ] Test that form submission uses `requestSubmit()` not `submit()`
  - [ ] Test behavior when element has no parent form
- [ ] Behavior documented in README.md with comprehensive example
- [ ] All tests pass (`pnpm test`)
- [ ] Type checking passes (`pnpm check`)
- [ ] **User Review**: Changes verified and commit authorized

## Notes

The provided implementation reference:
```typescript
export const setValueBehaviorFactory = (el: HTMLElement) => {
  if (
    !(el instanceof HTMLInputElement) &&
    !(el instanceof HTMLTextAreaElement) &&
    !(el instanceof HTMLSelectElement)
  ) {
    throw new Error(
      `The behavior ${SET_VALUE_DEFINITION.name} is limited to input element, text area, select`,
    );
  }
  return {
    onCommand(e: CommandEvent<string>) {
      const cmd = SET_VALUE_DEFINITION.command;

      if (
        e.command === cmd['--set-value'] ||
        e.command === cmd['--set-value-and-submit']
      ) {
        el.value = e.source.innerText;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));

        if (
          e.command === cmd['--set-value-and-submit'] &&
          'form' in el &&
          el.form
        ) {
          el.form.requestSubmit();
        }
      }
    },
  };
};
```

This behavior has no configurable attributes (no schema properties needed), but must still follow the 4-file structure for consistency. The commands are the primary interface.
