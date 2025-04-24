const natural = require("natural");
const tokenizer = new natural.WordTokenizer();

/**
 * SQL query tokenizer module
 * Breaks down input strings into tokens for analysis
 */
module.exports = {
  /**
   * Tokenizes an input string into words
   * @param {string} input - The input string to tokenize
   * @returns {string[]} Array of tokens
   */
  tokenize(input) {
    if (!input || typeof input !== "string") {
      return [];
    }

    // Basic tokenization
    let tokens = tokenizer.tokenize(input.toLowerCase());

    // Add SQL operator splitting
    const sqlTokens = this.extractSqlTokens(input.toLowerCase());
    tokens = [...new Set([...tokens, ...sqlTokens])];

    return tokens;
  },

  /**
   * Extracts SQL specific tokens from an input string
   * @param {string} input - The input string
   * @returns {string[]} Array of SQL specific tokens
   */
  extractSqlTokens(input) {
    const result = [];

    // SQL keywords to identify
    const sqlKeywords = [
      "select",
      "insert",
      "update",
      "delete",
      "drop",
      "create",
      "alter",
      "union",
      "where",
      "from",
      "join",
      "having",
      "group",
      "order",
      "by",
      "exec",
      "execute",
      "sp_",
      "xp_",
      "sysobjects",
      "syscolumns",
      "table",
      "or",
      "and",
      "not",
      "null",
      "char",
      "nchar",
      "varchar",
      "nvarchar",
    ];

    // Extract SQL keywords
    for (const keyword of sqlKeywords) {
      // Word boundary check to match complete words
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      if (regex.test(input)) {
        result.push(keyword);
      }
    }

    // Extract special SQL operators
    const operators = [
      "--",
      ";",
      "/*",
      "*/",
      "=",
      "'",
      '"',
      ",",
      "(",
      ")",
      "@",
      "#",
    ];
    for (const op of operators) {
      if (input.includes(op)) {
        result.push(op);
      }
    }

    // Look for SQL injection specific patterns
    const patterns = ["1=1", "1 = 1", "true=true", "or 1", "1 or", "or true"];

    for (const pattern of patterns) {
      if (input.includes(pattern)) {
        result.push(pattern);
      }
    }

    return result;
  },
};
