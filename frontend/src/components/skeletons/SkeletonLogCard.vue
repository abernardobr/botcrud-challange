<template>
  <q-card class="skeleton-log-card" data-testid="skeleton-log-card">
    <q-card-section class="skeleton-log-card__content">
      <!-- Icon -->
      <q-skeleton type="rect" width="44px" height="44px" class="skeleton-log-card__icon" />

      <!-- Info -->
      <div class="skeleton-log-card__info">
        <q-skeleton type="text" width="90%" class="skeleton-log-card__message" />
        <q-skeleton type="text" width="60%" class="skeleton-log-card__message" />
        <div class="skeleton-log-card__meta">
          <q-skeleton type="text" width="80px" />
          <q-skeleton type="text" width="60px" />
          <q-skeleton type="text" width="100px" />
        </div>
      </div>

      <!-- Chevron -->
      <q-skeleton type="rect" width="24px" height="24px" class="skeleton-log-card__chevron" />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
// Skeleton component - no logic needed
</script>

<style lang="scss" scoped>
.skeleton-log-card {
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

.skeleton-log-card__content {
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.skeleton-log-card__icon {
  border-radius: 10px;
  flex-shrink: 0;
}

.skeleton-log-card__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.skeleton-log-card__message {
  height: 17px;
}

.skeleton-log-card__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.skeleton-log-card__chevron {
  border-radius: 4px;
  flex-shrink: 0;
  align-self: center;
}
</style>
