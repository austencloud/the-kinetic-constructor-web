import type { Motion } from '../Motion/Motion';
import type { MotionInterface, MotionType, Orientation } from '../Motion/MotionInterface';

// SvgManager.ts (enhanced)
export default class SvgManager {
	private async fetchSvg(path: string): Promise<string> {
		const response = await fetch(path);
		if (!response.ok) throw new Error(`Failed to fetch SVG: ${path}`);
		return response.text();
	}

	public applyColor(svgData: string, color: 'red' | 'blue'): string {
		const hexColor = color === 'red' ? '#ED1C24' : '#2E3192';
		return svgData.replace(/\.st0{([^}]*fill:#)2E3192([^}]*)}/g, `.st0{$1${hexColor.slice(1)}$2}`);
	}

	public async getPropSvg(propType: string, color: 'red' | 'blue'): Promise<string> {
		const baseSvg = await this.fetchSvg(`/images/props/${propType}.svg`);
		return propType === 'hand' ? baseSvg : this.applyColor(baseSvg, color);
	}

	public getArrowSvg(
		motionType: MotionType,
		startOri: Orientation,
		turns: number
	): Promise<string> {
		const basePath = '/images/arrows';
		const typePath = motionType.toLowerCase();
		const radialPath = startOri === 'out' || startOri === 'in' ? 'from_radial' : 'from_nonradial';
		const fixedTurns = turns.toFixed(1); 
		const svgPath = `${basePath}/${typePath}/${radialPath}/${motionType}_${fixedTurns}.svg`;
		return Promise.resolve(svgPath);
	}
}
