import rateLimit from 'express-rate-limit';

const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

// General API rate limiter
export const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many requests, please try again in 15 minutes'
);

// Search-specific rate limiter (more restrictive)
export const searchLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10, // 10 requests per minute
  'Search limit exceeded, please wait 1 minute'
);

// AI analysis rate limiter (most restrictive)
export const aiLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  5, // 5 requests per minute
  'AI analysis limit exceeded, please wait 1 minute'
);
