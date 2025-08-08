const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let mainWindow;

const USERS = {
  admin: { password: "admin", role: "admin" },
  operator: { password: "operator", role: "operator" },
};

function createWindow(htmlFile) {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#0b1220",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.once("ready-to-show", () => win.show());
  win.loadFile(path.join(__dirname, "renderer", htmlFile));

  return win;
}

function openLogin() {
  if (mainWindow) mainWindow.close();
  mainWindow = createWindow("login.html");
}

app.whenReady().then(() => {
  openLogin();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) openLogin();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("auth:login", (_event, { username, password, role }) => {
  const rec = USERS[username?.toLowerCase()];
  if (rec && rec.password === password && rec.role === role) {
    if (mainWindow) mainWindow.close();
    const target = role === "admin" ? "admin.html" : "operator.html";
    mainWindow = createWindow(target);
    return { ok: true, role };
  }
  return { ok: false, message: "Неверные данные или роль" };
});

ipcMain.handle("auth:logout", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
  openLogin();
  return { ok: true };
});