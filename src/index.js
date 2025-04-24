const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const sqlDetector = require("./middleware/sqlDetector");
const logger = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Apply SQL injection detection middleware to all routes
app.use(sqlDetector);

// Demo routes
app.get("/", (req, res) => {
  res.send("SQL Injection Detection System is running");
});

// Example API endpoint
app.get("/api/users", (req, res) => {
  const userId = req.query.id;
  // Just for demo purposes
  res.json({ message: `Fetched user with ID: ${userId}` });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  // Just for demo purposes
  res.json({ message: `Login attempt for user: ${username}` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Server error: ${err.message}`);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;
