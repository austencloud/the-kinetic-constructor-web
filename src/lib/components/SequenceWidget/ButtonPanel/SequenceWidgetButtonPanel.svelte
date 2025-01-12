<script>
  import { onMount } from "svelte";
	import SequenceWidgetButton from "./SequenceWidgetButton.svelte";

  let buttonSize = 60;

  const buttons = [
    { icon: "icons/add_to_dictionary.png", title: "Add to Dictionary", id: "addToDictionary" },
    { icon: "icons/save_image.png", title: "Save Image", id: "saveImage" },
    { icon: "icons/eye.png", title: "View Full Screen", id: "viewFullScreen" },
    { icon: "icons/mirror.png", title: "Mirror Sequence", id: "mirrorSequence" },
    { icon: "icons/yinyang1.png", title: "Swap Colors", id: "swapColors" },
    { icon: "icons/rotate.png", title: "Rotate Sequence", id: "rotateSequence" },
    { icon: "icons/delete.png", title: "Delete Beat", id: "deleteBeat" },
    { icon: "icons/clear.png", title: "Clear Sequence", id: "clearSequence" },
  ];

  const updateButtonSize = () => {
    const containerWidth = window.innerWidth;
    buttonSize = Math.max(40, Math.min(80, containerWidth / 40));
  };

  onMount(() => {
    updateButtonSize();
    window.addEventListener("resize", updateButtonSize);
    return () => window.removeEventListener("resize", updateButtonSize);
  });
</script>

<style>
  .button-panel {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 5px;
    padding: 5px;
  }
</style>

<div class="button-panel">
  {#each buttons as button}
    <SequenceWidgetButton
      icon={button.icon}
      title={button.title}
      buttonSize={buttonSize}
      onClick={() => console.log(`${button.title} clicked`)}
    />
  {/each}
</div>
