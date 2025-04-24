/**
 * Tests for SQL Shield middleware
 */
const express = require("express");
const request = require("supertest");
const sqlShield = require("../index");

describe("SQL Shield Middleware", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
  });

  describe("Blocking Mode", () => {
    beforeEach(() => {
      app.use(
        sqlShield({
          mode: "block",
          logToFile: false,
        })
      );

      app.get("/test", (req, res) => {
        res.status(200).json({ message: "Success" });
      });

      app.post("/test", (req, res) => {
        res.status(200).json({ message: "Success" });
      });
    });

    it("should allow normal requests", async () => {
      const response = await request(app).get("/test?id=1").expect(200);

      expect(response.body.message).toBe("Success");
    });

    it("should block SQL injection in query parameters", async () => {
      await request(app).get("/test?id=1%20OR%201=1").expect(403);
    });

    it("should block SQL injection in request body", async () => {
      await request(app)
        .post("/test")
        .send({ username: "admin' --" })
        .expect(403);
    });
  });

  describe("Warning Mode", () => {
    beforeEach(() => {
      app.use(
        sqlShield({
          mode: "warn",
          logToFile: false,
        })
      );

      app.get("/test", (req, res) => {
        res.status(200).json({ message: "Success" });
      });
    });

    it("should allow normal requests", async () => {
      const response = await request(app).get("/test?id=1").expect(200);

      expect(response.body.message).toBe("Success");
    });

    it("should allow but warn on SQL injection", async () => {
      const response = await request(app)
        .get("/test?id=1%20OR%201=1")
        .expect(200);

      expect(response.body.message).toBe("Success");
    });
  });

  describe("Silent Mode", () => {
    beforeEach(() => {
      app.use(
        sqlShield({
          mode: "silent",
          logToFile: false,
        })
      );

      app.get("/test", (req, res) => {
        res.status(200).json({ message: "Success" });
      });
    });

    it("should allow normal requests", async () => {
      const response = await request(app).get("/test?id=1").expect(200);

      expect(response.body.message).toBe("Success");
    });

    it("should allow SQL injection silently", async () => {
      const response = await request(app)
        .get("/test?id=1%20OR%201=1")
        .expect(200);

      expect(response.body.message).toBe("Success");
    });
  });
});
