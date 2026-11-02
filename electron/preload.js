const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("stundenplanDesktop", {
  notifications: {
    version: 1,
    status: () => ipcRenderer.invoke('stundenplan:notifications-status'),
    configure: (settings) => ipcRenderer.invoke('stundenplan:notifications-context', settings),
    show: (message) => ipcRenderer.invoke('stundenplan:notifications-show', message),
    onOpen: (listener) => {
      const handler = (_event, route) => { if (['/hausaufgaben', '/meldungen'].includes(route)) listener(route); };
      ipcRenderer.on('stundenplan:notification-open', handler);
      return () => ipcRenderer.removeListener('stundenplan:notification-open', handler);
    }
  },
  checkUpdate: (options) => ipcRenderer.invoke("stundenplan:check-update", options),
});
