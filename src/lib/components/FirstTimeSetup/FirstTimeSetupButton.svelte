<script lang="ts">
	// Create a function to show the first-time setup dialog
	export let showDialog: () => void;
</script>

<button
	class="setup-button"
	on:click={showDialog}
	title="Show First-Time Setup Dialog"
	aria-label="Show First-Time Setup Dialog"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
		<path d="M12 16v-4"></path>
		<path d="M12 8h.01"></path>
	</svg>
</button>

<style>
	.setup-button {
		background: #1e293b;
		color: white;
		border: 1px solid #334155;
		border-radius: 20px;
		height: 36px;
		padding: 0 12px;
		cursor: pointer;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		opacity: 0.8;
		transition: all 0.2s ease;
		position: fixed;
		bottom: 10px;
		left: 10px;
		z-index: 9999;
	}

	.setup-button:hover {
		opacity: 1;
		background: #334155;
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
		transform: scale(1.05);
	}

	.button-text {
		font-size: 14px;
		font-weight: 500;
	}

	/* Hide text on small screens */
	@media (max-width: 480px) {
		.button-text {
			display: none;
		}

		.setup-button {
			width: 36px;
			border-radius: 50%;
			padding: 0;
		}
	}

	/* Adjust position on larger screens */
	@media (min-width: 768px) {
		.setup-button {
			bottom: 15px;
			left: 15px;
		}
	}
</style>
