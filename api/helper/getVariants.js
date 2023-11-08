const { elementSelector } = require('./selector');
const { cleanPrice } = require('./cleanPrice');
const { elementClick } = require('./click');

// Resolve images url
function fixImage(imageUrls) {
	imageUrls.forEach((imageUrl, index) => {
		if (imageUrl) {
			if (!imageUrl.startsWith('https://')) {
				if (imageUrl.startsWith('//')) {
					imageUrls[index] = 'https:' + imageUrl;
				} else {
					imageUrls[index] = 'https://' + imageUrl;
				}
			}
		}
	});
	return imageUrls;
}

// Get Clean price
async function GetCleanPrice(page, data) {
	const price = cleanPrice(
		(
			await elementSelector(
				page,
				data.price.selectors,
				data.price.attribute,
				data.price.regex,
				data.price.groups,
				false,
				data.price.valueToReplace
			)
		)[0] || ''
	);

	// if price not a number and empty
	if (isNaN(price))
		throw (
			(new Error('Price is not a number >' + price),
			console.log('\x1b[31m%s\x1b[0m', 'Price is not a number >' + price))
		);

	if (price === '') throw (new Error('Price is empty'), console.log('\x1b[31m%s\x1b[0m', 'Price is empty'));
	return price;
}

// Get option 1
async function GetOption1(
	page,
	data,
	option3Values,
	option3Id,
	indexOption3Id,
	option2Values,
	option2Id,
	indexOption2Id,
	arrayOptions = []
) {
	// Default values
	var arrayOption1 = arrayOptions;
	var price = '';
	var sku = '';
	var option1Values = [];
	var OutOfStockSTDIndicator = [];
	var quantity = 0;
	var options = [];
	var variantHandle = '';

	// if (data.OutOfStockSTDIndicator.selectors.length > 0) {
	// 	OutOfStockSTDIndicator =
	// 		(await elementSelector(page, data.OutOfStockSTDIndicator.selectors, null, null, null, true, null)) || [];
	// }

	if (!OutOfStockSTDIndicator.length) {
		console.log('hello');
		// Option 1 values
		option1Values = (await elementSelector(
			page,
			data.option1.selectors,
			data.option1.attribute,
			data.option1.regex,
			data.option1.groups,
			true,
			data.option1.valueToReplace || []
		)) || ['STD'];
	}
	// if (data.clickImage.selector.length) {
	// 	// Click on image
	// 	await elementClick(page, data.clickImage.selector, '', 0);
	// }

	// Image srcs
	const imageSrcs = fixImage(
		await elementSelector(
			page,
			data.imageSrc.selectors,
			data.imageSrc.attribute,
			data.imageSrc.regex,
			data.imageSrc.groups,
			true,
			data.imageSrc.valueToReplace
		)
	);

	// if imageSrcs is empty
	if (imageSrcs.length === 0) throw new Error('Images are empty, please check your selector');

	if (!data.clickOption1.selector.length) {
		sku = (
			await elementSelector(
				page,
				data.sku.selectors,
				data.sku.attribute,
				data.sku.regex,
				data.sku.groups,
				false,
				data.sku.valueToReplace
			)
		)[0];

		// Get price
		price = await GetCleanPrice(page, data);

		// Get url after click
		variantHandle = page.url();
	}

	/**************************************************
	 *          Iterate over option 1 values          *
	 **************************************************/

	for (let index = 0; index < option1Values.length || index < imageSrcs.length; index++) {
		// Check if clickOption1 is set
		// if (data.clickOption1.selector.length) {
		// 	// Click on option 1
		// 	await elementClick(page, data.clickOption1.selector, option1Values[index], 0);

		// 	// Get url after click
		// 	variantHandle = page.url();

		// 	// Get price
		// 	price = await GetCleanPrice(page, data);

		// 	sku = await elementSelector(
		// 		page,
		// 		data.sku.selectors,
		// 		data.sku.attribute || null,
		// 		data.sku.regex || null,
		// 		data.sku.groups || [],
		// 		false,
		// 		data.sku.valueToReplace || []
		// 	);
		// }

		// options array to return
		if (option3Id && option2Id) {
			options = [
				{
					option1: data.option1.option1Name,
					value: option1Values[index] || '',
				},
				{
					option2: data.option2.option2Name,
					value: option2Values[indexOption2Id],
				},
				{
					option3: data.option3.option3Name,
					value: option3Values[indexOption3Id],
				},
			];
		}
		if (option2Id) {
			options = [
				{
					option1: data.option1.option1Name,
					value: option1Values[index] || '',
				},
				{
					option2: data.option2.option2Name,
					value: option2Values[indexOption2Id],
				},
			];
		} else {
			options = [
				{
					option1: data.option1.option1Name,
					value: option1Values[index] || '',
				},
			];
		}

		if (data.quantity.selectors.length && option1Values[index]) {
			quantity = (
				await elementSelector(
					page,
					data.quantity.selectors,
					data.quantity.attribute,
					data.quantity.regex,
					data.quantity.groups,
					false
				)
			)[0];
		} else {
			quantity = 5;
		}

		const imageSrc = imageSrcs[index] || '';

		const option = {
			variantId: index + 1,
			variantHandle: variantHandle || '',
			price: price || '',
			sku: sku || '',
			options: options || [],
			quantity: quantity || 0,
			imageSrc: imageSrc || '',
		};

		option ? arrayOption1.push(option) : arrayOption1;
	}
	return arrayOption1;
}

