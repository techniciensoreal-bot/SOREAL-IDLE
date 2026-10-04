import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { advanceBasicTrainingStateV411, normalizeBasicTrainingStateV411 } from "../src/idle-basic-training.js";

/*
 * Norman (2026-10-04) : « j'ai cap le premier menu de Basic Training et ajouté 10K en plus pour que l'énergie passe au suivant quand il se débloque ; l'énergie m'a été rendue et aucune énergie n'était attribuée au 2e menu ».
 * Cause : quand le serveur débloque la compétence (et déplace le surplus), la fusion de l'écran gardait SA répartition (surplus encore dans la première) et la renvoyait ensuite : le transfert était perdu.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const a = ui.indexOf("      function fusionnerBasicTrainingPlusAvanceIdleV166_(");
const b = ui.indexOf("      function appliquerEtatBasicTrainingIdleV120_(");
assert.ok(a > 0 && b > a);
const idleEntier_ = (v) => Math.max(0, Math.floor(Number(v) || 0));
const idleNombre_ = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fusion = new Function("idleEntier_", "idleNombre_", ui.slice(a, b) + "\nreturn fusionnerBasicTrainingPlusAvanceIdleV166_;")(idleEntier_, idleNombre_);
const skill = (id, over) => Object.assign({ id, level: 100, progress: 0, cap: 50, allocation: 0, unlocked: true, levelsPerSecond: 1 }, over || {});

// Écran : la 2e compétence n'est pas encore débloquée, le surplus (10 000) est dans la première. Serveur : déblocage fait, surplus transféré.
const ecran = { skills: [skill("s1", { allocation: 10050 }), skill("s2", { unlocked: false, allocation: 0, level: 0 })] };
const serveur = { skills: [skill("s1", { allocation: 50, level: 101 }), skill("s2", { allocation: 10000, level: 0 })] };
const r = fusion(ecran, serveur);
assert.equal(r.skills[0].allocation, 50, "la première garde son cap");
assert.equal(r.skills[1].allocation, 10000, "le surplus est dans la compétence débloquée (l'écran ne le détruit plus)");
assert.equal(r.skills[1].unlocked, true);
// Sans déblocage côté serveur, l'écran garde sa répartition (clic récent pas encore confirmé).
const r2 = fusion({ skills: [skill("s1", { allocation: 10050 }), skill("s2", { allocation: 0 })] }, { skills: [skill("s1", { allocation: 50 }), skill("s2", { allocation: 0 })] });
assert.equal(r2.skills[0].allocation, 10050, "répartition de l'écran conservée hors déblocage");
// Déjà débloqué des deux côtés (transfert local fait et envoyé) : l'écran garde sa répartition.
const r3 = fusion({ skills: [skill("s1", { allocation: 50 }), skill("s2", { allocation: 10000 })] }, { skills: [skill("s1", { allocation: 10050 }), skill("s2", { allocation: 0 })] });
assert.equal(r3.skills[1].allocation, 10000);

// Moteur : le serveur fait bien le transfert au déblocage (Training Auto Advance), c'est la page qui l'annulait.
const etat = normalizeBasicTrainingStateV411({}, 0);
const defs = Object.values(etat.skills);
const [p1, p2] = [etat.skills.attaque_passive, etat.skills.attaque_reguliere];
p1.level = 4900; p1.allocation = p1.cap + 10000;
const avance = advanceBasicTrainingStateV411(etat, 600_000, 30 * 86400, 1, { autoAdvance: true });
assert.equal(avance.state.skills.attaque_passive.allocation, avance.state.skills.attaque_passive.cap, "la prérequise garde exactement son cap");
assert.equal(avance.state.skills.attaque_reguliere.allocation, 10000, "le surplus passe à la compétence débloquée");
assert.ok(defs.length > 2 && p2);
console.log("idle-bt-deblocage-serveur-auto-advance-v1: OK");
