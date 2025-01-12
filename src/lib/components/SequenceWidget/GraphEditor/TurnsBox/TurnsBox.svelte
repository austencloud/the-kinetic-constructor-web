<script lang="ts">
  import TurnsBoxHeader from "./TurnsBoxHeader/TurnsBoxHeader.svelte";
  import TurnsWidget from "./TurnsWidget/TurnsWidget.svelte";

  export let color: string;

  let isCWPressed = false;
  let isCCWPressed = false;

  const handleCWClick = () => {
    isCWPressed = true;
    isCCWPressed = false;
    console.log(`${color} prop rotation set to CW`);
  };

  const handleCCWClick = () => {
    isCWPressed = false;
    isCCWPressed = true;
    console.log(`${color} prop rotation set to CCW`);
  };
</script>

<div
  style="
    border: 4px solid {color === 'blue' ? '#2e3192' : '#ed1c24'};
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    flex: 1;
    align-self: stretch;
    background: {color === 'blue'
      ? 'linear-gradient(135deg, rgba(46, 49, 146, 0.1), rgba(46, 49, 146, 0.3))'
      : 'linear-gradient(135deg, rgba(237, 28, 36, 0.1), rgba(237, 28, 36, 0.3))'};
  "
>
  <TurnsBoxHeader
    {color}
    onCWClick={handleCWClick}
    onCCWClick={handleCCWClick}
    {isCWPressed}
    {isCCWPressed}
  />
  <TurnsWidget {color} />
</div>
