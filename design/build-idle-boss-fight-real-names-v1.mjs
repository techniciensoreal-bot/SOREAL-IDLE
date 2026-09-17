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
 * Utilisation : node design/build-idle-boss-fight-real-names-v1.mjs
 */

import { writeFileSync } from 'node:fs';
import { parsePagesDirectory } from './parse-ngu-wiki.mjs';

const PAGES_DIR = 'C:\\Users\\n0rma\\Documents\\NGU-Wiki\\pages';
const OUTPUT = new URL('./ngu-boss-fight-real-names-v1.json', import.meta.url);

const { parsed, skipped } = parsePagesDirectory(PAGES_DIR);
const bossFights = parsed
  .filter(e => e.bfNumber != null)
  .sort((a, b) => a.bfNumber - b.bfNumber)
  .map(e => ({
    id: e.bfNumber,
    nom: e.title,
    bfHp: e.bfHp,
    bfPower: e.bfPower,
    bfToughness: e.bfToughness,
    bfHpRegen: e.bfHpRegen,
    bfExp: e.bfExp
  }));

writeFileSync(OUTPUT, JSON.stringify(bossFights, null, 2) + '\n', 'utf8');

console.log('Combats de Boss séquentiels avec un vrai nom NGU sourcé :', bossFights.length);
console.log('Plage id couverte :', bossFights[0]?.id, '->', bossFights[bossFights.length - 1]?.id);
console.log('(pages ignorées par le parseur global : ' + skipped.length + ')');
console.log('Écrit dans :', OUTPUT.pathname.replace(/^\//, ''));
console.log('');
console.log('RAPPEL : ce fichier n\'est PAS poussé en production. Voir le');
console.log('commentaire en tête de ce script pour la marche à suivre en Phase 2.');
