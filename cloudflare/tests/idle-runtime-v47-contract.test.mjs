import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../src/idle-sqlite-runtime.js',import.meta.url),'utf8');

function block(name,nextMarker='\nfunction '){
  const start=source.indexOf(`function ${name}(`);
  assert.ok(start>=0,`${name} absent`);
  const next=source.indexOf(nextMarker,start+12);
  return source.slice(start,next>start?next:source.length);
}

assert.ok(source.includes("'GAME-V47-NGU-EARLY'"),'patchRuntime V47 absent');

const ctx=block('contexteMetaNguSorealIdle_');
assert.ok(ctx.includes('attackTrainingLevels'),'NUMBER doit utiliser les niveaux Basic Training attaque');
assert.ok(ctx.includes('metaRecords.totalRebirths'),'le compteur Rebirth doit venir du metaNgu V47');
assert.ok(ctx.includes('metaCurrencies.gold'),'l’or V47 doit venir de metaNgu');

const rb=block('renaitreSorealIdle');
assert.ok(rb.includes('rebirthIdleNguState('),'Rebirth V47 absent');
assert.ok(rb.includes('rebirthBasicTrainingStateV411('),'Basic Training doit reset au Rebirth');
assert.ok(rb.includes("code:'REBIRTH_TROP_TOT'"),'minimum 3 minutes absent');
assert.ok(rb.includes('c.ESSENCE_RENAISSANCE).setValue(0)'),'ancienne Essence doit rester neutralisée');
assert.ok(!rb.includes('recompenseRenaissanceSorealIdle_('),'ancien calcul Renaissance encore actif');
assert.ok(!rb.includes('essenceGagnee'),'ancienne Essence encore exposée');
assert.ok(!rb.includes('sortsConservesRenaissance'),'ancienne magie encore liée au Rebirth');

/*
 * Correctif 2026-09-14 (Norman : "quand on rebirth, la barre energie
 * tique toujours 1 fois par seconde. Dans NGU, quand on rebirth, elle
 * tique de plus en plus vite") — la vraie vitesse Energy (metaNgu,
 * survit au Rebirth par design NGU) n'était jamais recopiée vers la
 * colonne héritée PROD_SECONDE que le client utilise pour animer la
 * barre — contrairement à agirProgressionSorealIdle (le chemin
 * générique des autres actions), qui le fait déjà à chaque appel.
 */
assert.ok(
  rb.includes('idleNguResourceGenerationPerSecond(stats.metaNgu,"energy")') &&
  rb.includes('c.PROD_SECONDE).setValue('),
  'renaitreSorealIdle doit recalculer et réécrire PROD_SECONDE depuis la vraie vitesse Energy NGU après un Rebirth, sinon la barre reste figée à sa vitesse d’avant.'
);
assert.ok(
  rb.includes('c.ENERGIE_MAX).setValue(energieMaxApresRenaissance)'),
  'renaitreSorealIdle doit aussi resynchroniser ENERGIE_MAX depuis le vrai cap NGU (qui grandit naturellement à chaque Rebirth), pas un ENERGIE_BASE fixe.'
);

for(const name of [
  'acheterEntrainementsSorealIdle','acheterEntrainementSorealIdle',
  'acheterSortsSorealIdle','acheterSortSorealIdle','lancerSortSorealIdle',
  'ameliorerEquipementForgeSorealIdle','ameliorerEquipementsForgeSorealIdle',
  'agrandirInventaireSorealIdle','agrandirInventairePlusieursSorealIdle',
  'recyclerObjetSorealIdle','recyclerObjetsSorealIdle','fusionnerObjetSorealIdle',
  'definirCombatAutoAventureSorealIdle','combattreAventureSorealIdle'
]){
  const b=block(name);
  assert.ok(b.includes('SOREAL_IDLE_V47_LEGACY_DISABLED'),`${name} doit être neutralisé`);
}

/*
 * Audit 2026-09-17 : selectionnerZoneAventureSorealIdle était encore ici,
 * un stub mort de plus renvoyant SOREAL_IDLE_V47_LEGACY_DISABLED. Vérifié
 * qu'aucun consommateur réel ne subsistait nulle part (SOREAL-IDLE et
 * SOREAL-APP) avant suppression complète -- retiré, pas seulement
 * neutralisé, car un stub mort qui ne sert plus à rien n'a pas besoin de
 * continuer à exister. Ce test verrouille qu'il ne réapparaît pas.
 */
assert.ok(
  !source.includes('function selectionnerZoneAventureSorealIdle('),
  'selectionnerZoneAventureSorealIdle doit rester supprimé (stub mort sans consommateur réel, cf. audit 2026-09-17), pas seulement neutralisé.'
);
{
  const opsStart=source.indexOf('const IDLE_OPERATIONS={');
  assert.ok(opsStart>=0,'IDLE_OPERATIONS introuvable.');
  const opsEnd=source.indexOf('\n};',opsStart);
  const opsBlock=source.slice(opsStart,opsEnd>opsStart?opsEnd:opsStart+2000);
  assert.ok(
    !opsBlock.includes('selectionnerZoneAventureSorealIdle'),
    'selectionnerZoneAventureSorealIdle ne doit plus apparaître dans IDLE_OPERATIONS.'
  );
}

assert.ok(source.includes('function definirAllocationsEntrainementSorealIdle('),'Basic Training V41.1 doit rester actif');
assert.ok(source.includes('function agirProgressionSorealIdle('),'transport générique metaNgu doit rester actif');
assert.ok(source.includes('idleNguSnapshot('),'snapshot V47 doit rester exposé à l’APP');

console.log('SOREAL IDLE runtime V47 contract: OK');
