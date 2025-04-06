// src/lib/components/OptionPicker/layoutContext.ts (New file or in config.ts)
import type { Readable } from 'svelte/store';
import type { DeviceType, ContainerAspect, ResponsiveLayoutConfig } from './config';

export const LAYOUT_CONTEXT_KEY = Symbol('layout-context');

export interface LayoutContextValue {
	deviceType: DeviceType;
	isMobile: boolean;
	isTablet: boolean; // Added tablet check
	isPortrait: boolean;
	containerWidth: number;
	containerHeight: number;
	containerAspect: ContainerAspect;
	layoutConfig: ResponsiveLayoutConfig; // The calculated layout
}

// Type helper for consuming the context
export type LayoutContext = Readable<LayoutContextValue>;
