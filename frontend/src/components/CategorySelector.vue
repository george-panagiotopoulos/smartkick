<template>
  <div class="category-selector">
    <button
      class="category-btn"
      @click="toggleCategoryMenu"
      :aria-label="`${languageStore.t('ui.category', 'Category')}: ${selectedCountText}`"
    >
      <span class="category-icon">📚</span>
      <span class="category-text">{{ selectedCountText }}</span>
      <span class="arrow" :class="{ open: showMenu }">▼</span>
    </button>
    
    <div v-if="showMenu" class="category-menu">
      <div class="menu-header">
        <h3>{{ languageStore.t('ui.select_categories', 'Select Categories') }}</h3>
        <div class="menu-actions">
          <button class="action-link" @click="selectAll">{{ languageStore.t('ui.select_all', 'Select All') }}</button>
          <button class="action-link" @click="deselectAll">{{ languageStore.t('ui.deselect_all', 'Deselect All') }}</button>
        </div>
      </div>
      <div v-if="categoryStore.sortedAvailableCategories.length === 0" class="loading">
        {{ languageStore.t('ui.loading_categories', 'Loading categories...') }}
      </div>
      <div v-else class="category-list">
        <button
          v-for="category in categoryStore.sortedAvailableCategories"
          :key="category"
          class="category-option"
          :class="{ active: categoryStore.selectedCategories.includes(category) }"
          @click="toggleCategory(category)"
        >
          <span class="checkbox" :class="{ checked: categoryStore.selectedCategories.includes(category) }">
            {{ categoryStore.selectedCategories.includes(category) ? '✓' : '' }}
          </span>
          <span class="category-name">{{ categoryStore.formatCategoryName(category) }}</span>
        </button>
      </div>
      <div v-if="categoryStore.sortedAvailableCategories.length > 0 && !categoryStore.hasSelectedCategories" class="warning">
        {{ languageStore.t('ui.no_categories_selected', 'No categories selected! Please select at least one.') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCategoryStore } from '../store/categoryStore'
import { useLanguageStore } from '../store/languageStore'

const categoryStore = useCategoryStore()
const languageStore = useLanguageStore()
const showMenu = ref(false)

const selectedCountText = computed(() => {
  const count = categoryStore.selectedCategories.length
  const total = categoryStore.availableCategories.length
  
  if (total === 0) {
    // Categories not loaded yet
    return 'Categories...'
  } else if (count === 0) {
    return 'Select Categories'
  } else if (count === total) {
    return 'All Categories'
  } else {
    return `${count}/${total}`
  }
})

function toggleCategoryMenu() {
  showMenu.value = !showMenu.value
}

function toggleCategory(category) {
  categoryStore.toggleCategory(category)
}

function selectAll() {
  categoryStore.selectAllCategories()
}

function deselectAll() {
  categoryStore.deselectAllCategories()
}

// Close menu when clicking outside
function handleClickOutside(event) {
  if (!event.target.closest('.category-selector')) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // Initialize category store
  categoryStore.initializeCategories()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.category-selector {
  position: relative;
  display: inline-block;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(76, 175, 80, 0.7);
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.category-btn:hover {
  background: rgba(76, 175, 80, 0.9);
  border-color: rgba(255, 255, 255, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.category-icon {
  font-size: 20px;
}

.category-text {
  font-size: 14px;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.arrow {
  font-size: 10px;
  transition: transform 0.3s ease;
  margin-left: 4px;
}

.arrow.open {
  transform: rotate(180deg);
}

.category-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: rgba(26, 95, 47, 0.95);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 12px;
  min-width: 220px;
  max-width: 300px;
  max-height: 400px;
  overflow-y: auto;
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

.menu-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.menu-header h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: white;
  font-weight: bold;
}

.menu-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.action-link {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s ease;
  padding: 2px 4px;
}

.action-link:hover {
  color: white;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 280px;
  overflow-y: auto;
}

.category-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.category-option:hover {
  background: rgba(255, 255, 255, 0.15);
}

.category-option.active {
  background: rgba(255, 255, 255, 0.25);
}

.checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 12px;
  font-weight: bold;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.checkbox.checked {
  background: rgba(76, 175, 80, 0.8);
  border-color: rgba(76, 175, 80, 1);
}

.category-name {
  flex: 1;
}

.loading {
  margin: 12px 0;
  padding: 12px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.warning {
  margin-top: 12px;
  padding: 8px;
  background: rgba(255, 152, 0, 0.2);
  border: 1px solid rgba(255, 152, 0, 0.5);
  border-radius: 4px;
  color: #FF9800;
  font-size: 12px;
  text-align: center;
}

@media (max-width: 768px) {
  .category-btn {
    padding: 8px 12px;
    font-size: 14px;
    min-width: 100px;
  }
  
  .category-text {
    font-size: 12px;
  }
  
  .category-icon {
    font-size: 18px;
  }
  
  .category-menu {
    right: 0;
    min-width: 200px;
    max-width: 280px;
  }
  
  .category-option {
    padding: 8px 10px;
    font-size: 13px;
  }
  
  .checkbox {
    width: 18px;
    height: 18px;
    font-size: 11px;
  }
}

/* Custom scrollbar for category list */
.category-list::-webkit-scrollbar {
  width: 6px;
}

.category-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.category-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.category-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>

