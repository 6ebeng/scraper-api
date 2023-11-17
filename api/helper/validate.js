const { check } = require('express-validator'),
	fs = require('fs');

function validate(method) {
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

module.exports = { validate, isValidStore };
