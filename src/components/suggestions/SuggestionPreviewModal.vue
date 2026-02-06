<script setup lang="ts">
import { computed } from 'vue'
import { strings } from '@/ui/strings'
import type { PreviewResponse, PreviewCable } from '@/types/suggestions'
import { store as appStore } from '@/store'

const t = strings

const props = defineProps<{
  preview: PreviewResponse | null
  conflict: Record<string, unknown> | null
  planIndex: number | null
  loading: boolean
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'refresh'): void
}>()

const title = computed(() => {
  if (props.planIndex === null) return t.suggestions.previewTitle
  return `${t.suggestions.previewTitle} ${t.suggestions.plans.planLabel(props.planIndex + 1)}`
})

const cables = computed(() => props.preview?.patch_cables_to_create || [])
const touched = computed(() => props.preview?.touched_patch_points || [])

const conflictDetails = computed(() => {
  const conflicts = (props.conflict as any)?.conflicts
  const touchedPoints = (props.conflict as any)?.touched_patch_points
  return {
    conflicts: Array.isArray(conflicts) ? conflicts : [],
    touched: Array.isArray(touchedPoints) ? touchedPoints : [],
  }
})

const patchLabel = (patchId: number) => {
  const mapped = appStore.getDeviceByPatchbayId(patchId)
  const patchPoint = appStore.patchbayNodes.find(node => node.id === patchId)
  if (mapped) {
    return `${mapped.device.name} — ${mapped.port.label}`
  }
  if (patchPoint?.name) {
    return `#${patchId} — ${patchPoint.name}`
  }
  return `#${patchId}`
}

const cableLabel = (cable: PreviewCable) => {
  const a = cable.patch_point_a_id
  const b = cable.patch_point_b_id
  if (typeof a === 'number' && typeof b === 'number') {
    return `${patchLabel(a)} → ${patchLabel(b)}`
  }
  return t.suggestions.previewUnknown
}

const touchedLabel = (patchId: number) => patchLabel(patchId)
</script>

<template>
  <div class="modal-backdrop">
    <div class="modal">
      <header>
        <h3>{{ title }}</h3>
        <button class="close-btn" @click="emit('close')">{{ t.app.closeSymbol }}</button>
      </header>

      <div v-if="loading" class="loading">{{ t.suggestions.loading }}</div>

      <div v-else-if="conflict" class="conflict">
        <h4>{{ t.suggestions.conflictTitle }}</h4>
        <p>{{ t.suggestions.conflictMessage }}</p>
        <div v-if="conflictDetails.touched.length" class="list">
          <strong>{{ t.suggestions.touchedTitle }}</strong>
          <ul>
            <li v-for="point in conflictDetails.touched" :key="point">{{ touchedLabel(point) }}</li>
          </ul>
        </div>
        <div v-if="conflictDetails.conflicts.length" class="list">
          <strong>{{ t.suggestions.conflictsTitle }}</strong>
          <ul>
            <li v-for="(_item, idx) in conflictDetails.conflicts" :key="idx">
              {{ t.suggestions.conflictItem(idx + 1) }}
            </li>
          </ul>
        </div>
        <div class="actions">
          <button class="ghost-btn" @click="emit('refresh')">{{ t.suggestions.refresh }}</button>
          <button class="primary-btn" @click="emit('close')">{{ t.suggestions.close }}</button>
        </div>
      </div>

      <div v-else class="preview">
        <div class="list">
          <strong>{{ t.suggestions.cablesTitle }}</strong>
          <ul>
            <li v-for="(cable, idx) in cables" :key="idx">{{ cableLabel(cable) }}</li>
          </ul>
        </div>
        <div v-if="touched.length" class="list">
          <strong>{{ t.suggestions.touchedTitle }}</strong>
          <ul>
            <li v-for="point in touched" :key="point">{{ touchedLabel(point) }}</li>
          </ul>
        </div>
        <div class="actions">
          <button class="ghost-btn" @click="emit('refresh')">{{ t.suggestions.refresh }}</button>
          <button class="primary-btn" @click="emit('close')">{{ t.suggestions.close }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(8, 8, 8, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--surface-1);
  border-radius: var(--radius-3);
  border: 1px solid var(--border-default);
  padding: var(--space-4);
  width: min(620px, 92vw);
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--shadow-2);
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

header h3 {
  margin: 0;
}

.close-btn {
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-round);
  width: 32px;
  height: 32px;
  color: var(--text-secondary);
  cursor: pointer;
}

.loading {
  padding: var(--space-4);
  text-align: center;
  color: var(--text-muted);
}

.list {
  margin-bottom: var(--space-3);
}

.list ul {
  margin: var(--space-2) 0 0 0;
  padding-left: 18px;
  color: var(--text-secondary);
}

.conflict h4 {
  margin: 0 0 var(--space-2) 0;
  color: var(--warning);
}

.conflict p {
  margin: 0 0 var(--space-3) 0;
  color: var(--text-secondary);
}

.actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-top: var(--space-3);
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
</style>
