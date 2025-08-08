const fs = require("fs");
const path = require("path");

function getStrings(lang) {
  const tryLang = (l) => {
    const p = path.join(__dirname, "..", "locales", `${l}.json`);
    try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return null; }
  };
  return tryLang(lang) || tryLang("ru") || {};
}

module.exports = { getStrings };