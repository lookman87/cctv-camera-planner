const {app,BrowserWindow,Menu,shell,session,ipcMain}=require('electron');
const {execFile}=require('child_process');
const path=require('path');
function create(){
  const w=new BrowserWindow({width:1500,height:920,backgroundColor:'#1c1f23',title:'CCTV Camera Planner',icon:path.join(__dirname,'build','icon.png'),webPreferences:{contextIsolation:true,sandbox:true,preload:path.join(__dirname,'preload.js')}});
  Menu.setApplicationMenu(null);
  w.setMenuBarVisibility(false);
  w.loadFile(path.join(__dirname,'index.html'));
  w.webContents.setWindowOpenHandler(({url})=>{shell.openExternal(url);return{action:'deny'}});
  w.webContents.on('will-navigate',(e,url)=>{if(!url.startsWith('file:')){e.preventDefault();shell.openExternal(url)}});
}
app.whenReady().then(()=>{
  session.defaultSession.setPermissionRequestHandler((wc,perm,cb)=>cb(['fullscreen','clipboard-sanitized-write','clipboard-read','fileSystem'].includes(perm)));
  create();
  app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)create()});
});
app.on('window-all-closed',()=>app.quit());

const PS=`$ErrorActionPreference='Stop';try{Add-Type -AssemblyName System.Device;$w=New-Object System.Device.Location.GeoCoordinateWatcher([System.Device.Location.GeoPositionAccuracy]::High);[void]$w.TryStart($false,[TimeSpan]::FromSeconds(12));for($i=0;$i -lt 24 -and $w.Status -ne 'Ready';$i++){Start-Sleep -Milliseconds 500};$l=$w.Position.Location;if($l.IsUnknown){'ERR'}else{[string]::Format([Globalization.CultureInfo]::InvariantCulture,'{0},{1},{2}',$l.Latitude,$l.Longitude,$l.HorizontalAccuracy)};$w.Stop()}catch{'ERR'}`;
ipcMain.handle('geo',()=>new Promise(res=>{
  if(process.platform!=='win32')return res({ok:false});
  execFile('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-Command',PS],{timeout:20000,windowsHide:true},(err,out)=>{
    if(err||!out)return res({ok:false});
    const p=String(out).trim().split(',').map(Number);
    if(p.length<2||p.some(isNaN)||(p[0]===0&&p[1]===0))return res({ok:false});
    res({ok:true,lat:p[0],lng:p[1],acc:p[2]>0?p[2]:100});
  });
}));
