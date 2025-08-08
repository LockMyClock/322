const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  login: (username, password, role) =>
    ipcRenderer.invoke("auth:login", { username, password, role }),
  logout: () => ipcRenderer.invoke("auth:logout"),
});