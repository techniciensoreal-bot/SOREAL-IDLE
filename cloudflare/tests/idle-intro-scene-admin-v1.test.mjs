import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { assurerHistoiresV1, lireHistoiresV1, enregistrerHistoireV1, supprimerHistoireV1, histoireDuBossV1, histoireIntroV1, urlImageEtapeV1, IDLE_INTRO_SEED_V1 } from "../src/idle-histoires-v1.js";

/* Norman (2026-10-23) : « dans le menu Admin, je veux pouvoir voir et éditer l'intro, ainsi que toutes les scènes qu'on va créer, avec les mêmes menus que ceux des boss ; une voix par image ». */
function base() {
  const db = new DatabaseSync(":memory:");
  return { exec(q, ...b) { const s = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return s.all(...b); s.run(...b); return []; } };
}
const intro = (sql) => lireHistoiresV1(sql).find((h) => h.id === "Intro");

// 1. L'intro est une scène du menu : 16 étapes, une par image, jamais déclenchée par un boss.
{
  const sql = base(); const h = intro(sql);
  assert.ok(h && h.etapes.length === 16 && h.boss === null && h.actif === true);
  assert.deepEqual(h.etapes.map((e) => e.image), Array.from({ length: 16 }, (_, i) => "intro:" + String(i + 1).padStart(2, "0")));
  assert.match(h.etapes[1].texte, /Quand tu reprends connaissance,/);
  assert.ok(h.etapes[15].texte.endsWith("te permettra de faire quelque chose d’amusant."));
  for (let n = 1; n <= 400; n += 1) assert.ok(!histoireDuBossV1(sql, n) || histoireDuBossV1(sql, n).id !== "Intro", "jamais jouée à la mort d'un boss");
}
// 2. Enregistrement : titre, boss et images imposés ; 16 étapes exigées ; les textes et voix changent.
{
  const sql = base(); const h = JSON.parse(JSON.stringify(intro(sql)));
  h.titre = "Autre"; h.boss = 5; h.etapes[0].texte = "(marius) Bloum."; h.etapes[0].affiche = "BLOUM !"; h.etapes[3].image = "pirate.png"; h.voix = ["0123456789abcd"];
  const r = enregistrerHistoireV1(sql, h);
  assert.equal(r.titre, "Intro — Le commencement"); assert.equal(r.boss, null); assert.equal(r.etapes[3].image, "intro:04");
  assert.equal(intro(sql).etapes[0].affiche, "BLOUM !"); assert.deepEqual(intro(sql).voix, ["0123456789abcd"]);
  h.etapes.pop();
  assert.throws(() => enregistrerHistoireV1(sql, h), /HISTOIRE_INTRO_16_ETAPES/);
}
// 3. Ne se supprime pas.
{ const sql = base(); assurerHistoiresV1(sql); supprimerHistoireV1(sql, "Intro"); assert.ok(intro(sql)); }
// 4. Ce que reçoit le diaporama : textes (jaune + dit), images, voix.
{
  const sql = base(); const h = JSON.parse(JSON.stringify(intro(sql))); h.etapes[2].affiche = "Jaune."; enregistrerHistoireV1(sql, h);
  const p = histoireIntroV1(sql);
  assert.equal(p.etapes.length, 16); assert.equal(p.etapes[2].affiche, "Jaune."); assert.equal(p.etapes[2].imageUrl, "/intro/03.webp?v=1"); assert.equal(urlImageEtapeV1("Intro", "intro:16"), "/intro/16.webp?v=1");
}
assert.equal(IDLE_INTRO_SEED_V1.etapes.length, 16);

// 5. Diaporama : textes du serveur ; voix par image seulement une fois des voix générées.
{
  const src = readFileSync("cloudflare/public/modules/intro-diaporama-v1.js", "utf8");
  const fen = { addEventListener() {}, matchMedia: () => ({ matches: false }) };
  const ctx = { window: fen, document: { getElementById: () => null, createElement: () => ({}), head: { appendChild() {} }, documentElement: { appendChild() {} } }, setTimeout: () => 0, clearTimeout() {}, Image: function () {}, Promise, console };
  vm.runInNewContext(src, ctx);
  const D = fen.__SOREAL_IDLE_INTRO_DIAPORAMA_V1__;
  const etapes = Array.from({ length: 16 }, (_, i) => ({ texte: "(marius) Phrase " + i + ".", affiche: i === 1 ? "Jaune un." : "", imageUrl: "/intro/" + String(i + 1).padStart(2, "0") + ".webp" }));
  D.appliquerServeur({ etapes, voix: [] });
  assert.equal(D.diapos[1].t, "Jaune un.", "cadre jaune"); assert.equal(D.diapos[2].t, "Phrase 2.", "texte dit sans ses balises");
  assert.equal(D.modeEtape(), false, "aucune voix générée : la voix de la page est conservée");
  D.appliquerServeur({ etapes, voix: ["0123456789abcd"] });
  assert.equal(D.modeEtape(), true, "voix générées : une voix par image");
  D.appliquerServeur({ etapes: etapes.slice(0, 5), voix: ["0123456789abcd"] });
  assert.equal(D.diapos.length, 16, "un envoi incomplet est ignoré");
}
// 6. Menu Admin : l'intro en premier, sans suppression ni images à changer ; découpe aux points sans voix déjà générée.
{
  const a = readFileSync("cloudflare/public/modules/admin-histoires-v1.js", "utf8");
  assert.ok(a.includes("function estIntro_(h)") && a.includes("(estIntro_(h)?'':'<button type=\"button\" class=\"soreal-idle-adm-btn-v1 danger\" data-adm-act=\"supprimer\""));
  assert.ok(a.includes("var intro=/^intro:(") && a.includes("'/intro/'+intro[1]+'.webp?v=1'"));
  assert.ok(a.includes("(voisee?[t.reste]:decouperPhrases_(t.reste))") && a.includes("function decouperPhrases_(texte)"), "une phrase = un personnage, sauf si une voix existe déjà");
}
console.log("idle-intro-scene-admin-v1 OK");
