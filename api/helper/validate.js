const fs = require("fs");
const { check } = require("express-validator");

function validate(method) {
  switch (method) {
    case "search":
      {
        return [
          check("Url").notEmpty().withMessage("Url field is required").trim(),
        ];
      }
      break;
  }
}

async function isValidStore(store) {
  if (
    Array.from(fs.readdirSync("./../models/data"))
      .map((e) => e.replace(".json", ""))
      .includes(store)
  )
    return true;
  else return false;
}

module.exports = { validate, isValidStore };
