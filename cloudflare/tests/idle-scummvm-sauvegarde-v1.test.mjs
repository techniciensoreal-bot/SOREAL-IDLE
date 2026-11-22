import assert from "node:assert/strict";
import vm from "node:vm";
import zlib from "node:zlib";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

/*
 * Lecteur de sauvegarde SCUMM (modules/scummvm-sauvegarde-v1.js) sur de VRAIES sauvegardes de Day of the Tentacle (version française CD, moteur ScummVM du menu Énigmes),
 * écrites par l'autosave du moteur le 2026-11-22 (cloudflare/tests/references/scummvm-tentacle-*-v1.bin) :
 *   debut = Bernard dans sa chambre, au début de la partie ; apres = même salle après un clic dans le jeu (un indicateur de plus, bit 151).
 * La lecture n'est crédible que si elle atteint EXACTEMENT le dernier octet : c'est ce que le test vérifie, avec des valeurs que le moteur doit contenir (salle courante = variable 4).
 */
const code = readFileSync("cloudflare/public/modules/scummvm-sauvegarde-v1.js", "utf8");
const sb = { DecompressionStream, Blob, Response, Uint8Array, DataView, Int32Array };
sb.window = sb;
vm.createContext(sb);
vm.runInContext(code, sb);
const S = sb.__SOREAL_IDLE_SCUMMVM_SAVE_V1__;
const P = S.PROFILS.tentacle;
const debutBrut = readFileSync("cloudflare/tests/references/scummvm-tentacle-debut-v1.bin");
const apresBrut = readFileSync("cloudflare/tests/references/scummvm-tentacle-apres-v1.bin");
assert.ok(debutBrut.length < 40000 && apresBrut.length < 40000, "références de quelques Ko");

/* 1. décompression : gzip (le format réel du moteur), zlib aussi ; autre chose = null */
const debut = await S.decompresser(debutBrut);
const apres = await S.decompresser(apresBrut);
assert.equal(debutBrut[0], 0x1f); assert.equal(debutBrut[1], 0x8b);
assert.equal(debut.length, 102887);
assert.deepEqual(Buffer.from(debut), zlib.gunzipSync(debutBrut), "même octets que zlib de Node");
assert.deepEqual(Buffer.from(await S.decompresser(zlib.deflateSync(Buffer.from(debut)))), Buffer.from(debut), "zlib accepté");
assert.equal(await S.decompresser(Buffer.from("pas du gzip")), null);
assert.equal(await S.decompresser(new Uint8Array(0)), null);

/* 2. en-tête et lecture complète (jusqu'au dernier octet : ressources, objets, variables, bits, verrous, CD, son, jeu de caractères) */
const a = S.lire(debut, P);
assert.equal(a.erreur, undefined, "lecture sans erreur : " + JSON.stringify(a.erreur));
assert.equal(a.version, 124);
assert.equal(a.nom, "Autosave");
assert.equal(a.salle, 37, "salle courante : la chambre de Bernard");
assert.equal(a.vars[4], 37, "variable 4 = salle courante (VAR_ROOM) : la position des variables est bonne");
assert.equal(a.vars[1], 1, "variable 1 = acteur du joueur (VAR_EGO)");
assert.equal(a.vars.length, 800);
assert.equal(a.bits.length, 256, "2 048 indicateurs");
assert.equal(a.proprietaires.length, 800);
assert.equal(a.nbRessources, 85);
assert.equal(a.verrouilles, 22);
assert.equal(a.tailleSon, 4300);
assert.deepEqual(JSON.parse(JSON.stringify(a.inventaire)), [{ idx: 0, obj: 709 }, { idx: 1, obj: 710 }, { idx: 2, obj: 711 }, { idx: 3, obj: 301 }, { idx: 4, obj: 300 }], "emplacements d'inventaire");
/* propriétaires : 15 = dans une salle ; les objets de départ des trois enfants appartiennent à un acteur */
assert.equal(a.proprietaires[17], 15);
assert.deepEqual([709, 710, 711, 300, 301].map((i) => a.proprietaires[i]), [2, 1, 3, 1, 1]);
assert.equal(a.proprietaires.filter((o) => o >= 1 && o <= 14).length, 5);
const b = S.lire(apres, P);
assert.equal(b.erreur, undefined);
assert.equal(b.vars[4], 37);
assert.ok(b.vars[11] > a.vars[11], "minuteur du moteur (variable 11) : il avance, c'est pourquoi les variables < 100 ne comptent pas");

