// azure-openai.js
const config = require("./config");
const { log } = require("./logger");
const axios = require("axios");

// Initialize variables
let isInitialized = false;

// Check if configuration exists
const hasConfig = !!(
  config.azureOpenAI.endpoint && 
  config.azureOpenAI.apiKey && 
  config.azureOpenAI.deployment
);

if (hasConfig) {
  isInitialized = true;
  log("info", "Azure OpenAI configuration validated");
}

async function generateResponse(prompt, systemPrompt) {
  if (!isAvailable()) {
    throw new Error("Azure OpenAI not available");
  }
  
  try {
    log("info", "Generating Azure OpenAI response");
    
    // Format the endpoint URL correctly (remove trailing slash if present)
    const baseUrl = config.azureOpenAI.endpoint.replace(/\/$/, '');
    const url = `${baseUrl}/openai/deployments/${config.azureOpenAI.deployment}/chat/completions?api-version=2023-12-01-preview`;
    
    log("info", "Calling Azure OpenAI endpoint:", url);
    
    const response = await axios({
      method: 'post',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.azureOpenAI.apiKey
      },
      data: {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 120
      }
    });
    
    log("info", "Azure OpenAI response received successfully");
    return response.data.choices[0].message.content;
  } catch (error) {
    log("error", "Error calling Azure OpenAI:", error.message);
    if (error.response) {
      log("error", "Response status:", error.response.status);
      log("error", "Response data:", JSON.stringify(error.response.data));
    }
    throw error;
  }
}

function isAvailable() {
  return isInitialized && hasConfig;
}

module.exports = { generateResponse, isAvailable };