/*
 * Prépare (SANS RIEN POUSSER EN PRODUCTION) la table de correspondance
 * "ID du Combat de Boss séquentiel -> vrai nom NGU", pour une Phase 2
 * future qui renommerait le catalogue IDLE_BOSS (actuellement stocké dans
 * le Durable Object idle_catalog, D1/SQLite embarqué, PAS un fichier de ce
 * dépôt -- alimenté via l'endpoint admin /api/admin/idle-catalog-replace,
 * protégé par le secret SOREAL_IDLE_CATALOG_SECRET que cette session n'a
 * pas et ne doit pas obtenir/deviner).
 *
 * Pourquoi ce script ne pousse rien : remplacer IDLE_BOSS demanderait de
 * VIDER puis réécrire la feuille entière (cf. design/push-idle-zones.mjs,
 * même endpoint) -- chaque ligne porte aussi Histoire/Conseil/MortVivant
 * SOREAL déjà écrits à la main (cf. commentaire "20 déjà en place, une
 * histoire et des capacités déjà bien écrites" dans
 * design/push-idle-boss-extension.mjs), que cette session n'a jamais pu
 * lire (pas d'accès en lecture au contenu actuel de ce Durable Object) et
 * ne doit donc jamais écraser à l'aveugle avec un remplacement complet.
 *
 * Ce script produit juste design/ngu-boss-fight-real-names-v1.json (ID ->
 * vrai nom + stats NGU sourcées), pour que la Phase 2 (avec accès au
 * contenu actuel de IDLE_BOSS et au secret) puisse fusionner en ne
 * touchant QUE la colonne Nom, jamais Histoire/Conseil/MortVivant.
 *
 * V2 (2026-09-18, Norman : "tu repars du premier boss, tu lis absolument
 * tout... boss 2 etc.") : la V1 ne couvrait que 245/301 id (limitée aux
 * boss ayant leur propre page {{Enemy}}). Complète maintenant les 56
 * manquants via parseBossFightsMasterTable (table "Boss listing" de la
 * page wiki "Boss Fights", qui liste les 301 entrées sur une seule page,
 * y compris celles sans page dédiée) -- 301/301 id couverts, nom
 * toujours sourcé du wiki, jamais deviné. Les stats bf_* restent null
 * pour les 56 complétés par la table maîtresse (cette table ne publie
 * les stats que jusqu'au boss 183, et de façon documentée comme corrompue
 * dès le boss 161 -- voir cloudflare/src/idle-ngu-boss-reference-v1.js,
 * qui reste l'unique source de vérité pour les stats numériques, jamais
 * dupliquée ici).
 *
 * Utilisation : node design/build-idle-boss-fight-real-names-v1.mjs
 */

import { writeFileSync } from 'node:fs';
import { parsePagesDirectory, parseBossFightsMasterTable } from './parse-ngu-wiki.mjs';

const PAGES_DIR = 'C:\\Users\\n0rma\\Documents\\NGU-Wiki\\pages';
const OUTPUT = new URL('./ngu-boss-fight-real-names-v1.json', import.meta.url);

const { parsed, skipped } = parsePagesDirectory(PAGES_DIR);
const fromPages = new Map();
for (const e of parsed) {
  if (e.bfNumber == null) continue;
  fromPages.set(e.bfNumber, {
    id: e.bfNumber,
    nom: e.title,
    bfHp: e.bfHp,
    bfPower: e.bfPower,
    bfToughness: e.bfToughness,
    bfHpRegen: e.bfHpRegen,
    bfExp: e.bfExp
  });
}

const masterTable = parseBossFightsMasterTable(PAGES_DIR);
let completedFromMasterTable = 0;
for (const { id, nom } of masterTable) {
  if (!fromPages.has(id)) {
    fromPages.set(id, { id, nom, bfHp: null, bfPower: null, bfToughness: null, bfHpRegen: null, bfExp: null });
    completedFromMasterTable++;
  }
}

const bossFights = [...fromPages.values()].sort((a, b) => a.id - b.id);

writeFileSync(OUTPUT, JSON.stringify(bossFights, null, 2) + '\n', 'utf8');

console.log('Combats de Boss séquentiels avec un vrai nom NGU sourcé :', bossFights.length, '/ 301');
console.log('  dont ' + fromPages.size.toString().padStart(3) + ' - ' + completedFromMasterTable + ' = ' + (fromPages.size - completedFromMasterTable) + ' depuis leur propre page {{Enemy}} (avec stats bf_*)');
console.log('  et ' + completedFromMasterTable + ' complétés depuis la table maîtresse "Boss Fights" (nom seul, pas de page dédiée)');
console.log('(pages ignorées par le parseur global : ' + skipped.length + ')');
console.log('Écrit dans :', OUTPUT.pathname.replace(/^\//, ''));
console.log('');
console.log('RAPPEL : ce fichier n\'est PAS poussé en production. Voir le');
console.log('commentaire en tête de ce script pour la marche à suivre en Phase 2.');
