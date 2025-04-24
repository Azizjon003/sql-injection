/**
 * Example of using SQL Shield with Telegram alerts
 *
 * Run with:
 * node examples/telegram-alert-example.js
 *
 * First, you need to:
 * 1. Create a Telegram bot using BotFather (@BotFather on Telegram)
 * 2. Get your bot token
 * 3. Start a chat with your bot and get your chat ID
 *    (You can use @userinfobot on Telegram to get your chat ID)
 */
const express = require("express");
const sqlShield = require("../index");

const app = express();

// Enable JSON and URL-encoded body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add SQL Shield middleware with Telegram alerts
app.use(
  sqlShield({
    mode: "block", // Block SQL injection attempts
    logToFile: true, // Log to file
    logFilePath: "./logs/sql-attacks.log", // Log file path

    // Telegram configuration - REPLACE WITH YOUR ACTUAL VALUES
    telegramBotToken: "YOUR_BOT_TOKEN_HERE", // Get from BotFather
    telegramChatId: "YOUR_CHAT_ID_HERE", // Your Telegram chat ID
  })
);

// Define a vulnerable API endpoint
app.get("/api/users", (req, res) => {
  const id = req.query.id || "";

  res.json({
    success: true,
    message: `Retrieved user data for ID: ${id}`,
    data: { id, name: "Test User" },
  });
});

// Define a test route to demonstrate SQL injection
app.get("/test-telegram-alert", (req, res) => {
  res.send(`
    <h1>SQL Shield Telegram Alert Test</h1>
    <p>Try these SQL injection examples to test Telegram alerts:</p>
    <ul>
      <li><a href="/api/users?id=1%20OR%201=1">URL injection: 1 OR 1=1</a></li>
      <li><a href="/api/users?id=1%3B%20DROP%20TABLE%20users">URL injection: 1; DROP TABLE users</a></li>
      <li><a href="/api/users?id=1%20UNION%20SELECT%20*%20FROM%20users">URL injection: 1 UNION SELECT * FROM users</a></li>
    </ul>
    
    <p>When you click these links, SQL Shield will detect the SQL injection attempt, block it, and send an alert to your Telegram.</p>
    
    <h2>Telegram Setup Instructions:</h2>
    <ol>
      <li>Create a Telegram bot using <a href="https://t.me/BotFather" target="_blank">@BotFather</a></li>
      <li>Get your bot token from BotFather</li>
      <li>Start a chat with your bot</li>
      <li>Get your chat ID from <a href="https://t.me/userinfobot" target="_blank">@userinfobot</a></li>
      <li>Update this example with your bot token and chat ID</li>
      <li>Restart the server and try again</li>
    </ol>
  `);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SQL Shield Telegram example running on port ${PORT}`);
  console.log(
    `Open http://localhost:${PORT}/test-telegram-alert in your browser`
  );

  // Show a warning if using placeholder values
  const configWarning =
    app.mountpath.telegramBotToken === "YOUR_BOT_TOKEN_HERE" ||
    app.mountpath.telegramChatId === "YOUR_CHAT_ID_HERE";

  if (configWarning) {
    console.log(
      "\n⚠️  WARNING: You need to replace the placeholder Telegram values with your actual bot token and chat ID"
    );
    console.log(
      "   Edit the file examples/telegram-alert-example.js to update these values\n"
    );
  }
});
