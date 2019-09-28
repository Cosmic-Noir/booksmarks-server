const express = require("express");
const uuid = require("uuid/v4");
const logger = require("../logger");

// Data
const { bookmarks } = require("../bookmarks");

// Create router:
const bookmarkRouter = express.Router();
const bodyParser = express.json();

bookmarkRouter.route("/bookmark").get((req, res) => {
  res.json(bookmarks);
});

module.exports = bookmarkRouter;
