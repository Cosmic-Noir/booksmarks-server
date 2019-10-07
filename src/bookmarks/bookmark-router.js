const express = require("express");
const BookmarksService = require("../bookmarks-service");
const xss = require("xss");
const uuid = require("uuid/v4");
const logger = require("../logger");

// Data
// const { bookmarks } = require("../bookmarks");

// sterilized bookmark:
const sterilizedBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  date_published: bookmark.date_published
});

// Create router:
const bookmarkRouter = express.Router();
const bodyParser = express.json();

bookmarkRouter
  .route("/bookmark")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmark => {
        res.json(bookmarks.map(sterilizedBookmark));
      })
      .catch(next);
  })
  .post(bodyParser, (req, res) => {
    const { title, url, content } = req.body;
    const newBookmark = { title, url, description };
    // Validate
    for (const [key, value] of Object.entries(newBookmark)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
    }

    BookmarksService.insertBookmark(req.app.get("db"), newBookmark)
      .then(bookmark => {
        res
          .status(201)
          .location(`/articles/${bookmark.id}`)
          .json(sterilizedBookmark(bookmark));
      })
      .catch(next);
  });

bookmarkRouter
  .route("/bookmark/:id")
  .all((req, res, next) => {
    BookmarksService.getById(req.app.get("db"), req.params.bookmark_id)
      .then(bookmark => {
        if (!bookmark) {
          return res.status(400).json({
            error: { message: `Bookmark doesn't exist` }
          });
        }
        res.bookmark = bookmark;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(sterilizedBookmark(res.bookmark));
  })
  .delete((req, res, next) => {
    BookmarksService.deleteBookmark(req.app.get("db"), req.params.bookmark_id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = bookmarkRouter;
