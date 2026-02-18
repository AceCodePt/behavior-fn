import { registerBehavior, type BehaviorInstance } from "~registry";
import LOGGER_DEFINITION from "./_behavior-definition";

interface LoggerProps {
  "log-trigger"?: string;
}

export const loggerBehaviorFactory = (el: HTMLElement) => {
  return {
    onClick(this: BehaviorInstance<LoggerProps>, e: MouseEvent) {
      const trigger = this.props?.["log-trigger"] || "click";
      if (trigger === "click") {
        console.log(
          `[Logger] Element <${el.tagName.toLowerCase()}> clicked!`,
          e,
        );
      }
    },
    onMouseEnter(this: BehaviorInstance<LoggerProps>, e: MouseEvent) {
      const trigger = this.props?.["log-trigger"];
      if (trigger === "mouseenter") {
        console.log(
          `[Logger] Element <${el.tagName.toLowerCase()}> mouse entered!`,
          e,
        );
      }
    },
  };
};

registerBehavior(LOGGER_DEFINITION.name, loggerBehaviorFactory);
