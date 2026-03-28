/**
 * Random delay between min and max milliseconds
 */
export function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Human-like delay with slight randomization
 */
export function humanDelay(base: number, variance: number): Promise<void> {
  const delay = base + Math.random() * variance;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Exponential backoff delay for retries
 */
export function exponentialBackoff(attempt: number, baseMs: number = 1000): Promise<void> {
  const delay = baseMs * Math.pow(2, attempt) + Math.random() * 1000;
  return new Promise((resolve) => setTimeout(resolve, delay));
}
