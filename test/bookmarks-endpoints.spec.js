const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const {
  makeBookmarksArray,
  makeMaliciousBookmark
} = require("./bookmarks.fixtures");

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
describe(`GET /bookmarks`, () => {
  context(`Given no bookmarks`, () => {
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

  context(`Given an xss attack bookmark`, () => {
    const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

    beforeEach(`Insert malicious bookmark`, () => {
      return db.into("bookmarks").insert([maliciousBookmark]);
    });

    it(`Removes XSS attack content`, () => {
      return supertest(app)
        .get(`/bookmarks`)
        .expect(200)
        .expect(res => {
          expect(res.body[0].title).to.eql(expectedBookmark.title);
          expect(res.body[0].description).to.eql(expectedBookmark.description);
        });
    });
  });
});

describe(`GET /bookmarks/:bookmark_id`, () => {
  context(`Given no bookmark in db`, () => {
    it(`Responds with 404`, () => {
      const bookmarkID = 12455;
      return supertest(app)
        .get(`/bookmarks/${bookmarkID}`)
        .expect(404, { error: { message: `Bookmark does not exist` } });
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

  context(`Given an XSS attack bookmark`, () => {
    const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

    beforeEach(`Insert malicious bookmark`, () => {
      return db.into("bookmarks").insert([maliciousBookmark]);
    });

    it(`Removes XSS attack content`, () => {
      return supertest(app)
        .get(`/bookmarks/${maliciousBookmark.id}`)
        .expect(200)
        .expect(res => {
          expect(res.body.title).to.eql(expectedBookmark.title);
          expect(res.body.description).to.eql(expectedBookmark.description);
        });
    });
  });
});

// POST endpoints
describe(`POST /bookmarks`, () => {
  it(`creates a bookmark, responding with 201 and a new bookmark`, function() {
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
        expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`);
      })
      .then(res =>
        supertest(app)
          .get(`/bookmarks/${res.body.id}`)
          .expect(res.body)
      );
  });

  // Checking for missing fields:
  const requiredFields = ["title", "description", "url", "rating"];

  requiredFields.forEach(field => {
    const newBookmark = {
      title: "Test Title",
      description: "Testing all the stuffs",
      url: "www.yahoo.com",
      rating: 9
    };

    it(`Responds with 400 and an error message when '${field}' is missing`, () => {
      delete newBookmark[field];

      return supertest(app)
        .post("/bookmarks")
        .send(newBookmark)
        .expect(400, {
          error: { message: `Missing '${field}' in request body` }
        });
    });
  });
});
