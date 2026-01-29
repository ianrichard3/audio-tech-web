<script setup lang="ts">
import { computed } from 'vue'
import { useAuthz } from '@/lib/authz'
import { store } from '@/store'
import { strings } from '@/ui/strings'
import logoUrl from '@/assets/el-riche-mark.svg'

const t = strings
const { orgId, userId, plan, role } = useAuthz()

const accessInfo = computed(() => {
  return [
    `orgId: ${orgId.value || 'unknown'}`,
    `userId: ${userId.value || 'unknown'}`,
    `plan: ${plan.value || 'unknown'}`,
    `role: ${role.value || 'unknown'}`,
  ].join('\n')
})

const copyAccessInfo = async () => {
  try {
    await navigator.clipboard.writeText(accessInfo.value)
    store.pushToast({ type: 'success', message: t.toast.copySuccess })
  } catch (err) {
    console.warn('Failed to copy access info', err)
    store.pushToast({ type: 'error', message: t.toast.copyFailed })
  }
}
</script>

<template>
  <div class="access-disabled-screen">
    <div class="access-card">
      <div class="access-header">
        <img class="access-logo" :src="logoUrl" alt="" />
        <h1 class="access-title">{{ t.app.accessDisabledTitle }}</h1>
        <p class="access-subtitle">{{ t.app.accessDisabledMessage }}</p>
      </div>
      <div class="access-details">
        <div class="detail-row">
          <span class="detail-label">Org ID</span>
          <span class="detail-value">{{ orgId || 'unknown' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">User ID</span>
          <span class="detail-value">{{ userId || 'unknown' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Plan</span>
          <span class="detail-value">{{ plan || 'unknown' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Role</span>
          <span class="detail-value">{{ role || 'unknown' }}</span>
        </div>
      </div>
      <button class="primary-btn" type="button" @click="copyAccessInfo">
        {{ t.app.copyAccessInfo }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.access-disabled-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-6);
  background: linear-gradient(135deg, #111627 0%, #1d1c2e 60%, #1d2329 100%);
}

.access-card {
  width: 100%;
  max-width: 560px;
  padding: var(--space-8);
  border-radius: 20px;
  background: rgba(20, 24, 40, 0.95);
  border: 1px solid rgba(212, 154, 79, 0.2);
  box-shadow: 0 28px 60px rgba(0, 0, 0, 0.45);
  color: #f0f0f5;
  text-align: center;
}

.access-header {
  margin-bottom: var(--space-6);
}

.access-logo {
  width: 72px;
  height: 72px;
  margin-bottom: var(--space-4);
  filter: drop-shadow(0 6px 18px rgba(212, 154, 79, 0.35));
}

.access-title {
  font-size: 2rem;
  margin-bottom: var(--space-2);
}

.access-subtitle {
  color: rgba(240, 240, 245, 0.75);
  font-size: 1rem;
}

.access-details {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-5);
  margin-bottom: var(--space-5);
  border-radius: 16px;
  background: rgba(10, 12, 20, 0.7);
  text-align: left;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  font-size: 0.95rem;
}

.detail-label {
  color: rgba(240, 240, 245, 0.6);
}

.detail-value {
  color: #f0f0f5;
  font-family: 'IBM Plex Mono', 'Menlo', 'Courier New', monospace;
  word-break: break-all;
}

.primary-btn {
  background-color: var(--accent);
  color: #0f120e;
  border: none;
  padding: 12px 18px;
  border-radius: var(--radius-2);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
}
</style>
