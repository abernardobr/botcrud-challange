<template>
  <q-page class="flex flex-center">
    <div class="text-center">
      <div class="text-h1 text-weight-thin q-mb-lg" style="font-size: 150px; line-height: 1;">
        404
      </div>
      <div class="text-h4 q-mb-lg">{{ t('errors.notFound') }}</div>
      <q-btn
        color="primary"
        icon="home"
        :label="t('menu.home')"
        to="/"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
