<script lang="ts">
  export let icon: string;
  export let color: string;
  export let onClick: () => void;
  export let isPressed: boolean = false;

  // Map color strings to hex codes
  const colorHexMap: Record<string, string> = {
    blue: '#6a79d1', // Lighter blue
    red: '#f26d6d',  // Lighter red
  };

  // Fallback to default color if not found
  $: parsedColor = colorHexMap[color] || '#ffffff';

  let isHovered: boolean = false;

  function handleClick() {
    isPressed = !isPressed;
    onClick();
  }
</script>

<button
  class="button"
  style="
    --color: {parsedColor};
    --background-color: white;
    --pressed-background: {parsedColor};
    --hover-background: #f5f5f5; /* Light gray hover effect */"
  on:click={handleClick}
  on:mouseenter={() => (isHovered = true)}
  on:mouseleave={() => (isHovered = false)}
  aria-label="Prop Rotation Button"
>
  <img class="icon" src={icon} alt="Prop Rotation Icon" />
</button>

<style>
  /* Button Base Style */
  .button {
    width: 4rem;
    height: 4rem;
    border: 2px solid var(--color);
    border-radius: 10px; /* Slightly rounded corners for a modern look */
    background-color: var(--background-color);
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition:
      background-color 0.3s ease,
      transform 0.2s ease,
      box-shadow 0.3s ease;
    box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2),
      inset 0px 1px 3px rgba(255, 255, 255, 0.5); /* Subtle inner shadow */
      transition-duration: 0.1s;
  }

  /* Hover Effect */
  .button:hover {
    background-color: var(--hover-background);
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3),
      inset 0px 1px 3px rgba(255, 255, 255, 0.5);
  }

  /* Pressed State */
  .button:active {
    background-color: var(--pressed-background);
    box-shadow: inset 0px 2px 5px rgba(0, 0, 0, 0.2); /* Emulate pressed button */
    transform: translateY(2px); /* Slight downward movement */
  }

  /* Icon Style */
  .icon {
    width: 100%; /* Allow the icon to fill most of the button */
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.3));
  }
</style>
