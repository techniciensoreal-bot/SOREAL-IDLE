// Norman (2026-10-07) : « sur la page Machine temporelle, le GPS brut et le GPS net sont tout le temps pareils. C'est inutile. Donne une utilité à net/brut. »
import { lireSrc } from "./_src-sources.mjs";
import { lirePagesMeta } from "./_meta-pages.mjs";
// Net = brut − Or dépensé par les Mineurs d'or actifs : la distinction n'existe qu'une fois ce système débloqué ; avant, une seule ligne (et le champ n'est même pas envoyé : anti-spoil).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const serveur = lireSrc("idle-ngu-progression.js");
assert.ok(serveur.includes("...(state.systems.diggers?.unlocked ? { diggerDrain: diggerDrainTotal(state) } : {})"), "diggerDrain n'est envoyé que si les Mineurs d'or sont débloqués");
assert.ok(serveur.includes("Math.max(0,idleNguTimeMachineGrossGoldPerSecond(state)-diggerDrainTotal(state))"), "net = brut − coût des Mineurs d'or");

const meta = (readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8") + lirePagesMeta());
assert.ok(meta.includes("const brutNet=vue.diggerDrain!=null;") && meta.includes("h('small',null,'(ce qui entre vraiment dans ta bourse)')") && meta.includes("h('small',null,'(ce que la machine fabrique)')"), "avec les Mineurs d'or : brut, coût, net expliqués");
assert.ok(meta.includes(":h('div',{class:'soreal-idle-tm-gps-v1'},h('div',null,'💎 GPS : ',h('b',{'data-tm-stat':'netGps'},p.gps.net)))"), "sans les Mineurs d'or : une seule ligne « GPS »");
assert.ok(meta.includes("(vue.diggerDrain!=null)!==Boolean(document.querySelector('[data-tm-stat=\"diggerDrain\"]'))"), "le déblocage des Mineurs d'or redessine la page");
assert.ok(meta.includes("if(cle==='diggerDrain'&&vue.diggerDrain==null)return;"), "pas de rafraîchissement d'une ligne absente");
// Bandeau : « Brut ... − Mineurs d'or ... » seulement s'il y a de quoi comparer.
assert.ok(meta.includes("p.brutNet?['Brut ',h('b',{'data-tm-hero':'grossGps'}"), "bandeau : brut et coût seulement avec les Mineurs d'or");
console.log("idle-tm-gps-brut-net-v1: OK");
