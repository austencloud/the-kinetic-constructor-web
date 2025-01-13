<script>
  import { onMount } from "svelte";
  import SequenceWidgetButton from "./SequenceWidgetButton.svelte";

  let buttonSize = 60;

  const buttons = [
    { icon: "/button_panel_icons/add_to_dictionary.png", title: "Add to Dictionary", id: "addToDictionary" },
    { icon: "/button_panel_icons/save_image.png", title: "Save Image", id: "saveImage" },
    { icon: "/button_panel_icons/eye.png", title: "View Full Screen", id: "viewFullScreen" },
    { icon: "/button_panel_icons/mirror.png", title: "Mirror Sequence", id: "mirrorSequence" },
    { icon: "/button_panel_icons/yinyang1.png", title: "Swap Colors", id: "swapColors" },
    { icon: "/button_panel_icons/rotate.png", title: "Rotate Sequence", id: "rotateSequence" },
    { icon: "/button_panel_icons/delete.png", title: "Delete Beat", id: "deleteBeat" },
    { icon: "/button_panel_icons/clear.png", title: "Clear Sequence", id: "clearSequence" },
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
    z-index: auto;
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
