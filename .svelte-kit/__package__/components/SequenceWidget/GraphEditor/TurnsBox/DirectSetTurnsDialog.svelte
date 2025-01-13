<script lang="ts">
  import { onMount } from "svelte";

  // Removed unused `currentTurns` property
  export let onSelectTurns: (value: string) => void;
  export let onClose: () => void;
  export let color: string;

  const turnsValues = ["fl", "0", "0.5", "1", "1.5", "2", "2.5", "3"];
  let buttonSize = "80px";

  const borderColor = color === "blue" ? "#2e3192" : "#ed1c24";

  const updateButtonSize = () => {
    const dialogWidth = window.innerWidth * 0.4;
    buttonSize = `${Math.min(dialogWidth / 4 - 20, 80)}px`;
  };

  // Ensure the function is called when the component is mounted
  onMount(() => {
    updateButtonSize();
    window.addEventListener("resize", updateButtonSize);
    return () => window.removeEventListener("resize", updateButtonSize);
  });
</script>

<div
  style="
    position: absolute;
    border: 4px solid {borderColor};
    border-radius: 10px;
    background-color: #ffffff;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
    font-size: 18px;
  "
>
  {#each turnsValues as value}
    <button
      style=" 
        width: {buttonSize};
        height: {buttonSize};
        border: 2px solid {borderColor};
        border-radius: 50%;
        background-color: white;
        cursor: pointer;
      "
      on:click={() => {
        onSelectTurns(value);
        onClose();
      }}
    >
      {value}
    </button>
  {/each}
</div>
