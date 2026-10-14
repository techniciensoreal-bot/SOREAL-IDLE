import assert from "node:assert/strict";
import fs from "node:fs";
const lire=(p)=>fs.readFileSync(new URL("../"+p,import.meta.url),"utf8");
const m=lire("public/modules/tutoriel-v1.js");
const a=lire("public/modules/admin-tutoriel-v1.js");
/* chaque étape est déclarée à l'éditeur de textes et de voix, sous une clé stable */
assert.ok(m.includes("'guide:'+String(guide&&guide.id||'')+':'+i"));
assert.ok(m.includes("groupe:'Tutoriel · '"));
/* lecture automatique seulement si la voix est activée ; le bouton 🔊 force la lecture ; fermer coupe la voix */
assert.ok(m.includes("lireEtape_(s,false)")&&m.includes("data-tu=\"ecouter\"")&&m.includes("lireEtape_(s,true)"));
assert.ok(/if\(s\)taire_\(\)/.test(m));
/* la bulle n'est pas relue par la lecture automatique des panneaux */
assert.ok(m.includes("data-soreal-tts-ignore"));
/* l'éditeur Admin déclare aussi les guides inactifs */
assert.ok(a.includes("declarerVoix_()")&&a.includes("T.declarerVoix(g)"));
console.log("idle-tutoriel-voix-v1: OK");
