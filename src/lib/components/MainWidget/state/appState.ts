// src/lib/components/MainWidget/state/appState.ts
import type { ComponentType, SvelteComponent } from 'svelte';

// Define strict types but use 'any' for component type to avoid compatibility issues
export type TabComponentType = any;

// Define background types for better type safety
export type BackgroundType = 'snowfall' | 'particles' | 'gradient' | 'waves';
export type TabId = 'construct' | 'generate' | 'browse' | 'learn' | 'write';

// Tab interface with flexible component typing
export type Tab = {
	id: TabId;
	component: TabComponentType | null;
	icon: string;
	title: string;
	splitView: boolean;
};

// Define the tabs configuration
export const tabs: ReadonlyArray<Tab> = [
	{
		id: 'construct',
		component: null, // Will be set dynamically
		icon: '⚒️',
		title: 'Construct',
		splitView: true
	},
	{
		id: 'generate',
		component: null,
		icon: '🤖',
		title: 'Generate',
		splitView: false
	},
	{
		id: 'browse',
		component: null,
		icon: '🔍',
		title: 'Browse',
		splitView: false
	},
	{
		id: 'learn',
		component: null,
		icon: '🧠',
		title: 'Learn',
		splitView: false
	},
	{
		id: 'write',
		component: null,
		icon: '✍️',
		title: 'Write',
		splitView: false
	}
] as const;
