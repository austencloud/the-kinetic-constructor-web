export const parseCoords = (coords: string): { x: number; y: number } => {
	const [x, y] = coords.replace(/[()]/g, '').split(',').map(Number);
	return { x, y };
};

export const parseCircleCoords = (data: any, gridMode: string): any => {
	const parseEntries = (entries: Record<string, string>) =>
		Object.fromEntries(Object.entries(entries).map(([key, value]) => [key, parseCoords(value)]));

	return {
		...data[gridMode],
		hand_points: {
			normal: parseEntries(data[gridMode].hand_points.normal),
			strict: parseEntries(data[gridMode].hand_points.strict)
		},
		layer2_points: {
			normal: parseEntries(data[gridMode].layer2_points.normal),
			strict: parseEntries(data[gridMode].layer2_points.strict)
		},
		center_point: parseCoords(data[gridMode].center_point)
	};
};
