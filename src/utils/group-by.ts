/**
 * Groups array items by a key extracted from each item
 * @param items - Array of items to group
 * @param keyFn - Function that extracts the grouping key from each item
 * @returns Record mapping keys to arrays of items
 */
export const groupBy = <T, K extends PropertyKey>(
  items: Array<T>,
  keyFn: (item: T) => K,
): Record<K, Array<T>> => {
  return items.reduce<Partial<Record<K, Array<T>>>>(
    (accumulator, item) => {
      const key = keyFn(item);
      accumulator[key] ??= [];
      accumulator[key].push(item);
      return accumulator;
    },
    {},
  ) as Record<K, Array<T>>;
};
