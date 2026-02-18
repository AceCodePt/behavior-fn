import { uniqueBehaviorDef } from "~utils";

const SIGN_OUT_DEFINITION = uniqueBehaviorDef({
  name: "sign-out",
  command: {
    "--sign-out": "--sign-out",
  },
});

export default SIGN_OUT_DEFINITION;
