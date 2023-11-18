async function mainSelector(page, selector, attribute) {
	try {
		return await page.evaluate(
			async ({ selector, attribute }) => {
				// Function to decode HTML entities
				const decodeHtmlEntities = (text) => {
					return text
						.replace(/&lt;/g, '<')
						.replace(/&gt;/g, '>')
						.replace(/&quot;/g, '"')
						.replace(/&39;/g, "'")
						.replace(/&amp;/g, '&');
				};

				// Check if the selector is an XPath selector
				const isXPathSelector = selector.startsWith('//') || selector.startsWith('(//') || selector.startsWith('((//');

				let elements;
				if (isXPathSelector) {
					// Use document.evaluate for XPath selectors
					const result = document.evaluate(selector, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
					elements = [];
					for (let i = 0; i < result.snapshotLength; i++) {
						elements.push(result.snapshotItem(i));
					}
				} else {
					// Use querySelectorAll for CSS selectors
					elements = Array.from(document.querySelectorAll(selector));
				}

				// Extract attribute or text content from elements
				return elements.map((el) => {
					if (attribute) {
						return decodeHtmlEntities(el.getAttribute(attribute) || '');
					} else {
						return decodeHtmlEntities(el.textContent.trim());
					}
				});
			},
			{ selector, attribute }
		);
	} catch (error) {
		console.log('\x1b[31m%s\x1b[0m', `Error with selector ${selector} > ${error}`);
		return []; // Return an empty array if there's an error
	}
}

function applyRegexAndGroups(value, regex, groups) {
	const matches = value.match(new RegExp(regex, 'gi'));
	if (!matches) return '';
	return groups && groups.length > 0 ? groups.map((group) => matches[group]).join('') : matches.join('');
}

function replaceValues(value, replacements) {
	replacements.forEach((replacement) => {
		if (replacement.value) {
			value = value.replace(new RegExp(replacement.value, 'gi'), replacement.replaceWith);
		}
	});
	return value.trim();
}

async function elementSelector(page, selectors, attribute, regex, groups, queryAll, valueToReplace) {
	if (!Array.isArray(selectors)) {
		throw new Error('selectors must be an array');
	}
	if (valueToReplace && !Array.isArray(valueToReplace)) {
		throw new Error('valueToReplace must be an array of replacement rules');
	}

	let selectedValues = [];

	for (const selector of selectors) {
		const elements = await mainSelector(page, selector, attribute);

		if (elements.length === 0) {
			//Grey color warn console
			console.log('\x1b[90m%s\x1b[0m', `Error selector "${selector}" returned 0 elements`);
			continue; // Skip to the next selector if no elements are found
		}

		for (const elementValue of elements) {
			let value = regex ? applyRegexAndGroups(elementValue, regex, groups) : elementValue;
			if (valueToReplace) {
				value = replaceValues(value, valueToReplace);
			}
			if (value) selectedValues.push(value);
		}

		if (!queryAll && selectedValues.length) {
			break;
		}
	}

	//console.log('selectedValues', selectedValues);
	return selectedValues;
}

module.exports = { elementSelector };
