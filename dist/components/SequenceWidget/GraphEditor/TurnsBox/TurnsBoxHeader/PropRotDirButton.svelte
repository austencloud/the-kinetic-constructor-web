<script lang="ts">
  export let icon: string;
  export let color: string;
  export let onClick: () => void;
  export let isPressed: boolean = false;

  let isHovered: boolean = false;
</script>

<style>
  .button {
    width: 4rem;
    height: 4rem;
    border: 2px solid var(--color);
    background-color: var(--background-color, white);
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background-color 0.3s, transform 0.2s;
    transform: var(--scale, scale(1));
    overflow: hidden;
  }

  .button:hover {
    background-color: var(--hover-background, #e6f0ff);
  }

  .icon {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
</style>

<button
  class="button"
  style="--color: {color}; --background-color: {isPressed ? '#ccd9ff' : 'white'}; --scale: {isPressed ? 'scale(0.95)' : 'scale(1)'}"
  on:click={onClick}
  on:mouseenter={() => (isHovered = true)}
  on:mouseleave={() => (isHovered = false)}
>
  <img class="icon" src={icon} alt="icon" />
</button>
