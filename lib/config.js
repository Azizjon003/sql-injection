/**
 * Configuration module for SQL Shield
 * Provides default configuration and validation
 */

/**
 * Default configuration options
 */
const defaultConfig = {
  // Detection mode: 'block', 'warn', or 'silent'
  mode: "warn",

  // Logging options
  logToFile: false,
  logFilePath: "logs/shield.log",

  // Alert options
  alertWebhook: null,
  telegramBotToken: null,
  telegramChatId: null,

  // Detection sources to check
  checkSources: {
    query: true,
    body: true,
    params: true,
    headers: true,
    cookies: true,
  },

  // Headers to ignore when checking
  ignoreHeaders: [
    "user-agent",
    "accept",
    "accept-encoding",
    "accept-language",
    "connection",
    "content-length",
    "content-type",
    "host",
    "referer",
  ],
};

/**
 * Validate and merge user configuration with defaults
 *
 * @param {object} userConfig - User provided configuration
 * @returns {object} The merged configuration
 */
function buildConfig(userConfig = {}) {
  const config = { ...defaultConfig };

  // Handle mode setting
  if (userConfig.mode) {
    if (["block", "warn", "silent"].includes(userConfig.mode)) {
      config.mode = userConfig.mode;
    } else {
      console.warn(
        `Invalid mode: ${userConfig.mode}, using default: ${config.mode}`
      );
    }
  }

  // Handle logging options
  if (typeof userConfig.logToFile === "boolean") {
    config.logToFile = userConfig.logToFile;
  }

  if (userConfig.logFilePath) {
    config.logFilePath = userConfig.logFilePath;
  }

  // Handle alert options
  if (userConfig.alertWebhook) {
    config.alertWebhook = userConfig.alertWebhook;
  }

  if (userConfig.telegramBotToken) {
    config.telegramBotToken = userConfig.telegramBotToken;
  }

  if (userConfig.telegramChatId) {
    config.telegramChatId = userConfig.telegramChatId;
  }

  // Handle detection sources
  if (userConfig.checkSources) {
    config.checkSources = {
      ...config.checkSources,
      ...userConfig.checkSources,
    };
  }

  // Handle ignore headers
  if (userConfig.ignoreHeaders) {
    if (Array.isArray(userConfig.ignoreHeaders)) {
      config.ignoreHeaders = userConfig.ignoreHeaders;
    } else {
      console.warn("ignoreHeaders must be an array, using defaults");
    }
  }

  return config;
}

module.exports = {
  defaultConfig,
  buildConfig,
};
