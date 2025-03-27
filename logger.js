// logger.js
const config = require('./config');
const https = require('https');

// Initialize in-memory logs array
const logs = [];

// Set Azure connection values
const connectionString = config.azureAppInsightsConnectionString || '';
const instrumentationKey = connectionString.split(';').find(s => s.startsWith('InstrumentationKey='))?.split('=')[1];

/**
 * Send log directly to Azure Application Insights without the SDK
 * @param {string} level - Log level
 * @param {string} message - Message to log
 */
function sendToAzure(level, message) {
  if (!instrumentationKey) return;
  
  try {
    const telemetry = {
      name: "Microsoft.ApplicationInsights.Message",
      time: new Date().toISOString(),
      iKey: instrumentationKey,
      tags: {
        "ai.operation.id": `op_${Date.now()}`,
        "ai.cloud.roleInstance": "server"
      },
      data: {
        baseType: "MessageData",
        baseData: {
          ver: 2,
          message,
          severityLevel: 
            level === 'error' ? 3 : 
            level === 'warn' ? 2 : 
            level === 'debug' ? 0 : 1,
          properties: { source: "server", logType: level }
        }
      }
    };

    const data = JSON.stringify(telemetry);
    
    const options = {
      host: 'dc.services.visualstudio.com',
      path: '/v2/track',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options);
    req.write(data);
    req.end();
  } catch (e) {
    // Silent fail for logging errors
  }
}

/**
 * Log a message to console, memory, and Azure
 * @param {string} level - Log level (info, error, warn, debug)
 * @param  {...any} args - Messages to log
 */
function log(level, ...args) {
  const timestamp = new Date().toISOString();
  const message = args.join(" ");
  const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  // Log to console
  console.log(formattedMessage);
  
  // Store in memory
  logs.push(formattedMessage);
  
  // Send to Azure
  sendToAzure(level.toLowerCase(), formattedMessage);
}

/**
 * Get all in-memory logs
 * @returns {Array} Array of log messages
 */
function getLogs() {
  return logs;
}

// Log startup message
console.log("Logger initialized with Azure integration");

module.exports = { log, getLogs };