async function elementClick(page, selector) {
  if (selector.startsWith("//")) {
    await page.waitForXPath(selector);
    const elements = await page.$x(selector);
    await elements[0].click();
  } else {
    await page.waitForSelector(selector);
    await page.evaluate((selector) => {
      document.querySelector(selector).click();
    }, selector);
    //await page.click(selector)
  }
}

module.exports = { elementClick };
