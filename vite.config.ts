import type { PropRotDir, MotionType } from '$lib/components/Pictograph/Motion/MotionTypes';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()]
});
export const startEndLocMap: Record<
	string,
	Record<PropRotDir, Record<MotionType, [string, string]>>
> = {
	ne: {
		cw: {
			anti: ['e', 'n'],
			pro: ['n', 'e']
		},
		ccw: {
			anti: ['n', 'e'],
			pro: ['e', 'n']
		}
	},
	nw: {
		cw: {
			anti: ['n', 'w'],
			pro: ['w', 'n']
		},
		ccw: {
			anti: ['w', 'n'],
			pro: ['n', 'w']
		}
	},
	se: {
		cw: {
			anti: ['s', 'e'],
			pro: ['e', 's']
		},
		ccw: {
			anti: ['e', 's'],
			pro: ['s', 'e']
		}
	},
	sw: {
		cw: {
			anti: ['w', 's'],
			pro: ['s', 'w']
		},
		ccw: {
			anti: ['s', 'w'],
			pro: ['w', 's']
		}
	}
};
