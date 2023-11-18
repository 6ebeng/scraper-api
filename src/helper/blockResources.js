async function blockResources(page, data) {
  page.on("request", async (request) => {
    var resourceType;
    var url = true;

    // Block resource types
    for (let index = 0; index < data.blockResourceTypes.length; index++) {
      if (request.resourceType() === data.blockResourceTypes[index])
        resourceType = true;
    }
    // Whitelist urls
    if (!resourceType) {
      for (let index = 0; index < data.whiteListUrls.length; index++) {
        if (request.url().includes(data.whiteListUrls[index])) url = null;
      }
    }
    // Block urls
    if (!url) {
      for (let index = 0; index < data.blockUrls.length; index++) {
        if (request.url().includes(data.blockUrls[index])) url = true;
      }
    }
    // Print blocked urls
    if (resourceType || url) {
      if (url) {
        //console.log(request.resourceType());
        if (data.debug) console.log("\x1b[31m%s\x1b[0m", request.url());
      }

      request.abort(); // Abort blocked urls
    } else {
      //console.log(request.resourceType());
      if (data.debug)
        // Print unblocked urls
        console.log("\x1b[32m%s\x1b[0m", '"' + request.url() + '",');
      request.continue(); // Continue unblocked urls
    }
  });
}

module.exports = { blockResources };
