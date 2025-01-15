<script>
	export let type = 'increment'; // Increment or decrement
	export let color = 'blue'; // Button color
</script>
  
<button
	class="increment-button"
	style="--color: {color}"
	on:click
	aria-label={type === 'increment' ? 'Increase' : 'Decrease'}
>
	{type === 'increment' ? '+' : '−'}
</button>
  
<style>
	.increment-button {
	  width: 20%;
	  background-color: white;
	  color: black; /* Changed to black */
	  border: 3px solid var(--color);
	  border-radius: 50%;
	  cursor: pointer;
	  transition: transform 0.2s;
	  aspect-ratio: 1/1;
	  transition-duration: 0.1s;
	  font-size: 2em; /* Adjust font size relative to parent */
	}
  
	.increment-button:hover {
	  transform: scale(1.1);
	  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3),
      inset 0px 1px 3px rgba(255, 255, 255, 0.5);
	}

	.increment-button:active {
	  transform: scale(0.9);
	}
</style>
