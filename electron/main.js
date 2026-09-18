const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");
const { getRemoteCommit, liveUrl, POLL_MS } = require("./web-update");

let mainWindow = null;
let appliedCommit = null;
let pollTimer = null;

function localIndex() {
  return path.join(__dirname, "..", "dist", "demo", "index.html");
}

async function loadBestContent(win, forceReload) {
  try {
    const commit = await getRemoteCommit();
    if (commit && (forceReload || commit !== appliedCommit)) {
      appliedCommit = commit;
      await win.loadURL(liveUrl(commit));
      return;
    }
  } catch (_) {
    /* offline oder GitHub nicht erreichbar → lokale App */
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
    },
  });

  mainWindow = win;
  loadBestContent(win);

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.on("closed", () => {
    if (mainWindow === win) mainWindow = null;
  });
}

ipcMain.handle("stundenplan:check-update", async () => {
  if (!mainWindow) return { updated: false };
  const before = appliedCommit;
  await loadBestContent(mainWindow, true);
  return { updated: !!(appliedCommit && appliedCommit !== before), commit: appliedCommit };
});

app.whenReady().then(() => {
  createWindow();
  pollTimer = setInterval(() => {
    if (mainWindow) loadBestContent(mainWindow);
  }, POLL_MS);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (pollTimer) clearInterval(pollTimer);
  if (process.platform !== "darwin") app.quit();
});
