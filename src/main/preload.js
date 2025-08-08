const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  auth: {
    register: (dto) => ipcRenderer.invoke("auth:register", dto),
    isVerified: (id) => ipcRenderer.invoke("auth:isVerified", id),
    login: (dto) => ipcRenderer.invoke("auth:login", dto),
    me: () => ipcRenderer.invoke("auth:me"),
    logout: () => ipcRenderer.invoke("auth:logout"),
  },
  role: {
    check: (role, code) => ipcRenderer.invoke("role:check", { role, code })
  }
});