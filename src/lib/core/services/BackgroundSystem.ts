import type {
	BackgroundSystem as OriginalBackgroundSystem,
	BackgroundType,
	QualityLevel
} from '$lib/components/Backgrounds/types/types';

export interface BackgroundSystemFactory {
	createBackgroundSystem(
		type: BackgroundType | { type: BackgroundType; initialQuality?: QualityLevel }
	): OriginalBackgroundSystem;
	createOptimalBackgroundSystem(): OriginalBackgroundSystem;
	isBackgroundSupported(type: BackgroundType): boolean;
}
