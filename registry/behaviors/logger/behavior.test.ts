/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerTestComponent } from '~test-utils';
import LOGGER_DEFINITION from './_behavior-definition';
import { loggerBehaviorFactory } from './behavior';
import { registerBehavior } from '~registry';

describe('Logger Behavior', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    registerBehavior(LOGGER_DEFINITION.name, loggerBehaviorFactory);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should log on click by default', async () => {
    const tag = 'button';
    const webcomponentTag = 'test-logger-btn-1';

    registerTestComponent(
      tag,
      { tag: webcomponentTag },
      (Base) => {
        return class extends Base {};
      },
      { logger: LOGGER_DEFINITION },
    );

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLElement;
    el.setAttribute('behavior', 'logger');
    document.body.appendChild(el);

    await vi.waitFor(() => {
      el.click();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[Logger] Element <button> clicked!'),
        expect.any(Object),
      );
    });
  });

  it('should log on mouseenter when configured', async () => {
    const tag = 'div';
    const webcomponentTag = 'test-logger-div-mouseenter';

    registerTestComponent(
      tag,
      { tag: webcomponentTag },
      (Base) => {
        return class extends Base {};
      },
      { logger: LOGGER_DEFINITION },
    );

    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLElement;
    el.setAttribute('behavior', 'logger');
    el.setAttribute('log-trigger', 'mouseenter');
    document.body.appendChild(el);

    await vi.waitFor(() => {
      el.dispatchEvent(new MouseEvent('mouseenter'));
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[Logger] Element <div> mouse entered!'),
        expect.any(Object),
      );
    });
  });
});
