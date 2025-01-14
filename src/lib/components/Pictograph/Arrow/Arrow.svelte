<script lang="ts">
	export let arrow: any;
  </script>
  
  <line
	x1={arrow.start.x}
	y1={arrow.start.y}
	x2={arrow.end.x}
	y2={arrow.end.y}
	stroke="blue"
	stroke-width="2"
  />
  
  <style>
	line {
	  transition: stroke-width 0.3s ease;
	}
  </style>
  