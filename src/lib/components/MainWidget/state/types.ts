// src/lib/components/MainWidget/types.ts
import { fade, fly, scale, slide } from 'svelte/transition';

export type TransitionConfig = {
	fn: typeof fade | typeof fly | typeof scale | typeof slide;
	props: Record<string, any>;
};
