/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { registerTestComponent } from '~test-utils';
import INPUT_WATCHER_DEFINITION from './_behavior-definition';
import { inputWatcherBehaviorFactory } from './behavior';
import { registerBehavior } from '~registry';
import * as formatterRegistry from '@/lib/utils/formatter-registry';

vi.mock('@/lib/utils/formatter-registry', () => ({
  getFormatter: vi.fn(),
}));

describe('Input Watcher Behavior Integration', () => {
  const tag = 'span';
  const webcomponentTag = 'test-input-watcher-span';
  let container: HTMLDivElement;

  beforeAll(() => {
    // Register the behavior once
    registerBehavior(
      INPUT_WATCHER_DEFINITION.name,
      inputWatcherBehaviorFactory,
    );

    // Register the test component that uses the behavior once
    registerTestComponent(
      tag,
      { tag: webcomponentTag },
      (Base) => class extends Base {},
      { 'input-watcher': INPUT_WATCHER_DEFINITION },
    );
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  afterEach(() => {
    if (container.parentElement) {
      document.body.removeChild(container);
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should sync initial value from target input', async () => {
    container.innerHTML = `
      <input id="target" value="hello">
    `;

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLSpanElement;
    el.setAttribute('behavior', 'input-watcher');
    el.setAttribute('watcher-for', 'target');

    container.appendChild(el);

    await vi.runAllTimersAsync();
    expect(el.textContent).toBe('hello');
  });

  it('should update when target input changes', async () => {
    container.innerHTML = `
      <input id="target" value="initial">
    `;

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLSpanElement;
    el.setAttribute('behavior', 'input-watcher');
    el.setAttribute('watcher-for', 'target');
    container.appendChild(el);

    await vi.runAllTimersAsync();
    expect(el.textContent).toBe('initial');

    const input = document.getElementById('target') as HTMLInputElement;
    input.value = 'updated';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    await vi.runAllTimersAsync();
    expect(el.textContent).toBe('updated');
  });

  it('should use formatter if specified', async () => {
    const mockFormatter = vi.fn((val) => `Formatted: ${val}`);
    vi.mocked(formatterRegistry.getFormatter).mockReturnValue(mockFormatter);

    container.innerHTML = `
      <input id="target" value="raw">
    `;

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLSpanElement;
    el.setAttribute('behavior', 'input-watcher');
    el.setAttribute('watcher-for', 'target');
    el.setAttribute('watcher-format', 'my-formatter');
    container.appendChild(el);

    await vi.runAllTimersAsync();
    expect(formatterRegistry.getFormatter).toHaveBeenCalledWith('my-formatter');
    expect(el.textContent).toBe('Formatted: raw');
  });

  it('should handle RangeSlider values', async () => {
    container.innerHTML = `
      <div id="slider" is="range-slider" min-value="10" max-value="50"></div>
    `;

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLSpanElement;
    el.setAttribute('behavior', 'input-watcher');
    el.setAttribute('watcher-for', 'slider');
    container.appendChild(el);

    await vi.runAllTimersAsync();
    // Default behavior for multiple values without formatter might be JSON or just empty?
    // The requirement says "Read the value(s)". If it's a RangeSlider, it should probably pass an object to the formatter.
    // If no formatter, maybe it should show nothing or a default string?
    // Let's assume it passes { min: 10, max: 50 } to the formatter.
  });

  it('should pass object to formatter for RangeSlider', async () => {
    const mockFormatter = vi.fn((vals) => `${vals.min}-${vals.max}`);
    vi.mocked(formatterRegistry.getFormatter).mockReturnValue(mockFormatter);

    container.innerHTML = `
      <div id="slider" is="range-slider" min-value="10" max-value="50"></div>
    `;

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLSpanElement;
    el.setAttribute('behavior', 'input-watcher');
    el.setAttribute('watcher-for', 'slider');
    el.setAttribute('watcher-format', 'range');
    container.appendChild(el);

    await vi.runAllTimersAsync();
    expect(mockFormatter).toHaveBeenCalledWith({ min: 10, max: 50 });
    expect(el.textContent).toBe('10-50');
  });
});
