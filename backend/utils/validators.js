// Small, dependency-free request-validation helpers for the auth routes.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Guards against NoSQL-injection payloads like { "email": { "$gt": "" } } —
// Mongoose/MongoDB would otherwise happily accept a non-string object as a
// query operator inside User.findOne({ email }). Every value that ends up
// in an auth query filter should pass this check first.
const isPlainString = (value) => typeof value === "string";

const isValidEmail = (email) => isPlainString(email) && EMAIL_RE.test(email.trim());

const isStrongPassword = (password) => isPlainString(password) && password.length >= 8;

module.exports = { isPlainString, isValidEmail, isStrongPassword };
