/**
 * Alert module for SQL Shield
 * Sends alerts to external services (Telegram, Email, etc.)
 */
const https = require("https");
const url = require("url");

/**
 * Send an alert to a webhook (Telegram, Slack, etc.)
 *
 * @param {string} webhookUrl - The webhook URL to send the alert to
 * @param {object} data - The data to send in the alert
 * @returns {Promise} A promise that resolves when the alert is sent
 */
function sendWebhookAlert(webhookUrl, data) {
  if (!webhookUrl) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = url.parse(webhookUrl);
      const payload = JSON.stringify({
        text: `⚠️ SQL Injection Attempt Detected!\n\n${JSON.stringify(
          data,
          null,
          2
        )}`,
      });

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      };

      const req = https.request(options, (res) => {
        let responseData = "";

        res.on("data", (chunk) => {
          responseData += chunk;
        });

        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(new Error(`HTTP error ${res.statusCode}: ${responseData}`));
          }
        });
      });

      req.on("error", (err) => {
        reject(err);
      });

      req.write(payload);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Send a Telegram alert
 *
 * @param {string} botToken - The Telegram bot token
 * @param {string} chatId - The Telegram chat ID
 * @param {object} data - The data to send in the alert
 * @returns {Promise} A promise that resolves when the alert is sent
 */
function sendTelegramAlert(botToken, chatId, data) {
  if (!botToken || !chatId) {
    return Promise.resolve();
  }

  const webhookUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const message =
    `⚠️ *SQL Injection Attempt Detected!*\n\n` +
    `*URL:* ${data.url}\n` +
    `*IP:* ${data.ip}\n` +
    `*Method:* ${data.method}\n` +
    `*Timestamp:* ${data.timestamp}\n` +
    `*Input:* \`${data.input}\``;

  return sendWebhookAlert(webhookUrl, {
    chat_id: chatId,
    text: message,
    parse_mode: "Markdown",
  });
}

/**
 * Handle alerts based on configuration
 *
 * @param {object} data - The data to send in the alert
 * @param {object} options - Alert options from configuration
 * @returns {Promise} A promise that resolves when all alerts are sent
 */
function handleAlerts(data, options = {}) {
  const promises = [];

  if (options.alertWebhook) {
    promises.push(sendWebhookAlert(options.alertWebhook, data));
  }

  if (options.telegramBotToken && options.telegramChatId) {
    promises.push(
      sendTelegramAlert(options.telegramBotToken, options.telegramChatId, data)
    );
  }

  return Promise.all(promises);
}

module.exports = {
  sendWebhookAlert,
  sendTelegramAlert,
  handleAlerts,
};
