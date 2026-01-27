<script setup lang="ts">
import { computed } from 'vue'
import { getAuthConfigSummary } from '@/lib/authConfig'
import { useAuthz } from '@/lib/authz'

const config = getAuthConfigSummary()
const {
  authContext,
  authContextLoaded,
  authContextLoading,
  authContextError,
  loadAuthContext,
} = useAuthz()

const statusLabel = computed(() => {
  if (authContextLoading.value) return 'Loading'
  if (authContextError.value) return 'Error'
  if (authContextLoaded.value) return 'OK'
  return 'Idle'
})

const handlePing = async () => {
  try {
    await loadAuthContext({ force: true })
  } catch {
    // error state already captured in hook
  }
}
</script>

<template>
  <section class="auth-diagnostics">
    <div class="panel-header">
      <div class="title">Auth Diagnostics (dev)</div>
      <div class="status" :class="statusLabel.toLowerCase()">{{ statusLabel }}</div>
    </div>

    <div class="panel-grid">
      <div class="row">
        <span class="label">API Base URL</span>
        <span class="value">{{ config.apiBaseUrl }}</span>
      </div>
      <div class="row">
        <span class="label">JWT Template</span>
        <span class="value">{{ config.hasJwtTemplate ? config.jwtTemplate : 'not set' }}</span>
      </div>
      <div class="row">
        <span class="label">Audience</span>
        <span class="value">{{ config.hasAudience ? config.audience : 'not set' }}</span>
      </div>
      <div class="row">
        <span class="label">Auth Context</span>
        <span class="value">
          <template v-if="authContextLoaded && authContext">
            user {{ authContext.user_id || 'unknown' }}, org {{ authContext.org_id || 'none' }}, plan {{ authContext.plan || 'n/a' }}
          </template>
          <template v-else-if="authContextError">
            {{ authContextError }}
          </template>
          <template v-else>
            not loaded
          </template>
        </span>
      </div>
    </div>

    <div class="panel-actions">
      <button class="ghost-btn" @click="handlePing" :disabled="authContextLoading">
        Ping /me
      </button>
    </div>
  </section>
</template>

<style scoped>
.auth-diagnostics {
  margin: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 18, 24, 0.7);
  color: #e3e7f0;
  font-size: 12px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-weight: 600;
}

.title {
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.status {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  text-transform: uppercase;
}

.status.ok {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
}

.status.error {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.status.loading {
  background: rgba(241, 196, 15, 0.2);
  color: #f1c40f;
}

.status.idle {
  background: rgba(149, 165, 166, 0.2);
  color: #95a5a6;
}

.panel-grid {
  display: grid;
  gap: 6px;
}

.row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px;
  align-items: center;
}

.label {
  opacity: 0.7;
}

.value {
  font-family: 'Space Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  word-break: break-word;
}

.panel-actions {
  margin-top: 10px;
}

.ghost-btn {
  background: transparent;
  color: inherit;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
}

.ghost-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 720px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
