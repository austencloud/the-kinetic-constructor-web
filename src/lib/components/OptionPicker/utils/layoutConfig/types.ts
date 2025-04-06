// src/lib/components/OptionPicker/utils/layoutConfig/types.ts

export type DeviceType = 'smallMobile' | 'mobile' | 'tablet' | 'desktop' | 'largeDesktop';
export type LayoutCategory = 'singleItem' | 'twoItems' | 'fewItems' | 'mediumItems' | 'manyItems';
export type ContainerAspect = 'tall' | 'square' | 'wide';

export interface DeviceConfiguration {
	padding: {
		horizontal: number;
		vertical: number;
	};
	gap: {
		base: number;
		dynamic: (itemCount: number) => number;
	};
	item: {
		minSize: number;
		maxSize: number;
		preferredSizeFactor: (containerWidth: number, itemCount: number) => number;
	};
	scaleFactor: number;
}

export interface GridConfiguration {
	columns: number;
	rows: number;
	template: string;
}

export interface ResponsiveLayoutConfig {
	gridColumns: string;
	optionSize: string;
	gridGap: string;
	gridClass: string;
	aspectClass: string;
	scaleFactor: number;
}
