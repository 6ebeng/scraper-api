'use strict';

/*
 * Purpose : For All Website API's Routing
 * Package : Router
 * Developed By  : Tishko Rasoul (tishko.rasoul@gmail.com)
 */

const express = require('express'),
	router = express.Router(),
	{ scrapeProductData } = require('../controllers/scrapeProductData'),
	{ validate } = require('../helper/packages');

/*Website Routings */
router.post('/search', validate, scrapeProductData);

module.exports = router;
