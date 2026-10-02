# 虚神ノ逆襲 — Partie II : la revanche de Sylina

Ce dossier contient un film d'animation 3D de 5 min, à rendre en MP4 sur ton PC. Il met en scène Azad, Remi et Sylina, et c'est Sylina qui gagne. Sylina utilise les pouvoirs d'Imu et du Chevalier divin. Azad utilise ceux de Barbe Noire et le poing de Garp. Remi utilise la glace d'Aokiji.

## Fabriquer le film (Windows)

1. Installe **Node.js** (version LTS) depuis https://nodejs.org. C'est à faire une seule fois.
2. Double-clique sur **`FILM.bat`**.
   - Au premier lancement, le script installe deux petits outils, Playwright et ffmpeg.
   - Il utilise ensuite **Chrome ou Edge** (Edge est déjà installé sur Windows), avec ta carte graphique, pour dessiner les 7 200 images du film.
   - Enfin, il assemble l'image et le son dans **`LaRevancheDeSylina_1080p.mp4`**, rangé dans ce dossier.
3. Le pourcentage et le temps restant s'affichent pendant le rendu. Si tu fermes la fenêtre, relance `FILM.bat` : le rendu reprend là où il s'était arrêté.

### Avec le terminal (Windows, Mac ou Linux)

```
npm install
npm run film        # 1080p
npm run film720     # 720p, plus rapide
npm test            # rend seulement les 10 premières secondes, pour vérifier
```

### Options du script

Elles se passent après `node render.cjs` ou après `FILM.bat` :

| Option | Effet |
|---|---|
| `--w 1280 --h 720` | Rendu en 720p au lieu de 1080p. |
| `--workers 2` | Moins de rendus en parallèle, si le PC rame. Par défaut, le script en lance jusqu'à 4. |
| `--from 60 --to 120` | Rend seulement ce passage (en secondes). |

Durée estimée : entre 20 min et 1 h 30 environ, selon la carte graphique.

Si le script affiche que la carte graphique n'est pas utilisée, une fenêtre de navigateur s'ouvre pendant le rendu. Laisse-la ouverte et ne la réduis pas.

## Contenu du dossier

| Élément | Rôle |
|---|---|
| `dist/film.html` | Le film, construit à partir de `src/` avec `node build.cjs`. |
| `src/` | Le code du film. |
| `src/acts2.js` | Le scénario, plan par plan. |
| `src/fx4.js` | Les techniques. |
| `src/stages2.js` | Les décors. |
| `src/attach.js` | Les ailes et l'auréole de Sylina. |
| `assets/` | Les personnages (VRM), les bruitages, les musiques et les voix. |
| `sound.m4a` | La bande-son complète, déjà mixée. |
| `render.cjs` | Le script de rendu local. |

## Le film

| Acte | Lieu | Combat |
|---|---|---|
| I | La Terre sainte (esplanade de Mary Geoise, château de Pangée) | Combat à 2 contre 1. Sylina déploie ses ailes et ressuscite avec Domi Reversi. |
| II | Au-dessus des nuages divins | Sylina contre Remi. Remi gèle toute la mer de nuages, Sylina répond avec la lance sacrée noire. |
| III | Le trône vide sous la lune rouge | Sylina contre Azad. Météores de Garp, flamme mère, trou noir et les vingt épées. |
| IV | Sous le soleil noir, sur l'océan gelé | Galaxy Impact, puis le Jugement céleste. |
| V | L'aube | Sylina s'assoit sur le Trône vide. Titre, puis générique. |
