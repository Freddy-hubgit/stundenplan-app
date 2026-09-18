const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("stundenplanDesktop", {
  checkUpdate: () => ipcRenderer.invoke("stundenplan:check-update"),
});
