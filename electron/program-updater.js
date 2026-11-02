const { trustedFrame } = require('./native-notifications');

function installProgramUpdater({ app, ipcMain, autoUpdater, dialog, getWindow, localIndex, prepareInstall, platform = process.platform, portable = !!process.env.PORTABLE_EXECUTABLE_FILE }) {
  const supported = platform === 'win32' && app.isPackaged && !portable;
  let state = { supported, phase: 'idle', currentVersion: app.getVersion(), availableVersion: null, percent: 0, message: supported ? '' : 'Für Programmupdates bitte die installierte Windows-Version verwenden. Portable Apps werden manuell ersetzt.' };
  let busy = false, ready = false, rollback = null;
  const snapshot = () => ({ ...state });
  const fail = () => { if (rollback) rollback(); rollback = null; state.phase = ready ? 'downloaded' : 'error'; state.message = 'Programmupdate fehlgeschlagen. Bitte erneut versuchen oder den Installer manuell herunterladen.'; };
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.allowDowngrade = false;
  autoUpdater.allowPrerelease = false;
  autoUpdater.setFeedURL({ provider: 'github', owner: 'Freddy-hubgit', repo: 'stundenplan-app' });
  autoUpdater.on('update-available', info => { state.availableVersion = info.version; state.phase = 'available'; });
  autoUpdater.on('update-not-available', () => { state.phase = 'idle'; state.availableVersion = null; state.message = 'Das Windows-Programm ist aktuell.'; });
  autoUpdater.on('download-progress', progress => { state.phase = 'downloading'; state.percent = Math.max(0, Math.min(100, Math.round(progress.percent || 0))); });
  autoUpdater.on('update-downloaded', info => { ready = true; state.availableVersion = info.version; state.phase = 'downloaded'; state.percent = 100; state.message = 'Update bereit. Vor der Installation bitte Änderungen speichern.'; });
  autoUpdater.on('error', fail);
  async function invoke(action) {
    if (!supported || action === 'status' || busy) return snapshot();
    if (action === 'check' && ready) return snapshot();
    busy = true;
    try {
      state.message = '';
      if (action === 'check') { state.phase = 'checking'; await autoUpdater.checkForUpdates(); }
      if (action === 'download' && !ready && state.availableVersion) { state.phase = 'downloading'; state.percent = 0; await autoUpdater.downloadUpdate(); }
      if (action === 'install' && ready) {
        const result = await dialog.showMessageBox(getWindow(), { type: 'question', title: 'Programmupdate installieren', message: 'Änderungen gespeichert? Die App wird geschlossen und der Installer gestartet.', buttons: ['Abbrechen', 'Jetzt installieren'], defaultId: 0, cancelId: 0, noLink: true });
        if (result.response === 1) { state.phase = 'installing'; rollback = prepareInstall(); autoUpdater.quitAndInstall(false, true); }
      }
    } catch (_) { fail(); }
    finally { busy = false; }
    return snapshot();
  }
  for (const action of ['status', 'check', 'download', 'install']) ipcMain.handle(`stundenplan:program-${action}`, event => {
    if (!trustedFrame(event, getWindow(), localIndex)) throw new Error('Nicht erlaubter App-Aufruf.');
    return invoke(action);
  });
  return { snapshot };
}
module.exports = { installProgramUpdater };
