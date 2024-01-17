const fs = require('fs');
const axios = require('axios');
const chalk = require('chalk');

const { name, version, icon } = require('../package.json');

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

  logQueue.push({ level, data });

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
  const { level, data } = logQueue.shift();

  try {
    await sendToWebhook(level, data);
  } catch (error) {
    console.error(`⚠️Failed to log to webhook: ${error.message}`);
  }

  processQueue();
};

const sendToWebhook = async (level, data) => {
  try {
    const color = getColorCode(level);

    const payload = {
      username: name,
      avatar_url: icon,
      embeds: [{
        title: `[${level}]`,
        description: data,
        color,
        footer: {
          text: `Version: ${version}`,
        },
      }],
    };

    const response = await axios.post(process.env.WEBHOOK_URL, payload);
  } catch (error) {
    console.error(`⚠️Failed to log to webhook: ${error.message}`);
    throw new Error('Failed to send log to webhook');
  }
};

const getColorCode = (level) => {
  switch (level) {
    case 'INFO':
      return 0x3498db; // Blue color for INFO
    case 'WARNING':
      return 0xf39c12; // Orange color for WARNING
    case 'ERROR':
      return 0xe74c3c; // Red color for ERROR
    default:
      return 0x2ecc71; // Green color for other levels
  }
};

module.exports = { log };
