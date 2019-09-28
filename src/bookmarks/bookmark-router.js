const express = require("express");
const uuid = require("uuid/v4");
const logger = require("../logger");

// Data
const { bookmarks } = require("../bookmarks");

// Create router:
const bookmarkRouter = express.Router();
const bodyParser = express.json();

bookmarkRouter
  .route("/bookmark")
  .get((req, res) => {
    res.json(bookmarks);
  })
  .post(bodyParser, (req, res) => {
    const { title, author, rating } = req.body;

    // Validate
    if (!title) {
      logger.error(`Title is required`);
      return res.status(400).send("Invalid data");
    }

    if (!author) {
      logger.error(`Author is required`);
      return res.status(400).send("Invalid data");
    }

    if (!rating) {
      logger.error(`Rating is required`);
      return res.status(400).send("Invalid data");
    }

    const id = uuid();

    const book = {
      id,
      title,
      author,
      rating
    };

    bookmarks.push(book);
    logger.info(`Book with id ${id} created`);

    res
      .status(201)
      .location(`http://localhost:8000/bookmark/${id}`)
      .end();
  });

bookmarkRouter
  .route("/bookmark/:id")
  .get((req, res) => {
    const { id } = req.params;
    const book = bookmarks.find(b => b.id == id);

    // Ensure book is found:
    if (!book) {
      logger.error(`Book with id ${id} not found.`);
      return res.status(404).send("Book not found");
    }
    res.json(book);
  })
  .delete((req, res) => {
    const { id } = req.params;

    const bookIndex = bookmarks.findIndex(b => b.id == id);

    if (bookIndex === -1) {
      logger.error(`Bookmark with id ${id} not found`);
      return res.status(404).send("Not found");
    }

    // Remove bookmark from list:
    bookmarks.splice(bookIndex, 1);

    res.status(204).end();
  });

module.exports = bookmarkRouter;
