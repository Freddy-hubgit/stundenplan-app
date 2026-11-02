const path = require('path');
const { fileURLToPath } = require('url');

function trustedFrame(event, win, localIndex) {
  if (!win || event.sender !== win.webContents || event.senderFrame !== win.webContents.mainFrame) return false;
  try {
    const url = new URL(event.senderFrame.url);
    if (url.protocol === 'file:') return path.resolve(fileURLToPath(url)) === path.resolve(localIndex);
    return url.protocol === 'https:' && url.hostname.toLowerCase() === 'freddy-hubgit.github.io' &&
      (url.pathname === '/stundenplan-11bguti' || url.pathname.startsWith('/stundenplan-11bguti/'));
  } catch { return false; }
}

function installNativeNotifications({ app, ipcMain, Notification, Tray, Menu, nativeImage, getWindow, localIndex }) {
  let context = { userId: null, homework: false, alerts: false }, tray = null;
  const active = new Map();
  const supported = () => Notification.isSupported();
  const enabled = () => !!context.userId && (context.homework || context.alerts) && supported();
  function open(pathname) {
    const win = getWindow(); if (!win || win.isDestroyed()) return;
    if (win.isMinimized()) win.restore(); win.show(); win.focus();
    if (pathname) win.webContents.send('stundenplan:notification-open', pathname);
  }
  function closeObsolete() {
    for (const [toast, item] of active) if (item.userId !== context.userId || !context[item.category]) { toast.close(); active.delete(toast); }
  }
  function updateTray() {
    if (enabled() && !tray) {
      const icon = nativeImage.createFromPath(path.join(__dirname, 'tray.png'));
      tray = new Tray(icon); tray.setToolTip('Schulportal – Benachrichtigungen aktiv');
      tray.setContextMenu(Menu.buildFromTemplate([
        { label: 'Schulportal öffnen', click: () => open() },
        { label: 'Benachrichtigungen laufen im Hintergrund', enabled: false },
        { type: 'separator' }, { label: 'Vollständig beenden', click: () => app.quit() }
      ])); tray.on('click', () => open());
    } else if (!enabled() && tray) { tray.destroy(); tray = null; }
  }
  function handle(channel, callback) {
    ipcMain.handle(channel, async (event, payload) => {
      if (!trustedFrame(event, getWindow(), localIndex)) throw new Error('Nicht erlaubter App-Aufruf.');
      return callback(payload);
    });
  }
  handle('stundenplan:notifications-status', () => ({ supported: supported(), background: enabled() }));
  handle('stundenplan:notifications-context', payload => {
    if (!payload || (payload.userId !== null && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.userId)) || typeof payload.homework !== 'boolean' || typeof payload.alerts !== 'boolean') throw new Error('Ungültige Benachrichtigungseinstellung.');
    context = { userId: payload.userId, homework: payload.userId && payload.homework, alerts: payload.userId && payload.alerts };
    closeObsolete(); updateTray();const win=getWindow();if(!enabled()&&win&&!win.isVisible())open();return { supported: supported(), background: enabled() };
  });
  handle('stundenplan:notifications-show', payload => {
    if (!payload || payload.userId !== context.userId || !context.userId || !['homework', 'alerts'].includes(payload.category) || !context[payload.category] || !supported()) return { ok: false, error: 'Benachrichtigungen sind für dieses Konto nicht aktiviert.' };
    if (typeof payload.title !== 'string' || typeof payload.body !== 'string' || !['/hausaufgaben', '/meldungen'].includes(payload.path)) throw new Error('Ungültige Benachrichtigung.');
    return new Promise(resolve => {
      const toast = new Notification({ title: payload.title.slice(0, 160), body: payload.body.slice(0, 1200), silent: false });
      let settled = false;
      const timer = setTimeout(() => finish({ ok: false, error: 'Windows hat die Benachrichtigung nicht bestätigt. Bitte die Windows-Benachrichtigungseinstellungen prüfen.' }), 8000);
      function finish(result) { if (!settled) { settled = true; clearTimeout(timer); resolve(result); } }
      active.set(toast, { userId: payload.userId, category: payload.category });
      toast.on('show', () => {
        if (context.userId !== payload.userId || !context[payload.category]) { toast.close(); finish({ ok: false }); }
        else finish({ ok: true });
      });
      toast.on('failed', () => { active.delete(toast); finish({ ok: false, error: 'Windows konnte keine Benachrichtigung anzeigen. Bitte Benachrichtigungen für Schulportal erlauben.' }); });
      toast.on('close', () => active.delete(toast));
      toast.on('click', () => { if (context.userId === payload.userId && context[payload.category]) open(payload.path); });
      try { toast.show(); } catch { active.delete(toast); finish({ ok: false, error: 'Windows-Benachrichtigung konnte nicht angezeigt werden.' }); }
    });
  });
  app.on('before-quit', () => { for (const toast of active.keys()) toast.close(); active.clear(); if (tray) { tray.destroy(); tray = null; } });
  return { keepRunning: enabled };
}
module.exports = { installNativeNotifications, trustedFrame };
