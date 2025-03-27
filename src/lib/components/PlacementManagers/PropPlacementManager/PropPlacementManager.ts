// PropPlacementManager.ts
import { DefaultPropPositioner } from './DefaultPropPositioner';
import { BetaPropPositioner } from './BetaPropPositioner';
import type { PictographData } from '$lib/types/PictographData';
import type { PictographChecker } from '$lib/components/Pictograph/PictographChecker';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import type { PropData } from '$lib/components/objects/Prop/PropData';

export class PropPlacementManager {
	public defaultPositioner: DefaultPropPositioner;
	private betaPositioner: BetaPropPositioner;
	private checker: PictographChecker;
	public ready: Promise<void>;
	private resolveReady!: () => void;
	private rejectReady!: (reason?: any) => void;

	constructor(
		private pictographData: PictographData,
		private gridData: GridData | null,
		checker: PictographChecker
	) {
		// Validate grid data is provided
		if (!gridData) {
			console.error('❌ PropPlacementManager: No grid data provided');
			throw new Error('Grid data is required to initialize PropPlacementManager');
		}

		// Log key initialization data for debugging
		const gridMode = pictographData?.gridMode ?? 'diamond';
		this.ready = new Promise<void>((resolve, reject) => {
			this.resolveReady = resolve;
			this.rejectReady = reject;
		});

		try {
			this.defaultPositioner = new DefaultPropPositioner(gridData, gridMode);
			this.betaPositioner = new BetaPropPositioner(pictographData);
			this.checker = checker;

			// Initialization is complete
			this.resolveReady();
		} catch (error) {
			console.error('❌ PropPlacementManager: Initialization failed', error);
			this.rejectReady(error);
			throw error;
		}
	}

	public updatePropPlacement(props: PropData[]): PropData[] {
		console.log(`🔄 PropPlacementManager: Updating placement for ${props.length} props`);

		if (!props.length) {
			console.warn('⚠️ PropPlacementManager: No props provided to updatePropPlacement');
			return props;
		}

		// Log prop data BEFORE positioning
		props.forEach((prop) => {
			console.log(
				`📊 BEFORE positioning: ${prop.color} prop at (${prop.coords.x}, ${prop.coords.y})`
			);
			console.log(
				`📊 BEFORE details: loc=${prop.loc}, ori=${prop.ori}, svgCenter=(${prop.svgCenter.x}, ${prop.svgCenter.y})`
			);
		});

		// Apply default positioning
		props.forEach((prop) => {
			if (!prop.loc) {
				console.error(`❌ PropPlacementManager: Prop missing location data:`, prop.id);
				return;
			}

			this.defaultPositioner.setToDefaultPosition(prop);
			console.log(
				`📌 Default position applied for ${prop.color} prop: (${prop.coords.x}, ${prop.coords.y})`
			);
		});

		// Apply beta positioning if needed
		if (this.checker.endsWithBeta()) {
			console.log('🔄 Applying beta positioning adjustments');
			this.betaPositioner.reposition(props);
			props.forEach((prop) =>
				console.log(
					`🚀 Beta position applied for ${prop.color} prop: (${prop.coords.x}, ${prop.coords.y})`
				)
			);
		}

		// Log final positions
		props.forEach((prop) => {
			console.log(
				`📊 AFTER positioning: ${prop.color} prop at (${prop.coords.x}, ${prop.coords.y})`
			);
		});

		return props;
	}

	private applyFallbackPosition(prop: PropData): void {
		// Apply strong fallback positions directly based on prop location
		const fallbacks: Record<string, { x: number; y: number }> = {
			n: { x: 475, y: 330 },
			e: { x: 620, y: 475 },
			s: { x: 475, y: 620 },
			w: { x: 330, y: 475 },
			ne: { x: 620, y: 330 },
			se: { x: 620, y: 620 },
			sw: { x: 330, y: 620 },
			nw: { x: 330, y: 330 }
		};

		if (prop.loc && fallbacks[prop.loc]) {
			prop.coords = { ...fallbacks[prop.loc] };
		} else {
			// Last resort center position
			prop.coords = { x: 475, y: 475 };
		}
	}

	private validatePropPositions(props: PropData[]): void {
		const invalidProps = props.filter((p) => !p.coords || (p.coords.x === 0 && p.coords.y === 0));

		if (invalidProps.length > 0) {
			console.error(
				`❌ PropPlacementManager: ${invalidProps.length} props still at (0,0) after placement`
			);

			// Fix any invalid positions with fallback
			invalidProps.forEach((prop) => {
				this.applyFallbackPosition(prop);
			});
		}
	}
}
