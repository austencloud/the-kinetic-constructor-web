// --- Prop.svelte ---
<script lang="ts">
import { onMount } from 'svelte';
import { DefaultPropPositioner } from './PropPlacementManager/DefaultPropPositioner';
import type { GridData } from '../Grid/GridInterface';
import type { PropInterface } from './PropInterface';
import type { Motion } from '../Motion/Motion';

export let motion: Motion;
export let gridData: GridData;

let propData: PropInterface;
let x = 0;
let y = 0;
let transform = '';
let svgPath = '';

function getSvgPath(): string {
    const basePath = '/images/props/';
    return `${basePath}${propData.propType}.svg`;
}

onMount(() => {
    // Initialize prop data
    propData = {
        propType: 'staff',
        color: motion.color,
        motion,
        radialMode: motion.endOri === 'in' || motion.endOri === 'out' ? 'radial' : 'nonradial',
        ori: motion.endOri,
        coords: { x: 0, y: 0 },
        loc: motion.endLoc,
    };

    const defaultPositioner = new DefaultPropPositioner(gridData);
    defaultPositioner.setToDefaultPosition(propData);

    x = propData.coords.x;
    y = propData.coords.y;
    svgPath = getSvgPath();
    transform = `translate(${x}px, ${y}px)`;
});
</script>

<svg
    class="prop"
    style="transform: {transform};"
    xmlns="http://www.w3.org/2000/svg"
>
    <use href={svgPath}></use>
</svg>

<style>
.prop {
    position: absolute;
    transition: all 0.3s ease;
    width: 50px;
    height: 50px;
}
</style>
