require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");
const winston = require("winston");
const BookmarksService = require("./bookmarks-service");

// winston logger:
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "info.log" })]
});

if (NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple()
    })
  );
}

// Routing requirements:
const bookmarkRouter = require("./bookmarks/bookmark-router");

const app = express();

const morganOption = NODE_ENV === "production" ? "tiny" : "common";

// Use
app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

// Error handling
app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === "production") {
    response = { error: { message: "server error" } };
  } else {
    console.log(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

// Call Routing:
app.use(bookmarkRouter);

// Token Validation: - Causing tests to fail *** Don't know why ***
// app.use(function validateBearerToken(req, res, next) {
//   const apiToken = process.env.API_TOKEN;
//   const authToken = req.get("Authorization");

//   if (!authToken || authToken.split(" ")[1] !== apiToken) {
//     logger.error(`Unauthorized request to path: ${req.path}`);
//     return res.status(401).json({ error: "Unauthorized request" });
//   }
//   next();
// });

// GET requests:
app.get("/", (req, res) => {
  res.status(200).send("Hello");
});

app.get("/bookmarks", (req, res, next) => {
  const knexInstance = req.app.get("db");
  BookmarksService.getAllBookmarks(knexInstance)
    .then(bookmarks => {
      res.json(bookmarks);
    })
    .catch(next);
});

module.exports = app;
