const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Ensure logs directory exists
const logsDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: { service: "sql-injection-detector" },
  transports: [
    // Console logger
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // File logger for all logs
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
    }),
    // Separate file for SQL injection detections
    new winston.transports.File({
      filename: path.join(logsDir, "injections.log"),
      level: "warn",
    }),
  ],
});

/**
 * Enhanced logger with additional methods for SQL injection events
 */
module.exports = {
  /**
   * Log info message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  info: (message, meta = {}) => {
    logger.info(message, meta);
  },

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  warn: (message, meta = {}) => {
    logger.warn(message, meta);
  },

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  error: (message, meta = {}) => {
    logger.error(message, meta);
  },

  /**
   * Log detected SQL injection with details
   * @param {Object} detection - SQL injection detection details
   * @param {Object} request - HTTP request information
   */
  logInjection: (detection, request) => {
    const logData = {
      timestamp: new Date().toISOString(),
      ip: request.ip || "unknown",
      method: request.method,
      url: request.originalUrl,
      query: request.query,
      body: request.body,
      headers: request.headers,
      detection,
    };

    logger.warn(`SQL Injection detected from ${logData.ip}`, logData);

    // Here you can add additional notification logic:
    // - Send email alerts
    // - Push notifications
    // - Integrate with security monitoring systems
  },

  /**
   * Get the underlying Winston logger instance
   * @returns {Object} - Winston logger instance
   */
  getLogger: () => logger,
};
