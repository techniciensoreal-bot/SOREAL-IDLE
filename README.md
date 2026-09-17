# SOREAL IDLE

Moteur de jeu du mini-jeu idle inspiré de [NGU Idle](https://ngu-idle.fandom.com/),
intégré à SOREAL. Ce dépôt contient uniquement le **serveur** (un Worker
Cloudflare avec un Durable Object SQLite) — pas d'interface.

## Où vit le reste

- **Interface** (HTML/JS joué par les employés) : `Soreal_Idle_UI.html`
  dans le dépôt **SOREAL-APP**.
- **Point d'entrée réseau réel** : le client n'appelle pas ce Worker
  directement. Il appelle une route sur le Worker SOREAL-APP ou SOREAL-TV
  (`/api/app/idle/call` / `/api/tv/idle/call`), qui relaie vers ce dépôt
  via un binding Durable Object cross-script nommé `SOREAL_IDLE`. Voir
  [AGENTS.md](./AGENTS.md) pour le détail exact du chemin.

## Structure

```
cloudflare/
  src/
    idle-sqlite-runtime.js       moteur principal + shim "Apps Script sur SQLite"
    idle-adventure-v47.js        mode Adventure (zones, mobs, combat)
    idle-ngu-progression.js      progression NGU (NGUs, meta-monnaies, rebirth)
    idle-basic-training.js       Basic Training (Attack/Defense manuels)
    idle-*-v1.js                 systèmes annexes (perks, quirks, wishes, sellout shop, boss reference, big numbers)
    index-idle-coordinator-v1.js Durable Object (SorealIdleCoordinatorV1)
    idle-worker-entry-v1.js      point d'entrée du Worker
  tests/
    idle-*.test.mjs              un fichier par sujet, aucun framework de test
wrangler.jsonc                   config du Worker "soreal-idle"
.github/workflows/cloudflare-deploy.yml   déploiement CI
```

## Tests

Pas de runner ni de framework — chaque fichier est un script Node.js
autonome qui s'exécute avec `node` directement et affiche `OK` (ou lève une
`AssertionError`) :

```sh
node cloudflare/tests/idle-runtime.test.mjs
```

Pour lancer toute la suite :

```sh
for f in cloudflare/tests/*.test.mjs; do node "$f" || echo "FAIL: $f"; done
```

La CI (`.github/workflows/cloudflare-deploy.yml`) exécute exactement cette
boucle avant de déployer — un test rouge en local sera rouge en CI.

## Déploiement

Un push sur `main` qui touche `cloudflare/**` ou `wrangler.jsonc` déclenche
`.github/workflows/cloudflare-deploy.yml` : suite de tests, puis
`wrangler deploy --config wrangler.jsonc`. Il n'y a qu'un seul
environnement (pas de palier staging séparé pour ce dépôt) — voir
[AGENTS.md](./AGENTS.md#déploiement).

## Contribuer

Voir [AGENTS.md](./AGENTS.md) avant tout changement, en particulier :
- la règle de fidélité au wiki NGU Idle (jamais de valeur de jeu inventée) ;
- le risque de rupture silencieuse entre ce dépôt et SOREAL-APP (aucun
  contrat de version partagé sur les noms d'opération / champs de réponse) ;
- le shim "classeur SQLite façon Google Sheets" (`idle_catalog`,
  `IdleSheet`/`IdleSpreadsheet`, `SpreadsheetApp`/`LockService`) qui
  explique pourquoi des API Apps Script apparaissent dans un Worker
  Cloudflare.
