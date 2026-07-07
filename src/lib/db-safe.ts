export async function withDbFallback<T>(
  operation: () => Promise<T>,
  fallback: T,
  label: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`[db] ${label} failed`, error);
    return fallback;
  }
}