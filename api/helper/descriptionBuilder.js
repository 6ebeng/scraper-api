const { htmlSelector } = require('./htmlSelector');
const { elementSelector } = require('./selector');

// Function to handle the concatenation of descriptions
function concatenateDescriptions(descriptions, isHTML = false) {
	const separator = isHTML ? '</br></br>' : '';
	return descriptions.join('</br>') + separator;
}

// Function to create an HTML list from an array
function createList(items) {
	const listItems = items.map((item) => `<li>${item}</li>`).join('');
	return `<ul>${listItems}</ul></br>`;
}

// Function to create an HTML table from an array
// Function to create an HTML table from an array with specific row logic
function createTable(items, numberOfCol = 5, hasTableHeader = false) {
	numberOfCol = numberOfCol || 5; // Ensure numberOfCol is set

	const createRow = (rowData, isHeader = false) => {
		const tag = isHeader ? 'th' : 'td';
		return `<tr>${rowData.map((item) => `<${tag}>${item}</${tag}>`).join('')}</tr>`;
	};

	let currentRowData = [];
	let tableRows = items.reduce((acc, item, index) => {
		currentRowData.push(item);

		const isRowEnd = index % numberOfCol === numberOfCol - 1 || index === items.length - 1;
		if (isRowEnd) {
			// If hasTableHeader is true and this is the first row, create a header row
			const isHeaderRow = hasTableHeader && acc.length === 0;
			acc.push(createRow(currentRowData, isHeaderRow));
			currentRowData = []; // Reset for the next row
		}

		return acc;
	}, []);

	return `<table><tbody>${tableRows.join('')}</tbody></table>`;
}

async function processDescriptions(page, data) {
	let tempDescription = '';

	// Process normal descriptions
	let descriptions = [];
	if (data.descriptions.selectors.length) {
		if (data.descriptions.isHTML) {
			descriptions = await htmlSelector(page, data.descriptions.selectors, true, data.descriptions.valueToReplace);
		} else {
			descriptions = await elementSelector(
				page,
				data.descriptions.selectors,
				data.descriptions.attribute,
				data.descriptions.regex,
				data.descriptions.groups,
				true,
				data.descriptions.valueToReplace
			);
		}
	}

	// Process HTML descriptions
	let tableDescriptions = [];
	if (data.descriptions.selectors.length) {
		tableDescriptions = await elementSelector(
			page,
			data.tableDescriptions.selectors,
			data.tableDescriptions.attribute,
			data.tableDescriptions.regex,
			data.tableDescriptions.groups,
			true,
			data.tableDescriptions.valueToReplace
		);
	}

	// Combine descriptions
	if (descriptions.length) {
		tempDescription +=
			descriptions.length > 2
				? createList(descriptions)
				: concatenateDescriptions(descriptions, tableDescriptions.length > 0);
	}

	// Append HTML descriptions in a table
	if (tableDescriptions.length) {
		tempDescription += createTable(
			tableDescriptions,
			data.tableDescriptions.numberOfCol,
			data.tableDescriptions.hasTableHeader
		);
	}

	return tempDescription;
}

module.exports = { processDescriptions };
