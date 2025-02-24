<script lang="ts">
	export let isSelected: boolean = false;
</script>

<div class="overlay" class:selected={isSelected}></div>

<style>
	.overlay {
		position: absolute;
		inset: 0;
		border: 3px solid transparent;
		transition: border-color 0.3s ease-in-out;
	}

	.overlay.selected {
		border-color: gold;
	}
</style>
