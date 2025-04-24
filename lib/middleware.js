/**
 * SQL Shield Express Middleware
 * Detects SQL injection attempts in Express.js requests
 */
const { checkObject } = require("./detector");
const { logAttempt } = require("./logger");
const { handleAlerts } = require("./alert");
const { buildConfig } = require("./config");

/**
 * SQL Shield middleware factory
 *
 * @param {object} userOptions - Middleware configuration options
 * @returns {function} Express middleware function
 */
function sqlShield(userOptions = {}) {
  const config = buildConfig(userOptions);

  /**
   * Express middleware function
   *
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Express next function
   */
  return (req, res, next) => {
    // Skip detection if in silent mode with no logging
    if (config.mode === "silent" && !config.logToFile && !config.alertWebhook) {
      return next();
    }

    // Extract data from request based on configuration
    const dataToCheck = {};

    if (config.checkSources.query && req.query) {
      dataToCheck.query = req.query;
    }

    if (config.checkSources.body && req.body) {
      dataToCheck.body = req.body;
    }

    if (config.checkSources.params && req.params) {
      dataToCheck.params = req.params;
    }

    if (config.checkSources.cookies && req.cookies) {
      dataToCheck.cookies = req.cookies;
    }

    if (config.checkSources.headers && req.headers) {
      // Filter out ignored headers
      const headers = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (!config.ignoreHeaders.includes(key.toLowerCase())) {
          headers[key] = value;
        }
      }
      dataToCheck.headers = headers;
    }

    // Check for SQL injection
    const injectionDetected = checkObject(dataToCheck);

    if (injectionDetected) {
      // Prepare data for logging/alerting
      const data = {
        url: req.originalUrl || req.url,
        ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
        method: req.method,
        timestamp: new Date().toISOString(),
        input: JSON.stringify(dataToCheck),
      };

      // Log the attempt
      if (config.mode !== "silent" || config.logToFile) {
        logAttempt(data.url, dataToCheck, req, config);
      }

      // Send alerts if configured
      if (
        config.alertWebhook ||
        (config.telegramBotToken && config.telegramChatId)
      ) {
        handleAlerts(data, config).catch((err) => {
          console.error("Failed to send alert:", err);
        });
      }

      // Block the request if in 'block' mode
      if (config.mode === "block") {
        return res.status(403).json({
          error: "Forbidden",
          message: "SQL injection attempt detected",
        });
      }
    }

    // Continue with the request
    next();
  };
}

module.exports = sqlShield;
