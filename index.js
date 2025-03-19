// index.js
const express = require("express");
const path = require("path");
const { runAgent, scheduleTrollReplies, pollMentions, trollStatuses } = require("./agent");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Simple logging helper.
const serverLogs = [];
function logMessage(...args) {
  const timestamp = new Date().toLocaleString();
  const message = `[${timestamp}] ${args.join(" ")}`;
  console.log(message);
  serverLogs.push(message);
}

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// /trigger endpoint: Uses agent functions.
app.post("/trigger", async (req, res) => {
  const { tweetLink, trollLord } = req.body;
  const trollLordMode = trollLord === "true";
  logMessage("Troll Lord mode:", trollLordMode);
  
  if (trollLordMode) {
    scheduleTrollReplies(tweetLink);
    res.json({ status: "Success", message: "Troll Lord mode activated: 10 replies scheduled." });
  } else {
    try {
      const result = await runAgent(tweetLink);
      res.json({ status: "Success", data: result });
    } catch (error) {
      logMessage("Error in /trigger:", error);
      res.status(500).json({ error: error.toString() });
    }
  }
});

// Removed /test-transfer endpoint (HOT wallet code removed).

// Endpoint to retrieve Troll Lord status.
app.get("/troll-status", (req, res) => {
  const tweetLink = req.query.tweetLink;
  if (!tweetLink) return res.status(400).json({ error: "Missing tweetLink parameter" });
  res.json({ status: "Success", data: trollStatuses[tweetLink] || [] });
});

// Endpoint to retrieve server logs.
app.get("/logs", (req, res) => {
  res.json({ logs: serverLogs });
});

// Start the server and begin polling for mentions.
app.listen(port, () => {
  logMessage(`Server running on port ${port}`);
  //pollMentions(); // this reply to mentions on daily
});
