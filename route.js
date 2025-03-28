const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");
const config = require("./config");
const { log, getLogs } = require("./logger");
const {
  runAgent,
  scheduleTrollReplies,
  runBootlickAgent,
  scheduleBootlickReplies,
  trollStatuses,
  bootlickStatuses,
  getUserSchedules,
  getScheduleById
} = require("./agent");
const { requireAuth } = require("./middleware");

const router = express.Router();

// Expose config for client-side initialization.
router.get("/api/config", (req, res) => {
  res.json({
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey,
    // Let the frontend know if Azure OpenAI is available
    azureOpenAIAvailable: !!(config.azureOpenAI.endpoint && config.azureOpenAI.apiKey && config.azureOpenAI.deployment)
  });
});

// Set a secure cookie with the token.
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
    const { tweetLink, trollLord, aiProvider = "gemini" } = req.body;
    const trollLordMode = trollLord === "true";
    log("info", `Troll Lord mode: ${trollLordMode}, AI Provider: ${aiProvider}`);

    if (!tweetLink || !/^https:\/\/(twitter\.com|x\.com)\/.*\/status\/\d+/.test(tweetLink)) {
      return res.status(400).json({ error: "Invalid tweet link provided." });
    }

    if (trollLordMode) {
      const schedule = await scheduleTrollReplies(tweetLink, req.userId, aiProvider);
      const schedulesForUser = getUserSchedules(req.userId);
      res.json({
        status: "Success",
        message: "Troll Lord mode activated: 10 replies scheduled.",
        scheduleId: schedule.scheduleId,
        schedules: schedulesForUser
      });
    } else {
      const result = await runAgent(tweetLink, undefined, aiProvider);
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
    const { profileUrls, multipleProfiles, aiProvider = "gemini" } = req.body;
    const multipleProfilesMode = multipleProfiles === "true";
    log("info", `Multiple Profiles mode: ${multipleProfilesMode}, AI Provider: ${aiProvider}`);

    if (!profileUrls || profileUrls.trim() === "") {
      return res.status(400).json({ error: "No profile URLs provided." });
    }

    if (!multipleProfilesMode) {
      const profileUrl = profileUrls.trim();
      if (!/^https:\/\/(twitter\.com|x\.com)\/[^/]+\/?$/.test(profileUrl)) {
        return res.status(400).json({
          error:
            "Invalid profile URL format. Should be like: https://twitter.com/username"
        });
      }
      const result = await runBootlickAgent(profileUrl, undefined, aiProvider);
      res.json({ status: "Success", data: result });
    } else {
      const result = await scheduleBootlickReplies(profileUrls, req.userId, aiProvider);
      const schedulesForUser = getUserSchedules(req.userId);
      if (result.firstError) {
        res.json({
          status: "Warning",
          message: `Multiple Profiles mode activated but encountered an issue with the first profile: ${result.firstError}. Remaining profiles will be processed as scheduled.`,
          statusKey: result.statusKey,
          scheduleId: result.scheduleId,
          schedules: schedulesForUser
        });
      } else {
        res.json({
          status: "Success",
          message: `Multiple Profiles mode activated: ${result.totalReplies} replies scheduled with 16-minute intervals.`,
          statusKey: result.statusKey,
          scheduleId: result.scheduleId,
          schedules: schedulesForUser
        });
      }
    }
  } catch (error) {
    log("error", "Error in /bootlick:", error);
    next(error);
  }
});

// /schedules endpoint: returns all schedules for the current user
router.get("/schedules", requireAuth, async (req, res, next) => {
  try {
    const schedulesForUser = getUserSchedules(req.userId);
    res.json({ status: "Success", data: schedulesForUser });
  } catch (error) {
    log("error", "Error in /schedules:", error);
    next(error);
  }
});

// /schedule/:id endpoint: returns details of a specific schedule
router.get("/schedule/:id", requireAuth, async (req, res, next) => {
  try {
    const scheduleId = req.params.id;
    const schedule = getScheduleById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }
    if (schedule.userId !== req.userId) {
      return res
        .status(403)
        .json({ error: "Forbidden - You don't have access to this schedule" });
    }
    res.json({ status: "Success", data: schedule });
  } catch (error) {
    log("error", `Error in /schedule/${req.params.id}:`, error);
    next(error);
  }
});

// Endpoint to retrieve Troll Lord status.
router.get("/troll-status", requireAuth, (req, res) => {
  const tweetLink = req.query.tweetLink;
  if (!tweetLink)
    return res.status(400).json({ error: "Missing tweetLink parameter" });
  res.json({ status: "Success", data: trollStatuses[tweetLink] || [] });
});

// Endpoint to retrieve Bootlick status.
router.get("/bootlick-status", requireAuth, (req, res) => {
  const statusKey = req.query.statusKey;
  if (!statusKey)
    return res.status(400).json({ error: "Missing statusKey parameter" });
  res.json({ status: "Success", data: bootlickStatuses[statusKey] || [] });
});

// Endpoint to retrieve server logs.
router.get("/logs", requireAuth, (req, res) => {
  res.json({ logs: getLogs() });
});

module.exports = router;