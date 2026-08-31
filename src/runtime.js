'use strict';

const cv=document.getElementById('stage');
const g=cv.getContext('2d',{alpha:false});
let W=0,H=0,DPR=1,pxBase=4;
let shake=0,flash=0,shock=0,shockColor='#fff',flashColor='255,255,255';
const PAL=['#f878f8','#f87858','#fca044','#f8d878','#b8f818','#58f898','#58d854','#00e8d8','#6888fc','#9878f8','#f8b8f8','#a80020','#0000fc','#007800','#00a800','#e40058','#f83800','#fc7460','#bcbcbc','#fcfcfc'];
const palColor=index=>PAL[((index%PAL.length)+PAL.length)%PAL.length];
const rrect=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};

const WALLPAPER_KEYS=['hover','blast','bricks','trooper','climber','racer','crossing','squadron','vortex','platformer','maze','pyramid','blocks','dungeon'];
let wallpaperIndex=0;
let wallpaperGame=null;
let wallpaperState=null;
let wallpaperVariant=0;
let wallpaperPaused=false;
let wallpaperLast=performance.now();
let wallpaperStarted=performance.now();
let wallpaperSceneAt=performance.now();
let wallpaperRotateSeconds=30;
let wallpaperFps=60;
let wallpaperTickAt=0;

function wallpaperResize(){
  W=innerWidth; H=innerHeight;
  const raw=devicePixelRatio||1;
  DPR=Math.max(1,Math.min(2,raw,Math.sqrt(3200000/Math.max(1,W*H))));
  cv.width=Math.floor(W*DPR); cv.height=Math.floor(H*DPR);
  cv.style.width=W+'px'; cv.style.height=H+'px';
  g.setTransform(DPR,0,0,DPR,0,0); g.imageSmoothingEnabled=false;
  pxBase=Math.max(3,Math.round(Math.min(W,H)/150));
  wallpaperChoose(wallpaperIndex,true);
}

