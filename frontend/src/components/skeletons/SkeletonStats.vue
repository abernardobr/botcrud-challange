<template>
  <q-card class="skeleton-stats" data-testid="skeleton-stats">
    <q-card-section class="skeleton-stats__content">
      <!-- Stats Items -->
      <div class="skeleton-stats__items">
        <div v-for="i in 3" :key="i" class="skeleton-stats__item">
          <q-skeleton type="text" width="40px" height="24px" class="skeleton-stats__value" />
          <q-skeleton type="text" width="60px" height="14px" class="skeleton-stats__label" />
        </div>
      </div>

      <!-- Button -->
      <q-skeleton type="rect" width="100px" height="36px" class="skeleton-stats__button" />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
// Skeleton component - no logic needed
</script>

<style lang="scss" scoped>
.skeleton-stats {
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

.skeleton-stats__content {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (min-width: 600px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.skeleton-stats__items {
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (min-width: 600px) {
    flex-direction: row;
    align-items: center;
    gap: 24px;
  }
}

.skeleton-stats__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  @media (min-width: 600px) {
    padding-right: 24px;
    border-right: 1px solid;

    .body--light & {
      border-color: #e5e7eb;
    }

    .body--dark & {
      border-color: rgba(255, 255, 255, 0.08);
    }

    &:last-child {
      padding-right: 0;
      border-right: none;
    }
  }
}

.skeleton-stats__value {
  border-radius: 4px;
}

.skeleton-stats__label {
  border-radius: 4px;
}

.skeleton-stats__button {
  border-radius: 8px;
  align-self: center;

  @media (min-width: 600px) {
    align-self: auto;
  }
}
</style>
