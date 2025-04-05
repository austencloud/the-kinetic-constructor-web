// src/lib/components/MainWidget/types.ts
import { fade, fly, scale, slide } from 'svelte/transition';

export type TransitionConfig = {
	fn: typeof fade | typeof fly | typeof scale | typeof slide;
	props: Record<string, any>;
};
// src/lib/components/MainWidget/state/types.ts
export type Action =
	| { type: 'OPEN_SETTINGS' }
	| { type: 'CLOSE_SETTINGS' }
	| { type: 'UPDATE_BACKGROUND'; payload: string }
	| { type: 'SET_FULLSCREEN'; payload: boolean }
	| { type: 'SET_ERROR'; payload: boolean }
	| { type: 'CHANGE_TAB'; payload: number }
	| { type: 'TAB_TRANSITION_START' }
	| { type: 'TAB_TRANSITION_COMPLETE' };

export type Dispatch = (action: Action) => void;


