const rateLimit = require('express-rate-limit');

// Applied to every /api/* request. Generous — this exists to blunt abuse and
// runaway clients, not to throttle normal usage.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down and try again shortly.' }
});

// Login/register: keyed by IP since there's no authenticated user yet.
// Tight enough to blunt credential stuffing without locking out normal retries.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts. Please try again in a few minutes.' }
});

// AI generation (deck generation, explanations, hints, quiz/card generation)
// runs against a shared local model — keep it well below what would let one
// user starve everyone else on the same Ollama instance. Keyed per-user
// (these routes always run after authenticateToken) rather than per-IP, so
// one office/NAT IP with several users doesn't get throttled together.
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { message: 'AI generation rate limit reached. Please wait a few minutes before generating more.' }
});

module.exports = { generalLimiter, authLimiter, aiLimiter };
