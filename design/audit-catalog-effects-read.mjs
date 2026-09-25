#!/usr/bin/env node
/*
 * Audit « catalogué mais non branché » (2026-09-24).
 *
 * Pour chaque perk / quirk / souhait catalogué, détermine par EXÉCUTION (pas par lecture) :
 *   1. quels champs des agrégateurs changent quand l'entrée est au niveau 1 (ou au maximum
 *      pour la Fibonacci Perk) : perkBonusesV1 / quirkBonusesV1 / wishBonusesV1, plus les
 *      agrégateurs parallèles des Cartes (idleCardsModifiersV1) et des Quêtes
 *      (idleQuestBonusTotalsV1) ;
 *   2. si chaque champ de perkBonusesV1 / quirkBonusesV1 / wishBonusesV1 est lu ailleurs dans
 *      cloudflare/src, sur une variable issue de CET agrégateur (`const perks = perkBonusesV1(..)`
 *      puis `perks.champ`, ou `perkBonusesV1(..).champ`) ;
 *   3. pour les entrées sans effet agrégé : si leur id est cité dans le code (lecture par id,
 *      dans cloudflare/src ou cloudflare/public), à proximité du mot wish / perk / quirk.
 * Pour la boutique Sellout : achetable ? passif ? id cité hors du catalogue ?
 *
 * Limite connue : la chaîne « champ agrégé -> variable -> autre objet -> consommateur » n'est pas
 * suivie au-delà de la première lecture (c'est ainsi que la perk 34 avait échappé : copiée dans
 * l'objet d'idleNguBonuses sous un autre nom, jamais relue). Le test de non-régression de la perk 34
 * est donc écrit à la main.
 *
 * Usage : node design/audit-catalog-effects-read.mjs   (liste)
 *         import { auditCatalogEffectsRead } from ... (test)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, "../cloudflare/src");
const PUBLIC = path.resolve(here, "../cloudflare/public");

function readJsFiles(dir, recursive) {
  const out = {};
  const walk = (d) => {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) { if (recursive) walk(p); }
      else if (f.name.endsWith(".js")) out[path.relative(dir, p).split(path.sep).join("/")] = fs.readFileSync(p, "utf8");
    }
  };
  walk(dir);
  return out;
}

function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function diffFields(now, baseline) {
  return Object.keys(now).filter((k) => JSON.stringify(now[k]) !== JSON.stringify(baseline[k]));
}

const plain = (o) => JSON.parse(JSON.stringify(o));

export async function auditCatalogEffectsRead() {
  const code = Object.fromEntries(Object.entries(readJsFiles(SRC, true)).map(([k, v]) => [k, stripComments(v)]));
  const publicCode = Object.values(readJsFiles(PUBLIC, false)).map(stripComments);
  const imp = (f) => import(pathToFileURL(path.join(SRC, f)).href);
  const perks = await imp("idle-perks-v1.js");
  const quirks = await imp("idle-quirks-v1.js");
  const wishes = await imp("idle-wishes-v1.js");
  const sellout = await imp("idle-sellout-shop-v1.js");
  const cards = await imp("idle-cards-v1.js");
  const quests = await imp("idle-questing-v1.js");

  /* Lecture d'un champ sur une variable issue de l'agrégateur `fnName`. */
  const fieldRead = (fnName, field, defFile) => {
    const reInline = new RegExp(fnName + String.raw`\([^;]*?\)\s*\??\.\s*` + field + String.raw`\b`);
    for (const [f, c] of Object.entries(code)) {
      if (f === defFile) continue;
      if (reInline.test(c)) return true;
      const vars = new Set();
      for (const m of c.matchAll(new RegExp(String.raw`(\w+)\s*=\s*` + fnName + String.raw`\(`, "g"))) vars.add(m[1]);
      for (const v of vars) {
        if (new RegExp(String.raw`\b` + v + String.raw`\s*\??\.\s*` + field + String.raw`\b`).test(c)) return true;
      }
    }
    return false;
  };
  const fieldReadLoose = (field, defFile) => Object.entries(code).some(([f, c]) => f !== defFile && new RegExp(String.raw`\.\s*` + field + String.raw`\b`).test(c));

  /* Un id numérique n'est « cité » que si les 200 caractères qui précèdent parlent de wish / perk / quirk (évite les tables d'ids d'objets). */
  const ID_PATTERN = String.raw`\[\s*["']?ID["']?\s*\]|\(\s*[^()]*,\s*ID\s*\)|\(\s*ID\s*\)|===?\s*ID\b|\bID\s*===?|[{,]\s*ID\s*:|\[[^\]]*\bID\b[^\]]*\]\s*\.(?:reduce|some|map|every)`;
  const idCited = (id, defFiles, kind) => {
    const re = new RegExp(ID_PATTERN.replaceAll("ID", String(id)), "g");
    const word = new RegExp(kind === "wishes" ? "wish" : kind === "quirks" ? "quirk" : "perk", "i");
    const hit = (cc) => {
      for (const m of cc.matchAll(re)) {
        if (word.test(cc.slice(Math.max(0, m.index - 200), m.index + m[0].length))) return true;
      }
      return false;
    };
    return Object.entries(code).some(([f, cc]) => !defFiles.includes(f) && hit(cc)) || publicCode.some(hit);
  };

  const report = { perks: [], quirks: [], wishes: [], sellout: [] };

  const mkState = (kind, levels) => {
    const st = { difficulty: "extreme", systems: { perks: { data: { levels: {} } }, quirks: { data: { levels: {} } }, wishes: { data: { tracks: {} } } } };
    if (kind === "wishes") st.systems.wishes.data.tracks = Object.fromEntries(Object.entries(levels).map(([id, lv]) => [id, { level: lv }]));
    else st.systems[kind].data.levels = levels;
    return st;
  };

  function audit(kind, catalog, agg, aggFn, aggFile, levelKey) {
    const baseAgg = plain(agg({}));
    const baseCards = plain(cards.idleCardsModifiersV1(mkState(kind, {})));
    const baseQuest = plain(quests.idleQuestBonusTotalsV1(mkState(kind, {})));
    for (const e of catalog) {
      const lv = Array.isArray(e.fibonacciMilestones) ? e[levelKey] : 1;
      const lvls = { [e.id]: lv };
      const aggIn = kind === "wishes" ? Object.fromEntries(Object.entries(lvls).map(([id, l]) => [id, { level: l }])) : lvls;
      const st = mkState(kind, lvls);
      const fields = diffFields(plain(agg(aggIn)), baseAgg);
      const viaCards = diffFields(plain(cards.idleCardsModifiersV1(st)), baseCards);
      const viaQuest = diffFields(plain(quests.idleQuestBonusTotalsV1(st)), baseQuest);
      const strictUnread = fields.filter((f) => !fieldRead(aggFn, f, aggFile));
      const looseUnread = strictUnread.filter((f) => !fieldReadLoose(f, aggFile));
      const noEffect = fields.length === 0 && viaCards.length === 0 && viaQuest.length === 0;
      report[kind].push({
        id: e.id, name: e.name, fields, viaCards, viaQuest, strictUnread, looseUnread,
        noEffect, idCited: noEffect ? idCited(e.id, [aggFile], kind) : null
      });
    }
  }

  audit("perks", perks.IDLE_PERKS_CATALOG_V1, perks.perkBonusesV1, "perkBonusesV1", "idle-perks-v1.js", "cap");
  audit("quirks", quirks.IDLE_QUIRKS_CATALOG_V1, quirks.quirkBonusesV1, "quirkBonusesV1", "idle-quirks-v1.js", "cap");
  audit("wishes", wishes.IDLE_WISHES_CATALOG_V1, wishes.wishBonusesV1, "wishBonusesV1", "idle-wishes-v1.js", "levels");

  for (const item of sellout.IDLE_SELLOUT_SHOP_CATALOG_V1) {
    const re = new RegExp(String.raw`["'.]` + item.id + String.raw`["']?\b`);
    const usedElsewhere = Object.entries(code).some(([f, c]) => f !== "idle-sellout-shop-v1.js" && re.test(c))
      || publicCode.some((c) => re.test(c));
    const fx = sellout.IDLE_SELLOUT_EFFECTS_V1[item.id];
    const buyable = sellout.idleSelloutShopEffectActiveV1(item);
    const passive = Boolean(fx && fx.passive);
    /* achetable + passif + id cité nulle part : l'AP est débité pour un effet que personne ne lit. */
    report.sellout.push({ id: item.id, name: item.name, buyable, passive, usedElsewhere, dangerous: buyable && passive && !usedElsewhere });
  }
  return report;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const r = await auditCatalogEffectsRead();
  for (const kind of ["perks", "quirks", "wishes"]) {
    console.log(`\n== ${kind} : champs d'agrégateur lus nulle part (strict) ==`);
    for (const e of r[kind].filter((x) => x.strictUnread.length)) {
      console.log(`  ${e.id} ${e.name} -> ${e.strictUnread.join(", ")}${e.looseUnread.length ? "  [JAMAIS lu, même en lecture large : " + e.looseUnread.join(", ") + "]" : ""}`);
    }
    console.log(`== ${kind} : aucun effet agrégé (ni Cartes, ni Quêtes) ET id jamais cité ==`);
    for (const e of r[kind].filter((x) => x.noEffect && !x.idCited)) console.log(`  ${e.id} ${e.name}`);
  }
  console.log("\n== sellout : achetable, passif, id cité nulle part (AP débités pour rien) ==");
  for (const e of r.sellout.filter((x) => x.dangerous)) console.log(`  ${e.id} ${e.name}`);
  console.log("== sellout : non achetable (catalogué, garde EFFET_BOUTIQUE_AP_INACTIF) ==");
  for (const e of r.sellout.filter((x) => !x.buyable)) console.log(`  ${e.id} ${e.name}`);
}
