<script lang="ts">
    export let size = 40;
    export let color = "#4299e1";
    export let message = "Loading...";
    export let showMessage = true;
  </script>
  
  <g class="loading-indicator">
    <circle cx="50%" cy="50%" r={size} fill="none" stroke={color} stroke-width="4" stroke-dasharray="80 30" stroke-linecap="round">
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        from="0 475 475"
        to="360 475 475"
        dur="1.5s"
        repeatCount="indefinite"
      />
    </circle>
    
    {#if showMessage}
      <text
        x="50%"
        y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-size={size / 2}
        fill={color}
        font-family="sans-serif"
      >
        {message}
      </text>
    {/if}
  </g>
  
  <style>
    .loading-indicator {
      animation: fadeInOut 2s ease-in-out infinite;
    }
    
    @keyframes fadeInOut {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
  </style>