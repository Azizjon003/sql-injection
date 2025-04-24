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
      const payload = JSON.stringify(data);

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
            resolve(responseData);
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
 * Send a Telegram alert with advanced formatting
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

  // Format the message with more detailed information
  const timestamp = new Date(data.timestamp).toLocaleString();

  const messageHeader = `🛡️ *SQL SHIELD XAVFSIZLIK OGOHLANTIRISHLARI*`;

  const messageBody = [
    `\n⚠️ *SQL in'yeksiya hujumi aniqlandi!*`,
    ``,
    `📌 *URL:* \`${data.url}\``,
    `🌐 *IP manzil:* \`${data.ip}\``,
    `🔄 *So'rov turi:* \`${data.method}\``,
    `🕒 *Vaqt:* \`${timestamp}\``,
    ``,
    `⚡ *Aniqlangan shubhali so'rov:*`,
    `\`\`\``,
    `${formatInputForTelegram(data.input)}`,
    `\`\`\``,
  ].join("\n");

  const messageFooter = [
    ``,
    `📊 *Tavsiyalar:*`,
    `- Bu so'rovni tekshiring va bloklang`,
    `- Firewall qoidalarini yangilang`,
    `- Xavfsizlik jurnaliga qayd qiling`,
  ].join("\n");

  const fullMessage = `${messageHeader}\n${messageBody}\n${messageFooter}`;

  return sendWebhookAlert(webhookUrl, {
    chat_id: chatId,
    text: fullMessage,
    parse_mode: "Markdown",
    disable_web_page_preview: true,
  });
}

/**
 * Format input data for better display in Telegram
 *
 * @param {string} input - The raw input data
 * @returns {string} Formatted input data
 */
function formatInputForTelegram(input) {
  try {
    if (typeof input === "string") {
      try {
        // Try to parse it as JSON for better formatting
        const parsed = JSON.parse(input);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        // Just return the original string if not valid JSON
        return input;
      }
    }

    // Format objects nicely
    return JSON.stringify(input, null, 2);
  } catch (e) {
    return String(input);
  }
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
    // Format generic webhook data
    const webhookData = {
      text: `⚠️ SQL Injection Attempt Detected!\n\n${JSON.stringify(
        data,
        null,
        2
      )}`,
      timestamp: new Date().toISOString(),
      level: "warning",
      source: "sql-shield",
      data,
    };

    promises.push(sendWebhookAlert(options.alertWebhook, webhookData));
  }

  if (options.telegramBotToken && options.telegramChatId) {
    promises.push(
      sendTelegramAlert(options.telegramBotToken, options.telegramChatId, data)
    );
  }

  return Promise.all(promises).catch((error) => {
    console.error("Error sending alerts:", error.message);
    // Don't re-throw, as we don't want alert failures to break the app
    return [];
  });
}

module.exports = {
  sendWebhookAlert,
  sendTelegramAlert,
  handleAlerts,
};
