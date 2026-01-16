<template>
  <q-card class="skeleton-worker-card" data-testid="skeleton-worker-card">
    <q-card-section class="skeleton-worker-card__content">
      <!-- Icon -->
      <q-skeleton type="rect" width="44px" height="44px" class="skeleton-worker-card__icon" />

      <!-- Info -->
      <div class="skeleton-worker-card__info">
        <q-skeleton type="text" width="50%" class="skeleton-worker-card__name" />
        <q-skeleton type="text" width="70%" class="skeleton-worker-card__description" />
        <q-skeleton type="text" width="40%" class="skeleton-worker-card__logs" />
      </div>

      <!-- Chevron -->
      <q-skeleton type="rect" width="24px" height="24px" class="skeleton-worker-card__chevron" />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
// Skeleton component - no logic needed
</script>

<style lang="scss" scoped>
.skeleton-worker-card {
  border-radius: 12px;
  overflow: hidden;

  .body--light & {
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .body--dark & {
    background: #1e1e2d;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
}

.skeleton-worker-card__content {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.skeleton-worker-card__icon {
  border-radius: 10px;
  flex-shrink: 0;
}

.skeleton-worker-card__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.skeleton-worker-card__name {
  height: 18px;
}

.skeleton-worker-card__description {
  height: 16px;
}

.skeleton-worker-card__logs {
  height: 16px;
}

.skeleton-worker-card__chevron {
  border-radius: 4px;
  flex-shrink: 0;
}
</style>
