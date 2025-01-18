export default class PropSvgManager {
	getSvgPath(propType: string, color: 'red' | 'blue'): string {
		const basePath = '/assets/props/';
		return `${basePath}${propType}-${color}.svg`;
	}
}
