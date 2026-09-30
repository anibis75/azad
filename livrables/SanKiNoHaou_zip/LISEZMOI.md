# 三機ノ覇王 : zip complet du projet (1,9 Go)

Le zip est découpé en 20 morceaux de 95 Mo, `SanKiNoHaou_complet.zip.001` à `.020`, parce que GitHub refuse les fichiers de plus de 100 Mo.

## Recoller les morceaux

1. Télécharger les 20 fichiers `.001` à `.020` dans un même dossier.
2. Recoller selon le système :
   - **Windows (7-Zip)** : clic droit sur `SanKiNoHaou_complet.zip.001`, puis 7-Zip, puis « Extraire ici ». 7-Zip enchaîne tout seul les morceaux suivants.
   - **Windows (sans 7-Zip)** : `copy /b SanKiNoHaou_complet.zip.* SanKiNoHaou_complet.zip`
   - **Mac / Linux** : `cat SanKiNoHaou_complet.zip.* > SanKiNoHaou_complet.zip`
3. Vérifier le fichier (facultatif). Le SHA-256 doit être `a2bc0ec550b5feb2cb69bffbe164fa099697051a8fc769096bc312352559080d`.

## Contenu

Le zip contient les dossiers suivants. Le détail est dans `LISEZMOI.md`, à l'intérieur du zip.

- **Le film** : `1_video/SanKiNoHaou_720p.mp4`, 4 min 30, en 720p à 24 images par seconde, avec le son.
- **Le projet** : `2_projet/` contient tout le code source (three.js), les sons, les musiques, les voix, les polices et les scripts de rendu.
- **Les modèles** : `3_modeles_3D/` contient les 3 robots en GLB.
- **La bande-son** : `4_audio/`, en WAV et en FLAC.
- **Les voix** : `5_voix_generation/` contient les scripts VOICEVOX et les répliques.
- **Les contrôles** : `6_images_controle/` contient les planches de vérification.
- **La page** : `7_page_artifact/` contient la page du lecteur.
- **Les images brutes** : `8_images_brutes/` contient les 6480 images JPG brutes du rendu final et l'aperçu.
