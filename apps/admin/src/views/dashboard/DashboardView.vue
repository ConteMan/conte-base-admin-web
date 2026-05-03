<template>
  <section class="page-panel">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t("dashboard.title") }}</h1>
        <p class="page-subtitle">{{ t("dashboard.subtitle") }}</p>
      </div>
    </div>
    <div class="page-grid two">
      <div class="stat-card">
        <div class="stat-label">{{ t("dashboard.cards.scope") }}</div>
        <div class="stat-value">{{ t("dashboard.cards.scopeValue") }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">{{ t("dashboard.cards.auth") }}</div>
        <div class="stat-value">{{ t("dashboard.cards.authValue") }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">{{ t("dashboard.cards.audit") }}</div>
        <div class="stat-value">{{ t("dashboard.cards.auditValue") }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">{{ t("dashboard.cards.permissions") }}</div>
        <div class="stat-value">{{ t("dashboard.cards.permissionsValue") }}</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { $t } from '#/locales';

const t = $t;
</script>
