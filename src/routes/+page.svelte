<script>
	import MenuBar from '$lib/components/MenuBar/MenuBar.svelte';
    import SequenceWidget from '$lib/components/SequenceWidget/SequenceWidget.svelte';
    import OptionPicker from '$lib/components/OptionPicker/OptionPicker.svelte';
    import SnowfallBackground from '$lib/components/Backgrounds/SnowfallBackground.svelte';
  </script>
  
  <style>
    #app {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      position: relative;
    }
  
    .background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
    }
  
    .menuBar {
      z-index: 1;
    }
  
    .mainContent {
      flex: 1;
      display: flex;
      flex-direction: row;
      z-index: 0;
    }
  
    .sequenceWidgetContainer,
    .optionPickerContainer {
      flex: 1;
      overflow: hidden;
    }
  
    .optionPickerContainer {
      overflow-y: auto;
    }
  </style>
  
  <div id="app">
    <div class="background">
      <SnowfallBackground />
    </div>
    <div class="menuBar">
      <MenuBar 
        background="defaultBackground" 
        onTabChange={() => {}} 
        onChangeBackground={(e) => {}} 
      />
    </div>
    <div class="mainContent">
      <div class="sequenceWidgetContainer">
        <SequenceWidget />
      </div>
      <div class="optionPickerContainer">
        <OptionPicker />
      </div>
    </div>
  </div>
  