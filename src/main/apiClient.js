const path = require("path");
const fs = require("fs");
const { app } = require("electron");
const { serverUrl, mock } = require("./appConfig");
const bcrypt = require("bcryptjs");

// keytar (refresh токен в хранилище системы)
let keytar;
try { keytar = require("keytar"); }
catch { keytar = { async setPassword(){}, async getPassword(){ return null; }, async deletePassword(){} }; }

const SERVICE = "RoleLoginApp";
let accessToken = null;
let currentUser = null;
let identifierForKeytar = null;
const delay = (ms) => new Promise(r => setTimeout(r, ms));

// MOCK STORE (файл в AppData)
const mockStoreFile = path.join(app.getPath("userData"), "mock-store.json");
function readMock() {
  try { return JSON.parse(fs.readFileSync(mockStoreFile, "utf-8")); }
  catch {
    return {
      users: [
        { id: 1, email: "admin@example.com", username: "admin", passHash: bcrypt.hashSync("admin", 10), role: "user", email_verified: true }
      ],
      lastId: 1
    };
  }
}
function writeMock(d) {
  fs.mkdirSync(path.dirname(mockStoreFile), { recursive: true });
  fs.writeFileSync(mockStoreFile, JSON.stringify(d, null, 2), "utf-8");
}

// -------- MOCK API --------
async function mockRegister({ email, username, password }) {
  await delay(400);
  const db = readMock();
  const exists = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase());
  if (exists) throw Object.assign(new Error("Email or username already exists"), { data: { error: "Email or username already exists" } });
  const id = ++db.lastId;
  db.users.push({ id, email, username, passHash: bcrypt.hashSync(password, 10), role: "user", email_verified: true });
  writeMock(db);
  return { status: "ok" };
}
async function mockIsVerified() {
  await delay(150);
  return true;
}
async function mockLogin({ identifier, password, remember }) {
  await delay(400);
  const db = readMock();
  const u = db.users.find(x =>
    identifier.includes("@")
      ? x.email.toLowerCase() === identifier.toLowerCase()
      : x.username.toLowerCase() === identifier.toLowerCase()
  );
  if (!u) throw Object.assign(new Error("Invalid credentials"), { data: { error: "Invalid credentials" } });
  if (!bcrypt.compareSync(password, u.passHash)) throw Object.assign(new Error("Invalid credentials"), { data: { error: "Invalid credentials" } });
  accessToken = "MOCK_ACCESS_" + Date.now();
  currentUser = { id: u.id, email: u.email, username: u.username };
  identifierForKeytar = u.username;
  if (remember) await keytar.setPassword(SERVICE, identifierForKeytar, "MOCK_REFRESH_" + Date.now());
  return currentUser;
}
async function mockRefreshIfPossible() {
  if (!identifierForKeytar) return false;
  const r = await keytar.getPassword(SERVICE, identifierForKeytar);
  if (!r) return false;
  const db = readMock();
  const u = db.users.find(x => x.username === identifierForKeytar);
  if (!u) return false;
  accessToken = "MOCK_ACCESS_" + Date.now();
  currentUser = { id: u.id, email: u.email, username: u.username };
  return true;
}
async function mockMe() {
  await delay(120);
  if (!currentUser) throw Object.assign(new Error("No auth"), { data: { error: "No auth" } });
  return currentUser;
}
async function mockLogout() {
  if (identifierForKeytar) await keytar.deletePassword(SERVICE, identifierForKeytar);
  accessToken = null; currentUser = null; identifierForKeytar = null;
}

// -------- REAL API (на будущее) --------
let fetch;
async function http(path, opts = {}) {
  if (!fetch) fetch = require("node-fetch");
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const res = await fetch(`${serverUrl}${path}`, { ...opts, headers });
  if (!res.ok) {
    const txt = await res.text();
    let data; try { data = JSON.parse(txt); } catch { data = { error: txt }; }
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status; err.data = data;
    throw err;
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}
async function realRegister(dto) { return http("/auth/register", { method: "POST", body: JSON.stringify(dto) }); }
async function realIsVerified(id) { const r = await http(`/auth/is-verified?identifier=${encodeURIComponent(id)}`); return r.verified; }
async function realLogin({ identifier, password, remember }) {
  const data = await http("/auth/login", { method: "POST", body: JSON.stringify({ identifier, password }) });
  accessToken = data.accessToken; currentUser = data.user; identifierForKeytar = data.user.username;
  if (remember && data.refreshToken) await keytar.setPassword(SERVICE, identifierForKeytar, data.refreshToken);
  return data.user;
}
async function realRefreshIfPossible() {
  if (!identifierForKeytar) return false;
  const refreshToken = await keytar.getPassword(SERVICE, identifierForKeytar);
  if (!refreshToken) return false;
  try { const data = await http("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) }); accessToken = data.accessToken; currentUser = data.user; return true; }
  catch { return false; }
}
async function realMe() { const m = await http("/me"); currentUser = m; return m; }
async function realLogout() { if (identifierForKeytar) await keytar.deletePassword(SERVICE, identifierForKeytar); accessToken = null; currentUser = null; identifierForKeytar = null; }

// -------- EXPORT --------
module.exports = (mock ? {
  register: mockRegister, isVerified: mockIsVerified, login: mockLogin, refreshIfPossible: mockRefreshIfPossible, me: mockMe, logout: mockLogout, getAccessUser: () => currentUser,
} : {
  register: realRegister, isVerified: realIsVerified, login: realLogin, refreshIfPossible: realRefreshIfPossible, me: realMe, logout: realLogout, getAccessUser: () => currentUser,
});