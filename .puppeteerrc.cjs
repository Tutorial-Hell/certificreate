/* eslint-disable @typescript-eslint/no-require-imports -- Puppeteer's installer requires() this file directly, before any bundler runs, so it must stay CommonJS */
const { join } = require("node:path");

/** @type {import("puppeteer").Configuration} */
module.exports = {
  cacheDirectory: join(__dirname, ".cache", "puppeteer"),
};
