<script lang="ts" setup>
import { AuthPageLayout } from '@vben/layouts';

import { appConfig } from '../app-config';
</script>

<template>
  <AuthPageLayout
    :app-name="''"
    :copyright="appConfig.auth.showCopyright"
    :logo="''"
    :logo-dark="''"
    :page-description="appConfig.auth.pageDescription || ''"
    :page-title="appConfig.auth.pageTitle || ''"
  >
    <!-- 自定义工具栏 -->
    <!-- <template #toolbar></template> -->
  </AuthPageLayout>
</template>
