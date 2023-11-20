const { elementSelector } = require('./selector');
const { cleanPrice } = require('./cleanPrice');
const { elementClick } = require('./click');
const { processUrl } = require('./processUrl');
const { getStoreDomain } = require('./validate');

// Resolve images url
async function fixImage(page, imageUrls, hasDomainPrefix = false, removeParamsFromUrl = false) {
	let domain = hasDomainPrefix ? await getStoreDomain(page.url()) : '';

	return imageUrls.map((imageUrl) => {
		if (!imageUrl) return imageUrl;

		// Check if removeParamsFromUrl is not null and true
		if (removeParamsFromUrl !== null && removeParamsFromUrl) {
			imageUrl = imageUrl.split('?')[0];
		}

		if (!imageUrl.includes(domain)) {
			// Add domain prefix if needed
			if (hasDomainPrefix && !imageUrl.startsWith('http')) {
				imageUrl = imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl;
				return `${domain}${imageUrl}`;
			}
		}

		// Ensure the URL starts with 'https://'
		if (!imageUrl.startsWith('https://')) {
			return imageUrl.startsWith('//') ? 'https:' + imageUrl : 'https://' + imageUrl;
		}

		return imageUrl;
	});
}

// Get Clean price
async function GetCleanPrice(req, page, data) {
	const price = cleanPrice(
		(
			await elementSelector(
				req,
				page,
				data.productConfig.price.selectors,
				data.productConfig.price.attribute,
				data.productConfig.price.regex,
				data.productConfig.price.groups,
				false,
				data.productConfig.price.valueToReplace
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
	req,
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
	if (data.productConfig.option1.selectors.length === 0) return arrayOptions;
	// Default values
	var price = '';
	var sku = '';
	var option1Values = [];
	var OutOfStockSTDIndicator = [];
	var quantity = 0;
	var options = [];
	var variantHandle = '';

	if (data.productConfig.OutOfStockSTDIndicator.selectors.length > 0) {
		OutOfStockSTDIndicator =
			(await elementSelector(
				req,
				page,
				data.productConfig.OutOfStockSTDIndicator.selectors,
				null,
				null,
				null,
				true,
				[]
			)) || [];
	}

	if (OutOfStockSTDIndicator.length === 0) {
		// Option 1 values
		option1Values = await elementSelector(
			req,
			page,
			data.productConfig.option1.selectors,
			data.productConfig.option1.attribute,
			data.productConfig.option1.regex,
			data.productConfig.option1.groups,
			true,
			data.productConfig.option1.valueToReplace
		);

		option1Values.length > 0 && data.productConfig.OutOfStockSTDIndicator.selectors.length === 0
			? (option1Values = ['STD'])
			: option1Values;
	}

	// Click on image
	if (data.productConfig.clickImage.selector !== '')
		await elementClick(req, page, data.productConfig.clickImage.selector, '', data.productConfig.clickImage.delayTime);

	// Image srcs
	const imageSrcs = await fixImage(
		page,
		await elementSelector(
			req,
			page,
			data.productConfig.imageSrc.selectors,
			data.productConfig.imageSrc.attribute,
			data.productConfig.imageSrc.regex,
			data.productConfig.imageSrc.groups,
			true,
			data.productConfig.imageSrc.valueToReplace
		),
		data.productConfig.imageSrc.hasDomainPrefix,
		data.productConfig.imageSrc.removeParamsFromUrl
	);

	// if imageSrcs is empty
	if (imageSrcs.length === 0) throw new Error('Images are empty, please check your selector');

	if (!data.productConfig.clickOption1.selector.length) {
		// get sku from url
		if (data.productConfig.sku.skufromUrl) {
			sku = processUrl(
				await page.url(),
				data.productConfig.sku.regex,
				data.productConfig.sku.groups,
				data.productConfig.sku.valueToReplace
			);
		} else {
			sku = (
				await elementSelector(
					req,
					page,
					data.productConfig.sku.selectors,
					data.productConfig.sku.attribute,
					data.productConfig.sku.regex,
					data.productConfig.sku.groups,
					false,
					data.productConfig.sku.valueToReplace
				)
			)[0];
		}

		// Get price
		price = await GetCleanPrice(req, page, data);

		// Get url after click
		variantHandle = page.url();
	}

	/**************************************************
	 *          Iterate over option 1 values          *
	 **************************************************/

	for (let index = 0; index < option1Values.length || index < imageSrcs.length; index++) {
		// Check if clickOption1 is set
		if (data.productConfig.clickOption1.selector.length) {
			// Click on option 1
			await elementClick(req, page, data.productConfig.clickOption1.selector, option1Values[index], 0);

			// Get url after click
			variantHandle = page.url();

			// Get price
			price = await GetCleanPrice(page, data);

			if (!data.productConfig.sku.skufromUrl) {
				sku = (
					await elementSelector(
						req,
						page,
						data.productConfig.sku.selectors,
						data.productConfig.sku.attribute,
						data.productConfig.sku.regex,
						data.productConfig.sku.groups,
						false,
						data.productConfig.sku.valueToReplace
					)
				)[0];
			}
		}

		// options array to return
		options = [];
		if (option3Id && option2Id) {
			options = [
				{
					option1: data.productConfig.option1.option1Name,
					value: option1Values[index] || '',
				},
				{
					option2: data.productConfig.option2.option2Name,
					value: option2Values[indexOption2Id],
				},
				{
					option3: data.productConfig.option3.option3Name,
					value: option3Values[indexOption3Id],
				},
			];
		}
		if (option2Id) {
			options = [
				{
					option1: data.productConfig.option1.option1Name,
					value: option1Values[index] || '',
				},
				{
					option2: data.productConfig.option2.option2Name,
					value: option2Values[indexOption2Id],
				},
			];
		} else if (option1Values[index]) {
			options = [
				{
					option1: data.productConfig.option1.option1Name,
					value: option1Values[index] || '',
				},
			];
		}

		if (data.productConfig.quantity.selectors.length && option1Values[index]) {
			quantity = (
				await elementSelector(
					req,
					page,
					data.productConfig.quantity.selectors,
					data.productConfig.quantity.attribute,
					data.productConfig.quantity.regex,
					data.productConfig.quantity.groups,
					false
				)
			)[0];
		} else {
			quantity = 5;
		}

		// Get image src
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

		options.length !== 0 && option1Values.length !== 0 ? arrayOptions.push(option) : arrayOptions;
	}
	return arrayOptions;
}

// Get option 2 and option 1
async function GetOption2AndOption1(req, page, data, option3Values, option3Id, indexOption3Id, arrayOptions = []) {
	if (data.productConfig.option2.selectors.length === 0) return arrayOptions;
	// Get option 2 values
	const option2Values =
		(await elementSelector(
			req,
			page,
			data.productConfig.option2.selectors || null,
			data.productConfig.option2.attribute || null,
			data.productConfig.option2.regex || null,
			data.productConfig.option2.groups || [],
			true,
			data.productConfig.option2.valueToReplace || []
		)) || '';

	// Get option 2 IDs
	const option2IDs =
		(await elementSelector(
			req,
			page,
			data.productConfig.option2Id.selectors || null,
			data.productConfig.option2Id.attribute || null,
			data.productConfig.option2Id.regex || null,
			data.productConfig.option2Id.groups || [],
			true,
			data.productConfig.option2Id.valueToReplace || []
		)) || '';

	/**************************************************
	 *          Iterate over option 2 IDs             *
	 **************************************************/
	for (let indexOption2Id = 0; indexOption2Id < option2IDs.length; indexOption2Id++) {
		if (data.productConfig.clickOption2.selector.length && indexOption2Id > 0) {
			// Click on option 2
			await elementClick(req, page, data.productConfig.clickOption2.selector, option2IDs[indexOption2Id], 0);
		}

		arrayOptions = await GetOption1(
			req,
			page,
			data,
			option3Values,
			option3Id,
			indexOption3Id,
			option2Values,
			option2IDs[indexOption2Id],
			indexOption2Id,
			arrayOptions
		);
	}

	return arrayOptions;
}

// Get option 3 and option 2 and option 1
async function GetOption3AndOption2AndOption1(req, page, data) {
	let arrayOptions = [];
	if (data.productConfig.option3.selectors.length === 0) return arrayOptions;
	// Get option 3 values
	const option3Values =
		(await elementSelector(
			req,
			page,
			data.productConfig.option3.selectors,
			data.productConfig.option3.attribute || null,
			data.productConfig.option3.regex || null,
			data.productConfig.option3.groups || [],
			true,
			data.productConfig.option3.valueToReplace || []
		)) || '';

	// Get option 3 IDs
	const option3IDs = await elementSelector(
		req,
		page,
		data.productConfig.option3Id.selectors,
		data.productConfig.option3Id.attribute || null,
		data.productConfig.option3Id.regex || null,
		data.productConfig.option3Id.groups || [],
		true,
		data.productConfig.option3Id.valueToReplace || []
	);

	/**************************************************
	 *          Iterate over option 3 IDs             *
	 **************************************************/

	for (let indexOption3Id = 0; indexOption3Id < option3IDs.length; indexOption3Id++) {
		if (data.productConfig.clickOption3.selector.length && indexOption3Id > 0) {
			// Click on option 3
			await elementClick(page, data.productConfig.clickOption3.selector, option3IDs[indexOption3Id], 0);
		}

		arrayOptions = await GetOption2AndOption1(
			req,
			page,
			data,
			option3Values,
			option3IDs[indexOption3Id],
			indexOption3Id,
			arrayOptions
		);
	}

	return arrayOptions;
}

module.exports = {
	GetOption3AndOption2AndOption1,
	GetOption2AndOption1,
	GetOption1,
};
