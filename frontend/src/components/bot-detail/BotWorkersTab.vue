<template>
  <div class="workers-content" data-testid="workers-section">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <!-- Empty State -->
    <div v-else-if="!workers.length" class="empty-state">
      <q-icon name="settings_suggest" size="48px" class="empty-icon" />
      <p>{{ t('workers.noWorkersFound') }}</p>
    </div>

    <!-- Workers List -->
    <template v-else>
      <div class="workers-list" data-testid="workers-list">
        <WorkerCard
          v-for="worker in workersWithLogs"
          :key="worker.id"
          :worker="worker"
          :logs-count="worker.logsCount"
          @click="$emit('worker-click', worker)"
        />
      </div>

      <!-- Load More -->
      <div v-if="hasMore" class="load-more-container">
        <q-btn
          outline
          color="primary"
          icon="expand_more"
          :label="t('common.loadMore')"
          :loading="loadingMore"
          @click="$emit('load-more')"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Worker } from '@abernardo/api-client';
import WorkerCard from 'components/WorkerCard.vue';

type WorkerWithCounts = Worker & { logsCount?: number };

const props = defineProps<{
  workers: Worker[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
}>();

defineEmits<{
  (e: 'worker-click', worker: Worker): void;
  (e: 'load-more'): void;
}>();

const { t } = useI18n();

// Workers already include logsCount from the backend
const workersWithLogs = computed(() => {
  return props.workers.map(worker => ({
    ...worker,
    logsCount: (worker as WorkerWithCounts).logsCount ?? 0,
  }));
});
</script>

<style lang="scss" scoped>
.workers-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  gap: 12px;

  .body--light & {
    color: #6b7280;
  }
  .body--dark & {
    color: #9ca3af;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.empty-icon {
  .body--light & {
    color: #d1d5db;
  }
  .body--dark & {
    color: #4b5563;
  }
}

.workers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.load-more-container {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

// Responsive adjustments
@media (min-width: 600px) {
  .workers-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}
</style>
