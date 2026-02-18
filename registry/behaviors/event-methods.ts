export interface EventInterceptors<C extends string> {
  // --- Custom ---
  onCommand?(e: Event & { source: HTMLButtonElement; command: C }): void;

  // --- Mouse ---
  onClick?(e: MouseEvent): void;
  onDblClick?(e: MouseEvent): void; // Maps to 'dblclick' via exception
  onContextMenu?(e: MouseEvent): void;
  onMouseDown?(e: MouseEvent): void;
  onMouseUp?(e: MouseEvent): void;
  onMouseEnter?(e: MouseEvent): void;
  onMouseLeave?(e: MouseEvent): void;
  onMouseMove?(e: MouseEvent): void;
  onMouseOver?(e: MouseEvent): void;
  onMouseOut?(e: MouseEvent): void;

  // --- Keyboard ---
  onKeyDown?(e: KeyboardEvent): void;
  onKeyUp?(e: KeyboardEvent): void;
  onKeyPress?(e: KeyboardEvent): void;

  // --- Form / Focus ---
  onFocus?(e: FocusEvent): void;
  onBlur?(e: FocusEvent): void;
  onSubmit?(e: SubmitEvent): void;
  onReset?(e: Event): void;
  onInput?(e: Event): void;
  onChange?(e: Event): void;
  onInvalid?(e: Event): void;

  // --- Drag & Drop ---
  onDrag?(e: DragEvent): void;
  onDragEnd?(e: DragEvent): void;
  onDragEnter?(e: DragEvent): void;
  onDragLeave?(e: DragEvent): void;
  onDragOver?(e: DragEvent): void;
  onDragStart?(e: DragEvent): void;
  onDrop?(e: DragEvent): void;

  // --- Clipboard ---
  onCopy?(e: ClipboardEvent): void;
  onCut?(e: ClipboardEvent): void;
  onPaste?(e: ClipboardEvent): void;

  // --- UI / Touch / Wheel / Pointer ---
  onScroll?(e: Event): void;
  onWheel?(e: WheelEvent): void;
  onResize?(e: UIEvent): void;
  onTouchStart?(e: TouchEvent): void;
  onTouchEnd?(e: TouchEvent): void;
  onTouchMove?(e: TouchEvent): void;
  onTouchCancel?(e: TouchEvent): void;
  onPointerDown?(e: PointerEvent): void;
  onPointerUp?(e: PointerEvent): void;
  onPointerMove?(e: PointerEvent): void;
  onPointerCancel?(e: PointerEvent): void;
  onPointerEnter?(e: PointerEvent): void;
  onPointerLeave?(e: PointerEvent): void;
  onPointerOver?(e: PointerEvent): void;
  onPointerOut?(e: PointerEvent): void;

  // --- Media ---
  onLoad?(e: Event): void;
  onError?(e: Event): void;
}

export interface StrictEventMethods<
  C extends string,
  N extends string,
> extends EventInterceptors<C> {
  attributeChangedCallback?(
    name: N,
    oldValue: string | null,
    newValue: string | null,
  ): void;
}
