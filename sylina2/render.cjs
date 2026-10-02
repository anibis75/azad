// 虚神ノ逆襲 — rendu local du film en MP4 (utilise ta carte graphique via Chrome / Edge).
// Usage :  node render.cjs                       -> 1080p, 24 i/s, film complet
//          node render.cjs --w 1280 --h 720      -> 720p (plus rapide)
//          node render.cjs --workers 2           -> moins de fenêtres en parallèle (si le PC rame)
//          node render.cjs --from 60 --to 120    -> seulement un passage (en secondes), pour tester
// Le rendu reprend tout seul là où il s'était arrêté (les images déjà faites dans frames/ sont gardées).
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const { spawn, execSync } = require('child_process');

const ARG = {}; process.argv.slice(2).forEach((a, i, l) => { if (a.startsWith('--')) ARG[a.slice(2)] = l[i + 1] && !l[i + 1].startsWith('--') ? l[i + 1] : true; });
const FPS = +(ARG.fps || 24), W = +(ARG.w || 1920), H = +(ARG.h || 1080), DUR = 300;
const T0 = +(ARG.from || 0), T1 = Math.min(DUR, +(ARG.to || DUR));
const WORKERS = +(ARG.workers || Math.max(1, Math.min(4, Math.floor(os.cpus().length / 2))));
const ROOT = __dirname, FR = path.join(ROOT, 'frames' + (W !== 1920 ? `_${H}p` : '')), OUT = path.join(ROOT, `LaRevancheDeSylina_${H}p.mp4`);
fs.mkdirSync(FR, { recursive: true });
const name = i => path.join(FR, `f${String(i).padStart(5, '0')}.jpg`);

/* ---------- petit serveur web local ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mp3': 'audio/mpeg', '.vrm': 'application/octet-stream', '.ttf': 'font/ttf', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});

async function launch(headless) {
  const { chromium } = require('playwright-core');
  const args = ['--ignore-gpu-blocklist', '--enable-gpu', '--enable-gpu-rasterization', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'];
  if (!headless) args.push('--window-position=0,0');
  for (const channel of ['chrome', 'msedge', undefined]) {
    try { const b = await chromium.launch({ channel, headless, args }); return { b, channel: channel || 'chromium' }; } catch (e) { /* essaie le suivant */ }
  }
  console.log('Aucun navigateur trouvé : installation de Chromium (une seule fois)…');
  execSync('npx playwright-core install chromium', { stdio: 'inherit', cwd: ROOT });
  return { b: await require('playwright-core').chromium.launch({ headless, args }), channel: 'chromium' };
}
async function openPage(b, url) {
  const p = await b.newPage({ viewport: { width: W, height: H } }); p.setDefaultTimeout(0);
  await p.addInitScript(() => { let s = 1234567; Math.random = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; });
  p.on('pageerror', e => console.log('  [erreur page] ' + e.message));
  await p.goto(url); await p.waitForFunction('window.READY', null, { timeout: 0 });
  return p;
}
const fmt = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min ${String(s % 60).padStart(2, '0')} s`; };

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/dist/film.html`;
  const i0 = Math.floor(T0 * FPS), i1 = Math.floor(T1 * FPS), total = i1 - i0;
  const todo = []; for (let i = i0; i < i1; i++) if (!fs.existsSync(name(i))) todo.push(i);
  console.log(`\n虚神ノ逆襲 — rendu ${W}x${H}, ${FPS} i/s, ${T0}-${T1} s : ${total} images (${total - todo.length} déjà faites), ${WORKERS} rendus en parallèle\n`);
  if (todo.length) {
    let { b, channel } = await launch(true);
    let probe = await openPage(b, url);
    const gpu = await probe.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); const e = g && g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'inconnu'; });
    console.log(`Navigateur : ${channel} · carte graphique : ${gpu}`);
    if (/swiftshader|llvmpipe|software/i.test(gpu) && !ARG.nogpu) {
      console.log('Le mode invisible n\'utilise pas la carte graphique : une fenêtre va s\'ouvrir, ne la ferme pas et ne la réduis pas.');
      await b.close(); ({ b } = await launch(false)); probe = await openPage(b, url);
    }
    // découpe en blocs contigus (chaque rendu simule le film depuis le début jusqu'à son bloc)
    const chunks = []; const per = Math.ceil(todo.length / WORKERS); for (let k = 0; k < WORKERS; k++) { const c = todo.slice(k * per, (k + 1) * per); if (c.length) chunks.push(c); }
    let done = 0; const tStart = Date.now();
    const tick = setInterval(() => { const el = (Date.now() - tStart) / 1000, r = done / Math.max(1, el); process.stdout.write(`\r  ${((total - todo.length + done) / total * 100).toFixed(1)} %  (${total - todo.length + done}/${total})  ·  reste ≈ ${r > 0 ? fmt((todo.length - done) / r) : '…'}      `); }, 2000);
    await Promise.all(chunks.map(async (c, k) => {
      const p = k === 0 ? probe : await openPage(b, url);
      for (let i = Math.max(0, c[0] - 3 * FPS); i < c[0]; i++) await p.evaluate(t => window.__adv(t), i / FPS);
      for (const i of c) {
        if (fs.existsSync(name(i))) { done++; continue; }
        await p.evaluate(t => window.__frame(t), i / FPS);
        const tmp = name(i) + '.part'; await p.screenshot({ path: tmp, type: 'jpeg', quality: 93 }); fs.renameSync(tmp, name(i)); done++;
      }
    }));
    clearInterval(tick); console.log('\n\nImages terminées.'); await b.close();
  }
  server.close();
  // assemblage
  let ff; try { ff = require('ffmpeg-static'); } catch (e) { ff = 'ffmpeg'; }
  const missing = []; for (let i = i0; i < i1; i++) if (!fs.existsSync(name(i))) missing.push(i);
  if (missing.length) { console.log(`Il manque ${missing.length} images, relance la commande pour les terminer.`); process.exit(1); }
  const out = T0 === 0 && T1 === DUR ? OUT : OUT.replace('.mp4', `_${T0}-${T1}s.mp4`);
  console.log('Assemblage de la vidéo avec le son…');
  const a = ['-y', '-loglevel', 'error', '-stats', '-framerate', String(FPS), '-start_number', String(i0), '-i', path.join(FR, 'f%05d.jpg'), '-ss', String(T0), '-i', path.join(ROOT, 'sound.m4a'),
    '-frames:v', String(total), '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out];
  await new Promise((res, rej) => spawn(ff, a, { stdio: 'inherit' }).on('exit', c => (c ? rej(new Error('ffmpeg ' + c)) : res())));
  console.log(`\n✔ Film prêt : ${out}\n`);
})().catch(e => { console.error('\nErreur :', e.message); process.exit(1); });
