/*
 * Compare, cellule par cellule, la table « tier suivant » de la page Cards du wiki local (14 types x 18 ratios + TOTAL + TOTAL(pen))
 * à la formule du moteur (idleCardBonusPctV1), ainsi que les constantes C1..C4.
 * Constat (2026-09-24) : la table est calculée avec une rareté de 1,2 (la plus haute), bien que le texte annonce « 1.0 rarity (Meh) ».
 *   ratio(T -> T+1) = b(T+1) / b(T) ; TOTAL(pen) = b(Tmax) / b(1) ; TOTAL = b(Tmax - 2) / b(1), Tmax = 1 + nombre de ratios publiés.
 * Usage : node design/wiki-cards-table-check.mjs [--fixtures]
 */
import fs from "node:fs";
import { IDLE_CARDS_TYPES_V1, idleCardBonusPctV1 } from "../cloudflare/src/idle-cards-v1.js";

const WIKI = process.env.NGU_WIKI_DIR || "C:/Users/n0rma/Documents/NGU-Wiki";
const j = JSON.parse(fs.readFileSync(WIKI + "/pages/Cards.json", "utf8"));
const text = (j.__expandedWikitext || "").replace(/<[^>]+>/g, " ");
const start = text.indexOf("!Tier!!1→2");
const tableText = text.slice(start, text.indexOf("\n|}", start));
const rows = tableText.split(/\n\|-\s*\n/).slice(1).map((r) => r.replace(/^\|/, "").split("||").map((c) => c.trim()));

const CODE = { "E-NGU": "energyNgu", "M-NGU": "magicNgu", WANDOOS: "wandoos", AUGS: "augments", TM: "timeMachine", HACKS: "hacks", WISHES: "wishes", "A/D": "stats", ADV: "adventure", DROPS: "drop", GOLD: "gold", DAYCARE: "daycare", PP: "pp", QP: "qp" };
const parsed = [];
for (const cells of rows) {
  const id = CODE[cells[0]];
  if (!id) continue;
  const values = cells.slice(1).map((c) => (c === "-" ? null : Number(c.replace(/,/g, ""))));
  const ratios = values.slice(0, 18).filter((v) => v !== null);
  parsed.push({ code: cells[0], id, ratios, total: values[18], totalPen: values[19] });
}
console.log("types lus :", parsed.length);

const R = 1.2;
const b = (id, t) => idleCardBonusPctV1(id, t, R, 100);
let ok = 0;
const fixtures = [];
for (const p of parsed) {
  const problems = [];
  p.ratios.forEach((w, i) => {
    const mine = b(p.id, i + 2) / b(p.id, i + 1);
    if (Math.abs(mine - w) > 0.0051) problems.push(`ratio ${i + 1}->${i + 2} : ${mine.toFixed(3)} contre ${w}`);
  });
  const tmax = 1 + p.ratios.length;
  const totalPen = b(p.id, tmax) / b(p.id, 1);
  const total = b(p.id, tmax - 2) / b(p.id, 1);
  const relOk = (a, w) => Math.abs(a - w) <= Math.max(0.006, Math.abs(w) * 1e-4);
  if (!relOk(totalPen, p.totalPen)) problems.push(`TOTAL(pen) ${totalPen.toFixed(3)} contre ${p.totalPen}`);
  if (!relOk(total, p.total)) problems.push(`TOTAL ${total.toFixed(3)} contre ${p.total}`);
  fixtures.push([p.id, p.ratios, p.total, p.totalPen]);
  if (problems.length) console.log(p.code + " : " + problems.join(" ; ")); else ok++;
}
console.log("conformes :", ok, "sur", parsed.length);
if (process.argv.includes("--fixtures")) console.log(JSON.stringify(fixtures));
