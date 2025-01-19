<script lang="ts">
    import { onMount } from 'svelte';
    import { parseCircleCoords } from '../../../utils/gridCoordinateUtils'; // Import utilities
    import type { CircleCoords } from '../../../types/CircleCoords'; // Import types

    export let onPointsReady: (points: CircleCoords[keyof CircleCoords]) => void;
    export let gridMode: 'diamond' | 'box' = 'diamond'; // Default grid mode

    let gridImagePath: string = '';
    let points: CircleCoords[keyof CircleCoords] | null = null;

    const loadCircleCoords = async () => {
        try {
            const response = await fetch('/circle_coords.json');
            if (!response.ok) {
                throw new Error('Failed to load circle_coords.json');
            }

            const data: CircleCoords = await response.json();
            points = parseCircleCoords(data, gridMode); // Use utility function to parse


            if (onPointsReady && points) {
                onPointsReady(points);
            }
        } catch (error) {
            console.error('Error loading circle coordinates:', error);
        }
    };

    // Update the grid image path when gridMode changes
    $: gridImagePath = gridMode === 'diamond' ? '/diamond_grid.png' : '/box_grid.png';

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
