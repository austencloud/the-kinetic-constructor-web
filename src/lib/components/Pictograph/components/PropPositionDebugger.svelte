<script lang="ts">
	import { onMount } from 'svelte';
	import type { GridData } from '$lib/components/objects/Grid/GridData';
	import type { PropData } from '$lib/components/objects/Prop/PropData';

	export let gridData: GridData | null = null;
	export let redProp: PropData | null = null;
	export let blueProp: PropData | null = null;
	export let visible: boolean = true;

	let redPointName = '';
	let bluePointName = '';
	let redPointCoords = { x: 0, y: 0 };
	let bluePointCoords = { x: 0, y: 0 };
	let gridMode = 'diamond';

	let redPointExists = false;
	let bluePointExists = false;

	$: if (visible && gridData && (redProp || blueProp)) {
		updateDebugInfo();
	}

	function updateDebugInfo() {
		if (!gridData) return;

		gridMode = redProp?.loc?.includes('e') || redProp?.loc?.includes('w') ? 'diamond' : 'box';

		if (redProp?.loc) {
			redPointName = `${redProp.loc}_${gridMode}_hand_point`;
			redPointExists = !!(gridData.allHandPointsNormal && gridData.allHandPointsNormal[redPointName]);
			if (redPointExists && gridData.allHandPointsNormal[redPointName]?.coordinates) {
				redPointCoords = gridData.allHandPointsNormal[redPointName].coordinates!;
			}
		}

		if (blueProp?.loc) {
			bluePointName = `${blueProp.loc}_${gridMode}_hand_point`;
			bluePointExists = !!(gridData.allHandPointsNormal && gridData.allHandPointsNormal[bluePointName]);
			if (bluePointExists && gridData.allHandPointsNormal[bluePointName]?.coordinates) {
				bluePointCoords = gridData.allHandPointsNormal[bluePointName].coordinates!;
			}
		}
	}

	onMount(() => {
		if (gridData && (redProp || blueProp)) {
			updateDebugInfo();
		}
	});
</script>

{#if visible}
	<g class="prop-position-debugger">
		<g transform="translate(10, 10)">
			<rect width="300" height="200" fill="rgba(0,0,0,0.7)" rx="5" ry="5" />
			<text x="10" y="25" fill="#ffcc00" font-family="monospace" font-size="14">
				Prop Position Debugger
			</text>

			{#if redProp}
				<text x="10" y="50" fill="#ff6666" font-family="monospace" font-size="12">
					Red Prop: {redProp.loc || 'unknown'}
				</text>
				<text x="10" y="65" fill="#ff6666" font-family="monospace" font-size="12">
					Coords: ({redProp.coords?.x?.toFixed(1) || 0}, {redProp.coords?.y?.toFixed(1) || 0})
				</text>
				<text x="10" y="80" fill="#ff6666" font-family="monospace" font-size="12">
					Point: {redPointName}
				</text>
				{#if redPointExists}
					<text x="10" y="95" fill="#66ff66" font-family="monospace" font-size="12">
						✓ Found: ({redPointCoords.x.toFixed(1)}, {redPointCoords.y.toFixed(1)})
					</text>
				{:else}
					<text x="10" y="95" fill="#ff6666" font-family="monospace" font-size="12">
						✗ Point Missing!
					</text>
				{/if}
			{/if}

			{#if blueProp}
				<text x="10" y="120" fill="#6666ff" font-family="monospace" font-size="12">
					Blue Prop: {blueProp.loc || 'unknown'}
				</text>
				<text x="10" y="135" fill="#6666ff" font-family="monospace" font-size="12">
					Coords: ({blueProp.coords?.x?.toFixed(1) || 0}, {blueProp.coords?.y?.toFixed(1) || 0})
				</text>
				<text x="10" y="150" fill="#6666ff" font-family="monospace" font-size="12">
					Point: {bluePointName}
				</text>
				{#if bluePointExists}
					<text x="10" y="165" fill="#66ff66" font-family="monospace" font-size="12">
						✓ Found: ({bluePointCoords.x.toFixed(1)}, {bluePointCoords.y.toFixed(1)})
					</text>
				{:else}
					<text x="10" y="165" fill="#ff6666" font-family="monospace" font-size="12">
						✗ Point Missing!
					</text>
				{/if}
			{/if}
		</g>

		{#if redProp && redPointExists}
			<line
				x1={redProp.coords?.x || 0}
				y1={redProp.coords?.y || 0}
				x2={redPointCoords.x}
				y2={redPointCoords.y}
				stroke="rgba(255,0,0,0.5)"
				stroke-width="2"
				stroke-dasharray="5,5"
			/>
			<circle
				cx={redPointCoords.x}
				cy={redPointCoords.y}
				r="8"
				fill="none"
				stroke="red"
				stroke-width="2"
			/>
		{/if}

		{#if blueProp && bluePointExists}
			<line
				x1={blueProp.coords?.x || 0}
				y1={blueProp.coords?.y || 0}
				x2={bluePointCoords.x}
				y2={bluePointCoords.y}
				stroke="rgba(0,0,255,0.5)"
				stroke-width="2"
				stroke-dasharray="5,5"
			/>
			<circle
				cx={bluePointCoords.x}
				cy={bluePointCoords.y}
				r="8"
				fill="none"
				stroke="blue"
				stroke-width="2"
			/>
		{/if}
	</g>
{/if}
