'use strict';

/*
 * Purpose : Website Search API
 * Package : Controller
 * Developed By  : Tishko Rasoul (tishko.rasoul@gmail.com)
 */

const {
	puppeteer,
	scrollToBottom,
	fs,
	Xvfb,
	stealth,
	useProxy,
	elementSelector,
	delay,
	blockResources,
	GetOption3AndOption2AndOption1,
	GetOption2AndOption1,
	GetOption1,
	processDescriptions,
	getStoreName,
} = require('../helper/packages.js');

function configureStealthPlugin(data) {
	if (!data.isHeadless) {
		puppeteer.use(
			stealth({
				enabledEvasions: new Set([
					/* evasions for headless only
					'chrome.app',
					'chrome.csi',
					'chrome.loadTimes',
					'chrome.runtime',
					'navigator.permissions',
					'navigator.plugins',
					'window.outerdimensions'
					*/

					//launch args (the webdriver fix is very much needed depending on how you launch chrome, just the method changed in v89) and sourceurl
					'defaultArgs',
					// appears to be necessary to prevent iframe issues? https://github.com/puppeteer/puppeteer/issues/1106
					'iframe.contentWindow',
					// necessary if running chromium instad of chrome
					'media.codecs',
					// Doesn't appear to be necessary with chrome version > 89?
					'navigator.webdriver',
					// Strips puppeteer/CDP artifacts from stacktrace
					'sourceurl',
					/* thou shall not lie about thou hardware stack
					'user-agent-override', // better off using this plugin manually than the default MSFT UA imo
					'webgl.vendor', // Try and use common hardware instead
					*/
				]),
			})
		);
	} else {
		stealth().enabledEvasions.delete('user-agent-override');
		stealth().enabledEvasions.delete('webgl.vendor');
		puppeteer.use(stealth());
	}
}

async function setupPageConfiguration(browser, userAgent, data) {
	const page = (await browser.pages())[0];
	// User agent override
	await require('puppeteer-extra-plugin-stealth/evasions/user-agent-override')({
		userAgent: userAgent,
		locale: 'en-US,en',
		maskLinux: true,
	}).onPageCreated(page);
	//await require(`puppeteer-extra-plugin-stealth/evasions/navigator.hardwareConcurrency`)(8).onPageCreated(page)
	//await require(`puppeteer-extra-plugin-stealth/evasions/navigator.vendor`)({ vendor: 'Google Inc.' }).onPageCreated(page)

	// WebGL Vendor override
	await require(`puppeteer-extra-plugin-stealth/evasions/webgl.vendor`)({
		vendor: 'Google Inc. (Intel)',
		renderer: 'Intel, Intel(R) HD Graphics 4000 Direct3D11 vs_5_0 ps_5_0, D3D11',
	}).onPageCreated(page);

	// Randomize proxy
	var proxies = selectRandomProxy(data);
	if (data.debug && proxies.length > 0) {
		console.log(proxies);
		// Use Proxy
		await useProxy(page, proxies);
	}

	//Randomize viewport size
	await setupPageViewport(page);

	await page.setJavaScriptEnabled(true);
	await page.setDefaultNavigationTimeout(0);

	//await page.setUserAgent(userAgent);

	// Saved cookies reading
	const cookies = fs.readFileSync('cookies.json', 'utf8');

	const deserializedCookies = JSON.parse(cookies);
	await page.setCookie(...deserializedCookies);

	//await page.emulateTimezone('Asia/Baghdad');

	await page.setRequestInterception(true);

	//Block unnecessary resource types and urls
	await blockResources(page, data);

	return page;
}

async function setupPageViewport(page) {
	await page.setViewport({
		width: 1366 + Math.floor(Math.random() * 100),
		height: 768 + Math.floor(Math.random() * 100),
		deviceScaleFactor: 1,
	});
}

