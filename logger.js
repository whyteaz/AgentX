// logger.js
const logs = [];

function log(level, ...args) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] [${level.toUpperCase()}] ${args.join(" ")}`;
  console.log(message);
  logs.push(message);
}

function getLogs() {
  return logs;
}

module.exports = { log, getLogs };
