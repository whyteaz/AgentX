// config.js
require("dotenv").config();

const requiredEnvVars = [
  "PORT",
  "GEMINI_API_KEY",
  "TWITTER_API_KEY",
  "TWITTER_API_SECRET",
  "TWITTER_ACCESS_TOKEN",
  "TWITTER_ACCESS_SECRET",
  "TWITTER_BOOTLICK_API_KEY",
  "TWITTER_BOOTLICK_API_SECRET",
  "TWITTER_BOOTLICK_ACCESS_TOKEN",
  "TWITTER_BOOTLICK_ACCESS_SECRET",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_JWT_SECRET"
];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

module.exports = {
  port: process.env.PORT || 3000,
  geminiApiKey: process.env.GEMINI_API_KEY,
  // Trolling Twitter account
  twitterApiKey: process.env.TWITTER_API_KEY,
  twitterApiSecret: process.env.TWITTER_API_SECRET,
  twitterAccessToken: process.env.TWITTER_ACCESS_TOKEN,
  twitterAccessSecret: process.env.TWITTER_ACCESS_SECRET,
  // Bootlicking Twitter account
  twitterBootlickApiKey: process.env.TWITTER_BOOTLICK_API_KEY,
  twitterBootlickApiSecret: process.env.TWITTER_BOOTLICK_API_SECRET,
  twitterBootlickAccessToken: process.env.TWITTER_BOOTLICK_ACCESS_TOKEN,
  twitterBootlickAccessSecret: process.env.TWITTER_BOOTLICK_ACCESS_SECRET,
  // Supabase config
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET
};