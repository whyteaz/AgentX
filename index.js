// index.js
const express = require("express");
const path = require("path");
const { runAgent } = require("./agent");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// In-memory store for Troll Lord statuses (key: tweetLink)
const trollStatuses = {};

// /trigger endpoint: if Troll Lord mode is enabled, schedule replies; otherwise, process one reply.
app.post("/trigger", async (req, res) => {
  const tweetLink = req.body.tweetLink;
  const trollLordMode = req.body.trollLord === "on" || req.body.trollLord === "true";
  console.log("Troll Lord mode:", trollLordMode);
  
  if (trollLordMode) {
    // Initialize the status array for this tweetLink.
    trollStatuses[tweetLink] = [];
    scheduleTrollReplies(tweetLink);
    res.json({ status: "Success", message: "Troll Lord mode activated: 10 replies scheduled." });
  } else {
    try {
      const result = await runAgent(tweetLink);
      res.json({ status: "Success", data: result });
    } catch (error) {
      console.error("Error in /trigger:", error);
      res.status(500).json({ error: error.toString() });
    }
  }
});

// Server-side scheduling for Troll Lord mode.
function scheduleTrollReplies(tweetLink) {
  let count = 1;
  const maxCount = 10;
  const interval = 16 * 60 * 1000; // 16 minutes in ms
  console.log("Scheduling Troll Lord replies for tweet:", tweetLink);

  // Send the first reply immediately.
  runAgent(tweetLink, count)
    .then(result => {
      console.log(`Troll Lord reply ${count} sent:`, result);
      trollStatuses[tweetLink].push({ replyNumber: count, result });
    })
    .catch(err => {
      console.error(`Error in Troll Lord reply ${count}:`, err);
      trollStatuses[tweetLink].push({ replyNumber: count, error: err.toString() });
    });
  count++;

  // Schedule the remaining replies.
  const intervalId = setInterval(() => {
    if (count <= maxCount) {
      runAgent(tweetLink, count)
        .then(result => {
          console.log(`Troll Lord reply ${count} sent:`, result);
          trollStatuses[tweetLink].push({ replyNumber: count, result });
        })
        .catch(err => {
          console.error(`Error in Troll Lord reply ${count}:`, err);
          trollStatuses[tweetLink].push({ replyNumber: count, error: err.toString() });
        });
      count++;
    } else {
      clearInterval(intervalId);
      console.log("Completed scheduling all Troll Lord replies.");
    }
  }, interval);
}

// Endpoint to fetch Troll Lord status for a given tweet link.
app.get("/troll-status", (req, res) => {
  const tweetLink = req.query.tweetLink;
  if (!tweetLink) {
    return res.status(400).json({ error: "Missing tweetLink parameter" });
  }
  const status = trollStatuses[tweetLink] || [];
  res.json({ status: "Success", data: status });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
