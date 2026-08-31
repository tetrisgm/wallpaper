'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = __dirname;
const games = ['hover','blast','bricks','trooper','climber','racer','crossing','squadron','vortex','platformer','maze','pyramid','blocks','dungeon'];
const layers = ['definition.js','behavior.js','reactions.js','renderer.js','index.js'];
const order = [
  'src/helpers.js','src/visualizer.js','src/sprites.js',
  ...games.flatMap(game => layers.map(layer => `packs/games/${game}/${layer}`)),
  'src/runtime.js'
];

for (const file of order) if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing ${file}`);
const js = order.map(file => `/* ===== ${file} ===== */\n${fs.readFileSync(path.join(root,file),'utf8')}`).join('\n');
new Function(js);
const hash = crypto.createHash('sha256').update(js).digest('hex').slice(0,12);
const bundle = `wallpaper.${hash}.js`;
const shell = fs.readFileSync(path.join(root,'src/shell.html'),'utf8');
if (!shell.includes('__SCRIPTS__')) throw new Error('Missing __SCRIPTS__ marker');
const out = path.join(root,'dist');
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,bundle),js);
fs.writeFileSync(path.join(out,'index.html'),shell.replace('__SCRIPTS__',`<script src="${bundle}" defer></script>`));
console.log(`built ${bundle}: ${games.length} scenes, no music runtime`);
