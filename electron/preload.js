const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("stundenplanDesktop", {
  checkUpdate: (options) => ipcRenderer.invoke("stundenplan:check-update", options),
});
