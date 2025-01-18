export default class SvgManager {
    loadSvgFile(svgPath: string): Promise<string> {
        return fetch(svgPath).then((response) => response.text());
    }

    applyColorTransformations(svgData: string, newColor: 'red' | 'blue'): string {
        const colorMap = { red: '#ED1C24', blue: '#2E3192' };
        const newHexColor = colorMap[newColor];

        // Replace colors in the SVG string
        return svgData
            .replace(/fill="#[a-fA-F0-9]{6}"/g, `fill="${newHexColor}"`)
            .replace(/stroke="#[a-fA-F0-9]{6}"/g, `stroke="${newHexColor}"`);
    }

    async getArrowSvg(arrow: any): Promise<string> {
        const svgPath = `/assets/arrows/${arrow.motionType}-${arrow.turns}.svg`; // Adjust path logic as needed
        let svgData = await this.loadSvgFile(svgPath);
        return this.applyColorTransformations(svgData, arrow.color);
    }

    async getPropSvg(prop: any): Promise<string> {
        const svgPath = `/assets/props/${prop.propType}.svg`; // Adjust path logic as needed
        let svgData = await this.loadSvgFile(svgPath);
        return prop.propType !== 'hand'
            ? this.applyColorTransformations(svgData, prop.color)
            : svgData;
    }
}
