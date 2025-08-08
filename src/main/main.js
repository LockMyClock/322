const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const api = require("./apiClient");

let win;

function createWin(file) {
  const w = new BrowserWindow({
    width: 1100, height: 720, minWidth: 900, minHeight: 600, show: true,
    autoHideMenuBar: true, backgroundColor: "#0b1220",
    webPreferences: { contextIsolation: true, preload: path.join(__dirname, "preload.js") }
  });
  const target = path.join(__dirname, "..", "renderer", file);
  console.log("[main] loadFile ->", target);
  w.loadFile(target);
  w.webContents.on("did-finish-load", () => console.log("[main] did-finish-load:", file));
  w.webContents.on("did-fail-load", (_e, code, desc) => console.error("[main] did-fail-load:", code, desc));
  return w;
}
function open(file) { if (win) win.close(); win = createWin(file); }

app.whenReady().then(async () => {
  open("login.html");
  try {
    const ok = await api.refreshIfPossible();
    if (ok) {
      await api.me();
      open("role-gate.html"); // при автологине тоже спрашиваем роль
    }
  } catch (e) { console.error("auto-refresh error", e); }
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

// Auth
ipcMain.handle("auth:register", (_e, dto) => api.register(dto));
ipcMain.handle("auth:isVerified", (_e, id) => api.isVerified(id));
ipcMain.handle("auth:login", async (_e, dto) => {
  await api.login(dto);
  open("role-gate.html"); // после логина переходим к выбору роли
  return { ok: true };
});
ipcMain.handle("auth:me", () => api.me());
ipcMain.handle("auth:logout", async () => { await api.logout(); open("login.html"); return { ok: true }; });

// Role code check
const ADMIN_CODE = "1234567890";
const OPERATOR_CODE = "123456789";
ipcMain.handle("role:check", async (_e, { role, code }) => {
  const c = String(code || "").trim();
  if (role === "admin") {
    if (c === ADMIN_CODE) { open("admin.html"); return { ok: true, role }; }
    return { ok: false, error: "Неверный код для администратора" };
  }
  if (role === "operator") {
    if (c === OPERATOR_CODE) { open("operator.html"); return { ok: true, role }; }
    return { ok: false, error: "Неверный код для оператора" };
  }
  return { ok: false, error: "Неизвестная роль" };
});