const express = require("express");
const BookmarksService = require("./bookmarks-service");
const xss = require("xss");

// Create router:
const bookmarkRouter = express.Router();
const bodyParser = express.json();

// sterilized bookmark:
const sterilizedBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: bookmark.rating,
  date_published: bookmark.date_published
});

bookmarkRouter
  .route("/")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks.map(sterilizedBookmark));
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    const { title, url, description, rating } = req.body;
    const newBookmark = { title, url, description, rating };
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
          .location(`/bookmarks/${bookmark.id}`)
          .json(sterilizedBookmark(bookmark));
      })
      .catch(next);
  });

bookmarkRouter
  .route("/:bookmark_id")
  .all((req, res, next) => {
    BookmarksService.getById(req.app.get("db"), req.params.bookmark_id)
      .then(bookmark => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: `Bookmark does not exist` }
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
