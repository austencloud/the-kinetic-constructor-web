<script lang="ts">
  import { onMount } from "svelte";

  export let name: string;
  export let isActive: boolean = false;
  export let onClick: () => void;

  let fontSize: number;
  let buttonWidth: number;
  let buttonHeight: number;

  const updateButtonStyles = () => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    fontSize = Math.max(10, windowHeight / 50);
    buttonWidth = Math.max(80, windowWidth / 10); // Adjusted width calculation
    buttonHeight = Math.max(30, windowHeight / 20); // Adjusted height calculation
  };

  onMount(() => {
    updateButtonStyles();
    window.addEventListener("resize", updateButtonStyles);

    return () => {
      window.removeEventListener("resize", updateButtonStyles);
    };
  });
</script>

<button
  on:click={onClick}
  style="
    font-size: {fontSize}px;
    width: {buttonWidth}px;
    height: {buttonHeight}px;
    font-family: Georgia, serif;
    padding: 5px 10px;
    border-radius: 5px;
    border: 1px solid gray;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: {isActive ? 'blue' : 'white'};
    color: {isActive ? 'white' : 'black'};
    font-weight: {isActive ? 'bold' : 'normal'};
  "
>
  {name}
</button>
