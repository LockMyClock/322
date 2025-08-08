const fs = require("fs");
const path = require("path");
const { app } = require("electron");

function getPaths() {
  const dir = app.getPath("userData"); // напр. C:\Users\<User>\AppData\Roaming\RoleLoginApp
  return {
    dir,
    session: path.join(dir, "session.json"),
    prefs: path.join(dir, "prefs.json"),
    users: path.join(dir, "users.json"),
    db: path.join(dir, "users.db"),
  };
}

function readJSON(file, def) {
  try { return JSON.parse(fs.readFileSync(file, "utf-8")); }
  catch { return def; }
}
function writeJSON(file, data) {
  fs.mkdirSync(require("path").dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

module.exports = { getPaths, readJSON, writeJSON };