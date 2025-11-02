<template>
  <div class="language-toggle">
    <button
      class="language-btn"
      @click="toggleLanguageMenu"
      :aria-label="`${languageStore.t('ui.language', 'Language')}: ${languageStore.currentLanguageInfo.name}`"
    >
      <span class="flag">{{ languageStore.currentLanguageInfo.flag }}</span>
      <span class="language-code">{{ languageStore.currentLanguage.toUpperCase() }}</span>
      <span class="arrow" :class="{ open: showMenu }">▼</span>
    </button>
    
    <div v-if="showMenu" class="language-menu">
      <button
        v-for="lang in languageStore.availableLanguages"
        :key="lang.code"
        class="language-option"
        :class="{ active: languageStore.currentLanguage === lang.code }"
        @click="selectLanguage(lang.code)"
      >
        <span class="flag">{{ lang.flag }}</span>
        <span class="language-name">{{ lang.name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useLanguageStore } from '../store/languageStore'

const languageStore = useLanguageStore()
const showMenu = ref(false)

function toggleLanguageMenu() {
  showMenu.value = !showMenu.value
}

function selectLanguage(langCode) {
  languageStore.setLanguage(langCode)
  showMenu.value = false
}

// Close menu when clicking outside
function handleClickOutside(event) {
  if (!event.target.closest('.language-toggle')) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // Initialize language store
  languageStore.initializeLanguage()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.language-toggle {
  position: relative;
  display: inline-block;
}

.language-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
  justify-content: center;
}

.language-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.flag {
  font-size: 20px;
}

.language-code {
  font-size: 14px;
  letter-spacing: 1px;
}

.arrow {
  font-size: 10px;
  transition: transform 0.3s ease;
  margin-left: 4px;
}

.arrow.open {
  transform: rotate(180deg);
}

.language-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: rgba(26, 95, 47, 0.95);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 8px;
  min-width: 160px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.language-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.language-option:hover {
  background: rgba(255, 255, 255, 0.2);
}

.language-option.active {
  background: rgba(255, 255, 255, 0.3);
  font-weight: bold;
}

.language-option .flag {
  font-size: 24px;
}

.language-name {
  flex: 1;
}

@media (max-width: 768px) {
  .language-btn {
    padding: 8px 12px;
    font-size: 14px;
    min-width: 70px;
  }
  
  .language-code {
    font-size: 12px;
  }
  
  .flag {
    font-size: 18px;
  }
  
  .language-menu {
    right: 0;
    min-width: 140px;
  }
  
  .language-option {
    padding: 10px 12px;
    font-size: 14px;
  }
}
</style>

