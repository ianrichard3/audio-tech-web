<script setup lang="ts">
import { computed } from 'vue'
import { suggestionsStore } from '@/stores/suggestions'
import { strings } from '@/ui/strings'

const t = strings
const store = suggestionsStore

const textValid = computed(() => store.intentText.trim().length > 0)
const intentSummary = computed(() => {
  const intent = store.intent
  if (!intent) return []
  const lines: string[] = []
  if (intent.task) lines.push(`${t.suggestions.intent.fields.task}: ${intent.task}`)
  if (intent.source) lines.push(`${t.suggestions.intent.fields.source}: ${intent.source}`)
  if (intent.destination) lines.push(`${t.suggestions.intent.fields.destination}: ${intent.destination}`)
  if (intent.chain && Array.isArray(intent.chain) && intent.chain.length > 0) {
    lines.push(`${t.suggestions.intent.fields.chain}: ${intent.chain.join(', ')}`)
  }
  if (intent.notes) lines.push(`${t.suggestions.intent.fields.notes}: ${intent.notes}`)
  return lines
})

const submit = async () => {
  if (!textValid.value) return
  await store.generateFromIntent()
}
</script>

<template>
  <div class="intent-form">
    <div class="field">
      <label>{{ t.suggestions.intent.label }}</label>
      <textarea
        v-model="store.intentText"
        class="input"
        rows="4"
        :placeholder="t.suggestions.intent.placeholder"
      />
    </div>

    <div v-if="store.intent" class="intent-summary">
      <h4>{{ t.suggestions.intent.summary }}</h4>
      <ul>
        <li v-for="line in intentSummary" :key="line">{{ line }}</li>
      </ul>
      <div v-if="store.intentWarnings.length" class="intent-warnings">
        <strong>{{ t.suggestions.intent.warnings }}</strong>
        <ul>
          <li v-for="warning in store.intentWarnings" :key="warning">{{ warning }}</li>
        </ul>
      </div>
    </div>

    <div v-if="!textValid" class="validation">
      {{ t.suggestions.validation.intentForm }}
    </div>

    <button class="primary-btn" :disabled="!textValid || store.loading.plans" @click="submit">
      {{ store.loading.plans ? t.suggestions.loading : t.suggestions.generate }}
    </button>
  </div>
</template>

<style scoped>
.intent-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-3);
  border: 1px solid var(--border-default);
  background: var(--surface-1);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  color: var(--text-secondary);
}

.input {
  background: var(--surface-2);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-2);
  color: var(--text-primary);
  padding: 10px 12px;
  resize: vertical;
}

.intent-summary {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-2);
  padding: var(--space-3);
  background: var(--surface-2);
  color: var(--text-secondary);
}

.intent-summary ul {
  margin: var(--space-2) 0 0 0;
  padding-left: 18px;
  color: var(--text-primary);
}

.intent-warnings {
  margin-top: var(--space-3);
  color: var(--warning);
}

.intent-warnings ul {
  margin: var(--space-2) 0 0 0;
  padding-left: 18px;
}

.validation {
  color: var(--warning);
  font-size: 0.9rem;
}

.primary-btn {
  align-self: flex-start;
  background-color: var(--accent);
  color: #0f120e;
  border: none;
  padding: 10px 18px;
  border-radius: var(--radius-2);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
