// IP rate limit map: tracks requests per IP. Limit: 5 requests per 10 minutes per IP.
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 5;
export const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, [now]);
    return true;
  }

  const timestamps = rateLimitMap.get(ip)!;
  // Filter out timestamps older than the window
  const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  
  if (validTimestamps.length >= MAX_REQUESTS) {
    rateLimitMap.set(ip, validTimestamps); // update with filtered list
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return true;
}
