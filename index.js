// index.js
const express = require("express");
const path = require("path");
const { runAgent } = require("./agent");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Endpoint to trigger the AI agent.
app.post("/trigger", async (req, res) => {
  const tweetLink = req.body.tweetLink;
  // Check if Troll Lord mode is enabled.
  const trollLordMode = req.body.trollLord === "on" || req.body.trollLord === "true";
  console.log("Troll Lord mode:", trollLordMode);
  
  if (trollLordMode) {
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

// Schedule 10 replies at 16-minute intervals.
function scheduleTrollReplies(tweetLink) {
  let count = 0;
  const maxCount = 2;
  const interval = 16 * 60 * 1000; // 16 minutes in ms.
  console.log("Scheduling Troll Lord replies for tweet:", tweetLink);
  
  function sendReply() {
    if (count < maxCount) {
      runAgent(tweetLink, count + 1)
        .then(result => {
          console.log(`Troll Lord reply ${count + 1} sent:`, result);
        })
        .catch(err => {
          console.error(`Error in Troll Lord reply ${count + 1}:`, err);
        });
      count++;
      if (count < maxCount) {
        setTimeout(sendReply, interval);
      }
    }
  }
  sendReply();
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
