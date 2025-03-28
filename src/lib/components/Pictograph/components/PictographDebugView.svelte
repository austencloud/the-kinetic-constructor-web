<script lang="ts">
	import type { PropData } from "../../objects/Prop/PropData";
	import type { PictographManagers } from "../core/PictographManagers";


	export let redProp: PropData | null = null;
	export let blueProp: PropData | null = null;
	export let stage: string = '';
	export let pictographManagers: PictographManagers | null = null;
	export let isDataComplete: () => boolean;
	export let visible: boolean = true;
</script>

{#if visible}
	{#if redProp}
		<circle cx={redProp.coords.x} cy={redProp.coords.y} r="8" fill="red" opacity="0.5" />
		<text
			x={redProp.coords.x}
			y={redProp.coords.y - 10}
			text-anchor="middle"
			fill="red"
			font-size="12"
			stroke="white"
			stroke-width="0.5"
		>
			({Math.round(redProp.coords.x)}, {Math.round(redProp.coords.y)})
		</text>
	{/if}

	{#if blueProp}
		<circle cx={blueProp.coords.x} cy={blueProp.coords.y} r="8" fill="blue" opacity="0.5" />
		<text
			x={blueProp.coords.x}
			y={blueProp.coords.y - 10}
			text-anchor="middle"
			fill="blue"
			font-size="12"
			stroke="white"
			stroke-width="0.5"
		>
			({Math.round(blueProp.coords.x)}, {Math.round(blueProp.coords.y)})
		</text>
	{/if}

	<text x="10" y="20" font-size="12" fill="white" stroke="black" stroke-width="0.5">
		Stage: {stage}
	</text>

	<text x="10" y="40" font-size="12" fill="white" stroke="black" stroke-width="0.5">
		Data Complete: {isDataComplete() ? 'Yes' : 'No'}
	</text>

	<text x="10" y="60" font-size="12" fill="white" stroke="black" stroke-width="0.5">
		Beta active: {pictographManagers?.checker?.endsWithBeta() ? 'Yes' : 'No'}
	</text>
{/if}
