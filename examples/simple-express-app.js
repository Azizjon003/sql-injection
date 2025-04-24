/**
 * Simple Express application with SQL Shield middleware
 *
 * Run with:
 * node examples/simple-express-app.js
 */
const express = require("express");
const sqlShield = require("../index");

const app = express();

// Enable JSON and URL-encoded body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add SQL Shield middleware with block mode
app.use(
  sqlShield({
    mode: "block",
    logToFile: true,
    logFilePath: "./logs/shield.log",
  })
);

// Define a simple API
app.get("/", (req, res) => {
  res.send(`
    <h1>SQL Shield Demo</h1>
    <p>Try these examples:</p>
    <ul>
      <li><a href="/api/users?id=1">Safe: /api/users?id=1</a></li>
      <li><a href="/api/users?id=1 OR 1=1">SQL Injection: /api/users?id=1 OR 1=1</a></li>
    </ul>
    <h2>Test POST Request</h2>
    <form method="POST" action="/api/login">
      <input type="text" name="username" placeholder="Username" value="admin"><br>
      <input type="password" name="password" placeholder="Password" value="password"><br>
      <button type="submit">Login (Safe)</button>
    </form>
    <hr>
    <form method="POST" action="/api/login">
      <input type="text" name="username" placeholder="Username" value="admin' --"><br>
      <input type="password" name="password" placeholder="Password" value="anything"><br>
      <button type="submit">Login (SQL Injection)</button>
    </form>
  `);
});

// GET endpoint that could be vulnerable to SQL injection
app.get("/api/users", (req, res) => {
  // This route is protected by SQL Shield
  // If SQL injection is detected, the request won't reach here in block mode

  const id = req.query.id || "";
  res.json({
    success: true,
    message: `Retrieved user data for ID: ${id}`,
    // In a real app, this would be a database query
    data: {
      id: id,
      name: "John Doe",
      email: "john@example.com",
    },
  });
});

// POST endpoint that could be vulnerable to SQL injection
app.post("/api/login", (req, res) => {
  // This route is protected by SQL Shield
  const { username, password } = req.body;

  res.json({
    success: true,
    message: "Login successful",
    data: {
      username,
      // Don't include password in response
      token: "dummy-jwt-token",
    },
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SQL Shield demo server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
