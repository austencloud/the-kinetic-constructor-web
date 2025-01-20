<script lang="ts">
    import { onMount } from 'svelte';
    import PropRotAngleManager from './PropRotAngleManager';
    import type { PropInterface } from './PropInterface';

    export let propData: PropInterface;
    export let sceneScaleFactor: number; // Scaling factor from Pictograph
    let transform = '';
    let svgPath = '';

    const getSvgPath = () => `/images/props/${propData.propType}.svg`;

    onMount(() => {
        const rotationManager = new PropRotAngleManager({
            location: propData.loc,
            orientation: propData.ori
        });
        const rotationAngle = rotationManager.getRotationAngle();

        // Transform includes global scaling, translation, and rotation
        transform = `translate(${propData.coords.x * sceneScaleFactor}px, ${propData.coords.y * sceneScaleFactor}px)
                     scale(${sceneScaleFactor}) rotate(${rotationAngle}deg)`;

        svgPath = getSvgPath();
        console.debug('Prop Transform:', transform);
    });
</script>

{#if svgPath}
    <img src={svgPath} class="prop" style="transform: {transform};" alt="Prop" />
{:else}
    <p>Prop SVG path not found.</p>
{/if}

<style>
    .prop {
        position: absolute;
        transform-origin: center; /* Center scaling and rotation */
        z-index: 10;
    }
</style>
