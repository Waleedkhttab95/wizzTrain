/**
 * Runs before the suite imports the application.
 *
 * AuthController reads the login rate limit at class-definition time, so it
 * has to be set here rather than inside a test. The end-to-end suite signs in
 * and changes passwords dozens of times in a few seconds, which the production
 * default of five attempts per minute would throttle — the 429 would look like
 * a broken endpoint rather than the guard doing its job.
 */
process.env.LOGIN_RATE_LIMIT = '1000';
process.env.LOGIN_RATE_TTL_MS = '60000';
