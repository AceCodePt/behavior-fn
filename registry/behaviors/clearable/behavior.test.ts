/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerTestComponent,
  dispatchCommand,
} from '~test-utils';
import CLEARABLE_DEFINITION from './_behavior-definition';
import { clearableBehaviorFactory } from './behavior';
import { registerBehavior } from '~registry';

describe('Clearable Behavior', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    registerBehavior(CLEARABLE_DEFINITION.name, clearableBehaviorFactory);
  });

  it('should clear input value and dispatch events', async () => {
    const tag = 'input';
    const webcomponentTag = 'test-clearable-input';

    registerTestComponent(
      tag,
      { tag: webcomponentTag },
      (Base) => {
        return class extends Base {};
      },
      { clearable: CLEARABLE_DEFINITION },
    );

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLInputElement;
    el.setAttribute('behavior', 'clearable');
    el.value = 'some value';
    document.body.appendChild(el);

    const inputSpy = vi.fn();
    const changeSpy = vi.fn();
    el.addEventListener('input', inputSpy);
    el.addEventListener('change', changeSpy);

    await vi.waitFor(() => {
      dispatchCommand(el, CLEARABLE_DEFINITION.command['--clear']);
      expect(el.value).toBe('');
    });

    expect(inputSpy).toHaveBeenCalled();
    expect(changeSpy).toHaveBeenCalled();
  });
});
