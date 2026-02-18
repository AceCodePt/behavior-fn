import {
  registerBehavior,
  type BehaviorInstance,
  type CommandEvent,
} from "~registry";
import SIGN_OUT_DEFINITION from "./_behavior-definition";
import { authClient } from "@/lib/auth/client";

export const signOutBehaviorFactory = (_el: HTMLElement) => {
  return {
    onCommand(
      this: BehaviorInstance<{}>,
      e: CommandEvent<keyof typeof SIGN_OUT_DEFINITION.command>,
    ) {
      const cmd = SIGN_OUT_DEFINITION.command;

      if (e.command === cmd["--sign-out"]) {
        authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              window.location.reload();
            },
          },
        });
      }
    },
  };
};

registerBehavior(SIGN_OUT_DEFINITION.name, signOutBehaviorFactory);
