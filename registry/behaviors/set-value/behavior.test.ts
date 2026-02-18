/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerTestComponent,
  dispatchCommand,
} from '~test-utils';
import SET_VALUE_DEFINITION from './_behavior-definition';
import { setValueBehaviorFactory } from './behavior';
import { registerBehavior } from '~registry';

describe('Set Value Behavior', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    registerBehavior(SET_VALUE_DEFINITION.name, setValueBehaviorFactory);
  });

  it('should set input value from source innerText', async () => {
    const tag = 'input';
    const webcomponentTag = 'test-set-value-input';

    registerTestComponent(
      tag,
      { tag: webcomponentTag },
      (Base) => class extends Base {},
      { 'set-value': SET_VALUE_DEFINITION },
    );

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLInputElement;
    el.setAttribute('behavior', 'set-value');
    document.body.appendChild(el);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const source = document.createElement('button');
    source.innerText = 'New Value';

    dispatchCommand(el, SET_VALUE_DEFINITION.command['--set-value'], source);

    expect(el.value).toBe('New Value');
  });

  it('should set table innerText from source innerText', async () => {
    const tag = 'table';
    const webcomponentTag = 'test-set-value-table';

    registerTestComponent(
      tag,
      { tag: webcomponentTag },
      (Base) => class extends Base {},
      { 'set-value': SET_VALUE_DEFINITION },
    );

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLTableElement;
    el.setAttribute('behavior', 'set-value');
    document.body.appendChild(el);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const source = document.createElement('button');
    source.innerText = 'Table Content';

    dispatchCommand(el, SET_VALUE_DEFINITION.command['--set-value'], source);

    expect(el.innerText).toBe('Table Content');
  });

  it('should submit form when --set-value-and-submit is used', async () => {
    const tag = 'input';
    const webcomponentTag = 'test-set-value-submit';

    registerTestComponent(
      tag,
      { tag: webcomponentTag },
      (Base) => class extends Base {},
      { 'set-value': SET_VALUE_DEFINITION },
    );

    const form = document.createElement('form');
    const requestSubmitSpy = vi.fn();
    form.requestSubmit = requestSubmitSpy;

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLInputElement;
    el.setAttribute('behavior', 'set-value');
    form.appendChild(el);
    document.body.appendChild(form);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const source = document.createElement('button');
    source.innerText = 'Submitted Value';

    dispatchCommand(
      el,
      SET_VALUE_DEFINITION.command['--set-value-and-submit'],
      source,
    );

    expect(el.value).toBe('Submitted Value');
    expect(requestSubmitSpy).toHaveBeenCalled();
  });

  it('should NOT submit form when --set-value is used', async () => {
    const tag = 'input';
    const webcomponentTag = 'test-set-value-no-submit';

    registerTestComponent(
      tag,
      { tag: webcomponentTag },
      (Base) => class extends Base {},
      { 'set-value': SET_VALUE_DEFINITION },
    );

    const form = document.createElement('form');
    const requestSubmitSpy = vi.fn();
    form.requestSubmit = requestSubmitSpy;

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLInputElement;
    el.setAttribute('behavior', 'set-value');
    form.appendChild(el);
    document.body.appendChild(form);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const source = document.createElement('button');
    source.innerText = 'Just Value';

    dispatchCommand(el, SET_VALUE_DEFINITION.command['--set-value'], source);

    expect(el.value).toBe('Just Value');
    expect(requestSubmitSpy).not.toHaveBeenCalled();
  });
});
