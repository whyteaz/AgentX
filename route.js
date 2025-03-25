// route.js
const express = require("express");
const path = require("path");
const config = require("./config");
const { log, getLogs } = require("./logger");
const { 
  runAgent, 
  scheduleTrollReplies, 
  runBootlickAgent, 
  scheduleBootlickReplies, 
  trollStatuses, 
  bootlickStatuses 
} = require("./agent");
const { requireAuth } = require("./middleware");

const router = express.Router();

// Expose Supabase config for client-side initialization.
router.get("/api/config", (req, res) => {
  res.json({
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey
  });
});

// Set a secure cookie with the Supabase token.
router.post("/api/set-cookie", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "No token provided" });
  res.cookie("supabaseToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
  });
  res.json({ success: true });
});

// Protected route: serve the main page only if authenticated.
router.get("/", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Allow unauthenticated access to the login page.
router.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// /trigger endpoint: processes requests to run the trolling agent.
router.post("/trigger", requireAuth, async (req, res, next) => {
  try {
    const { tweetLink, trollLord } = req.body;
    const trollLordMode = trollLord === "true";
    log("info", "Troll Lord mode:", trollLordMode);

    // Validate tweet link (accepts URLs from twitter.com or x.com)
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

// /bootlick endpoint: processes requests to run the bootlicking agent.
router.post("/bootlick", requireAuth, async (req, res, next) => {
  try {
    const { profileUrls, multipleProfiles } = req.body;
    const multipleProfilesMode = multipleProfiles === "true";
    log("info", "Multiple Profiles mode:", multipleProfilesMode);

    if (!profileUrls || profileUrls.trim() === "") {
      return res.status(400).json({ error: "No profile URLs provided." });
    }

    // For single profile mode, validate the URL format
    if (!multipleProfilesMode) {
      const profileUrl = profileUrls.trim();
      
      // Validate profile URL (accepts URLs from twitter.com or x.com)
      if (!/^https:\/\/(twitter\.com|x\.com)\/[^/]+\/?$/.test(profileUrl)) {
        return res.status(400).json({ error: "Invalid profile URL format. Should be like: https://twitter.com/username" });
      }
      
      const result = await runBootlickAgent(profileUrl);
      res.json({ status: "Success", data: result });
    } else {
      // For multiple profiles mode, schedule bootlicking replies
      const result = await scheduleBootlickReplies(profileUrls);
      
      // Check if there was an error with the first profile
      if (result.firstError) {
        res.json({ 
          status: "Warning", 
          message: `Multiple Profiles mode activated but encountered an issue with the first profile: ${result.firstError}. Remaining profiles will be processed as scheduled.`,
          statusKey: result.statusKey
        });
      } else {
        res.json({ 
          status: "Success", 
          message: `Multiple Profiles mode activated: ${result.totalProfiles} replies scheduled with 16-minute intervals.`,
          statusKey: result.statusKey
        });
      }
    }
  } catch (error) {
    log("error", "Error in /bootlick:", error);
    next(error);
  }
});

// Endpoint to retrieve Troll Lord status.
router.get("/troll-status", requireAuth, (req, res) => {
  const tweetLink = req.query.tweetLink;
  if (!tweetLink) return res.status(400).json({ error: "Missing tweetLink parameter" });
  res.json({ status: "Success", data: trollStatuses[tweetLink] || [] });
});

// Endpoint to retrieve Bootlick status.
router.get("/bootlick-status", requireAuth, (req, res) => {
  const statusKey = req.query.statusKey;
  if (!statusKey) return res.status(400).json({ error: "Missing statusKey parameter" });
  res.json({ status: "Success", data: bootlickStatuses[statusKey] || [] });
});

// Endpoint to retrieve server logs.
router.get("/logs", requireAuth, (req, res) => {
  res.json({ logs: getLogs() });
});

module.exports = router;