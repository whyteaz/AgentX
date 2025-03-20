// middleware.js
const jwt = require("jsonwebtoken");
const config = require("./config");

// Custom middleware to protect routes
function requireAuth(req, res, next) {
  const token = req.cookies["supabaseToken"];
  if (!token) {
    return res.redirect("/login.html");
  }
  try {
    jwt.verify(token, config.supabaseJwtSecret);
    next();
  } catch (err) {
    return res.redirect("/login.html");
  }
}

// Global error handler middleware
function errorHandler(err, req, res, next) {
  res.status(500).json({ error: "Internal server error." });
}

module.exports = { requireAuth, errorHandler };
