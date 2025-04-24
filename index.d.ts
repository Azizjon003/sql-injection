import { RequestHandler } from "express";

/**
 * Sources to check for SQL injection
 */
export interface SqlShieldSources {
  /** Check query parameters */
  query?: boolean;
  /** Check request body */
  body?: boolean;
  /** Check URL parameters */
  params?: boolean;
  /** Check HTTP headers */
  headers?: boolean;
  /** Check cookies */
  cookies?: boolean;
}

/**
 * SQL Shield configuration options
 */
export interface SqlShieldOptions {
  /**
   * Detection mode:
   * - 'block': Block requests with SQL injection (403 response)
   * - 'warn': Allow but log detected attacks
   * - 'silent': Log only, without intervention
   * @default 'warn'
   */
  mode?: "block" | "warn" | "silent";

  /**
   * Whether to log attacks to a file
   * @default false
   */
  logToFile?: boolean;

  /**
   * Path to the log file
   * @default 'logs/shield.log'
   */
  logFilePath?: string;

  /**
   * Webhook URL for sending alerts
   * @default null
   */
  alertWebhook?: string | null;

  /**
   * Telegram Bot Token for alerts
   * @default null
   */
  telegramBotToken?: string | null;

  /**
   * Telegram Chat ID for alerts
   * @default null
   */
  telegramChatId?: string | null;

  /**
   * Sources to check for SQL injection
   */
  checkSources?: SqlShieldSources;

  /**
   * Headers to ignore when checking
   */
  ignoreHeaders?: string[];
}

/**
 * SQL Shield middleware
 *
 * Express.js middleware for detecting SQL injection attacks
 *
 * @param options - Configuration options
 * @returns Express middleware function
 */
declare function sqlShield(options?: SqlShieldOptions): RequestHandler;

export default sqlShield;

/**
 * Default configuration
 */
export const defaultConfig: SqlShieldOptions;
