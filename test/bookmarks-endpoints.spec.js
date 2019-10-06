const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const { makeBookmarksArray } = require("./bookmarks.fixtures");

let db;

// Create connection
before("Make knex instance", () => {
  db = knex({
    client: "pg",
    connection: process.env.TEST_DB_URL
  });
  app.set("db", db);
});

// Disconnect and clear the table for testing
after("Disconnect from db", () => db.destroy());

before("Clear the table", () => db("bookmarks").truncate());

afterEach("Cleanup", () => db("bookmarks").truncate());

describe("GET /bookmarks", () => {
  context("Given no bookmarks", () => {
    it("Responds with 200 and an empty list", () => {
      return supertest(app)
        .get("/bookmarks")
        .expect(200, []);
    });
  });

  context("Given there are bookmarks", () => {
    const testBookmarks = makeBookmarksArray();

    beforeEach("Insert bookmarks", () => {
      return db.into("bookmarks").insert(testBookmarks);
    });

    it("GET /bookmarks responds with 200 and all bookmarks", () => {
      return supertest(app)
        .get("/bookmarks")
        .expect(200, testBookmarks);
    });
  });
});

describe("GET /bookmarks/:bookmark_id", () => {
  context("Given no bookmark in db", () => {
    it("Responds with 404", () => {
      const bookmarkID = 12455;
      return supertest(app)
        .get(`/bookmarks/${bookmarkID}`)
        .expect(404, { error: { message: `Bookmark doesn't exist` } });
    });
  });

  context("Given there are bookmarks", () => {
    const testBookmarks = makeBookmarksArray();

    beforeEach("Insert bookmarks", () => {
      return db.into("bookmarks").insert(testBookmarks);
    });

    it("GET /bookmarks/:bookmark_id responds with 200 and specified bookmark", () => {
      const bookmarkID = 2;
      const expectedBookmark = testBookmarks[bookmarkID - 1];
      return supertest(app)
        .get(`/bookmarks/${bookmarkID}`)
        .expect(200, expectedBookmark);
    });
  });
});