/* 3. unités de progrès : au départ aucune (profil.depart) ; après le clic, un indicateur (800 + 151) ; jamais de retrait */
assert.deepEqual(JSON.parse(JSON.stringify(S.unites(a, P))), [], "début de partie : aucun AP gratuit");
assert.deepEqual(JSON.parse(JSON.stringify(S.unites(b, P))), [951], "un indicateur de plus (bit 151)");
assert.equal(S.unitesPossibles(P), 2848, "800 objets + 2 048 indicateurs");
assert.equal(Math.round(150000 / S.unitesPossibles(P)), 53, "parUnite du catalogue = plafond / unités possibles");
/* sans le départ : les 5 objets et 6 indicateurs de départ comptent bien comme unités du lecteur */
assert.equal(S.unites(a, Object.assign({}, P, { depart: {} })).length, 5 + 6);
/* les bits de départ sont les bons : 48, 78, 93, 100, 246, 352 */
const bitsA = []; for (let i = 0; i < 2048; i++) if (a.bits[i >> 3] & (1 << (i & 7))) bitsA.push(i);
assert.deepEqual(bitsA, [48, 78, 93, 100, 246, 352]);
/* variables de travail : les minuteurs changent entre les deux sauvegardes, aucune n'est une unité */
assert.ok(a.vars[247] !== b.vars[247] || a.vars[228] !== b.vars[228] || a.vars[118] !== b.vars[118], "variables de travail non stables (exclues des unités)");

/* 4. refus : rien n'est jamais deviné */
{
  const copie = (f) => { const c = new Uint8Array(debut); f(c); return c; };
  assert.equal(S.lire(copie((c) => { c[0] = 0x58; }), P).erreur, "ENTETE", "mauvais marqueur");
  assert.equal(S.lire(copie((c) => { c[8] = 123; }), P).erreur, "VERSION", "autre version de format");
  assert.equal(S.lire(copie((c) => { c[44] = 0x58; }), P).erreur, "VIGNETTE");
  assert.ok(S.lire(debut.slice(0, 80000), P).erreur, "fichier tronqué");
  assert.ok(S.lire(new Uint8Array(debut.length + 3).fill(0), P).erreur, "contenu vide");
  const plus = new Uint8Array(debut.length + 1); plus.set(debut);
  assert.equal(S.lire(plus, P).erreur, "QUEUE", "un octet de trop : la lecture n'est pas crédible");
  assert.equal(S.lire(debut, undefined).erreur, "PROFIL", "jeu sans profil");
  assert.equal(S.lire(debut, Object.assign({}, P, { verbes: 100 })).erreur !== undefined, true, "profil faux : refusé, pas de valeur devinée");
  assert.deepEqual(JSON.parse(JSON.stringify(S.unites({ erreur: "X" }, P))), []);
  assert.deepEqual(JSON.parse(JSON.stringify(S.unites(null, P))), []);
}

/* 5. aucune écriture, aucune lecture du DOM, aucune constante SOREAL non signalée dans le module */
{
  const nu = code.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(!/document\.|innerHTML|localStorage|fetch\(/.test(nu), "pur : aucun accès à la page ni au réseau");
  assert.ok(!/choix soreal|choix de soreal|choisie par soreal/i.test(code), "aucune constante SOREAL non inscrite au registre");
}

/* 6. catalogue : l'outil d'envoi valide le bloc ap (plafond et parUnite facultatifs mais numériques positifs) */
{
  const dossier = mkdtempSync(join(tmpdir(), "scv-cat-"));
  try {
    const essai = (ap) => {
      const f = join(dossier, "jeux.json");
      writeFileSync(f, JSON.stringify({ jeux: [Object.assign({ id: "dott", nom: "D", dossier: "DOTT", cible: "tentacle", difficulte: "normal" }, ap === undefined ? {} : { ap })] }));
      return spawnSync(process.execPath, ["cloudflare/tools/scummvm-envoyer.mjs", "catalogue", f, "--local", join(dossier, "m"), "--simuler"], { encoding: "utf8" });
    };
    assert.equal(essai().status, 0, "sans bloc ap : accepté");
    assert.equal(essai({ plafond: 150000, parUnite: 53 }).status, 0, "bloc valide");
    assert.equal(essai({}).status, 0, "plafond et parUnite facultatifs");
    assert.equal(essai({ plafond: 150000 }).status, 0);
    for (const mauvais of [{ plafond: 0 }, { plafond: -5, parUnite: 1 }, { plafond: "150000" }, { parUnite: 0 }, { parUnite: null }, { plafond: NaN }, [1], 5, null]) {
      const r = essai(mauvais);
      assert.equal(r.status, 2, "refusé : " + JSON.stringify(mauvais));
    }
  } finally { rmSync(dossier, { recursive: true, force: true }); }
}

console.log("idle-scummvm-sauvegarde-v1 OK");
