async function mainSelector(req, page, selector) {
	try {
		return await page.evaluate(
			({ selector }) => {
				// Define cleanHtml function inside page.evaluate
				function cleanHtml(html) {
					const doc = new DOMParser().parseFromString(html, 'text/html');

					// Define an array of tags to remove
					const tagsToRemove = ['button', 'video', 'source', 'style', 'img'];
					// Define an array of tags to exclude
					const excludedTags = ['table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot'];

					// Remove specified tags
					tagsToRemove.forEach((tag) => {
						const elements = doc.querySelectorAll(tag);
						elements.forEach((el) => el.parentNode.removeChild(el));
					});

					// Remove comments
					const allNodes = doc.body.childNodes;
					for (let i = allNodes.length - 1; i >= 0; i--) {
						if (allNodes[i].nodeType === 8) {
							// Node type 8 is for comments
							allNodes[i].parentNode.removeChild(allNodes[i]);
						}
					}

					const allElements = doc.querySelectorAll('*');
					for (let el of allElements) {
						// if (!excludedTags.includes(el.tagName.toLowerCase())) {
						// 	while (el.attributes.length > 0) el.removeAttribute(el.attributes[0].name);
						// }

						// Remove all attributes except for table-related elements
						while (el.attributes.length > 0) el.removeAttribute(el.attributes[0].name);

						// Remove empty elements except for table-related elements
						if (el.innerHTML.trim() === '' && !excludedTags.includes(el.tagName.toLowerCase())) {
							el.parentNode.removeChild(el);
						}
					}

					// Get the HTML as a string and remove tabs, line breaks, and new lines
					let cleanedHtml = doc.body.innerHTML;
					cleanedHtml = cleanedHtml.replace(/[\t\n\r]+/g, ' ');

					return cleanedHtml; // Return the cleaned HTML
				}

				const isXPathSelector = selector.startsWith('//') || selector.startsWith('(//') || selector.startsWith('((//');
				let elements;
				if (isXPathSelector) {
					const result = document.evaluate(selector, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
					elements = [];
					for (let i = 0; i < result.snapshotLength; i++) {
						elements.push(result.snapshotItem(i));
					}
				} else {
					elements = Array.from(document.querySelectorAll(selector));
				}

				return elements.map((el) => cleanHtml(el.outerHTML)).filter((html) => html.trim() !== '');
			},
			{ selector }
		);
	} catch (error) {
		req.logger.log('\x1b[31m%s\x1b[0m', `Error with selector ${selector} > ${error}`);
		return [];
	}
}

function replaceValues(value, replacements) {
	replacements.forEach((replacement) => {
		if (replacement.value) {
			value = value.replace(new RegExp(replacement.value, 'gi'), replacement.replaceWith);
		}
	});
	return value.trim();
}

async function htmlSelector(req, page, selectors, queryAll, valueToReplace) {
	if (!Array.isArray(selectors)) {
		throw new Error('selectors must be an array');
	}
	if (valueToReplace && !Array.isArray(valueToReplace)) {
		throw new Error('valueToReplace must be an array of replacement rules');
	}

	let selectedValues = [];

	for (const selector of selectors) {
		const elements = await mainSelector(req, page, selector);

		if (elements.length === 0) {
			req.logger.log('\x1b[90m%s\x1b[0m', `Error selector "${selector}" returned 0 elements`);
			continue;
		}

		for (const elementValue of elements) {
			let value = elementValue;
			if (valueToReplace) {
				value = replaceValues(value, valueToReplace);
			}
			if (value) selectedValues.push(value);
		}

		if (!queryAll && selectedValues.length) {
			break;
		}
	}

	return selectedValues;
}

module.exports = { htmlSelector };
