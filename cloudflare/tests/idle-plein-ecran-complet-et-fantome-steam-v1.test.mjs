// Norman (2026-10-29) : « l'interface Steam fonctionne, mais à sa fermeture il reste un fantôme de l'image » et « une fois le plein écran utilisé, il ne doit plus y avoir d'espace à gauche et à droite ».
import fs from "node:fs";
import assert from "node:assert/strict";
const pe = fs.readFileSync("cloudflare/public/modules/plein-ecran-v1.js", "utf8");
const MEDIA = "@media (min-width:1100px) and (hover:hover) and (pointer:fine),(min-width:1500px) and (min-height:800px){html body.soreal-idle-active-v47 .soreal-idle-native-v4{width:100%!important;max-width:none!important;margin:0!important;padding-left:6px!important;padding-right:6px!important;box-sizing:border-box}}";
assert.ok(pe.includes(MEDIA), "largeur complète partout où la mise en page large existe (plein écran OU NON, Norman 2026-10-29), 100 % du parent et jamais 100vw : la barre de défilement ferait déborder");
assert.ok(!pe.includes("html:fullscreen body.soreal-idle-active-v47 .soreal-idle-native-v4{width"), "plus de règle réservée au plein écran pour la largeur");
assert.ok(!/html:fullscreen[^']*100vw/.test(pe), "pas de 100vw");
assert.ok(pe.includes("html:fullscreen body.soreal-idle-active-v47 .soreal-idle-native-v4>.soreal-idle-nav-v28{max-height:min(100vh,var(--nav-dispo,100vh))!important}"), "menu de gauche sur toute la hauteur de l'écran");
const css = fs.readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
assert.ok(css.includes("width:min(1700px,calc(100vw - 32px))!important"), "hors plein écran : largeur plafonnée à 1700 px (inchangé)");

const coeur = fs.readFileSync("desktop/coeur.js", "utf8");
const i = coeur.indexOf("if (LANCE_PAR_STEAM) {\n    const repeindre");
assert.ok(i > 0, "repeinture forcée quand le jeu est lancé par Steam");
const bloc = coeur.slice(i, i + 900);
assert.ok(bloc.includes("webContents.invalidate()") && bloc.includes("setInterval(repeindre, 250)") && bloc.includes('"focus", "blur"') && bloc.includes("clearInterval(minuteurRepeinture)"), "invalidation à chaque focus/taille puis 4 fois par seconde, arrêtée à la fermeture");
assert.ok(bloc.includes("isMinimized()"), "pas de repeinture fenêtre réduite");
console.log("idle-plein-ecran-complet-et-fantome-steam-v1 : OK");
