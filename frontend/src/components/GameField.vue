<template>
  <div class="game-field-container">
    <div class="pitch-container">
      <img src="/assets/football pitch.png" alt="Football Pitch" class="pitch-image" />
      
      <!-- Blue Team Players -->
      <Player
        v-for="(player, key) in bluePlayers"
        :key="`blue-${key}`"
        team="blue"
        :position="key"
        :stance="player.stance"
        :has-ball="player.hasBall"
      />
      
      <!-- Red Team Players -->
      <Player
        v-for="(player, key) in redPlayers"
        :key="`red-${key}`"
        team="red"
        :position="key"
        :stance="player.stance"
        :has-ball="player.hasBall"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../store/gameStore'
import Player from './Player.vue'

const gameStore = useGameStore()

const bluePlayers = computed(() => gameStore.bluePlayers)
const redPlayers = computed(() => gameStore.redPlayers)
</script>

<style scoped>
.game-field-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.pitch-container {
  position: relative;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  border: 3px solid #fff;
  border-radius: 5px;
  overflow: visible;
  background: #fff;
}

.pitch-image {
  width: 100%;
  height: auto;
  display: block;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .game-field-container {
    padding: 10px;
  }
}
</style>

