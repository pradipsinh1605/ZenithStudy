type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter: number;
};

const buckets = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string,
  limit = 60,
  windowMs = 60 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || now >= current.resetAt) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt,
      retryAfter: 0,
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
    retryAfter: 0,
  };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";

  return (
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "unknown"
  );
}
