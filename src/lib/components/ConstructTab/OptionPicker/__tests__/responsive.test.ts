import { describe, it, expect } from 'vitest';
import { getResponsiveLayout } from '../utils/layoutUtils';

describe('Responsive Grid Layout', () => {
	it('should use 4 columns on mobile devices', () => {
		const layout = getResponsiveLayout(
			8, // count
			600, // height
			400, // width (mobile)
			true, // isMobile
			true // isPortrait
		);

		expect(layout.gridColumns).toBe('repeat(4, minmax(0, 1fr))');
	});

	it('should use 8 columns on desktop in landscape with wide aspect', () => {
		const layout = getResponsiveLayout(
			8, // count
			600, // height
			1400, // width (desktop wide)
			false, // isMobile
			false // isPortrait (landscape)
		);

		expect(layout.gridColumns).toBe('repeat(8, minmax(0, 1fr))');
	});

	it('should use 8 columns on desktop in landscape with square aspect', () => {
		const layout = getResponsiveLayout(
			8, // count
			800, // height
			1200, // width (desktop square landscape)
			false, // isMobile
			false // isPortrait (landscape)
		);

		expect(layout.gridColumns).toBe('repeat(8, minmax(0, 1fr))');
	});

	it('should use 4 columns on desktop in portrait with square aspect', () => {
		const layout = getResponsiveLayout(
			8, // count
			1200, // height
			800, // width (desktop square portrait)
			false, // isMobile
			true // isPortrait
		);

		expect(layout.gridColumns).toBe('repeat(4, minmax(0, 1fr))');
	});

	it('should use 6 columns on tablet in landscape', () => {
		const layout = getResponsiveLayout(
			8, // count
			600, // height
			900, // width (tablet landscape)
			false, // isMobile
			false // isPortrait (landscape)
		);

		expect(layout.gridColumns).toBe('repeat(6, minmax(0, 1fr))');
	});

	it('should use 4 columns on desktop with tall aspect', () => {
		const layout = getResponsiveLayout(
			8, // count
			1400, // height
			600, // width (desktop tall)
			false, // isMobile
			true // isPortrait
		);

		expect(layout.gridColumns).toBe('repeat(4, minmax(0, 1fr))');
	});

	it('should handle many items (17+) with 8 columns on desktop wide', () => {
		const layout = getResponsiveLayout(
			20, // count (many items)
			600, // height
			1400, // width (desktop wide)
			false, // isMobile
			false // isPortrait (landscape)
		);

		expect(layout.gridColumns).toBe('repeat(8, minmax(0, 1fr))');
	});

	it('should handle very wide desktop with +1 column bonus', () => {
		const layout = getResponsiveLayout(
			20, // count (many items)
			800, // height
			1800, // width (very wide desktop)
			false, // isMobile
			false // isPortrait (landscape)
		);

		// Should get 8 base columns + 1 bonus = 9, but capped at maxColumns: 8
		expect(layout.gridColumns).toBe('repeat(8, minmax(0, 1fr))');
	});
});
