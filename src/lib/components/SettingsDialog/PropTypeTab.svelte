<script lang="ts">
    import { createEventDispatcher } from 'svelte';
  
    // Props and their corresponding icon paths
    const props = [
      { name: 'Staff', icon: 'images/props/staff.svg' },
      { name: 'Club', icon: 'images/props/club.svg' },
      { name: 'Fan', icon: 'images/props/fan.svg' },
      { name: 'Triad', icon: 'images/props/triad.svg' },
      { name: 'Minihoop', icon: 'images/props/minihoop.svg' },
      { name: 'Buugeng', icon: 'images/props/buugeng.svg' },
    ];
  
    const dispatch = createEventDispatcher();
  
    // Handle button click
    const handlePropClick = (propName: string) => {
      dispatch('propSelected', propName);
    };
  </script>
  
  <div class="prop-type-tab">
    <h2 class="header">Prop Type</h2>
    <div class="grid">
      {#each props as { name, icon }}
        <button
          class="prop-button"
          title={name}
          on:click={() => handlePropClick(name)}
        >
          <img src={icon} alt={name} class="icon" />
          <span class="label">{name}</span>
        </button>
      {/each}
    </div>
  </div>
  
  <style>
    .prop-type-tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }
  
    .header {
      font-size: 1.5rem;
      font-weight: bold;
      text-align: center;
      margin-bottom: 20px;
    }
  
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr); /* 3 columns */
      gap: 10px;
      width: 100%;
      max-width: 600px;
    }
  
    .prop-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #f0f0f0;
      border: 1px solid #ccc;
      border-radius: 5px;
      padding: 10px;
      cursor: pointer;
      transition: background-color 0.2s ease, transform 0.2s ease;
    }
  
    .prop-button:hover {
      background-color: #e0e0e0;
      transform: scale(1.05);
    }
  
    .prop-button:active {
      background-color: #d0d0d0;
      transform: scale(0.95);
    }
  
    .icon {
      width: 50px;
      height: 50px;
      margin-bottom: 10px;
    }
  
    .label {
      font-size: 1rem;
      font-weight: bold;
      text-align: center;
    }
  </style>
  