function wallpaperArea(){
  const u=wallpaperUnit();
  const overscan=Math.max(Math.round(H*.011),Math.round(u*.6));
  return {x:-overscan,y:-overscan,w:W+overscan*2,h:H+overscan*2,sb:0};
}
function wallpaperUnit(){return Math.max(1,Math.round(Math.min(W,H)/100));}
function wallpaperNoInput(area){
  return {x:.5,y:.5,ax:area.x+area.w/2,ay:area.y+area.h/2,lx:area.x+area.w/2,ly:area.y+area.h/2,down:false,click:false,keys:Object.freeze(Object.create(null)),active:false};
}
function wallpaperClock(){
  const bpm=112,spb=60/bpm,t=Math.max(0,(performance.now()-wallpaperStarted)/1000);
  const beatFloat=t/spb,beat=Math.floor(beatFloat),phase=beatFloat-beat;
  const bar=Math.floor(beat/4),phrase=Math.floor(bar/4),barPhase=(beatFloat/4)%1;
  let pulse=Math.max(0,1-phase); pulse*=pulse;
  const energy=.34+.18*Math.sin(t*.17)+.1*Math.sin(t*.071);
  const grid={gstep:beat,phase,beat,bar,spb,step16:spb/4,bpm};
  const clock={bpm,beat,bar,phrase,barPhase,beatPulse:pulse,pulse,kick:pulse,snare:beat%4===2?pulse*.7:0,hat:beat%2?pulse*.35:0,drop:bar%8===0&&barPhase<.18,idle:false,paused:wallpaperPaused,energy,energyLevel:Math.round(energy*10),hue:(.62+t*.004)%1,section:'motion',bands:{bass:energy*.7,mid:energy*.55,treble:energy*.4},roles:{},noteOns:[],primaryNotes:[]};
  const snd={grid:()=>grid,clock:()=>clock,vis:()=>clock,energy:()=>energy};
  ['event','note','lead','fx','tone','drum','bass','act'].forEach(key=>snd[key]=function(){});
  return snd;
}
function wallpaperChoose(index,preserveVariant){
  if(!W||!H)return;
  wallpaperIndex=(index+WALLPAPER_KEYS.length)%WALLPAPER_KEYS.length;
  wallpaperGame=CT_GAMES[WALLPAPER_KEYS[wallpaperIndex]];
  if(!wallpaperGame)return;
  VisualizerGame.install(wallpaperGame,WALLPAPER_KEYS[wallpaperIndex]);
  if(!preserveVariant) wallpaperVariant=Math.floor(Math.random()*Math.max(1,wallpaperGame.variants||1));
  wallpaperState=wallpaperGame.make(wallpaperArea(),wallpaperUnit(),wallpaperVariant)||{};
  wallpaperSceneAt=performance.now();
  document.getElementById('scene').value=WALLPAPER_KEYS[wallpaperIndex];
  wallpaperStatus(wallpaperGame.name||WALLPAPER_KEYS[wallpaperIndex]);
}
function wallpaperStatus(message){
  const el=document.getElementById('status'); el.textContent=message; el.classList.add('show');
  clearTimeout(wallpaperStatus.timer); wallpaperStatus.timer=setTimeout(()=>el.classList.remove('show'),1100);
}
function wallpaperFrame(now){
  requestAnimationFrame(wallpaperFrame);
  if(document.hidden||wallpaperPaused)return;
  if(now-wallpaperTickAt<1000/wallpaperFps)return;
  wallpaperTickAt=now;
  const dt=Math.max(0,Math.min(.05,(now-wallpaperLast)/1000)); wallpaperLast=now;
  if(now-wallpaperSceneAt>wallpaperRotateSeconds*1000) wallpaperChoose(wallpaperIndex+1,false);
  for(let i=0;i<8;i++)g.restore();
  g.setTransform(DPR,0,0,DPR,0,0);g.globalAlpha=1;g.fillStyle='#000';g.fillRect(0,0,W,H);
  if(!wallpaperGame||!wallpaperState)return;
  const area=wallpaperArea(),snd=wallpaperClock(),input=wallpaperNoInput(area);
  try{
    wallpaperGame.frame(dt,wallpaperUnit(),area,input,snd,wallpaperState);
    if(wallpaperState.$viz&&wallpaperState.$viz.resetRequested) wallpaperChoose(wallpaperIndex,true);
  }catch(error){
    console.error('[wallpaper] scene failed:',WALLPAPER_KEYS[wallpaperIndex],error);
    wallpaperChoose(wallpaperIndex+1,false);
  }
}
function wallpaperControls(){
  const select=document.getElementById('scene');
  for(const key of WALLPAPER_KEYS){const option=document.createElement('option');option.value=key;option.textContent=(CT_GAMES[key]&&CT_GAMES[key].name)||key.toUpperCase();select.appendChild(option);}
  select.addEventListener('change',()=>wallpaperChoose(WALLPAPER_KEYS.indexOf(select.value),false));
  document.getElementById('previous').addEventListener('click',()=>wallpaperChoose(wallpaperIndex-1,false));
  document.getElementById('next').addEventListener('click',()=>wallpaperChoose(wallpaperIndex+1,false));
  document.getElementById('pause').addEventListener('click',event=>{wallpaperPaused=!wallpaperPaused;event.currentTarget.textContent=wallpaperPaused?'Resume':'Pause';event.currentTarget.setAttribute('aria-pressed',String(wallpaperPaused));wallpaperLast=performance.now();});
}
if(window.WallpaperNative&&window.WallpaperNative.isDesktop){
  document.body.classList.add('native-wallpaper');
  if(window.WallpaperNative.onPerformance)window.WallpaperNative.onPerformance(state=>{if(state&&state.fpsCap)wallpaperFps=Math.max(1,Math.min(60,state.fpsCap));wallpaperPaused=!!(state&&state.paused);});
}
try{const query=new URLSearchParams(location.search);const rotate=Number(query.get('rotate'));if(Number.isFinite(rotate)&&rotate>=5)wallpaperRotateSeconds=rotate;}catch(error){}
window.addEventListener('resize',wallpaperResize);
wallpaperControls();wallpaperResize();wallpaperChoose(0,false);requestAnimationFrame(wallpaperFrame);
window.__wallpaper={keys:WALLPAPER_KEYS,current:()=>WALLPAPER_KEYS[wallpaperIndex],music:false};
