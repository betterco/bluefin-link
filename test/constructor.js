const test = require("ava");
const Link = require("../src");

const dbUrl = "postgres://postgres:postgres@pg:5432/test";

test("requires a URL", t => {
  t.throws(() => new Link(), Error);
});

test("requires at least one path segment", t => {
  t.throws(() => new Link(dbUrl), Error);
});

test("requires the query directory to exist", t => {
  t.throws(() => new Link(dbUrl, __dirname, "does-not-exist"), Error);
});
