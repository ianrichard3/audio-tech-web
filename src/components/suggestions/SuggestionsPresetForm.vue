<script setup lang="ts">
import { computed, ref } from 'vue'
import { suggestionsStore } from '@/stores/suggestions'
import { strings } from '@/ui/strings'

const t = strings
const store = suggestionsStore
const showAdvanced = ref(false)

const presets = [
  { value: 'record_vocals', label: t.suggestions.presets.recordVocals },
  { value: 'record_guitar', label: t.suggestions.presets.recordGuitar },
  { value: 'reamp', label: t.suggestions.presets.reamp },
  { value: 'hardware_insert', label: t.suggestions.presets.hardwareInsert },
]

const limitValue = computed({
  get: () => store.options.limit ?? 3,
  set: (value: number) => store.updateOptions({ limit: value }),
})

const maxHopsValue = computed({
  get: () => store.options.max_hops ?? 6,
  set: (value: number) => store.updateOptions({ max_hops: value }),
})

const allowUnsafeValue = computed({
  get: () => Boolean(store.options.allow_unsafe),
  set: (value: boolean) => store.updateOptions({ allow_unsafe: value }),
})

const presetValid = computed(() => Boolean(store.presetId))
const limitValid = computed(() => (limitValue.value ?? 0) >= 1 && (limitValue.value ?? 0) <= 10)
const hopsValid = computed(() => (maxHopsValue.value ?? 0) >= 1 && (maxHopsValue.value ?? 0) <= 12)
const formValid = computed(() => presetValid.value && limitValid.value && hopsValid.value)

const submit = async () => {
  if (!formValid.value) return
  await store.generateFromPreset()
}
</script>

<template>
  <div class="preset-form">
    <div class="field">
      <label>{{ t.suggestions.presets.label }}</label>
      <select v-model="store.presetId" class="input">
        <option value="" disabled>{{ t.suggestions.presets.placeholder }}</option>
        <option v-for="preset in presets" :key="preset.value" :value="preset.value">
          {{ preset.label }}
        </option>
      </select>
    </div>

    <button class="link-btn" @click="showAdvanced = !showAdvanced">
      {{ showAdvanced ? t.suggestions.options.hideAdvanced : t.suggestions.options.showAdvanced }}
    </button>

    <div v-if="showAdvanced" class="advanced-grid">
      <div class="field">
        <label>{{ t.suggestions.options.limit }}</label>
        <input v-model.number="limitValue" class="input" type="number" min="1" max="10" />
      </div>
      <div class="field">
        <label>{{ t.suggestions.options.maxHops }}</label>
        <input v-model.number="maxHopsValue" class="input" type="number" min="1" max="12" />
      </div>
      <label class="checkbox">
        <input v-model="allowUnsafeValue" type="checkbox" />
        <span>{{ t.suggestions.options.allowUnsafe }}</span>
      </label>
    </div>

    <div v-if="!formValid" class="validation">
      {{ t.suggestions.validation.presetForm }}
    </div>

    <button class="primary-btn" :disabled="!formValid || store.loading.plans" @click="submit">
      {{ store.loading.plans ? t.suggestions.loading : t.suggestions.generate }}
    </button>
  </div>
</template>

<style scoped>
.preset-form {
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
}

.link-btn {
  background: transparent;
  border: none;
  color: var(--accent-2);
  cursor: pointer;
  text-align: left;
  padding: 0;
  font-weight: 600;
}

.advanced-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-3);
}

.checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-secondary);
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
