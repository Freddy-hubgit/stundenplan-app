const { app, BrowserWindow, shell, ipcMain, Notification, Tray, Menu, nativeImage } = require("electron");
const path = require("path");
const { installNativeNotifications } = require("./native-notifications");
const { getRemoteCommit, liveUrl, POLL_MS } = require("./web-update");

let mainWindow = null;
let nativeNotifications = null;
let quitting = false;
if (process.platform === "win32") app.setAppUserModelId("de.freddy.stundenplan11bguti");
const primaryInstance = app.requestSingleInstanceLock();
if (!primaryInstance) app.quit();
app.on("before-quit", () => { quitting = true; });
app.on("second-instance", () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.show(); mainWindow.focus(); } });
let appliedCommit = null;
let pollTimer = null;

function localIndex() {
  return path.join(__dirname, "..", "dist", "demo", "index.html");
}

async function loadBestContent(win, forceReload) {
  try {
    const commit = await getRemoteCommit();
    if (commit && (forceReload || commit !== appliedCommit)) {
      await win.loadURL(liveUrl(commit));
      appliedCommit = commit;
      return;
    }
  } catch (error) {
    if (forceReload) throw error;
    if (!appliedCommit) await win.loadFile(localIndex());
    return;
  }

  if (!win.webContents.getURL()) {
    await win.loadFile(localIndex());
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 420,
    minHeight: 640,
    backgroundColor: "#0A0D12",
    title: "Stundenplan 11BGUTI",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  mainWindow = win;
  appliedCommit = null;
  void loadBestContent(win);

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.on("close", event => { if (!quitting && nativeNotifications?.keepRunning()) { event.preventDefault(); win.hide(); } });

  win.on("closed", () => {
    if (mainWindow === win) mainWindow = null;
  });
}

ipcMain.handle("stundenplan:check-update", async (_event, options) => {
  if (!mainWindow) return { error: "Kein App-Fenster geöffnet." };
  try {
    if (options && options.checkOnly) {
      const commit = await getRemoteCommit();
      return { available: commit !== appliedCommit, commit };
    }
    const before = appliedCommit;
    await loadBestContent(mainWindow, true);
    return { updated: !!(appliedCommit && appliedCommit !== before), commit: appliedCommit };
  } catch (_) {
    return { error: "Update konnte nicht geladen werden." };
  }
});

if (primaryInstance) app.whenReady().then(() => {
  nativeNotifications = installNativeNotifications({ app, ipcMain, Notification, Tray, Menu, nativeImage, getWindow: () => mainWindow, localIndex: localIndex() });
  createWindow();
  pollTimer = setInterval(() => {
    if (mainWindow) loadBestContent(mainWindow);
  }, POLL_MS);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
  });
});

app.on("window-all-closed", () => {
  if (pollTimer) clearInterval(pollTimer);
  if (process.platform !== "darwin" && !quitting) app.quit();
});
