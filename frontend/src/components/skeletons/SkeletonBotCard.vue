<template>
  <q-card class="skeleton-bot-card" data-testid="skeleton-bot-card">
    <q-card-section class="skeleton-bot-card__content">
      <!-- Header: Icon + Status Badge -->
      <div class="skeleton-bot-card__header">
        <q-skeleton type="rect" width="44px" height="44px" class="skeleton-bot-card__icon" />
        <q-skeleton type="rect" width="80px" height="24px" class="skeleton-bot-card__badge" />
      </div>

      <!-- Info: Name + Description -->
      <div class="skeleton-bot-card__info">
        <q-skeleton type="text" width="60%" class="skeleton-bot-card__name" />
        <q-skeleton type="text" width="80%" class="skeleton-bot-card__description" />
        <q-skeleton type="text" width="40%" class="skeleton-bot-card__description" />
      </div>

      <!-- Stats Row -->
      <div class="skeleton-bot-card__stats">
        <q-skeleton type="text" width="60px" />
        <q-skeleton type="text" width="60px" />
        <q-skeleton type="text" width="80px" />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
// Skeleton component - no logic needed
</script>

<style lang="scss" scoped>
.skeleton-bot-card {
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

.skeleton-bot-card__content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-bot-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.skeleton-bot-card__icon {
  border-radius: 10px;
}

.skeleton-bot-card__badge {
  border-radius: 12px;
}

.skeleton-bot-card__info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skeleton-bot-card__name {
  height: 20px;
}

.skeleton-bot-card__description {
  height: 16px;
}

.skeleton-bot-card__stats {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid;
  margin-top: 4px;

  .body--light & {
    border-color: #f3f4f6;
  }

  .body--dark & {
    border-color: rgba(255, 255, 255, 0.06);
  }
}
</style>
