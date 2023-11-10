'use strict';

/*
 * Purpose : Website Search API
 * Package : Controller
 * Developed By  : Tishko Rasoul (tishko.rasoul@gmail.com)
 */

const {
	puppeteer,
	scrollToBottom,
	validationResult,
	fs,
	Xvfb,
	stealth,
	useProxy,
	elementSelector,
	delay,
	isValidStore,
	blockResources,
	GetOption3AndOption2AndOption1,
	GetOption2AndOption1,
	GetOption1,
} = require('../helper/packages.js');

let storesController = { search };

async function search(req, res) {
	var browser;
	/* To Check Validation json */
	let errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(500).json({
			Message: errors.array()[0].msg,
		});
	}

	let handle = req.body.handle;
	console.log('\x1b[34m%s\x1b[0m', handle);

	var match = await handle.match(
		'^((http[s]?|ftp)://)?/?([^/.]+.)*?([^/.]+.[^:/s.]{1,3}(.[^:/s.]{1,2})?(:d+)?)($|/)([^#?s]+)?(.*?)?(#[w-]+)?$'
	);
	let store = await match[4].replace(/\..+/g, '');

	if (!(await isValidStore(store))) {
		console.log('\x1b[33m%s\x1b[0m', handle);
		return res.status(500).json({
			data: {},
			Message: `${store} is not supported!`,
		});
	}
	const data = await require('../models/data/' + store);

	const userAgents = [
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
		'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
		'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:70.0) Gecko/20100101 Firefox/70.0',
	];
	//const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)]
	const userAgent =
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36';
	//const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36"

	const xvfb = new Xvfb({
		silent: true,
		xvfb_args: ['-screen', '0', '1366x768x24', '-ac'],
	});

	var args = [];

	args.push(`--no-sandbox`);
	args.push(`--disable-setuid-sandbox`);
	args.push(`--window-size=1366x768`);
	args.push(`--blink-settings=imagesEnabled=true`);
	args.push(`--disable-translate`);
	args.push(`--window-position=0,0`);
	args.push('--hide-scrollbars');
	args.push('--mute-audio');
	args.push(`--disable-speech-api`);
	args.push(`--user-agent=${userAgent}`);
	args.push(`--disable-web-security`);

	if (!data.isHeadless) {
		await xvfb.startSync();
		args.push('--use-fake-device-for-media-stream');
		args.push('--display=' + xvfb._display);
	}

	/* Initialize Browser */
	try {
		// Enable stealth plugin
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

		/* Launch Browser */
		browser = await puppeteer.launch({
			headless: data.isHeadless ? 'new' : false,
			executablePath: '/usr/bin/chromium-browser',
			args: args,
			slowMo: 0,
		});

		// First page
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

		//await require(`puppeteer-extra-plugin-stealth/evasions/navigator.languages`)(['en-US', 'en']).onPageCreated(page)

		// Randomize proxy
		var proxies = data.proxies[Math.floor(Math.random() * data.proxies.length)];
		if (data.debug && proxies) {
			console.log(proxies);
			// Use Proxy
			await useProxy(page, proxies);
		}

		//Randomize viewport size
		await page.setViewport({
			width: 1366 + Math.floor(Math.random() * 100),
			height: 768 + Math.floor(Math.random() * 100),
			deviceScaleFactor: 1,
			hasTouch: false,
			isLandscape: false,
			isMobile: false,
		});

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

		//console.log(await page.browser().userAgent())
		// await bypassWebgl(page,userAgent,"Intel Inc.")
		// Bypass detections
		// await bypass(page)

		// Go to page
		await page.goto(req.body.handle, {
			waitUntil: data.waitUntil,
			timeout: 0,
		});

		// Print response headers while debugging
		// if (data.debug) console.log(await response.headers());

		// Randomly mouse movement to bypass detections
		await page.mouse.move(100, Math.floor(Math.random() * 100));
		await page.mouse.move(200, Math.floor(Math.random() * 100));

		// Save cookies
		const saveCookies = await page.cookies();
		await fs.promises.writeFile('./cookies.json', JSON.stringify(saveCookies, null, 2));

		// Scroll to bottom
		if (data.scrollToBottom) await page.evaluate(scrollToBottom, { frequency: 200, timing: 0 });

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

		// Wait for Response
		// we need to use waitForResponse because we are dealing with AJAX - no page navigation
		//await page.waitForResponse((response) => response.status() === 200);

		// Wait for Selector
		if (data.container) {
			// Correct the method to 'startsWith'
			if (data.container.startsWith('//') || data.container.startsWith('(//') || data.container.startsWith('((//')) {
				await page.waitForXPath(data.container, {
					timeout: 30000,
				});
			} else {
				await page.waitForSelector(data.container, {
					timeout: 30000,
				});
			}
		} else {
			throw new Error('Container is empty, please check your selector');
		}

		// /* Load Page Content */
		// var $ = cheerio.load(await page.content());

		/* Check Product Sizes */
		// let Size = req.body.Size;

		// if (Size) { // Size is optional

		//   // Not Instock sizes
		//   let requiredSize = Size.toString();
		//   var NotInStockSizes = await elementSelector(page, data.notInStockSizes.selectors, data.notInStockSizes.attribute || null, data.notInStockSizes.regex || null, data.notInStockSizes.groups || [], true)
		//   var isOutStock
		//   if (data.debug) console.log(NotInStockSizes)
		//   NotInStockSizes.forEach(item => { if (item.trim() === requiredSize.trim()) isOutStock = true })
		//   if (isOutStock) {
		//     return res.status(500).json({
		//       Data: {},
		//       Message: `Size ${Size} is Out Of Stock!`
		//     });
		//   }

		// InStock Sizes
		// var InStockSizes = await elementSelector(
		// 	page,
		// 	data.inStockSizes.selectors,
		// 	data.inStockSizes.attribute || null,
		// 	data.inStockSizes.regex || null,
		// 	data.inStockSizes.groups || [],
		// 	true
		// );
		// var isInstock
		//   InStockSizes.forEach(item => { if (item.trim() === requiredSize.trim()) isInstock = true })
		//   if (data.debug) console.log(InStockSizes)
		//   if (!isInstock) {
		//     return res.status(500).json({
		//       Data: {},
		//       Message: `Size ${Size} is not available!`
		//     });
		//   }

		//   // Click Size to appear the true price
		//   if (isInstock) {
		//     if (data.clickSize) {
		//       await elementClick(page,
		//         data.clickSize.replace("{{size}}", Size.trim())
		//       );
		//       await delay(2000);
		//     }
		//   }
		// }

		// /* Load Page Content */
		// var $ = cheerio.load(await page.content()); //it changes to jquery
		const response = {};

		response.handle = req.body.handle;

		const title = await elementSelector(
			page,
			data.title.selectors,
			data.title.attribute,
			data.title.regex,
			data.title.groups,
			true,
			data.title.valueToReplace
		);
		if (Array.isArray(title)) {
			response.title = title.join(' ');
		} else {
			response.title = title || '';
		}

		const descriptions = await elementSelector(
			page,
			data.descriptions.selectors,
			data.descriptions.attribute,
			data.descriptions.regex,
			data.descriptions.groups,
			true,
			data.descriptions.valueToReplace
		);
		if (Array.isArray(descriptions)) {
			response.descriptions = descriptions.join(' ');
		} else {
			response.descriptions = descriptions || '';
		}

		const vendor =
			data.vendor.name ||
			(await elementSelector(
				page,
				data.vendor,
				data.vendor.attribute,
				data.vendor.regex,
				data.vendor.groups,
				true,
				data.vendor.valueToReplace
			));
		if (Array.isArray(vendor)) {
			response.vendor = vendor.join(' ');
		} else {
			response.vendor = vendor || '';
		}

		const category = await elementSelector(
			page,
			data.category.selectors,
			data.category.attribute,
			data.category.regex,
			data.category.groups,
			true,
			data.category.valueToReplace
		);
		if (Array.isArray(category)) {
			response.category = category.join(' ');
		} else {
			response.category = category.trim() || '';
		}

		// if (data.option3.selectors.length) {
		// 	response.variants = await GetOption3AndOption2AndOption1(page, data);
		// } else if (data.option2.selectors.length) {
		// 	response.variants = await GetOption2AndOption1(page, data, null, null, null, []);
		// } else {
		// }

		const option3AndOption2AndOption1 = await GetOption3AndOption2AndOption1(page, data);
		const option2AndOption1 = await GetOption2AndOption1(page, data, null, null, null, []);
		const option1 = await GetOption1(page, data, null, null, null, null, null, null, []);

		response.variants = option3AndOption2AndOption1.length
			? option3AndOption2AndOption1
			: option2AndOption1.length
			? option2AndOption1
			: option1.length
			? option1
			: [];

		response.message = 'success';
		console.log('\x1b[32m%s\x1b[0m', 'Succeed response'); //green

		return res.status(200).json(response);
	} catch (e) {
		console.log('\x1b[31m%s\x1b[0m', e.message);
		if (e.message.includes('Waiting failed')) {
			return res.status(500).json({
				message: e.message,
			});
		} else if (e.message.includes('Timeout exceeded while waiting for event')) {
			return res.status(500).json({
				message: e.message,
			});
		} else {
			console.log('err', e);
			return res.status(500).json({
				message: 'Some error occured Or data not found, please try again.',
			});
		}
	} finally {
		if (!data.isHeadless) {
			xvfb.stopSync();
		}
		browser.close();
	}
}

module.exports = storesController;
