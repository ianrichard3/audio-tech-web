<script setup lang="ts">
import { SignIn } from '@clerk/vue'
import logoUrl from '../assets/el-riche-mark.svg'
import { strings } from '../ui/strings'

const t = strings
</script>

<template>
  <div class="auth-screen">
    <div class="auth-container">
      <div class="auth-header">
        <img class="auth-logo" :src="logoUrl" alt="" />
        <h1 class="auth-title">{{ t.app.name }}</h1>
        <p class="auth-subtitle">{{ t.app.tagline }}</p>
      </div>
      
      <div class="auth-content">
        <p class="auth-prompt">Iniciá sesión para acceder a la aplicación</p>
        <SignIn />
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
  padding: var(--space-4);
}

.auth-container {
  width: 100%;
  max-width: 420px;
  text-align: center;
}

.auth-header {
  margin-bottom: var(--space-6);
}

.auth-logo {
  width: 80px;
  height: 80px;
  margin-bottom: var(--space-4);
  filter: drop-shadow(0 4px 12px rgba(99, 102, 241, 0.3));
}

.auth-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--c-primary, #6366f1);
  margin: 0 0 var(--space-2) 0;
}

.auth-subtitle {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.auth-content {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: var(--space-6);
  backdrop-filter: blur(10px);
}

.auth-prompt {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 var(--space-5) 0;
}
</style>
