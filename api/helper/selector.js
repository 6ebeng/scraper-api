const { delay } = require('./delay');

async function mainSelector(page, selector, attribute) {
	try {
		// Check if the selector is an XPath selector
		const isXPathSelector = selector.startsWith('//') || selector.startsWith('(//') || selector.startsWith('((//');
		let elements = [];
		if (isXPathSelector) {
			// Use $x for XPath selectors to get element handles
			elements = (await page.$x(selector)) || [];
		} else {
			// Use $$ for CSS selectors to get element handles
			elements = (await page.$$(selector)) || [];
		}

		// Map over each element handle to extract attribute or textContent
		const contentPromises = elements.map((el) => {
			if (attribute) {
				// Use evaluate to get the attribute value from the element handle
				return el.evaluate((e, attr) => e.getAttribute(attr) || '', attribute);
			} else {
				// Use evaluate to get the textContent from the element handle
				return el.evaluate((e) => e.textContent.trim());
			}
		});

		// Resolve all promises from the mapping
		const content = await Promise.all(contentPromises);

		// Decode HTML entities
		return content.map((text) =>
			text
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&quot;/g, '"')
				.replace(/&39;/g, "'")
				.replace(/&amp;/g, '&')
		);
	} catch (error) {
		console.log('selector', selector);
		return []; // Return an empty array if there's an error
	}
}

async function elementSelector(page, selectors, attribute, regex, groups, queryAll, valueToReplace) {
	if (!Array.isArray(selectors)) {
		throw new Error('selectors must be an array');
	}
	if (valueToReplace && !Array.isArray(valueToReplace)) {
		throw new Error('valueToReplace must be an array of replacement rules');
	}
	let arrSelector = [];

	const applyRegexAndGroups = (value, regex, groups) => {
		const matches = value.match(new RegExp(regex, 'gi'));
		if (!matches) return '';
		if (groups && groups.length > 0) {
			return groups.map((group) => matches[group]).join('');
		} else {
			return matches.join('');
		}
	};

	const replaceValues = (value, replacements) => {
		replacements.forEach((replacement) => {
			if (replacement.value) {
				value = value.replace(new RegExp(replacement.value, 'gi'), replacement.replaceWith);
			}
		});
		return value.trim();
	};

	for (const selector of selectors) {
		let elements;
		//await delay(1000);
		elements = await mainSelector(page, selector, attribute, queryAll);

		if (elements.length === 0) {
			console.log('\x1b[33m%s\x1b[0m', `Error selecting elements with selector "${selector}"`);
			continue; // Skip to the next selector if no elements are found
		}

		elements.forEach((elementValue) => {
			let value = regex ? applyRegexAndGroups(elementValue, regex, groups) : elementValue;
			if (valueToReplace) {
				value = replaceValues(value, valueToReplace);
			}
			if (value) arrSelector.push(value);
		});

		if (!queryAll && arrSelector.length) {
			break;
		}
	}
	console.log('arrSelector', arrSelector);
	return arrSelector;
}

// Ensure mainSelector is defined or imported in the scope

module.exports = { elementSelector };
