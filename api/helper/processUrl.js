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

function processUrl(url, regex, groups, valueToReplace) {
	let value = regex ? applyRegexAndGroups(url, regex, groups) : url;
	if (valueToReplace) {
		value = replaceValues(value, valueToReplace);
	}
	return value;
}

module.exports = { processUrl };
