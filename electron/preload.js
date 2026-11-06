const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('nativeGeo',()=>ipcRenderer.invoke('geo'));
