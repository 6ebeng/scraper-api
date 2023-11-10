'use strict';

const { delay } = require('./delay');

async function elementClick(page, selector, valueToReplace, delayTime = 0) {
	// Replace the placeholder in selector if needed
	selector = valueToReplace ? selector.replace('{{valueToReplace}}', valueToReplace.trim()) : selector;

	// Determine whether the selector is an XPath
	const isXPath = selector.startsWith('//') || selector.startsWith('(//') || selector.startsWith('((//');

	// Wait for the element based on its selector type
	const waitFor = isXPath ? page.waitForXPath(selector) : page.waitForSelector(selector);
	await waitFor;

	// Check if the element exists
	const elementToClick = isXPath ? (await page.$x(selector))[0] : await page.$(selector);
	if (elementToClick) {
		// yellow color console
		console.log('\x1b[33m%s\x1b[0m', 'Element found, clicking:', selector);
		await elementToClick.evaluate((b) => b.click());
		await page.waitForNetworkIdle();
		await delay(delayTime);
	} else {
		console.log('Element not found to click:', selector);
	}
}

// await page.waitForTimeout(1000);

// Wait for the page to load, this is not a robust way to check for page load
// It's better to wait for a specific response or navigation after a click
//await page.waitForResponse((response) => response.status() === 200);

module.exports = { elementClick };
