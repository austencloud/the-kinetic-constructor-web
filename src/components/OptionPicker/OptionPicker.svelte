<script>
    let options = ['Option 1', 'Option 2', 'Option 3'];
  </script>
  
  <style>
    .optionPicker {
      display: flex;
      flex-direction: column;
      padding: 10px;
      flex: 1;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
  
    .title {
      margin-bottom: 10px;
      font-size: 1.5rem;
      font-weight: bold;
      color: white;
    }
  
    .scrollArea {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
    }
  
    .option {
      padding: 10px;
      margin-bottom: 5px;
      background-color: #fff;
      cursor: pointer;
      transition: background-color 0.3s;
    }
  
    .option:hover {
      background-color: #e0e7ff;
    }
  </style>
  
  <div class="optionPicker">
    <h2 class="title">Options:</h2>
    <div class="scrollArea">
      {#each options as option}
        <div class="option">{option}</div>
      {/each}
    </div>
  </div>
  