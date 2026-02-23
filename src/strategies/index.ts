import { ZodStrategy } from "./zod-strategy";
import { ZodMiniStrategy } from "./zod-mini-strategy";
import { ValibotStrategy } from "./valibot-strategy";
import { TypeBoxStrategy } from "./typebox-strategy";
import { ArkTypeStrategy } from "./arktype-strategy";
import type { ValidatorStrategy } from "./validator-strategy";

export const strategies: ValidatorStrategy[] = [
  new ZodStrategy(),
  new ValibotStrategy(),
  new ArkTypeStrategy(),
  new TypeBoxStrategy(),
  new ZodMiniStrategy(),
];

export function getStrategy(id: number): ValidatorStrategy | undefined {
  return strategies.find((s) => s.id === id);
}

export * from "./validator-strategy";
