"use strict";

/*
 * Purpose : To load all Node.Js Packages
 * Package : NPM Packages
 * Developed By  : Tishko Rasoul (tishko.rasoulgmail.com)
 */

const puppeteer = require("puppeteer-extra"),
  stealth = require("puppeteer-extra-plugin-stealth"),
  scrollToBottom = require("scroll-to-bottomjs"),
  { check, validationResult } = require("express-validator"),
  fs = require("fs"),
  Xvfb = require("xvfb"),
  useProxy = require("puppeteer-page-proxy"),
  elementSelector = require("./selector"),
  { elementClick } = require("./click"),
  { validate } = require("./validate"),
  { delay } = require("./delay"),
  { isValidStore } = require("./validate"),
  { blockResources } = require("./blockResources");

module.exports = {
  delay,
  puppeteer,
  scrollToBottom,
  check,
  validationResult,
  fs,
  validate,
  Xvfb,
  stealth,
  useProxy,
  elementSelector,
  elementClick,
  isValidStore,
  blockResources,
};
