// index.js
const express = require("express");
const path = require("path");
const { runAgent, replyToMention } = require("./agent");
const { transferOmniToken } = require("./near");
const { fetchMentions } = require("./twitter");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// In-memory store for server logs
const serverLogs = [];
const originalLog = console.log;
console.log = function (...args) {
  const message = args.join(" ");
  serverLogs.push(message);
  originalLog.apply(console, args);
};

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// In-memory store for Troll Lord statuses (key: tweetLink)
const trollStatuses = {};
// In-memory store for bounty tasks (key: tweetId)
const pendingBounties = {};

// /trigger endpoint: if Troll Lord mode is enabled, schedule replies; otherwise, process one reply.
app.post("/trigger", async (req, res) => {
  const tweetLink = req.body.tweetLink;
  const trollLordMode = req.body.trollLord === "on" || req.body.trollLord === "true";
  const hotWallet = req.body.hotWallet; // Capture HOT wallet address
  console.log("Troll Lord mode:", trollLordMode);
  
  if (trollLordMode) {
    // For Troll Lord mode we won’t process bounty checking
    trollStatuses[tweetLink] = [];
    scheduleTrollReplies(tweetLink);
    res.json({ status: "Success", message: "Troll Lord mode activated: 10 replies scheduled." });
  } else {
    try {
      const result = await runAgent(tweetLink);
      // If HOT wallet address is provided, store bounty details and schedule a check after 24 hours.
      if (hotWallet) {
        pendingBounties[result.tweetId] = { hotWallet, submittedAt: Date.now() };
        setTimeout(() => {
          checkBountyCondition(result.tweetId);
        }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
      }
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

// Simulated bounty check that triggers a HOT token transfer manually without checking tweet likes.
async function checkBountyCondition(tweetId) {
  const bounty = pendingBounties[tweetId];
  if (!bounty) return;
  try {
    console.log(`Simulating bounty check for tweet ${tweetId}: assuming tweet qualifies for bounty.`);
    // Transfer 1 HOT token (or desired amount) to the provided wallet address using HOT OMNI SDK.
    const transferResult = await transferOmniToken(bounty.hotWallet, "0.01");
    console.log("HOT token transfer result:", transferResult);
  } catch (error) {
    console.error("Error simulating bounty condition for tweet:", tweetId, error);
  }
  // Remove the bounty task regardless of outcome.
  delete pendingBounties[tweetId];
}

// New endpoint for testing transferOmniToken from the frontend.
app.get("/test-transfer", async (req, res) => {
  const sampleWallet = req.query.wallet || "example.hotwallet";
  const sampleAmount = req.query.amount || "1";
  try {
    const result = await transferOmniToken(sampleWallet, sampleAmount);
    res.json({ status: "success", result });
  } catch (error) {
    res.status(500).json({ status: "error", error: error.toString() });
  }
});

// Endpoint to fetch Troll Lord status for a given tweet link.
app.get("/troll-status", (req, res) => {
  const tweetLink = req.query.tweetLink;
  if (!tweetLink) {
    return res.status(400).json({ error: "Missing tweetLink parameter" });
  }
  const status = trollStatuses[tweetLink] || [];
  res.json({ status: "Success", data: status });
});

// New endpoint to retrieve server logs.
app.get("/logs", (req, res) => {
  res.json({ logs: serverLogs });
});

// Start the server and begin polling for mentions using recursive setTimeout.
app.listen(port, () => {
  console.log(`Server running on port ${port}`);

  async function pollMentions() {
    try {
      console.log("Checking for mentions...");
      const mentions = await fetchMentions();
      // Access the mentions from the returned object
      const mentionArray = (mentions && mentions.data) ? mentions.data : [];
      if (mentionArray.length > 0) {
        // Since we're fetching only the latest mention, process the first one.
        const mention = mentionArray[0];
        const tweetId = mention.id;
        const tweetText = mention.text;
        console.log(`Mention detected: ${tweetText}`);
        // Use agent's reply function
        await replyToMention(tweetId, tweetText);
        console.log(`Replied with 'Hi' to tweet ID: ${tweetId}`);
      } else {
        console.log("No new mentions.");
      }
    } catch (error) {
      console.error("Error during mention polling:", error);
    }
    // Poll every 15 minutes (15 * 60 * 1000 ms)
    setTimeout(pollMentions, 15 * 60 * 1000);
  }
  pollMentions();
});
