import assert from "node:assert/strict";
import fs from "node:fs";

/* Norman (2026-11-09) : « l'image du slime métallique n'apparaît plus en Aventure ». Le serveur sert bien l'image (vérifié en production) ; côté page, un chargement raté n'était jamais retenté. */
const s = fs.readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8");
assert.ok(s.includes("img.addEventListener('error'") && s.includes("[1000,3000,8000][n-1]"), "trois nouvelles tentatives : 1 s, 3 s, 8 s");
assert.ok(s.includes("'r='+n") && s.includes("if(n>3||!img.__urlV1)return;"), "adresse différente à chaque tentative (cache), jamais plus de trois");
assert.ok(s.includes("if(img&&img.__urlV1!==url){img.__urlV1=url;img.__essaisV1=0;img.setAttribute('src',url);}"), "le chargement n'est relancé que si l'adresse demandée change, pas à chaque rendu");
assert.ok(s.includes("img.addEventListener('load',function(){img.__essaisV1=0;});"), "un chargement réussi remet le compteur à zéro");
console.log("idle-adventure-image-mob-retentes-v1: OK");
