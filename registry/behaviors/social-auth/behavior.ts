import {
  registerBehavior,
  type BehaviorInstance,
  type CommandEvent,
} from "~registry";
import SOCIAL_AUTH_DEFINITION from "./_behavior-definition";
import { authClient } from "@/lib/auth/client";

interface SocialAuthProps {
  "auth-provider"?: string;
}

export const socialAuthBehaviorFactory = (_el: HTMLElement) => {
  return {
    onCommand(
      this: BehaviorInstance<SocialAuthProps>,
      e: CommandEvent<keyof typeof SOCIAL_AUTH_DEFINITION.command>,
    ) {
      const cmd = SOCIAL_AUTH_DEFINITION.command;

      if (e.command === cmd["--sign-in"]) {
        const provider = this.props?.["auth-provider"];
        if (provider) {
          authClient.signIn.social({
            provider: provider as any,
            callbackURL: window.location.origin,
          });
        }
      }
    },
  };
};

registerBehavior(SOCIAL_AUTH_DEFINITION.name, socialAuthBehaviorFactory);
