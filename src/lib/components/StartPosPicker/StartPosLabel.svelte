<script lang="ts">
	import { onMount } from 'svelte';

	export let customStyles: string = ''; // Optional additional styles
	let isMobile: boolean = false;

	onMount(() => {
		isMobile = /Mobi|Android/i.test(navigator.userAgent);
	});
</script>

<div class="label {isMobile ? 'mobile' : ''}" style={customStyles}>
	{isMobile ? "Start:" : "Choose your start position!"}
</div>

<style>
	.label {
		margin-bottom: 10%;
		font-size: 4vh;
		font-family: 'Monotype Corsiva', cursive;
		background-color: rgba(255, 255, 255, 0.5);
		border-radius: 40px;
		padding: 10px 20px;
		text-align: center;
	}
	
	.label.mobile {
		margin-bottom: 5%; /* Reduced margin for mobile */
		font-size: 3vh;
	}

	@media (orientation: portrait) {
		.label {
			margin-bottom: 5%; /* Remove margin for portrait orientation */
			margin-top: 5%; /* Remove margin for portrait orientation */
		}
	}
</style>
