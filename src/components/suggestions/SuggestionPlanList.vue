<script setup lang="ts">
import { suggestionsStore } from '@/stores/suggestions'
import { strings } from '@/ui/strings'
import SuggestionPlanCard from './SuggestionPlanCard.vue'

const t = strings
const store = suggestionsStore
</script>

<template>
  <div class="plan-list">
    <header class="plan-header">
      <h3>{{ t.suggestions.plans.title }}</h3>
      <p class="subtitle">{{ t.suggestions.plans.subtitle }}</p>
    </header>

    <div v-if="!store.plans.length" class="empty">
      {{ t.suggestions.plans.empty }}
    </div>

    <div v-else class="cards">
      <SuggestionPlanCard
        v-for="(plan, index) in store.plans"
        :key="`${plan.preset_id}-${index}`"
        :plan="plan"
        :index="index"
        :selected="store.selectedPlanIndex === index"
        :previewed="store.previewPlanIndex === index"
        :preview-conflict="store.previewPlanIndex === index ? store.previewConflict : null"
        :loading-preview="store.loading.preview"
        :loading-apply="store.loading.apply"
        @preview="store.previewPlan(plan, index)"
        @apply="store.applyPlan(plan, index)"
      />
    </div>
  </div>
</template>

<style scoped>
.plan-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.plan-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.plan-header h3 {
  margin: 0;
  font-size: 1.4rem;
}

.subtitle {
  margin: 0;
  color: var(--text-muted);
}

.empty {
  padding: var(--space-4);
  border-radius: var(--radius-2);
  border: 1px dashed var(--border-default);
  color: var(--text-muted);
}

.cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
</style>
