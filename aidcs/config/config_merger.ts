function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function deepMerge<T>(base: T, override: Partial<T>): T {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override as T;
  }

  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const existing = result[key];
    if (isPlainObject(existing) && isPlainObject(value)) {
      result[key] = deepMerge(existing, value);
    } else {
      result[key] = value as unknown;
    }
  }

  return result as T;
}

export function mergeConfigs<T>(...configs: Array<T | null | undefined>): T {
  const valid = configs.filter(Boolean) as T[];
  if (valid.length === 0) {
    throw new Error("No configs provided to merge");
  }
  return valid.reduce((acc, curr) => deepMerge(acc, curr));
}
