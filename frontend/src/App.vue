<template>
  <div id="app">
    <GameView />
  </div>
</template>

<script setup>
import GameView from './views/GameView.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  background: #1a5f2f;
  overflow-x: hidden;
}

#app {
  width: 100%;
  min-height: 100vh;
}
</style>

