<template>
  <q-page class="error-page">
    <div class="error-content">
      <div class="error-icon">
        <q-icon name="search_off" size="80px" />
      </div>
      <div class="error-code">404</div>
      <h1 class="error-title">{{ t('errors.pageNotFound') }}</h1>
      <p class="error-message">{{ t('errors.pageNotFoundMessage') }}</p>
      <q-btn
        icon="home"
        :label="t('common.backToHome')"
        class="home-btn"
        to="/"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style lang="scss" scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.error-content {
  text-align: center;
  max-width: 400px;
}

.error-icon {
  width: 120px;
  height: 120px;
  margin: 0 auto 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  .body--light & {
    background: rgba(99, 102, 241, 0.1);
    color: #6366f1;
  }
  .body--dark & {
    background: rgba(129, 140, 248, 0.15);
    color: #818cf8;
  }
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.error-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 12px 0;

  .body--light & {
    color: #1f2937;
  }
  .body--dark & {
    color: #f9fafb;
  }
}

.error-message {
  font-size: 16px;
  margin: 0 0 32px 0;
  line-height: 1.5;

  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
  }
}

.home-btn {
  padding: 12px 32px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 16px;
  text-transform: none;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;

  &:hover {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  }

  :deep(.q-icon) {
    margin-right: 8px;
  }
}
</style>
