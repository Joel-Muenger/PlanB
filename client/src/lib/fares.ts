/** Preis im Schweizer Format, z. B. „CHF 4.60“. */
export function formatPrice(price: number, currency = 'CHF'): string {
  return `${currency} ${price.toFixed(2)}`;
}
