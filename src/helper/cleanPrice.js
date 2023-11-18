//Extract clean price without decimal
function cleanPrice(rawPrice) {
	if (rawPrice) {
		if (rawPrice.includes(',') || rawPrice.includes('.')) {
			rawPrice = rawPrice.match(/[,.\d]+(?=[.,]\d+)/g)[0];
			return rawPrice.replace(/[.,]/g, '');
		} else {
			rawPrice = rawPrice.match(/\d+/g);
			return rawPrice[0];
		}
	} else {
		return '';
	}
}

module.exports = { cleanPrice };
