<script setup lang="ts">
import { strings } from './strings'

const t = strings

defineProps<{ title: string; message: string; confirmLabel?: string; cancelLabel?: string }>()

defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <div class="confirm-overlay" role="dialog" aria-modal="true">
    <div class="confirm-card">
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <div class="confirm-actions">
        <button class="btn ghost" @click="$emit('cancel')">
          {{ cancelLabel || t.confirm.cancel }}
        </button>
        <button class="btn solid" @click="$emit('confirm')">
          {{ confirmLabel || t.confirm.confirm }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(9, 8, 6, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2500;
}

.confirm-card {
  background: var(--surface-2);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-3);
  padding: var(--space-5);
  max-width: 360px;
  width: calc(100% - 40px);
  box-shadow: var(--shadow-2);
}

.confirm-card h3 {
  margin: 0 0 var(--space-2);
  font-size: 1.4rem;
}

.confirm-card p {
  margin: 0 0 var(--space-4);
  color: var(--text-secondary);
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.btn {
  border-radius: var(--radius-2);
  border: 1px solid transparent;
  padding: 8px 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn.ghost {
  background: transparent;
  border-color: var(--border-default);
  color: var(--text-secondary);
}

.btn.solid {
  background: var(--accent);
  color: #0d0f0c;
}
</style>
