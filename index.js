const express = require("express");
const path = require("path");
const { runAgent } = require("./agent");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Parse URL-encoded data from form submissions
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, "public")));

// Endpoint to trigger the AI agent
app.post("/trigger", async (req, res) => {
  const tweetLink = req.body.tweetLink;
  try {
    const result = await runAgent(tweetLink);
    res.json({ status: "Success", data: result });
  } catch (error) {
    console.error("Error in /trigger:", error);
    res.status(500).json({ error: error.toString() });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