// Get option 2 and option 1
async function GetOption2AndOption1(page, data, option3Values, option3Id, indexOption3Id, arrayOptions = []) {
	let arrayOption2 = arrayOptions;
	// Get option 2 values
	const option2Values =
		(await elementSelector(
			page,
			data.option2.selectors || null,
			data.option2.attribute || null,
			data.option2.regex || null,
			data.option2.groups || [],
			true,
			data.option2.valueToReplace || []
		)) || '';

	// Get option 2 IDs
	const option2IDs =
		(await elementSelector(
			page,
			data.option2Id.selectors || null,
			data.option2Id.attribute || null,
			data.option2Id.regex || null,
			data.option2Id.groups || [],
			true,
			data.option2Id.valueToReplace || []
		)) || '';

	/**************************************************
	 *          Iterate over option 2 IDs             *
	 **************************************************/
	option2IDs.forEach(async (option2Id, indexOption2Id) => {
		if (data.clickOption2.selector.length && indexOption2Id > 0) {
			// Click on option 2
			await elementClick(page, data.clickOption2.selector, option2Id, 0);
		}

		arrayOption2 = await GetOption1(
			page,
			data,
			option3Values,
			option3Id,
			indexOption3Id,
			option2Values,
			option2Id,
			indexOption2Id,
			arrayOption2
		);
	});
	return arrayOption2;
}

// Get option 3 and option 2 and option 1
async function GetOption3AndOption2AndOption1(page, data) {
	let arrayOptions = [];
	// Get option 3 values
	const option3Values =
		(await elementSelector(
			page,
			data.option3.selectors,
			data.option3.attribute || null,
			data.option3.regex || null,
			data.option3.groups || [],
			true,
			data.option3.valueToReplace || []
		)) || '';

	// Get option 3 IDs
	const option3IDs = await elementSelector(
		page,
		data.option3Id.selectors,
		data.option3Id.attribute || null,
		data.option3Id.regex || null,
		data.option3Id.groups || [],
		true,
		data.option3Id.valueToReplace || []
	);

	/**************************************************
	 *          Iterate over option 3 IDs             *
	 **************************************************/
	option3IDs.forEach(async (option3Id, indexOption3Id) => {
		if (data.clickOption3.selector.length && indexOption3Id > 0) {
			// Click on option 3
			await elementClick(page, data.clickOption3.selector, option3Values[indexOption3Id], 0);
		}
		arrayOptions = await GetOption2AndOption1(page, data, option3Values, option3Id, indexOption3Id, arrayOptions);
	});

	return arrayOptions;
}

module.exports = {
	GetOption3AndOption2AndOption1,
	GetOption2AndOption1,
	GetOption1,
};
