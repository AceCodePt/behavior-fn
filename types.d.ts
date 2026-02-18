declare interface CommandEvent<T extends string = string> extends Event {
  source: HTMLButtonElement;
  command: T;
}

declare interface HTMLElementEventMap {
  command: CommandEvent;
}

declare interface HTMLElement {
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  connectedMoveCallback?(): void;
  attributeChangedCallback?(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void;
  oncommand?(this: HTMLElement, ev: CommandEvent): void;
}
