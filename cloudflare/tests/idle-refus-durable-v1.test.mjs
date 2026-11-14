import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
/* Audit 2026-11-14 : un refus durable de la sauvegarde (6 refus de suite) est signalé au joueur ; le bandeau disparaît à la première écriture confirmée. */
const s = readFileSync(new URL("../public/modules/moteur-local-v1.js", import.meta.url), "utf8");
assert.ok(s.includes("function avertirRefusDurable()") && s.includes("sale=true;refus+=1;if(refus>=6)avertirRefusDurable();"), "bandeau après 6 refus");
assert.ok(s.includes("revAcquittee=Math.max(revAcquittee,revEnvoyee);refus=0;retirerRefusDurable();"), "bandeau retiré et compteur remis à 0 à la première écriture confirmée");
assert.ok(s.includes('d.setAttribute("data-morph-garder","")') && s.includes("document.body.appendChild(d)"), "ajouté à <body>, hors de la page redessinée");
const dict = JSON.parse(readFileSync(new URL("../public/modules/traduction-anglais-dict-v1.json", import.meta.url), "utf8"));
assert.ok(dict["Ta partie n’est plus enregistrée sur le serveur. Recharge la page ; si ça continue, exporte ta partie dans les Réglages."], "texte traduit en anglais");
console.log("idle-refus-durable-v1 : OK");
