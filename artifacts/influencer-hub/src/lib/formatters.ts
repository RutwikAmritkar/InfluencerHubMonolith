import i18n from '@/i18n';

/**
 * Locale-aware currency formatter.
 * Preserves the exact currency (e.g., INR, USD) regardless of selected UI language.
 */
export function formatCurrency(
  amount: number,
  currency: string = 'INR',
  locale?: string
): string {
  const currentLang = locale || i18n.language || 'en';
  const targetLocale = currentLang === 'hi' ? 'hi-IN' : currentLang === 'mr' ? 'mr-IN' : 'en-IN';

  try {
    return new Intl.NumberFormat(targetLocale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (_e) {
    const symbol = currency === 'INR' ? '₹' : '$';
    return `${symbol}${amount.toLocaleString('en-IN')}`;
  }
}

/**
 * Locale-aware number formatter (e.g. 125,000 or 125K).
 */
export function formatNumber(
  val: number,
  compact = false,
  locale?: string
): string {
  const currentLang = locale || i18n.language || 'en';
  const targetLocale = currentLang === 'hi' ? 'hi-IN' : currentLang === 'mr' ? 'mr-IN' : 'en-US';

  try {
    if (compact) {
      if (val >= 1000000) {
        return (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
      }
      if (val >= 1000) {
        return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
      }
    }
    return new Intl.NumberFormat(targetLocale).format(val);
  } catch (_e) {
    return val.toString();
  }
}

/**
 * Locale-aware date formatter.
 */
export function formatDate(
  dateInput: Date | string | number,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' },
  locale?: string
): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return String(dateInput);

  const currentLang = locale || i18n.language || 'en';
  const targetLocale = currentLang === 'hi' ? 'hi-IN' : currentLang === 'mr' ? 'mr-IN' : 'en-US';

  try {
    return new Intl.DateTimeFormat(targetLocale, options).format(date);
  } catch (_e) {
    return date.toLocaleDateString();
  }
}
