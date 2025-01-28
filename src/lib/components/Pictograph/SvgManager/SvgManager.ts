import type { Color, MotionType, Orientation, PropType, TKATurns } from '../../../types/Types';

export default class SvgManager {
	private async fetchSvg(path: string): Promise<string> {
		const response = await fetch(path);
		if (!response.ok) throw new Error(`Failed to fetch SVG: ${path}`);
		return response.text();
	}

	public applyColor(svgData: string, color: Color): string {
		const hexColor = color === 'red' ? '#ED1C24' : '#2E3192';
		return svgData.replace(
			/\.st0{([^}]*fill:#)[0-9A-Fa-f]{6}([^}]*)}/g,
			`.st0{$1${hexColor.slice(1)}$2}`
		);
	}

	public async getPropSvg(propType: PropType, color: Color): Promise<string> {
		const baseSvg = await this.fetchSvg(`/images/props/${propType}.svg`);
		return propType === 'hand' ? baseSvg : this.applyColor(baseSvg, color);
	}

	public async getArrowSvg(
		motionType: MotionType,
		startOri: Orientation,
		turns: TKATurns,
		color: Color
	): Promise<string> {
		const basePath = '/images/arrows';
		const typePath = motionType.toLowerCase();
		const radialPath = startOri === 'out' || startOri === 'in' ? 'from_radial' : 'from_nonradial';
		const fixedTurns = (typeof turns === 'number' ? turns : parseFloat(turns)).toFixed(1);
		const svgPath = `${basePath}/${typePath}/${radialPath}/${motionType}_${fixedTurns}.svg`;

		const svgData = await this.fetchSvg(svgPath);
		return this.applyColor(svgData, color);
	}
}
