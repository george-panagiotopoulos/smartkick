<template>
  <div v-if="show" class="question-modal-overlay" @click.self="handleClose">
    <div class="question-modal">
      <div class="question-header">
        <h2>{{ languageStore.t('ui.question', 'Question') }}</h2>
        <button class="close-btn" @click="handleClose" v-if="canClose">×</button>
      </div>
      
      <div class="question-content">
        <p class="question-text">{{ questionText }}</p>
        
        <div class="answers">
          <button
            v-for="(answer, index) in answers"
            :key="index"
            class="answer-btn"
            :class="{ 'selected': selectedAnswer === index }"
            @click="selectAnswer(index)"
            :disabled="answered"
          >
            {{ answer }}
          </button>
        </div>
      </div>
      
      <div class="question-footer">
        <button
          v-if="selectedAnswer !== null && !answered"
          class="submit-btn"
          @click="submitAnswer"
        >
          {{ languageStore.t('ui.submit', 'Submit') }}
        </button>
        <div v-if="answered" class="result-message" :class="{ 'correct': isCorrect, 'incorrect': !isCorrect }">
          {{ isCorrect ? languageStore.t('ui.correct', 'Correct!') : languageStore.t('ui.incorrect', 'Incorrect!') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useLanguageStore } from '../store/languageStore'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  question: {
    type: Object,
    default: null
  },
  canClose: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['answer', 'close'])

const languageStore = useLanguageStore()

const selectedAnswer = ref(null)
const answered = ref(false)
const isCorrect = ref(false)

// Use stubbed question if no question provided
const questionText = ref('What is 1+1?')
const answers = ref(['0', '1', '2', '3'])
const correctAnswerIndex = ref(2) // Answer '2' is correct

watch(() => props.question, (newQuestion) => {
  if (newQuestion) {
    // Support both formats: {text, options, correctAnswer} and {question, answers, correct_answer}
    questionText.value = newQuestion.text || newQuestion.question || 'What is 1+1?'
    answers.value = newQuestion.options || newQuestion.answers || ['0', '1', '2', '3']
    correctAnswerIndex.value = newQuestion.correctAnswer !== undefined 
      ? newQuestion.correctAnswer 
      : (newQuestion.correct_answer !== undefined ? newQuestion.correct_answer : 2)
  } else {
    // Use default stubbed question
    questionText.value = 'What is 1+1?'
    answers.value = ['0', '1', '2', '3']
    correctAnswerIndex.value = 2
  }
}, { immediate: true })

watch(() => props.show, (newShow) => {
  if (newShow) {
    // Reset state when modal opens
    selectedAnswer.value = null
    answered.value = false
    isCorrect.value = false
  }
})

function selectAnswer(index) {
  if (!answered.value) {
    selectedAnswer.value = index
  }
}

function submitAnswer() {
  if (selectedAnswer.value === null) return
  
  answered.value = true
  isCorrect.value = selectedAnswer.value === correctAnswerIndex.value
  
  // Emit answer after a brief delay to show result
  setTimeout(() => {
    emit('answer', {
      answerIndex: selectedAnswer.value,
      correct: isCorrect.value
    })
  }, 1000)
}

function handleClose() {
  if (props.canClose && !answered.value) {
    emit('close')
  }
}
</script>

<style scoped>
.question-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.question-modal {
  background: white;
  border-radius: 20px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 15px;
}

.question-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 32px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  line-height: 32px;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #333;
}

.question-content {
  margin-bottom: 20px;
}

.question-text {
  font-size: 20px;
  color: #333;
  margin-bottom: 25px;
  font-weight: 500;
  text-align: center;
}

.answers {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.answer-btn {
  padding: 20px;
  font-size: 18px;
  font-weight: bold;
  border: 3px solid #ddd;
  border-radius: 10px;
  background: white;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 60px;
}

.answer-btn:hover:not(:disabled) {
  border-color: #4CAF50;
  background: #f0f8f0;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.answer-btn.selected {
  border-color: #2196F3;
  background: #e3f2fd;
}

.answer-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.question-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50px;
}

.submit-btn {
  padding: 15px 40px;
  font-size: 18px;
  font-weight: bold;
  border: none;
  border-radius: 10px;
  background: #4CAF50;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.result-message {
  font-size: 24px;
  font-weight: bold;
  padding: 15px 30px;
  border-radius: 10px;
  animation: scaleIn 0.3s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.result-message.correct {
  color: #4CAF50;
  background: #e8f5e9;
}

.result-message.incorrect {
  color: #f44336;
  background: #ffebee;
}

@media (max-width: 768px) {
  .question-modal {
    padding: 20px;
    width: 95%;
  }
  
  .question-text {
    font-size: 18px;
  }
  
  .answers {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .answer-btn {
    padding: 15px;
    font-size: 16px;
    min-height: 50px;
  }
}
</style>

