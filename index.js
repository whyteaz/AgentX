const express = require("express");
const { runAgent } = require("./agent");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.get("/trigger", async (req, res) => {
  try {
    const result = await runAgent();
    res.json({
      status: "Agent triggered successfully",
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: "Error running agent", details: error.toString() });
  }
});

app.get("/", (req, res) => {
  res.send("AI Agent is running. Use /trigger to run the agent.");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
