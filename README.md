# AgentX - AI-Powered Twitter Automation Tool

AgentX is a web application that uses AI to generate and automate Twitter interactions. It offers two primary functions:

1. **Trolling-as-a-Service**: Generates witty, provocative responses to tweets
2. **Bootlicking-as-a-Service**: Creates excessively flattering replies to users' latest tweets

## Features

### Multiple AI Provider Support
- **Azure OpenAI**: Primary AI provider for high-quality responses (default)
- **Google Gemini**: Alternative AI provider as a fallback option

### Trolling Agent
- **Standard Mode**: Generate a single troll reply to any tweet
- **Troll Lord Mode**: Schedule 10 successive replies to a tweet (one every 16 minutes)

### Bootlicking Agent
- **Standard Mode**: Generate a flattering reply to a user's latest tweet
- **Multiple Profiles Mode**: Schedule replies to multiple Twitter profiles consecutively

### Dashboard
- View and track all scheduled reply tasks
- Monitor task status (active, completed, failed)
- See detailed logs of all system activities
- View response history for each scheduled task

### User Authentication
- Secure login/signup system via Supabase
- Protected routes requiring authentication

## Technical Stack

- **Backend**: Node.js, Express
- **Frontend**: HTML, CSS, JavaScript with fullPage.js
- **AI**: Azure OpenAI, Google Gemini API
- **API Integration**: Twitter API V2
- **Authentication**: Supabase, JWT
- **Monitoring**: Azure Application Insights for logging

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- NPM or Yarn
- Twitter Developer Account with API keys
- Azure OpenAI account with API access
- Google Gemini API key
- Supabase account and project
- Azure Application Insights account (optional for logging)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3000

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Twitter API (Main trolling account)
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret

# Twitter API (Bootlicking account)
TWITTER_BOOTLICK_API_KEY=your_bootlick_twitter_api_key
TWITTER_BOOTLICK_API_SECRET=your_bootlick_twitter_api_secret
TWITTER_BOOTLICK_ACCESS_TOKEN=your_bootlick_twitter_access_token
TWITTER_BOOTLICK_ACCESS_SECRET=your_bootlick_twitter_access_secret

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# Azure Application Insights (optional)
AZURE_APPLICATION_INSIGHTS_CONNECTION_STRING=your_azure_insights_connection_string

# Azure OpenAI Configuration 
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com 
AZURE_OPENAI_API_KEY=your_azure_openai_key 
AZURE_OPENAI_DEPLOYMENT=your_model_deployment_name`
```

### Azure OpenAI Setup

1.  Create an Azure OpenAI resource in Azure Portal
2.  Deploy a model (like gpt-35-turbo) with a unique deployment name
3.  Get your API Key from "Keys and Endpoint" section
4.  Configure your `.env` file with these values

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd toas
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm run dev
   ```

4. Access the application:
   ```
   http://localhost:3000
   ```

## Usage

### Authentication
1. Visit the login page at `/login.html`
2. Sign up for a new account or log in with existing credentials

### Trolling Feature
1. Navigate to the "Troll" section
2. Enter a tweet URL in the format: `https://twitter.com/username/status/1234567890`
3. Toggle "Troll Lord Mode" if you want to schedule multiple replies
4. Select AI provider (Azure OpenAI is default)
5. Click "Generate Troll Response"

### Bootlicking Feature
1. Navigate to the "Bootlick" section
2. Enter a Twitter profile URL: `https://twitter.com/username`
3. Toggle "Multiple Profiles Mode" to input multiple profiles (one per line)
4. Select AI provider (Azure OpenAI is default)
5. Click "Generate Bootlicking Response"

### Dashboard
1. Navigate to the "Dashboard" section
2. View "Queued Schedules" to track scheduled reply tasks
3. Check "Server Logs" for system activity

## Rate Limiting

- Standard mode operations have a 15-minute cooldown between uses
- Scheduled replies are sent every 16 minutes to avoid Twitter rate limits

## License
ISC

## Notes
- This project was created as a hackathon submission
- Use responsibly and in accordance with Twitter's terms of service