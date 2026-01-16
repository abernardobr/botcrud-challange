<template>
  <div :class="['skeleton-list', `skeleton-list--${layout}`]" data-testid="skeleton-list">
    <component
      :is="skeletonComponent"
      v-for="i in count"
      :key="i"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';
import SkeletonBotCard from './SkeletonBotCard.vue';
import SkeletonWorkerCard from './SkeletonWorkerCard.vue';
import SkeletonLogCard from './SkeletonLogCard.vue';

type SkeletonType = 'bot' | 'worker' | 'log';
type LayoutType = 'grid' | 'list';

const props = withDefaults(defineProps<{
  type: SkeletonType;
  count?: number;
  layout?: LayoutType;
}>(), {
  count: 3,
  layout: 'list',
});

const skeletonComponent = computed<Component>(() => {
  switch (props.type) {
    case 'bot':
      return SkeletonBotCard;
    case 'worker':
      return SkeletonWorkerCard;
    case 'log':
      return SkeletonLogCard;
    default:
      return SkeletonBotCard;
  }
});
</script>

<style lang="scss" scoped>
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &--grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  &--list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}
</style>
