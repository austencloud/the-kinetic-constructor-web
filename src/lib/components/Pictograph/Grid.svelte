<script lang="ts">
    import { onMount } from 'svelte';
    export let onPointsReady: (points: CircleCoords[keyof CircleCoords]) => void;
    export let gridMode: 'diamond' | 'box' = 'diamond'; // Default grid mode

    // Interface definition
    interface CircleCoords {
        [key: string]: {
            hand_points: {
                normal: Record<string, { x: number; y: number }>;
                strict: Record<string, { x: number; y: number }>;
            };
            layer2_points: {
                normal: Record<string, { x: number; y: number }>;
                strict: Record<string, { x: number; y: number }>;
            };
            outer_points: Record<string, string>;
            center_point: { x: number; y: number };
        };
    }

    let gridImagePath: string = '';
    let points: CircleCoords[keyof CircleCoords] | null = null;

    // Fetch and parse circle coordinates
    const parseCoords = (coords: string): { x: number; y: number } => {
        const [x, y] = coords.replace(/[()]/g, '').split(',').map(Number);
        return { x, y };
    };

    const loadCircleCoords = async () => {
        try {
            const response = await fetch('/circle_coords.json');
            if (!response.ok) {
                throw new Error('Failed to load circle_coords.json');
            }

            const data: CircleCoords = await response.json();

            // Parse and update points
            points = {
                ...data[gridMode],
                hand_points: {
                    normal: Object.fromEntries(
                        Object.entries(data[gridMode].hand_points.normal).map(([key, value]) => [
                            key,
                            parseCoords(value as unknown as string),
                        ])
                    ),
                    strict: Object.fromEntries(
                        Object.entries(data[gridMode].hand_points.strict).map(([key, value]) => [
                            key,
                            parseCoords(value as unknown as string),
                        ])
                    ),
                },
                layer2_points: {
                    normal: Object.fromEntries(
                        Object.entries(data[gridMode].layer2_points.normal).map(([key, value]) => [
                            key,
                            parseCoords(value as unknown as string),
                        ])
                    ),
                    strict: Object.fromEntries(
                        Object.entries(data[gridMode].layer2_points.strict).map(([key, value]) => [
                            key,
                            parseCoords(value as unknown as string),
                        ])
                    ),
                },
                center_point: data[gridMode].center_point,
            };

            // Print the coordinates
            console.log('Loaded circle coordinates:', points);

            // Notify parent component
            if (onPointsReady) {
                onPointsReady(points);
            }
        } catch (error) {
            console.error('Error loading circle coordinates:', error);
        }
    };

    // Determine grid image path and load coordinates
    $: {
        gridImagePath = gridMode === 'diamond' ? '/diamond_grid.png' : '/box_grid.png';
    }

    onMount(() => {
        loadCircleCoords();
    });
</script>

<div class="grid-container">
    <img src={gridImagePath} alt="Grid Background" />
</div>

<style>
    .grid-container {
        position: relative;
        width: 100%;
        height: 100%;
    }

    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        cursor: pointer;
    }
</style>
