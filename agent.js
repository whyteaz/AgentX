// agent.js
const { replyTweet, fetchTweet, fetchLatestTweet } = require("./twitter");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { log } = require("./logger");
require("dotenv").config();

// Constants for Agent modes
const MAX_REPLY_COUNT = 10;
const REPLY_INTERVAL_MS = 16 * 60 * 1000; // 16 minutes

// Initialize Google Gemini API
log("info", "Initializing Google Gemini API...");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Create troll model
const trollModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
  systemInstruction: "Your task is to troll internet strangers on twitter. Please respond to the original tweet by trolling the poster. Your troll response should be as spicy as possible and not more than 280 characters. Output only the tweet response."
});

// Create bootlick model
const bootlickModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
  systemInstruction: "Your task is to excessively praise and flatter the author of a tweet. Be extremely enthusiastic and complimentary about both the tweet content and the author. Your bootlicking response should be sycophantic but still believable and not more than 280 characters. Output only the tweet response."
});

log("info", "Google Gemini API models initialized.");

// In-memory store for reply statuses
const trollStatuses = {};
const bootlickStatuses = {};

// Helper: Retry an async operation with exponential backoff
async function retryOperation(operation, retries = 3, delay = 1000) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }
}

// Generates a trolling response using Google Gemini
async function generateTrollResponse(tweetContent) {
  const prompt = `Generate a trolling response for this tweet: "${tweetContent}"`;
  log("info", "Generating troll response with prompt:", prompt);
  try {
    const result = await retryOperation(() => trollModel.generateContent(prompt));
    const responseText = result.response.text();
    log("info", "Gemini troll response received:", responseText);
    return responseText;
  } catch (error) {
    log("error", "Error calling Google Gemini API for troll response:", error);
    return "This tweet is by AI";
  }
}

// Generates a bootlicking response using Google Gemini
async function generateBootlickResponse(tweetContent, username) {
  const prompt = `Generate a bootlicking response for this tweet by ${username}: "${tweetContent}"`;
  log("info", "Generating bootlick response with prompt:", prompt);
  try {
    const result = await retryOperation(() => bootlickModel.generateContent(prompt));
    const responseText = result.response.text();
    log("info", "Gemini bootlick response received:", responseText);
    return responseText;
  } catch (error) {
    log("error", "Error calling Google Gemini API for bootlick response:", error);
    return "This is amazing! You're the best!";
  }
}

// Processes a tweet by generating a trolling response and replying
async function runAgent(tweetLink, replyCount) {
  try {
    log("info", "Received tweet link:", tweetLink);
    const tweetIdMatch = tweetLink.match(/status\/(\d+)/);
    if (!tweetIdMatch) throw new Error("Invalid tweet link format.");
    const tweetId = tweetIdMatch[1];
    log("info", "Extracted tweet ID:", tweetId);

    const tweetData = await fetchTweet(tweetId);
    if (!tweetData?.text) throw new Error("Unable to fetch tweet content.");
    const tweetContent = tweetData.text;
    log("info", "Fetched tweet content:", tweetContent);

    let trollResponse = await generateTrollResponse(tweetContent) || "Hi (This tweet is by AI)";
    if (replyCount !== undefined) {
      trollResponse += ` (#${replyCount})`;
    }
    log("info", "Generated troll response:", trollResponse);

    const replyResponse = await replyTweet(tweetId, trollResponse);
    log("info", "Reply response received:", replyResponse);

    return { tweetId, tweetContent, trollResponse, replyResponse };
  } catch (error) {
    log("error", "Error in runAgent:", error);
    throw error;
  }
}

// Processes a profile by finding its latest tweet and replying with a bootlicking message
async function runBootlickAgent(profileUrl, replyCount) {
  try {
    log("info", "Received profile URL:", profileUrl);
    
    // Extract username from profileUrl
    // Handle both twitter.com/username and x.com/username formats
    const usernameMatch = profileUrl.match(/(?:twitter\.com|x\.com)\/([^/]+)/);
    if (!usernameMatch) throw new Error("Invalid profile URL format.");
    const username = usernameMatch[1];
    log("info", "Extracted username:", username);

    // Fetch the latest tweet from the profile
    const latestTweet = await fetchLatestTweet(username, 'bootlick');
    if (!latestTweet || !latestTweet.text) {
      throw new Error(`No tweets found for profile '${username}' or account may be private.`);
    }
    
    const tweetId = latestTweet.id;
    const tweetContent = latestTweet.text;
    log("info", "Fetched latest tweet:", tweetContent);

    // Generate bootlicking response
    let bootlickResponse = await generateBootlickResponse(tweetContent, username) || "This is amazing! You're the best!";
    if (replyCount !== undefined) {
      bootlickResponse += ` (#${replyCount})`;
    }
    log("info", "Generated bootlick response:", bootlickResponse);

    // Reply to the tweet
    const replyResponse = await replyTweet(tweetId, bootlickResponse, 'bootlick');
    log("info", "Bootlick reply response received:", replyResponse);

    return { 
      profileUrl,
      username,
      tweetId, 
      tweetContent, 
      bootlickResponse, 
      replyResponse 
    };
  } catch (error) {
    log("error", "Error in runBootlickAgent:", error);
    throw error;
  }
}

