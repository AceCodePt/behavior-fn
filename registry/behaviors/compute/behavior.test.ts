/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { registerTestComponent } from '~test-utils';
import COMPUTE_DEFINITION from './_behavior-definition';
import { MathParser, computeBehaviorFactory } from './behavior';
import { registerBehavior } from '~registry';

describe('MathParser', () => {
  it('should parse and evaluate simple addition', () => {
    const parser = new MathParser('1 + 2');
    expect(parser.evaluate({})).toBe(3);
  });

  it('should parse and evaluate simple subtraction', () => {
    const parser = new MathParser('5 - 2');
    expect(parser.evaluate({})).toBe(3);
  });

  it('should parse and evaluate simple multiplication', () => {
    const parser = new MathParser('3 * 4');
    expect(parser.evaluate({})).toBe(12);
  });

  it('should parse and evaluate simple division', () => {
    const parser = new MathParser('10 / 2');
    expect(parser.evaluate({})).toBe(5);
  });

  it('should handle operator precedence', () => {
    const parser = new MathParser('1 + 2 * 3');
    expect(parser.evaluate({})).toBe(7);
  });

  it('should handle parentheses', () => {
    const parser = new MathParser('(1 + 2) * 3');
    expect(parser.evaluate({})).toBe(9);
  });

  it('should handle decimals', () => {
    const parser = new MathParser('1.5 + 2.5');
    expect(parser.evaluate({})).toBe(4);
  });

  it('should handle variables', () => {
    const parser = new MathParser('#a + #b');
    expect(parser.evaluate({ a: 10, b: 20 })).toBe(30);
  });

  it('should throw on division by zero', () => {
    const parser = new MathParser('10 / 0');
    expect(() => parser.evaluate({})).toThrow('Division by zero');
  });

  it('should throw on mismatched parentheses', () => {
    expect(() => new MathParser('(1 + 2')).toThrow('Mismatched parentheses');
  });

  it('should throw on invalid expression', () => {
    const parser = new MathParser('1 +');
    expect(() => parser.evaluate({})).toThrow('Invalid expression');
  });
});

