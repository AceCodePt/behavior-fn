/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import {
  registerTestComponent,
  dispatchCommand,
} from '~test-utils';
import SIGN_OUT_DEFINITION from './_behavior-definition';
import './behavior';
import { authClient } from '@/lib/auth/client';

vi.mock('@/lib/auth/client', () => ({
  authClient: {
    signOut: vi.fn(),
  },
}));

describe('Sign Out Behavior', () => {
  const tag = 'button';
  const webcomponentTag = 'test-sign-out-button';

  beforeAll(() => {
    registerTestComponent(
      tag,
      { tag: webcomponentTag },
      (Base) => class extends Base {},
      { 'sign-out': SIGN_OUT_DEFINITION },
    );
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('should call authClient.signOut when --sign-out command is dispatched', async () => {
    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLElement;
    el.setAttribute('behavior', 'sign-out');
    document.body.appendChild(el);

    await vi.waitFor(() => {
      dispatchCommand(el, SIGN_OUT_DEFINITION.command['--sign-out']);
      if (vi.mocked(authClient.signOut).mock.calls.length === 0) {
        throw new Error('Not called yet');
      }
    });

    expect(authClient.signOut).toHaveBeenCalled();
  });
});
