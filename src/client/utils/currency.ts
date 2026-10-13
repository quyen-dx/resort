/**
 * Formats an integer amount in VND into localized currency string.
 * Strictly adheres to rule: No float currency.
 */
export function formatVND(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0 ₫';
  }
  const rounded = Math.round(amount);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(rounded);
}
