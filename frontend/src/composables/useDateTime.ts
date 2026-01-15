import { computed, type ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';

export interface DateTimeOptions {
  includeTime?: boolean;
  elapsedFirst?: boolean;
}

export interface UseDateTime {
  locale: ComputedRef<string>;
  formatNumber: (value: number) => string;
  formatElapsed: (dateStr?: string | Date) => string;
  formatDate: (dateStr?: string | Date, options?: DateTimeOptions) => string;
  formatDateTime: (dateStr?: string | Date, options?: DateTimeOptions) => string;
  formatDateTimeSimple: (dateStr?: string | Date | number) => string;
  formatRelativeTime: (dateStr?: string | Date) => string;
}

export function useDateTime(): UseDateTime {
  const { t, locale } = useI18n();

  /**
   * Format a number according to the current locale
   */
  function formatNumber(value: number): string {
    return new Intl.NumberFormat(locale.value).format(value);
  }

  /**
   * Calculate and return only the elapsed time string
   */
  function formatElapsed(dateStr?: string | Date): string {
    if (!dateStr) return '';

    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes <= 1
          ? t('elapsed.justNow')
          : t('elapsed.minutesAgo', { n: diffMinutes });
      }
      return diffHours === 1
        ? t('elapsed.hourAgo')
        : t('elapsed.hoursAgo', { n: diffHours });
    }

    if (diffDays === 1) {
      return t('elapsed.yesterday');
    }

    if (diffDays < 7) {
      return t('elapsed.daysAgo', { n: diffDays });
    }

    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1
        ? t('elapsed.weekAgo')
        : t('elapsed.weeksAgo', { n: weeks });
    }

    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return months === 1
        ? t('elapsed.monthAgo')
        : t('elapsed.monthsAgo', { n: months });
    }

    const years = Math.floor(diffDays / 365);
    return years === 1
      ? t('elapsed.yearAgo')
      : t('elapsed.yearsAgo', { n: years });
  }

  /**
   * Format a date with elapsed time (without time component)
   * Default format: "Jul 15 (3 months ago)"
   * With elapsedFirst: "3 months ago (Jul 15)"
   */
  function formatDate(
    dateStr?: string | Date,
    options: DateTimeOptions = {}
  ): string {
    if (!dateStr) return '';

    const { elapsedFirst = false } = options;
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    const now = new Date();

    const dateFormatted = new Intl.DateTimeFormat(locale.value, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    }).format(date);

    const elapsed = formatElapsed(date);

    return elapsedFirst
      ? `${elapsed} (${dateFormatted})`
      : `${dateFormatted} (${elapsed})`;
  }

  /**
   * Format a date with time and elapsed time
   * Default format: "Jul 15, 10:30 AM (3 months ago)"
   * With elapsedFirst: "3 months ago (Jul 15, 10:30 AM)"
   */
  function formatDateTime(
    dateStr?: string | Date,
    options: DateTimeOptions = {}
  ): string {
    if (!dateStr) return '';

    const { elapsedFirst = true } = options;
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    const now = new Date();
    const currentLocale = locale.value;

    const dateTimeFormatted = new Intl.DateTimeFormat(currentLocale, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
      hour12: currentLocale.startsWith('en'),
    }).format(date);

    const elapsed = formatElapsed(date);

    return elapsedFirst
      ? `${elapsed} (${dateTimeFormatted})`
      : `${dateTimeFormatted} (${elapsed})`;
  }

  /**
   * Simple locale-aware date/time formatting without elapsed time
   * Format: "Jan 15, 2024, 10:30 AM"
   */
  function formatDateTimeSimple(dateStr?: string | Date | number): string {
    if (!dateStr) return '';

    const date =
      dateStr instanceof Date
        ? dateStr
        : typeof dateStr === 'number'
          ? new Date(dateStr)
          : new Date(dateStr);
    const currentLocale = locale.value;

    return date.toLocaleString(currentLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: currentLocale.startsWith('en'),
    });
  }

  /**
   * Format using Intl.RelativeTimeFormat with full date/time
   * Uses native browser relative time formatting
   * Format: "3 days ago (Jan 15, 10:30 AM)"
   */
  function formatRelativeTime(dateStr?: string | Date): string {
    if (!dateStr) return '';

    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    const currentLocale = locale.value;
    const rtf = new Intl.RelativeTimeFormat(currentLocale, { numeric: 'auto' });

    let relativeTime: string;
    if (diffYears > 0) {
      relativeTime = rtf.format(-diffYears, 'year');
    } else if (diffMonths > 0) {
      relativeTime = rtf.format(-diffMonths, 'month');
    } else if (diffWeeks > 0) {
      relativeTime = rtf.format(-diffWeeks, 'week');
    } else if (diffDays > 0) {
      relativeTime = rtf.format(-diffDays, 'day');
    } else if (diffHours > 0) {
      relativeTime = rtf.format(-diffHours, 'hour');
    } else if (diffMins > 0) {
      relativeTime = rtf.format(-diffMins, 'minute');
    } else {
      relativeTime = rtf.format(-diffSecs, 'second');
    }

    const fullDateTime = date.toLocaleString(currentLocale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: currentLocale.startsWith('en'),
    });

    return `${relativeTime} (${fullDateTime})`;
  }

  return {
    locale: computed(() => locale.value),
    formatNumber,
    formatElapsed,
    formatDate,
    formatDateTime,
    formatDateTimeSimple,
    formatRelativeTime,
  };
}
