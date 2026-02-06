<script setup lang="ts">
import { computed } from 'vue'
import { strings } from '@/ui/strings'
import type { SuggestionPlan } from '@/types/suggestions'
import SuggestionSteps from './SuggestionSteps.vue'

const t = strings

const props = defineProps<{
  plan: SuggestionPlan
  index: number
  selected: boolean
  previewed: boolean
  previewConflict: Record<string, unknown> | null
  loadingPreview: boolean
  loadingApply: boolean
}>()

const emit = defineEmits<{
  (event: 'preview'): void
  (event: 'apply'): void
}>()

const planTitle = computed(() => t.suggestions.plans.planLabel(props.index + 1))
</script>

<template>
  <article class="plan-card" :class="{ selected: selected, conflict: previewConflict }">
    <header class="plan-header">
      <div>
        <h4>{{ planTitle }}</h4>
        <span class="score">{{ t.suggestions.plans.score(plan.score) }}</span>
      </div>
      <div class="status">
        <span v-if="previewed" class="badge">{{ t.suggestions.plans.previewed }}</span>
        <span v-if="previewConflict" class="badge conflict">{{ t.suggestions.plans.conflict }}</span>
      </div>
    </header>

    <div v-if="plan.why?.length" class="section">
      <h5>{{ t.suggestions.plans.why }}</h5>
      <ul>
        <li v-for="item in plan.why" :key="item">{{ item }}</li>
      </ul>
    </div>

    <div v-if="plan.warnings?.length" class="section warnings">
      <h5>{{ t.suggestions.plans.warnings }}</h5>
      <ul>
        <li v-for="item in plan.warnings" :key="item">{{ item }}</li>
      </ul>
    </div>

    <SuggestionSteps :steps="plan.steps" />

    <div class="actions">
      <button class="ghost-btn" :disabled="loadingPreview" @click="emit('preview')">
        {{ loadingPreview ? t.suggestions.loading : t.suggestions.preview }}
      </button>
      <button class="primary-btn" :disabled="loadingApply" @click="emit('apply')">
        {{ loadingApply ? t.suggestions.loading : t.suggestions.apply }}
      </button>
      <span class="hint">{{ t.suggestions.plans.applyHint }}</span>
    </div>
  </article>
</template>

<style scoped>
.plan-card {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-3);
  padding: var(--space-4);
  background: var(--surface-1);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.plan-card.selected {
  border-color: var(--accent-2);
}

.plan-card.conflict {
  border-color: rgba(212, 154, 79, 0.8);
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
}

.plan-header h4 {
  margin: 0;
  font-size: 1.2rem;
}

.score {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.status {
  display: flex;
  gap: var(--space-2);
}

.badge {
  background: var(--surface-3);
  padding: 4px 8px;
  border-radius: var(--radius-round);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.badge.conflict {
  background: rgba(212, 154, 79, 0.2);
  color: var(--warning);
}

.section h5 {
  margin: 0 0 var(--space-2) 0;
}

.section ul {
  margin: 0;
  padding-left: 18px;
  color: var(--text-secondary);
}

.section.warnings {
  color: var(--warning);
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.primary-btn {
  background-color: var(--accent);
  color: #0f120e;
  border: none;
  padding: 8px 14px;
  border-radius: var(--radius-2);
  font-weight: 600;
  cursor: pointer;
}

.ghost-btn {
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  padding: 8px 14px;
  border-radius: var(--radius-2);
  font-weight: 600;
  cursor: pointer;
}

.primary-btn:disabled,
.ghost-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hint {
  color: var(--text-muted);
  font-size: 0.8rem;
}
</style>
