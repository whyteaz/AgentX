// test-azure-openai.js
require('dotenv').config();
const axios = require('axios');

// Log environment variables (redacted for security)
console.log('Environment variables check:');
console.log(`AZURE_OPENAI_ENDPOINT: ${process.env.AZURE_OPENAI_ENDPOINT ? '✓ Set' : '✗ Missing'}`);
console.log(`AZURE_OPENAI_API_KEY: ${process.env.AZURE_OPENAI_API_KEY ? '✓ Set' : '✗ Missing'}`);
console.log(`AZURE_OPENAI_DEPLOYMENT: ${process.env.AZURE_OPENAI_DEPLOYMENT ? '✓ Set' : '✗ Missing'}`);

async function testAzureOpenAI() {
  // Exit if any required env vars are missing
  if (!process.env.AZURE_OPENAI_ENDPOINT || 
      !process.env.AZURE_OPENAI_API_KEY || 
      !process.env.AZURE_OPENAI_DEPLOYMENT) {
    console.error('ERROR: Missing required environment variables');
    return;
  }

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, '');
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  
  const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2023-12-01-preview`;
  
  console.log(`Testing connection to: ${url}`);
  
  try {
    const response = await axios({
      method: 'post',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      data: {
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Say hello world!" }
        ],
        temperature: 0.7,
        max_tokens: 50
      }
    });
    
    console.log('SUCCESS! Response received:');
    console.log('Status:', response.status);
    console.log('Message:', response.data.choices[0].message.content);
    console.log('Full response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('ERROR connecting to Azure OpenAI:');
    console.error('Message:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAzureOpenAI();