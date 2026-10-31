// Norman (2026-10-29) : nettoyer le Coffre (après l'accident) ou la Valise (après le vomi) rapporte de 1 à 100 AP au hasard, et très très rarement (0,05 %) 5 000 AP, qu'on voit s'envoler du Coffre ou de la Valise : « +N AP ».
import fs from "node:fs";
import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { IDLE_NETTOYAGE_AP_MAX_V1, IDLE_NETTOYAGE_CHANCE_RARE_V1, IDLE_NETTOYAGE_AP_RARE_V1, IDLE_NETTOYAGE_ESPACEMENT_MS_V1 } from "../src/idle-ngu-actions.js";

assert.equal(IDLE_NETTOYAGE_AP_MAX_V1, 100); assert.equal(IDLE_NETTOYAGE_CHANCE_RARE_V1, 0.0005); assert.equal(IDLE_NETTOYAGE_AP_RARE_V1, 5000);
const ctx = { bosses: 100, basicTrainingComplete: true };
const frais = () => normalizeIdleNguState({ difficulty: "extreme" }, ctx, 0);
let cx = ctx;
const tire = (valeurs) => { let i = 0; cx = Object.assign({}, ctx, { alea: () => valeurs[Math.min(i++, valeurs.length - 1)] }); };
try {
  // 1. gain ordinaire : de 1 à 100, versé tel quel (pas de bonus d'AP : le « +N AP » vu est ce qui est gagné)
  for (const [alea, attendu] of [[0.999999, 100], [0.5, 51], [0, 1], [0.0099, 1], [0.0101, 2]]) {
    tire([0.5, alea]);   // 0,5 : pas le gain rare ; puis le tirage du montant
    const s = frais(); const avant = s.currencies.ap;
    const r = applyIdleNguAction(s, { action: "cleanMess", lieu: "coffre" }, cx, 1000);
    assert.equal(r.result.ap, attendu, "montant pour " + alea); assert.equal(r.result.rare, false); assert.equal(r.result.lieu, "coffre");
    assert.equal(r.state.currencies.ap - avant, attendu, "AP versés tels quels");
  }
  // 2. gain exceptionnel : 0,05 % de chance, 5 000 AP
  tire([0.0004999]);
  let r = applyIdleNguAction(frais(), { action: "cleanMess", lieu: "valise" }, cx, 1000);
  assert.equal(r.result.ap, 5000); assert.equal(r.result.rare, true); assert.equal(r.result.lieu, "valise");
  tire([0.0005, 0.5]);   // juste au-dessus du seuil : gain ordinaire
  r = applyIdleNguAction(frais(), { action: "cleanMess", lieu: "valise" }, cx, 1000);
  assert.equal(r.result.rare, false); assert.ok(r.result.ap >= 1 && r.result.ap <= 100);
  // 3. un lieu inconnu retombe sur le Coffre ; deux nettoyages trop rapprochés : le second est refusé, après l'espacement il passe
  tire([0.5, 0.3, 0.5, 0.3, 0.5, 0.3]);
  r = applyIdleNguAction(frais(), { action: "cleanMess", lieu: "n'importe quoi" }, cx, 1000);
  assert.equal(r.result.lieu, "coffre");
  const s2 = r.state;
  assert.throws(() => applyIdleNguAction(s2, { action: "cleanMess", lieu: "coffre" }, cx, 1000 + IDLE_NETTOYAGE_ESPACEMENT_MS_V1 - 1000), /NETTOYAGE_TROP_RAPIDE/);
  const r3 = applyIdleNguAction(s2, { action: "cleanMess", lieu: "valise" }, cx, 1000 + IDLE_NETTOYAGE_ESPACEMENT_MS_V1 + 1);
  assert.ok(r3.result.ap >= 1);
  assert.equal(r3.state.records.nettoyagesAP, 2, "compteur de nettoyages primés");
  // 4. la loi des grands nombres : la moyenne est proche de celle d'un tirage 1..100 (≈ 50,5), sans gain rare dans l'échantillon
  cx = ctx;
  let somme = 0, n = 4000, rares = 0;
  for (let i = 0; i < n; i++) { const x = applyIdleNguAction(frais(), { action: "cleanMess", lieu: "coffre" }, cx, 1000).result; somme += x.ap; if (x.rare) rares++; }
  const moyenne = (somme - rares * 5000) / (n - rares);
  assert.ok(moyenne > 47 && moyenne < 54, "moyenne des gains ordinaires : " + moyenne);
  assert.ok(rares <= 12, "le gain exceptionnel reste très rare : " + rares + " sur " + n);
} finally { cx = ctx; }

// 5. câblage côté page : la flaque du Coffre et le vomi de la Valise réclament la récompense ; la réponse du moteur fait s'envoler le « +N AP »
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
assert.ok(lire("cloudflare/public/modules/coffre-accident-v1.js").includes("prime.reclamer('coffre',coffre_())"), "Coffre nettoyé");
assert.ok(lire("cloudflare/public/modules/valise-accident-v1.js").includes("prime.reclamer('valise',elVomi)") && lire("cloudflare/public/modules/valise-accident-v1.js").includes("if(niveau<=0){try{var prime"), "Valise nettoyée (dernier passage)");
assert.ok(lire("cloudflare/public/modules/meta-progression-v130.js").includes("payload.action==='cleanMess'&&res.resultat&&Number(res.resultat.ap)>0") && lire("cloudflare/public/modules/meta-progression-v130.js").includes("'soreal-nettoyage-ap'"), "événement posé à la réponse du moteur");
const module = lire("cloudflare/public/modules/nettoyage-ap-v1.js");
assert.ok(module.includes("f({action:'cleanMess',lieu:String(lieu||'coffre')})") && module.includes("font:400 34px") && module.includes("'.nap-v1.rare{font-size:56px;"), "action envoyée, texte et gain exceptionnel plus gros");
assert.ok(/<script defer src="\/modules\/nettoyage-ap-v1\.js\?v=\d+"><\/script>/.test(lire("cloudflare/public/index.html")), "module chargé");
// Norman (2026-10-31) : le joueur ne voit que « +N AP » ; la phrase comique est pour les autres (voir idle-flux-nettoyage-ap-v1.test.mjs).
{
  const src = lire("cloudflare/public/modules/nettoyage-ap-v1.js");
  assert.ok(!src.includes("PHRASES") && !src.includes("montrerPhrase") && !src.includes("Sébastien a du") && !src.includes("nap-phrase-v1{"), "aucune phrase comique chez le joueur : seulement le gain");
  assert.ok(src.includes("window.__nettoyageApDernierIdleV1__={n:"), "le gain et le lieu partent avec le prochain battement");
}
console.log("idle-nettoyage-ap-v1 : OK");
