/**
 * Logger module for SQL Shield
 * Logs SQL injection attempts to console and/or file
 */
const fs = require("fs");
const path = require("path");
const winston = require("winston");

let logger = null;

/**
 * Initialize the logger
 *
 * @param {object} options - Logger options
 * @param {boolean} options.logToFile - Whether to log to a file
 * @param {string} options.logFilePath - Path to the log file
 * @returns {object} The winston logger instance
 */
function initLogger(options = {}) {
  const logToFile = options.logToFile || false;
  const logFilePath =
    options.logFilePath || path.join(process.cwd(), "logs", "shield.log");

  // Create logs directory if it doesn't exist
  if (logToFile) {
    const logDir = path.dirname(logFilePath);
    if (!fs.existsSync(logDir)) {
      try {
        fs.mkdirSync(logDir, { recursive: true });
      } catch (err) {
        console.error(`Failed to create log directory: ${logDir}`, err);
      }
    }
  }

  const transports = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ];

  if (logToFile) {
    transports.push(
      new winston.transports.File({
        filename: logFilePath,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      })
    );
  }

  logger = winston.createLogger({
    level: "info",
    transports,
  });

  return logger;
}

/**
 * Log an SQL injection attempt
 *
 * @param {string} url - The URL of the request
 * @param {string} input - The input that triggered the detection
 * @param {object} req - The request object
 * @param {object} options - Additional options
 */
function logAttempt(url, input, req = {}, options = {}) {
  if (!logger) {
    logger = initLogger(options);
  }

  const ip = req.ip || req.headers?.["x-forwarded-for"] || "unknown";
  const method = req.method || "unknown";
  const userAgent = req.headers?.["user-agent"] || "unknown";

  logger.warn({
    message: "SQL Injection attempt detected",
    timestamp: new Date().toISOString(),
    url,
    method,
    ip,
    userAgent,
    input: typeof input === "string" ? input : JSON.stringify(input),
  });
}

module.exports = {
  initLogger,
  logAttempt,
};
