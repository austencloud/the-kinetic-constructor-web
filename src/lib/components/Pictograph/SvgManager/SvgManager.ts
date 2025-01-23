// SvgManager.ts (enhanced)
export default class SvgManager {
    private async fetchSvg(path: string): Promise<string> {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Failed to fetch SVG: ${path}`);
      return response.text();
    }
  
    public applyColor(svgData: string, color: 'red' | 'blue'): string {
      const hexColor = color === 'red' ? '#ED1C24' : '#2E3192';
      return svgData
        .replace(/fill="#[a-fA-F0-9]{6}"/gi, `fill="${hexColor}"`)
        .replace(/stroke="#[a-fA-F0-9]{6}"/gi, `stroke="${hexColor}"`);
    }
  
    public async getColoredPropSvg(propType: string, color: 'red' | 'blue'): Promise<string> {
      const baseSvg = await this.fetchSvg(`/images/props/${propType}.svg`);
      return propType === 'hand' ? baseSvg : this.applyColor(baseSvg, color);
    }
  }