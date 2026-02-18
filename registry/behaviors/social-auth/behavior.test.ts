/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import {
  registerTestComponent,
  dispatchCommand,
} from '~test-utils';
import SOCIAL_AUTH_DEFINITION from './_behavior-definition';
import './behavior';
import { authClient } from '@/lib/auth/client';

vi.mock('@/lib/auth/client', () => ({
  authClient: {
    signIn: {
      social: vi.fn(),
    },
  },
}));

describe('Social Auth Behavior', () => {
  const tag = 'button';
  const webcomponentTag = 'test-social-auth-button';

  beforeAll(() => {
    registerTestComponent(
      tag,
      { tag: webcomponentTag },
      (Base) => class extends Base {},
      { 'social-auth': SOCIAL_AUTH_DEFINITION },
    );
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('should call authClient.signIn.social when --sign-in command is dispatched', async () => {
    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLElement;
    el.setAttribute('behavior', 'social-auth');
    el.setAttribute('auth-provider', 'google');
    document.body.appendChild(el);

    // Wait for behavior to initialize (it's async)
    await vi.waitFor(() => {
      dispatchCommand(el, SOCIAL_AUTH_DEFINITION.command['--sign-in']);
      if (vi.mocked(authClient.signIn.social).mock.calls.length === 0) {
        throw new Error('Not called yet');
      }
    });

    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: window.location.origin,
    });
  });

  it('should call authClient.signIn.social with apple provider', async () => {
    const el = document.createElement(tag, {
      is: webcomponentTag,
    }) as HTMLElement;
    el.setAttribute('behavior', 'social-auth');
    el.setAttribute('auth-provider', 'apple');
    document.body.appendChild(el);

    await vi.waitFor(() => {
      dispatchCommand(el, SOCIAL_AUTH_DEFINITION.command['--sign-in']);
      if (vi.mocked(authClient.signIn.social).mock.calls.length === 0) {
        throw new Error('Not called yet');
      }
    });

    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: 'apple',
      callbackURL: window.location.origin,
    });
  });
});
