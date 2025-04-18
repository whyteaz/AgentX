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
  "SUPABASE_SERVICE_KEY",
  "SUPABASE_JWT_SECRET",
  "AZURE_APPLICATION_INSIGHTS_CONNECTION_STRING"
];

// Optional env vars for Azure OpenAI
const optionalEnvVars = [
  "AZURE_OPENAI_ENDPOINT",
  "AZURE_OPENAI_API_KEY",
  "AZURE_OPENAI_DEPLOYMENT"
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
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
  // Azure Application Insights
  azureAppInsightsConnectionString: process.env.AZURE_APPLICATION_INSIGHTS_CONNECTION_STRING,
  // Azure OpenAI (optional)
  azureOpenAI: {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT
  }
};