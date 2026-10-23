import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-17) : « la première fois que le coffre se chie dessus, on doit voir l'icône du doigt qui fait des allers-retours sur le caca pour montrer au joueur qu'il doit frotter ».
 */
const acc = readFileSync("cloudflare/public/modules/coffre-accident-v1.js", "utf8");
assert.ok(acc.includes("var CLE_DOIGT_VU_='soreal_idle_caca_doigt_vu_v1';") && acc.includes("function doigtDejaVu_(){"), "mémorisé dans le stockage « soreal_idle_ » (lié au compte)");
assert.ok(acc.includes("function montrerDoigt_(el){\n    if(doigtDejaVu_()||!el||el.querySelector('.bg-doigt-v1'))return;"), "affiché seulement tant que jamais frotté, une seule fois à l'écran");
assert.ok(acc.includes("el.appendChild(f);\n    montrerDoigt_(el);"), "dès que la flaque apparaît");
assert.ok(acc.includes("if(!document.querySelector('.bg-doigt-v1')){var cof=coffre_();if(cof)montrerDoigt_(cof);}"), "remis en place si le Coffre est redessiné");
assert.ok(acc.includes("if(n&&flaqueNiveau>0){retirerDoigt_();flaqueNiveau-=1;") && !acc.includes("if(fl){retirerDoigt_();suivi="), "la première vraie frottée le retire pour toujours (pas le simple toucher : Norman, 2026-10-23)");
assert.ok(acc.includes("function retirerDoigt_(){\n    try{localStorage.setItem(CLE_DOIGT_VU_,'1');}catch(_e){}"), "et le mémorise");
assert.ok(acc.includes("@keyframes bgDoigt{from{transform:translateX(-56px) rotate(-8deg)}to{transform:translateX(56px) rotate(8deg)}}") && acc.includes(".bg-doigt-v1{position:absolute;") && acc.includes("pointer-events:none;"), "va-et-vient sur la flaque, ne bloque aucun geste");
assert.ok(acc.includes("setAttribute('data-morph-garder','');d.innerHTML=SVG_DOIGT_;") && acc.includes("prefers-reduced-motion:reduce){.bg-doigt-v1{animation:none}"), "survit au redessin ; fixe si mouvement réduit");
assert.ok(!/setInterval|setTimeout\(/.test(acc.slice(acc.indexOf("function montrerDoigt_"), acc.indexOf("function retirerDoigt_") + 200)), "aucune minuterie : animation CSS seulement");
console.log("idle-coffre-doigt-premiere-fois-v1: OK");
