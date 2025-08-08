const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

class FileUserStore {
  constructor(file) { this.file = file; }

  init() {
    if (!fs.existsSync(this.file)) {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      const users = [
        { username: "admin", role: "admin", passwordHash: bcrypt.hashSync("admin", 10) },
        { username: "operator", role: "operator", passwordHash: bcrypt.hashSync("operator", 10) },
      ];
      fs.writeFileSync(this.file, JSON.stringify(users, null, 2), "utf-8");
    }
  }

  readAll() {
    try { return JSON.parse(fs.readFileSync(this.file, "utf-8")); }
    catch { return []; }
  }

  getUser(username) {
    const u = username?.toLowerCase?.();
    return this.readAll().find(x => x.username.toLowerCase() === u);
  }

  async verify(username, password, role) {
    const u = this.getUser(username);
    if (!u || u.role !== role) return false;
    return bcrypt.compareSync(password, u.passwordHash);
  }

  exists(username) {
    return !!this.getUser(username);
  }
}

class SQLiteUserStore {
  constructor(dbFile) {
    this.dbFile = dbFile;
    this.db = null;
    this.available = false;
  }

  init() {
    let Database;
    try { Database = require("better-sqlite3"); }
    catch { return; } // библиотека не установлена

    fs.mkdirSync(path.dirname(this.dbFile), { recursive: true });
    this.db = new Database(this.dbFile);
    this.available = true;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        password_hash TEXT NOT NULL
      );
    `);

    const count = this.db.prepare(`SELECT COUNT(*) as c FROM users`).get().c;
    if (count === 0) {
      const ins = this.db.prepare(`INSERT INTO users (username, role, password_hash) VALUES (?, ?, ?)`);
      ins.run("admin", "admin", bcrypt.hashSync("admin", 10));
      ins.run("operator", "operator", bcrypt.hashSync("operator", 10));
    }
  }

  getUser(username) {
    if (!this.available) return null;
    return this.db.prepare(`SELECT * FROM users WHERE lower(username)=lower(?)`).get(username);
  }

  async verify(username, password, role) {
    if (!this.available) return false;
    const u = this.getUser(username);
    if (!u || u.role !== role) return false;
    return bcrypt.compareSync(password, u.password_hash);
  }

  exists(username) {
    if (!this.available) return false;
    return !!this.db.prepare(`SELECT 1 FROM users WHERE lower(username)=lower(?)`).get(username);
  }
}

function createUserStore(prefs, paths) {
  if (prefs?.useSQLite) {
    const sqlite = new SQLiteUserStore(paths.db);
    sqlite.init();
    if (sqlite.available) return sqlite;
  }
  const file = new FileUserStore(paths.users);
  file.init();
  return file;
}

module.exports = { createUserStore };