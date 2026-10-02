const fs=require('fs'),path=require('path'),{execSync}=require('child_process');
execSync('npx esbuild src/main.js --bundle --format=iife --target=es2020 --outfile=dist/bundle.js --log-level=warning',{cwd:__dirname,stdio:'inherit'});
const names=fs.readdirSync(path.join(__dirname,'assets/sfx')).filter(f=>f.endsWith('.mp3')).map(f=>f.replace('.mp3',''));
let html=fs.readFileSync(path.join(__dirname,'template.html'),'utf8');
const bundle=fs.readFileSync(path.join(__dirname,'dist/bundle.js'),'utf8').replace(/<\/script/g,'<\\/script');
html=html.replace('<!--ASSETS-->',()=>`<script>window.__SFXN=${JSON.stringify(names)};</script>`).replace('/*BUNDLE*/',()=>bundle);
fs.writeFileSync(path.join(__dirname,'dist/film.html'),html); console.log('built');
