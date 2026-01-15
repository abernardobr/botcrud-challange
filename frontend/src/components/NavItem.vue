<template>
  <q-item
    clickable
    :to="to"
    active-class="bg-primary text-white"
  >
    <q-item-section v-if="icon" avatar>
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption v-if="caption">
        {{ caption }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  caption?: string;
  icon?: string;
  to: string;
}>();
</script>