describe('Compute Behavior Integration', () => {
  const tag = 'output';
  const webcomponentTag = 'test-compute-output';
  let container: HTMLDivElement;

  beforeAll(() => {
    // Register the behavior once
    registerBehavior(COMPUTE_DEFINITION.name, computeBehaviorFactory);

    // Register the test component that uses the behavior once
    registerTestComponent(
      tag,
      { tag: webcomponentTag },
      (Base) => class extends Base {},
      { compute: COMPUTE_DEFINITION },
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

  it('should calculate initial value based on formula', async () => {
    container.innerHTML = `
      <input id="price" value="10">
      <input id="qty" value="2">
    `;

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLOutputElement;
    el.setAttribute('behavior', 'compute');
    el.setAttribute('formula', '#price * #qty');

    // Append to container to trigger connectedCallback
    container.appendChild(el);

    // Wait for microtasks (behavior initialization)
    await vi.runAllTimersAsync();
    expect(el.textContent).toBe('20');
  });

  it('should update when dependencies change', async () => {
    container.innerHTML = `
      <input id="a" value="5">
      <input id="b" value="3">
    `;

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLOutputElement;
    el.setAttribute('behavior', 'compute');
    el.setAttribute('formula', '#a + #b');
    container.appendChild(el);

    await vi.runAllTimersAsync();
    expect(el.textContent).toBe('8');

    // Change input value
    const inputA = document.getElementById('a') as HTMLInputElement;
    inputA.value = '10';
    inputA.dispatchEvent(new Event('input', { bubbles: true }));

    await vi.runAllTimersAsync();
    expect(el.textContent).toBe('13');
  });

  it('should handle chained computations', async () => {
    // Input A -> Input B (computed) -> Output C (computed)
    // We need a computed input as well. Let's register a test input component.
    const inputTag = 'test-compute-input';
    registerTestComponent(
      'input',
      { tag: inputTag },
      (Base) => class extends Base {},
      { compute: COMPUTE_DEFINITION },
    );

    container.innerHTML = `
      <input id="base" value="100">
    `;

    // Computed Input (Tax = Base * 0.1)
    const taxInput = document.createElement('input', {
      is: inputTag,
    }) as HTMLInputElement;
    taxInput.id = 'tax';
    taxInput.setAttribute('behavior', 'compute');
    taxInput.setAttribute('formula', '#base * 0.1');
    container.appendChild(taxInput);

    // Computed Output (Total = Base + Tax)
    const totalOutput = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLOutputElement;
    totalOutput.id = 'total';
    totalOutput.setAttribute('behavior', 'compute');
    totalOutput.setAttribute('formula', '#base + #tax');
    container.appendChild(totalOutput);

    // Initial check
    await vi.runAllTimersAsync();
    expect(taxInput.value).toBe('10');
    expect(totalOutput.textContent).toBe('110');

    // Update Base
    const baseInput = document.getElementById('base') as HTMLInputElement;
    baseInput.value = '200';
    baseInput.dispatchEvent(new Event('input', { bubbles: true }));

    // Check updates
    await vi.runAllTimersAsync();
    expect(taxInput.value).toBe('20');
    expect(totalOutput.textContent).toBe('220');
  });

  it('should detect and prevent circular dependencies', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // A = B + 1
    // B = A + 1

    const inputTag = 'test-compute-input-circular';
    registerTestComponent(
      'input',
      { tag: inputTag },
      (Base) => class extends Base {},
      { compute: COMPUTE_DEFINITION },
    );

    const inputA = document.createElement('input', {
      is: inputTag,
    }) as HTMLInputElement;
    inputA.id = 'circ-a';
    inputA.setAttribute('behavior', 'compute');
    inputA.setAttribute('formula', '#circ-b + 1');

    const inputB = document.createElement('input', {
      is: inputTag,
    }) as HTMLInputElement;
    inputB.id = 'circ-b';
    inputB.setAttribute('behavior', 'compute');
    inputB.setAttribute('formula', '#circ-a + 1');

    container.appendChild(inputA);
    container.appendChild(inputB);

    // Trigger a change to start the loop if it didn't start automatically
    inputA.dispatchEvent(new Event('input', { bubbles: true }));

    await vi.runAllTimersAsync();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Circular dependency detected'),
    );
  });

  it('should show Error on invalid formula execution', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    container.innerHTML = `<input id="val" value="0">`;

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLOutputElement;
    el.setAttribute('behavior', 'compute');
    // Division by zero triggers error in our parser
    el.setAttribute('formula', '#val / 0');
    container.appendChild(el);

    await vi.runAllTimersAsync();
    expect(el.textContent).toBe('Error');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should treat checked checkbox as 1 and unchecked as 0', async () => {
    container.innerHTML = `
      <input type="checkbox" id="check-a" checked>
      <input type="checkbox" id="check-b">
    `;

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLOutputElement;
    el.setAttribute('behavior', 'compute');
    el.setAttribute('formula', '#check-a + #check-b');
    container.appendChild(el);

    await vi.runAllTimersAsync();
    expect(el.textContent).toBe('1');

    // Toggle
    const checkA = document.getElementById('check-a') as HTMLInputElement;
    checkA.checked = false;
    checkA.dispatchEvent(new Event('change', { bubbles: true }));

    const checkB = document.getElementById('check-b') as HTMLInputElement;
    checkB.checked = true;
    checkB.dispatchEvent(new Event('change', { bubbles: true }));

    await vi.runAllTimersAsync();
    expect(el.textContent).toBe('1'); // 0 + 1
  });

  it('should log error and return 0 when referencing a non-input element', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    container.innerHTML = `
      <div id="invalid-dep">100</div>
    `;

    const output = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLOutputElement;
    output.setAttribute('behavior', 'compute');
    output.setAttribute('formula', '#invalid-dep * 2');
    container.appendChild(output);

    await vi.runAllTimersAsync();

    expect(output.textContent).toBe('0');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid dependency #invalid-dep'),
    );
  });

  it('should work correctly with select elements', async () => {
    container.innerHTML = `
      <select id="multiplier">
        <option value="1">1x</option>
        <option value="2" selected>2x</option>
        <option value="3">3x</option>
      </select>
      <input type="number" id="base" value="10">
    `;

    const output = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLOutputElement;
    output.setAttribute('behavior', 'compute');
    output.setAttribute('formula', '#base * #multiplier');
    container.appendChild(output);

    await vi.runAllTimersAsync();
    expect(output.textContent).toBe('20'); // 10 * 2

    // Change select value
    const select = document.getElementById('multiplier') as HTMLSelectElement;
    select.value = '3';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    await vi.runAllTimersAsync();
    expect(output.textContent).toBe('30'); // 10 * 3
  });
});
