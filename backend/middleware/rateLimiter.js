const rateLimit = require("express-rate-limit");

// Login/register: loose enough that a real person mistyping a password a
// few times never notices it, tight enough that scripting through the
// full password-guessing space isn't practical.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in a few minutes." },
});

// Forgot-password sends a real email through Brevo's free tier (300/day,
// shared across the whole app) — this needs to be tighter than the login
// limiter so a script can't burn through that quota or spam a real inbox.
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many password reset requests. Please try again later." },
});

module.exports = { authLimiter, forgotPasswordLimiter };
