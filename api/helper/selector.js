async function mainSelector(page, selector, attribute) {
	// Determine if the selector is an XPath selector
	const isXPathSelector = selector.startsWith('//') || selector.startsWith('(//') || selector.startsWith('((//');

	try {
		// Evaluate the content within the page context
		return await page.evaluate(
			({ selector, attribute, isXPathSelector }) => {
				// This function needs to be re-declared inside evaluate because page.evaluate is in the browser context
				const extractContent = (elements, attr) =>
					elements.map((el) =>
						(attr ? el.getAttribute(attr) : el.textContent)
							.replace(/&lt;/g, '<')
							.replace(/&gt;/g, '>')
							.replace(/&quot;/g, '"')
							.replace(/&39;/g, "'")
							.replace(/&amp;/g, '&')
							.replace(/\n/g, '')
							.trim()
					);

				// Collect elements based on selector type
				const elements = isXPathSelector
					? document.evaluate(selector, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
					: document.querySelectorAll(selector);

				// Convert elements to array for XPath or use directly for querySelectorAll
				const nodes = isXPathSelector
					? Array.from({ length: elements.snapshotLength }, (_, index) => elements.snapshotItem(index))
					: Array.from(elements);

				return extractContent(nodes, attribute);
			},
			{ selector, attribute, isXPathSelector }
		);
	} catch (error) {
		console.error('Error in mainSelector:', error);
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

	const applyRegexAndGroups = async (value, regex, groups) => {
		const matches = value.match(new RegExp(regex, 'gi'));
		if (!matches) return '';
		if (groups && groups.length > 0) {
			return groups.map((group) => matches[group]).join('');
		} else {
			return matches.join('');
		}
	};

	const replaceValues = async (value, replacements) => {
		replacements.forEach((replacement) => {
			if (replacement.value) {
				value = value.replace(new RegExp(replacement.value, 'gi'), replacement.replaceWith);
			}
		});
		return value.trim();
	};

	for (const selector of selectors) {
		let elements;

		elements = (await mainSelector(page, selector, attribute, queryAll)) || [];

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

	return arrSelector;
}

// Ensure mainSelector is defined or imported in the scope

module.exports = { elementSelector };
