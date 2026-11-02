const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const commit = 'b'.repeat(40);
async function scenario({ offline = false, navigationFails = false } = {}) {
  const handlers = {}, windows = [], ready = [];
  let remoteFails = offline, loadFails = navigationFails;
  class BrowserWindow {
    constructor() {
      windows.push(this); this.url = ''; this.files = 0; this.loads = 0;
      this.webContents = { getURL: () => this.url, setWindowOpenHandler: () => {} };
    }
    async loadURL(url) { this.loads++; this.url = url; if (loadFails) throw Error('navigation failed'); }
    async loadFile() { this.files++; this.url = 'file:///local/index.html'; }
    on() {}
  }
  const ctx = { require: name => {
    if (name === 'electron') return {
      app: { whenReady: () => ({ then: fn => ready.push(fn) }), on: () => {} },
      BrowserWindow, shell: {}, ipcMain: { handle: (name, fn) => { handlers[name] = fn; } }
    };
    if (name === './web-update') return {
      getRemoteCommit: async () => { if (remoteFails) throw Error('offline'); return commit; },
      liveUrl: sha => 'https://example.test/?v=' + sha, POLL_MS: 300000
    };
    return require(name);
  }, __dirname: '/app/electron', process, setInterval: () => 1, clearInterval: () => {} };
  vm.runInNewContext(fs.readFileSync('electron/main.js', 'utf8'), ctx);
  ready[0]();
  await new Promise(resolve => setImmediate(resolve));
  return { window: windows[0], check: options => handlers['stundenplan:check-update']({}, options),
    recover: () => { remoteFails = false; loadFails = false; } };
}
(async () => {
  const offline = await scenario({ offline: true });
  assert.equal(offline.window.files, 1);
  assert.ok((await offline.check({ checkOnly: true })).error);
  offline.recover();
  assert.equal((await offline.check({ checkOnly: true })).available, true);
  assert.equal(offline.window.loads, 0, 'check must not load');
  assert.equal((await offline.check()).updated, true);
  assert.equal((await offline.check({ checkOnly: true })).available, false);
  const failed = await scenario({ navigationFails: true });
  assert.equal(failed.window.files, 1, 'failed remote navigation must fall back to bundled app');
  assert.equal((await failed.check({ checkOnly: true })).available, true, 'failed navigation must not record applied commit');
  assert.ok((await failed.check()).error);
  failed.recover();
  assert.equal((await failed.check()).updated, true, 'retry must apply failed version');
  console.log('PASS desktop updates: offline fallback, check without navigation, failed-load recovery, truthful version state');
})().catch(error => { console.error(error); process.exitCode = 1; });
