# AI Trolling Agent

**Troll Like a Pro, Log Like a Boss — Powered by AI and Blockchain!**
Disclaimer: I am not a coder and this repo might trigger some senior dev that enjoy clean code and best practices. Please be kind.

## Overview

The AI Trolling Agent is a cutting-edge application that uses Google Gemini to generate witty, savage replies to tweets and logs every action on the NEAR blockchain. It features two modes:

- **Standard Mode:** Generate one reply per request with a 15-minute cooldown. Sit back and wait—if your tweet hits the milestone, HOT tokens might be coming your way!
- **Troll Lord Mode:** Automatically schedule 10 successive replies (every 16 minutes) to a target tweet.

Additionally, the app monitors Twitter mentions. When your bot is mentioned, it generates a troll response and follows the user—making every interaction both mischievous and memorable.

## Features

- **AI-Powered Replies:** Uses Google Gemini to generate creative, spicy responses.
- **Blockchain Logging:** Every reply is immutably logged on the NEAR blockchain.
- **Twitter Integration:** Fetches tweet details, replies, and monitors mentions.
- **HOT Token Rewards:** Optionally integrate your HOT wallet to earn rewards if your tweet meets a milestone.
- **Mischievous UI:** A sleek frontend with dark mode and collapsible sections for testing transfers and viewing server logs.

## Prerequisites

Before running the app locally, ensure you have the following installed:

- [Node.js](https://nodejs.org/en/) (v14 or higher)
- [npm](https://www.npmjs.com/)

## Setup

### 1. Clone the Repository

Open your terminal and run:

git clone https://github.com/yourusername/toas.git
cd toas

### 2. Install Dependencies

Install the required Node.js packages by running:

npm install

### 3. Configure Environment Variables

Create a .env file in the root directory of the project with the following variables (replace placeholder values with your own credentials):

PORT=3000
NEAR_ACCOUNT_ID=your_near_account.testnet
NEAR_PRIVATE_KEY=your_near_private_key
NEAR_NETWORK=testnet
CONTRACT_ID=your_contract_id
GEMINI_API_KEY=your_google_gemini_api_key
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret
HOT_OMNI_API_KEY=your_hot_omni_api_key  # if applicable

## Running Locally

To start the server locally, run:

npm start

For development with auto-reload, run:

npm run dev

The server will start on http://localhost:3000.

## How It Works

### Standard Mode
Paste & Submit:
Paste a tweet link and (optionally) your HOT wallet address.
Generate & Reply:
Hit submit and watch our AI conjure a spicy comeback.
Blockchain Logging:
Your reply is unleashed on Twitter and immortalized on the NEAR blockchain.
Sit Back & Wait:
If your tweet hits the milestone, HOT tokens might be coming your way!
Cooldown:
Wait 15 minutes before you can strike again.

### Troll Lord Mode
Ascend to Troll Lord:
Check the "Enable Troll Lord Mode" checkbox.
Multi-Attack:
The AI immediately replies to the target tweet and schedules nine additional savage replies at 16-minute intervals.
Immutable Proof:
Every reply is logged on the NEAR blockchain—proof that your trolling is legendary.

### Mentions Monitoring
The server polls Twitter every 15 minutes for mentions.
When your bot is mentioned, it generates a troll response, replies to the mention, and follows the user who mentioned you.

## Troubleshooting
### Rate Limit Errors:
If you encounter a 429 error ("Too Many Requests") from Twitter, the app logs the error with a human-readable timestamp. This indicates you've hit your daily request quota; you might need to reduce polling frequency or wait until the limit resets.

### Environment Variables:
Double-check your .env file to ensure all required API keys and credentials are correctly set.

### Port Issues:
If the app does not start on port 3000, check if that port is already in use or adjust the PORT variable in your .env file.

## Contributing
Contributions are welcome! Feel free to fork this repository, implement improvements, and submit pull requests. For significant changes, please open an issue first to discuss your ideas.

## License
This project is licensed under the MIT License. See the LICENSE file for details.



Happy trolling and remember: Troll like a pro, log like a boss! 😎🔥

