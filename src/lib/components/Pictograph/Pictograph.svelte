<script lang="ts">
	export let pictographData: any;
</script>

<div class="base-pictograph">
	<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
		{#if pictographData.grid}
			<image href={pictographData.grid} width="100" height="100" />
		{:else}
			<text
				x="50"
				y="50"
				text-anchor="middle"
				alignment-baseline="middle"
				font-size="10"
				fill="#000"
			>
				No grid available
			</text>
		{/if}
	</svg>
</div>

<style>
	.base-pictograph {
		width: 100px;
		height: 100px;
		display: flex;
		justify-content: center;
		align-items: center;
		background: #f0f0f0;
		border: 1px solid #ccc;
		border-radius: 5px;
	}
</style>
