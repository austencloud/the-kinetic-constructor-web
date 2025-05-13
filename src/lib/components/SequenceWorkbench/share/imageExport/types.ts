// src/lib/components/SequenceWorkbench/share/imageExport/types.ts

import type { BeatData } from '$lib/components/SequenceWorkbench/BeatFrame/BeatData';

/**
 * Options for rendering a sequence to an image
 */
export interface SequenceRenderOptions {
	// Core data
	beats: BeatData[];
	startPosition?: any | null;
	
	// Layout settings
	rows?: number;
	cols?: number;
	padding?: number;
	
	// Output settings
	backgroundColor?: string;
	quality?: number; // 0-1 for JPEG quality
	format?: 'png' | 'jpeg';
	maxWidth?: number;
	maxHeight?: number;
	
	// Content flags
	includeStartPosition?: boolean;
	addUserInfo?: boolean;
	addWord?: boolean;
	addDifficultyLevel?: boolean;
	addBeatNumbers?: boolean;
	addReversalSymbols?: boolean;
	combinedGrids?: boolean;
	
	// Content values
	title?: string;
	userName?: string;
	notes?: string;
	exportDate?: string;
	difficultyLevel?: number;
	
	// Scale factor from UI
	scale?: number;
}

/**
 * Result of rendering a sequence to an image
 */
export interface SequenceRenderResult {
	dataUrl: string;
	width: number;
	height: number;
	aspectRatio: number;
}

/**
 * Canvas dimensions information
 */
export interface CanvasDimensions {
	width: number;
	height: number;
	topMargin: number;
	bottomMargin: number;
	beatSize: number;
}

/**
 * Element rendering context
 */
export interface RenderContext {
	element: HTMLElement;
	canvas?: HTMLCanvasElement;
	ctx?: CanvasRenderingContext2D;
	dimensions?: CanvasDimensions;
}