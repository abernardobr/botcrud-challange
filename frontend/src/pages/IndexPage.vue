<template>
  <q-page class="page-container">
    <div class="row items-center justify-center" style="min-height: 60vh;">
      <div class="col-12 col-md-8 text-center">
        <q-icon name="smart_toy" size="120px" color="primary" class="q-mb-lg" />
        <h2 class="text-h3 q-mb-md">{{ t('app.title') }}</h2>
        <p class="text-h6 text-grey q-mb-xl">{{ t('app.subtitle') }}</p>

        <!-- Stats Cards -->
        <div class="row q-col-gutter-md q-mb-xl">
          <div class="col-12 col-sm-4">
            <q-card flat bordered class="stat-card">
              <q-card-section>
                <q-icon name="smart_toy" size="48px" color="primary" />
                <div class="text-h3 q-mt-sm">{{ stats.bots }}</div>
                <div class="text-subtitle1 text-grey">{{ t('menu.bots') }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-sm-4">
            <q-card flat bordered class="stat-card">
              <q-card-section>
                <q-icon name="engineering" size="48px" color="secondary" />
                <div class="text-h3 q-mt-sm">{{ stats.workers }}</div>
                <div class="text-subtitle1 text-grey">{{ t('menu.workers') }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-sm-4">
            <q-card flat bordered class="stat-card">
              <q-card-section>
                <q-icon name="receipt_long" size="48px" color="accent" />
                <div class="text-h3 q-mt-sm">{{ stats.logs }}</div>
                <div class="text-subtitle1 text-grey">{{ t('menu.logs') }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="row justify-center q-gutter-md">
          <q-btn
            color="primary"
            icon="smart_toy"
            :label="t('menu.bots')"
            size="lg"
            to="/bots"
          />
          <q-btn
            color="secondary"
            icon="engineering"
            :label="t('menu.workers')"
            size="lg"
            to="/workers"
          />
          <q-btn
            color="accent"
            icon="receipt_long"
            :label="t('menu.logs')"
            size="lg"
            to="/logs"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/api';

const { t } = useI18n();

const stats = ref({
  bots: 0,
  workers: 0,
  logs: 0,
});

async function loadStats() {
  try {
    const health = await api.health.detailed();
    stats.value = health.stats;
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

onMounted(() => {
  loadStats();
});
</script>

<style scoped lang="scss">
.stat-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
}
</style>
