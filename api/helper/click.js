'use strict';

const { delay } = require('./delay');

async function elementClick(page, selector, valueToReplace, delayTime = 0) {
	// If delay is set, wait for that amount of time
	if (delayTime) await page.waitForTimeout(delayTime);

	// Replace the placeholder in selector if needed
	if (valueToReplace) {
		selector = selector.replace('{{valueToReplace}}', valueToReplace.trim());
	}

	// Check if the selector is an XPath
	if (selector.startsWith('//') || selector.startsWith('(//') || selector.startsWith('((//')) {
		// await page.waitForXPath(selector); // Uncomment this line if you want to wait for the element
		const elements = await page.$x(selector);
		if (elements.length === 0) {
			throw new Error(`No element found for XPath: ${selector}`);
		}
		await elements[0].click();
	} else {
		// await page.waitForSelector(selector); // Uncomment this line if you want to wait for the element
		const element = await page.$(selector);
		if (!element) {
			throw new Error(`No element found for selector: ${selector}`);
		}
		await element.click();
	}

	// Add a small delay after the click to allow for any post-click processing (if necessary)
	// This is not the best practice for waiting for elements to be visible or navigations to happen.
	// Ideally, use more specific wait conditions like waitForNavigation, waitForSelector, etc.
	await page.waitForTimeout(1000);

	// Wait for the page to load, this is not a robust way to check for page load
	// It's better to wait for a specific response or navigation after a click
	// await page.waitForResponse((response) => response.status() === 200);
}

module.exports = { elementClick };
