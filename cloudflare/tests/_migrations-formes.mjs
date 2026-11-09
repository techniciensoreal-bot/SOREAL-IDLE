/*
 * Formes de sauvegarde (état « metaNgu ») utilisées par idle-migrations-v1.test.mjs et par la génération de references/migrations-avant.json.
 * Les formes anciennes sont CONSTRUITES à partir des deux parties de référence en défaisant ce que les migrations du registre font (jamais de valeur inventée : seulement des champs retirés ou abaissés).
 */
import fs from "node:fs";

export const MAINTENANT_FORMES = 1.76e12;
export const lireReference = (n) => JSON.parse(JSON.parse(fs.readFileSync(process.cwd() + "/cloudflare/tests/references/partie-reference-" + n + ".json", "utf8"))[37]).metaNgu;
const copie = (o) => JSON.parse(JSON.stringify(o));

export function construireFormes() {
  const r1 = lireReference(1), r2 = lireReference(2);
  const ctx = { bosses: 30, zone: 5, sets: 2, rebirths: 3 };
  const formes = [];
  formes.push({ nom: "reference-1", raw: copie(r1), ctx });
  formes.push({ nom: "reference-2", raw: copie(r2), ctx });
  /* Sans aucune version du registre (toutes les sauvegardes d'avant) : les références n'en ont pas, la forme est donc la même mais avec un autre contexte. */
  formes.push({ nom: "sans-etatVersion", raw: copie(r1), ctx: { bosses: 80, zone: 9, sets: 5, rebirths: 12 } });
  /* Modèle de ressources < 51 : réserve d'énergie libre absente, Yggdrasil avec réservations. */
  const rm50 = copie(r2);
  rm50.resourceModelVersion = 50;
  const ygg = rm50.systems.yggdrasil;
  if (ygg && ygg.data) ygg.data.reserved = { energy: 1000, magic: 250 };
  formes.push({ nom: "resourceModel-50", raw: rm50, ctx: Object.assign({ legacyEnergyIdle: 5000, legacyMagicIdle: 40 }, ctx) });
  const rm51 = copie(r1);
  rm51.resourceModelVersion = 51;
  if (rm51.systems.yggdrasil && rm51.systems.yggdrasil.data) rm51.systems.yggdrasil.data.reserved = { energy: 300, magic: 5 };
  formes.push({ nom: "resourceModel-51", raw: rm51, ctx });
  const rm0 = copie(r1);
  delete rm0.resourceModelVersion;
  formes.push({ nom: "resourceModel-absent", raw: rm0, ctx });
  /* Legacy : pas de saveSchema, ancienne version, suivis et systèmes à l'ancienne mode. */
  formes.push({
    nom: "legacy-sans-saveSchema",
    raw: {
      version: "META-V40-LEGACY", updatedAt: 1.7e12, runStartedAt: 1.69e12, difficulty: "difficile", difficultyPeaks: { normal: 3 },
      resources: { energy: { current: 123, cap: 5000 }, magic: { current: 7, cap: 300 }, r3: {} },
      currencies: { gold: 5e6, exp: 1200, ap: 4 }, records: { highestBoss: 22, totalRebirths: 2, newbieOffersUsed: ["x", 3, "y"], portrait: "default" },
      challenge: { completions: {}, bestMs: {} }, bank: { advancedTraining: 3, timeMachine: 9 },
      systems: {
        timeMachine: { unlocked: true, active: true, level: 4, tempLevel: 2, permanentLevel: 1, progress: 0.4, allocation: { energy: 50, magic: 10 } },
        advancedTraining: { unlocked: true, data: { tracks: { power: { level: 3, tempLevel: 1, progress: 0.2 }, wandoos: { level: 2, tempLevel: 1 } } } }
      }
    },
    ctx: { bosses: 25, zone: 4, sets: 1, rebirths: 2 }
  });
  formes.push({ nom: "legacy-schema-46", raw: Object.assign(copie(r1), { saveSchema: 46 }), ctx });
  formes.push({ nom: "vide", raw: {}, ctx: {} });
  formes.push({ nom: "null", raw: null, ctx: {} });
  return formes;
}
