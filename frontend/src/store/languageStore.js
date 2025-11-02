import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLanguageStore = defineStore('language', () => {
  // Current language (default: English)
  const currentLanguage = ref('en')
  
  // Translations data (loaded from backend)
  const translations = ref({})
  
  // Available languages
  const availableLanguages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' }
  ]
  
  // Load translations from backend or public folder
  async function loadTranslations() {
    try {
      // Try backend API first
      const response = await fetch('/api/translations')
      if (response.ok) {
        translations.value = await response.json()
        return
      }
    } catch (error) {
      // Continue to fallback
    }
    
    // Fallback: load from public folder
    try {
      const fallbackResponse = await fetch('/translations.json')
      if (fallbackResponse.ok) {
        translations.value = await fallbackResponse.json()
      } else {
        console.warn('Could not load translations, using default')
      }
    } catch (error) {
      console.warn('Could not load translations:', error)
    }
  }
  
  // Set current language
  function setLanguage(langCode) {
    if (availableLanguages.some(lang => lang.code === langCode)) {
      currentLanguage.value = langCode
      // Save to localStorage for persistence
      localStorage.setItem('footballEdu_language', langCode)
    }
  }
  
  // Initialize language from localStorage
  function initializeLanguage() {
    const savedLanguage = localStorage.getItem('footballEdu_language')
    if (savedLanguage && availableLanguages.some(lang => lang.code === savedLanguage)) {
      currentLanguage.value = savedLanguage
    }
    // Load translations
    loadTranslations()
  }
  
  // Get translation helper
  function t(key, defaultValue = '') {
    const lang = translations.value[currentLanguage.value]
    if (!lang) return defaultValue
    
    // Support nested keys like 'ui.pass' or 'game.goal'
    const keys = key.split('.')
    let value = lang
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return defaultValue || key
      }
    }
    return value || defaultValue || key
  }
  
  // Computed property for current language info
  const currentLanguageInfo = computed(() => {
    return availableLanguages.find(lang => lang.code === currentLanguage.value) || availableLanguages[0]
  })
  
  return {
    currentLanguage,
    translations,
    availableLanguages,
    currentLanguageInfo,
    setLanguage,
    loadTranslations,
    initializeLanguage,
    t
  }
})

