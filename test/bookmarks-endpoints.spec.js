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

// GET endpoints
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

// POST endpoints
describe(`POST /bookmarks`, () => {
  it(`creates a bookmark, responding with 201 and a new bookmark`, () => {
    this.retries(3);
    const newBookmark = {
      title: "Save The Planet",
      url: "www.google.com",
      description: "Lorem ipsum dolor sit amet consectetur adipisicing elit",
      rating: "10"
    };
    return supertest(app)
      .post("/bookmarks")
      .send(newBookmark)
      .expect(201)
      .expect(res => {
        expect(res.body.title).to.eql(newBookmark.title);
        expect(res.body.url).to.eql(newBookmark.url);
        expect(res.body.description).to.eql(newBookmark.description);
        expect(res.body.rating).to.eql(newBookmark.rating);
        expect(res.body).to.have.property("id");
        const expected = new Date().toLocaleString();
        const actual = new Date(res.body.date_published).toLocaleString();
        expect(actual).to.eql(expected);
      })
      .then(res =>
        supertest(app)
          .get(`/bookmarks/${res.body.id}`)
          .expect(res.body)
      );
  });
});
