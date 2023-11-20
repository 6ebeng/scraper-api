'use strict';

/*
 * Purpose : For All Website API's Routing
 * Package : Router
 * Developed By  : Tishko Rasoul (tishko.rasoul@gmail.com)
 */

const express = require('express'),
	router = express.Router(),
	{ scrapeProduct } = require('../../../controllers/scrapeProduct'),
	{ validate } = require('../../../helper/packages');

/* Routings */
router.post('/product', validate, scrapeProduct);
router.post('/collection', validate, scrapeProduct);
module.exports = router;
