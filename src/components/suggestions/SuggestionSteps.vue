<script setup lang="ts">
import { computed } from 'vue'
import { strings } from '@/ui/strings'
import { store as appStore } from '@/store'
import type { PlanStep } from '@/types/suggestions'

const t = strings

const props = defineProps<{
  steps: PlanStep[]
}>()

const patchSteps = computed(() => props.steps.filter(step => step.type === 'PATCH'))
const infoSteps = computed(() => props.steps.filter(step => step.type === 'INFO'))

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

const patchStepLabel = (a: number, b: number) => {
  return `${patchLabel(a)} → ${patchLabel(b)}`
}

const copyInfoSteps = async () => {
  if (!infoSteps.value.length) return
  const text = infoSteps.value.map(step => (step as any).message).join('\n')
  try {
    await navigator.clipboard.writeText(text)
    appStore.pushToast({ type: 'success', message: t.suggestions.copySuccess })
  } catch (err) {
    appStore.pushToast({ type: 'error', message: t.suggestions.copyFailed })
  }
}
</script>

<template>
  <div class="steps">
    <div v-if="patchSteps.length" class="steps-group">
      <h5>{{ t.suggestions.steps.patch }}</h5>
      <ul>
        <li v-for="(step, idx) in patchSteps" :key="idx">
          {{ patchStepLabel((step as any).patch_point_a_id, (step as any).patch_point_b_id) }}
        </li>
      </ul>
    </div>

    <div v-if="infoSteps.length" class="steps-group info">
      <div class="info-header">
        <h5>{{ t.suggestions.steps.info }}</h5>
        <button class="link-btn" @click="copyInfoSteps">{{ t.suggestions.copyInstructions }}</button>
      </div>
      <ul>
        <li v-for="(step, idx) in infoSteps" :key="idx">
          {{ (step as any).message }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.steps-group {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-2);
  padding: var(--space-3);
  background: var(--surface-2);
}

.steps-group.info {
  border-color: rgba(212, 154, 79, 0.5);
}

.steps-group h5 {
  margin: 0 0 var(--space-2) 0;
}

.steps-group ul {
  margin: 0;
  padding-left: 18px;
  color: var(--text-secondary);
}

.info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.link-btn {
  background: transparent;
  border: none;
  color: var(--accent-2);
  cursor: pointer;
  font-weight: 600;
}
</style>