// Replies to a mention and follows the user
async function replyToMention(tweetId, tweetText) {
  try {
    log("info", `Agent replying to mention. Tweet ID: ${tweetId} | Text: ${tweetText}`);
    const trollResponse = await generateTrollResponse(tweetText) || "Hi (This tweet is by AI)";
    const replyResponse = await replyTweet(tweetId, trollResponse);
    log("info", "Agent reply response:", replyResponse);
    return replyResponse;
  } catch (error) {
    log("error", "Error in replyToMention:", error);
    throw error;
  }
}

// Schedules 10 replies (Troll Lord Mode) with a 16-minute interval
async function scheduleTrollReplies(tweetLink) {
  let count = 1;
  log("info", "Scheduling Troll Lord replies for tweet:", tweetLink);
  trollStatuses[tweetLink] = [];

  // Immediate reply
  try {
    const result = await runAgent(tweetLink, count);
    log("info", `Troll Lord reply ${count} sent:`, result);
    trollStatuses[tweetLink].push({ replyNumber: count, result });
  } catch (error) {
    log("error", `Error in Troll Lord reply ${count}:`, error);
    trollStatuses[tweetLink].push({ replyNumber: count, error: error.toString() });
  }
  count++;

  const intervalId = setInterval(async () => {
    if (count <= MAX_REPLY_COUNT) {
      try {
        const result = await runAgent(tweetLink, count);
        log("info", `Troll Lord reply ${count} sent:`, result);
        trollStatuses[tweetLink].push({ replyNumber: count, result });
      } catch (error) {
        log("error", `Error in Troll Lord reply ${count}:`, error);
        trollStatuses[tweetLink].push({ replyNumber: count, error: error.toString() });
      }
      count++;
    } else {
      clearInterval(intervalId);
      log("info", "Completed scheduling all Troll Lord replies.");
    }
  }, REPLY_INTERVAL_MS);
}

// Schedules bootlicking replies to multiple profiles with a 16-minute interval
async function scheduleBootlickReplies(profileUrls) {
  const profiles = profileUrls.split('\n').filter(url => url.trim() !== '');
  
  if (profiles.length === 0) {
    throw new Error("No valid profile URLs provided");
  }
  
  log("info", `Scheduling Bootlick replies for ${profiles.length} profiles:`, profiles);
  
  const statusKey = profiles.join('|');
  bootlickStatuses[statusKey] = [];
  
  // Process first profile immediately
  let currentProfileIndex = 0;
  let count = 1;
  
  try {
    const result = await runBootlickAgent(profiles[currentProfileIndex], count);
    log("info", `Bootlick reply ${count} sent to ${profiles[currentProfileIndex]}:`, result);
    bootlickStatuses[statusKey].push({ 
      replyNumber: count, 
      profileUrl: profiles[currentProfileIndex],
      result 
    });
  } catch (error) {
    const errorMessage = error.toString();
    log("error", `Error in Bootlick reply ${count} to ${profiles[currentProfileIndex]}:`, error);
    bootlickStatuses[statusKey].push({ 
      replyNumber: count, 
      profileUrl: profiles[currentProfileIndex],
      error: errorMessage
    });
    
    // Return the status key even when the first profile fails
    if (currentProfileIndex === 0) {
      return {
        totalProfiles: profiles.length,
        statusKey,
        firstError: errorMessage
      };
    }
  }
  
  currentProfileIndex++;
  count++;
  
  // Schedule remaining profiles with interval
  const intervalId = setInterval(async () => {
    if (currentProfileIndex < profiles.length) {
      try {
        const result = await runBootlickAgent(profiles[currentProfileIndex], count);
        log("info", `Bootlick reply ${count} sent to ${profiles[currentProfileIndex]}:`, result);
        bootlickStatuses[statusKey].push({ 
          replyNumber: count, 
          profileUrl: profiles[currentProfileIndex],
          result 
        });
      } catch (error) {
        log("error", `Error in Bootlick reply ${count} to ${profiles[currentProfileIndex]}:`, error);
        bootlickStatuses[statusKey].push({ 
          replyNumber: count, 
          profileUrl: profiles[currentProfileIndex],
          error: error.toString() 
        });
      }
      
      currentProfileIndex++;
      count++;
    } else {
      clearInterval(intervalId);
      log("info", "Completed scheduling all Bootlick replies.");
    }
  }, REPLY_INTERVAL_MS);
  
  return {
    totalProfiles: profiles.length,
    statusKey
  };
}

// Polls Twitter mentions with exponential backoff on failure
async function pollMentions(pollInterval = 24 * 60 * 60 * 1000) {
  const { fetchMentions } = require("./twitter");
  try {
    log("info", "Checking for mentions...");
    const mentions = await fetchMentions();
    if (mentions && mentions.length > 0) {
      const mention = mentions[0];
      log("info", `Mention detected: ${mention.text}`);
      await replyToMention(mention.id, mention.text);
    } else {
      log("info", "No new mentions.");
    }
    // Reset poll interval on success
    setTimeout(() => pollMentions(24 * 60 * 60 * 1000), pollInterval);
  } catch (error) {
    log("error", "Error during mention polling:", error);
    // Increase the poll interval on error (up to a max cap)
    const newInterval = Math.min(pollInterval * 2, 24 * 60 * 60 * 1000 * 4); // cap at 4 days
    setTimeout(() => pollMentions(newInterval), newInterval);
  }
}

module.exports = { 
  runAgent, 
  runBootlickAgent,
  replyToMention, 
  scheduleTrollReplies,
  scheduleBootlickReplies,
  pollMentions, 
  trollStatuses,
  bootlickStatuses
};