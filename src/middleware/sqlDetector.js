const tokenizer = require("../core/tokenizer");
const mlModel = require("../core/mlModel");
const rulesEngine = require("../core/rulesEngine");
const logger = require("../utils/logger");

/**
 * SQL Injection Detection Middleware
 * - Extracts query parameters and body data
 * - Checks for SQL injection patterns using rules and ML model
 * - Logs potential attacks and allows/blocks requests
 */
const sqlDetector = async (req, res, next) => {
  try {
    // Extract data to check from request
    const dataToCheck = {
      // Get query parameters
      ...req.query,
      // Get body parameters if available
      ...(req.body || {}),
      // Get URL parameters
      url: req.originalUrl,
    };

    // Convert the data object to array of strings to check
    const stringsToCheck = Object.entries(dataToCheck).map(
      ([key, value]) => `${key}=${value}`
    );

    // Check each string for potential SQL injection
    for (const str of stringsToCheck) {
      // Skip empty strings
      if (!str || str.trim() === "") continue;

      // 1. Check using rule-based engine first (faster)
      const ruleDetection = rulesEngine.detect(str);

      if (ruleDetection.isInjection) {
        const logMessage = `[RULE DETECTION] Potential SQL injection detected: ${str} | Rule: ${ruleDetection.rule}`;
        logger.warn(logMessage, {
          ip: req.ip,
          method: req.method,
          path: req.path,
        });

        // Block or allow the request based on policy
        // For strict policy, return 403 and block the request
        // return res.status(403).json({ error: 'Potential security threat detected' });

        // For monitoring only, log but allow the request to proceed
        break;
      }

      // 2. Tokenize the input for ML model
      const tokens = tokenizer.tokenize(str);

      // 3. Check using ML model (more accurate but slower)
      const mlDetection = await mlModel.predict(tokens);

      if (mlDetection.isInjection) {
        const logMessage = `[ML DETECTION] Potential SQL injection detected: ${str} | Confidence: ${mlDetection.confidence.toFixed(
          2
        )}`;
        logger.warn(logMessage, {
          ip: req.ip,
          method: req.method,
          path: req.path,
          confidence: mlDetection.confidence,
        });

        // Block or allow the request based on confidence and policy
        if (mlDetection.confidence > 0.85) {
          return res
            .status(403)
            .json({ error: "Potential security threat detected" });
        }

        break;
      }
    }

    // If no injection detected, proceed to the next middleware
    next();
  } catch (error) {
    logger.error(`Error in SQL injection detection: ${error.message}`);
    next(error);
  }
};

module.exports = sqlDetector;
