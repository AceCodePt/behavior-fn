import { uniqueBehaviorDef } from "~utils";
import { routesSchema } from "@/routes.gen";
import { z } from "zod";

const hrefSchema = routesSchema
  .or(z.templateLiteral(["http", z.enum(["", "s"]), "://", z.string()]))
  .or(z.string().startsWith("/"));

export const REQUEST_COMMANDS = {
  "--trigger": "--trigger",
  "--close-sse": "--close-sse",
} as const;

const triggerEventSchema = z.enum([
  "load",
  "click",
  "submit",
  "change",
  "input",
  "mouseenter",
  "sse",
]);

export const triggerObjectSchema = z.object({
  event: triggerEventSchema,
  "sse-message": z.string().default(""),
  "sse-close": z.string().default(""),
  from: z.string().default(""),
  delay: z.coerce.number().default(0),
  throttle: z.coerce.number().default(0),
  once: z.coerce.boolean().default(false),
  changed: z.coerce.boolean().default(false),
  consume: z.coerce.boolean().default(false),
});

// Schema definition for request behavior
const REQUEST_DEFINITION = uniqueBehaviorDef({
  name: "request",
  command: REQUEST_COMMANDS,
  observedAttributes: [
    "request-method",
    "request-url",
    "request-trigger",
    "request-target",
    "request-swap",
    "request-indicator",
    "request-confirm",
    "request-push-url",
    "request-vals",
  ],
});

export default REQUEST_DEFINITION;
