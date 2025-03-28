import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { Loc } from '$lib/types/Types';

const BASE_POSITIONS: Record<Loc, { x: number; y: number }> = {
	n: { x: 475, y: 330 },
	e: { x: 620, y: 475 },
	s: { x: 475, y: 620 },
	w: { x: 330, y: 475 },
	ne: { x: 620, y: 330 },
	se: { x: 620, y: 620 },
	sw: { x: 330, y: 620 },
	nw: { x: 330, y: 330 }
};

const COLOR_OFFSETS: Record<'red' | 'blue', { x: number; y: number }> = {
	red: { x: 30, y: 0 },
	blue: { x: -30, y: 0 }
};

const DEFAULT_CENTER = { x: 475, y: 475 };

export function applyFallbackPosition(prop: PropData, color: 'red' | 'blue'): void {
	const offset = COLOR_OFFSETS[color] ?? { x: 0, y: 0 };

	if (prop.loc && BASE_POSITIONS[prop.loc]) {
		const base = BASE_POSITIONS[prop.loc];
		prop.coords = {
			x: base.x + offset.x,
			y: base.y + offset.y
		};
		console.warn(
			`⚠️ PositionUtil: Applied fallback position for ${color} prop at location '${prop.loc}'.`
		);
		return;
	}

	prop.coords = {
		x: DEFAULT_CENTER.x + offset.x,
		y: DEFAULT_CENTER.y + offset.y
	};
	console.error(
		`❌ PositionUtil: Applied fallback position for ${color} prop at CENTER. Location '${prop.loc}' was invalid or missing.`
	);
}
