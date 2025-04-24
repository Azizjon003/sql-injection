# @sqlshield/express-middleware

![npm version](https://img.shields.io/npm/v/@sqlshield/express-middleware)
![license](https://img.shields.io/npm/l/@sqlshield/express-middleware)

Express.js middleware for detecting and blocking SQL injection attacks in real-time.

## Features

- 🛡️ **Real-time Detection**: Identify SQL injection attempts as they happen
- 🔄 **Multiple Modes**: Choose between block, warn, or silent operation
- 📝 **Logging**: Log attempts to console or file
- 🔔 **Alerts**: Optional notification via Telegram or webhooks
- 🔧 **Configurable**: Extensive configuration options
- 🔍 **Non-intrusive**: Minimal performance impact
- 📊 **Comprehensive**: Checks query params, body, headers, and cookies

## Installation

```bash
npm install @sqlshield/express-middleware
```

## Quick Start

```javascript
const express = require("express");
const sqlShield = require("@sqlshield/express-middleware");

const app = express();
app.use(express.json());

// Add SQL Shield middleware
app.use(
  sqlShield({
    mode: "block", // 'block', 'warn', or 'silent'
    logToFile: true,
  })
);

app.get("/products", (req, res) => {
  res.send("Safe route");
});

app.listen(3000, () => {
  console.log("Server running with SQL Shield protection");
});
```

## Configuration Options

| Option             | Type    | Default             | Description                                         |
| ------------------ | ------- | ------------------- | --------------------------------------------------- |
| `mode`             | string  | `'warn'`            | Protection mode: `'block'`, `'warn'`, or `'silent'` |
| `logToFile`        | boolean | `false`             | Whether to log attacks to a file                    |
| `logFilePath`      | string  | `'logs/shield.log'` | Path to the log file                                |
| `alertWebhook`     | string  | `null`              | Webhook URL for sending alerts                      |
| `telegramBotToken` | string  | `null`              | Telegram Bot Token for alerts                       |
| `telegramChatId`   | string  | `null`              | Telegram Chat ID for alerts                         |
| `checkSources`     | object  | (see below)         | Sources to check for attacks                        |
| `ignoreHeaders`    | array   | (see below)         | Headers to ignore when checking                     |

### Default `checkSources`

```javascript
{
  query: true,    // Check URL query parameters
  body: true,     // Check request body
  params: true,   // Check route parameters
  headers: true,  // Check HTTP headers
  cookies: true   // Check cookies
}
```

## Protection Modes

- **Block Mode**: Rejects requests with SQL injection, returning a 403 Forbidden response
- **Warn Mode**: Allows requests but logs detected attacks
- **Silent Mode**: Only logs attacks, useful for monitoring without affecting users

## Logging

When `logToFile` is enabled, SQL Shield logs all detected attacks to the specified file with detailed information:

```json
{
  "message": "SQL Injection attempt detected",
  "timestamp": "2023-07-14T08:32:45.123Z",
  "url": "/users",
  "method": "GET",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "input": "{\"query\":{\"id\":\"1 OR 1=1\"}}"
}
```

## External Alerting

### Telegram Alerts

SQL Shield provides rich Telegram notifications with formatted messages and detailed attack information. To set up Telegram alerts:

1. Create a Telegram bot:

   - Open Telegram and search for [@BotFather](https://t.me/BotFather)
   - Send the command `/newbot` and follow instructions
   - After creating the bot, BotFather will give you a token (e.g., `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`)

2. Get your chat ID:

   - Start a chat with your new bot
   - Start a chat with [@userinfobot](https://t.me/userinfobot) to get your chat ID
   - The chat ID will be a number (e.g., `123456789`)

3. Configure SQL Shield with your bot token and chat ID:

```javascript
app.use(
  sqlShield({
    telegramBotToken: "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ", // Your bot token
    telegramChatId: "123456789", // Your chat ID
  })
);
```

The Telegram alerts include:

- Attack details (URL, IP address, method)
- Timestamp
- Formatted input data
- Recommendations for handling the attack

You can find a complete example in `examples/telegram-alert-example.js`.

### Custom Webhook

You can send alerts to any webhook:

```javascript
app.use(
  sqlShield({
    alertWebhook: "https://your-webhook-url.com/endpoint",
  })
);
```

## Advanced Usage

### Custom Configuration

```javascript
app.use(
  sqlShield({
    mode: "block",
    logToFile: true,
    logFilePath: "./logs/sql-attacks.log",
    checkSources: {
      query: true,
      body: true,
      params: true,
      headers: false, // Don't check headers
      cookies: false, // Don't check cookies
    },
    ignoreHeaders: ["x-custom-header"], // Additional headers to ignore
  })
);
```

### Apply to Specific Routes

```javascript
// Protect only specific routes
app.use("/api/admin/*", sqlShield({ mode: "block" }));
app.use("/api/public/*", sqlShield({ mode: "warn" }));
```

## TypeScript Support

This package includes TypeScript type definitions:

```typescript
import sqlShield from "@sqlshield/express-middleware";
import { SqlShieldOptions } from "@sqlshield/express-middleware";

const options: SqlShieldOptions = {
  mode: "block",
  logToFile: true,
};

app.use(sqlShield(options));
```

## License

MIT
