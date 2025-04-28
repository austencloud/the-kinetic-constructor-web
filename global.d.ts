// Try this format instead
declare namespace svelteHTML {
    interface HTMLAttributes {
      'on:swipemove'?: (e: CustomEvent) => void;
      'on:swipemove|stopPropagation'?: (e: CustomEvent) => void;
      'on:swipeend'?: (e: CustomEvent) => void;
      'on:swipeend|stopPropagation'?: (e: CustomEvent) => void;
    }
  }