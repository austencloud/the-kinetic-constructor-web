<script lang="ts">
	export let prop: any;
  </script>
  
  <rect
	x={prop.position.x}
	y={prop.position.y}
	width={prop.size.width}
	height={prop.size.height}
	fill="red"
  />
  
  <style>
	rect {
	  transition: all 0.3s ease;
	}
  </style>
  