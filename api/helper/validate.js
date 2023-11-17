const { check, validationResult } = require('express-validator'),
	fs = require('fs');

function validateBody(method) {
	switch (method) {
		case 'search':
			{
				return [check('handle').notEmpty().withMessage('handle field is required').trim()];
			}
			break;
	}
}

async function isValidStore(store) {
	if (
		Array.from(fs.readdirSync('./api/models/data'))
			.map((e) => e.replace('.json', ''))
			.includes(store)
	)
		return true;
	else return false;
}

async function getStoreName(handle) {
	var match = await handle.match(
		'^((http[s]?|ftp)://)?/?([^/.]+.)*?([^/.]+.[^:/s.]{1,3}(.[^:/s.]{1,2})?(:d+)?)($|/)([^#?s]+)?(.*?)?(#[w-]+)?$'
	);
	return await match[4].replace(/\..+/g, '');
}

async function getStoreDomain(handle) {
	var match = await handle.match(
		'^((http[s]?|ftp)://)?/?([^/.]+.)*?([^/.]+.[^:/s.]{1,3}(.[^:/s.]{1,2})?(:d+)?)($|/)([^#?s]+)?(.*?)?(#[w-]+)?$'
	);
	//concat groups 1,3,4
	concatGroups = (await match[1]) + (await match[3]) + (await match[4]);
	return await concatGroups.replace(/\/[^\/]*$/g, '');
}

/* To Check Validation json using validationResult */
async function checkJsonValidation(req, res) {
	let errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(500).json({
			message: errors.array()[0].msg,
		});
	}
}

async function validate(req, res, next) {
	// get handle from request body
	const { handle } = req.body;

	// validate request body handle field
	validateBody('search');

	/* Check Validation json using validationResult */
	checkJsonValidation(req, res);

	// Get store name
	const store = await getStoreName(handle);

	// Check if store is supported
	if (!(await isValidStore(store))) {
		// msg red Console store name not supported
		console.log('\x1b[31m%s\x1b[0m', `${store} is not supported!`);

		return res.status(500).json({
			message: `${store} is not supported!`,
		});
	}

	console.log('\x1b[34m%s\x1b[0m', handle);

	next();
}

module.exports = { validate, isValidStore, getStoreName, checkJsonValidation, getStoreDomain };
