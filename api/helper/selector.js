async function mainSelector(page, selector, attribute) {
  if (selector.startsWith("//") || selector.startsWith("(//")) {
    if (attribute) {
      return await page.evaluate(
        async ({ selector, attribute }) => {
          return Array.from(
            (function () {
              var arr = [];
              var results = document.evaluate(
                selector,
                document,
                null,
                XPathResult.ORDERED_NODE_ITERATOR_TYPE,
                null
              );
              while ((node = results.iterateNext())) {
                arr.push(node);
              }
              return arr;
            })()
          ).map((el) =>
            el
              .getAttribute(attribute)
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&39;/g, "'")
              .replace(/&amp;/g, "&")
              .replace(/\n/g, "")
              .trim()
          );
        },
        { selector, attribute }
      );
    } else {
      return await page.evaluate(async (selector) => {
        return Array.from(
          (function () {
            var arr = [];
            var results = document.evaluate(
              selector,
              document,
              null,
              XPathResult.ORDERED_NODE_ITERATOR_TYPE,
              null
            );
            while ((node = results.iterateNext())) {
              arr.push(node);
            }
            return arr;
          })()
        ).map((el) =>
          el.textContent
            .replace(/(\r\n|\n|\r)/gm, "")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&39;/g, "'")
            .replace(/&amp;/g, "&")
            .replace(/\n/g, "")
            .trim()
        );
      }, selector);
    }
  } else {
    if (attribute) {
      return await page.evaluate(
        ({ selector, attribute }) => {
          return Array.from(document.querySelectorAll(selector)).map((el) =>
            el
              .getAttribute(attribute)
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&39;/g, "'")
              .replace(/&amp;/g, "&")
              .replace(/\n/g, "")
              .trim()
          );
        },
        { selector, attribute }
      );
    } else {
      return await page.evaluate((selector) => {
        return Array.from(document.querySelectorAll(selector)).map((el) =>
          el.textContent
            .replace(/(\r\n|\n|\r)/gm, "")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&39;/g, "'")
            .replace(/&amp;/g, "&")
            .replace(/\n/g, "")
            .trim()
        );
      }, selector);
    }
  }
}

async function elementSelector(
  page,
  selector,
  attribute,
  regex,
  groups,
  queryAll
) {
  if (!queryAll) {
    if (regex) {
      if (groups.length > 0) {
        // if we have groups
        var arr = [];
        const tmpSelector = await mainSelector(page, selector, attribute);
        for (let index = 0; index < groups.length; index++) {
          arr.push(tmpSelector[0].match(regex)[groups[index]]);
        }
        return arr.join("");
      } else {
        //if we have only regex
        const tmpSelector = await mainSelector(page, selector, attribute);
        var regx = tmpSelector[0].match(regex);
        return regx.join("");
      }
    } else {
      const tmpSelector = await mainSelector(page, selector, attribute);
      return tmpSelector[0]; //return the first array
    }
  } else {
    if (regex) {
      // if we have groups
      if (groups.length > 0)
        return Array.from(await mainSelector(page, selector, attribute)).map(
          (item) =>
            Array.from(groups)
              .map((group) => item.match(new RegExp(regex, "gi"))[group])
              .join("")
        );
      //if we have only regex
      else
        return Array.from(await mainSelector(page, selector, attribute)).map(
          (item) => item.match(new RegExp(regex, "gi")).join("")
        );
    } else {
      return await mainSelector(page, selector, attribute);
    }
  }
}

module.exports = elementSelector;
