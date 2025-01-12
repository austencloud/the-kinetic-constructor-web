<script>
	import MenuBar from './components/MenuBar.svelte';
	import SequenceWidget from './components/SequenceWidget.svelte';
	import OptionPicker from './components/OptionPicker.svelte';
	import SnowfallBackground from './components/SnowfallBackground.svelte';
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
  
	.mainContent {
	  flex: 1;
	  display: flex;
	  flex-direction: row;
	  position: relative;
	  z-index: 1;
	}
  
	.sequenceWidgetContainer {
	  flex: 1;
	  overflow: hidden;
	}
  
	.optionPickerContainer {
	  flex: 1;
	  overflow-y: auto;
	}
  </style>
  
  <div id="app">
	<div class="background">
	  <SnowfallBackground />
	</div>
	<MenuBar />
	<div class="mainContent">
	  <div class="sequenceWidgetContainer">
		<SequenceWidget />
	  </div>
	  <div class="optionPickerContainer">
		<OptionPicker />
	  </div>
	</div>
  </div>
  