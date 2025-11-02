<template>
  <div
    :class="['player', teamClass, positionClass]"
    :style="playerStyle"
  >
    <img
      :src="spriteSrc"
      :alt="`${team} ${position}`"
      class="player-sprite"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../store/gameStore'

const props = defineProps({
  team: {
    type: String,
    required: true,
    validator: (value) => ['blue', 'red'].includes(value)
  },
  position: {
    type: String,
    required: true,
    validator: (value) => ['gk', 'def', 'mid1', 'mid2', 'att'].includes(value)
  },
  stance: {
    type: String,
    required: true,
    default: 'standing'
  },
  hasBall: {
    type: Boolean,
    default: false
  }
})

const gameStore = useGameStore()

const teamClass = computed(() => `${props.team}-${props.position}`)
const positionClass = computed(() => `position-${props.position}`)

const spriteSrc = computed(() => {
  const teamId = gameStore.getTeamId(props.team)
  return `/assets/players/${teamId}_${props.stance}.png`
})
const team = computed(() => props.team === 'blue' ? gameStore.bluePlayers : gameStore.redPlayers)
const player = computed(() => team.value[props.position])
const fieldPosition = computed(() => player.value?.fieldPosition || getDefaultFieldPosition())

// Convert percentage positions to pixel offsets for transform
function getTransformPosition(fieldPos) {
  // We'll use the container width/height to calculate positions
  // For now, use a simple mapping - in a real scenario we'd measure the container
  const positionMap = {
    1: { x: 5, y: 40 },    // Blue GK
    2: { x: 18, y: 40 },   // Blue DEF
    3: { x: 35, y: 18 },  // Blue MID1
    4: { x: 35, y: 62 },  // Blue MID2
    5: { x: 55, y: 40 },   // Blue ATT
    6: { x: -5, y: 40 },   // Red GK (negative for right side)
    7: { x: -18, y: 40 },  // Red DEF
    8: { x: -35, y: 18 },  // Red MID1
    9: { x: -35, y: 62 },  // Red MID2
    10: { x: -55, y: 40 }  // Red ATT
  }
  return positionMap[fieldPos] || { x: 5, y: 40 }
}

const playerStyle = computed(() => {
  // Map field position (1-10) to CSS position using percentages for initial positioning
  const positionMap = {
    1: { left: '5%', top: '40%' },    // Blue GK
    2: { left: '18%', top: '40%' },   // Blue DEF
    3: { left: '35%', top: '18%' },  // Blue MID1 (closer to top sideline)
    4: { left: '35%', top: '62%' },  // Blue MID2 (closer to bottom sideline)
    5: { left: '55%', top: '40%' },   // Blue ATT
    6: { right: '5%', top: '40%' },   // Red GK
    7: { right: '18%', top: '40%' },  // Red DEF
    8: { right: '35%', top: '18%' },  // Red MID1 (closer to top sideline)
    9: { right: '35%', top: '62%' },  // Red MID2 (closer to bottom sideline)
    10: { right: '55%', top: '40%' }  // Red ATT
  }
  
  const pos = positionMap[fieldPosition.value] || getDefaultPosition()
  
  const baseStyle = {
    position: 'absolute',
    width: '80px',
    height: '80px',
    zIndex: props.hasBall ? 10 : 5
  }
  
  // Merge position styles
  return { ...baseStyle, ...pos }
})


function getDefaultFieldPosition() {
  // Default field positions based on role
  const defaults = {
    blue: { gk: 1, def: 2, mid1: 3, mid2: 4, att: 5 },
    red: { gk: 6, def: 7, mid1: 8, mid2: 9, att: 10 }
  }
  return defaults[props.team]?.[props.position] || 1
}

function getDefaultPosition() {
  // Fallback to default positions if field position not found
  const defaults = {
    blue: {
      gk: { left: '5%', top: '40%' },
      def: { left: '18%', top: '40%' },
      mid1: { left: '35%', top: '18%' },  // Closer to top sideline
      mid2: { left: '35%', top: '62%' },  // Closer to bottom sideline
      att: { left: '55%', top: '40%' }
    },
    red: {
      gk: { right: '5%', top: '40%' },
      def: { right: '18%', top: '40%' },
      mid1: { right: '35%', top: '18%' },  // Closer to top sideline
      mid2: { right: '35%', top: '62%' },  // Closer to bottom sideline
      att: { right: '55%', top: '40%' }
    }
  }
  return defaults[props.team]?.[props.position] || { left: '5%', top: '40%' }
}
</script>

<style scoped>
.player {
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
              right 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
              top 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: left, right, top;
  /* Force hardware acceleration */
  transform: translateZ(0);
  backface-visibility: hidden;
}

.player-sprite {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: crisp-edges;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .player {
    width: 60px !important;
    height: 60px !important;
  }
}
</style>

