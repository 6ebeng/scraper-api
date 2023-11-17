'use strict';

/*
 * Purpose : For All Website API's Routing
 * Package : Router
 * Developed By  : Tishko Rasoul (tishko.rasoul@gmail.com)
 */

const express = require('express'),
	router = express.Router(),
	storeController = require('../controllers/storesController'),
	{ validate } = require('../helper/validate');

/*Website Routings */
router.post('/search', validate('search'), storeController.search);

module.exports = router;
