// Norman (2026-11-02) : « j'ai réduit le lecteur (la cassette), je n'arrive plus à l'ouvrir » : le lecteur capture le pointeur (setPointerCapture) pour se déplacer, donc le pointerup n'arrivait
// jamais à la petite enceinte : un simple toucher doit l'agrandir, écouté sur le lecteur lui-même tant qu'il est réduit.
import fs from "node:fs";
import assert from "node:assert/strict";
const s = fs.readFileSync("cloudflare/public/modules/lecteur-chroniques-v1.js", "utf8").replace(/\r\n/g, "\n");
assert.ok(s.includes("el.setPointerCapture(ev.pointerId)"), "le lecteur capture bien le pointeur pour se déplacer (c'est la cause)");
assert.ok(!/enc\.addEventListener\('pointerup'/.test(s), "plus d'écoute du pointerup sur l'enceinte seule (jamais reçu sous capture)");
assert.ok(s.includes("el.addEventListener('pointerup',function(ev){var d=dep;dep=null;if(d&&ev.pointerId===d.id&&el.classList.contains('mini')") && s.includes("Math.abs(ev.clientX-d.x)<6&&Math.abs(ev.clientY-d.y)<6)regler(false);},true);"), "toucher bref sur le lecteur réduit : il s'agrandit");
assert.ok(s.includes("el.classList.contains('mini')?{x:ev.clientX,y:ev.clientY,id:ev.pointerId}:null"), "seulement quand il est réduit");
assert.ok(s.includes("enc.addEventListener('keydown'"), "clavier : Entrée / Espace agrandit toujours");
console.log("idle-lecteur-reduit-reouvrir-v1 : OK");
