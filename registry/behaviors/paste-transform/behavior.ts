import { registerBehavior } from "~registry";
import definition from "./_behavior-definition";

const { attributes } = definition;

export const pasteTransformBehaviorFactory = (el: HTMLElement) => {
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return {};

  const input = el as HTMLInputElement | HTMLTextAreaElement;

  return {
    onPaste(event: ClipboardEvent) {
      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      const pastedText = clipboardData.getData("text");
      if (!pastedText) return;

      const patternsAttr = el.getAttribute(attributes["paste-transform-patterns"]);
      const replacesAttr = el.getAttribute(attributes["paste-transform-replaces"]);

      if (!patternsAttr || replacesAttr === null) return;

      const patterns = patternsAttr.split(",");
      const replaces = replacesAttr.split(",");

      let transformedText = pastedText;
      let changed = false;

      patterns.forEach((pattern, i) => {
        const replace = replaces[i] ?? "";
        try {
          const regex = new RegExp(pattern, "g");
          const next = transformedText.replace(regex, replace);
          if (next !== transformedText) {
            transformedText = next;
            changed = true;
          }
        } catch (e) {
          console.error(`[PasteTransform] Invalid regex: ${pattern}`);
        }
      });

      if (changed) {
        event.preventDefault();
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        input.setRangeText(transformedText, start, end, "end");
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    },
  };
};

registerBehavior(definition, pasteTransformBehaviorFactory);
