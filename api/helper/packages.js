'use strict';

/*
 * Purpose : To load all Node.Js Packages
 * Package : NPM Packages
 * Developed By  : Tishko Rasoul (tishko.rasoulgmail.com)
 */

const puppeteer = require('puppeteer-extra'),
	stealth = require('puppeteer-extra-plugin-stealth'),
	scrollToBottom = require('scroll-to-bottomjs'),
	fs = require('fs'),
	Xvfb = require('xvfb'),
	useProxy = require('puppeteer-page-proxy'),
	express = require('express'),
	router = express.Router(),
	cors = require('cors'),
	http = require('http'),
	compression = require('compression'),
	bodyParser = require('body-parser'),
	app = require('express')(),
	{ v4: uuidv4 } = require('uuid'),
	{ elementSelector } = require('./selector'),
	{ elementClick } = require('./click'),
	{ delay } = require('./delay'),
	{ isValidStore, getStoreName, checkJsonValidation, validate } = require('./validate'),
	{ blockResources } = require('./blockResources'),
	{ cleanPrice } = require('./cleanPrice'),
	{ GetOption3AndOption2AndOption1, GetOption2AndOption1, GetOption1 } = require('./getVariants'),
	{ htmlSelector } = require('./htmlSelector'),
	{ processDescriptions } = require('./descriptionBuilder'),
	{ processUrl } = require('./processUrl');

module.exports = {
	app,
	express,
	router,
	cors,
	http,
	delay,
	compression,
	uuidv4,
	puppeteer,
	bodyParser,
	scrollToBottom,
	fs,
	validate,
	Xvfb,
	stealth,
	useProxy,
	elementSelector,
	elementClick,
	isValidStore,
	blockResources,
	cleanPrice,
	GetOption3AndOption2AndOption1,
	GetOption2AndOption1,
	GetOption1,
	htmlSelector,
	processDescriptions,
	processUrl,
	getStoreName,
	checkJsonValidation,
};
