import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { nomOrigineMobV1_, choisirCleBossR2ParNom_ } from "../src/idle-media-v1.js";
import { IDLE_ADVENTURE_MOB_BESTIARY_V1 } from "../src/idle-adventure-zones.js";

/*
 * Norman (2026-11-09) : « 743 poulets furieux et Un slime métallique n'apparaissent plus en Aventure, ils sont pourtant partout ailleurs ; avant ils apparaissaient : c'est un bug qui a été introduit ». Cause : depuis le 2026-11-07 le nom d'un ennemi d'Aventure
 * porte le NOUVEAU nom d'un boss renommé par l'administrateur ; l'image était retrouvée par ce nom, qui ne figure dans aucune table. Elle est maintenant retrouvée par le nom d'ORIGINE, déduit de la zone et du numéro du monstre (bestiaire).
 */
const boss = ["idle/bosses/Boss_084_The_Lummox.png", "idle/bosses/Boss_085_A_Metal_Slime.png", "idle/bosses/Boss_090_743_pissed_off_Cuckoos.png"];
const idx = (zone, nom, b = false) => IDLE_ADVENTURE_MOB_BESTIARY_V1[zone][b ? "boss" : "normal"].findIndex((m) => (typeof m === "string" ? m : m.name) === nom);

for (const [nom, fichier] of [["A Metal Slime", "Boss_085_A_Metal_Slime.png"], ["743 pissed off Cuckoos", "Boss_090_743_pissed_off_Cuckoos.png"]]) {
  let trouve = false;
  for (const b of [false, true]) {
    const i = idx("avsp", nom, b);
    if (i < 0) continue;
    trouve = true;
    assert.equal(nomOrigineMobV1_("avsp", b, i), nom, nom + " : le nom d'origine se déduit du numéro, quel que soit le nom affiché");
    const cle = choisirCleBossR2ParNom_(boss, nomOrigineMobV1_("avsp", b, i));
    assert.equal(cle.split("/").pop(), fichier, nom + " : image de boss retrouvée sans connaître le nouveau nom");
  }
  assert.ok(trouve, nom + " est dans le bestiaire de la zone");
  // le NOUVEAU nom, lui, ne mène à aucune image (c'était le bug)
  assert.equal(choisirCleBossR2ParNom_(boss, "Un slime métallique"), "", "un nom renommé n'est dans aucune table");
}
// tous les monstres de toutes les zones : le nom d'origine déduit est exactement celui du bestiaire
let n = 0;
for (const [zone, def] of Object.entries(IDLE_ADVENTURE_MOB_BESTIARY_V1)) for (const b of [false, true]) (def[b ? "boss" : "normal"] || []).forEach((m, i) => { assert.equal(nomOrigineMobV1_(zone, b, i), typeof m === "string" ? m : m.name); n += 1; });
assert.ok(n > 250, "tous les monstres vérifiés : " + n);
// valeurs invalides : jamais d'erreur, nom vide (le serveur retombe sur le nom demandé puis sur l'index)
for (const [z, b, s] of [["zone-inconnue", false, 0], ["avsp", false, -1], ["avsp", false, "x"], ["avsp", false, undefined], ["", false, 0]]) assert.equal(nomOrigineMobV1_(z, b, s), "");
// l'ordre dans le serveur : le nom demandé garde la priorité (comportement d'avant) ; s'il ne trouve rien (boss renommé), le nom d'origine ; puis l'index
const media = readFileSync("cloudflare/src/idle-media-v1.js", "latin1");
const f = media.slice(media.indexOf("async function adventureMob_("), media.indexOf("/* Safe zones par difficulté"));
const iDemande = f.indexOf("let key=nomDemande?choisirCleBossR2ParNom_("), iOrigine = f.indexOf("if(!key&&nomOrigine)key=choisirCleBossR2ParNom_("), iIndex = f.indexOf("choisirCleMobR2_(");
assert.ok(iDemande > 0 && iDemande < iOrigine && iOrigine < iIndex, "ordre : nom demandé, nom d'origine (repli), index");
// de bout en bout, avec un faux R2 : la requête réelle du jeu (nom RENOMMÉ + numéro du monstre) renvoie l'image du boss
{
  const { traiterRequeteIdleMedia } = await import("../src/idle-media-v1.js");
  const objets = (cles) => ({ objects: cles.map((key) => ({ key })), truncated: false });
  const R2 = {
    async list(o) {
      if (o.delimiter) return { delimitedPrefixes: ["idle/aventure/A_Very_Strange_Place/"], objects: [], truncated: false };
      if (o.prefix === "idle/bosses/") return objets(boss);
      return objets(["idle/aventure/A_Very_Strange_Place/avsp_safe_zone.webp"]);   // plus aucune image de monstre dans le dossier d'Aventure : seules celles des boss existent
    },
    async get() { return { body: "x", httpEtag: '"e"', writeHttpMetadata(h) { h.set("content-type", "image/png"); } }; }
  };
  const appel = (q) => traiterRequeteIdleMedia(new Request("https://soreal.test/api/idle/media/mob?zone=avsp&" + q), { SOREAL_R2: R2 });
  const iSlime = idx("avsp", "A Metal Slime"), iPoulets = idx("avsp", "743 pissed off Cuckoos");
  for (const [nom, i, fichier] of [["Un slime métallique", iSlime, "Boss_085_A_Metal_Slime.png"], ["743 poulets furax", iPoulets, "Boss_090_743_pissed_off_Cuckoos.png"], ["Une gelée métallique", iSlime, "Boss_085_A_Metal_Slime.png"], ["A Metal Slime", iSlime, "Boss_085_A_Metal_Slime.png"]]) {
    const r = await appel("boss=0&seed=" + i + "&name=" + encodeURIComponent(nom));
    assert.equal(r.status, 200, nom + " : une image est servie (avant le correctif : 404 pour un nom renommé)");
    assert.equal(r.headers.get("x-soreal-idle-r2-key"), "idle/bosses/" + fichier, nom);
  }
}
console.log("idle-adventure-mob-image-renomme-v1: OK");
