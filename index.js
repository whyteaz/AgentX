// index.js
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const config = require("./config");
const { log } = require("./logger");

const app = express();

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Too many requests, please try again later." }
});
app.use(limiter);

// Middleware for parsing cookies and request bodies
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from the "public" folder but disable automatic index serving.
app.use(express.static(path.join(__dirname, "public"), { index: false }));

// Mount routes from route.js
const routes = require("./route");
app.use(routes);

// Global error handling middleware
const { errorHandler } = require("./middleware");
app.use(errorHandler);

// Start the server.
app.listen(config.port, () => {
  log("info", `Server running on port ${config.port}`);
  // Optionally, start polling for mentions:
  // pollMentions();
});
