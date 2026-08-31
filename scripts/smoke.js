'use strict';
const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const root=path.resolve(__dirname,'..');
cp.execFileSync(process.execPath,['build.js'],{cwd:root,stdio:'inherit'});
const files=fs.readdirSync(path.join(root,'dist'));
const bundle=files.find(file=>/^wallpaper\.[a-f0-9]+\.js$/.test(file));
if(!bundle) throw new Error('hashed wallpaper bundle missing');
const js=fs.readFileSync(path.join(root,'dist',bundle),'utf8');
for(const forbidden of ['CT_COMPOSERS','generated-synth-worklet','gb-chip-worklet','Download WAV','Web Radio']){
  if(js.includes(forbidden)) throw new Error(`music boundary leaked into wallpaper bundle: ${forbidden}`);
}
if(!fs.existsSync(path.join(root,'native','mac_wallpaper.mm'))) throw new Error('macOS wallpaper bridge missing');
for(const key of ['hover','blast','bricks','trooper','climber','racer','crossing','squadron','vortex','platformer','maze','pyramid','blocks','dungeon']){
  if(!js.includes(`CT_GAMES.${key}`) && !js.includes(`CT_GAMES['${key}']`)) throw new Error(`scene missing: ${key}`);
}
console.log('wallpaper boundary smoke passed: 14 scenes, zero music engine');
