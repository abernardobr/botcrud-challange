import { computed, type ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';
import type { BotStatus } from '@abernardo/api-client';

/**
 * Quasar color names used for status indicators
 */
export type StatusColor = 'positive' | 'negative' | 'warning' | 'grey';

/**
 * Status option for dropdowns and selects
 */
export interface StatusOption {
  label: string;
  value: BotStatus;
}

/**
 * Return type for the useStatus composable
 */
export interface UseStatus {
  /**
   * Get Quasar color name for a status
   */
  getStatusColor: (status: BotStatus | undefined) => StatusColor;

  /**
   * Get translated label for a status
   */
  getStatusLabel: (status: BotStatus | undefined) => string;

  /**
   * Get translated label in uppercase for badges
   */
  getStatusBadgeLabel: (status: BotStatus | undefined) => string;

  /**
   * Get CSS class suffix for status styling
   */
  getStatusClass: (status: BotStatus | undefined) => string;

  /**
   * Computed list of status options for dropdowns
   */
  statusOptions: ComputedRef<StatusOption[]>;

  /**
   * All available bot statuses
   */
  allStatuses: readonly BotStatus[];
}

/**
 * All available bot statuses
 */
export const BOT_STATUSES: readonly BotStatus[] = ['ENABLED', 'DISABLED', 'PAUSED'] as const;

/**
 * Status to Quasar color mapping
 */
const STATUS_COLORS: Record<BotStatus, StatusColor> = {
  ENABLED: 'positive',
  DISABLED: 'negative',
  PAUSED: 'warning',
};

/**
 * Composable for consistent status color and label resolution across components.
 * Eliminates duplicate status-to-color and status-to-label mappings.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useStatus } from 'src/composables/useStatus';
 *
 * const { getStatusColor, getStatusLabel, statusOptions } = useStatus();
 * </script>
 *
 * <template>
 *   <q-badge :color="getStatusColor(bot.status)" :label="getStatusLabel(bot.status)" />
 *   <q-select :options="statusOptions" />
 * </template>
 * ```
 */
export function useStatus(): UseStatus {
  const { t } = useI18n();

  /**
   * Get Quasar color name for a status
   */
  function getStatusColor(status: BotStatus | undefined): StatusColor {
    if (!status) return 'grey';
    return STATUS_COLORS[status] ?? 'grey';
  }

  /**
   * Get translated label for a status
   */
  function getStatusLabel(status: BotStatus | undefined): string {
    if (!status) return '';
    switch (status) {
      case 'ENABLED':
        return t('bots.statusEnabled');
      case 'DISABLED':
        return t('bots.statusDisabled');
      case 'PAUSED':
        return t('bots.statusPaused');
      default:
        return status;
    }
  }

  /**
   * Get translated label in uppercase for badges
   */
  function getStatusBadgeLabel(status: BotStatus | undefined): string {
    return getStatusLabel(status).toUpperCase();
  }

  /**
   * Get CSS class suffix for status styling (lowercase)
   */
  function getStatusClass(status: BotStatus | undefined): string {
    if (!status) return '';
    return status.toLowerCase();
  }

  /**
   * Computed list of status options for dropdowns
   */
  const statusOptions = computed<StatusOption[]>(() => [
    { label: t('bots.statusEnabled'), value: 'ENABLED' },
    { label: t('bots.statusDisabled'), value: 'DISABLED' },
    { label: t('bots.statusPaused'), value: 'PAUSED' },
  ]);

  return {
    getStatusColor,
    getStatusLabel,
    getStatusBadgeLabel,
    getStatusClass,
    statusOptions,
    allStatuses: BOT_STATUSES,
  };
}
