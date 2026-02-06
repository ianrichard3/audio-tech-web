<script setup lang="ts">
import { computed } from 'vue'
import { suggestionsStore } from '@/stores/suggestions'
import { strings } from '@/ui/strings'
import SuggestionsPresetForm from './SuggestionsPresetForm.vue'
import SuggestionsIntentForm from './SuggestionsIntentForm.vue'
import SuggestionPlanList from './SuggestionPlanList.vue'
import SuggestionPreviewModal from './SuggestionPreviewModal.vue'
import { store as appStore } from '@/store'

const t = strings
const store = suggestionsStore
const isDev = import.meta.env.DEV

const modeLabel = computed(() =>
  store.mode === 'preset' ? t.suggestions.modes.presets : t.suggestions.modes.intent
)

const openPreview = computed(() => store.previewOpen)

const closePreview = () => {
  store.previewOpen = false
}

const refreshState = async () => {
  await appStore.loadData()
}
</script>

<template>
  <section class="suggestions-panel">
    <header class="panel-header">
      <div>
        <h2>{{ t.suggestions.title }}</h2>
        <p class="subtitle">{{ t.suggestions.subtitle }}</p>
      </div>
      <div class="mode-chip">{{ modeLabel }}</div>
    </header>

    <div class="mode-toggle">
      <button
        class="toggle-btn"
        :class="{ active: store.mode === 'preset' }"
        @click="store.setMode('preset')"
      >
        {{ t.suggestions.modes.presets }}
      </button>
      <button
        class="toggle-btn"
        :class="{ active: store.mode === 'intent' }"
        @click="store.setMode('intent')"
      >
        {{ t.suggestions.modes.intent }}
      </button>
      <label v-if="isDev" class="debug-toggle">
        <input v-model="store.debug" type="checkbox" />
        <span>{{ t.suggestions.debug }}</span>
      </label>
    </div>

    <div class="panel-body">
      <SuggestionsPresetForm v-if="store.mode === 'preset'" />
      <SuggestionsIntentForm v-else />

      <div v-if="store.error.kind !== 'none'" class="error-banner">
        <strong>{{ store.error.message }}</strong>
        <details v-if="store.error.details">
          <summary>{{ t.suggestions.details }}</summary>
          <pre>{{ store.error.details }}</pre>
        </details>
      </div>

      <SuggestionPlanList />
    </div>

    <SuggestionPreviewModal
      v-if="openPreview"
      :preview="store.preview"
      :conflict="store.previewConflict"
      :plan-index="store.previewPlanIndex"
      :loading="store.loading.preview"
      @close="closePreview"
      @refresh="refreshState"
    />
  </section>
</template>

<style scoped>
.suggestions-panel {
  background: var(--surface-2);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-3);
  padding: var(--space-5);
  margin-bottom: var(--space-5);
  box-shadow: var(--shadow-1);
  animation: fade-in 0.4s ease-out;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.panel-header h2 {
  margin: 0 0 var(--space-2) 0;
  font-size: 1.7rem;
}

.subtitle {
  margin: 0;
  color: var(--text-secondary);
}

.mode-chip {
  background: var(--surface-3);
  color: var(--text-secondary);
  border-radius: var(--radius-round);
  padding: 6px 14px;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.mode-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-bottom: var(--space-4);
}

.toggle-btn {
  border: 1px solid var(--border-default);
  background: var(--surface-1);
  color: var(--text-secondary);
  padding: 8px 14px;
  border-radius: var(--radius-2);
  cursor: pointer;
  font-weight: 600;
}

.toggle-btn.active {
  background: var(--accent);
  color: #0f120e;
  border-color: var(--accent);
}

.debug-toggle {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-muted);
  font-size: 0.85rem;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.error-banner {
  border: 1px solid rgba(212, 154, 79, 0.6);
  background: rgba(212, 154, 79, 0.12);
  padding: var(--space-3);
  border-radius: var(--radius-2);
  color: var(--text-secondary);
}

.error-banner pre {
  white-space: pre-wrap;
  margin: var(--space-2) 0 0 0;
  color: var(--text-muted);
}

@media (max-width: 960px) {
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .debug-toggle {
    margin-left: 0;
  }
}
</style>
