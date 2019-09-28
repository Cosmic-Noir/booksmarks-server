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

bookmarkRouter.route("/bookmark/:id").get((req, res) => {
  const { id } = req.params;
  const book = bookmarks.find(b => b.id == id);

  // Ensure book is found:
  if (!book) {
    logger.error(`Book with id ${id} not found.`);
    return res.status(404).send("Book not found");
  }
  res.json(book);
});

module.exports = bookmarkRouter;
