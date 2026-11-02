const assert=require('node:assert/strict');const {EventEmitter}=require('node:events');
const {installNativeNotifications,trustedFrame}=require('../electron/native-notifications');
const uid='00000000-0000-0000-0000-000000000001',other='00000000-0000-0000-0000-000000000002';
const handlers={},toasts=[],trays=[],messages=[],app=new EventEmitter();app.quit=()=>app.emit('before-quit');
const frame={url:'https://freddy-hubgit.github.io/stundenplan-11bguti/'};const contents={mainFrame:frame,send:(...args)=>messages.push(args)};
let shown=false;const win={webContents:contents,isDestroyed:()=>false,isMinimized:()=>false,isVisible:()=>shown,restore(){},show(){shown=true;},focus(){}};
class Toast extends EventEmitter{static isSupported(){return true;}constructor(data){super();this.data=data;toasts.push(this);}show(){this.emit('show');}close(){this.closed=true;this.emit('close');}}
class Tray{constructor(){trays.push(this);}setToolTip(){}setContextMenu(menu){this.menu=menu;}on(){}destroy(){this.destroyed=true;}}
const native=installNativeNotifications({app,ipcMain:{handle:(name,fn)=>handlers[name]=fn},Notification:Toast,Tray,Menu:{buildFromTemplate:x=>x},nativeImage:{createFromPath:()=>({})},getWindow:()=>win,localIndex:'/app/index.html'});
const event={sender:contents,senderFrame:frame};const call=(key,value)=>handlers['stundenplan:notifications-'+key](event,value);
(async()=>{
 assert(trustedFrame(event,win,'/app/index.html'));assert(!trustedFrame({...event,senderFrame:{url:frame.url}},win,'/app/index.html'));
 frame.url='https://example.test/';assert(!trustedFrame(event,win,'/app/index.html'));await assert.rejects(()=>call('status'));frame.url='https://freddy-hubgit.github.io/stundenplan-11bguti/';
 assert.equal(native.keepRunning(),false);await call('context',{userId:uid,homework:true,alerts:false});assert(native.keepRunning());assert.equal(trays.length,1);
 const result=await call('show',{userId:uid,category:'homework',title:'Hausaufgaben',body:'1 Aufgabe offen',path:'/hausaufgaben'});assert(result.ok);toasts[0].emit('click');assert.equal(messages[0][1],'/hausaufgaben');assert(shown);
 assert.equal((await call('show',{userId:other,category:'homework',title:'Wrong',body:'x',path:'/hausaufgaben'})).ok,false);
 await assert.rejects(()=>call('show',{userId:uid,category:'homework',title:'Bad',body:'x',path:'file:///secret'}));
 await call('context',{userId:other,homework:false,alerts:true});assert(toasts[0].closed);const oldCount=messages.length;toasts[0].emit('click');assert.equal(messages.length,oldCount);
 await call('context',{userId:null,homework:false,alerts:false});assert(!native.keepRunning());assert(trays[0].destroyed);
 assert(!trustedFrame({sender:contents,senderFrame:frame},{...win,webContents:{}},'/app/index.html'));
 app.quit();console.log('PASS native notifications: origin/main-frame checks, explicit account/category opt-in, tray lifecycle, toast click routes and old-account cleanup');
})().catch(e=>{console.error(e);process.exitCode=1;});
