// index.js
const express = require("express");
const path = require("path");
const rateLimit = require("express-rate-limit");
const { runAgent, scheduleTrollReplies, pollMentions, trollStatuses } = require("./agent");
const { log, getLogs } = require("./logger");
const config = require("./config");

const app = express();

// Rate limiting middleware (protects API endpoints)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests, please try again later."
});
app.use(limiter);

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// New endpoint to expose Supabase configuration to the client.
app.get("/api/config", (req, res) => {
  res.json({
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey
  });
});

// /trigger endpoint with input validation and centralized error handling.
app.post("/trigger", async (req, res, next) => {
  try {
    const { tweetLink, trollLord } = req.body;
    const trollLordMode = trollLord === "true";
    log("info", "Troll Lord mode:", trollLordMode);

    // Updated input validation to accept both twitter.com and x.com URLs.
    if (!tweetLink || !/^https:\/\/(twitter\.com|x\.com)\/.*\/status\/\d+/.test(tweetLink)) {
      return res.status(400).json({ error: "Invalid tweet link provided." });
    }

    if (trollLordMode) {
      scheduleTrollReplies(tweetLink);
      res.json({ status: "Success", message: "Troll Lord mode activated: 10 replies scheduled." });
    } else {
      const result = await runAgent(tweetLink);
      res.json({ status: "Success", data: result });
    }
  } catch (error) {
    log("error", "Error in /trigger:", error);
    next(error);
  }
});

// Endpoint to retrieve Troll Lord status.
app.get("/troll-status", (req, res) => {
  const tweetLink = req.query.tweetLink;
  if (!tweetLink) return res.status(400).json({ error: "Missing tweetLink parameter" });
  res.json({ status: "Success", data: trollStatuses[tweetLink] || [] });
});

// Endpoint to retrieve server logs.
app.get("/logs", (req, res) => {
  res.json({ logs: getLogs() });
});

// Global error handling middleware.
app.use((err, req, res, next) => {
  res.status(500).json({ error: "Internal server error." });
});

// Start the server.
app.listen(config.port, () => {
  log("info", `Server running on port ${config.port}`);
  // Optionally, start polling for mentions:
  // pollMentions();
});
