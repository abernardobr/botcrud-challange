<template>
  <q-expansion-item
    dense
    expand-separator
    icon="code"
    :label="t('queryBuilder.queryPreview')"
    class="query-preview-expansion"
  >
    <q-card class="query-preview-card">
      <q-card-section>
        <pre class="query-code">{{ formattedQuery }}</pre>
      </q-card-section>
    </q-card>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  query: Record<string, unknown>;
}>();

const { t } = useI18n();

const formattedQuery = computed(() => {
  return JSON.stringify(props.query, null, 2);
});
</script>

<style lang="scss" scoped>
.query-preview-expansion {
  margin-top: 8px;
  border-radius: 8px;

  .body--light & {
    background: #f9fafb;
  }
  .body--dark & {
    background: #1e1e2d;
  }
}

.query-preview-card {
  .body--light & {
    background: #1f2937;
  }
  .body--dark & {
    background: #0f0f17;
  }
}

.query-code {
  margin: 0;
  font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #10b981;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
