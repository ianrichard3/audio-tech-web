<script setup lang="ts">
import { store } from '../store'
import { strings } from './strings'

const t = strings

const dismiss = (id: string) => {
  store.dismissToast(id)
}
</script>

<template>
  <div class="toast-host" aria-live="polite">
    <div
      v-for="toast in store.toasts"
      :key="toast.id"
      class="toast"
      :class="`toast-${toast.type}`"
      role="status"
    >
      <div class="toast-message">{{ toast.message }}</div>
      <button class="toast-close" :aria-label="t.app.dismiss" @click="dismiss(toast.id)">
        {{ t.app.closeSymbol }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: var(--space-6);
  right: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  z-index: 3000;
}

.toast {
  min-width: 240px;
  max-width: 320px;
  background: var(--surface-2);
  color: var(--text-primary);
  border-radius: var(--radius-3);
  border: 1px solid var(--border-default);
  padding: var(--space-3) var(--space-3);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
  box-shadow: var(--shadow-1);
  animation: toast-in 0.25s ease-out;
}

.toast-message {
  font-size: 0.95rem;
  line-height: 1.4;
}

.toast-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0;
}

.toast-success {
  border-color: rgba(106, 163, 111, 0.7);
}

.toast-error {
  border-color: rgba(176, 75, 61, 0.7);
}

.toast-info {
  border-color: rgba(143, 192, 155, 0.6);
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 720px) {
  .toast-host {
    right: var(--space-4);
    left: var(--space-4);
  }

  .toast {
    max-width: none;
  }
}
</style>
