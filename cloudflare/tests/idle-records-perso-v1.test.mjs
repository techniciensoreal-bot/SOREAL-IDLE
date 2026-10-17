import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

/*
 * Norman (2026-10-17) : « quand on bat un record personnel (plus long combat…) ou qu'on monte de place au classement, un popup avec un petit son comme pour les trophées, mais différent ». Serveur : obtenirMesRangsSorealIdle
 * (rangs sans écriture). Client : modules/records-perso-v1.js (comparaison, annonce en fondu), son « recordPerso ».
 */
// 1. Serveur : mes rangs, sans écriture du registre ni passage noté.
const g = creerJoueurExterneV1("records@example.com");
g.op("obtenirEtatSorealIdle", "x");
assert.equal(g.op("definirPseudoSorealIdle", "x", "Recordman").ok, true);
g.op("obtenirClassementSorealIdle", "x");
const depuis = g.journalSql.length;
const r = g.op("obtenirMesRangsSorealIdle", "x");
assert.equal(r.ok, true);
assert.ok(r.moi && r.moi.rang >= 1 && r.moi.rangs && r.moi.rangs.boss >= 1 && r.moi.valeurs && "combatLong" in r.moi.valeurs && "number" in r.moi.valeurs, "mon rang global, par statistique, et mes valeurs");
assert.equal(r.joueurs >= 1, true);
const ecrits = g.journalSql.slice(depuis).filter(([q, b]) => /INSERT|UPDATE|REPLACE|DELETE/i.test(q) && /CLASSEMENT|passage|vu/i.test(String(b))).length;
assert.equal(ecrits, 0, "aucune écriture (registre ni passage) : appelable en arrière-plan");

// 2. Client : la comparaison (le vrai module, sur un faux navigateur).
const src = readFileSync("cloudflare/public/modules/records-perso-v1.js", "utf8");
const ctx = { window: {}, document: { hidden: false }, localStorage: { getItem: () => null, setItem() {} }, Date, Math, Number, String, Object, JSON, Array };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(src, ctx);
const R = ctx.__SOREAL_IDLE_RECORDS_PERSO_V1__;
const srv = (rang, rangs, valeurs) => ({ ok: true, joueurs: 6, moi: { rang, rangs, valeurs } });
const T = (x) => JSON.parse(JSON.stringify(x));

// premier passage : tout est noté, rien n'est annoncé
let a = R.comparer(null, srv(4, { boss: 3, number: 5, combatLong: 2 }, { combatLong: 30, number: 1000 }), true);
assert.equal(a.annonces.length, 0, "premier passage : aucune rafale");
assert.deepEqual(T(a.memoire.v), { combatLong: 30, number: 1000 });
assert.equal(a.memoire.r.boss, 3);
// record : combat plus long, meilleur nombre
a = R.comparer(T(a.memoire), srv(4, { boss: 3, number: 5, combatLong: 2 }, { combatLong: 95, number: 5000 }), true);
assert.deepEqual(T(a.annonces.map((x) => x.type + ":" + x.icone)), ["record:⚔️", "record:🔢"]);
assert.ok(a.annonces[0].ligne.includes("1 min 35 s") && /Meilleur Nombre/.test(a.annonces[1].ligne), "durée lisible, nombre formaté");
assert.equal(a.memoire.v.combatLong, 95);
// pas de recul : une valeur plus basse n'annonce rien et ne baisse pas la mémoire
let b = R.comparer(T(a.memoire), srv(4, { boss: 3, number: 5, combatLong: 2 }, { combatLong: 10, number: 10 }), true);
assert.equal(b.annonces.length, 0);
assert.equal(b.memoire.v.combatLong, 95);
// montée au classement : strictement meilleur que le meilleur déjà annoncé ; global compris
let c = R.comparer(T(a.memoire), srv(2, { boss: 3, number: 1, combatLong: 2 }, { combatLong: 95, number: 5000 }), true);
assert.deepEqual(T(c.annonces.map((x) => x.ligne)), ["Classement général : 2ᵉ place (avant : 4ᵉ)", "Classement Nombre : 1ʳᵉ place (avant : 5ᵉ)"]);
// perdre puis retrouver la même place : jamais deux fois
let d = R.comparer(T(c.memoire), srv(5, { boss: 4, number: 3, combatLong: 2 }, { combatLong: 95, number: 5000 }), true);
assert.equal(d.annonces.length, 0, "descendre n'annonce rien");
let e = R.comparer(T(d.memoire), srv(2, { boss: 3, number: 1, combatLong: 2 }, { combatLong: 95, number: 5000 }), true);
assert.equal(e.annonces.length, 0, "retrouver une place déjà annoncée : rien");
// classement non débloqué : aucune montée annoncée (les records, oui)
let f = R.comparer(T(a.memoire), srv(1, { boss: 1, number: 1, combatLong: 1 }, { combatLong: 200, number: 5000 }), false);
assert.deepEqual(T(f.annonces.map((x) => x.type)), ["record"], "sans classement débloqué : seulement le record personnel");

// 3. Branchements : script chargé, appelé à chaque rendu, son à part (différent du trophée), couleur à part.
const index = readFileSync("cloudflare/public/index.html", "utf8"), noyau = readFileSync("cloudflare/public/modules/ui-noyau-v1.js", "utf8"), audio = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
assert.ok(index.includes('/modules/records-perso-v1.js?v='), "module chargé par la page");
assert.ok(noyau.includes("__SOREAL_IDLE_RECORDS_PERSO_V1__.verifier(j,'soreal_idle_records_perso_v1_'+generationJoueurIdleV75_(j))"), "vérifié à chaque rendu");
assert.ok(audio.includes('recordPerso:{group:"achievement"') && audio.includes("recordPerso:recordPerso_") && audio.includes('recordPerso:function(){return demander_("recordPerso");}'), "son recordPerso enregistré");
const sonSucces = audio.slice(audio.indexOf("function succes_()"), audio.indexOf("function recordPerso_()")), sonRecord = audio.slice(audio.indexOf("function recordPerso_()"), audio.indexOf("Basic Training (Norman, 2026-09-26) : trois sons"));
assert.ok(!sonRecord.includes("523") && sonRecord.includes("784") && sonRecord.includes("1175") && sonSucces.includes("523"), "le son du record n'est pas la fanfare des trophées");
assert.ok(src.includes("audio.play('recordPerso')") && src.includes("'#7dd3fc'") && src.includes("'#c4b5fd'"), "annonce avec le son à part et ses couleurs");
assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon/.test(src), "passe par google.script.run seulement");
console.log("idle-records-perso-v1: OK");
