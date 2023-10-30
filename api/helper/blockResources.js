async function blockResources(page, data) {
  page.on("request", async (request) => {
    var resourceType;
    var url = true;
    for (let index = 0; index < data.blockResourceTypes.length; index++) {
      if (request.resourceType() === data.blockResourceTypes[index])
        resourceType = true;
    }
    if (!resourceType) {
      for (let index = 0; index < data.whiteListUrls.length; index++) {
        if (request.url().includes(data.whiteListUrls[index])) url = null;
      }
    }
    if (!url) {
      for (let index = 0; index < data.blockUrls.length; index++) {
        if (request.url().includes(data.blockUrls[index])) url = true;
      }
    }
    if (resourceType || url) {
      if (url) {
        //console.log(request.resourceType());
        if (data.debug) console.log("\x1b[31m%s\x1b[0m", request.url());
      }

      request.abort();
    } else {
      //console.log(request.resourceType());
      if (data.debug)
        console.log("\x1b[32m%s\x1b[0m", '"' + request.url() + '",');
      request.continue();
    }
  });
}

module.exports = { blockResources };
