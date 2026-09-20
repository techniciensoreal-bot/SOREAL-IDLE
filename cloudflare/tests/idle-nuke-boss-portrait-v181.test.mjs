import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);

assert.match(
  source,
  /function idImageBossCanoniqueIdleV181_\(j\)[\s\S]{0,500}j&&j\.bossSelection[\s\S]{0,300}if\(selection>0\)return selection;/,
  "L'image Fight Boss doit utiliser bossSelection en priorité."
);

assert.match(
  source,
  /j\.bossImage\|\|urlBossR2IdleV1_\(idImageBossCanoniqueIdleV181_\(j\)\)/,
  "Le rendu initial du portrait doit utiliser l'id canonique du boss."
);

assert.match(
  source,
  /chargerImageBossIdleV36_\([\s\S]{0,180}idImageBossCanoniqueIdleV181_\(j\)/,
  "Le correctif async du portrait doit utiliser le même id canonique."
);

assert.match(
  source,
  /catalogue\.forEach\([\s\S]{0,700}boss&&boss\.numero[\s\S]{0,300}index\+1[\s\S]{0,300}idleBossImageCacheV36\[[\s\S]{0,120}String\(numero\)/,
  "Le préchargement doit indexer les portraits par numéro canonique, jamais par id brut/nom."
);

const preloadStart=source.indexOf("function prechargerCatalogueCombatIdleV61_");
const preloadEnd=source.indexOf("\n      function ",preloadStart+20);
const preload=source.slice(preloadStart,preloadEnd);
assert.doesNotMatch(
  preload,
  /urlBossR2IdleV1_\(\s*boss&&boss\.id\s*\)/,
  "Le préchargement ne doit plus utiliser boss.id brut."
);
assert.doesNotMatch(
  preload,
  /idleBossImageCacheV36\[\s*String\(boss\.nom\)/,
  "Le cache portrait ne doit plus être indexé par nom."
);

const loaderStart=source.indexOf("function chargerImageBossIdleV36_");
const loaderEnd=source.indexOf("\n      function ",loaderStart+20);
const loader=source.slice(loaderStart,loaderEnd);
assert.match(
  loader,
  /const cacheKey=[\s\S]{0,100}String\(numero\)/,
  "Le chargeur doit indexer le cache par numéro de boss."
);
assert.doesNotMatch(
  loader,
  /idleBossImageCacheV36\[nom\]/,
  "Le chargeur ne doit plus réutiliser une image uniquement parce que le nom correspond."
);

console.log("NUKE boss portrait identity V181: OK");
