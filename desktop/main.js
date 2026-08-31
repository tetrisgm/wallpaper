'use strict';
const { app, BrowserWindow, Menu, Tray, nativeImage, screen } = require('electron');
const path = require('path');
let windows=[];
let tray=null;
let nativeBridge=null;
if(process.platform==='darwin'){
  try{nativeBridge=require('../build/Release/rrr_wallpaper.node');}
  catch(error){console.warn('[wallpaper] native desktop bridge unavailable:',error.message);}
}

function createWindow(display){
  const win=new BrowserWindow({
    ...display.bounds, frame:false, show:false, skipTaskbar:true, focusable:false,
    resizable:false, movable:false, minimizable:false, maximizable:false,
    fullscreenable:false, backgroundColor:'#000000', type:'desktop',
    webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,backgroundThrottling:false}
  });
  win.setIgnoreMouseEvents(true);
  win.loadFile(path.join(__dirname,'..','dist','index.html'),{query:{mode:'wallpaper'}});
  win.once('ready-to-show',()=>{
    if(nativeBridge){
      try{nativeBridge.attachWindow(win.getNativeWindowHandle());}
      catch(error){console.error('[wallpaper] could not attach behind desktop icons:',error);}
    }
    win.showInactive();
  });
  return win;
}
function rebuild(){
  for(const win of windows) if(!win.isDestroyed()) win.destroy();
  windows=screen.getAllDisplays().map(createWindow);
}
function makeTray(){
  const image=nativeImage.createEmpty();
  tray=new Tray(image);
  tray.setTitle('▦');
  tray.setToolTip('Wallpaper');
  tray.setContextMenu(Menu.buildFromTemplate([
    {label:'Refresh wallpaper',click:rebuild},
    {type:'separator'},
    {label:'Quit Wallpaper',click:()=>app.quit()}
  ]));
}
app.whenReady().then(()=>{rebuild();makeTray();screen.on('display-added',rebuild);screen.on('display-removed',rebuild);});
app.on('window-all-closed',event=>event.preventDefault());
