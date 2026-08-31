'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('WallpaperNative', {
  isDesktop:true,
  onPerformance(callback){
    const listener=(_event,state)=>callback(state);
    ipcRenderer.on('wallpaper:performance',listener);
    return ()=>ipcRenderer.removeListener('wallpaper:performance',listener);
  }
});
