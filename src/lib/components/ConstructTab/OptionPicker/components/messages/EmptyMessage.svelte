<script lang="ts">
	export let type: 'empty' | 'initial' = 'empty';
	export let message: string = 'No options available';
</script>

<div class="message-container {type}">
	{message}
</div>

<style>
	.message-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2rem;
		text-align: center;
		color: #6b7280;
		box-sizing: border-box;
		font-size: 1.1rem;
	}

	.message-container.empty {
		font-style: italic;
	}

	.message-container.initial {
		font-style: italic;
		color: #9ca3af;
	}
</style>