function selectUserAgent() {
	const userAgents = [
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
		// ... other user agents
		//   'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
		//   'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:70.0) Gecko/20100101 Firefox/70.0',
	];
	return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function selectRandomProxy(data) {
	if (data.proxies && data.proxies.length > 0) {
		return data.proxies[Math.floor(Math.random() * data.proxies.length)];
	}
	return [];
}

async function handleScrapeError(res, error) {
	console.log('\x1b[31m%s\x1b[0m', error.message);
	let message = error.message;
	let statusCode = 500;
	const messages = ['Waiting failed', 'Timeout exceeded while waiting for event'];

	if (message.includes(messages)) {
		return res.status(statusCode).json({
			message: error.message,
		});
	} else {
		// Generic error handling
		console.error('Error:', error);
		return res.status(statusCode).json({
			message: 'Some error occured Or data not found, please try again.',
		});
	}
}

async function cleanup(browser, xvfb, data) {
	if (browser) await browser.close();
	if (!data.isHeadless && xvfb) xvfb.stopSync();
}

async function waitForContainerLoad(page, data) {
	// Wait for Selector
	if (data.productConfig.container) {
		// Correct the method to 'startsWith'
		if (
			data.productConfig.container.startsWith('//') ||
			data.productConfig.container.startsWith('(//') ||
			data.productConfig.container.startsWith('((//')
		) {
			await page.waitForXPath(data.productConfig.container, {
				timeout: 30000,
			});
		} else {
			await page.waitForSelector(data.productConfig.container, {
				timeout: 30000,
			});
		}
	} else {
		throw new Error('Container is empty, please check your selector');
	}
}

async function scrapeProductData(req, page, data, handle) {
	const response = {};
	waitForContainerLoad(page, data);

	response.handle = handle;

	const title = await elementSelector(
		req,
		page,
		data.productConfig.title.selectors,
		data.productConfig.title.attribute,
		data.productConfig.title.regex,
		data.productConfig.title.groups,
		true,
		data.productConfig.title.valueToReplace
	);
	if (Array.isArray(title)) {
		response.title = title.join(' ');
	} else {
		response.title = title || '';
	}

	response.description = await processDescriptions(req, page, data);

	const vendor =
		data.productConfig.vendor.name ||
		(await elementSelector(
			req,
			page,
			data.productConfig.vendor,
			data.productConfig.vendor.attribute,
			data.productConfig.vendor.regex,
			data.productConfig.vendor.groups,
			true,
			data.productConfig.vendor.valueToReplace
		));
	if (Array.isArray(vendor)) {
		response.vendor = vendor.join(' ');
	} else {
		response.vendor = vendor || '';
	}

	const category = await elementSelector(
		req,
		page,
		data.productConfig.category.selectors,
		data.productConfig.category.attribute,
		data.productConfig.category.regex,
		data.productConfig.category.groups,
		true,
		data.productConfig.category.valueToReplace
	);
	if (Array.isArray(category)) {
		response.category = category.join(' ');
	} else {
		response.category = category.trim() || '';
	}

	const option3AndOption2AndOption1 = await GetOption3AndOption2AndOption1(req, page, data);
	const option2AndOption1 = await GetOption2AndOption1(req, page, data, null, null, null, []);
	const option1 = await GetOption1(req, page, data, null, null, null, null, null, null, []);

	response.variants = option3AndOption2AndOption1.length
		? option3AndOption2AndOption1
		: option2AndOption1.length
		? option2AndOption1
		: option1.length
		? option1
		: [];

	response.message = 'success';

	return response;
}

async function initializeBrowser(data, userAgent) {
	const xvfb = new Xvfb({
		silent: true,
		xvfb_args: ['-screen', '0', '1366x768x24', '-ac'],
	});

	const args = [
		'--no-sandbox',
		'--disable-setuid-sandbox',
		'--window-size=1366x768',
		'--blink-settings=imagesEnabled=true',
		'--disable-translate',
		'--window-position=0,0',
		'--hide-scrollbars',
		'--mute-audio',
		'--disable-speech-api',
		`--user-agent=${userAgent}`,
		'--disable-web-security',
		'--use-fake-device-for-media-stream',
	];

	if (!data.isHeadless) {
		await xvfb.startSync();
		args.push('--display=' + xvfb._display);
	}

	configureStealthPlugin(data);

	/* Launch Browser */
	const browser = await puppeteer.launch({
		headless: data.isHeadless ? 'new' : false,
		executablePath: '/usr/bin/chromium-browser',
		args: args,
		slowMo: 0,
	});

	return { browser, xvfb };
}

async function debugPage(page, data, store) {
	if (data.debug) await delay(8000);

	// debug
	if (data.debug) {
		// fs.writeFileSync('debug/docs/' + store + '.html', await page.evaluate(() => {
		//   return document.querySelectorAll("html")[0].outerHTML
		// }), {
		//   encoding: 'utf8',
		//   flag: 'w'
		// })

		// console.log(await page.evaluate(() => {
		//   var arr = []
		//   arr.push(navigator.webdriver)
		//   arr.push(navigator.language)
		//   arr.push(navigator.deviceMemory)
		//   arr.push(navigator.hardwareConcurrency)
		//   arr.push(navigator.platform)
		//   arr.push(window.screen.width)
		//   arr.push(window.screen.height)
		//   return arr
		// }))

		await page.screenshot({
			path: 'debug/screenshoots/' + store + '.png',
			fullPage: true,
		});
	}
}

async function scrapeProduct(req, res) {
	const handle = req.body.handle;
	const store = await getStoreName(handle);
	const data = await require('../models/data/' + store);
	const userAgent = selectUserAgent();
	const { browser, xvfb } = await initializeBrowser(data, userAgent);
	const page = await setupPageConfiguration(browser, userAgent, data);

	try {
		// Go to page
		await page.goto(req.body.handle, {
			waitUntil: data.waitUntil,
			timeout: 0,
		});

		// Randomly mouse movement to avoid detections
		await page.mouse.move(100, Math.floor(Math.random() * 100));
		await page.mouse.move(200, Math.floor(Math.random() * 100));

		// Save cookies
		const saveCookies = await page.cookies();
		await fs.promises.writeFile('./cookies.json', JSON.stringify(saveCookies, null, 2));
		// Scroll to bottom
		data.scrollToBottom && (await page.evaluate(scrollToBottom, { frequency: 200, timing: 0 }));

		// debug
		await debugPage(page, data, store);

		// Scrape data
		const response = await scrapeProductData(req, page, data, handle);

		req.logger.log('\x1b[32m%s\x1b[0m', 'Succeed response');
		return res.status(200).json(response);
	} catch (e) {
		await handleScrapeError(res, e);
	} finally {
		await cleanup(browser, xvfb, data);
	}
}

module.exports = { scrapeProduct };
