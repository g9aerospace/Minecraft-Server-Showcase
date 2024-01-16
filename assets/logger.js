const fs = require('fs');
const axios = require('axios');
const chalk = require('chalk');

const logQueue = [];
let isLogging = false;

const log = async (level, data) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} [${level}] - ${data}\n`;

  console.log(
    `${timestamp} [${chalk.green(level)}] - ${chalk.white(data)}`
  );

  const logFilePath = `logs/log_${timestamp.slice(0, 10)}.txt`;
  fs.appendFileSync(logFilePath, logMessage);

  logQueue.push(logMessage);

  if (!isLogging) {
    processQueue();
  }
};

const processQueue = async () => {
  if (logQueue.length === 0) {
    isLogging = false;
    return;
  }

  isLogging = true;
  const logMessage = logQueue.shift();

  try {
    await sendToWebhook(logMessage);
  } catch (error) {
    console.error(`⚠️Failed to log to webhook: ${error.message}`);
  }

  processQueue();
};

const sendToWebhook = async (message) => {
  try {
    const response = await axios.post(process.env.WEBHOOK_URL, {
      content: message,
    });

  } catch (error) {
    console.error(`⚠️Failed to log to webhook: ${error.message}`);
    throw new Error('Failed to send log to webhook');
  }
};

module.exports = { log };
