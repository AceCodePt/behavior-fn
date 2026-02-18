import { uniqueBehaviorDef } from "~utils";

const SOCIAL_AUTH_DEFINITION = uniqueBehaviorDef({
  name: "social-auth",
  command: {
    "--sign-in": "--sign-in",
  },
  observedAttributes: ["auth-provider"],
});

export default SOCIAL_AUTH_DEFINITION;
