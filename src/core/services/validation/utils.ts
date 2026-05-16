export const getRules = <T, K extends keyof T>(
  rules: T | undefined,
  keys: Array<K>,
): Pick<T, K> | undefined => {
  if (!rules) return;

  const filtered = {} as Pick<T, K>;
  for (const key in rules) {
    if (keys.includes(key as unknown as K)) {
      filtered[key as unknown as K] = rules[key as unknown as K];
    }
  }
  return filtered;
};
