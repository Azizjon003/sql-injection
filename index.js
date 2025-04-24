/**
 * @sqlshield/express-middleware
 * Express.js middleware for detecting SQL injection attacks
 *
 * @module @sqlshield/express-middleware
 * @author
 * @license MIT
 */

const sqlShield = require("./lib/middleware");
const { defaultConfig } = require("./lib/config");

// Export the middleware as the main module export
module.exports = sqlShield;

// Also export other utilities as properties
module.exports.defaultConfig = defaultConfig;
