/**
 * SQL injection detector module
 * Checks input strings against a list of SQL injection patterns
 */
const fs = require("fs");
const path = require("path");

let rules = [];
try {
  // Load rules from the rules.json file
  const rulesPath = path.join(__dirname, "..", "rules", "rules.json");
  rules = JSON.parse(fs.readFileSync(rulesPath, "utf8"));
} catch (err) {
  console.error("Failed to load SQL injection rules:", err.message);
  rules = []; // Fallback to empty rules array if file not found
}

/**
 * Check if a string contains SQL injection patterns
 *
 * @param {string} input - The string to check
 * @returns {boolean} True if SQL injection is detected, false otherwise
 */
function hasSQLInjection(input) {
  if (!input || typeof input !== "string") {
    return false;
  }

  return rules.some((rule) => {
    try {
      const regex = new RegExp(rule, "i");
      return regex.test(input);
    } catch (err) {
      console.error(`Invalid regex pattern: ${rule}`, err);
      return false;
    }
  });
}

/**
 * Check if an object (recursively) contains SQL injection patterns
 *
 * @param {object|string|array} obj - The object to check
 * @returns {boolean} True if SQL injection is detected, false otherwise
 */
function checkObject(obj) {
  if (!obj) return false;

  if (typeof obj === "string") {
    return hasSQLInjection(obj);
  }

  if (Array.isArray(obj)) {
    return obj.some((item) => checkObject(item));
  }

  if (typeof obj === "object") {
    return Object.values(obj).some((value) => checkObject(value));
  }

  return false;
}

module.exports = {
  hasSQLInjection,
  checkObject,
};
