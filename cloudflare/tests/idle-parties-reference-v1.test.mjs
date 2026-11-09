import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { creerMoteur, figerLeHasard, reglerHorloge, avancer } from "./_partie-reference.mjs";

/*
 * PARTIES DE RÉFÉRENCE (Norman, 2026-11-05 : reconstruction du projet « en conservant l'avancée de chaque joueur » ; plan design/ARCHITECTURE-CIBLE.md, § 4).
 * Une partie figée (anonymisée) + un scénario de jeu scripté (horloge gelée, hasard à graine) → un état attendu, enregistré dans tests/references/<nom>.attendu.json. Le moteur actuel est la RÉFÉRENCE ; toute reconstruction doit
 * reproduire ces états À L'IDENTIQUE (progression, ressources, niveaux), sinon l'avancée d'un joueur changerait.
 * Régénérer l'attendu (uniquement pour un changement de règle voulu et validé) : SOREAL_ECRIRE_REFERENCE=1 node cloudflare/tests/idle-parties-reference-v1.test.mjs
 */
const REFS = ["partie-reference-1", "partie-reference-2"];
const arrondi = (v) => (typeof v === "number" && Number.isFinite(v) ? Number(v.toPrecision(12)) : v);
const arrondir = (o) => (o && typeof o === "object" ? (Array.isArray(o) ? o.map(arrondir) : Object.fromEntries(Object.entries(o).map(([k, v]) => [k, arrondir(v)]))) : arrondi(o));
const hash = (o) => crypto.createHash("sha256").update(JSON.stringify(arrondir(o))).digest("hex").slice(0, 16);
const dataDe = (j, id) => (j.systemes.systems.find((x) => x.id === id) || { state: { data: {} } }).state.data;

function observer(r) {
  const j = r.joueur, s = j.systemes;
  const tm = dataDe(j, "timeMachine"), aug = dataDe(j, "augmentations"), at = dataDe(j, "advancedTraining");
  return arrondir({
    tm: { vitesse: [tm.speedLevel, tm.speedProgress], or: [tm.goldLevel, tm.goldProgress] },
    augments: Object.fromEntries(Object.entries(aug.pairs || {}).map(([id, p]) => [id, [p.level, p.upgradeLevel, p.progress, p.upgradeProgress]])),
    entrainementAvance: Object.fromEntries(Object.entries(at.tracks || at.skills || at || {}).filter(([, v]) => v && typeof v === "object" && "level" in v).map(([id, v]) => [id, [v.level, v.progress]])),
    or: s.currencies && s.currencies.gold,
    energie: j.energie, energieMax: j.energieMax,
    magie: s.resources && s.resources.magic && s.resources.magic.current,
    inventaire: { utilise: j.inventaireUtilise, libre: j.inventaireLibre, empreinte: hash(j.aventure) },
    boss: { actuel: j.bossActuel || j.bossNumero || null, pv: j.pvJoueur, vaincus: j.victoiresBoss || null },
    combat: { attaque: j.combatPrincipal && j.combatPrincipal.multiplicateurAttaqueTotal, defense: j.combatPrincipal && j.combatPrincipal.multiplicateurDefenseTotal, pvMax: j.pvJoueurMax },
    /* une empreinte PAR système : en cas d'écart, on voit tout de suite lequel a changé */
    systemes: Object.fromEntries(j.systemes.systems.map((x) => [x.id, hash(x.state && x.state.data)]))
  });
}

function jouer(ligne) {
  figerLeHasard();
  reglerHorloge(Date.parse(ligne[15]) + 60_000);
  const m = creerMoteur(ligne);
  const sync = () => m.run("synchroniserSorealIdle");
  const agir = (p) => m.run("agirProgressionSorealIdle", p);
  const obs = {};
  const point = (nom) => { obs[nom] = observer(sync()); };
  point("depart");
  for (const [nom, p] of [
    ["machine (énergie)", { action: "allocate", system: "timeMachine", resource: "energy", value: 1.5e6 }],
    ["machine (magie)", { action: "allocate", system: "timeMachine", resource: "magic", value: 3e5 }],
    ["augmentation", { action: "allocateAugment", pair: "scissors", upgrade: false, value: 1e6 }],
    ["entrainement avance", { action: "allocateAdvancedTraining", track: "power", value: 1e6 }],
    ["ngu", { action: "allocateNgu", ngu: "augments", value: 1e6 }],
    ["rituel", { action: "allocateRitual", ritual: "tack", value: 3e5 }]
  ]) { try { agir(p); } catch (e) { obs["refus " + nom] = String(e && e.message || e).slice(0, 60); } }
  point("apres allocations");
  /* combats d'Aventure (Norman, 2026-11-05 : l'avancée d'un joueur comprend ses butins) : départ puis résolution, comme le client */
  for (let i = 0; i < 6; i++) {
    try { agir({ action: "adventure", adventure: { action: "startZoneFight", restHp: sync().joueur.pvJoueur } }); avancer(1200); agir({ action: "adventure", adventure: { action: "resolveZoneFight", titanId: "", titanStarted: false } }); } catch (e) { obs["refus combat " + i] = String(e && e.message || e).slice(0, 60); break; }
  }
  point("apres combats d'aventure");
  for (const s of [2, 10, 60, 600]) { avancer(s * 1000); point("apres +" + s + " s"); }
  return JSON.parse(JSON.stringify(obs));   /* même forme que le fichier attendu (undefined disparaît) */
}

let verifiees = 0;
for (const nom of REFS) {
  const ligne = JSON.parse(fs.readFileSync("cloudflare/tests/references/" + nom + ".json", "utf8"));
  const a = jouer(ligne), b = jouer(ligne);
  assert.deepEqual(a, b, nom + " : le scénario est DÉTERMINISTE (même résultat deux fois de suite, horloge gelée, hasard à graine)");
  const fichier = "cloudflare/tests/references/" + nom + ".attendu.json";
  if (process.env.SOREAL_ECRIRE_REFERENCE === "1") { fs.writeFileSync(fichier, JSON.stringify(a, null, 1) + "\n"); console.log("attendu écrit : " + fichier); continue; }
  const attendu = JSON.parse(fs.readFileSync(fichier, "utf8"));
  /* Attendu régénéré le 2026-11-09 (anti-spoil, liste des systèmes filtrée) : seuls les systèmes non découverts et jamais bougés (empreinte de l'état vidé) et l'entraînement avancé à zéro (verrouillé) ont disparu ; toutes les autres valeurs sont identiques (comparé ligne à ligne avant régénération). */
  assert.deepEqual(a, attendu, nom + " : l'avancée de la partie de référence doit rester IDENTIQUE (progression, ressources, niveaux)");
  /* le scénario progresse vraiment : la référence ne serait qu'un état figé sinon */
  assert.notDeepEqual(a["apres +600 s"].systemes, a["apres allocations"].systemes, nom + " : la partie avance bien pendant 600 s");
  const avances = Object.keys(a["apres +600 s"].systemes).filter((id) => a["apres +600 s"].systemes[id] !== a["apres allocations"].systemes[id]);
  assert.ok(avances.length >= 4, nom + " : au moins quatre systèmes progressent pendant le scénario (" + avances.join(", ") + ")");
  verifiees += 1;
}
console.log("idle-parties-reference-v1: OK (" + verifiees + " partie(s) de référence)");
