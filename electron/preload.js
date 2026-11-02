const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("stundenplanDesktop", {
  programUpdater: { version: 1, status: () => ipcRenderer.invoke('stundenplan:program-status'), check: () => ipcRenderer.invoke('stundenplan:program-check'), download: () => ipcRenderer.invoke('stundenplan:program-download'), install: () => ipcRenderer.invoke('stundenplan:program-install') },
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
  getAppVersion: () => ipcRenderer.invoke('stundenplan:app-version'),
  checkUpdate: (options) => ipcRenderer.invoke("stundenplan:check-update", options),
});
