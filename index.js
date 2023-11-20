'use strict';

/* Purpose: Running node.js and initialize.
 * Author : Tishko Rasoul (tishko.rasoul@gmail.com)
 */

const { app, cors, http, compression, bodyParser, uuidv4, util } = require('./src/helper/packages');

/* Require Enviornment File  */
require('dotenv').config();

/* Require Preety Error / show errors beautifully  */
require('pretty-error').start();

/* Create Server */
var server = http.createServer(app);

/* To set port */
app.set('port', process.env.PORT || 3000);

/* Compress all HTTP responses */
app.use(compression());

/* To Listen Port */
server.listen(app.get('port'), function () {
	console.log(`Express server listening on port ${app.get('port')}`);
});

/* Cross Origin */
app.use(cors());

/* BodyParser Middleware */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

/* Handle Invalid JSON */
app.use(function (err, req, res, next) {
	if (err.status === 400) {
		var ErrorObj = { ResponseCode: 400, Message: 'Invalid JSON request.' };
		return res.status(400).json(ErrorObj);
	}
	return next(err); // if it's not a 400, let the default error handling do it.
});

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});

/* Add UUID to each log request */
function createLoggerWithId(reqId) {
	return {
		log: (...args) => console.log(`[${reqId}]`, util.format(...args)),
		error: (...args) => console.error(`[${reqId}]`, util.format(...args)),
		warn: (...args) => console.warn(`[${reqId}]`, util.format(...args)),
		info: (...args) => console.info(`[${reqId}]`, util.format(...args)),
	};
}

// Middleware to add UUID and a bound logger to each request
app.use((req, res, next) => {
	req.id = uuidv4().split('-')[0];
	req.logger = createLoggerWithId(req.id);
	next();
});

/* API Routings */
app.use('/api/v1', require('./src/routes/api/v1'));

/* Redirect On Website */
app.get('/', function (req, res) {
	return res.send('Welcome To Web scraping APP');
});

/* Handle Invalid URL */
app.all('*', (req, res, next) => {
	res.status(404).json({ message: `Can't find ${req.originalUrl} on this server!` });
});

module.exports = { app };

/* End of file index.js */
/* Location: ./index.js */
