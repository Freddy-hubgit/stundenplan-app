const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const commit = 'b'.repeat(40);
async function scenario({ offline = false, navigationFails = false, background = false } = {}) {
  const handlers = {}, windows = [], ready = [], appEvents = {};
  let remoteFails = offline, loadFails = navigationFails;
  class BrowserWindow {
    constructor() {
      this.events={};this.hidden=false;windows.push(this); this.url = ''; this.files = 0; this.loads = 0;
      this.webContents = { on: () => {}, getURL: () => this.url, setWindowOpenHandler: () => {} };
    }
    async loadURL(url) { this.loads++; this.url = url; if (loadFails) throw Error('navigation failed'); }
    async loadFile() { this.files++; this.url = 'file:///local/index.html'; }
    hide() {this.hidden=true;}
    on(name,fn) {this.events[name]=fn;}
  }
  const ctx = { require: name => {
    if (name === 'electron') return {
      app: { getVersion:()=> '1.1.1', setAppUserModelId: () => {}, requestSingleInstanceLock: () => true, whenReady: () => ({ then: fn => ready.push(fn) }), on: (name,fn) => {appEvents[name]=fn;} },
      BrowserWindow, shell: {}, ipcMain: { handle: (name, fn) => { handlers[name] = fn; } }
    };
    if (name === './program-updater') return { installProgramUpdater: () => ({}) };
    if (name === 'electron-updater') return { autoUpdater: {} };
    if (name === './native-notifications') return { trustedFrame:()=>true, installNativeNotifications: () => ({keepRunning:()=>background}) };
    if (name === './web-update') return {
      getRemoteCommit: async () => { if (remoteFails) throw Error('offline'); return commit; },
      liveUrl: sha => 'https://example.test/?v=' + sha, POLL_MS: 300000
    };
    return require(name);
  }, __dirname: '/app/electron', process, setInterval: () => 1, clearInterval: () => {} };
  vm.runInNewContext(fs.readFileSync('electron/main.js', 'utf8'), ctx);
  ready[0]();
  await new Promise(resolve => setImmediate(resolve));
  return { window: windows[0], appVersion:()=>handlers['stundenplan:app-version']({}), check: options => handlers['stundenplan:check-update']({}, options),
    recover: () => { remoteFails = false; loadFails = false; }, close:()=>{let prevented=false;windows[0].events.close({preventDefault:()=>prevented=true});return prevented;},quit:()=>appEvents['before-quit']() };
}
(async () => {
  const offline = await scenario({ offline: true });
  assert.equal(offline.window.files, 1);assert.equal(offline.appVersion(),'1.1.1');
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
  const backgroundApp=await scenario({background:true});assert(backgroundApp.close());assert(backgroundApp.window.hidden);backgroundApp.quit();assert(!backgroundApp.close());const normal=await scenario();assert(!normal.close());
  console.log('PASS desktop updates: offline fallback, check without navigation, failed-load recovery, truthful version state');
})().catch(error => { console.error(error); process.exitCode = 1; });
