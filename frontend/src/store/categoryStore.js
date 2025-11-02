import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCategoryStore = defineStore('category', () => {
  // Available categories (loaded from backend)
  const availableCategories = ref([])
  
  // Selected categories (default: all available)
  const selectedCategories = ref([])
  
  // Load categories from backend
  async function loadCategories() {
    try {
      const { getQuestionCategories } = await import('../services/api')
      const categories = await getQuestionCategories()
      availableCategories.value = categories || []
      
      // If no categories are selected yet, select all by default
      if (selectedCategories.value.length === 0 && categories.length > 0) {
        selectedCategories.value = [...categories]
        // Save to localStorage
        localStorage.setItem('footballEdu_selectedCategories', JSON.stringify(categories))
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      // Fallback to default categories
      availableCategories.value = ['math_1', 'math_2', 'math_3', 'english_1', 'german_1', 'greek_1', 'geography_1']
      if (selectedCategories.value.length === 0) {
        selectedCategories.value = [...availableCategories.value]
      }
    }
  }
  
  // Initialize categories from localStorage
  async function initializeCategories() {
    const savedCategories = localStorage.getItem('footballEdu_selectedCategories')
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories)
        selectedCategories.value = parsed
      } catch (error) {
        console.warn('Error parsing saved categories:', error)
      }
    }
    
    // Load available categories from backend
    await loadCategories()
    
    // If selected categories are not in available categories, reset to all available
    const validSelected = selectedCategories.value.filter(cat => 
      availableCategories.value.includes(cat)
    )
    if (validSelected.length === 0 && availableCategories.value.length > 0) {
      selectedCategories.value = [...availableCategories.value]
      localStorage.setItem('footballEdu_selectedCategories', JSON.stringify(availableCategories.value))
    } else if (validSelected.length !== selectedCategories.value.length) {
      selectedCategories.value = validSelected
      localStorage.setItem('footballEdu_selectedCategories', JSON.stringify(validSelected))
    }
  }
  
  // Toggle category selection
  function toggleCategory(category) {
    const index = selectedCategories.value.indexOf(category)
    if (index > -1) {
      // Remove category
      selectedCategories.value.splice(index, 1)
    } else {
      // Add category
      selectedCategories.value.push(category)
    }
    // Save to localStorage
    localStorage.setItem('footballEdu_selectedCategories', JSON.stringify(selectedCategories.value))
  }
  
  // Select all categories
  function selectAllCategories() {
    selectedCategories.value = [...availableCategories.value]
    localStorage.setItem('footballEdu_selectedCategories', JSON.stringify(selectedCategories.value))
  }
  
  // Deselect all categories
  function deselectAllCategories() {
    selectedCategories.value = []
    localStorage.setItem('footballEdu_selectedCategories', JSON.stringify([]))
  }
  
  // Format category name for display (e.g., "math_1" -> "Math 1")
  function formatCategoryName(category) {
    const parts = category.split('_')
    if (parts.length >= 2) {
      const name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
      const number = parts.slice(1).join(' ')
      return `${name} ${number}`
    }
    return category.charAt(0).toUpperCase() + category.slice(1)
  }
  
  // Computed: sorted available categories
  const sortedAvailableCategories = computed(() => {
    return [...availableCategories.value].sort()
  })
  
  // Computed: has any categories selected
  const hasSelectedCategories = computed(() => {
    return selectedCategories.value.length > 0
  })
  
  return {
    availableCategories,
    selectedCategories,
    sortedAvailableCategories,
    hasSelectedCategories,
    loadCategories,
    initializeCategories,
    toggleCategory,
    selectAllCategories,
    deselectAllCategories,
    formatCategoryName
  }
})

