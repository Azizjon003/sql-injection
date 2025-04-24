const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

class RulesEngine {
  constructor() {
    this.rules = [];
    this.initialized = false;
  }

  /**
   * Load SQL injection detection rules from config file
   */
  initialize() {
    try {
      const configPath = path.join(__dirname, "../config/rules.json");

      // Check if rules file exists, create default rules if not
      if (!fs.existsSync(configPath)) {
        this.createDefaultRules(configPath);
      }

      // Load rules from config file
      const rulesData = JSON.parse(fs.readFileSync(configPath, "utf8"));
      this.rules = rulesData.rules.map((rule) => ({
        ...rule,
        pattern: new RegExp(rule.pattern, rule.flags || "i"),
      }));

      this.initialized = true;
      logger.info(`Loaded ${this.rules.length} SQL injection detection rules`);
    } catch (error) {
      logger.error(`Failed to load rules: ${error.message}`);
      // Create default rules if loading fails
      this.createDefaultRulesInMemory();
    }
  }

  /**
   * Create default rules file if doesn't exist
   * @param {string} configPath - Path to save the rules
   */
  createDefaultRules(configPath) {
    try {
      const defaultRules = this.getDefaultRules();

      // Ensure directory exists
      const dir = path.dirname(configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write default rules to file
      fs.writeFileSync(configPath, JSON.stringify(defaultRules, null, 2));
      logger.info("Created default SQL injection rules configuration");
    } catch (error) {
      logger.error(`Failed to create default rules file: ${error.message}`);
    }
  }

  /**
   * Create default rules in memory when file operations fail
   */
  createDefaultRulesInMemory() {
    const defaultRules = this.getDefaultRules();

    this.rules = defaultRules.rules.map((rule) => ({
      ...rule,
      pattern: new RegExp(rule.pattern, rule.flags || "i"),
    }));

    this.initialized = true;
    logger.info(
      `Created ${this.rules.length} in-memory SQL injection detection rules`
    );
  }

  /**
   * Get default SQL injection detection rules
   * @returns {Object} - Default rules object
   */
  getDefaultRules() {
    return {
      rules: [
        {
          id: "SQLI-001",
          name: "SQL Comment Detection",
          description:
            "Detects SQL comments that might be used to bypass filters",
          pattern: "--.*|#.*|/\\*.*\\*/",
          flags: "i",
          severity: "medium",
        },
        {
          id: "SQLI-002",
          name: "UNION-based SQL Injection",
          description: "Detects UNION-based SQL injection attempts",
          pattern: "\\bunion\\s+(?:all\\s+)?select\\b",
          flags: "i",
          severity: "high",
        },
        {
          id: "SQLI-003",
          name: "Boolean-based SQL Injection",
          description: "Detects boolean-based SQL injection attempts",
          pattern: "\\b(and|or)\\s+\\d+=\\d+",
          flags: "i",
          severity: "high",
        },
        {
          id: "SQLI-004",
          name: "Error-based SQL Injection",
          description: "Detects error-based SQL injection attempts",
          pattern: "\\b(convert|cast)\\b|\\bwaitfor\\s+delay\\b",
          flags: "i",
          severity: "high",
        },
        {
          id: "SQLI-005",
          name: "Time-based SQL Injection",
          description: "Detects time-based SQL injection attempts",
          pattern:
            "\\bwaitfor\\s+delay\\b|\\bsleep\\(\\s*\\d+\\s*\\)|\\bbenchmark\\(",
          flags: "i",
          severity: "high",
        },
        {
          id: "SQLI-006",
          name: "SQL Authentication Bypass",
          description: "Detects SQL authentication bypass attempts",
          pattern:
            "\\bor\\s+['\"\\d]\\s*=\\s*['\"\\d]|\\bor\\s+1\\s*=\\s*1|\\bor\\s+'[^']*'\\s*=\\s*'[^']*'|\\bor\\s+\"[^\"]*\"\\s*=\\s*\"[^\"]*\"",
          flags: "i",
          severity: "critical",
        },
        {
          id: "SQLI-007",
          name: "SQL Batch Execution",
          description: "Detects SQL batch execution attempts",
          pattern:
            ";\\s*\\b(select|insert|update|delete|drop|alter|create|exec|execute)\\b",
          flags: "i",
          severity: "critical",
        },
        {
          id: "SQLI-008",
          name: "Database Schema Discovery",
          description: "Detects attempts to discover database schema",
          pattern:
            "\\binformation_schema\\b|\\bsys\\.\\w+\\b|\\bsyscolumns\\b|\\bsysobjects\\b",
          flags: "i",
          severity: "medium",
        },
        {
          id: "SQLI-009",
          name: "Stored Procedure Execution",
          description: "Detects attempts to execute stored procedures",
          pattern: "\\bexec\\s+\\w+|\\bexecute\\s+\\w+|\\bsp_\\w+|\\bxp_\\w+",
          flags: "i",
          severity: "high",
        },
        {
          id: "SQLI-010",
          name: "SQL Function Calls",
          description: "Detects suspicious SQL function calls",
          pattern:
            "\\b(char|nchar|varchar|nvarchar)\\b.*\\b(SELECT|;)\\b|\\b(concat|group_concat|concat_ws)\\s*\\(",
          flags: "i",
          severity: "medium",
        },
      ],
    };
  }

  /**
   * Detect SQL injection using rule-based patterns
   * @param {string} input - Input string to check
   * @returns {Object} - Detection result
   */
  detect(input) {
    // Initialize rules if not already done
    if (!this.initialized) {
      this.initialize();
    }

    // Default result
    const result = {
      isInjection: false,
      rule: null,
      severity: null,
    };

    // Check each rule against input
    for (const rule of this.rules) {
      if (rule.pattern.test(input)) {
        return {
          isInjection: true,
          rule: rule.id,
          severity: rule.severity,
          description: rule.description,
        };
      }
    }

    return result;
  }
}

module.exports = new RulesEngine();
