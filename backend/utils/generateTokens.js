const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Access tokens are short-lived; refresh tokens are long-lived and get
// rotated every time they're used. Falls back to deriving a refresh secret
// from JWT_SECRET so this works out of the box even if JWT_REFRESH_SECRET
// isn't set in .env (recommended to set it explicitly in production).
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET}_refresh`;

exports.generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

exports.generateRefreshToken = (id) => {
  return jwt.sign({ id }, REFRESH_SECRET, {
    expiresIn: "30d",
  });
};

exports.verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};

exports.hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
