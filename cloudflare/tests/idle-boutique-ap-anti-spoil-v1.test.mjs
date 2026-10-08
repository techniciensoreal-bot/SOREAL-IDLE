import assert from 'node:assert/strict';
import fs from 'node:fs';

const ui = fs.readFileSync('cloudflare/public/soreal-idle-ui.js', 'utf8');
const meta = fs.readFileSync('cloudflare/public/modules/meta-progression-v130.js', 'utf8');
const themes = fs.readFileSync('cloudflare/public/soreal-idle-themes.css', 'utf8');
const ngu = fs.readFileSync('cloudflare/public/modules/ngu-labo-v1.js', 'utf8');
const catalogue = fs.readFileSync('cloudflare/src/idle-sellout-shop-v1.js', 'utf8');

/* Boutique AP : tout article lié à un système verrouillé est caché (Norman, 2026-10-08). */
const carte = ui.match(/const IDLE_AP_SYSTEME_DE_L_ARTICLE_V1=\{([\s\S]*?)\n      \};/)[1];
const liens = {};
for (const m of carte.matchAll(/(\w+):'(\w+)'/g)) liens[m[1]] = m[2];
for (const id of ['icarusFertilizer1', 'icarusFertilizer10', 'icarusFertilizer100', 'yggdrasilHarvestLight', 'heartBrown']) assert.equal(liens[id], 'yggdrasil', id);
assert.equal(liens.littleBluePill1000, 'tower');
assert.equal(liens.beastButter1, 'questing');
assert.equal(liens.resource3PotionAlpha, 'hacks');
assert.equal(liens.magicPotionAlpha, 'bloodMagic');
assert.equal(liens.pp25, 'tower');
/* chaque article du catalogue lié à un système connu est dans la table : on vérifie les mots-clés révélateurs */
const ids = [...catalogue.matchAll(/\{ id: "(\w+)", category/g)].map((m) => m[1]);
for (const id of ids) {
  if (/ygg|fertilizer|bluepill|beast|resource3|magic|digger|beard|macguffin|daycare|wish|quest|card|deck|tag|mayo|ngu/i.test(id)) assert.ok(liens[id], id + ' doit être lié à un système');
}
assert.ok(!/filter\(function\(item\)\{return item&&item\.effectActive===true;\}\)/.test(ui), 'plus de filtre qui ignore le système débloqué');
assert.ok((ui.match(/articleApVisibleIdleV1_\(j,item\)/g) || []).length >= 2, 'page et point rouge utilisent la même règle');

/* Plus de légende explicative pour le champ Input */
assert.ok(!meta.includes('la quantité déplacée à chaque clic'), 'légende Input retirée');

/* Money Pit : l'image a la largeur de la rangée de boutons sur PC */
assert.match(themes, /moneyPit"\] :is\(\.soreal-idle-money-actions-v206,\.soreal-idle-money-scene-v206,/);

/* NGU : nuit étoilée dense et fond en parallaxe */
assert.match(ngu, /i<240;/, 'beaucoup d’étoiles');
assert.match(ngu, /\*0\.5\)\.toFixed\(1\)/, 'le fond défile moitié moins vite');
console.log('idle-boutique-ap-anti-spoil-v1: OK');

/* Borne : nom du boss centré, XP discrète ; Wandoos : la réponse du serveur ne reconstruit plus la page (Norman, 2026-10-08) */
const itopod = fs.readFileSync('cloudflare/public/soreal-idle-itopod.css', 'utf8');
assert.match(itopod, /duel-nameplate-v65\.boss\{text-align:center!important/, 'nom du boss centré');
assert.match(itopod, /xp-borne-v1 \.soreal-idle-chip-v8\{font-size:\.62em!important/, 'XP plus petite');
assert.match(meta, /payload\.action==='allocate'&&payload\.system==='wandoos'/, 'Wandoos : pas de rendu complet');
assert.match(fs.readFileSync('cloudflare/public/modules/wandoos-retro-v1.js', 'utf8'), /rafraichir:rafraichirPoste_/, 'Wandoos expose le rafraîchissement du poste');
console.log('idle-boutique-ap-anti-spoil-v1 (borne, Wandoos): OK');
assert.match(itopod, /rotateX\(24deg\) scaleX\(1\.06\)/, 'boutons de la borne en trapèze penché');
