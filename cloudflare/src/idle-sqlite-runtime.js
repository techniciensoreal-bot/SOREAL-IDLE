import { sqlRows, safeJson, jsonText } from "./core/sqlite-core.js";
import {
  BASIC_TRAINING_V411,
  createBasicTrainingStateV411,
  normalizeBasicTrainingStateV411,
  advanceBasicTrainingStateV411,
  rebirthBasicTrainingStateV411,
  nextBasicTrainingCapV411,
  totalBasicTrainingAllocationV411,
  isBasicTrainingSkillUnlockedV411,
  deriveBasicTrainingStatsV411,
  applyBasicTrainingAllocationsV411,
  basicTrainingSnapshotV411
} from "./idle-basic-training.js";
import {
  IDLE_NGU_META_VERSION,
  normalizeIdleNguState,
  syncIdleNguState,
  idleNguBonuses,
  idleNguEffectiveResourceStat,
  idleNguSnapshot,
  idleNguResourceBudget,
  idleNguResourceGenerationPerSecond,
  applyIdleNguAction,
  rebirthIdleNguState,
  REBIRTH_UNLOCK_BOSS_V1
} from "./idle-ngu-progression.js";
import { nguBossStatsV1, nguBossFtbeBonusXpV1 } from "./idle-ngu-boss-reference-v1.js";
import NGU_BOSS_NAMES_FR_V1_SOURCE from "../../design/ngu-boss-names-fr.json" with { type: "json" };
import {
  IDLE_ADVENTURE_ZONES,
  IDLE_ADVENTURE_MOB_CATALOG_V1,
  IDLE_ADVENTURE_MOB_BESTIARY_V1,
  normalizeIdleAdventureStateV47,
  idleAdventureMobBestiaryEntryV1
} from "./idle-adventure-v47.js";

/* SOREAL IDLE — runtime Cloudflare SQLite steady-state. */

/*
 * Audit 2026-09-17 (risque cross-repo SOREAL-IDLE / SOREAL-APP, aucun
 * contrat de version partagé entre les deux dépôts — voir AGENTS.md
 * section "Relation avec SOREAL-APP / SOREAL-TV") : ce nombre entier
 * décrit la compatibilité du CONTRAT client/serveur (noms d'opérations,
 * forme des réponses, arguments attendus), PAS le build en cours
 * d'exécution — ça, c'est déjà couvert par `bridgeAssetVersion`/
 * `IDLE_TEST_VERSION` côté SOREAL-APP (badge visuel ajouté le même jour,
 * un identifiant différent pour un besoin différent : "quel code exact
 * tourne" vs. "le client comprend-il encore l'API").
 *
 * `IDLE_CLIENT_PROTOCOL_VERSION` (Soreal_Idle_UI.html, SOREAL-APP) doit
 * toujours être égal à cette constante. Exposée au client dans la
 * réponse de `obtenirAccesSorealIdle` (premier appel fait à l'ouverture
 * du module IDLE) sous `protocolVersion`. Le client compare et, en cas
 * de désaccord, affiche un message calme invitant à recharger la page
 * (pas de crash, pas de comportement silencieusement cassé) plutôt que
 * de continuer avec des hypothèses de forme de réponse potentiellement
 * fausses.
 *
 * À incrémenter UNIQUEMENT pour un changement cassant du contrat, par
 * exemple :
 *   - un champ de réponse exposé au client est renommé ou retiré ;
 *   - la forme d'une réponse change (ex. un champ change de type, une
 *     structure imbriquée est aplatie/réorganisée) ;
 *   - les arguments attendus par une opération existante changent
 *     (ordre, nombre, type) ;
 *   - un nom d'opération appelé par le client est renommé/supprimé.
 *
 * NE PAS incrémenter pour :
 *   - l'ajout d'un nouveau champ optionnel à une réponse existante
 *     (additif, non cassant — c'est le cas de `protocolVersion`
 *     lui-même dans ce commit : la valeur reste à 1) ;
 *   - l'ajout d'une nouvelle opération dans IDLE_OPERATIONS ;
 *   - un refactor interne qui ne change aucune forme observable côté
 *     client (renommage de fonction privée, réorganisation de fichier,
 *     optimisation de calcul...).
 *
 * Bumper la valeur ici ET dans SOREAL-APP (`IDLE_CLIENT_PROTOCOL_VERSION`
 * dans Soreal_Idle_UI.html) dans le même effort de travail que le
 * changement cassant lui-même — jamais après coup.
 */
const IDLE_PROTOCOL_VERSION=1;

const NGU_BOSS_NAMES_FR_V1 = new Map(
  NGU_BOSS_NAMES_FR_V1_SOURCE.map((entry) => [
    Number(entry.id),
    String(entry.nomFr || entry.nomEn || "Boss"),
  ])
);

let __idleRuntimeUser=null;
let __idleWorkbook=null;
const __idleCacheStore=new Map();

function __idleKey(v){
  return String(v==null?"":v)
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().replace(/[^a-z0-9@._+-]+/g," ")
    .replace(/\s+/g," ").trim();
}
function __idleNonEmpty(v){return !(v===""||v==null);}

class IdleRange {
  constructor(sheet,row,col,numRows=1,numCols=1){
    this.sheet=sheet;
    this.row=Math.max(1,Number(row)||1);
    this.col=Math.max(1,Number(col)||1);
    this.numRows=Math.max(1,Number(numRows)||1);
    this.numCols=Math.max(1,Number(numCols)||1);
  }
  getValues(){
    const out=[];
    for(let r=0;r<this.numRows;r++){
      const row=[];
      for(let c=0;c<this.numCols;c++)row.push(this.sheet.getCell(this.row+r,this.col+c));
      out.push(row);
    }
    return out;
  }
  getValue(){return this.sheet.getCell(this.row,this.col);}
  setValue(value){this.sheet.setCell(this.row,this.col,value);return this;}
  setValues(values){
    for(let r=0;r<this.numRows;r++){
      for(let c=0;c<this.numCols;c++){
        const value=Array.isArray(values?.[r])&&c<values[r].length?values[r][c]:"";
        this.sheet.setCell(this.row+r,this.col+c,value);
      }
    }
    return this;
  }
  clearContent(){
    for(let r=0;r<this.numRows;r++)for(let c=0;c<this.numCols;c++)this.sheet.setCell(this.row+r,this.col+c,"");
    return this;
  }
}

class IdleSheet {
  constructor(name,rows){
    this.name=String(name||"");
    this.rows=Array.isArray(rows)?rows:[];
    this.dirtyRows=new Set();
    this.maxColumns=this.rows.reduce((m,r)=>Math.max(m,Array.isArray(r)?r.length:0),0);
  }
  getName(){return this.name;}
  getCell(row,col){
    const r=this.rows[row-1];
    return Array.isArray(r)&&col-1<r.length?(r[col-1]??""):"";
  }
  setCell(row,col,value){
    while(this.rows.length<row)this.rows.push([]);
    const r=this.rows[row-1];
    while(r.length<col)r.push("");
    r[col-1]=value;
    this.maxColumns=Math.max(this.maxColumns,col);
    this.dirtyRows.add(row);
  }
  getRange(row,col,numRows=1,numCols=1){return new IdleRange(this,row,col,numRows,numCols);}
  getLastRow(){
    for(let i=this.rows.length-1;i>=0;i--){
      const r=this.rows[i];
      if(Array.isArray(r)&&r.some(__idleNonEmpty))return i+1;
    }
    return 0;
  }
  getLastColumn(){
    let m=0;
    for(const r of this.rows)if(Array.isArray(r)&&r.some(__idleNonEmpty))m=Math.max(m,r.length);
    return m;
  }
  getMaxColumns(){return Math.max(this.maxColumns,this.getLastColumn());}
  insertColumnsAfter(afterColumn,howMany){
    this.maxColumns=Math.max(this.maxColumns,(Number(afterColumn)||0)+(Number(howMany)||0));
    return this;
  }
}

class IdleSpreadsheet {
  constructor(sheets){this.sheets=sheets;}
  getSheetByName(name){return this.sheets.get(String(name||""))||null;}
}

const IDLE_CANONICAL_SHEET_NAMES_V1=Object.freeze({
  joueurs:"JOUEURS",
  classement:"CLASSEMENT",
  config:"CONFIG",
  boss:"IDLE_BOSS",
  zones:"IDLE_ZONES",
  monstres:"IDLE_MONSTRES",
  loots:"IDLE_LOOTS",
  sets:"IDLE_SETS",
  collections:"IDLE_COLLECTIONS",
  repos:"IDLE_REPOS",
  apparences:"IDLE_APPARENCES",
  raretes:"IDLE_RARETES",
  deblocages:"IDLE_DEBLOCAGES",
  boutique:"IDLE_BOUTIQUE",
  sorts:"IDLE_SORTS"
});

function __idleCanonicalSheetNameV1(name){
  const raw=String(name||"").trim();
  const key=raw.toLowerCase();
  return IDLE_CANONICAL_SHEET_NAMES_V1[key]||raw;
}

function __idleRepairCatalogSheetNamesV1(sql){
  for(const [legacy,canonical] of Object.entries(IDLE_CANONICAL_SHEET_NAMES_V1)){
    const rows=sqlRows(sql.exec(
      "SELECT row_index,row_json,updated_at FROM idle_catalog WHERE sheet_name=? ORDER BY row_index",
      legacy
    ));
    if(!rows.length)continue;

    for(const row of rows){
      sql.exec(
        "INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?) "+
        "ON CONFLICT(sheet_name,row_index) DO UPDATE SET "+
        "row_json=excluded.row_json,updated_at=excluded.updated_at "+
        "WHERE excluded.updated_at>=idle_catalog.updated_at",
        canonical,Number(row.row_index)||1,String(row.row_json||"[]"),Number(row.updated_at)||Date.now()
      );
    }

    sql.exec("DELETE FROM idle_catalog WHERE sheet_name=?",legacy);
  }
}

const IDLE_JOUEURS_HEADERS_V2=Object.freeze([
  "ID","Nom","Niveau","XP","Énergie","Énergie max","Prod/s","Force",
  "Endurance","Organisation","Puissance","Boss actuel","PV boss",
  "PV boss max","Boss vaincus","Dernière synchro","Public","Rang",
  "Email principal","Email connexion","Pièces","Inventaire JSON",
  "Équipement JSON","Améliorations JSON","Renaissances",
  "Essence renaissance","PV joueur","PV joueur max","KO jusqu'à",
  "Zone aventure","Progression aventure JSON","Points aventure",
  "Dernière action aventure","Matériaux","Collection JSON","Date début",
  "Capacité inventaire","Stats JSON"
]);

function __idleCatalogCountV2(sql,sheetName){
  return Number(
    sqlRows(
      sql.exec(
        "SELECT COUNT(*) AS n FROM idle_catalog WHERE sheet_name=?",
        sheetName
      )
    )[0]?.n||0
  );
}

function __idleRestoreCatalogFromLegacyV2(sql){
  const now=Date.now();

  for(const [legacy,canonical] of Object.entries(IDLE_CANONICAL_SHEET_NAMES_V1)){
    if(__idleCatalogCountV2(sql,canonical)>0)continue;

    const rows=sqlRows(sql.exec(
      "SELECT row_index,values_json,imported_at FROM legacy_rows "+
      "WHERE source_key=? ORDER BY row_index",
      "idle:"+legacy
    ));

    for(const row of rows){
      const values=safeJson(row.values_json,[])||[];
      if(!Array.isArray(values)||!values.some(__idleNonEmpty))continue;

      sql.exec(
        "INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) "+
        "VALUES(?,?,?,?) ON CONFLICT(sheet_name,row_index) DO UPDATE SET "+
        "row_json=excluded.row_json,updated_at=excluded.updated_at",
        canonical,
        Math.max(1,Number(row.row_index)||1),
        jsonText(values),
        Number(row.imported_at)||now
      );
    }
  }

  /*
   * Deuxième filet : idle_players contient une copie de la ligne JOUEURS.
   * Si l'ancien catalogue a été purgé mais que les joueurs spécialisés sont
   * encore là, on reconstruit une feuille JOUEURS valide sans perdre l'état.
   */
  if(__idleCatalogCountV2(sql,"JOUEURS")===0){
    const players=sqlRows(sql.exec(
      "SELECT source_row,state_json,updated_at FROM idle_players "+
      "ORDER BY COALESCE(source_row,999999),player_key"
    ));

    if(players.length){
      sql.exec(
        "INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) "+
        "VALUES('JOUEURS',1,?,?) ON CONFLICT(sheet_name,row_index) DO NOTHING",
        jsonText(IDLE_JOUEURS_HEADERS_V2),
        now
      );

      let fallbackRow=2;
      for(const player of players){
        const values=safeJson(player.state_json,[])||[];
        if(!Array.isArray(values)||!values.some(__idleNonEmpty))continue;
        const rowIndex=Math.max(
          2,
          Number(player.source_row)||fallbackRow
        );
        fallbackRow=Math.max(fallbackRow,rowIndex+1);
        sql.exec(
          "INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) "+
          "VALUES('JOUEURS',?,?,?) ON CONFLICT(sheet_name,row_index) DO UPDATE SET "+
          "row_json=excluded.row_json,updated_at=excluded.updated_at",
          rowIndex,
          jsonText(values),
          Number(player.updated_at)||now
        );
      }
    }
  }
}

function __idleBuildWorkbook(sql){
  const bySheet=new Map();
  const records=sqlRows(sql.exec(
    "SELECT sheet_name,row_index,row_json FROM idle_catalog ORDER BY sheet_name,row_index"
  ));
  for(const rec of records){
    const name=String(rec.sheet_name||"");
    if(!name)continue;
    let rows=bySheet.get(name);
    if(!rows){rows=[];bySheet.set(name,rows);}
    const idx=Math.max(1,Number(rec.row_index)||1)-1;
    while(rows.length<=idx)rows.push([]);
    rows[idx]=safeJson(rec.row_json,[])||[];
  }
  const sheets=new Map();
  for(const [name,rows] of bySheet)sheets.set(name,new IdleSheet(name,rows));
  return new IdleSpreadsheet(sheets);
}

function __idleCommit(sql,workbook){
  const now=Date.now();
  for(const [sheetName,sheet] of workbook.sheets){
    for(const rowIndex of sheet.dirtyRows){
      const row=Array.isArray(sheet.rows[rowIndex-1])?sheet.rows[rowIndex-1]:[];
      const nonEmpty=row.some(__idleNonEmpty);
      if(nonEmpty){
        sql.exec(
          "INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?) "+
          "ON CONFLICT(sheet_name,row_index) DO UPDATE SET row_json=excluded.row_json,updated_at=excluded.updated_at",
          sheetName,rowIndex,jsonText(row),now
        );
      }else{
        sql.exec("DELETE FROM idle_catalog WHERE sheet_name=? AND row_index=?",sheetName,rowIndex);
      }
      if(sheetName==="JOUEURS"&&rowIndex>1){
        if(!nonEmpty){
          sql.exec("DELETE FROM idle_players WHERE source_row=?",rowIndex);
          continue;
        }
        const playerId=String(row[0]??"").trim();
        const displayName=String(row[1]??"").trim();
        const emailPrimary=String(row[18]??"").trim().toLowerCase();
        const emailLogin=String(row[19]??"").trim().toLowerCase();
        const playerKey=emailLogin||emailPrimary||__idleKey(playerId||displayName);
        if(!playerKey)continue;
        sql.exec("DELETE FROM idle_players WHERE source_row=? AND player_key<>?",rowIndex,playerKey);
        sql.exec(
          "INSERT INTO idle_players(player_key,player_id,display_name,email_primary,email_login,state_json,source_row,updated_at) "+
          "VALUES(?,?,?,?,?,?,?,?) "+
          "ON CONFLICT(player_key) DO UPDATE SET player_id=excluded.player_id,display_name=excluded.display_name,"+
          "email_primary=excluded.email_primary,email_login=excluded.email_login,state_json=excluded.state_json,"+
          "source_row=excluded.source_row,updated_at=excluded.updated_at",
          playerKey,playerId,displayName,emailPrimary,emailLogin,jsonText(row),rowIndex,now
        );
      }
    }
  }
}

function verifierSessionSoreal(_token){
  return __idleRuntimeUser?{ok:true,user:__idleRuntimeUser}:{ok:false,user:null};
}
const SpreadsheetApp={
  openById(){
    if(!__idleWorkbook)throw new Error("SOREAL_IDLE_WORKBOOK_NOT_READY");
    return __idleWorkbook;
  },
  flush(){}
};
/*
 * Audit 2026-09-16 (Norman : "le bouton + pour ajouter des points dans
 * Attaque passive ne fonctionne plus", "le menu Spend EXP ne dépense pas
 * l'EXP... on peut spammer et acheter des ressources en chaîne") : ce
 * shim renvoyait TOUJOURS true pour tryLock/waitLock -- aucune exclusion
 * mutuelle réelle, alors que plusieurs fonctions (agirProgressionSorealIdle,
 * envoyerAllocationsBasicTrainingIdleV120_ côté client, la synchro
 * périodique obtenirEtatSorealIdleGameV40_...) font toutes un cycle
 * lire-modifier-écrire sur LA MÊME ligne joueur en supposant que ce
 * verrou les protège. Un incident déjà documenté ailleurs dans ce fichier
 * ("Quand je mets des points dans Basic training, ils me sont souvent
 * rendus") décrivait déjà ce symptôme de contention perdue. Corrigé par
 * un vrai verrou en mémoire, scopé à CET isolate Durable Object : comme
 * chaque cycle lire-modifier-écrire de ces fonctions est entièrement
 * synchrone (jamais d'await entre tryLock et releaseLock), un simple
 * indicateur suffit à sérialiser deux requêtes qui s'entrelaceraient au
 * niveau du `await request.json()` de l'appelant -- la seule vraie
 * fenêtre de concurrence possible dans ce modèle à isolate unique.
 */
let __idleScriptLockHeldV1=false;
const LockService={
  getScriptLock(){
    return {
      tryLock(){
        if(__idleScriptLockHeldV1)return false;
        __idleScriptLockHeldV1=true;
        return true;
      },
      waitLock(){
        if(__idleScriptLockHeldV1)throw new Error("SOREAL_IDLE_LOCK_TIMEOUT");
        __idleScriptLockHeldV1=true;
        return true;
      },
      releaseLock(){
        __idleScriptLockHeldV1=false;
      }
    };
  }
};
const CacheService={
  getScriptCache(){
    return {
      get(k){
        const key=String(k),x=__idleCacheStore.get(key);
        if(!x)return null;
        if(x.exp&&x.exp<Date.now()){__idleCacheStore.delete(key);return null;}
        return x.value;
      },
      put(k,v,sec){
        __idleCacheStore.set(String(k),{
          value:String(v),
          exp:Date.now()+Math.max(1,Number(sec)||60)*1000
        });
      },
      remove(k){__idleCacheStore.delete(String(k));},
      removeAll(keys){for(const k of keys||[])__idleCacheStore.delete(String(k));}
    };
  }
};
const Utilities={
  getUuid(){return crypto.randomUUID();},
  base64Encode(bytes){
    let s="";
    for(const b of Array.from(bytes||[]))s+=String.fromCharCode(Number(b)&255);
    return btoa(s);
  }
};
function __idleEmptyIterator(){
  return {hasNext(){return false;},next(){throw new Error("NO_FILE");}};
}
const DriveApp={
  getFolderById(){
    return {getFiles(){return __idleEmptyIterator();},getFilesByName(){return __idleEmptyIterator();}};
  },
  getFileById(id){
    return {
      getId(){return String(id||"");},
      getName(){return "";},
      getMimeType(){return "image/png";},
      getBlob(){return {getContentType(){return "image/png";},getBytes(){return [];}};}
    };
  }
};


/**
 * ============================================================
 * SOREAL IDLE — MOTEUR SERVEUR V40.9
 * Fichier : Soreal_Idle_Game.gs
 * ============================================================
 *
 * - accès privé Norman + Sébastien HODDAP uniquement
 * - identité basée sur la session SOREAL existante
 * - lecture/écriture dans le Google Sheet "Soreal IDLE"
 * - énergie calculée côté serveur
 * - progression hors ligne
 * - synchronisation sûre avec LockService
 *
 * Spreadsheet :
 * 19NkoPRWj6UHruOKKuyqwnH9l8tQCuJO_ZcvbXscar0E
 * ============================================================
 */

const CONFIG_SOREAL_IDLE = {
  VERSION: 'V45-NGU-PARITY',

  ID_SPREADSHEET:
    '19NkoPRWj6UHruOKKuyqwnH9l8tQCuJO_ZcvbXscar0E',

  FEUILLE_JOUEURS: 'JOUEURS',
  FEUILLE_CONFIG: 'CONFIG',
  FEUILLE_CLASSEMENT: 'CLASSEMENT',

  /*
   * SOREAL IDLE reste strictement privé.
   * Norman possède deux adresses historiques de connexion ; elles désignent
   * la même personne. Sébastien HODDAP est le seul autre joueur autorisé.
   */
  EMAILS_DEVELOPPEMENT: [
    'reeeedruuuum@gmail.com',
    'technicien.soreal@gmail.com',
    'hodappsebastien@gmail.com'
  ],

  COLONNES_JOUEURS: {
    ID: 1,
    NOM: 2,
    NIVEAU: 3,
    XP: 4,
    ENERGIE: 5,
    ENERGIE_MAX: 6,
    PROD_SECONDE: 7,
    FORCE: 8,
    ENDURANCE: 9,
    ORGANISATION: 10,
    PUISSANCE: 11,
    BOSS_ACTUEL: 12,
    BOSS_PV: 13,
    BOSS_PV_MAX: 14,
    BOSS_VAINCUS: 15,
    DERNIERE_SYNCHRO: 16,
    PUBLIC: 17,
    RANG: 18,
    EMAIL_PRINCIPAL: 19,
    EMAIL_CONNEXION: 20,
    PIECES: 21,
    INVENTAIRE_JSON: 22,
    EQUIPEMENT_JSON: 23,
    AMELIORATIONS_JSON: 24,
    RENAISSANCES: 25,
    ESSENCE_RENAISSANCE: 26,
    PV_JOUEUR: 27,
    PV_JOUEUR_MAX: 28,
    KO_JUSQUA: 29,
    AVENTURE_ZONE: 30,
    AVENTURE_PROGRESSION_JSON: 31,
    AVENTURE_POINTS: 32,
    AVENTURE_DERNIERE_ACTION: 33,
    MATERIAUX: 34,
    COLLECTION_JSON: 35,
    DATE_DEBUT: 36,
    INVENTAIRE_CAPACITE: 37,
    STATS_JSON: 38
  },

  /*
   * ENERGIE_BASE est aussi réutilisé par renaitreSorealIdle() (Rebirth) —
   * Norman n'a signalé que la valeur de départ d'une NOUVELLE PARTIE
   * ("quand on commence une nouvelle partie, le compte d'énergie est à
   * 250"), jamais celle après une Renaissance (comportement actuel :
   * pleine à 500, jamais remis en cause) — ne jamais changer cette
   * constante partagée sans vérifier les DEUX appelants d'abord.
   */
  ENERGIE_BASE: 500,
  ENERGIE_MAX_BASE: 500,
  PROD_SECONDE_BASE: 1,
  /*
   * Norman (2026-09-14, capture d'écran du vrai NGU Idle à l'appui) :
   * "avec 1 milliard à générer, avec 1 tic par seconde, ça n'ira pas."
   * Vérifié sur le wiki NGU (formule confirmée par sa capture : Energy
   * Speed 3,4 → arrondi supérieur(50/3,4)=15 tics, exactement "remplit
   * tous les 15 tics" affiché en jeu) : le moteur réel tourne à 50
   * tics/seconde fixes, donc l'intervalle le plus rapide possible est
   * 1000/50 = 20ms (Energy Speed au maximum, 50). Le plancher ici
   * était 90ms — jusqu'à 4,5× plus lent que le vrai jeu ne le permet
   * en fin de partie, quelle que soit la production.
   */
  ENERGIE_TICK_MIN_MS: 20,
  NIVEAU_BASE: 1,
  FORCE_BASE: 1,
  ENDURANCE_BASE: 1,
  ORGANISATION_BASE: 1,
  /*
   * 2026-09-17 (Norman, "copie absolument tout dans le jeu [...] les
   * MEMES noms [que NGU] [...] tout ce qui est Soreal disparait") : ce
   * repli n'est utilisé QUE quand le catalogue IDLE_BOSS est vide
   * (definitionBossSorealIdle_) -- vrai premier boss NGU (bf_number=1,
   * sourcé du miroir wiki local, design/ngu-wiki-enemies-v1.json), plus
   * l'ancien nom SOREAL inventé "La Palette Infernale".
   */
  BOSS_BASE: 'A Small Piece of Fluff',
  BOSS_PV_BASE: 800,
  MULTIPLICATEUR_PV_BOSS: 1.5,

  NIVEAU_RENAISSANCE: 8,

  PV_JOUEUR_BASE: 100,
  PV_PAR_ENDURANCE: 20,
  DEFENSE_PAR_ENDURANCE: 0.5,
  DEFENSE_ARMURE_COEFFICIENT: 0.35,
  PV_ARMURE_COEFFICIENT: 5,
  DEGATS_BOSS_MIN_PCT: 0.12,
  ATTAQUE_BOSS_BASE: 2,
  MULTIPLICATEUR_ATTAQUE_BOSS: 1.32,
  /*
   * Fight Boss : aucune durée de K.O. NGU.
   * KO_JUSQUA reste une colonne historique uniquement, toujours vidée.
   */
  AVENTURE: {
    NIVEAU_DEBLOCAGE: 2,
    ENNEMIS_PAR_ZONE: 5,
    COUT_ENTREE_BASE: 30,
    CROISSANCE_COUT_ENTREE: 1.35,
    MULTIPLICATEUR_PV_ENNEMI: 1.55,
    MULTIPLICATEUR_ATTAQUE_ENNEMI: 1.34,
    RECOMPENSE_POINTS_BASE: 2,
    RECOMPENSE_PIECES_BASE: 4
  },

  INVENTAIRE_CAPACITE_BASE: 18,
  INVENTAIRE_CAPACITE_MAX: 90,

  PROGRESSION_HORS_LIGNE_MAX_SECONDES:
    12 * 60 * 60
};


/**
 * ============================================================
 * OUTILS
 * ============================================================
 */

function normaliserEmailSorealIdle_(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}


function nombreSorealIdle_(valeur, defaut) {
  let source=valeur;

  /*
   * La migration Sheets peut conserver le rendu français ("2,34",
   * "14 000", espaces insécables). Le moteur SQLite doit interpréter
   * exactement les mêmes nombres que l'ancien Apps Script.
   */
  if(typeof source==="string"){
    source=source
      .trim()
      .replace(/[\u00A0\u202F\s]/g,"")
      .replace(",",".");
  }

  const n=Number(source);

  return Number.isFinite(n)
    ?n
    :Number(defaut||0);
}

function dateSorealIdle_(valeur, defautMs) {
  if(valeur instanceof Date){
    const ms=valeur.getTime();
    return Number.isFinite(ms)?ms:Number(defautMs||Date.now());
  }

  if(typeof valeur==="number"&&Number.isFinite(valeur)){
    /*
     * Google Sheets sérialise parfois une date comme nombre de jours
     * depuis 1899-12-30.
     */
    if(valeur>20000&&valeur<100000){
      return Date.UTC(1899,11,30)+valeur*86400000;
    }
    return valeur;
  }

  const texte=String(valeur||"").trim();
  if(!texte)return Number(defautMs||Date.now());

  const fr=texte.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if(fr){
    const ms=Date.UTC(
      Number(fr[3]),
      Number(fr[2])-1,
      Number(fr[1]),
      Number(fr[4]||0),
      Number(fr[5]||0),
      Number(fr[6]||0)
    );
    if(Number.isFinite(ms))return ms;
  }

  const ms=new Date(texte).getTime();
  return Number.isFinite(ms)
    ?ms
    :Number(defautMs||Date.now());
}


function bornerSorealIdle_(valeur, min, max) {
  return Math.max(
    Number(min || 0),
    Math.min(
      Number(max || 0),
      Number(valeur || 0)
    )
  );
}


function inventaireCapaciteMaxSorealIdle_() {
  return Math.max(
    CONFIG_SOREAL_IDLE
      .INVENTAIRE_CAPACITE_BASE,
    Math.floor(
      nombreSorealIdle_(
        parametreSorealIdle_(
          'INVENTAIRE_CAPACITE_MAX',
          CONFIG_SOREAL_IDLE
            .INVENTAIRE_CAPACITE_MAX
        ),
        CONFIG_SOREAL_IDLE
          .INVENTAIRE_CAPACITE_MAX
      )
    )
  );
}


function bossParMondeSorealIdle_() {
  return Math.max(
    1,
    Math.floor(
      nombreSorealIdle_(
        parametreSorealIdle_(
          'BOSS_PAR_MONDE',
          20
        ),
        20
      )
    )
  );
}


function entreeDeblocageSorealIdleV405_(
  id
) {
  const cle =
    String(
      id || ''
    )
      .trim()
      .toLowerCase();

  if (!cle) {
    return null;
  }

  const source =
    deblocagesSorealIdle_();

  /*
   * Compatibilité V40.5 :
   * - ancien Data : tableau d'entrées ;
   * - Data actuel : objet indexé par id.
   *
   * Le Game ne dépend donc plus jamais de
   * deblocagesSorealIdle_().find(...).
   */
  if (Array.isArray(source)) {
    for (
      let i = 0;
      i < source.length;
      i += 1
    ) {
      const entree =
        source[i];

      if (
        String(
          entree &&
          (
            entree.id ||
            entree.ID
          ) ||
          ''
        )
          .trim()
          .toLowerCase() === cle
      ) {
        return entree;
      }
    }

    return null;
  }

  if (
    source &&
    typeof source === 'object'
  ) {
    if (source[cle]) {
      return source[cle];
    }

    /*
     * Tolère aussi un objet dont les clés n'auraient pas
     * exactement la même casse.
     */
    const cles =
      Object.keys(source);

    for (
      let i = 0;
      i < cles.length;
      i += 1
    ) {
      const k =
        cles[i];

      if (
        String(k)
          .trim()
          .toLowerCase() === cle
      ) {
        return source[k];
      }
    }
  }

  return null;
}


function niveauDeblocageFonctionSorealIdle_(
  id,
  defaut
) {
  if (
    String(
      id || ''
    ) === 'aventure'
  ) {
    return 1;
  }

  const entree =
    entreeDeblocageSorealIdleV405_(
      id
    );

  return Math.max(
    1,
    Math.floor(
      nombreSorealIdle_(
        entree &&
        (
          entree.niveau ??
          entree.Niveau
        ),
        defaut
      )
    )
  );
}


function deblocagesEtatSorealIdleV405_() {
  const source =
    deblocagesSorealIdle_();

  if (
    source &&
    !Array.isArray(source) &&
    typeof source === 'object'
  ) {
    const resultat = {};

    Object.keys(source)
      .forEach(function(cle) {
        const entree =
          source[cle];

        /*
         * Ignore les propriétés techniques éventuelles
         * (par exemple une méthode find() de compatibilité).
         */
        if (
          !entree ||
          typeof entree !== 'object'
        ) {
          return;
        }

        resultat[
          String(cle)
        ] = {
          id:
            String(
              entree.id ||
              entree.ID ||
              cle
            ),

          niveau:
            Math.max(
              1,
              Math.floor(
                nombreSorealIdle_(
                  entree.niveau ??
                  entree.Niveau,
                  1
                )
              )
            ),

          nom:
            String(
              entree.nom ||
              entree.Nom ||
              cle
            )
        };
      });

    return resultat;
  }

  const resultat = {};

  if (Array.isArray(source)) {
    source.forEach(function(entree) {
      if (!entree) {
        return;
      }

      const id =
        String(
          entree.id ||
          entree.ID ||
          ''
        )
          .trim();

      if (!id) {
        return;
      }

      resultat[id] = {
        id: id,

        niveau:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                entree.niveau ??
                entree.Niveau,
                1
              )
            )
          ),

        nom:
          String(
            entree.nom ||
            entree.Nom ||
            id
          )
      };
    });
  }

  return resultat;
}


function dureeMaxCombatAventureSorealIdle_(
  boss
) {
  return Math.max(
    3,
    nombreSorealIdle_(
      parametreSorealIdle_(
        boss
          ? 'AVENTURE_DUREE_MAX_BOSS_SECONDES'
          : 'AVENTURE_DUREE_MAX_ENNEMI_SECONDES',
        boss
          ? 30
          : 20
      ),
      boss
        ? 30
        : 20
    )
  );
}


function degatsRecusAventureSecondeSorealIdle_(
  attaque,
  defense
) {
  return Math.max(
    1,
    nombreSorealIdle_(
      attaque,
      1
    ) -
    Math.max(
      0,
      nombreSorealIdle_(
        defense,
        0
      )
    )
  );
}


function profilStuffAventureSorealIdle_(
  inventaire,
  equipement,
  zoneId
) {
  const cible =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          zoneId,
          1
        )
      )
    );

  const details =
    detailsEquipementSorealIdle_(
      inventaire,
      equipement
    );

  let equipees = 0;
  let zoneOuMieux = 0;
  let zoneSuperieure = 0;

  slotsEquipementSorealIdle_()
    .forEach(function(slot) {
      const objet =
        details &&
        details[slot]
          ? details[slot]
          : null;

      if (!objet) {
        return;
      }

      equipees += 1;

      const zoneObjet =
        Math.max(
          0,
          Math.floor(
            nombreSorealIdle_(
              objet.zoneId,
              0
            )
          )
        );

      if (zoneObjet >= cible) {
        zoneOuMieux += 1;
      }

      if (zoneObjet >= cible + 1) {
        zoneSuperieure += 1;
      }
    });

  return {
    equipees:
      equipees,
    zoneOuMieux:
      zoneOuMieux,
    zoneSuperieure:
      zoneSuperieure
  };
}


function dureeCibleStuffAventureSorealIdle_(
  zoneId,
  boss,
  inventaire,
  equipement
) {
  const profil =
    profilStuffAventureSorealIdle_(
      inventaire,
      equipement,
      zoneId
    );

  /*
   * V41.3 — le début doit forcer un vrai cycle :
   * Training -> ennemi normal -> loot -> équipement -> boss de zone.
   *
   * Sans 3 pièces de la zone actuelle, le boss vise 36 s alors que
   * la limite de combat reste 30 s : il est donc volontairement
   * impossible à "bruteforce" juste avec une énorme attaque.
   */
  let secondes;

  if (profil.zoneSuperieure >= 4) {
    secondes =
      boss
        ? 6
        : 3;
  } else if (profil.zoneSuperieure >= 2) {
    secondes =
      boss
        ? 10
        : 6;
  } else if (profil.zoneOuMieux >= 5) {
    secondes =
      boss
        ? 18
        : 9;
  } else if (profil.zoneOuMieux >= 3) {
    secondes =
      boss
        ? 28
        : 14;
  } else {
    secondes =
      boss
        ? 36
        : 19.5;
  }

  return {
    secondes:
      secondes,

    profil:
      profil,

    farmRapide:
      profil.zoneSuperieure >= 4
  };
}

function puissanceEffectiveAventureSorealIdle_(
  puissanceBrute,
  pvEnnemi,
  zoneId,
  boss,
  inventaire,
  equipement
) {
  const brut =
    Math.max(
      1,
      nombreSorealIdle_(
        puissanceBrute,
        1
      )
    );

  const cible =
    dureeCibleStuffAventureSorealIdle_(
      zoneId,
      boss,
      inventaire,
      equipement
    );

  const plafond =
    Math.max(
      1,
      nombreSorealIdle_(
        pvEnnemi,
        1
      ) /
      Math.max(
        0.25,
        cible.secondes
      )
    );

  return {
    brute:
      brut,
    effective:
      Math.max(
        1,
        Math.min(
          brut,
          plafond
        )
      ),
    plafond:
      plafond,
    dureeCible:
      cible.secondes,
    stuff:
      cible.profil,
    farmRapide:
      cible.farmRapide
  };
}


function seuilPuissanceAventureSorealIdle_(
  stats,
  pvJoueurMax,
  defense,
  boss
) {
  const s =
    stats || {};

  const degatsRecus =
    degatsRecusAventureSecondeSorealIdle_(
      s.attaque,
      defense
    );

  const tempsKo =
    Math.max(
      0.01,
      nombreSorealIdle_(
        pvJoueurMax,
        1
      ) /
      degatsRecus
    );

  const limite =
    dureeMaxCombatAventureSorealIdle_(
      boss
    );

  const fenetre =
    Math.max(
      0.01,
      Math.min(
        tempsKo,
        limite
      )
    );

  return {
    puissance:
      Math.max(
        1,
        Math.ceil(
          nombreSorealIdle_(
            s.pv,
            1
          ) /
          fenetre
        )
      ),
    tempsKo:
      tempsKo,
    limite:
      limite,
    degatsRecusSeconde:
      degatsRecus
  };
}


function bossMondeCibleZoneSorealIdle_(
  zoneId
) {
  const z =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          zoneId,
          1
        )
      )
    );

  const bossParMonde =
    bossParMondeSorealIdle_();

  if (z >= 6) {
    return bossParMonde;
  }

  return Math.min(
    bossParMonde,
    z * 3
  );
}


/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * `difficulty` (4e paramètre, optionnel) propagé jusqu'aux dégâts/stats
 * boss ci-dessous.
 */
function seuilPuissanceBossPrincipalSorealIdle_(
  bossNumero,
  pvJoueurMax,
  defense,
  difficulty
) {
  const numero =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          bossNumero,
          1
        )
      )
    );

  const index =
    numero - 1;

  const boss =
    definitionBossSorealIdle_(
      index,
      difficulty
    );

  const pvBoss =
    Math.max(
      1,
      nombreSorealIdle_(
        boss.pv,
        1
      )
    );

  const attaque =
    Math.max(
      1,
      nombreSorealIdle_(
        boss.attaque,
        1
      )
    );

  let degatsRecus;

  if (index === 0) {
    /*
     * Une seule formule de vérité pour le tutoriel.
     * L'estimation de puissance doit utiliser exactement les mêmes dégâts
     * que la simulation réelle du combat.
     */
    degatsRecus =
      degatsRecusSecondeSorealIdle_(
        index,
        defense,
        pvBoss,
        pvBoss,
        difficulty
      );
  } else {
    const degatsNormaux =
      degatsRecusSecondeSorealIdle_(
        index,
        defense,
        pvBoss,
        pvBoss,
        difficulty
      );

    const degatsFureur =
      degatsRecusSecondeSorealIdle_(
        index,
        defense,
        pvBoss * 0.25,
        pvBoss,
        difficulty
      );

    /*
     * Estimation conservatrice :
     * 70 % du combat hors Fureur, 30 % sous Fureur.
     */
    degatsRecus =
      degatsNormaux * 0.7 +
      degatsFureur * 0.3;
  }

  const tempsKo =
    Math.max(
      0.01,
      nombreSorealIdle_(
        pvJoueurMax,
        1
      ) /
      Math.max(
        0.01,
        degatsRecus
      )
    );

  const limite =
    Math.max(
      15,
      nombreSorealIdle_(
        parametreSorealIdle_(
          'BOSS_COMBAT_CIBLE_MAX_SECONDES',
          180
        ),
        180
      )
    );

  const fenetre =
    Math.max(
      0.01,
      Math.min(
        tempsKo,
        limite
      )
    );

  const multiplicateurDps =
    Math.max(
      0.02,
      multiplicateurDpsJoueurBossSorealIdle_(
        index,
        false
      ) *
      multiplicateurSceauBossSorealIdle_(
        index,
        {sceauBriseBossNumero:0}
      )
    );

  const regen =
    regenBossSecondeSorealIdle_(
      index,
      pvBoss
    );

  return {
    bossNumero:
      numero,
    nom:
      String(
        boss.nom || 'Boss'
      ),
    puissance:
      Math.max(
        1,
        Math.ceil(
          (
            pvBoss /
            fenetre +
            regen
          ) /
          multiplicateurDps
        )
      ),
    tempsKo:
      tempsKo,
    limite:
      limite
  };
}



function obtenirSpreadsheetSorealIdle_() {
  return SpreadsheetApp.openById(
    CONFIG_SOREAL_IDLE.ID_SPREADSHEET
  );
}


function obtenirFeuilleJoueursSorealIdle_() {
  const feuille =
    obtenirSpreadsheetSorealIdle_()
      .getSheetByName(
        CONFIG_SOREAL_IDLE.FEUILLE_JOUEURS
      );

  if (!feuille) {
    throw new Error(
      'SOREAL_IDLE_FEUILLE_JOUEURS_INTROUVABLE'
    );
  }

  return feuille;
}


function assurerColonnesIdentiteSorealIdle_(
  feuille
) {
  const c =
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  if (
    feuille.getMaxColumns() <
    c.STATS_JSON
  ) {
    feuille.insertColumnsAfter(
      feuille.getMaxColumns(),
      c.STATS_JSON -
      feuille.getMaxColumns()
    );
  }

  const entetes = {};

  entetes[c.EMAIL_PRINCIPAL] =
    'Email principal';

  entetes[c.EMAIL_CONNEXION] =
    'Email connexion';

  entetes[c.PIECES] =
    'Pièces';

  entetes[c.INVENTAIRE_JSON] =
    'Inventaire JSON';

  entetes[c.EQUIPEMENT_JSON] =
    'Équipement JSON';

  entetes[c.AMELIORATIONS_JSON] =
    'Améliorations JSON';

  entetes[c.RENAISSANCES] =
    'Renaissances';

  entetes[c.ESSENCE_RENAISSANCE] =
    'Essence renaissance';

  entetes[c.PV_JOUEUR] =
    'PV joueur';

  entetes[c.PV_JOUEUR_MAX] =
    'PV joueur max';

  entetes[c.KO_JUSQUA] =
    'KO jusqu\'à';

  entetes[c.AVENTURE_ZONE] =
    'Zone aventure';

  entetes[c.AVENTURE_PROGRESSION_JSON] =
    'Progression aventure JSON';

  entetes[c.AVENTURE_POINTS] =
    'Points aventure';

  entetes[c.AVENTURE_DERNIERE_ACTION] =
    'Dernière action aventure';

  entetes[c.MATERIAUX] =
    'Matériaux';

  entetes[c.COLLECTION_JSON] =
    'Collection JSON';

  entetes[c.DATE_DEBUT] =
    'Date début';

  entetes[c.INVENTAIRE_CAPACITE] =
    'Capacité inventaire';

  entetes[c.STATS_JSON] =
    'Stats JSON';

  Object.keys(entetes)
    .forEach(function(colonneTexte) {
      const colonne =
        Number(colonneTexte);

      const actuel =
        String(
          feuille
            .getRange(
              1,
              colonne
            )
            .getValue() || ''
        ).trim();

      if (!actuel) {
        feuille
          .getRange(
            1,
            colonne
          )
          .setValue(
            entetes[colonne]
          );
      }
    });
}


function assurerDonneesJeuSorealIdle_(
  feuille,
  ligne
) {
  const c =
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  const bossVaincus =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          feuille
            .getRange(
              ligne,
              c.BOSS_VAINCUS
            )
            .getValue(),
          0
        )
      )
    );

  const celluleProduction =
    feuille
      .getRange(
        ligne,
        c.PROD_SECONDE
      );

  if (
    nombreSorealIdle_(
      celluleProduction.getValue(),
      0
    ) <= 0
  ) {
    celluleProduction.setValue(
      CONFIG_SOREAL_IDLE.PROD_SECONDE_BASE
    );
  }


  const cellulePieces =
    feuille
      .getRange(
        ligne,
        c.PIECES
      );

  if (
    cellulePieces.getValue() === '' ||
    cellulePieces.getValue() === null
  ) {
    /*
     * Une cellule vide correspond à un nouveau portefeuille.
     * Les pièces ne sont gagnées qu'au moment d'une vraie victoire.
     */
    cellulePieces.setValue(0);
  }

  const celluleInventaire =
    feuille
      .getRange(
        ligne,
        c.INVENTAIRE_JSON
      );

  if (
    !String(
      celluleInventaire
        .getValue() || ''
    ).trim()
  ) {
    celluleInventaire
      .setValue('[]');
  }

  const celluleEquipement =
    feuille
      .getRange(
        ligne,
        c.EQUIPEMENT_JSON
      );

  if (
    !String(
      celluleEquipement
        .getValue() || ''
    ).trim()
  ) {
    celluleEquipement
      .setValue('{}');
  }

  const celluleAmeliorations =
    feuille
      .getRange(
        ligne,
        c.AMELIORATIONS_JSON
      );

  if (
    !String(
      celluleAmeliorations
        .getValue() || ''
    ).trim()
  ) {
    celluleAmeliorations
      .setValue('{}');
  }

  const celluleRenaissances =
    feuille
      .getRange(
        ligne,
        c.RENAISSANCES
      );

  if (
    celluleRenaissances.getValue() === '' ||
    celluleRenaissances.getValue() === null
  ) {
    celluleRenaissances.setValue(0);
  }

  const celluleEssence =
    feuille
      .getRange(
        ligne,
        c.ESSENCE_RENAISSANCE
      );

  if (
    celluleEssence.getValue() === '' ||
    celluleEssence.getValue() === null
  ) {
    celluleEssence.setValue(0);
  }

  const cellulePvMax =
    feuille.getRange(
      ligne,
      c.PV_JOUEUR_MAX
    );

  if (
    cellulePvMax.getValue() === '' ||
    cellulePvMax.getValue() === null
  ) {
    cellulePvMax.setValue(
      CONFIG_SOREAL_IDLE.PV_JOUEUR_BASE +
      CONFIG_SOREAL_IDLE.PV_PAR_ENDURANCE
    );
  }

  const cellulePv =
    feuille.getRange(
      ligne,
      c.PV_JOUEUR
    );

  if (
    cellulePv.getValue() === '' ||
    cellulePv.getValue() === null
  ) {
    cellulePv.setValue(
      cellulePvMax.getValue()
    );
  }

  const celluleKo =
    feuille.getRange(
      ligne,
      c.KO_JUSQUA
    );

  if (
    celluleKo.getValue() === null
  ) {
    celluleKo.clearContent();
  }

  const celluleZoneAventure =
    feuille.getRange(
      ligne,
      c.AVENTURE_ZONE
    );

  if (
    celluleZoneAventure.getValue() === '' ||
    celluleZoneAventure.getValue() === null
  ) {
    celluleZoneAventure.setValue(1);
  }

  const celluleProgressionAventure =
    feuille.getRange(
      ligne,
      c.AVENTURE_PROGRESSION_JSON
    );

  if (
    !String(
      celluleProgressionAventure.getValue() || ''
    ).trim()
  ) {
    celluleProgressionAventure.setValue('{}');
  }

  const cellulePointsAventure =
    feuille.getRange(
      ligne,
      c.AVENTURE_POINTS
    );

  if (
    cellulePointsAventure.getValue() === '' ||
    cellulePointsAventure.getValue() === null
  ) {
    cellulePointsAventure.setValue(0);
  }

  const celluleMateriaux =
    feuille.getRange(
      ligne,
      c.MATERIAUX
    );

  if (
    celluleMateriaux.getValue() === '' ||
    celluleMateriaux.getValue() === null
  ) {
    celluleMateriaux.setValue(0);
  }

  const celluleCollection =
    feuille.getRange(
      ligne,
      c.COLLECTION_JSON
    );

  if (
    !String(
      celluleCollection.getValue() || ''
    ).trim()
  ) {
    celluleCollection.setValue('{}');
  }

  const celluleDateDebut =
    feuille.getRange(ligne,c.DATE_DEBUT);

  if (!celluleDateDebut.getValue()) {
    celluleDateDebut.setValue(new Date());
  }

  const celluleCapacite =
    feuille.getRange(ligne,c.INVENTAIRE_CAPACITE);

  if (
    nombreSorealIdle_(
      celluleCapacite.getValue(),
      0
    ) < 1
  ) {
    celluleCapacite.setValue(
      CONFIG_SOREAL_IDLE.INVENTAIRE_CAPACITE_BASE
    );
  }

  const celluleStats =
    feuille.getRange(ligne,c.STATS_JSON);

  if (!String(celluleStats.getValue()||'').trim()) {
    celluleStats.setValue('{}');
  }
}


/**
 * ============================================================
 * ACCÈS PRIVÉ
 * ============================================================
 */

function emailsAutorisesSorealIdle_() {
  return CONFIG_SOREAL_IDLE
    .EMAILS_DEVELOPPEMENT
    .map(normaliserEmailSorealIdle_)
    .filter(Boolean);
}


function extraireEmailsUtilisateurSorealIdle_(
  user
) {
  const emails = [];

  if (!user || typeof user !== 'object') {
    return emails;
  }

  if (user.email) {
    emails.push(user.email);
  }

  if (user.emailConnexion) {
    emails.push(user.emailConnexion);
  }

  if (Array.isArray(user.emails)) {
    user.emails.forEach(function(email) {
      emails.push(email);
    });
  }

  const deja = {};

  return emails
    .map(normaliserEmailSorealIdle_)
    .filter(function(email) {
      if (!email || deja[email]) {
        return false;
      }

      deja[email] = true;
      return true;
    });
}


function verifierAccesSorealIdle_(
  sessionToken
) {
  const token =
    String(sessionToken || '').trim();

  if (!token) {
    return {
      ok: false,
      autorise: false,
      raison: 'SESSION_MANQUANTE',
      user: null,
      emailAutorise: ''
    };
  }

  let verification;

  try {
    verification =
      verifierSessionSoreal(token);
  } catch (e) {
    return {
      ok: false,
      autorise: false,
      raison: 'SESSION_INVALIDE',
      user: null,
      emailAutorise: ''
    };
  }

  if (
    !verification ||
    !verification.ok ||
    !verification.user
  ) {
    return {
      ok: false,
      autorise: false,
      raison: 'SESSION_INVALIDE',
      user: null,
      emailAutorise: ''
    };
  }

  const user = verification.user;

  const emailsUtilisateur =
    extraireEmailsUtilisateurSorealIdle_(
      user
    );

  const autorises =
    emailsAutorisesSorealIdle_();

  const emailAutorise =
    emailsUtilisateur.find(
      function(email) {
        return autorises.indexOf(email) !== -1;
      }
    ) || '';

  return {
    ok: true,
    autorise: Boolean(emailAutorise),
    raison:
      emailAutorise
        ? ''
        : 'ACCES_REFUSE',
    user: user,
    emailAutorise: emailAutorise
  };
}


function exigerAccesSorealIdle_(
  sessionToken
) {
  const acces =
    verifierAccesSorealIdle_(
      sessionToken
    );

  if (!acces.ok) {
    throw new Error(
      'SESSION_EXPIREE'
    );
  }

  if (!acces.autorise) {
    throw new Error(
      'SOREAL_IDLE_ACCES_REFUSE'
    );
  }

  return acces;
}


function obtenirAccesSorealIdle(
  sessionToken
) {
  const acces =
    verifierAccesSorealIdle_(
      sessionToken
    );

  if (
    !acces.ok ||
    !acces.autorise
  ) {
    return {
      ok: true,
      autorise: false,
      protocolVersion: IDLE_PROTOCOL_VERSION
    };
  }

  return {
    ok: true,
    autorise: true,
    protocolVersion: IDLE_PROTOCOL_VERSION,
    utilisateur: {
      prenom:
        String(
          acces.user.prenom ||
          'Norman'
        ).trim(),

      email:
        normaliserEmailSorealIdle_(
          acces.user.email ||
          acces.emailAutorise
        ),

      emailConnexion:
        normaliserEmailSorealIdle_(
          acces.user.emailConnexion ||
          acces.emailAutorise
        )
    },

    version:
      CONFIG_SOREAL_IDLE.VERSION
  };
}


/**
 * ============================================================
 * IDENTITÉ JOUEUR
 * ============================================================
 */

function trouverLigneJoueurSorealIdle_(
  feuille,
  acces
) {
  assurerColonnesIdentiteSorealIdle_(
    feuille
  );

  const c =
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  const derniereLigne =
    Math.max(
      2,
      feuille.getLastRow()
    );

  const valeurs =
    feuille
      .getRange(
        2,
        1,
        derniereLigne - 1,
        c.AMELIORATIONS_JSON
      )
      .getValues();

  const emailsUtilisateur =
    extraireEmailsUtilisateurSorealIdle_(
      acces.user
    );

  const emailPrincipal =
    normaliserEmailSorealIdle_(
      acces.user.email ||
      acces.emailAutorise
    );

  const emailConnexion =
    normaliserEmailSorealIdle_(
      acces.user.emailConnexion ||
      acces.emailAutorise
    );

  const prenom =
    String(
      acces.user.prenom ||
      'Norman'
    ).trim();

  let ligneParNom = 0;

  for (
    let i = 0;
    i < valeurs.length;
    i++
  ) {
    const ligne = i + 2;

    const emailFeuillePrincipal =
      normaliserEmailSorealIdle_(
        valeurs[i][
          c.EMAIL_PRINCIPAL - 1
        ]
      );

    const emailFeuilleConnexion =
      normaliserEmailSorealIdle_(
        valeurs[i][
          c.EMAIL_CONNEXION - 1
        ]
      );

    if (
      emailFeuillePrincipal &&
      emailsUtilisateur.indexOf(
        emailFeuillePrincipal
      ) !== -1
    ) {
      assurerDonneesJeuSorealIdle_(
        feuille,
        ligne
      );

      return ligne;
    }

    if (
      emailFeuilleConnexion &&
      emailsUtilisateur.indexOf(
        emailFeuilleConnexion
      ) !== -1
    ) {
      assurerDonneesJeuSorealIdle_(
        feuille,
        ligne
      );

      return ligne;
    }

    const nom =
      String(
        valeurs[i][c.NOM - 1] || ''
      ).trim();

    if (
      !ligneParNom &&
      nom &&
      prenom &&
      nom.toLowerCase() ===
      prenom.toLowerCase()
    ) {
      ligneParNom = ligne;
    }
  }

  /*
   * Migration du prototype existant :
   * la ligne Norman existait avant l'ajout
   * des colonnes e-mail.
   */
  if (ligneParNom) {
    feuille
      .getRange(
        ligneParNom,
        c.EMAIL_PRINCIPAL
      )
      .setValue(emailPrincipal);

    feuille
      .getRange(
        ligneParNom,
        c.EMAIL_CONNEXION
      )
      .setValue(emailConnexion);

    assurerDonneesJeuSorealIdle_(
      feuille,
      ligneParNom
    );

    return ligneParNom;
  }

  return creerJoueurSorealIdle_(
    feuille,
    acces
  );
}


function creerJoueurSorealIdle_(
  feuille,
  acces
) {
  const c =
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  const prochaineLigne =
    Math.max(
      2,
      feuille.getLastRow() + 1
    );

  const id =
    'J' +
    String(
      prochaineLigne - 1
    ).padStart(3, '0');

  const prenom =
    String(
      acces.user.prenom ||
      'Joueur'
    ).trim();

  const emailPrincipal =
    normaliserEmailSorealIdle_(
      acces.user.email ||
      acces.emailAutorise
    );

  const emailConnexion =
    normaliserEmailSorealIdle_(
      acces.user.emailConnexion ||
      acces.emailAutorise
    );

  const coefficients =
    obtenirParametresEntrainementSorealIdle_();

  const puissance =
    Math.max(
      0,
      nombreSorealIdle_(
        parametreSorealIdle_('PUISSANCE_BASE_FIXE',4),
        4
      )
    ) +
    CONFIG_SOREAL_IDLE.FORCE_BASE *
      coefficients.force;

  const ligne = [
    id,
    prenom,
    CONFIG_SOREAL_IDLE.NIVEAU_BASE,
    0,
    /*
     * Norman (2026-09-15) : "quand on commence une nouvelle partie, le
     * compte d'énergie est à 250 et on doit générer les 250 restants
     * pour atteindre 500." Uniquement ici (création d'un TOUT NOUVEAU
     * joueur) — jamais sur ENERGIE_BASE lui-même, réutilisé tel quel par
     * renaitreSorealIdle() (Rebirth), dont le comportement (pleine à
     * 500) n'a jamais été mis en cause par Norman.
     */
    CONFIG_SOREAL_IDLE.ENERGIE_BASE / 2,
    CONFIG_SOREAL_IDLE.ENERGIE_MAX_BASE,
    CONFIG_SOREAL_IDLE.PROD_SECONDE_BASE,
    CONFIG_SOREAL_IDLE.FORCE_BASE,
    CONFIG_SOREAL_IDLE.ENDURANCE_BASE,
    CONFIG_SOREAL_IDLE.ORGANISATION_BASE,
    puissance,
    nomBossSorealIdle_(0),
    pvMaxBossSorealIdle_(0),
    pvMaxBossSorealIdle_(0),
    0,
    new Date(),
    'Visible',
    '',
    emailPrincipal,
    emailConnexion,
    0,
    '[]',
    '{}',
    '{}',
    0,
    0,
    CONFIG_SOREAL_IDLE.PV_JOUEUR_BASE +
      CONFIG_SOREAL_IDLE.PV_PAR_ENDURANCE,
    CONFIG_SOREAL_IDLE.PV_JOUEUR_BASE +
      CONFIG_SOREAL_IDLE.PV_PAR_ENDURANCE,
    '',
    1,
    '{}',
    0,
    '',
    0,
    '{}',
    new Date(),
    CONFIG_SOREAL_IDLE.INVENTAIRE_CAPACITE_BASE,
    JSON.stringify(
      statsInitiauxSorealIdleV41_()
    )
  ];

  feuille
    .getRange(
      prochaineLigne,
      1,
      1,
      ligne.length
    )
    .setValues([ligne]);

  return prochaineLigne;
}


/**
 * ============================================================
 * ÉNERGIE
 * ============================================================
 */

function ameliorationsSorealIdle_(
  valeur
) {
  const brut =
    parserJsonSorealIdle_(
      valeur,
      {}
    );

  const source =
    brut &&
    typeof brut === 'object'
      ? brut
      : {};

  return {
    production:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            source.production,
            0
          )
        )
      ),

    capacite:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            source.capacite,
            0
          )
        )
      ),

    puissance:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            source.puissance,
            0
          )
        )
      )
  };
}


function coutAmeliorationSorealIdle_(
  type,
  niveau
) {
  const n =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          niveau,
          0
        )
      )
    );

  const config =
    boutiqueConfigSorealIdle_(
      type
    );

  if (!config) {
    throw new Error(
      'AMELIORATION_INVALIDE'
    );
  }

  return Math.max(
    1,
    Math.round(
      config.base *
      Math.pow(
        config.croissance,
        n
      )
    )
  );
}


function bonusAmeliorationsSorealIdle_(
  ameliorations
) {
  const a =
    ameliorationsSorealIdle_(
      JSON.stringify(
        ameliorations || {}
      )
    );

  const production =
    boutiqueConfigSorealIdle_(
      'production'
    );

  const capacite =
    boutiqueConfigSorealIdle_(
      'capacite'
    );

  const puissance =
    boutiqueConfigSorealIdle_(
      'puissance'
    );

  return {
    production:
      a.production *
      nombreSorealIdle_(
        production &&
        production.bonusParNiveau,
        2
      ),

    capacite:
      a.capacite *
      nombreSorealIdle_(
        capacite &&
        capacite.bonusParNiveau,
        250
      ),

    puissance:
      a.puissance *
      nombreSorealIdle_(
        puissance &&
        puissance.bonusParNiveau,
        10
      )
  };
}




function zonesAventureSorealIdle_() {
  return zonesTableSorealIdle_();
}


function zoneAventureSorealIdle_(
  zoneId
) {
  const zones =
    zonesAventureSorealIdle_();

  const id =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          zoneId,
          1
        )
      )
    );

  for (
    let i = 0;
    i < zones.length;
    i += 1
  ) {
    if (zones[i].id === id) {
      return zones[i];
    }
  }

  return zones[0];
}


function progressionAventureSorealIdle_(
  brut
) {
  const obj =
    parserJsonSorealIdle_(
      brut,
      {}
    );

  return obj &&
    typeof obj === 'object' &&
    !Array.isArray(obj)
      ? obj
      : {};
}


function etatZoneAventureSorealIdle_(
  progression,
  zoneId
) {
  const cle =
    String(zoneId);

  const brut =
    progression[cle];

  if (
    !brut ||
    typeof brut !== 'object'
  ) {
    return {
      victoires: 0,
      bossVaincu: false,
      meilleurTemps: 0,
      progressionBoss: 0,
      bossEchecs: 0
    };
  }

  const tousLes =
    Math.max(
      2,
      Math.floor(
        nombreSorealIdle_(
          parametreSorealIdle_(
            'AVENTURE_ENNEMIS_PAR_ZONE',
            5
          ),
          5
        )
      )
    );

  const victoires =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          brut.victoires,
          0
        )
      )
    );

  /*
   * Migration automatique des anciennes sauvegardes :
   * une zone à 4 victoires reste prête pour son boss.
   */
  const progressionBoss =
    Math.max(
      0,
      Math.min(
        tousLes - 1,
        Math.floor(
          nombreSorealIdle_(
            brut.progressionBoss,
            victoires % tousLes
          )
        )
      )
    );

  return {
    victoires:
      victoires,

    bossVaincu:
      Boolean(
        brut.bossVaincu
      ),

    meilleurTemps:
      Math.max(
        0,
        nombreSorealIdle_(
          brut.meilleurTemps,
          0
        )
      ),

    progressionBoss:
      progressionBoss,

    bossEchecs:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            brut.bossEchecs,
            0
          )
        )
      )
  };
}

function coutEntreeAventureSorealIdle_(
  zoneId
) {
  /* IDLE_ADVENTURE_NO_ENERGY_V44 — l'Aventure ne consomme jamais d'énergie. */
  void zoneId;
  return 0;
}


var cacheMonstresAventureSorealIdleGameV409_ = null;


function monstresAventureSorealIdleGameV409_() {
  if (
    Array.isArray(
      cacheMonstresAventureSorealIdleGameV409_
    )
  ) {
    return cacheMonstresAventureSorealIdleGameV409_;
  }

  const resultat = [];

  try {
    const feuille =
      obtenirSpreadsheetSorealIdle_()
        .getSheetByName(
          'IDLE_MONSTRES'
        );

    if (
      feuille &&
      feuille.getLastRow() >= 2 &&
      feuille.getLastColumn() >= 1
    ) {
      const valeurs =
        feuille
          .getRange(
            1,
            1,
            feuille.getLastRow(),
            feuille.getLastColumn()
          )
          .getValues();

      const entetes =
        valeurs[0]
          .map(function(v) {
            return String(v || '')
              .trim();
          });

      const index = {};

      entetes.forEach(function(nom, i) {
        if (nom) {
          index[nom] = i;
        }
      });

      function cellule_(ligne, nom) {
        const i = index[nom];

        return typeof i === 'number'
          ? ligne[i]
          : '';
      }

      for (
        let r = 1;
        r < valeurs.length;
        r += 1
      ) {
        const ligne = valeurs[r];

        const actif =
          String(
            cellule_(ligne, 'Actif')
          )
            .trim()
            .toLowerCase();

        if (actif === 'false') {
          continue;
        }

        const id =
          String(
            cellule_(ligne, 'ID') || ''
          )
            .trim();

        if (!id) {
          continue;
        }

        const typeBrut =
          String(
            cellule_(ligne, 'Type') ||
            'normal'
          )
            .trim()
            .toLowerCase();

        // Tier "rare" + objet legendaire retire : mecanique 100% SOREAL
        // sans equivalent NGU (aucune trace sur le wiki). Les lignes IDLE_MONSTRES
        // de type rare retombent desormais sur 'normal'.
        const type =
          [
            'normal',
            'boss_zone'
          ].indexOf(typeBrut) !== -1
            ? typeBrut
            : 'normal';

        resultat.push({
          id: id,

          zoneId:
            Math.max(
              1,
              Math.floor(
                nombreSorealIdle_(
                  cellule_(ligne, 'ZoneID'),
                  1
                )
              )
            ),

          type: type,

          nom:
            String(
              cellule_(ligne, 'Nom') ||
              'Créature'
            )
              .trim(),

          emoji:
            String(
              cellule_(ligne, 'Emoji') ||
              '👾'
            )
              .trim(),

          pv:
            Math.max(
              1,
              Math.round(
                nombreSorealIdle_(
                  cellule_(ligne, 'PV'),
                  100
                )
              )
            ),

          attaque:
            Math.max(
              0,
              nombreSorealIdle_(
                cellule_(ligne, 'Attaque'),
                1
              )
            ),

          chanceRencontre:
            Math.max(
              0,
              Math.min(
                1,
                nombreSorealIdle_(
                  cellule_(
                    ligne,
                    'ChanceRencontre'
                  ),
                  type === 'rare'
                    ? 0.003
                    : 1
                )
              )
            ),

          chanceLegendaire:
            Math.max(
              0,
              Math.min(
                1,
                nombreSorealIdle_(
                  cellule_(
                    ligne,
                    'ChanceLegendaire'
                  ),
                  type === 'rare'
                    ? 0.25
                    : 0
                )
              )
            ),

          objetLegendaire:
            String(
              cellule_(
                ligne,
                'ObjetLegendaire'
              ) || ''
            )
              .trim(),

          slotLegendaire:
            String(
              cellule_(
                ligne,
                'SlotLegendaire'
              ) || ''
            )
              .trim()
              .toLowerCase(),

          baseLegendaire:
            Math.max(
              0,
              nombreSorealIdle_(
                cellule_(
                  ligne,
                  'BaseLegendaire'
                ),
                0
              )
            ),

          description:
            String(
              cellule_(
                ligne,
                'Description'
              ) || ''
            )
              .trim(),

          image:
            String(
              cellule_(ligne, 'Image') || ''
            )
              .trim()
        });
      }
    }
  } catch (erreur) {
    console.warn(
      'IDLE_MONSTRES indisponible :',
      erreur && erreur.message
        ? erreur.message
        : erreur
    );
  }

  /*
   * Secours compatible avec les anciens projets :
   * si IDLE_MONSTRES n'est pas lisible, les ennemis
   * historiques sont reconstruits depuis les zones.
   */
  if (!resultat.length) {
    const zones =
      zonesAventureSorealIdle_();

    zones.forEach(function(zone) {
      resultat.push({
        id:
          'Z' + zone.id + '_NORMAL',
        zoneId: zone.id,
        type: 'normal',
        nom: zone.ennemi,
        emoji: zone.emoji || '👾',
        pv: zone.pvEnnemi,
        attaque: zone.attaqueEnnemi,
        chanceRencontre: 1,
        chanceLegendaire: 0,
        objetLegendaire: '',
        slotLegendaire: '',
        baseLegendaire: 0,
        description: '',
        image: ''
      });

      resultat.push({
        id:
          'Z' + zone.id + '_BOSS',
        zoneId: zone.id,
        type: 'boss_zone',
        nom: zone.boss,
        emoji: '👑',
        pv: zone.pvBoss,
        attaque: zone.attaqueBoss,
        chanceRencontre: 1,
        chanceLegendaire: 0,
        objetLegendaire: '',
        slotLegendaire: '',
        baseLegendaire: 0,
        description: '',
        image: ''
      });
    });
  }

  cacheMonstresAventureSorealIdleGameV409_ =
    resultat;

  return resultat;
}


function monstresZoneAventureSorealIdleGameV409_(
  zoneId
) {
  const id =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          zoneId,
          1
        )
      )
    );

  return monstresAventureSorealIdleGameV409_()
    .filter(function(monstre) {
      return monstre.zoneId === id;
    });
}


function monstreZoneAventureParTypeSorealIdleGameV409_(
  zoneId,
  type
) {
  const cleType =
    String(type || '')
      .trim()
      .toLowerCase();

  const monstres =
    monstresZoneAventureSorealIdleGameV409_(
      zoneId
    );

  for (
    let i = 0;
    i < monstres.length;
    i += 1
  ) {
    if (
      monstres[i].type === cleType
    ) {
      return monstres[i];
    }
  }

  return null;
}


function statsEnnemiAventureSorealIdle_(
  zoneId,
  boss
) {
  const id =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          zoneId,
          1
        )
      )
    );

  const monstre =
    monstreZoneAventureParTypeSorealIdleGameV409_(
      id,
      boss
        ? 'boss_zone'
        : 'normal'
    );

  const zone =
    zoneAventureSorealIdle_(
      id
    );

  const pvCatalogue =
    Math.max(
      1,
      Math.round(
        nombreSorealIdle_(
          monstre
            ? monstre.pv
            : (
                boss
                  ? zone && zone.pvBoss
                  : zone && zone.pvEnnemi
              ),
          boss ? 384 : 120
        )
      )
    );

  const attaqueCatalogue =
    Math.max(
      1,
      Math.round(
        nombreSorealIdle_(
          monstre
            ? monstre.attaque
            : (
                boss
                  ? zone && zone.attaqueBoss
                  : zone && zone.attaqueEnnemi
              ),
          boss ? 5 : 3
        )
      )
    );

  /*
   * V41.3 — l'Aventure commence réellement comme une zone dangereuse.
   *
   * Zone 1 normal :
   *   ~1,2 M PV / 160 k attaque.
   *
   * Zone 1 boss :
   *   ~15 M PV / 1,6 M attaque.
   *
   * Les valeurs de la feuille restent valables si elles sont plus hautes.
   * Les floors servent uniquement à empêcher un vieux catalogue sous-calibré
   * de rendre la nouvelle boucle NGU triviale.
   */
  const pvMinimum =
    boss
      ? 15000000 *
        Math.pow(
          7,
          id - 1
        )
      : 1200000 *
        Math.pow(
          6,
          id - 1
        );

  const attaqueMinimum =
    boss
      ? 1600000 *
        Math.pow(
          4,
          id - 1
        )
      : 160000 *
        Math.pow(
          3.5,
          id - 1
        );

  return {
    pv:
      Math.max(
        pvCatalogue,
        Math.round(
          pvMinimum
        )
      ),

    attaque:
      Math.max(
        attaqueCatalogue,
        Math.round(
          attaqueMinimum
        )
      )
  };
}

function construireAventureSorealIdle_(
  row,
  highestBossEver
) {
  void highestBossEver;
  const c =
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  /*
   * Norman (2026-09-11) : "le mode aventure est déjà débloqué [après un
   * Rebirth]... il ne doit se débloquer qu'au niveau habituel." Vérifié sur
   * le wiki NGU (page "Rebirths", section "What do I lose when I rebirth?") :
   * "Access to the Adventure, Augmentation, Time Machine, and Blood Magic
   * tabs [is lost] until their related bosses are beaten... Bosses fought
   * (you go back to boss 1)." Le high-water-mark historique
   * (metaNguEtat.records.highestBoss) ajouté le 2026-09-09 pour empêcher
   * l'Aventure de se reverrouiller reposait sur une hypothèse jamais vérifiée
   * contre le wiki — c'était faux, seul l'Inventaire (et sa Collection) reste
   * permanent après un Rebirth. Seul le compteur du RUN EN COURS
   * (row[BOSS_VAINCUS], remis à 0 à chaque Renaissance) doit donc conditionner
   * l'accès à l'Aventure, exactement comme le jeu réel.
   */
  const bossVaincusAventure =
    Math.max(
      0,
      Math.floor(nombreSorealIdle_(row[c.BOSS_VAINCUS - 1],0))
    );

  const bossUnlocksNgu = [4,7,17,37,48,58,66,74,82,90,100,108,116,124,132,137];

  const niveau =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          row[c.NIVEAU - 1],
          1
        )
      )
    );

  const progression =
    progressionAventureSorealIdle_(
      row[
        c.AVENTURE_PROGRESSION_JSON - 1
      ]
    );

  const inventaire =
    parserJsonSorealIdle_(
      row[
        c.INVENTAIRE_JSON - 1
      ],
      []
    );

  const equipement =
    parserJsonSorealIdle_(
      row[
        c.EQUIPEMENT_JSON - 1
      ],
      {}
    );

  const defense =
    Math.max(
      100,
      nombreSorealIdle_(
        row[c.ENDURANCE - 1],
        100
      )
    );

  const pvJoueurMax =
    Math.max(
      1000,
      nombreSorealIdle_(
        row[c.PV_JOUEUR_MAX - 1],
        Math.max(
          1000,
          nombreSorealIdle_(
            row[c.PUISSANCE - 1],
            100
          )*
          10
        )
      )
    );

  const puissanceActuelle =
    Math.max(
      1,
      nombreSorealIdle_(
        row[c.PUISSANCE - 1],
        1
      )
    );

  const statsAventure =
    statsJoueurSorealIdle_(
      row[c.STATS_JSON - 1]
    );

  const derniereActionBrute =
    row[
      c.AVENTURE_DERNIERE_ACTION - 1
    ];

  const derniereActionMs =
    derniereActionBrute instanceof Date
      ? derniereActionBrute.getTime()
      : new Date(
          derniereActionBrute || 0
        ).getTime();

  const zones =
    zonesAventureSorealIdle_()
      .map(function(zone) {
        const etat =
          etatZoneAventureSorealIdle_(
            progression,
            zone.id
          );

        const precedente =
          zone.id <= 1
            ? true
            : etatZoneAventureSorealIdle_(
                progression,
                zone.id - 1
              ).bossVaincu;

        const niveauRequisZone = 0;
        const bossRequisZone =
          bossUnlocksNgu[Math.max(0,zone.id-1)] ||
          (137 + Math.max(0,zone.id-16)*8);

        const debloquee =
          bossVaincusAventure >= bossRequisZone;

        const statsEnnemi =
          statsEnnemiAventureSorealIdle_(
            zone.id,
            false
          );

        const statsBoss =
          statsEnnemiAventureSorealIdle_(
            zone.id,
            true
          );

        const seuilEnnemi =
          seuilPuissanceAventureSorealIdle_(
            statsEnnemi,
            pvJoueurMax,
            defense,
            false
          );

        const seuilBoss =
          seuilPuissanceAventureSorealIdle_(
            statsBoss,
            pvJoueurMax,
            defense,
            true
          );

        const bossMondeCible =
          bossMondeCibleZoneSorealIdle_(
            zone.id
          );

        const seuilBossMonde =
          seuilPuissanceBossPrincipalSorealIdle_(
            bossMondeCible,
            pvJoueurMax,
            defense
          );

        return {
          id: zone.id,
          monde:
            mondeZoneAventureSorealIdle_(
              zone
            ),
          nom: zone.nom,
          emoji: zone.emoji,
          description:
            zone.description,
          ennemi: zone.ennemi,
          boss: zone.boss,
          image:
            zone.driveFileId
              ? 'https://lh3.googleusercontent.com/d/' +
                encodeURIComponent(zone.driveFileId) +
                '=w1600'
              : (zone.image || ''),
          niveauRequis: 0,
          bossRequis: bossRequisZone,
          puissanceRecommandee:
            zone.puissanceRecommandee,
          puissanceActuelle:
            puissanceActuelle,
          puissanceMinimumEnnemi:
            seuilEnnemi.puissance,
          puissanceMinimumBoss:
            seuilBoss.puissance,
          limiteEnnemiSecondes:
            seuilEnnemi.limite,
          limiteBossSecondes:
            seuilBoss.limite,
          bossMondeCible:
            bossMondeCible,
          bossMondeCibleNom:
            seuilBossMonde.nom,
          puissanceMinimumBossMonde:
            seuilBossMonde.puissance,
          coutEntree:
            coutEntreeAventureSorealIdle_(
              zone.id
            ),
          debloquee:
            debloquee,
          victoires:
            etat.victoires,
          bossVaincu:
            etat.bossVaincu,
          progressionBoss:
            etat.progressionBoss,
          combatsAvantBoss:
            Math.max(
              0,
              Math.max(
                2,
                Math.floor(
                  nombreSorealIdle_(
                    parametreSorealIdle_(
                      'AVENTURE_ENNEMIS_PAR_ZONE',
                      5
                    ),
                    5
                  )
                )
              ) -
              1 -
              etat.progressionBoss
            ),
          bossEchecs:
            etat.bossEchecs
        };
      });

  const niveauDeblocage = 0;

  return {
    debloquee:
      bossVaincusAventure >= 4,

    bossRequis: 4,

    niveauRequis:
      niveauDeblocage,

    points:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            row[c.AVENTURE_POINTS - 1],
            0
          )
        )
      ),

    zoneSelectionnee:
      Math.max(
        1,
        Math.floor(
          nombreSorealIdle_(
            row[c.AVENTURE_ZONE - 1],
            1
          )
        )
      ),

    puissanceActuelle:
      puissanceActuelle,

    cooldownBaseSecondes:
      cooldownAventureSorealIdle_(
        (
          zonesAventureSorealIdle_()
            .find(function(zone){
              return zone.id ===
                Math.max(
                  1,
                  Math.floor(
                    nombreSorealIdle_(
                      row[c.AVENTURE_ZONE - 1],
                      1
                    )
                  )
                );
            }) ||
          zonesAventureSorealIdle_()[0] ||
          {id:1,monde:1}
        ),
        statsAventure
      ),

    cooldownJusqua:
      Number.isFinite(
        derniereActionMs
      ) &&
      derniereActionMs > 0
        ? derniereActionMs +
          cooldownAventureSorealIdle_(
            (
              zonesAventureSorealIdle_()
                .find(function(zone){
                  return zone.id ===
                    Math.max(
                      1,
                      Math.floor(
                        nombreSorealIdle_(
                          row[c.AVENTURE_ZONE - 1],
                          1
                        )
                      )
                    );
                }) ||
              zonesAventureSorealIdle_()[0] ||
              {id:1,monde:1}
            ),
            statsAventure
          ) *
          1000
        : 0,

    defenseActuelle:
      defense,

    pvJoueurMax:
      pvJoueurMax,

    zones:
      zones
  };
}


/* ============================================================
   BASIC TRAINING / MODÈLE DE JEU V41
   ============================================================ */

function statsInitiauxSorealIdleV41_() {
  const stats =
    statsJoueurSorealIdle_(
      '{}'
    );

  stats.modeleJeuVersion =
    BASIC_TRAINING_V411.version;

  stats.entrainementBase =
    createBasicTrainingStateV411(
      Date.now()
    );

  stats.energieTickResteMs = 0;

  return stats;
}


/*
 * Le prototype précédent est volontairement abandonné.
 * V41 est une nouvelle partie : aucun code de migration des anciennes
 * valeurs n'est conservé. Cela évite d'empiler des règles historiques
 * dans le nouveau moteur.
 */
function initialiserModeleJoueurSorealIdleV41SiNecessaire_(
  feuille,
  ligne
) {
  const c =
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  const row =
    feuille
      .getRange(
        ligne,
        1,
        1,
        c.STATS_JSON
      )
      .getValues()[0];

  const stats =
    statsJoueurSorealIdle_(
      row[c.STATS_JSON - 1]
    );

  if (
    stats.modeleJeuVersion ===
    BASIC_TRAINING_V411.version &&
    stats.entrainementBase
  ) {
    return false;
  }

  const id =
    String(
      row[c.ID - 1] || ''
    );

  const nom =
    String(
      row[c.NOM - 1] || 'Joueur'
    );

  const emailPrincipal =
    String(
      row[c.EMAIL_PRINCIPAL - 1] || ''
    );

  const emailConnexion =
    String(
      row[c.EMAIL_CONNEXION - 1] || ''
    );

  const coefficients =
    obtenirParametresEntrainementSorealIdle_();

  const puissance =
    Math.max(
      1,
      Math.round(
        Math.max(
          0,
          nombreSorealIdle_(
            parametreSorealIdle_(
              'PUISSANCE_BASE_FIXE',
              4
            ),
            4
          )
        ) +
        CONFIG_SOREAL_IDLE.FORCE_BASE *
        coefficients.force
      )
    );

  const pv =
    CONFIG_SOREAL_IDLE.PV_JOUEUR_BASE +
    CONFIG_SOREAL_IDLE.PV_PAR_ENDURANCE;

  const nouvellesValeurs = [
    id,
    nom,
    CONFIG_SOREAL_IDLE.NIVEAU_BASE,
    0,
    CONFIG_SOREAL_IDLE.ENERGIE_BASE,
    CONFIG_SOREAL_IDLE.ENERGIE_MAX_BASE,
    CONFIG_SOREAL_IDLE.PROD_SECONDE_BASE,
    CONFIG_SOREAL_IDLE.FORCE_BASE,
    CONFIG_SOREAL_IDLE.ENDURANCE_BASE,
    CONFIG_SOREAL_IDLE.ORGANISATION_BASE,
    puissance,
    nomBossSorealIdle_(0),
    pvMaxBossSorealIdle_(0),
    pvMaxBossSorealIdle_(0),
    0,
    new Date(),
    'Visible',
    '',
    emailPrincipal,
    emailConnexion,
    0,
    '[]',
    '{}',
    '{}',
    0,
    0,
    pv,
    pv,
    '',
    1,
    '{}',
    0,
    '',
    0,
    '{}',
    new Date(),
    CONFIG_SOREAL_IDLE.INVENTAIRE_CAPACITE_BASE,
    JSON.stringify(
      statsInitiauxSorealIdleV41_()
    )
  ];

  feuille
    .getRange(
      ligne,
      1,
      1,
      nouvellesValeurs.length
    )
    .setValues([
      nouvellesValeurs
    ]);

  SpreadsheetApp.flush();

  return true;
}


/*
 * Niveaux gagnés à chaque remplissage de barre d'Entraînement de base :
 * 1 + Double Basic Training (perk) + Super Advanced Beast Training! (quirk)
 * + "I wish Basic Training was EVEN FASTER" (souhait), voir
 * levelsPerFillBasicTrainingV411.
 */
function niveauxParBarreEntrainementSorealIdle_(stats) {
  const meta = stats && stats.metaNgu;
  if (!meta || meta.version !== IDLE_NGU_META_VERSION) return 1;
  return Math.max(
    1,
    Math.floor(nombreSorealIdle_(idleNguBonuses(meta).basicTrainingLevelsPerFill, 1))
  );
}

function synchroniserEntrainementBaseSorealIdleV41_(
  feuille,
  ligne,
  row,
  maintenant
) {
  const c =
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  const stats =
    statsJoueurSorealIdle_(
      row[c.STATS_JSON - 1]
    );

  const progression =
    advanceBasicTrainingStateV411(
      stats.entrainementBase,
      maintenant,
      CONFIG_SOREAL_IDLE
        .PROGRESSION_HORS_LIGNE_MAX_SECONDES,
      niveauxParBarreEntrainementSorealIdle_(stats)
    );

  stats.modeleJeuVersion =
    BASIC_TRAINING_V411.version;

  stats.entrainementBase =
    progression.state;

  const inventaire =
    parserJsonSorealIdle_(
      row[
        c.INVENTAIRE_JSON - 1
      ],
      []
    );

  const equipement =
    parserJsonSorealIdle_(
      row[
        c.EQUIPEMENT_JSON - 1
      ],
      {}
    );

  const collection =
    parserJsonSorealIdle_(
      row[
        c.COLLECTION_JSON - 1
      ],
      {}
    );

  const combat =
    statsCombatPrincipalSorealIdleV413_(
      stats,
      inventaire,
      equipement,
      row[
        c.AMELIORATIONS_JSON - 1
      ],
      row[
        c.ESSENCE_RENAISSANCE - 1
      ],
      collection
    );

  row[c.FORCE - 1] =
    combat.attaque;

  row[c.ENDURANCE - 1] =
    combat.defense;

  row[c.ORGANISATION - 1] = 1;

  row[c.PUISSANCE - 1] =
    combat.attaque;

  row[c.STATS_JSON - 1] =
    JSON.stringify(stats);

  feuille
    .getRange(
      ligne,
      c.FORCE
    )
    .setValue(
      combat.attaque
    );

  feuille
    .getRange(
      ligne,
      c.ENDURANCE
    )
    .setValue(
      combat.defense
    );

  feuille
    .getRange(
      ligne,
      c.ORGANISATION
    )
    .setValue(1);

  feuille
    .getRange(
      ligne,
      c.PUISSANCE
    )
    .setValue(
      combat.attaque
    );

  feuille
    .getRange(
      ligne,
      c.STATS_JSON
    )
    .setValue(
      row[c.STATS_JSON - 1]
    );

  return {
    stats:
      stats,

    allocation:
      totalBasicTrainingAllocationV411(
        progression.state
      ),

    attaque:
      combat.attaque,

    defense:
      combat.defense,

    pvMax:
      combat.pvMax,

    combat:
      combat,

    secondes:
      progression.elapsedSeconds
  };
}

function parserJsonSorealIdle_(
  valeur,
  defaut
) {
  try {
    const texte =
      String(valeur || '').trim();

    if (!texte) {
      return defaut;
    }

    const parsed =
      JSON.parse(texte);

    return parsed === null
      ? defaut
      : parsed;
  } catch (e) {
    return defaut;
  }
}


function slotsEquipementSorealIdle_() {
  return [
    'tete',
    'torse',
    'bottes',
    'arme',
    'bijou1',
    'bijou2'
  ];
}


function bonusEquipementSorealIdle_(
  inventaire,
  equipement
) {
  const items =
    Array.isArray(inventaire)
      ? inventaire
      : [];

  const equip =
    equipement &&
    typeof equipement === 'object'
      ? equipement
      : {};

  let bonus = 0;

  slotsEquipementSorealIdle_()
    .forEach(function(slot) {
      const id =
        String(
          equip[slot] || ''
        );

      if (!id) {
        return;
      }

      const objet =
        items.find(function(item) {
          return String(item.id) === id;
        });

      if (objet) {
        bonus +=
          Math.max(
            0,
            nombreSorealIdle_(
              objet.bonusPuissance,
              0
            )
          );
      }
    });

  return bonus;
}


function detailsEquipementSorealIdle_(
  inventaire,
  equipement
) {
  const items =
    Array.isArray(inventaire)
      ? inventaire
      : [];

  const equip =
    equipement &&
    typeof equipement === 'object'
      ? equipement
      : {};

  const resultat = {};

  slotsEquipementSorealIdle_()
    .forEach(function(slot) {
      const valeur =
        equip[slot];

      const id =
        valeur &&
        typeof valeur === 'object'
          ? String(valeur.id || '')
          : String(valeur || '');

      resultat[slot] =
        items.find(function(item) {
          return String(item.id) === id;
        }) || null;
    });

  return resultat;
}


/*
 * Audit 2026-09-17 (grand nettoyage) : rareteAleatoireSorealIdle_,
 * lootEligibleSorealIdle_ et choisirLootPondereSorealIdle_ n'avaient
 * plus qu'un seul appelant chacun — le corps mort de
 * genererObjetLootSorealIdle_ ci-dessous, jamais atteint depuis le
 * gel du 2026-09-16 (return null; avant tout le reste). Supprimées
 * (zéro autre référence dans le dépôt, vérifié), avec le corps mort
 * qui les appelait.
 */
function genererObjetLootSorealIdle_(
  contexte
) {
  /*
   * Audit 2026-09-16 : plus de fidélité NGU pour le combat de boss
   * numéroté (Fight Boss/Basic Training) -- l'équipement/loot n'existe
   * que dans Adventure Mode dans le vrai jeu. Coupé à la source (chaque
   * appelant traite déjà un retour null comme "rien obtenu", même
   * comportement que quand aucun objet n'est éligible) plutôt que dans
   * chacun des call sites, pour un seul point de vérité.
   */
  void contexte;
  return null;
}


/*
 * Compatibilité avec le combat principal historique.
 */
function genererObjetBossSorealIdle_(
  bossVaincusAvant,
  bossNom
) {
  return genererObjetLootSorealIdle_({
    zoneId: 0,
    zoneNom: '',
    bossNom:
      String(
        bossNom || ''
      ),
    progression:
      Math.max(
        0,
        nombreSorealIdle_(
          bossVaincusAvant,
          0
        )
      )
  });
}


function nomBaseObjetCollectionSorealIdle_(
  objet
) {
  let nom =
    String(
      objet && objet.nom || 'Objet'
    ).trim();

  const prefixes = [
    'Légendaire ',
    'Legendaire ',
    'Épique ',
    'Epique ',
    'Rare ',
    'Peu commun ',
    'Commun '
  ];

  prefixes.forEach(function(prefixe) {
    if (
      nom.indexOf(prefixe) === 0
    ) {
      nom =
        nom.substring(
          prefixe.length
        ).trim();
    }
  });

  return nom || 'Objet';
}


function cleCollectionObjetSorealIdle_(
  objet
) {
  const definitionId =
    String(
      objet && objet.definitionId || ''
    ).trim();

  if (definitionId) {
    return 'DEF|' + definitionId;
  }

  return [
    'LEGACY',
    String(
      objet && objet.zoneId || 0
    ),
    String(
      objet && objet.slot || 'objet'
    ),
    nomBaseObjetCollectionSorealIdle_(
      objet
    )
  ].join('|');
}


function collectionObjetSerializableSorealIdle_(
  objet
) {
  return {
    cle:
      cleCollectionObjetSorealIdle_(
        objet
      ),

    definitionId:
      String(
        objet && objet.definitionId || ''
      ),

    nom:
      nomBaseObjetCollectionSorealIdle_(
        objet
      ),

    nomComplet:
      String(
        objet && objet.nom || 'Objet'
      ),

    slot:
      String(
        objet && objet.slot || ''
      ),

    rarete:
      String(
        objet && objet.rarete || 'commun'
      ),

    rareteNom:
      String(
        objet && objet.rareteNom || 'Commun'
      ),

    bonusPuissance:
      Math.max(
        0,
        nombreSorealIdle_(
          objet && objet.bonusPuissance,
          0
        )
      ),

    fusionMax:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            objet && objet.fusion,
            0
          )
        )
      ),

    source:
      String(
        objet && objet.source || ''
      ),

    setId:
      String(
        objet && objet.setId || ''
      ),

    setNom:
      String(
        objet && objet.setNom || ''
      ),

    image:
      String(
        objet && objet.image || ''
      ),

    zoneId:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            objet && objet.zoneId,
            0
          )
        )
      ),

    obtenuLe:
      String(
        objet && objet.obtenuLe || ''
      )
  };
}


function fusionnerObjetDansCollectionSorealIdle_(
  collection,
  objet
) {
  if (
    !objet ||
    !objet.id
  ) {
    return false;
  }

  const entree =
    collectionObjetSerializableSorealIdle_(
      objet
    );

  const cle =
    entree.cle;

  const ancienne =
    collection[cle];

  if (!ancienne) {
    collection[cle] =
      entree;

    return true;
  }

  let modifie = false;

  if (
    entree.bonusPuissance >
    nombreSorealIdle_(
      ancienne.bonusPuissance,
      0
    )
  ) {
    ancienne.bonusPuissance =
      entree.bonusPuissance;

    modifie = true;
  }

  if (
    entree.fusionMax >
    nombreSorealIdle_(
      ancienne.fusionMax,
      0
    )
  ) {
    ancienne.fusionMax =
      entree.fusionMax;

    modifie = true;
  }

  if (
    entree.source &&
    !ancienne.source
  ) {
    ancienne.source =
      entree.source;

    modifie = true;
  }

  return modifie;
}


function synchroniserCollectionSorealIdle_(
  feuille,
  ligne,
  inventaire
) {
  const c =
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  const cellule =
    feuille.getRange(
      ligne,
      c.COLLECTION_JSON
    );

  let collection =
    parserJsonSorealIdle_(
      cellule.getValue(),
      {}
    );

  if (
    !collection ||
    typeof collection !== 'object' ||
    Array.isArray(collection)
  ) {
    collection = {};
  }

  let modifie = false;

  (
    Array.isArray(inventaire)
      ? inventaire
      : []
  ).forEach(function(objet) {
    if (
      fusionnerObjetDansCollectionSorealIdle_(
        collection,
        objet
      )
    ) {
      modifie = true;
    }
  });

  if (modifie) {
    cellule.setValue(
      JSON.stringify(
        collection
      )
    );
  }

  return collection;
}


function listeCollectionSorealIdle_(
  collection
) {
  const uniques = {};

  Object.keys(
    collection || {}
  ).forEach(function(cle) {
    const entree =
      collection[cle];

    if (
      !entree ||
      typeof entree !== 'object'
    ) {
      return;
    }

    const uniqueKey =
      String(
        entree.definitionId || ''
      ).trim() ||
      [
        String(entree.zoneId || 0),
        String(entree.slot || ''),
        String(entree.nom || '')
      ].join('|');

    const ancienne =
      uniques[uniqueKey];

    if (
      !ancienne ||
      nombreSorealIdle_(
        entree.bonusPuissance,
        0
      ) >
      nombreSorealIdle_(
        ancienne.bonusPuissance,
        0
      )
    ) {
      uniques[uniqueKey] =
        entree;
    }
  });

  const resultat =
    Object.keys(uniques)
      .map(function(cle) {
        return uniques[cle];
      });

  resultat.sort(
    function(a,b) {
      const zoneA =
        nombreSorealIdle_(
          a.zoneId,
          0
        );

      const zoneB =
        nombreSorealIdle_(
          b.zoneId,
          0
        );

      if (zoneA !== zoneB) {
        return zoneA - zoneB;
      }

      return String(
        a.nom || ''
      ).localeCompare(
        String(
          b.nom || ''
        )
      );
    }
  );

  return resultat;
}


function trouverDecouverteLootSorealIdle_(
  collectionListe,
  loot
) {
  const definitionId =
    String(
      loot && loot.id || ''
    );

  for (
    let i = 0;
    i < collectionListe.length;
    i += 1
  ) {
    const entree =
      collectionListe[i];

    if (
      definitionId &&
      String(
        entree.definitionId || ''
      ) === definitionId
    ) {
      return entree;
    }

    if (
      !entree.definitionId &&
      nombreSorealIdle_(
        entree.zoneId,
        0
      ) ===
      nombreSorealIdle_(
        loot.zoneId,
        0
      ) &&
      String(
        entree.slot || ''
      ) ===
      String(
        loot.slot || ''
      ) &&
      String(
        entree.nom || ''
      ) ===
      String(
        loot.nom || ''
      )
    ) {
      return entree;
    }
  }

  return null;
}


function progressionCollectionsSorealIdle_(
  collection
) {
  const decouvertes =
    listeCollectionSorealIdle_(
      collection
    );

  const loots =
    lootsSorealIdle_()
      .filter(function(loot) {
        return loot.zoneId > 0;
      });

  const configs =
    collectionsSorealIdle_();

  let bonusTotal = 0;

  const zones =
    configs.map(function(config) {
      const objets =
        loots
          .filter(function(loot) {
            return (
              loot.zoneId ===
              config.zoneId
            );
          })
          .map(function(loot) {
            const trouve =
              trouverDecouverteLootSorealIdle_(
                decouvertes,
                loot
              );

            return {
              definitionId:
                loot.id,

              nom:
                loot.nom,

              slot:
                loot.slot,

              image:
                loot.image || '',

              decouvert:
                Boolean(
                  trouve
                ),

              objet:
                trouve || null
            };
          });

      const obtenus =
        objets.filter(
          function(objet) {
            return objet.decouvert;
          }
        ).length;

      const total =
        objets.length;

      const complete =
        total > 0 &&
        obtenus >= total;

      if (complete) {
        bonusTotal +=
          config.bonusPuissancePct;
      }

      return {
        id:
          config.id,

        zoneId:
          config.zoneId,

        nom:
          config.nom,

        obtenus:
          obtenus,

        total:
          total,

        complete:
          complete,

        bonusPuissancePct:
          config.bonusPuissancePct,

        description:
          config.description,

        objets:
          objets
      };
    });

  return {
    bonusPourcent:
      bonusTotal,

    zones:
      zones
  };
}


function statsJoueurSorealIdle_(valeur) {
  const s=parserJsonSorealIdle_(valeur,{});

  const sortsAchetes =
    Array.isArray(s.sortsAchetes)
      ? s.sortsAchetes
          .map(function(id){
            return String(id || '').trim();
          })
          .filter(Boolean)
      : [];

  const cooldowns =
    s.cooldownsSorts &&
    typeof s.cooldownsSorts === 'object'
      ? s.cooldownsSorts
      : {};

  return {
    lootsObtenus:Math.max(0,Math.floor(nombreSorealIdle_(s.lootsObtenus,0))),
    objetsRecycles:Math.max(0,Math.floor(nombreSorealIdle_(s.objetsRecycles,0))),
    fusions:Math.max(0,Math.floor(nombreSorealIdle_(s.fusions,0))),
    forge:Math.max(0,Math.floor(nombreSorealIdle_(s.forge,0))),
    materiauxDepenses:Math.max(0,Math.floor(nombreSorealIdle_(s.materiauxDepenses,0))),
    extensionsSac:Math.max(0,Math.floor(nombreSorealIdle_(s.extensionsSac,0))),
    combatsAventure:Math.max(0,Math.floor(nombreSorealIdle_(s.combatsAventure,0))),
    victoiresAventure:Math.max(0,Math.floor(nombreSorealIdle_(s.victoiresAventure,0))),
    autoAventure:Boolean(s.autoAventure),
    autoAventureZone:Math.max(0,Math.floor(nombreSorealIdle_(s.autoAventureZone,0))),
    bossSelection:Math.max(0,Math.floor(nombreSorealIdle_(s.bossSelection,0))),
    combatBossActif:Boolean(s.combatBossActif),
    autoBossSuivant:s.autoBossSuivant!==false,
    reposNumero:Math.max(1,Math.floor(nombreSorealIdle_(s.reposNumero,1))),

    energieTickResteMs:
      Math.max(
        0,
        nombreSorealIdle_(
          s.energieTickResteMs,
          0
        )
      ),

    bossRespawnJusqua:
      Math.max(
        0,
        nombreSorealIdle_(
          s.bossRespawnJusqua,
          0
        )
      ),

    aventureCooldownReductionPct:
      Math.max(
        0,
        Math.min(
          90,
          nombreSorealIdle_(
            s.aventureCooldownReductionPct,
            0
          )
        )
      ),

    mana:
      nombreSorealIdle_(s.mana,-1),
    manaMajMs:
      Math.max(0,nombreSorealIdle_(s.manaMajMs,0)),
    sortsAchetes:
      sortsAchetes,
    cooldownsSorts:
      cooldowns,

    buffBouclierJusqua:
      Math.max(0,nombreSorealIdle_(s.buffBouclierJusqua,0)),
    buffBouclierPct:
      Math.max(0,nombreSorealIdle_(s.buffBouclierPct,0)),
    immuniteParalysieJusqua:
      Math.max(0,nombreSorealIdle_(s.immuniteParalysieJusqua,0)),
    bossStunJusqua:
      Math.max(0,nombreSorealIdle_(s.bossStunJusqua,0)),
    bossVulnerableJusqua:
      Math.max(0,nombreSorealIdle_(s.bossVulnerableJusqua,0)),
    bossVulnerablePct:
      Math.max(0,nombreSorealIdle_(s.bossVulnerablePct,0)),
    sceauBriseBossNumero:
      Math.max(0,Math.floor(nombreSorealIdle_(s.sceauBriseBossNumero,0))),

    bestiaireRencontres:
      s.bestiaireRencontres &&
      typeof s.bestiaireRencontres === 'object' &&
      !Array.isArray(s.bestiaireRencontres)
        ? s.bestiaireRencontres
        : {},

    bestiaireBossRunVersionV207:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            s.bestiaireBossRunVersionV207,
            0
          )
        )
      ),

    bestiaireBossRunMaxNumeroV207:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            s.bestiaireBossRunMaxNumeroV207,
            0
          )
        )
      ),

    modeleJeuVersion:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            s.modeleJeuVersion,
            0
          )
        )
      ),

    entrainementBase:
      s.entrainementBase &&
      typeof s.entrainementBase === 'object' &&
      !Array.isArray(s.entrainementBase)
        ? s.entrainementBase
        : null,

    /*
     * Correctif 2026-09-18 (EXP Shop, repro en production) : ce parseur
     * reconstruit un objet whitelisté à chaque lecture de STATS_JSON.
     * legacyXpMigratedV54 était écrit après la migration XP mais n'était
     * jamais recopié ici ; il redevenait donc undefined au prochain appel.
     * appliquerProgressionEnergieSorealIdle_ réimportait alors la vieille
     * colonne XP via Math.max(metaNgu EXP, row XP), remboursant de fait
     * l'achat précédent. Ce marqueur fait partie de l'état persistant.
     */
    legacyXpMigratedV54:
      Boolean(s.legacyXpMigratedV54),

    metaNgu:
      s.metaNgu &&
      typeof s.metaNgu === 'object' &&
      !Array.isArray(s.metaNgu)
        ? s.metaNgu
        : null,

    aventureDerniereRequestId:
      String(
        s.aventureDerniereRequestId || ''
      ),

    aventureDernierResultat:
      s.aventureDernierResultat &&
      typeof s.aventureDernierResultat === 'object'
        ? s.aventureDernierResultat
        : null
  };
}


function cleBestiaireBossPrincipalSorealIdle_(
  numero
) {
  return (
    'boss:' +
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          numero,
          1
        )
      )
    )
  );
}


function cleBestiaireMonstreSorealIdle_(
  monstre
) {
  return (
    'aventure:' +
    String(
      monstre &&
      monstre.id || ''
    ).trim()
  );
}


function marquerRencontreBestiaireSorealIdle_(
  stats,
  cle
) {
  const key =
    String(
      cle || ''
    ).trim();

  if (
    !stats ||
    !key
  ) {
    return false;
  }

  if (
    !stats.bestiaireRencontres ||
    typeof stats.bestiaireRencontres !==
      'object' ||
    Array.isArray(
      stats.bestiaireRencontres
    )
  ) {
    stats.bestiaireRencontres = {};
  }

  const precedent =
    stats.bestiaireRencontres[
      key
    ];

  const existait =
    Boolean(
      precedent &&
      typeof precedent === 'object' &&
      nombreSorealIdle_(
        precedent.rencontres,
        0
      ) > 0
    );

  const maintenant =
    Date.now();

  stats.bestiaireRencontres[
    key
  ] = {
    rencontres:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            precedent &&
            precedent.rencontres,
            0
          )
        )
      ) + 1,

    premiereRencontre:
      existait
        ? Math.max(
            0,
            nombreSorealIdle_(
              precedent.premiereRencontre,
              maintenant
            )
          )
        : maintenant,

    derniereRencontre:
      maintenant
  };

  return !existait;
}


function marquerRencontreBossPrincipalUneFoisParRunV207_(
  stats,
  numero,
  bossVaincusCourant
) {
  if (!stats) return false;

  /*
   * Avant V207, chaque clic Fight incrémentait "rencontres". Un boss
   * difficile pouvait donc afficher 7 rencontres simplement parce que le
   * joueur avait perdu/repris 7 fois, alors que les premiers boss du run
   * n'étaient comptés qu'une fois. Une rencontre de Boss principal est
   * désormais comptée UNE fois par run et par boss, pas une fois par
   * tentative de combat.
   *
   * Migration douce : au premier appel sur une ancienne sauvegarde, les
   * boss déjà vaincus dans le run courant sont considérés comme déjà
   * rencontrés ; on ne les recompte pas artificiellement.
   */
  if (stats.bestiaireBossRunVersionV207 !== 207) {
    stats.bestiaireBossRunVersionV207 = 207;
    stats.bestiaireBossRunMaxNumeroV207 =
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            bossVaincusCourant,
            0
          )
        )
      );
  }

  const n =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          numero,
          1
        )
      )
    );

  if (
    n <=
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          stats.bestiaireBossRunMaxNumeroV207,
          0
        )
      )
    )
  ) {
    return false;
  }

  const nouveau =
    marquerRencontreBestiaireSorealIdle_(
      stats,
      cleBestiaireBossPrincipalSorealIdle_(n)
    );

  stats.bestiaireBossRunMaxNumeroV207 = n;

  return nouveau;
}


function construireBestiaireSorealIdle_(
  row,
  highestBossEver
) {
  const c =
    CONFIG_SOREAL_IDLE
      .COLONNES_JOUEURS;

  const niveau =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          row[c.NIVEAU - 1],
          1
        )
      )
    );

  const requis = 0;

  const stats =
    statsJoueurSorealIdle_(
      row[c.STATS_JSON - 1]
    );

  const rencontres =
    stats.bestiaireRencontres ||
    {};

  /*
   * Norman (2026-09-11) : le mode Aventure (dont le Bestiaire fait partie —
   * "The adventure mode screen also enables access to the Bestiary", wiki NGU)
   * doit se reverrouiller après un Rebirth jusqu'à re-vaincre le boss requis
   * CE run, comme le jeu réel (voir le commentaire équivalent dans
   * construireAventureSorealIdle_). Seule la DÉCOUVERTE d'un boss (a-t-on
   * déjà croisé/vaincu ce boss un jour, pour la Collection) reste permanente
   * — c'est la seule chose pour laquelle le high-water-mark historique
   * (highestBossEver) doit encore compter ici.
   */
  const bossVaincusActuel =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          row[
            c.BOSS_VAINCUS - 1
          ],
          0
        )
      )
    );

  const bossVaincus =
    Math.max(
      bossVaincusActuel,
      Math.floor(
        nombreSorealIdle_(
          highestBossEver,
          0
        )
      )
    );

  const entrees = [];

  const catalogueBossBestiaireV207 =
    bossCatalogueSorealIdle_();

  /*
   * Réparation d'affichage des anciens compteurs pré-V207.
   * Les boss sont obligatoirement rencontrés dans l'ordre : si le boss N
   * possède X rencontres uniques de run, aucun boss antérieur ne peut en
   * avoir moins. Les anciennes tentatives répétées ont malheureusement
   * détruit cette information exacte ; on applique donc le minimum
   * historiquement cohérent (suffix max), sans inventer de rencontres
   * supplémentaires pour les boss plus récents.
   */
  const rencontresBossAffichageV207 =
    catalogueBossBestiaireV207.map(function(_boss,index){
      const trace =
        rencontres[
          cleBestiaireBossPrincipalSorealIdle_(index + 1)
        ];
      return Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            trace && trace.rencontres,
            0
          )
        )
      );
    });

  for (
    let i = rencontresBossAffichageV207.length - 2;
    i >= 0;
    i -= 1
  ) {
    rencontresBossAffichageV207[i] =
      Math.max(
        rencontresBossAffichageV207[i],
        rencontresBossAffichageV207[i + 1]
      );
  }

  catalogueBossBestiaireV207
    .forEach(function(boss,index) {
      const cle =
        cleBestiaireBossPrincipalSorealIdle_(
          index + 1
        );

      /*
       * Compatibilité avec les sauvegardes précédant le Bestiaire :
       * un boss déjà vaincu a forcément déjà été rencontré.
       */
      const legacy =
        index < bossVaincus;

      /* 2026-09-23 : la Collection affichait les colonnes brutes du catalogue historique (PV/Attaque inventés) ;
         elle lit maintenant la définition réellement utilisée au combat (référence wiki : Attaque, Défense, PV, EXP). */
      const definitionCollection = definitionBossSorealIdle_(index, 'normal');

      const trace =
        rencontres[cle] &&
        typeof rencontres[cle] ===
          'object'
          ? rencontres[cle]
          : null;

      const decouvert =
        Boolean(
          legacy ||
          (
            trace &&
            nombreSorealIdle_(
              trace.rencontres,
              0
            ) > 0
          )
        );

      entrees.push({
        cle:
          cle,
        source:
          'boss',
        type:
          'boss_principal',
        categorie:
          'Boss',
        rare:
          false,
        decouvert:
          decouvert,
        rencontres:
          decouvert
            ? Math.max(
                legacy ? 1 : 0,
                rencontresBossAffichageV207[index]
              )
            : 0,
        numero:
          index + 1,
        zoneId:
          0,
        nom:
          decouvert
            ? String(
                definitionCollection.nom || boss.nom || 'Boss'
              )
            : '???????',
        emoji:
          decouvert
            ? '👹'
            : '❔',
        pv:
          decouvert
            ? Math.max(1, nombreSorealIdle_(definitionCollection.pv, 1))
            : 0,
        attaque:
          decouvert
            ? Math.max(0, nombreSorealIdle_(definitionCollection.attaque, 0))
            : 0,
        defense:
          decouvert
            ? Math.max(0, nombreSorealIdle_(definitionCollection.defense, 0))
            : 0,
        xp:
          decouvert
            ? Math.max(0, nombreSorealIdle_(definitionCollection.xp, 0))
            : 0,
        description:
          decouvert
            ? String(
                boss.histoire || ''
              )
            : '',
        driveFileId:
          decouvert
            ? String(
                boss.driveFileId || ''
              )
            : '',
        image:
          decouvert
            ? String(
                boss.image || ''
              )
            : ''
      });
    });

  /*
   * Audit 2026-09-13 (Norman) : "Les mobs du mode aventure se trouvent
   * tous dans mon R2 : soreal/idle/aventure/. Reconstruit tout en interne
   * pour que ça match. Mais les zones dans le jeu devront garder leurs
   * noms." Cause racine confirmée : monstresAventureSorealIdleGameV409_()
   * (catalogue légataire table IDLE_ZONES, zoneId NUMÉRIQUES) est un
   * système historique totalement disjoint des vraies zones V47
   * (IDLE_ADVENTURE_ZONES, id en chaîne tutorial/sewers/forest/...) —
   * marquerRencontreBestiaireSorealIdle_ n'est d'ailleurs jamais appelée
   * par le vrai chemin de combat actuel (rollKill/startZoneFight, V47),
   * seulement par un "combat auto" légataire injoignable depuis l'UI
   * actuelle. Le Bestiaire Aventure ne pouvait donc RIEN découvrir, pas
   * seulement afficher une mauvaise image.
   *
   * Reconstruit pour lire directement le VRAI état V47 du joueur
   * (s.zone.kills/bossKills, la seule source de vérité du combat
   * Aventure réel) et les VRAIS noms de zone déjà affichés au joueur
   * (IDLE_ADVENTURE_ZONES.name, ex. "Biobox maudites") — jamais un nom
   * générique ni une traduction wiki. Deux entrées par zone (mob normal +
   * gardien de zone), sur le modèle déjà utilisé pour Boss/Collection
   * (case verrouillée "???????" tant que non rencontré). L'image se
   * résout désormais côté client via /api/idle/media/mob (R2, déjà
   * fonctionnel pour les 11 zones actuellement implémentées), jamais un
   * champ image stocké ici.
   */
  const adventureStateBestiaireV1 =
    normalizeIdleAdventureStateV47(
      stats && stats.metaNgu && stats.metaNgu.adventure
    );
  /*
   * Norman (2026-09-15) : "tous les ennemis rencontrés en aventure
   * n'apparaissent pas dans collection... j'ai rencontré au moins 1 boss
   * et 2 mobs" alors que Collection n'en montrait que 2. Cause : cette
   * grille utilisait zone.kills/bossKills (incrémenté SEULEMENT en cas de
   * victoire, voir rollKill dans idle-adventure-v47.js) pour décider
   * "découvert", malgré le libellé "👁️ rencontre(s)" affiché à l'écran.
   * Un combat perdu ou fui n'était donc jamais compté. Utilise désormais
   * zone.encounters/bossEncounters (incrémenté dans startZoneFight, dès
   * la vraie rencontre, indépendamment de l'issue du combat) — kills/
   * bossKills gardent leur rôle inchangé ailleurs (tirage du boss).
   */
  const zoneEncountersBestiaireV1 =
    (adventureStateBestiaireV1.zone &&
      adventureStateBestiaireV1.zone.encounters) ||
    {};
  const zoneBossEncountersBestiaireV1 =
    (adventureStateBestiaireV1.zone &&
      adventureStateBestiaireV1.zone.bossEncounters) ||
    {};
  /*
   * Norman (2026-09-16) : "j'ai plusieurs images qui sont utilisée pour
   * le même mob [...] Chacune des image doit être reliée à un ennemi. Le
   * compte est bon normalement pour les premières zones." Root cause :
   * une seule entrée Collection par zone/boss-ou-normal, quel que soit
   * le nombre réel d'images R2 (3 à 8). Utilise désormais le suivi PAR
   * INDEX (mobEncountersByIndex/bossEncountersByIndex, startZoneFight)
   * pour émettre UNE entrée Collection par image du catalogue partagé
   * avec worker.js (SOREAL-APP) — jamais un second calcul du nom des
   * images, la seule source de vérité reste IDLE_ADVENTURE_MOB_CATALOG_V1.
   */
  const zoneMobIndexBestiaireV1 =
    (adventureStateBestiaireV1.zone &&
      adventureStateBestiaireV1.zone.mobEncountersByIndex) ||
    {};
  const zoneBossIndexBestiaireV1 =
    (adventureStateBestiaireV1.zone &&
      adventureStateBestiaireV1.zone.bossEncountersByIndex) ||
    {};
  function nomAffichageMobSorealIdleV1_(base) {
    return String(base || '')
      .split('_')
      .filter(Boolean)
      .map(function(mot) {
        return mot.charAt(0).toUpperCase() + mot.slice(1);
      })
      .join(' ') || 'Créature';
  }

  /*
   * Norman (2026-09-17) : "je veux que ce soit ALL the boss names, ALL
   * the mob names [...] les MEMES noms [que le vrai NGU] [...] tout ce
   * qui est Soreal disparait." Jusqu'ici, Collection affichait un nom
   * dérivé du fichier image R2 (ex. "pallet_goblin" -> "Pallet Goblin"),
   * un habillage SOREAL sans rapport avec le vrai nom NGU. Utilise
   * maintenant le vrai nom wiki depuis IDLE_ADVENTURE_MOB_BESTIARY_V1
   * quand une entrée existe pour CE zone/rôle/index précis (même lookup
   * que le combat réel, cf. idleAdventureMobBestiaryEntryV1 dans
   * idle-adventure-v47.js) -- jamais un second nom inventé. Ne retombe
   * sur l'ancien nom dérivé de l'image QUE pour les mobs sans entrée
   * bestiaire réelle (zones/rôles pas encore sourcés), jamais un
   * remplacement partiel silencieux.
   */
  function nomReelOuAffichageMobSorealIdleV1_(zoneId, estBoss, index) {
    const entreeBestiaire = idleAdventureMobBestiaryEntryV1(
      { id: zoneId },
      estBoss,
      index
    );
    if (entreeBestiaire && entreeBestiaire.name) {
      return String(entreeBestiaire.name);
    }
    return 'Créature NGU non documentée';
  }

  IDLE_ADVENTURE_ZONES
    .filter(function(zone) {
      return zone.id !== 'safe';
    })
    .forEach(function(zone) {
      const catalogueZone =
        IDLE_ADVENTURE_MOB_CATALOG_V1[zone.id] ||
        { normal: [], boss: [] };

      [false, true].forEach(function(estBoss) {
        const poolImages = estBoss ? catalogueZone.boss : catalogueZone.normal;
        /* 2026-09-23 : une entrée par ennemi du bestiaire wiki (stats réelles), l'image se résout par indice. */
        const bestiaireZoneCollection = IDLE_ADVENTURE_MOB_BESTIARY_V1[zone.id];
        const poolBestiaire = bestiaireZoneCollection
          ? (estBoss ? bestiaireZoneCollection.boss : bestiaireZoneCollection.normal) || []
          : [];
        const pool = poolBestiaire.length ? poolBestiaire : poolImages;

        /*
         * Repli (zones sans catalogue d'images pour l'instant, ex.
         * beardverse/badly/boring/chocolate — aucun dossier R2 dédié
         * encore) : garder l'ancien comportement (une seule entrée
         * générique par zone/rôle), jamais perdre une découverte déjà
         * comptée par le joueur faute d'art disponible.
         */
        if (!pool.length) {
          const rencontresCompteur =
            Math.max(
              0,
              Math.floor(
                nombreSorealIdle_(
                  estBoss
                    ? zoneBossEncountersBestiaireV1[zone.id]
                    : zoneEncountersBestiaireV1[zone.id],
                  0
                )
              )
            );
          const decouvert = rencontresCompteur > 0;

          entrees.push({
            cle: 'aventure:' + zone.id + (estBoss ? ':boss' : ':mob'),
            source: 'aventure',
            type: estBoss ? 'boss_zone' : 'normal',
            categorie: estBoss ? 'Gardien de zone' : 'Créature',
            rare: false,
            decouvert: decouvert,
            rencontres: rencontresCompteur,
            numero: 0,
            zone: zone.id,
            boss: estBoss ? 1 : 0,
            index: 0,
            zoneId: 0,
            nom: decouvert ? zone.name : '???????',
            emoji: decouvert ? (estBoss ? '👑' : '👾') : '❔',
            pv: 0,
            attaque: 0,
            description: '',
            driveFileId: '',
            image: ''
          });
          return;
        }

        const indexStore = estBoss ? zoneBossIndexBestiaireV1 : zoneMobIndexBestiaireV1;
        const indexCounters = indexStore[zone.id] || {};

        pool.forEach(function(_baseNom, index) {
          const rencontresCompteur =
            Math.max(
              0,
              Math.floor(
                nombreSorealIdle_(indexCounters[index], 0)
              )
            );
          const decouvert = rencontresCompteur > 0;
          const fichePropre = idleAdventureMobBestiaryEntryV1({ id: zone.id }, estBoss, index) || {};

          entrees.push({
            cle: 'aventure:' + zone.id + (estBoss ? ':boss:' : ':mob:') + index,
            source: 'aventure',
            type: estBoss ? 'boss_zone' : 'normal',
            categorie: estBoss ? 'Gardien de zone' : 'Créature',
            rare: false,
            decouvert: decouvert,
            rencontres: rencontresCompteur,
            numero: 0,
            zone: zone.id,
            boss: estBoss ? 1 : 0,
            index: index,
            zoneId: 0,
            nom: decouvert ? nomReelOuAffichageMobSorealIdleV1_(zone.id, estBoss, index) : '???????',
            emoji: decouvert ? (estBoss ? '👑' : '👾') : '❔',
            pv: decouvert ? nombreSorealIdle_(fichePropre.maxHp, 0) : 0,
            attaque: decouvert ? nombreSorealIdle_(fichePropre.power, 0) : 0,
            defense: decouvert ? nombreSorealIdle_(fichePropre.toughness, 0) : 0,
            regen: decouvert ? nombreSorealIdle_(fichePropre.hpRegen, 0) : 0,
            cadence: decouvert ? nombreSorealIdle_(fichePropre.attackRate, 0) : 0,
            typeMob: decouvert ? String(fichePropre.type || '') : '',
            description: '',
            driveFileId: '',
            image: ''
          });
        });
      });
    });

  return {
    debloquee:
      bossVaincusActuel >= 4,
    niveauRequis:
      requis,
    decouvertes:
      entrees.filter(
        function(entree) {
          return entree.decouvert;
        }
      ).length,
    entrees:
      entrees
  };
}


function genererObjetLegendaireRareAventureSorealIdle_(
  monstre,
  zone,
  niveauJoueur
) {
  // Audit 2026-09-16 : même décision que genererObjetLootSorealIdle_
  // ci-dessus -- plus de loot pour le combat de boss numéroté historique.
  void monstre;
  void zone;
  void niveauJoueur;
  return null;
}


function niveauMagieSorealIdle_() {
  return niveauDeblocageFonctionSorealIdle_(
    'magie',
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          parametreSorealIdle_(
            'MAGIE_NIVEAU_DEBLOCAGE',
            4
          ),
          4
        )
      )
    )
  );
}


function manaMaxSorealIdle_(niveau) {
  const n = Math.max(1,Math.floor(nombreSorealIdle_(niveau,1)));
  const debut = niveauMagieSorealIdle_();

  if (n < debut) {
    return 0;
  }

  return Math.max(
    1,
    Math.round(
      nombreSorealIdle_(
        parametreSorealIdle_('MANA_BASE',45),
        45
      ) +
      Math.max(0,n-debut) *
      nombreSorealIdle_(
        parametreSorealIdle_('MANA_PAR_NIVEAU',3),
        3
      )
    )
  );
}


function manaRegenSecondeSorealIdle_(niveau) {
  const n = Math.max(1,Math.floor(nombreSorealIdle_(niveau,1)));
  const debut = niveauMagieSorealIdle_();

  if (n < debut) {
    return 0;
  }

  return Math.max(
    0.01,
    nombreSorealIdle_(
      parametreSorealIdle_('MANA_REGEN_BASE_SEC',0.12),
      0.12
    ) +
    Math.max(0,n-debut) *
    nombreSorealIdle_(
      parametreSorealIdle_('MANA_REGEN_PAR_NIVEAU',0.004),
      0.004
    )
  );
}


function mettreAJourManaStatsSorealIdle_(
  stats,
  niveau,
  maintenantMs
) {
  const s = stats || {};
  const maintenant = Math.max(0,nombreSorealIdle_(maintenantMs,Date.now()));
  const max = manaMaxSorealIdle_(niveau);
  const regen = manaRegenSecondeSorealIdle_(niveau);

  if (max <= 0) {
    s.mana = 0;
    s.manaMajMs = maintenant;
    return {mana:0,max:0,regen:0};
  }

  if (
    nombreSorealIdle_(s.mana,-1) < 0 ||
    nombreSorealIdle_(s.manaMajMs,0) <= 0
  ) {
    s.mana = max;
    s.manaMajMs = maintenant;
    return {mana:max,max:max,regen:regen};
  }

  const ecoule = Math.max(
    0,
    (maintenant - nombreSorealIdle_(s.manaMajMs,maintenant))/1000
  );

  s.mana = Math.min(
    max,
    Math.max(0,nombreSorealIdle_(s.mana,0)) + ecoule * regen
  );
  s.manaMajMs = maintenant;

  return {
    mana:s.mana,
    max:max,
    regen:regen
  };
}


function capaciteBossTypeSorealIdle_(bossIndex,type) {
  const cible = String(type || '').trim().toLowerCase();
  return capacitesBossSorealIdle_(bossIndex)
    .find(function(cap){
      return String(cap && cap.type || '').trim().toLowerCase() === cible;
    }) || null;
}


function multiplicateurSceauBossSorealIdle_(bossIndex,stats) {
  const sceau = capaciteBossTypeSorealIdle_(bossIndex,'sceau');

  if (!sceau) {
    return 1;
  }

  if (
    Math.floor(nombreSorealIdle_(stats && stats.sceauBriseBossNumero,0)) ===
    bossIndex + 1
  ) {
    return 1;
  }

  return Math.max(
    0.05,
    1 - Math.min(95,Math.max(0,nombreSorealIdle_(sceau.valeur,70)))/100
  );
}


function idsEquipementSorealIdle_(equipement) {
  return slotsEquipementSorealIdle_()
    .map(function(slot){
      const v=
        equipement &&
        equipement[slot];

      return v &&
        typeof v==='object'
          ?String(v.id||'')
          :String(v||'');
    })
    .filter(Boolean);
}


function nombreObjetsSacSorealIdle_(inventaire,equipement) {
  const ids=idsEquipementSorealIdle_(equipement);
  return (Array.isArray(inventaire)?inventaire:[])
    .filter(function(o){
      return ids.indexOf(String(o&&o.id||''))===-1;
    }).length;
}


function bonusSetsSorealIdle_(
  inventaire,
  equipement
) {
  const details =
    detailsEquipementSorealIdle_(
      inventaire,
      equipement
    );

  const groupes = {};

  slotsEquipementSorealIdle_()
    .forEach(function(slot) {
      const objet =
        details[slot];

      if (
        !objet ||
        !objet.setId
      ) {
        return;
      }

      const id =
        String(
          objet.setId
        );

      groupes[id] =
        (groupes[id] || 0) + 1;
    });

  let pourcent = 0;
  const actifs = [];

  Object.keys(groupes)
    .forEach(function(setId) {
      const set =
        setParIdSorealIdle_(
          setId
        );

      if (!set) {
        return;
      }

      const pieces =
        groupes[setId];

      // Palier unique a la piece complete (set.pieces6, toujours 6 dans le
      // moteur SOREAL) : le vrai NGU ne donne qu'un seul bonus de
      // complétion par set, jamais de paliers intermediaires 2pc/4pc.
      let bonus = 0;

      if (
        pieces >= set.pieces6
      ) {
        bonus =
          set.bonus6Pct;
      }

      if (bonus > 0) {
        pourcent += bonus;

        actifs.push({
          id:
            set.id,

          nom:
            set.nom,

          pieces:
            pieces,

          piecesMax:
            set.pieces6,

          bonusPourcent:
            bonus,

          apparence:
            set.apparence,

          complet:
            pieces >= set.pieces6,

          description:
            set.description
        });
      }
    });

  return {
    pourcent:
      pourcent,

    actifs:
      actifs
  };
}


function coutForgeSorealIdle_(objet) {
  const niveau =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          objet && objet.forge,
          0
        )
      )
    );

  const base =
    Math.max(
      1,
      nombreSorealIdle_(
        parametreSorealIdle_(
          'FORGE_COUT_BASE',
          5
        ),
        5
      )
    );

  const croissance =
    Math.max(
      1,
      nombreSorealIdle_(
        parametreSorealIdle_(
          'FORGE_CROISSANCE',
          1.7
        ),
        1.7
      )
    );

  return Math.max(
    1,
    Math.round(
      base *
      Math.pow(
        croissance,
        niveau
      )
    )
  );
}


function coutExtensionSacSorealIdle_(
  capacite
) {
  const baseCapacite =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          parametreSorealIdle_(
            'INVENTAIRE_CAPACITE_BASE',
            CONFIG_SOREAL_IDLE
              .INVENTAIRE_CAPACITE_BASE
          ),
          CONFIG_SOREAL_IDLE
            .INVENTAIRE_CAPACITE_BASE
        )
      )
    );

  const pas =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          parametreSorealIdle_(
            'INVENTAIRE_EXTENSION_PAS',
            3
          ),
          3
        )
      )
    );

  const extensions =
    Math.max(
      0,
      Math.floor(
        (
          nombreSorealIdle_(
            capacite,
            baseCapacite
          ) -
          baseCapacite
        ) /
        pas
      )
    );

  return Math.max(
    1,
    Math.round(
      nombreSorealIdle_(
        parametreSorealIdle_(
          'INVENTAIRE_EXTENSION_COUT_BASE',
          25
        ),
        25
      ) *
      Math.pow(
        Math.max(
          1,
          nombreSorealIdle_(
            parametreSorealIdle_(
              'INVENTAIRE_EXTENSION_CROISSANCE',
              1.85
            ),
            1.85
          )
        ),
        extensions
      )
    )
  );
}


/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * `difficulty` (2e paramètre, optionnel, défaut "normal" via
 * definitionBossSorealIdle_/nguBossStatsV1) -- propage le diviseur ×1e-30
 * jusqu'à la vraie boucle de dégâts (degatsRecusSecondeSorealIdle_
 * ci-dessous, qui appelle cette fonction).
 */
function attaqueBossSorealIdle_(
  bossVaincus,
  difficulty
) {
  return Math.max(
    1,
    Math.round(
      nombreSorealIdle_(
        definitionBossSorealIdle_(
          bossVaincus,
          difficulty
        ).attaque,
        CONFIG_SOREAL_IDLE.ATTAQUE_BOSS_BASE
      )
    )
  );
}

/*
 * Audit 2026-09-13 (Norman) : pendant du attaqueBossSorealIdle_ ci-dessus,
 * pour la Defense — nécessaire pour que le dégât du joueur contre le boss
 * puisse enfin la soustraire (wiki NGU, page Attack). `difficulty` : même
 * propagation que ci-dessus (2026-09-18).
 */
function defenseBossSorealIdle_(
  bossVaincus,
  difficulty
) {
  return Math.max(
    1,
    Math.round(
      nombreSorealIdle_(
        definitionBossSorealIdle_(
          bossVaincus,
          difficulty
        ).defense,
        CONFIG_SOREAL_IDLE.ATTAQUE_BOSS_BASE
      )
    )
  );
}




/*
 * V53 : plus de niveau joueur global requis pour affronter un boss —
 * la progression est gérée par le moteur NGU meta. Code mort retiré
 * (audit 2026-09-17, grand nettoyage) : l'ancien calcul par
 * definitionBossSorealIdle_(index).niveauRequis n'était plus jamais
 * atteint après ce `return 1;`.
 */
function niveauRequisBossSorealIdle_(
  bossIndex
) {
  void bossIndex;
  return 1;
}


function recompenseXpBossNiveauSorealIdle_(
  bossIndex,
  niveauJoueur
) {
  // V53: boss rewards are EXP currency. There is no global player-level
  // scaling anymore; later multipliers come from the NGU meta engine.
  void niveauJoueur;
  return xpBossSorealIdle_(bossIndex);
}


function delaiRespawnBossSorealIdle_(
  bossIndex
) {
  /*
   * V41.2 — un boss principal vaincu ne se reforme plus pendant le run.
   * Le compteur reste uniquement comme surface de compatibilité pour les
   * anciens clients : sa valeur est toujours 0.
   */
  void bossIndex;
  return 0;
}


function mondeZoneAventureSorealIdle_(
  zone
) {
  if (
    zone &&
    nombreSorealIdle_(
      zone.monde,
      0
    ) > 0
  ) {
    return Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          zone.monde,
          1
        )
      )
    );
  }

  const zonesParMonde =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          parametreSorealIdle_(
            'AVENTURE_ZONES_PAR_MONDE',
            6
          ),
          6
        )
      )
    );

  return Math.floor(
    (
      Math.max(
        1,
        Math.floor(
          nombreSorealIdle_(
            zone && zone.id,
            1
          )
        )
      ) -
      1
    ) /
    zonesParMonde
  ) + 1;
}


function cooldownAventureSorealIdle_(
  zone,
  stats
) {
  const base =
    Math.max(
      0,
      nombreSorealIdle_(
        parametreSorealIdle_(
          'AVENTURE_COOLDOWN_BASE_SECONDES',
          5
        ),
        5
      )
    );

  const monde =
    mondeZoneAventureSorealIdle_(
      zone
    );

  const mondeReductionMin =
    Math.max(
      2,
      Math.floor(
        nombreSorealIdle_(
          parametreSorealIdle_(
            'AVENTURE_COOLDOWN_REDUCTION_MONDE_MIN',
            2
          ),
          2
        )
      )
    );

  /*
   * Monde 1 : le temps d'attente fait partie du rythme de départ.
   * Aucun bonus futur ne peut encore le réduire.
   */
  if (monde < mondeReductionMin) {
    return base;
  }

  /*
   * À partir du Monde 2, les futurs systèmes pourront pousser la
   * réduction très loin. Le réseau n'est jamais inclus dans ce délai.
   */
  const bonusMeta=
    idleNguBonuses(
      stats&&stats.metaNgu
    );

  const reduction =
    Math.max(
      0,
      Math.min(
        99,
        nombreSorealIdle_(
          stats &&
          stats.aventureCooldownReductionPct,
          0
        ) +
        Math.max(
          0,
          nombreSorealIdle_(
            bonusMeta.respawnReduction,
            0
          ) *
          100
        )
      )
    );

  const minimum =
    Math.max(
      0.05,
      nombreSorealIdle_(
        parametreSorealIdle_(
          'AVENTURE_COOLDOWN_MIN_SECONDES',
          0.15
        ),
        0.15
      )
    );

  return Math.max(
    minimum,
    base *
    (
      1 -
      reduction / 100
    )
  );
}


/*
 * Audit 2026-09-17 (grand nettoyage) : simulerCoupsAventureSorealIdleV43_
 * (timeline de coups V43 pour l'ancien combat Adventure du moteur
 * legacy) n'avait plus aucun appelant — combattreAventureSorealIdle,
 * son seul consommateur, est désactivée depuis le passage au moteur
 * NGU V47 (SOREAL_IDLE_V47_LEGACY_DISABLED). Supprimée.
 */


function capacitesBossSorealIdle_(
  bossIndex
) {
  const definition =
    definitionBossSorealIdle_(
      bossIndex
    );

  return Array.isArray(
    definition &&
    definition.capacites
  )
    ? definition.capacites
    : [];
}


function capaciteBossSorealIdle_(
  bossIndex,
  type
) {
  const cible =
    String(type || '')
      .trim()
      .toLowerCase();

  return capacitesBossSorealIdle_(
    bossIndex
  ).filter(function(capacite) {
    return String(
      capacite &&
      capacite.type || ''
    )
      .trim()
      .toLowerCase() === cible;
  });
}


function multiplicateurDpsJoueurBossSorealIdle_(
  bossIndex,
  ignorerParalysie
) {
  let multiplicateur = 1;

  capacitesBossSorealIdle_(
    bossIndex
  ).forEach(function(capacite) {
    const type =
      String(
        capacite.type || ''
      ).toLowerCase();

    const intervalle =
      Math.max(
        0.01,
        nombreSorealIdle_(
          capacite.intervalle,
          0
        )
      );

    const duree =
      Math.max(
        0,
        nombreSorealIdle_(
          capacite.duree,
          0
        )
      );

    if (
      type === 'paralysie' &&
      intervalle > 0 &&
      !ignorerParalysie
    ) {
      multiplicateur *=
        Math.max(
          0.05,
          1 -
          Math.min(
            0.85,
            duree / intervalle
          )
        );
    }

    if (
      type === 'bouclier' &&
      intervalle > 0
    ) {
      const reduction =
        Math.max(
          0,
          Math.min(
            0.95,
            nombreSorealIdle_(
              capacite.valeur,
              0
            ) / 100
          )
        );

      const occupation =
        Math.max(
          0,
          Math.min(
            0.85,
            duree / intervalle
          )
        );

      multiplicateur *=
        Math.max(
          0.05,
          1 -
          reduction *
          occupation
        );
    }
  });

  return Math.max(
    0.02,
    multiplicateur
  );
}


function regenBossSecondeSorealIdle_(
  bossIndex,
  pvMax
) {
  /*
   * Fight Boss NGU expose un HP Regen propre au boss (bf_hp_regen).
   * Ce n'est PAS Defense/20 : cette formule appartient au joueur.
   * nguBossStatsV1 fournit désormais cette valeur sourcée sous "regen".
   *
   * On met à l'échelle par le ratio PV réels / PV de référence afin que
   * les difficultés Evil/Sadistic, qui divisent les stats Fight Boss,
   * conservent la même proportion sans dupliquer une seconde table.
   */
  const reference=
    nguBossStatsV1(
      bossIndex
    );

  const pvReference=
    Math.max(
      1,
      nombreSorealIdle_(
        reference&&reference.pv,
        1
      )
    );

  const regenReference=
    Math.max(
      0,
      nombreSorealIdle_(
        reference&&reference.regen,
        0
      )
    );

  const ratioPv=
    Math.max(
      0,
      nombreSorealIdle_(
        pvMax,
        pvReference
      )
    )/
    pvReference;

  return regenReference*ratioPv;
}

function multiplicateurAttaqueBossSorealIdle_(
  bossIndex,
  pvBoss,
  pvBossMax
) {
  const seuilPct =
    Math.max(
      1,
      Math.min(
        90,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'BOSS_FUREUR_SEUIL_PCT',
            30
          ),
          30
        )
      )
    );

  const sousSeuil =
    nombreSorealIdle_(
      pvBoss,
      pvBossMax
    ) <=
    Math.max(
      1,
      nombreSorealIdle_(
        pvBossMax,
        1
      )
    ) *
    seuilPct /
    100;

  if(!sousSeuil){
    return 1;
  }

  let multiplicateur = 1;

  capaciteBossSorealIdle_(
    bossIndex,
    'fureur'
  ).forEach(function(capacite) {
    multiplicateur *=
      1 +
      Math.max(
        0,
        nombreSorealIdle_(
          capacite.valeur,
          0
        )
      ) /
      100;
  });

  return multiplicateur;
}


/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * `difficulty` (5e paramètre, optionnel) propagé jusqu'à
 * attaqueBossSorealIdle_ -- voir NGU_BOSS_EVIL_SADISTIC_DIVIDER_V1
 * (idle-ngu-boss-reference-v1.js).
 */
function degatsRecusSecondeSorealIdle_(
  bossVaincus,
  defense,
  pvBoss,
  pvBossMax,
  difficulty
) {
  const index =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          bossVaincus,
          0
        )
      )
    );

  const attaque =
    attaqueBossSorealIdle_(
      index,
      difficulty
    ) *
    multiplicateurAttaqueBossSorealIdle_(
      index,
      pvBoss,
      pvBossMax
    );

  /*
   * NGU Fight Boss : dégâts entrants = Boss Attack - Defense.
   * Defense >= Boss Attack signifie 0 dégât ; aucun plancher de 1 PV
   * ni 12 % de l'attaque n'existe dans cette règle.
   */
  return Math.max(
    0,
    attaque -
    Math.max(
      0,
      nombreSorealIdle_(
        defense,
        0
      )
    )
  );
}

function recalculerPuissanceCompleteSorealIdle_(
  feuille,
  ligne
) {
  const c =
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  const row =
    feuille
      .getRange(
        ligne,
        1,
        1,
        c.STATS_JSON
      )
      .getValues()[0];

  const stats =
    statsJoueurSorealIdle_(
      row[
        c.STATS_JSON - 1
      ]
    );

  const inventaire =
    parserJsonSorealIdle_(
      row[
        c.INVENTAIRE_JSON - 1
      ],
      []
    );

  const equipement =
    parserJsonSorealIdle_(
      row[
        c.EQUIPEMENT_JSON - 1
      ],
      {}
    );

  const collection =
    parserJsonSorealIdle_(
      row[
        c.COLLECTION_JSON - 1
      ],
      {}
    );

  const combat =
    statsCombatPrincipalSorealIdleV413_(
      stats,
      inventaire,
      equipement,
      row[
        c.AMELIORATIONS_JSON - 1
      ],
      row[
        c.ESSENCE_RENAISSANCE - 1
      ],
      collection
    );

  const ancienPv =
    Math.max(
      0,
      nombreSorealIdle_(
        row[
          c.PV_JOUEUR - 1
        ],
        combat.pvMax
      )
    );

  feuille
    .getRange(
      ligne,
      c.FORCE
    )
    .setValue(
      combat.attaque
    );

  feuille
    .getRange(
      ligne,
      c.ENDURANCE
    )
    .setValue(
      combat.defense
    );

  feuille
    .getRange(
      ligne,
      c.PUISSANCE
    )
    .setValue(
      combat.attaque
    );

  feuille
    .getRange(
      ligne,
      c.PV_JOUEUR_MAX
    )
    .setValue(
      combat.pvMax
    );

  feuille
    .getRange(
      ligne,
      c.PV_JOUEUR
    )
    .setValue(
      Math.min(
        combat.pvMax,
        ancienPv
      )
    );

  return combat.attaque;
}

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * `difficulty` (3e paramètre, optionnel, défaut "normal") -- prépare le
 * diviseur ×1e-30 (nguBossStatsV1, idle-ngu-boss-reference-v1.js) sans
 * casser aucun appelant existant : "normal" reproduit exactement le
 * comportement d'avant ce correctif. Le branchement de contexte.difficulty
 * (déjà exposé par contexteMetaNguSorealIdle_) sur chaque site d'appel
 * réel du combat se fait progressivement, site par site -- voir le suivi
 * dans les commits suivants plutôt qu'un unique gros changement risqué
 * sur ~20 sites d'appel du moteur de combat en production.
 */
function equilibrerBossPrincipalSorealIdleV413_(
  definition,
  index,
  difficulty
) {
  const source =
    definition &&
    typeof definition === 'object'
      ? definition
      : {};

  const i =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          index,
          0
        )
      )
    );

  /*
   * V56 — mission NGU (2026-09-09) : le plancher géométrique inventé
   * (×3/boss PV, ×2/boss Attaque) sous-estimait massivement la vraie
   * progression NGU (×5/boss du boss 5 au boss 20, ×10/boss à partir du
   * boss 21 — sourcé, vérifié exact sur 160 boss, voir
   * cloudflare/reference/README.md et idle-ngu-boss-reference-v1.js).
   * Cette sous-estimation explique très probablement le bug signalé où
   * les 20 premiers boss pouvaient être tués en spammant le bouton fight.
   *
   * Le plancher reste un MAX (pas un remplacement) : un catalogue qui
   * définit volontairement un boss plus fort (identité/histoire SOREAL)
   * garde le dessus. Seule la valeur plancher change, du placeholder
   * inventé vers la vraie courbe NGU.
   */
  const reference =
    nguBossStatsV1(i, difficulty);

  const pvMinimum = reference.pv;
  const attaqueMinimum = reference.attaque;
  const defenseMinimum = reference.defense;
  const xpMinimum = reference.xp;

  return Object.assign(
    {},
    source,
    {
      /*
       * Le catalogue historique ne définit plus l'identité d'un boss : il
       * peut rester présent dans une base existante, mais les noms affichés
       * sont toujours ceux de NGU, localisés en français.
       */
      nom:
        NGU_BOSS_NAMES_FR_V1.get(i + 1) ||
        String(source.nom || "Boss"),

      pv:
        Math.max(
          1,
          Math.round(
            pvMinimum
          )
        ),

      attaque:
        Math.max(
          1,
          Math.round(
            attaqueMinimum
          )
        ),

      /*
       * Audit 2026-09-13 (Norman, en jouant SOREAL et NGU en parallèle) :
       * la Defense d'un boss n'existait nulle part côté runtime — le
       * dégât du joueur contre le boss ne pouvait donc jamais la
       * soustraire (contrairement au wiki, page Attack : "Your attack
       * minus the defense of the boss is the amount you deduct from the
       * HP of the boss per second"). Même plancher (MAX, jamais un
       * remplacement) que pv/attaque ci-dessus, depuis la même référence
       * sourcée du wiki.
       */
      defense:
        Math.max(
          1,
          Math.round(
            defenseMinimum
          )
        ),

      /*
       * 2026-09-17 — contrairement à pv/attaque/defense (un plancher
       * légitime : un boss du catalogue SOREAL peut volontairement être
       * plus fort que la courbe NGU, identité propre au jeu), le XP stocké
       * dans IDLE_BOSS n'a jamais été un choix de design : 100/120/180/
       * .../19000 sur les boss 1-20 étaient des valeurs inventées, jamais
       * sourcées (comme le reste de ce fichier avant la mission NGU
       * 2026-09-09). Un simple MAX(source.xp, xpMinimum) ne pouvait donc
       * JAMAIS corriger ce bug : la valeur inventée est toujours
       * strictement supérieure au vrai plancher NGU (100 > 0, 19000 > 1,
       * etc.), donc toujours gagnante. Norman a vérifié en direct sur le
       * wiki (20 fiches boss individuelles, ngu-idle.fandom.com) que le XP
       * réel des boss 1-20 est 0/0/0/1/0/0/1×14 — EXACTEMENT
       * nguBossStatsV1(i).xp pour ces index (déjà sourcé le 2026-09-09,
       * jamais branché comme valeur autoritaire jusqu'ici). Le XP devient
       * donc autoritaire depuis la référence sourcée pour toute la plage
       * couverte par NGU_BOSS_REFERENCE_V1, plutôt qu'un plancher que la
       * donnée inventée pouvait toujours dominer.
       */
      xp:
        Math.max(
          0,
          Math.round(
            xpMinimum
          )
        ),

      /*
       * V185 — l'équilibrage NGU ne doit modifier que les statistiques.
       * L'identité éditoriale du boss (Histoire/Conseil) vient du même
       * catalogue IDLE_BOSS que Collection. L'ancien effacement ici faisait
       * que Collection affichait le texte tandis que Fight Boss recevait
       * bossHistoire="" et bossConseil="".
       */
      histoire:
        String(
          source.histoire || ""
        ),
      conseil:
        String(
          source.conseil || ""
        )
    }
  );
}


function profilEquipementCombatPrincipalSorealIdleV413_(
  inventaire,
  equipement
) {
  const details =
    detailsEquipementSorealIdle_(
      inventaire,
      equipement
    );

  let piecesEquipees = 0;
  let scorePuissance = 0;
  let piecesArmure = 0;
  let scoreArmure = 0;

  slotsEquipementSorealIdle_()
    .forEach(function(slot) {
      const objet =
        details &&
        details[slot]
          ? details[slot]
          : null;

      if (!objet) {
        return;
      }

      piecesEquipees += 1;

      const bonus =
        Math.max(
          0,
          nombreSorealIdle_(
            objet.bonusPuissance,
            0
          )
        );

      scorePuissance += bonus;

      if (
        slot === 'tete' ||
        slot === 'torse' ||
        slot === 'bottes'
      ) {
        piecesArmure += 1;
        scoreArmure += bonus;
      }
    });

  /*
   * Chaque pièce est utile même si son bonus brut est faible.
   * Le score de l'objet affine ensuite le multiplicateur.
   *
   * Ex. trois petits loots de zone 1 tournent typiquement autour
   * de +45 à +60 % d'attaque totale, ce qui est suffisant pour
   * faire sentir immédiatement le farm sans rendre le stuff dominant.
   */
  const multiplicateurAttaque =
    Math.min(
      3.5,
      1 +
      piecesEquipees * 0.08 +
      scorePuissance * 0.03
    );

  const multiplicateurDefense =
    Math.min(
      3.5,
      1 +
      piecesArmure * 0.10 +
      scoreArmure * 0.04
    );

  return {
    piecesEquipees:
      piecesEquipees,

    scorePuissance:
      scorePuissance,

    piecesArmure:
      piecesArmure,

    scoreArmure:
      scoreArmure,

    multiplicateurAttaque:
      Math.max(
        1,
        multiplicateurAttaque
      ),

    multiplicateurDefense:
      Math.max(
        1,
        multiplicateurDefense
      )
  };
}


function statsCombatPrincipalSorealIdleV413_(
  stats,
  inventaire,
  equipement,
  ameliorations,
  essence,
  collection
) {
  const etatStats =
    stats &&
    typeof stats === 'object'
      ? stats
      : {};

  const entrainement =
    deriveBasicTrainingStatsV411(
      normalizeBasicTrainingStateV411(
        etatStats.entrainementBase,
        Date.now()
      )
    );

  const profilEquipement =
    profilEquipementCombatPrincipalSorealIdleV413_(
      inventaire,
      equipement
    );

  // Legacy Piece-shop power must not stack with NGU progression.
  void ameliorations;
  void essence;
  const bonusBoutique = 0;

  const bonusMetaNgu =
    idleNguBonuses(
      etatStats.metaNgu
    );

  const bonusSets =
    bonusSetsSorealIdle_(
      inventaire,
      equipement
    );

  const bonusCollections =
    progressionCollectionsSorealIdle_(
      collection &&
      typeof collection === 'object'
        ? collection
        : {}
    );

  /*
   * Audit 2026-09-16 : dans le vrai NGU Idle, l'équipement/loot n'existe
   * QUE dans Adventure Mode — le combat de boss numéroté (Fight Boss/
   * Basic Training) n'a AUCUN objet équipé dans le vrai jeu, juste
   * Attack/Defense entraînés (+ NGU/Perks/Quirks). Le système de loot de
   * ce moteur historique (forge, équipement, sets, collections) était
   * une invention SOREAL sans équivalent NGU. Décision de Norman
   * (2026-09-16) : retirer cet effet du combat pour une fidélité NGU
   * totale — bonusSets/bonusCollections restent calculés ci-dessus
   * (aucune donnée supprimée, gel propre) mais ne contribuent plus au
   * combat. void pour ne jamais dériver "variable inutilisée".
   */
  void bonusSets;
  void bonusCollections;
  const multiplicateurPermanent = 1;

  const attaqueEntrainement =
    Math.max(
      100,
      nombreSorealIdle_(
        entrainement.attack,
        100
      )
    );

  const defenseEntrainement =
    Math.max(
      100,
      nombreSorealIdle_(
        entrainement.defense,
        100
      )
    );

  const attaque =
    Math.max(
      100,
      Math.round(
        (
          attaqueEntrainement +
          Math.max(
            0,
            nombreSorealIdle_(
              bonusBoutique,
              0
            )
          )
        ) *
        // Audit 2026-09-16 : équipement retiré du combat Fight Boss (voir
        // multiplicateurPermanent ci-dessus) — plus de fidélité NGU.
        1 *
        multiplicateurPermanent *
        /*
         * 2026-09-23 (audit) : le multiplicateur pouvait être écrasé à 1 alors
         * que le NUMBER d'un Rebirth rapide est très inférieur à 1 (wiki
         * "Rebirths" : il peut monter OU baisser) ; NGU applique bien x0,33
         * après un Rebirth de 10 min. Plancher strictement positif seulement.
         */
        Math.max(
          1e-300,
          nombreSorealIdle_(
            bonusMetaNgu.attackMultiplier,
            1
          )
        )
      )
    );

  const defense =
    Math.max(
      100,
      Math.round(
        defenseEntrainement *
        // Audit 2026-09-16 : équipement retiré du combat Fight Boss (voir
        // multiplicateurPermanent ci-dessus) — plus de fidélité NGU.
        1 *
        multiplicateurPermanent *
        Math.max(
          1e-300,
          nombreSorealIdle_(
            bonusMetaNgu.defenseMultiplier,
            1
          )
        )
      )
    );

  return {
    attaque:
      attaque,

    defense:
      defense,

    pvMax:
      Math.max(
        1000,
        Math.round(
          attaque *
          10
        )
      ),

    attaqueEntrainement:
      attaqueEntrainement,

    defenseEntrainement:
      defenseEntrainement,

    bonusBoutique:
      Math.max(
        0,
        nombreSorealIdle_(
          bonusBoutique,
          0
        )
      ),

    multiplicateurPermanent:
      multiplicateurPermanent,

    equipement:
      profilEquipement
  };
}


/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * `difficulty` (2e paramètre, optionnel, défaut "normal" -- voir
 * equilibrerBossPrincipalSorealIdleV413_ ci-dessus) : propagé vers TOUS les
 * appels internes (le catalogue vide, le catalogue SOREAL et la
 * progression infinie), pour que le diviseur ×1e-30 (Evil/SADISTIC,
 * nguBossStatsV1) s'applique de façon identique quel que soit le chemin.
 */
function definitionBossSorealIdle_(
  bossVaincus,
  difficulty
) {
  const catalogue =
    bossCatalogueSorealIdle_();

  const n =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          bossVaincus,
          0
        )
      )
    );

  if (!catalogue.length) {
    return equilibrerBossPrincipalSorealIdleV413_(
      {
        id: n + 1,
        nom:
          CONFIG_SOREAL_IDLE.BOSS_BASE,
        pv:
          CONFIG_SOREAL_IDLE.BOSS_PV_BASE,
        attaque:
          CONFIG_SOREAL_IDLE.ATTAQUE_BOSS_BASE,
        xp: 25,
        pieces: 5,
        niveauRequis: n + 1
      },
      n,
      difficulty
    );
  }

  if (n < catalogue.length) {
    return equilibrerBossPrincipalSorealIdleV413_(
      catalogue[n],
      n,
      difficulty
    );
  }

  /*
   * Après le catalogue initial, on garde la progression infinie
   * sans recycler les mêmes statistiques.
   */
  const dernier =
    equilibrerBossPrincipalSorealIdleV413_(
      catalogue[
        catalogue.length - 1
      ],
      catalogue.length - 1,
      difficulty
    );

  const supplement =
    n - catalogue.length + 1;

  return {
    id:
      n + 1,

    nom:
      dernier.nom +
      ' +' +
      supplement,

    /*
     * V56 — mission NGU (2026-09-09) : ×2.75/×1.35/boss (PV/Attaque) et
     * ×1.18/boss (XP) étaient des constantes inventées, jamais sourcées.
     * La vraie règle NGU (×10/boss, PV=Attaque×10, XP en palier +1 tous
     * les 10 boss) est maintenant la référence — cf.
     * idle-ngu-boss-reference-v1.js. On garde un MAX contre la
     * progression du catalogue au cas où celui-ci définirait volontai-
     * rement un boss plus fort (identité SOREAL), jamais plus faible que
     * la vraie courbe.
     */
    pv:
      Math.round(
        Math.max(
          dernier.pv *
          Math.pow(
            Math.max(
              1.01,
              nombreSorealIdle_(
                parametreSorealIdle_(
                  'BOSS_INFINI_MULTIPLICATEUR_PV',
                  10
                ),
                10
              )
            ),
            supplement
          ),
          nguBossStatsV1(n, difficulty).pv
        )
      ),

    attaque:
      Math.round(
        Math.max(
          dernier.attaque *
          Math.pow(
            Math.max(
              1.01,
              nombreSorealIdle_(
                parametreSorealIdle_(
                  'BOSS_INFINI_MULTIPLICATEUR_ATTAQUE',
                  10
                ),
                10
              )
            ),
            supplement
          ),
          nguBossStatsV1(n, difficulty).attaque
        )
      ),

    /*
     * Audit 2026-09-15 : ce champ manquait entièrement dans la branche
     * "progression infinie" (au-delà du catalogue) — un boss ici n'avait
     * donc AUCUNE Defense (nombreSorealIdle_ retombait sur la constante
     * CONFIG_SOREAL_IDLE.ATTAQUE_BOSS_BASE, minuscule comparée à la vraie
     * progression), ce qui rendait tout boss au-delà du catalogue
     * trivialement tuable en un coup — même cause racine que le bug déjà
     * corrigé pour pv/attaque/xp le 2026-09-09 (V56), jamais reporté pour
     * defense. Même plancher (MAX contre nguBossStatsV1) que les champs
     * ci-dessus.
     */
    defense:
      Math.round(
        Math.max(
          dernier.defense *
          Math.pow(
            Math.max(
              1.01,
              nombreSorealIdle_(
                parametreSorealIdle_(
                  'BOSS_INFINI_MULTIPLICATEUR_DEFENSE',
                  10
                ),
                10
              )
            ),
            supplement
          ),
          nguBossStatsV1(n, difficulty).defense
        )
      ),

    xp:
      Math.round(
        Math.max(
          dernier.xp *
          Math.pow(
            1.18,
            supplement
          ),
          nguBossStatsV1(n, difficulty).xp
        )
      ),

    pieces:
      Math.round(
        dernier.pieces *
        Math.pow(
          1.15,
          supplement
        )
      ),

    chanceLoot:
      nombreSorealIdle_(
        dernier.chanceLoot,
        0.55
      ),

    niveauRequis:
      Math.max(
        1,
        Math.floor(
          nombreSorealIdle_(
            dernier.niveauRequis,
            catalogue.length
          )
        ) +
        supplement
      ),

    histoire:
      String(dernier.histoire || ''),
    mortVivant:
      Boolean(dernier.mortVivant),
    conseil:
      String(dernier.conseil || ''),

    capacites:
      Array.isArray(
        dernier.capacites
      )
        ? dernier.capacites.map(
            function(capacite) {
              return Object.assign(
                {},
                capacite
              );
            }
          )
        : []
  };
}


function nomBossSorealIdle_(
  bossVaincus
) {
  return String(
    definitionBossSorealIdle_(
      bossVaincus
    ).nom
  );
}


/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * `difficulty` (2e paramètre, optionnel) -- même propagation que
 * attaqueBossSorealIdle_/defenseBossSorealIdle_ ci-dessus.
 */
function pvMaxBossSorealIdle_(
  bossVaincus,
  difficulty
) {
  return Math.max(
    1,
    Math.round(
      nombreSorealIdle_(
        definitionBossSorealIdle_(
          bossVaincus,
          difficulty
        ).pv,
        CONFIG_SOREAL_IDLE.BOSS_PV_BASE
      )
    )
  );
}


function xpBossSorealIdle_(
  bossVaincusAvant
) {
  /*
   * 2026-09-17 — ce plancher de 1 empêchait à jamais un boss au XP réel
   * de 0 (wiki : boss 1/2/3/5/6 du catalogue SOREAL) de donner 0 XP,
   * quelle que soit la correction apportée en amont
   * (equilibrerBossPrincipalSorealIdleV413_). C'était le deuxième étage
   * du même bug : même après avoir corrigé la donnée source, ce floor
   * la remontait quand même à 1 juste avant l'octroi au joueur.
   */
  return Math.max(
    0,
    Math.round(
      nombreSorealIdle_(
        definitionBossSorealIdle_(
          bossVaincusAvant
        ).xp,
        25
      )
    )
  );
}


/*
 * FTBE — "First Time Beaten Ever" (2026-09-17).
 *
 * NGU accorde un bonus XP UNIQUE la toute première fois qu'un boss est
 * vaincu par un compte, jamais reversé aux kills suivants (même run ou
 * après une Renaissance) — mécanique absente jusqu'ici de ce moteur.
 *
 * Plutôt que d'ajouter un nouveau champ persistant, on réutilise
 * metaNgu.records.highestBoss : un high-water-mark déjà permanent
 * (jamais remis à 0 par applyRebirthResetV56_/rebirthIdleNguState, cf.
 * idle-ngu-progression.js — seul totalRebirths y est incrémenté), déjà
 * mis à jour par Math.max(existant, bosses) dans normalizeIdleNguState,
 * et déjà utilisé pour la découverte permanente du Bestiaire (cf.
 * construireBestiaireSorealIdle_ / "index < bossVaincus" avec
 * highestBossEver). Comme la progression des boss principaux est
 * strictement séquentielle (bossVaincus avance par pas de 1, jamais de
 * saut), highestBoss = N signifie exactement "les boss d'index 0..N-1
 * ont déjà été vaincus au moins une fois, un jour, sur ce compte" — la
 * même donnée que le FTBE a besoin de suivre, sans nouveau champ.
 *
 * Cette valeur ne reflète que les kills des requêtes PRÉCÉDENTES (déjà
 * sauvegardées) : un combat/NUKE peut vaincre plusieurs boss d'affilée
 * dans la MÊME requête, donc l'appelant doit garder son propre compteur
 * local (initialisé une fois avant la boucle de résolution) et le faire
 * avancer via enregistrerBossJamaisVaincuSorealIdle_ après chaque kill,
 * plutôt que relire metaNgu.records.highestBoss à chaque itération.
 */
function highestBossJamaisAtteintSorealIdle_(metaNgu) {
  return Math.max(
    0,
    Math.floor(
      nombreSorealIdle_(
        metaNgu &&
          metaNgu.records &&
          metaNgu.records.highestBoss,
        0
      )
    )
  );
}


/*
 * Bonus XP FTBE pour un index de boss 0-based. Ne couvre QUE les 20 boss
 * du catalogue SOREAL (nguBossFtbeBonusXpV1 renvoie 0 au-delà — voir le
 * commentaire de cette fonction dans idle-ngu-boss-reference-v1.js pour
 * la justification : aucune fiche wiki individuelle vérifiée au-delà du
 * boss 20 pour ce bonus précis).
 */
function xpBonusPremiereFoisSorealIdle_(bossIndex) {
  return Math.max(
    0,
    Math.round(
      nguBossFtbeBonusXpV1(
        bossIndex
      )
    )
  );
}


/*
 * Fait avancer le high-water-mark permanent après un kill qui vient de
 * battre le record du compte (bossIndex >= highestBossJamaisAtteintSorealIdle_
 * AVANT ce kill). Mute metaNgu.records directement : l'appelant sérialise
 * ensuite le même objet metaNgu dans STATS_JSON, donc aucune écriture
 * séparée n'est nécessaire ici.
 */
function enregistrerBossJamaisVaincuSorealIdle_(metaNgu, bossIndex) {
  if (!metaNgu.records || typeof metaNgu.records !== 'object') {
    metaNgu.records = {};
  }

  metaNgu.records.highestBoss = Math.max(
    highestBossJamaisAtteintSorealIdle_(metaNgu),
    Math.floor(bossIndex) + 1
  );
}


function appliquerNiveauxSorealIdle_(
  niveau,
  xp
) {
  void niveau;
  return {
    niveau: 1,
    xp: Math.max(0,nombreSorealIdle_(xp,0)),
    niveauxGagnes: 0,
    xpRequise: 0
  };
}


/**
 * V40.7 — production d'énergie réellement discrète.
 *
 * La production affichée reste une vitesse moyenne par seconde, mais
 * l'énergie n'est créditée qu'au passage d'un vrai tick entier.
 * Le gain est toujours entier et la durée du tick est calculée pour
 * conserver exactement la production moyenne annoncée.
 */
function metaTickEnergieSorealIdle_(productionSeconde) {
  const prod =
    Math.max(
      0.01,
      nombreSorealIdle_(
        productionSeconde,
        CONFIG_SOREAL_IDLE.PROD_SECONDE_BASE
      )
    );

  const minimumMs =
    Math.max(
      1,
      nombreSorealIdle_(
        CONFIG_SOREAL_IDLE.ENERGIE_TICK_MIN_MS,
        20
      )
    );

  /*
   * Choisir le plus petit gain ENTIER permettant de ne jamais descendre
   * sous le plancher visuel. Ensuite la durée exacte est dérivée du gain.
   * Exemples :
   * 0,25/s => +1 toutes les 4000 ms
   * 2/s    => +1 toutes les 500 ms
   * 20/s   => +2 toutes les 100 ms
   */
  const gain =
    Math.max(
      1,
      Math.ceil(
        prod * minimumMs / 1000 - 1e-12
      )
    );

  const dureeMs =
    Math.max(
      minimumMs,
      1000 * gain / prod
    );

  return {
    productionSeconde: prod,
    gain: gain,
    dureeMs: dureeMs
  };
}


function calculerTicksEnergieSorealIdle_(
  productionSeconde,
  ecouleMs,
  resteMs
) {
  const meta =
    metaTickEnergieSorealIdle_(
      productionSeconde
    );

  const totalMs =
    Math.max(
      0,
      nombreSorealIdle_(resteMs, 0)
    ) +
    Math.max(
      0,
      nombreSorealIdle_(ecouleMs, 0)
    );

  const ticks =
    Math.max(
      0,
      Math.floor(
        (totalMs + 1e-7) /
        meta.dureeMs
      )
    );

  const reste =
    Math.max(
      0,
      Math.min(
        meta.dureeMs - 1e-7,
        totalMs - ticks * meta.dureeMs
      )
    );

  return {
    gain: meta.gain,
    dureeMs: meta.dureeMs,
    ticks: ticks,
    energieProduite:
      ticks * meta.gain,
    resteMs: reste
  };
}


function creerSimulateurEnergieHorsLigneSorealIdle_(
  productionSeconde,
  energieInitiale,
  energieMax,
  resteTickMs
) {
  const maximum =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          energieMax,
          1
        )
      )
    );

  let energie =
    Math.floor(
      bornerSorealIdle_(
        energieInitiale,
        0,
        maximum
      )
    );

  let reste =
    Math.max(
      0,
      nombreSorealIdle_(
        resteTickMs,
        0
      )
    );

  let energieProduite = 0;
  let energiePerdueAuPlafond = 0;
  let energieDepensee = 0;

  return {
    avancer: function(ecouleMs) {
      const ticks =
        calculerTicksEnergieSorealIdle_(
          productionSeconde,
          Math.max(
            0,
            nombreSorealIdle_(
              ecouleMs,
              0
            )
          ),
          reste
        );

      reste =
        ticks.resteMs;

      energieProduite +=
        ticks.energieProduite;

      const avantPlafond =
        energie +
        ticks.energieProduite;

      const apresPlafond =
        Math.min(
          maximum,
          avantPlafond
        );

      energiePerdueAuPlafond +=
        Math.max(
          0,
          avantPlafond -
          apresPlafond
        );

      energie =
        Math.floor(
          apresPlafond +
          1e-9
        );

      return energie;
    },

    depenser: function(cout) {
      const montant =
        Math.max(
          0,
          Math.floor(
            nombreSorealIdle_(
              cout,
              0
            )
          )
        );

      if (montant <= 0) {
        return true;
      }

      if (energie < montant) {
        return false;
      }

      energie -= montant;
      energieDepensee += montant;
      return true;
    },

    etat: function() {
      return {
        energie: energie,
        resteMs: reste,
        energieProduite:
          energieProduite,
        energiePerdueAuPlafond:
          energiePerdueAuPlafond,
        energieStockee:
          Math.max(
            0,
            energieProduite -
            energiePerdueAuPlafond
          ),
        energieDepensee:
          energieDepensee
      };
    }
  };
}


/**
 * Progression serveur de l'énergie.
 *
 * Le simulateur ci-dessus est utilisé par l'Aventure AUTO hors ligne afin
 * d'alterner réellement production et dépenses. Sans cela, une absence
 * longue remplissait d'abord la jauge jusqu'au plafond puis jetait toute
 * la production restante avant de simuler les combats.
 */
/*
 * V176 — intégration temporelle de HP Regen pendant Basic Training.
 *
 * NGU : HP Regen = Defense / 20. Defense n'est PAS constante pendant le
 * Basic Training : chaque skill suit Level^1.3 × BaseValue. Utiliser la
 * Defense de FIN de fenêtre pour toutes les secondes écoulées surcrédite
 * donc la récupération à chaque sync (jusqu'au plein instantané).
 *
 * On intègre exactement x^1.3 sur la trajectoire linéaire observée entre
 * le snapshot Basic Training avant/après. Si la fenêtre HP est plus longue
 * que la fenêtre BT (allocation enregistrée entre-temps), la portion plus
 * ancienne utilise la Defense du début — jamais celle de fin.
 */
function regenPvIntegreeBasicTrainingSorealIdleV176_(
  avantBrut,
  apresBrut,
  secondesBt,
  secondesHp
){
  const hpSec=Math.max(0,nombreSorealIdle_(secondesHp,0));
  if(hpSec<=0)return 0;

  const btSec=Math.max(0,nombreSorealIdle_(secondesBt,0));
  const avant=normalizeBasicTrainingStateV411(avantBrut,Date.now());
  const apres=normalizeBasicTrainingStateV411(apresBrut,Date.now());

  function niveau_(skill){
    return Math.max(
      0,
      nombreSorealIdle_(skill&&skill.level,0)+
      Math.max(
        0,
        Math.min(
          .999999999,
          nombreSorealIdle_(skill&&skill.progress,0)
        )
      )
    );
  }

  function moyennePuissance13_(a,b){
    const x0=Math.max(0,nombreSorealIdle_(a,0));
    const x1=Math.max(x0,nombreSorealIdle_(b,x0));
    if(Math.abs(x1-x0)<1e-12)return Math.pow(x1,1.3);
    return (
      Math.pow(x1,2.3)-
      Math.pow(x0,2.3)
    )/(2.3*(x1-x0));
  }

  let defenseMoyenne=
    Math.max(
      0,
      nombreSorealIdle_(
        BASIC_TRAINING_V411.naturalDefense,
        100
      )
    );

  for(const def of BASIC_TRAINING_V411.skills){
    if(def.group!=="defense")continue;

    const s0=avant.skills&&avant.skills[def.id];
    const s1=apres.skills&&apres.skills[def.id];
    const l0=niveau_(s0);
    const l1=niveau_(s1);
    let debutFenetre=l0;
    let moyenneNiveau13=Math.pow(l0,1.3);

    if(btSec>1e-9){
      if(hpSec>=btSec){
        const moyenneBt=moyennePuissance13_(l0,l1);
        const extra=hpSec-btSec;
        moyenneNiveau13=
          (
            moyenneBt*btSec+
            Math.pow(l0,1.3)*extra
          )/hpSec;
      }else{
        const fraction=hpSec/btSec;
        debutFenetre=
          l1-(l1-l0)*fraction;
        moyenneNiveau13=
          moyennePuissance13_(
            debutFenetre,
            l1
          );
      }
    }

    defenseMoyenne+=
      moyenneNiveau13*
      Math.max(
        0,
        nombreSorealIdle_(def.baseValue,0)
      );
  }

  return Math.max(0,defenseMoyenne/20*hpSec);
}


function appliquerProgressionEnergieSorealIdle_(
  feuille,
  ligne
) {
  const c =
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  const row =
    feuille
      .getRange(
        ligne,
        1,
        1,
        c.STATS_JSON
      )
      .getValues()[0];

  // SOREAL_IDLE_V55_NGU_ENERGY_SOURCE_OF_TRUTH
  // Energy is advanced once by the shared NGU engine. The historical row
  // columns remain compatibility mirrors only and must never recalculate it.
  const statsRessourceV55 =
    statsJoueurSorealIdle_(
      row[c.STATS_JSON - 1]
    );

  const collectionRessourceV55 =
    parserJsonSorealIdle_(
      row[c.COLLECTION_JSON - 1],
      {}
    );

  const metaNguRessourceV55 =
    syncIdleNguState(
      statsRessourceV55.metaNgu,
      contexteMetaNguSorealIdle_(
        row,
        statsRessourceV55,
        collectionRessourceV55
      ),
      Date.now()
    );

  statsRessourceV55.metaNgu =
    metaNguRessourceV55;

  row[c.STATS_JSON - 1] =
    JSON.stringify(statsRessourceV55);

  const energieMetaV55 =
    metaNguRessourceV55 &&
    metaNguRessourceV55.resources &&
    metaNguRessourceV55.resources.energy
      ? metaNguRessourceV55.resources.energy
      : {
          current: row[c.ENERGIE - 1],
          cap: row[c.ENERGIE_MAX - 1]
        };

  const energieBrute =
    Math.max(
      0,
      nombreSorealIdle_(
        energieMetaV55.current,
        0
      )
    );

  const energie =
    Math.max(
      0,
      Math.floor(
        energieBrute + 1e-9
      )
    );

  const energieMax =
    Math.max(
      1,
      nombreSorealIdle_(
        idleNguEffectiveResourceStat(metaNguRessourceV55, 'energy', 'cap'),
        1
      )
    );

  const prodSeconde =
    Math.max(
      0,
      idleNguResourceGenerationPerSecond(
        metaNguRessourceV55,
        "energy"
      )
    );

  const maintenantEntrainementV41 =
    Date.now();

  const entrainementAvantV176=
    normalizeBasicTrainingStateV411(
      statsRessourceV55.entrainementBase,
      maintenantEntrainementV41
    );

  const entrainementV41 =
    synchroniserEntrainementBaseSorealIdleV41_(
      feuille,
      ligne,
      row,
      maintenantEntrainementV41
    );

  const energieIdleMaxV41 =
    Math.max(
      0,
      energieMax -
      entrainementV41.allocation
    );

  const puissance =
    Math.max(
      1,
      nombreSorealIdle_(
        row[c.PUISSANCE - 1],
        1
      )
    );

  const endurance =
    Math.max(
      1,
      nombreSorealIdle_(
        row[c.ENDURANCE - 1],
        1
      )
    );

  // V54: the historical global level is compatibility storage only.
  // Basic Training levels and NUMBER are the actual NGU progression axes.
  let niveau = 1;

  let xp =
    Math.max(
      0,
      nombreSorealIdle_(
        row[c.XP - 1],
        0
      )
    );

  let bossVaincus =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          row[c.BOSS_VAINCUS - 1],
          0
        )
      )
    );

  // Kept only so older serialized rows remain readable; combat uses the
  // native metaNgu totalRebirths resolved below.
  const renaissances =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          row[c.RENAISSANCES - 1],
          0
        )
      )
    );
  void renaissances;

  const statsCombat =
    statsJoueurSorealIdle_(
      row[c.STATS_JSON - 1]
    );

  // One-time deterministic migration: old row XP becomes Spend EXP only if
  // it is higher than the already migrated meta currency. Afterwards the row
  // is merely a compatibility mirror of metaNgu.currencies.experience.
  statsCombat.metaNgu=normalizeIdleNguState(
    statsCombat.metaNgu,
    contexteMetaNguSorealIdle_(
      row,
      statsCombat,
      parserJsonSorealIdle_(row[c.COLLECTION_JSON - 1],{})
    ),
    Date.now()
  );
  if(!statsCombat.legacyXpMigratedV54){
    statsCombat.metaNgu.currencies.experience=Math.max(
      Math.max(0,nombreSorealIdle_(statsCombat.metaNgu.currencies.experience,0)),
      xp
    );
    statsCombat.legacyXpMigratedV54=true;
  }
  xp=Math.max(0,nombreSorealIdle_(statsCombat.metaNgu.currencies.experience,0));

  const renaissanceNativeCountV54=Math.max(
    0,
    Math.floor(nombreSorealIdle_(statsCombat.metaNgu.records&&statsCombat.metaNgu.records.totalRebirths,0))
  );

  /*
   * V38.1 :
   * Ne jamais utiliser `maintenant` avant sa déclaration plus bas.
   * Ce timestamp sert uniquement à la régénération du mana à ce stade.
   */
  const maintenantMana =
    Date.now();

  mettreAJourManaStatsSorealIdle_(
    statsCombat,
    niveau,
    maintenantMana
  );

  let bossCombatIndex =
    bossVaincus;

  statsCombat.bossSelection =
    bossCombatIndex + 1;

  statsCombat.bossRespawnJusqua = 0;

  let bossBloqueRenaissance =
    bossCombatIndex === bossVaincus &&
    bossCombatIndex === bossParMondeSorealIdle_() - 1 &&
    renaissanceNativeCountV54 < 1;

  let combatBossActif =
    Boolean(
      statsCombat.combatBossActif
    );

  let pieces =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          row[c.PIECES - 1],
          calculerPiecesSorealIdle_(
            bossVaincus
          )
        )
      )
    );

  let inventaire =
    parserJsonSorealIdle_(
      row[c.INVENTAIRE_JSON - 1],
      []
    );

  if (!Array.isArray(inventaire)) {
    inventaire = [];
  }

  let equipement =
    parserJsonSorealIdle_(
      row[c.EQUIPEMENT_JSON - 1],
      {}
    );

  if (
    !equipement ||
    typeof equipement !== 'object'
  ) {
    equipement = {};
  }

  const defense =
    Math.max(
      0,
      nombreSorealIdle_(
        entrainementV41.defense,
        endurance
      )
    );

  /*
   * Fight Boss suit le modèle A/D : les PV max valent 10× l'attaque.
   * L'équipement Aventure sera branché comme multiplicateur séparé.
   */
  const pvJoueurMax =
    Math.max(
      1000,
      Math.round(
        entrainementV41.pvMax
      )
    );

  let pvJoueur =
    bornerSorealIdle_(
      nombreSorealIdle_(
        row[c.PV_JOUEUR - 1],
        pvJoueurMax
      ),
      0,
      pvJoueurMax
    );

  /*
   * V170 — 0 PV doit rester 0 tant que l'état K.O. n'a pas été traité.
   * La récupération Fight Boss part de cette valeur et ajoute Defense/20
   * par seconde ; l'ancien reset anticipé provoquait un plein instantané.
   */

  const bossPvMaxDefinition =
    pvMaxBossSorealIdle_(
      bossCombatIndex,
      metaNguRessourceV55.difficulty
    );

  const bossPvMaxEnregistre =
    Math.max(
      1,
      nombreSorealIdle_(
        row[c.BOSS_PV_MAX - 1],
        bossPvMaxDefinition
      )
    );

  let bossPvMax =
    bossPvMaxDefinition;

  let bossPv =
    nombreSorealIdle_(
      row[c.BOSS_PV - 1],
      bossPvMax
    );

  /*
   * Quand IDLE_BOSS est rééquilibré, une ancienne valeur mise en cache
   * dans JOUEURS ne doit pas conserver l'ancien boss plus faible.
   * Le boss repart à 100 % avec sa nouvelle fiche.
   */
  if (
    Math.abs(
      bossPvMaxEnregistre -
      bossPvMaxDefinition
    ) > 0.0001
  ) {
    bossPv =
      bossPvMaxDefinition;
  }

  if (
    bossPv < 0 ||
    bossPv > bossPvMax
  ) {
    bossPv = bossPvMax;
  }

  const derniereSynchroBrute =
    row[c.DERNIERE_SYNCHRO - 1];

  let derniereSynchro =
    dateSorealIdle_(
      derniereSynchroBrute,
      Date.now()
    );

  if (
    !Number.isFinite(derniereSynchro) ||
    derniereSynchro <= 0
  ) {
    derniereSynchro = Date.now();
  }

  const maintenant =
    Date.now();

  const ecouleReel =
    Math.max(
      0,
      (maintenant - derniereSynchro) /
      1000
    );

  const ecoulePrisEnCompte =
    Math.min(
      ecouleReel,
      Math.max(
        0,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'Progression hors ligne max (heures)',
            12
          ),
          12
        )
      ) *
      60 *
      60
    );

  /*
   * Norman (2026-09-16) : "la regen de vie m'a l'air plus lente que dans
   * NGU idle" — confirmé : la regen du Combat de boss numéroté utilisait
   * "Salle de repos" (regenPctSec, un pourcentage du pool max choisi par
   * numéro de salle), un mécanisme SOREAL jamais réellement rattaché à
   * une fonctionnalité que Norman reconnaît ("il n'y a en effet aucune
   * salle de repos" dans Combat de boss) — Defense n'intervenait nulle
   * part dans la regen, alors que investir en Defense devrait TOUJOURS
   * payer double (moins de dégâts subis ET regen plus rapide).
   *
   * Formule NGU réelle vérifiée (sayolove.github.io/ngu-guide, page
   * Fight Boss) : "HP Regen - Increasing Defense increases HP Regen by
   * Defense/20" — un montant ABSOLU de PV/seconde (jamais un pourcentage
   * du pool max). "Salle de repos" reste une sélection cosmétique
   * (nom/image, comme "apparence") ailleurs dans le moteur — seule sa
   * contribution à la regen disparaît ici, remplacée par la vraie règle.
   * pvJoueurMax, pvJoueur et ecoulePrisEnCompte sont tous initialisés
   * avant ce bloc. La récupération progressive après K.O. plus bas dans
   * la boucle de simulation réutilise cette même valeur — jamais un
   * second calcul, une seule source de vérité.
   */
  const regenPvSecJoueur =
    Math.max(
      0,
      defense / 20
    );

  if (!combatBossActif) {
    const regenPv =
      regenPvIntegreeBasicTrainingSorealIdleV176_(
        entrainementAvantV176,
        entrainementV41.stats&&
          entrainementV41.stats.entrainementBase,
        entrainementV41.secondes,
        ecoulePrisEnCompte
      );

    pvJoueur =
      Math.min(
        pvJoueurMax,
        pvJoueur + regenPv
      );

    /*
     * Après une défaite ou une fuite, le boss conserve les PV qu'il lui
     * restait puis remonte progressivement selon SON HP Regen Fight Boss.
     * Un boss réellement vaincu (0 PV) ne ressuscite jamais ici.
     */
    if(
      bossPv>0 &&
      bossPv<bossPvMax
    ){
      bossPv=
        Math.min(
          bossPvMax,
          bossPv+
          regenBossSecondeSorealIdle_(
            bossCombatIndex,
            bossPvMax
          )*
          ecoulePrisEnCompte
        );
    }
  }


  /*
   * Migration V40.7 : une ancienne énergie fractionnaire (ex. 249,6)
   * n'est pas perdue. Sa fraction devient du temps déjà parcouru vers
   * le prochain vrai tick. Dès cette sauvegarde, ENERGIE reste entière.
   */
  // SOREAL_IDLE_V55_NO_LEGACY_ENERGY_TICKS
  // syncIdleNguState already accounted for online/offline Energy generation.
  // Running the former tick simulator here would credit the same elapsed
  // period a second time.
  const fractionEnergieHistorique = 0;
  const resteEnergieAvantProgressionMs = 0;
  statsCombat.energieTickResteMs = 0;
  const energieTheoriqueProduite = 0;
  let nouvelleEnergie = energie;
  const energieApresProduction = nouvelleEnergie;
  let energieStockeeParProduction = 0;
  let energiePerdueAuPlafond = 0;
  void fractionEnergieHistorique;
  void resteEnergieAvantProgressionMs;
  void energieApresProduction;

  /*
   * Ancienne colonne KO_JUSQUA : conservée dans le schéma pour ne pas
   * casser les sauvegardes existantes, mais Fight Boss n'utilise plus
   * aucun compte à rebours de K.O.
   */

  /*
   * V184 — invariant Fight Boss :
   * un boss ne peut JAMAIS être déclaré vaincu hors combat.
   *
   * Un 0 PV peut survivre brièvement à une transition asynchrone
   * (NUKE / changement de boss / réponse réseau ancienne). L'ancien
   * code forçait alors 1 ms de simulation même avec combatBossActif=false,
   * ce qui validait le NOUVEAU boss comme vaincu sans clic Fight.
   *
   * Hors combat, le boss courant doit donc être vivant. Si un 0 résiduel
   * est trouvé, il appartient nécessairement à l'ancienne instance et on
   * restaure le boss courant à son maximum au lieu de créditer une victoire.
   */
  if(
    !combatBossActif &&
    bossPv<=1e-9
  ){
    bossPv=bossPvMax;
  }

  let tempsRestant =
    combatBossActif
      ?Math.max(0,ecoulePrisEnCompte)
      :0;

  let tempsSimulation =
    derniereSynchro;

  let bossBattusMaintenant = 0;
  let xpGagnee = 0;
  let degatsInfliges = 0;
  let degatsRecus = 0;
  let koSubis = 0;
  let dropsRecents = [];
  let iterations = 0;

  /*
   * FTBE (2026-09-17) : suivi local du high-water-mark, avancé après
   * chaque kill qui bat le record du compte — un seul appel peut vaincre
   * plusieurs boss d'affilée, voir le commentaire de
   * highestBossJamaisAtteintSorealIdle_.
   */
  let highestBossJamaisAtteint =
    highestBossJamaisAtteintSorealIdle_(
      statsCombat.metaNgu
    );

  while (
    tempsRestant > 0.0001 &&
    iterations < 2000 &&
    !bossBloqueRenaissance &&
    combatBossActif
  ) {
    iterations += 1;

    /*
     * Aucun état K.O. intermédiaire. Si une ancienne sauvegarde arrive
     * déjà à 0 PV alors qu'un combat est encore marqué actif, la défaite
     * arrête simplement le combat et la récupération hors combat repart
     * de 0 à la prochaine progression.
     */
    if (pvJoueur <= 0) {
      pvJoueur=0;
      koSubis += 1;
      statsCombat.combatBossActif=false;
      combatBossActif=false;
      break;
    }

    const attaqueBoss =
      attaqueBossSorealIdle_(
        bossCombatIndex,
        metaNguRessourceV55.difficulty
      );

    let degatsRecusSec =
      degatsRecusSecondeSorealIdle_(
        bossCombatIndex,
        defense,
        bossPv,
        bossPvMax,
        metaNguRessourceV55.difficulty
      );

    if (
      statsCombat.bossStunJusqua >
      tempsSimulation
    ) {
      degatsRecusSec = 0;
    }

    if (
      statsCombat.buffBouclierJusqua >
      tempsSimulation
    ) {
      degatsRecusSec *=
        Math.max(
          0.05,
          1 -
          Math.min(
            90,
            statsCombat.buffBouclierPct
          ) / 100
        );
    }

    /*
     * Norman (2026-09-16, deuxième signalement le même jour, en lançant NGU
     * et SOREAL IDLE en parallèle) : "vie qui ne descend pas à la même
     * vitesse dans les 2 jeux, régen de vie plus faible dans SOREAL IDLE."
     * Cause confirmée : regenPvSecJoueur (Defense/20) avait bien été
     * corrigé plus haut dans cette même fonction, mais UNIQUEMENT pour le
     * repos hors combat (if (!combatBossActif)) et l'attente de K.O. — la
     * vraie règle NGU (wiki NGU-idle.fandom.com, page Boss Fights : "HP
     * while fighting is 10*attack, and HP regain is defense/20") décrit
     * ces deux stats comme s'appliquant PENDANT le combat lui-même, pas
     * seulement au repos. Cette boucle de simulation (le combat actif)
     * n'avait donc jamais reçu la regen, ce qui rendait la vie du joueur
     * plus rapide à descendre ici que dans le vrai jeu. Nette directement
     * ici, sur la même resolution regenPvSecJoueur déjà utilisée plus
     * haut/plus bas — jamais un second calcul de regen.
     */
    degatsRecusSec =
      Math.max(
        0,
        degatsRecusSec -
        regenPvSecJoueur
      );

    const multiplicateurDpsBoss =
      multiplicateurDpsJoueurBossSorealIdle_(
        bossCombatIndex,
        statsCombat.immuniteParalysieJusqua >
          tempsSimulation
      );

    const multiplicateurSceau =
      multiplicateurSceauBossSorealIdle_(
        bossCombatIndex,
        statsCombat
      );

    const multiplicateurVulnerabilite =
      statsCombat.bossVulnerableJusqua >
      tempsSimulation
        ? 1 +
          Math.min(
            300,
            Math.max(
              0,
              statsCombat.bossVulnerablePct
            )
          ) / 100
        : 1;

    const regenBossSec =
      regenBossSecondeSorealIdle_(
        bossCombatIndex,
        bossPvMax
      );

    /*
     * V198 — Fight Boss : UNE seule formule client/serveur.
     *
     * NGU : les dégâts infligés au boss partent de
     *   max(Attack joueur - Defense boss, 0)
     * puis seulement les effets temporaires du combat s'appliquent.
     *
     * Le client suivait déjà cette règle, mais le serveur utilisait encore
     * `puissance` brute. Une synchronisation pouvait donc enlever beaucoup
     * plus de PV que l'écran, voire valider la mort d'un boss que le joueur
     * n'était pas encore capable de blesser.
     */
    const defenseBossCombat =
      defenseBossSorealIdle_(
        bossCombatIndex,
        metaNguRessourceV55.difficulty
      );

    const dpsJoueurBase =
      Math.max(
        0,
        puissance -
        defenseBossCombat
      );

    const dpsBossNet =
      Math.max(
        0,
        dpsJoueurBase *
        multiplicateurDpsBoss *
        multiplicateurSceau *
        multiplicateurVulnerabilite -
        regenBossSec
      );

    const tempsPourBoss =
      dpsBossNet > 0.000001
        ? bossPv /
          dpsBossNet
        : Number.POSITIVE_INFINITY;

    const tempsPourDefaite =
      degatsRecusSec > 0.000001
        ? pvJoueur /
          degatsRecusSec
        : Number.POSITIVE_INFINITY;

    const segment =
      Math.min(
        tempsRestant,
        tempsPourBoss,
        tempsPourDefaite
      );

    const dommageBoss =
      Math.min(
        bossPv,
        segment *
        dpsBossNet
      );

    const dommageJoueur =
      Math.min(
        pvJoueur,
        segment * degatsRecusSec
      );

    bossPv =
      Math.max(
        0,
        bossPv-dommageBoss
      );
    pvJoueur =
      Math.max(
        0,
        pvJoueur-dommageJoueur
      );

    /*
     * La mort n'est déclenchée que sur une valeur de PV exactement 0.
     * Le petit epsilon historique (<=0.0001) pouvait valider la mort
     * alors qu'un résidu positif subsistait encore dans l'état/barre.
     */
    if(bossPv<=1e-9)bossPv=0;
    if(pvJoueur<=1e-9)pvJoueur=0;

    degatsInfliges += dommageBoss;
    degatsRecus += dommageJoueur;

    tempsRestant -= segment;
    tempsSimulation +=
      segment * 1000;

    const bossMort =
      bossPv===0;

    const joueurBattu =
      pvJoueur===0;

    if (bossMort) {
      statsCombat.bossStunJusqua = 0;
      statsCombat.bossVulnerableJusqua = 0;
      statsCombat.bossVulnerablePct = 0;
      statsCombat.sceauBriseBossNumero = 0;

      /*
       * XP pilotée par l'écart entre le niveau du joueur et le niveau
       * prévu du boss. Un boss de ton niveau donne 100 %, puis la valeur
       * décroît progressivement jusqu'à 0.
       */
      const xpReelle =
        Math.max(
          0,
          Math.round(
            recompenseXpBossNiveauSorealIdle_(
              bossCombatIndex,
              niveau
            ) *
            Math.max(
              1,
              nombreSorealIdle_(
                idleNguBonuses(
                  statsCombat.metaNgu
                ).xpMultiplier,
                1
              )
            ) *
            facteurExpBossPerkSorealIdle_(
              idleNguBonuses(statsCombat.metaNgu),
              bossCombatIndex
            )
          )
        );

      /*
       * Les pièces des anciens boss restent réduites afin d'éviter
       * qu'un boss trivial devienne la meilleure source d'argent.
       */
      const ancienBoss =
        bossCombatIndex < bossVaincus;

      const multiplicateurFarm =
        ancienBoss
          ? 0.35
          : 1;

      if (xpReelle > 0) {
        statsCombat.metaNgu.currencies.experience=
          Math.max(0,nombreSorealIdle_(statsCombat.metaNgu.currencies.experience,0))+
          xpReelle;
        xp=Math.max(0,nombreSorealIdle_(statsCombat.metaNgu.currencies.experience,0));
        xpGagnee += xpReelle;
      }

      /*
       * FTBE — bonus une seule fois par boss, jamais reversé aux kills
       * suivants (même run ou après Renaissance). Voir le commentaire de
       * highestBossJamaisAtteintSorealIdle_ : bossCombatIndex >= le
       * record avant CE kill signifie que ce boss n'a jamais été vaincu
       * sur ce compte.
       */
      const estPremiereFoisJamais =
        bossCombatIndex >= highestBossJamaisAtteint;

      const bonusPremiereFois =
        estPremiereFoisJamais
          ? Math.max(
              0,
              Math.round(
                xpBonusPremiereFoisSorealIdle_(
                  bossCombatIndex
                ) *
                Math.max(
                  1,
                  nombreSorealIdle_(
                    idleNguBonuses(
                      statsCombat.metaNgu
                    ).xpMultiplier,
                    1
                  )
                ) *
                facteurExpBossPerkSorealIdle_(
                  idleNguBonuses(statsCombat.metaNgu),
                  bossCombatIndex
                )
              )
            )
          : 0;

      if (bonusPremiereFois > 0) {
        statsCombat.metaNgu.currencies.experience=
          Math.max(0,nombreSorealIdle_(statsCombat.metaNgu.currencies.experience,0))+
          bonusPremiereFois;
        xp=Math.max(0,nombreSorealIdle_(statsCombat.metaNgu.currencies.experience,0));
        xpGagnee += bonusPremiereFois;
      }

      if (estPremiereFoisJamais) {
        enregistrerBossJamaisVaincuSorealIdle_(
          statsCombat.metaNgu,
          bossCombatIndex
        );
        highestBossJamaisAtteint =
          highestBossJamaisAtteintSorealIdle_(
            statsCombat.metaNgu
          );
      }

      pieces +=
        Math.max(
          1,
          Math.round(
            recompensePiecesBossSorealIdle_(
              bossCombatIndex
            ) *
            multiplicateurFarm
          )
        );

      if (
        Math.random() <
        Math.max(
          0,
          Math.min(
            1,
            nombreSorealIdle_(
              definitionBossSorealIdle_(
                bossCombatIndex
              ).chanceLoot,
              0.45
            ) *
            Math.max(
              1,
              nombreSorealIdle_(
                idleNguBonuses(
                  statsCombat.metaNgu
                ).dropMultiplier,
                1
              )
            )
          )
        )
      ) {
        const objet =
          genererObjetBossSorealIdle_(
            bossCombatIndex,
            nomBossSorealIdle_(
              bossCombatIndex
            )
          );

        const capaciteSac =
          Math.max(
            CONFIG_SOREAL_IDLE.INVENTAIRE_CAPACITE_BASE,
            Math.floor(
              nombreSorealIdle_(
                feuille.getRange(
                  ligne,
                  c.INVENTAIRE_CAPACITE
                ).getValue(),
                CONFIG_SOREAL_IDLE.INVENTAIRE_CAPACITE_BASE
              )
            )
          );

        if (
          objet &&
          nombreObjetsSacSorealIdle_(
            inventaire,
            equipement
          ) < capaciteSac
        ) {
          inventaire.push(objet);
          dropsRecents.push(objet);
        }
      }

      const bossVaincuIndex =
        bossCombatIndex;

      if (!ancienBoss) {
        bossVaincus += 1;
        bossBattusMaintenant += 1;
      }

      /*
       * V41.2 — le boss vaincu reste mort jusqu'à la Renaissance.
       * On avance immédiatement la sélection au boss suivant, sans aucun
       * cooldown de "reformation". Le prochain combat reste arrêté : le
       * joueur voit le nouveau boss et choisit quand lancer le combat.
       */
      statsCombat.combatBossActif =
        false;

      combatBossActif =
        false;

      statsCombat.bossRespawnJusqua = 0;

      bossCombatIndex =
        bossVaincus;

      statsCombat.bossSelection =
        bossCombatIndex + 1;

      bossBloqueRenaissance = false;

      bossPvMax =
        pvMaxBossSorealIdle_(
          bossCombatIndex
        );

      bossPv =
        bossPvMax;
    }

    if (joueurBattu) {
      /*
       * Défaite Fight Boss façon NGU :
       * - le coup fatal met immédiatement le joueur à 0 ;
       * - le combat s'arrête immédiatement ;
       * - le boss GARDE exactement les PV qu'il lui reste ;
       * - aucune période K.O. n'est créée.
       *
       * À partir du prochain tick hors combat, chacun récupère
       * progressivement selon sa propre regen.
       */
      pvJoueur=0;
      koSubis += 1;
      statsCombat.combatBossActif=false;
      combatBossActif=false;
    }

    if (
      segment <= 0.000001 &&
      !bossMort &&
      !joueurBattu
    ) {
      break;
    }
  }

  const progressionNiveau =
    appliquerNiveauxSorealIdle_(
      niveau,
      xp
    );

  niveau =
    progressionNiveau.niveau;

  xp =
    progressionNiveau.xp;

  const bossActuel =
    nomBossSorealIdle_(
      bossCombatIndex
    );


  /*
   * AUTO-AVENTURE HORS LIGNE
   * On ne l'applique qu'après une vraie coupure (> 20 s)
   * pour éviter de doubler les combats du client en ligne.
   */
  let pointsAventureAuto =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          row[
            c.AVENTURE_POINTS - 1
          ],
          0
        )
      )
    );

  let progressionAventureAuto =
    progressionAventureSorealIdle_(
      row[
        c.AVENTURE_PROGRESSION_JSON - 1
      ]
    );

  /*
   * AUTO et progression générale doivent modifier le MÊME objet stats.
   * L'ancienne copie temporaire pouvait être réécrasée en fin de synchro,
   * notamment pour les rencontres du Bestiaire découvertes hors ligne.
   */
  const statsAuto =
    statsCombat;

  let combatsAutoHorsLigne = 0;
  let victoiresAutoHorsLigne = 0;
  let lootsAutoHorsLigne = [];
  let energieDepenseeAventureAuto = 0;
  let creneauxAutoHorsLigne = 0;
  let limiteAutoHorsLigneAtteinte = false;

  if (
    ecouleReel >= 20 &&
    statsAuto.autoAventure &&
    statsAuto.autoAventureZone > 0
  ) {
    const aventureAuto =
      construireAventureSorealIdle_(
        row,
        statsAuto.metaNgu &&
          statsAuto.metaNgu.records &&
          statsAuto.metaNgu.records.highestBoss || 0
      );

    const zoneAuto =
      (
        aventureAuto &&
        Array.isArray(
          aventureAuto.zones
        )
          ? aventureAuto.zones
          : []
      ).find(function(z) {
        return (
          Math.floor(
            nombreSorealIdle_(
              z.id,
              0
            )
          ) ===
          statsAuto.autoAventureZone
        );
      });

    if (
      zoneAuto &&
      zoneAuto.debloquee
    ) {
      /*
       * V40.2 : l'AUTO hors ligne utilise le MÊME cooldown de gameplay
       * que les rencontres visibles. Il n'ajoute plus son ancien plancher
       * indépendant de 2/8 secondes : les améliorations des mondes futurs
       * pourront donc réellement accélérer toute la boucle Aventure.
       */
      const intervalle =
        Math.max(
          .15,
          cooldownAventureSorealIdle_(
            zoneAuto,
            statsAuto
          )
        );

      const creneauxDisponibles =
        Math.max(
          0,
          Math.floor(
            ecoulePrisEnCompte /
            intervalle
          )
        );

      const limiteSimulation =
        Math.max(
          250,
          Math.min(
            50000,
            Math.floor(
              nombreSorealIdle_(
                parametreSorealIdle_(
                  'AVENTURE_AUTO_HORS_LIGNE_MAX_TENTATIVES',
                  12000
                ),
                12000
              )
            )
          )
        );

      const essaisTemps =
        Math.min(
          limiteSimulation,
          creneauxDisponibles
        );

      creneauxAutoHorsLigne =
        creneauxDisponibles;

      limiteAutoHorsLigneAtteinte =
        creneauxDisponibles >
        essaisTemps;

      /*
       * Important : on repart de l'énergie réellement présente au début
       * de l'absence et on fait avancer les ticks jusqu'à chaque créneau.
       * La production peut donc remplir à nouveau la jauge après un combat,
       * au lieu d'être perdue parce que la jauge avait atteint son plafond
       * avant la simulation.
       */
      // SOREAL_IDLE_V55_NO_LEGACY_OFFLINE_ENERGY
      // Adventure AUTO keeps its historical chronology, but Energy itself
      // was already generated by metaNgu. This adapter is deliberately inert.
      const simulateurEnergieAuto = {
        avancer: function() {
          return nouvelleEnergie;
        },
        etat: function() {
          return {
            energie: nouvelleEnergie,
            resteMs: 0,
            energieProduite: 0,
            energiePerdueAuPlafond: 0,
            energieStockee: 0,
            energieDepensee: 0
          };
        }
      };

      const totalAutoMs =
        ecoulePrisEnCompte *
        1000;

      const intervalleAutoMs =
        intervalle *
        1000;

      let tempsAutoSimuleMs = 0;

      const capaciteSac =
        Math.max(
          CONFIG_SOREAL_IDLE
            .INVENTAIRE_CAPACITE_BASE,
          Math.floor(
            nombreSorealIdle_(
              row[
                c.INVENTAIRE_CAPACITE - 1
              ],
              CONFIG_SOREAL_IDLE
                .INVENTAIRE_CAPACITE_BASE
            )
          )
        );

      for (
        let tentative = 0;
        tentative < essaisTemps;
        tentative += 1
      ) {
        const cibleTempsMs =
          Math.min(
            totalAutoMs,
            (tentative + 1) *
            intervalleAutoMs
          );

        simulateurEnergieAuto.avancer(
          Math.max(
            0,
            cibleTempsMs -
            tempsAutoSimuleMs
          )
        );

        tempsAutoSimuleMs =
          cibleTempsMs;

        /* V44 : l'AUTO Aventure hors ligne n'est jamais limité par l'énergie. */

        combatsAutoHorsLigne += 1;

        const etatZone =
          etatZoneAventureSorealIdle_(
            progressionAventureAuto,
            zoneAuto.id
          );

        const tousLes =
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                parametreSorealIdle_(
                  'AVENTURE_ENNEMIS_PAR_ZONE',
                  5
                ),
                5
              )
            )
          );

        const bossProgramme =
          etatZone.progressionBoss >=
          tousLes - 1;

        const chanceRareAuto =
          Math.max(
            0,
            Math.min(
              1,
              nombreSorealIdle_(
                parametreSorealIdle_(
                  'AVENTURE_RARE_CHANCE',
                  0.003
                ),
                0.003
              )
            )
          );

        const monstreRareAuto =
          monstreZoneAventureParTypeSorealIdleGameV409_(
            zoneAuto.id,
            'rare'
          );

        const rareAuto =
          Boolean(
            monstreRareAuto &&
            Math.random() <
            Math.min(
              chanceRareAuto,
              Math.max(
                0,
                nombreSorealIdle_(
                  monstreRareAuto.chanceRencontre,
                  chanceRareAuto
                )
              )
            )
          );

        const typeRencontreAuto =
          rareAuto
            ? 'rare'
            : bossProgramme
              ? 'boss_zone'
              : 'normal';

        const combatBoss =
          typeRencontreAuto === 'boss_zone';

        const monstreAuto =
          rareAuto
            ? monstreRareAuto
            : (
                monstreZoneAventureParTypeSorealIdleGameV409_(
                  zoneAuto.id,
                  typeRencontreAuto
                ) ||
                {
                  id:
                    'Z'+
                    zoneAuto.id+
                    (combatBoss?'_BOSS':'_NORMAL'),
                  zoneId:zoneAuto.id,
                  type:typeRencontreAuto,
                  nom:
                    combatBoss
                      ?zoneAuto.boss
                      :zoneAuto.ennemi,
                  emoji:
                    combatBoss
                      ?'👑'
                      :(zoneAuto.emoji||'👾'),
                  pv:
                    combatBoss
                      ?zoneAuto.pvBoss
                      :zoneAuto.pvEnnemi,
                  attaque:
                    combatBoss
                      ?zoneAuto.attaqueBoss
                      :zoneAuto.attaqueEnnemi,
                  chanceLegendaire:0,
                  objetLegendaire:'',
                  slotLegendaire:'',
                  baseLegendaire:0
                }
              );

        marquerRencontreBestiaireSorealIdle_(
          statsAuto,
          cleBestiaireMonstreSorealIdle_(
            monstreAuto
          )
        );

        const statsEnnemi = {
          pv:
            Math.max(
              1,
              nombreSorealIdle_(
                monstreAuto&&monstreAuto.pv,
                1
              )
            ),
          attaque:
            Math.max(
              0,
              nombreSorealIdle_(
                monstreAuto&&monstreAuto.attaque,
                0
              )
            )
        };

        const degatsRecusSec =
          degatsRecusAventureSecondeSorealIdle_(
            statsEnnemi.attaque,
            defense
          );

        const puissanceAventureAuto =
          puissanceEffectiveAventureSorealIdle_(
            puissance *
            Math.max(
              1,
              nombreSorealIdle_(
                idleNguBonuses(
                  statsAuto.metaNgu
                ).adventureMultiplier,
                1
              )
            ),
            statsEnnemi.pv,
            zoneAuto.id,
            combatBoss,
            inventaire,
            equipement
          );

        const tempsVictoire =
          statsEnnemi.pv /
          Math.max(
            1,
            puissanceAventureAuto.effective
          );

        const tempsKoAuto =
          pvJoueurMax /
          degatsRecusSec;

        const tempsLimiteAuto =
          dureeMaxCombatAventureSorealIdle_(
            combatBoss
          );

        if (
          tempsVictoire >
          Math.min(
            tempsKoAuto,
            tempsLimiteAuto
          )
        ) {
          if (combatBoss) {
            etatZone.progressionBoss = 0;
            etatZone.bossEchecs += 1;

            progressionAventureAuto[
              String(
                zoneAuto.id
              )
            ] = etatZone;
          }

          break;
        }

        etatZone.victoires += 1;

        if (combatBoss) {
          etatZone.progressionBoss = 0;
        } else if (!rareAuto) {
          etatZone.progressionBoss =
            Math.min(
              tousLes - 1,
              etatZone.progressionBoss + 1
            );
        }
        victoiresAutoHorsLigne += 1;

        pointsAventureAuto +=
          Math.max(
            1,
            nombreSorealIdle_(
              zoneAuto.points,
              2
            ) *
            (
              rareAuto
                ?2
                :combatBoss
                  ?3
                  :1
            )
          );

        pieces +=
          Math.max(
            1,
            nombreSorealIdle_(
              zoneAuto.pieces,
              4
            ) *
            (
              rareAuto
                ?3
                :combatBoss
                  ?4
                  :1
            )
          );

        if (combatBoss) {
          etatZone.bossVaincu = true;
        }

        let lootAuto = null;

        if (rareAuto) {
          lootAuto =
            genererObjetLegendaireRareAventureSorealIdle_(
              monstreAuto,
              zoneAuto,
              niveau
            );
        }

        if (!lootAuto) {
          lootAuto =
            genererObjetLootSorealIdle_({
              zoneId:
                zoneAuto.id,
              zoneNom:
                zoneAuto.nom,
              bossNom:
                monstreAuto.nom,
              ignorerFiltreBoss:
                true,
              garantirLoot:
                combatBoss,
              chanceMultiplicateur:
                (
                  combatBoss
                    ? 1
                    : rareAuto
                      ? 0.70
                      : Math.max(
                          0,
                          nombreSorealIdle_(
                            parametreSorealIdle_(
                              'AVENTURE_LOOT_NORMAL_MULTIPLICATEUR',
                              0.30
                            ),
                            0.30
                          )
                        )
                ) *
                Math.max(
                  1,
                  nombreSorealIdle_(
                    idleNguBonuses(
                      statsAuto.metaNgu
                    ).dropMultiplier,
                    1
                  )
                ),
              progression:
                Math.max(
                  0,
                  zoneAuto.id * 2
                )
            });
        }

        if (
          lootAuto &&
          nombreObjetsSacSorealIdle_(
            inventaire,
            equipement
          ) <
          capaciteSac
        ) {
          inventaire.push(
            lootAuto
          );

          lootsAutoHorsLigne.push(
            lootAuto
          );
        }

        progressionAventureAuto[
          String(
            zoneAuto.id
          )
        ] = etatZone;
      }

      /*
       * Même si l'AUTO s'arrête (défaite ou limite CPU), le temps restant
       * continue de produire de l'énergie. On termine donc la chronologie
       * jusqu'à la fin de la période hors ligne.
       */
      simulateurEnergieAuto.avancer(
        Math.max(
          0,
          totalAutoMs -
          tempsAutoSimuleMs
        )
      );

      const etatEnergieAuto =
        simulateurEnergieAuto.etat();

      nouvelleEnergie =
        etatEnergieAuto.energie;

      statsCombat.energieTickResteMs =
        etatEnergieAuto.resteMs;

      energieStockeeParProduction =
        etatEnergieAuto.energieStockee;

      energiePerdueAuPlafond =
        etatEnergieAuto
          .energiePerdueAuPlafond;

      energieDepenseeAventureAuto =
        etatEnergieAuto
          .energieDepensee;
    }
  }

  if (
    combatsAutoHorsLigne > 0
  ) {
    statsAuto.combatsAventure +=
      combatsAutoHorsLigne;

    statsAuto.victoiresAventure +=
      victoiresAutoHorsLigne;

    statsAuto.lootsObtenus +=
      lootsAutoHorsLigne.length;

    statsCombat.combatsAventure =
      statsAuto.combatsAventure;

    statsCombat.victoiresAventure =
      statsAuto.victoiresAventure;

    statsCombat.lootsObtenus =
      statsAuto.lootsObtenus;

    feuille
      .getRange(
        ligne,
        c.AVENTURE_PROGRESSION_JSON
      )
      .setValue(
        JSON.stringify(
          progressionAventureAuto
        )
      );

    feuille
      .getRange(
        ligne,
        c.AVENTURE_POINTS
      )
      .setValue(
        pointsAventureAuto
      );

    feuille
      .getRange(
        ligne,
        c.STATS_JSON
      )
      .setValue(
        JSON.stringify(
          statsAuto
        )
      );
  }

  mettreAJourManaStatsSorealIdle_(
    statsCombat,
    niveau,
    maintenant
  );

  const energieDepenseeAventureHorsLigne =
    Math.max(
      0,
      energieDepenseeAventureAuto
    );

  const gainNetEnergie =
    nouvelleEnergie -
    energie;

  niveau=1;
  xp=Math.max(0,nombreSorealIdle_(statsCombat.metaNgu.currencies.experience,0));
  feuille.getRange(ligne,c.NIVEAU).setValue(1);
  feuille.getRange(ligne,c.XP).setValue(xp);
  feuille.getRange(ligne,c.ENERGIE).setValue(nouvelleEnergie);
  feuille.getRange(ligne,c.ENERGIE_MAX).setValue(energieMax);
  feuille.getRange(ligne,c.PROD_SECONDE).setValue(prodSeconde);
  feuille.getRange(ligne,c.BOSS_ACTUEL).setValue(bossActuel);
  feuille.getRange(ligne,c.BOSS_PV).setValue(Math.max(0,Math.round(bossPv)));
  feuille.getRange(ligne,c.BOSS_PV_MAX).setValue(bossPvMax);
  feuille.getRange(ligne,c.BOSS_VAINCUS).setValue(bossVaincus);
  feuille.getRange(ligne,c.PIECES).setValue(pieces);
  feuille.getRange(ligne,c.STATS_JSON).setValue(JSON.stringify(statsCombat));
  feuille.getRange(ligne,c.INVENTAIRE_JSON).setValue(JSON.stringify(inventaire));
  feuille.getRange(ligne,c.EQUIPEMENT_JSON).setValue(JSON.stringify(equipement));
  feuille.getRange(ligne,c.PV_JOUEUR).setValue(Math.max(0,Math.round(pvJoueur)));
  feuille.getRange(ligne,c.PV_JOUEUR_MAX).setValue(pvJoueurMax);

  /*
   * Plus aucun K.O. Fight Boss persistant.
   * Nettoie également les anciennes sauvegardes qui avaient encore
   * une date KO_JUSQUA.
   */
  feuille.getRange(ligne,c.KO_JUSQUA).clearContent();

  feuille
    .getRange(
      ligne,
      c.DERNIERE_SYNCHRO
    )
    .setValue(
      new Date(maintenant)
    );

  return {
    energie:
      nouvelleEnergie,

    gain:
      Math.max(
        0,
        gainNetEnergie
      ),

    gainNet:
      gainNetEnergie,

    energieProduite:
      energieTheoriqueProduite,

    energieStockee:
      energieStockeeParProduction,

    energiePerdueAuPlafond:
      energiePerdueAuPlafond,

    energieDepenseeAventure:
      energieDepenseeAventureHorsLigne,

    secondesEcoulees:
      Math.floor(ecouleReel),

    secondesComptabilisees:
      Math.floor(ecoulePrisEnCompte),

    degats:
      Math.round(
        degatsInfliges
      ),

    degatsRecus:
      Math.round(
        degatsRecus
      ),

    koSubis:
      koSubis,

    bossBattus:
      bossBattusMaintenant,

    bossBloqueRenaissance:
      bossBloqueRenaissance,

    xpGagnee:
      xpGagnee,

    niveauxGagnes:
      progressionNiveau
        .niveauxGagnes,

    dropsRecents:
      dropsRecents.concat(
        lootsAutoHorsLigne
      ),

    autoAventureHorsLigne: {
      combats:
        combatsAutoHorsLigne,
      victoires:
        victoiresAutoHorsLigne,
      loots:
        lootsAutoHorsLigne.length,
      creneaux:
        creneauxAutoHorsLigne,
      limiteAtteinte:
        limiteAutoHorsLigneAtteinte
    }
  };
}


/**
 * ============================================================
 * MÉTAPROGRESSION V42
 * ============================================================
 */
function contexteMetaNguSorealIdle_(
  row,
  stats,
  collection
) {
  const c = CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;
  const progressionCollections =
    collection && typeof collection === 'object'
      ? collection
      : {};
  /*
   * 2026-09-23 (audit NGU) : entrainementBase.skills est un OBJET indexé par
   * id (createBasicTrainingStateV411), pas un tableau -- le test
   * Array.isArray d'origine était toujours faux, donc attackTrainingLevels
   * valait toujours 0 (facteur NUMBER "training level" bloqué à 1,
   * wiki : Floor(1 + Attack_Basic_Training_Levels / 10 000)) et
   * basicTrainingComplete toujours false (Advanced Training, débloqué par
   * le wiki "once both Ultimate Attack and Ultimate Buff are unlocked",
   * ne pouvait donc jamais s'ouvrir).
   */
  const etatEntrainementBase =
    stats && stats.entrainementBase
      ? normalizeBasicTrainingStateV411(stats.entrainementBase, Date.now())
      : null;
  const skills =
    etatEntrainementBase
      ? BASIC_TRAINING_V411.skills.map(function(def) {
          const skill = etatEntrainementBase.skills[def.id] || {};
          return {
            id: def.id,
            level: skill.level,
            unlocked: isBasicTrainingSkillUnlockedV411(etatEntrainementBase, def)
          };
        })
      : [];
  const attackTrainingLevels =
    skills.reduce(function(total, skill) {
      /*
       * 2026-09-23 (audit) : wiki "Rebirths" -- facteur d'entraînement = +1 par
       * 10 000 niveaux d'entraînement d'ATTAQUE. Le filtre ne retenait que les
       * ids "attaque_*" et ignorait trois entraînements du groupe attaque
       * (contre_palette, percee_quai, ultime_soreal).
       */
      const id = String(skill && skill.id || '');
      const def = BASIC_TRAINING_V411.skills.find(function(d) { return d.id === id; });
      return total + (
        def && def.group === 'attack'
          ? Math.max(0, nombreSorealIdle_(skill.level, 0))
          : 0
      );
    }, 0);
  const meta =
    stats && stats.metaNgu && typeof stats.metaNgu === 'object'
      ? stats.metaNgu
      : {};
  const metaRecords =
    meta.records && typeof meta.records === 'object'
      ? meta.records
      : {};
  const metaCurrencies =
    meta.currencies && typeof meta.currencies === 'object'
      ? meta.currencies
      : {};
  /*
   * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
   * beastBrutalDefeated/exileBrutalDefeated vivent dans l'état Aventure
   * (idle-adventure-v47.js::titan(), s.unlockFlags), imbriqué sous
   * metaNgu.adventure -- jamais au même niveau que metaRecords/
   * metaCurrencies ci-dessus. Exposés ici pour
   * idleNguDifficultyUnlockRequirementsV1 (idle-ngu-progression.js),
   * qui ne lit que `context`, jamais l'état Aventure directement.
   */
  const metaAdventureUnlockFlags =
    meta.adventure && meta.adventure.unlockFlags && typeof meta.adventure.unlockFlags === 'object'
      ? meta.adventure.unlockFlags
      : {};

  return {
    bosses: Math.max(0,nombreSorealIdle_(row[c.BOSS_VAINCUS - 1],0)),
    rebirths: Math.max(
      0,
      nombreSorealIdle_(
        metaRecords.totalRebirths,
        nombreSorealIdle_(row[c.RENAISSANCES - 1],0)
      )
    ),
    zone: Math.max(1,nombreSorealIdle_(row[c.AVENTURE_ZONE - 1],1)),
    sets: Array.isArray(progressionCollections.zones)
      ? progressionCollections.zones.filter(function(z){return Boolean(z&&z.complete);}).length
      : 0,
    /*
     * Norman (2026-09-14) : "Mes PV en mode aventure doivent démarrer à
     * 50... là je suis à 703M, ça n'est pas normal." Cause confirmée :
     * adventurePower/adventureToughness (consommés par
     * idleAdventureCombatStatsV1, idle-ngu-progression.js, pour Power/
     * Toughness/HP/Regen de combat ET pour l'ITOPOD) étaient alimentés
     * par le Basic Training Attack/Defense — le NUMBER principal, en
     * dizaines de millions dès le milieu de partie. Vérifié sur le wiki
     * NGU (page Adventure Mode) : c'est l'INVERSE — "for every point of
     * Power/Toughness from your gear, you also get +1% Attack/Defense"
     * (l'équipement d'Aventure influence le NUMBER, jamais le contraire).
     * Power/Toughness/HP d'Aventure viennent UNIQUEMENT de l'équipement
     * d'Aventure (déjà sommé séparément par idleAdventureEquipmentStatsV47
     * puis ajouté par idleAdventureCombatStatsV1) — aucune valeur externe
     * n'existe ici pour ce contexte, les repli déjà en place partout où
     * ces champs sont lus (Math.max(1,num(context.adventurePower,1)))
     * suffisent pour un joueur sans encore aucun équipement d'Aventure.
     */
    bestGold: Math.max(
      1,
      nombreSorealIdle_(
        metaRecords.highestGoldDrop,
        nombreSorealIdle_(row[c.PIECES - 1],1)
      )
    ),
    gold: Math.max(0,nombreSorealIdle_(metaCurrencies.gold,0)),
    materials: Math.max(0,nombreSorealIdle_(row[c.MATERIAUX - 1],0)),
    legacyEnergyIdle: Math.max(0,nombreSorealIdle_(row[c.ENERGIE - 1],0)),
    legacyEnergyCap: Math.max(0,nombreSorealIdle_(row[c.ENERGIE_MAX - 1],0)),
    legacyEnergyProductionPerSecond: Math.max(0,nombreSorealIdle_(row[c.PROD_SECONDE - 1],0)),
    attackTrainingLevels: attackTrainingLevels,
    basicTrainingEnergyAllocation: totalBasicTrainingAllocationV411(
      stats && stats.entrainementBase
    ),
    basicTrainingComplete: Boolean(
      skills.length &&
      skills.every(function(skill){return Boolean(skill&&skill.unlocked);})
    ),
    /*
     * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
     * meta.difficulty existe désormais côté idle-ngu-progression.js
     * (Phase 1, correctif de persistance) mais n'était encore lu nulle
     * part ici -- le moteur de combat réel (nguBossStatsV1, ci-dessous)
     * ignorait donc totalement la difficulté active. Exposé ici pour que
     * les points d'appel du diviseur ×1e-30 (wiki NGU : "Fight boss
     * attack/defense divided by 1 nonillion (1e30)", identique en Evil et
     * SADISTIC) puissent le lire.
     */
    difficulty: ['normal','difficile','extreme'].indexOf(meta.difficulty) !== -1 ? meta.difficulty : 'normal',
    /*
     * difficultyPeaks (2026-09-18, Norman : "il faut tout faire") : pic de
     * boss réellement atteint par difficulté (idle-ngu-progression.js,
     * normalizeIdleNguState) -- utilisé par unlockedZone
     * (idle-adventure-v47.js) pour "Normal zones remain unlocked at all
     * times" (wiki "Evil difficulty") même quand la difficulté ACTUELLE
     * n'est plus Normal.
     */
    difficultyPeaks: meta.difficultyPeaks && typeof meta.difficultyPeaks === 'object' ? meta.difficultyPeaks : {},
    beastV4Beaten: Boolean(metaAdventureUnlockFlags.beastBrutalDefeated),
    exileV4Beaten: Boolean(metaAdventureUnlockFlags.exileBrutalDefeated)
  };
}


/**
 * ============================================================
 * ÉTAT JOUEUR
 * ============================================================
 */

function construireEtatJoueurSorealIdle_(
  feuille,
  ligne,
  progression
) {
  const c =
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  const row =
    feuille
      .getRange(
        ligne,
        1,
        1,
        c.STATS_JSON
      )
      .getValues()[0];

  const inventaireEtat =
    parserJsonSorealIdle_(
      row[c.INVENTAIRE_JSON - 1],
      []
    );

  const collectionEtat =
    synchroniserCollectionSorealIdle_(
      feuille,
      ligne,
      inventaireEtat
    );

  const equipementBrutEtat =
    parserJsonSorealIdle_(
      row[c.EQUIPEMENT_JSON - 1],
      {}
    );

  const defenseEtat =
    Math.max(
      0,
      nombreSorealIdle_(
        row[c.ENDURANCE - 1],
        100
      )
    );

  const attaqueBossEtat =
    attaqueBossSorealIdle_(
      row[c.BOSS_VAINCUS - 1]
    );

  /*
   * Champs legacy conservés dans la réponse pour compatibilité avec de
   * vieux clients, mais le système K.O. Fight Boss n'existe plus.
   */
  const koSecondesRestantes=0;

  const dateDebutBrute =
    row[c.DATE_DEBUT - 1];

  const dateDebutMs =
    dateSorealIdle_(
      dateDebutBrute,
      Date.now()
    );

  const ageMs =
    Math.max(0,Date.now()-dateDebutMs);

  const equipementEtat =
    detailsEquipementSorealIdle_(
      inventaireEtat,
      equipementBrutEtat
    );

  const capaciteInventaire =
    Math.max(
      CONFIG_SOREAL_IDLE.INVENTAIRE_CAPACITE_BASE,
      Math.floor(
        nombreSorealIdle_(
          row[c.INVENTAIRE_CAPACITE - 1],
          CONFIG_SOREAL_IDLE.INVENTAIRE_CAPACITE_BASE
        )
      )
    );

  const objetsDansSac =
    nombreObjetsSacSorealIdle_(
      inventaireEtat,
      equipementBrutEtat
    );

  const setsEtat =
    bonusSetsSorealIdle_(
      inventaireEtat,
      equipementBrutEtat
    );

  const statsEtat =
    statsJoueurSorealIdle_(
      row[c.STATS_JSON - 1]
    );

  const statsBossEtat =
    statsJoueurSorealIdle_(
      row[c.STATS_JSON - 1]
    );

  const niveauEtat =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          row[c.NIVEAU - 1],
          1
        )
      )
    );

  const bossVaincusEtat =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          row[c.BOSS_VAINCUS - 1],
          0
        )
      )
    );

  const bossSelectionIndex =
    bossVaincusEtat;

  const renaissancesEtat =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          row[c.RENAISSANCES - 1],
          0
        )
      )
    );

  const attaqueBossSelection =
    attaqueBossSorealIdle_(
      bossSelectionIndex
    );

  const defenseBossSelection =
    defenseBossSorealIdle_(
      bossSelectionIndex
    );

  const progressionCollectionsEtat =
    progressionCollectionsSorealIdle_(
      collectionEtat
    );

  const contexteMetaNguEtat =
    contexteMetaNguSorealIdle_(
      row,
      statsEtat,
      collectionEtat
    );

  const metaNguEtat =
    syncIdleNguState(
      statsEtat.metaNgu,
      contexteMetaNguEtat,
      Date.now()
    );

  statsEtat.metaNgu = metaNguEtat;

  const energieMetaEtat=metaNguEtat.resources&&metaNguEtat.resources.energy
    ?metaNguEtat.resources.energy
    :null;
  if(energieMetaEtat){
    row[c.ENERGIE - 1]=Math.max(0,nombreSorealIdle_(energieMetaEtat.current,0));
    row[c.ENERGIE_MAX - 1]=Math.max(0,nombreSorealIdle_(energieMetaEtat.cap,0));
    row[c.PROD_SECONDE - 1]=Math.max(0,idleNguResourceGenerationPerSecond(metaNguEtat,"energy"));
    feuille.getRange(ligne,c.ENERGIE).setValue(row[c.ENERGIE - 1]);
    feuille.getRange(ligne,c.ENERGIE_MAX).setValue(row[c.ENERGIE_MAX - 1]);
    feuille.getRange(ligne,c.PROD_SECONDE).setValue(row[c.PROD_SECONDE - 1]);
  }

  feuille
    .getRange(
      ligne,
      c.STATS_JSON
    )
    .setValue(
      JSON.stringify(statsEtat)
    );

  let apparenceNumeroEtat = 1;

  progressionCollectionsEtat.zones
    .forEach(function(zoneCollection) {
      if (!zoneCollection.complete) {
        return;
      }

      const set =
        setsSorealIdle_()
          .find(function(s) {
            return s.zoneId === zoneCollection.zoneId;
          });

      if (set) {
        apparenceNumeroEtat =
          Math.max(
            apparenceNumeroEtat,
            set.apparence
          );
      }
    });

  const reposListeEtat =
    reposSorealIdle_();

  const reposNumeroEtat =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          statsBossEtat.reposNumero,
          1
        )
      )
    );

  const reposEtat =
    reposListeEtat.find(
      function(r) {
        return r.numero === reposNumeroEtat;
      }
    ) ||
    reposListeEtat[0] ||
    {
      numero: 1,
      nom: 'Salle de repos 1',
      regenPctSec: 2.5,
      driveFileId: ''
    };

  const apparenceEtat =
    apparencesSorealIdle_()
      .find(function(a) {
        return a.numero === apparenceNumeroEtat;
      }) ||
    apparencesSorealIdle_()[0] ||
    {
      numero: 1,
      driveFileId: ''
    };

  const bossDefinitionEtat =
    definitionBossSorealIdle_(
      bossSelectionIndex
    );

  const productionSecondeEtat =
    Math.max(
      CONFIG_SOREAL_IDLE.PROD_SECONDE_BASE,
      nombreSorealIdle_(
        row[c.PROD_SECONDE - 1],
        CONFIG_SOREAL_IDLE.PROD_SECONDE_BASE
      )
    );

  const metaTickEnergieEtat =
    metaTickEnergieSorealIdle_(
      productionSecondeEtat
    );

  const combatPrincipalEtat =
    statsCombatPrincipalSorealIdleV413_(
      statsEtat,
      inventaireEtat,
      equipementBrutEtat,
      row[
        c.AMELIORATIONS_JSON - 1
      ],
      row[
        c.ESSENCE_RENAISSANCE - 1
      ],
      collectionEtat
    );

  return {
    id:
      String(
        row[c.ID - 1] || ''
      ),

    nom:
      String(
        row[c.NOM - 1] || ''
      ),

    // Compatibility field only. SOREAL IDLE has no global player level.
    niveau:1,

    // EXP is now the NGU Spend EXP currency from the shared meta engine.
    xp:
      Math.max(
        0,
        nombreSorealIdle_(
          metaNguEtat.currencies&&metaNguEtat.currencies.experience,
          0
        )
      ),

    energie:
      nombreSorealIdle_(
        row[c.ENERGIE - 1],
        0
      ),

    energieMax:
      nombreSorealIdle_(
        row[c.ENERGIE_MAX - 1],
        1000
      ),

    productionSeconde:
      productionSecondeEtat,

    energieTick: {
      gain:
        metaTickEnergieEtat.gain,

      dureeMs:
        metaTickEnergieEtat.dureeMs,

      resteMs:
        Math.max(
          0,
          nombreSorealIdle_(
            statsEtat.energieTickResteMs,
            0
          )
        )
    },

    basicTraining:
      basicTrainingSnapshotV411(
        normalizeBasicTrainingStateV411(
          statsEtat.entrainementBase,
          Date.now()
        ),
        nombreSorealIdle_(
          row[c.ENERGIE_MAX - 1],
          CONFIG_SOREAL_IDLE.ENERGIE_MAX_BASE
        ),
        nombreSorealIdle_(
          row[c.ENERGIE - 1],
          0
        ),
        niveauxParBarreEntrainementSorealIdle_(statsEtat)
      ),

    combatPrincipal: {
      attaqueEntrainement:
        combatPrincipalEtat
          .attaqueEntrainement,

      defenseEntrainement:
        combatPrincipalEtat
          .defenseEntrainement,

      bonusBoutique:
        combatPrincipalEtat
          .bonusBoutique,

      multiplicateurPermanent:
        combatPrincipalEtat
          .multiplicateurPermanent,

      multiplicateurEquipementAttaque:
        combatPrincipalEtat
          .equipement
          .multiplicateurAttaque,

      multiplicateurEquipementDefense:
        combatPrincipalEtat
          .equipement
          .multiplicateurDefense,

      piecesEquipees:
        combatPrincipalEtat
          .equipement
          .piecesEquipees,

      scoreEquipement:
        combatPrincipalEtat
          .equipement
          .scorePuissance,

      piecesArmure:
        combatPrincipalEtat
          .equipement
          .piecesArmure,

      scoreArmure:
        combatPrincipalEtat
          .equipement
          .scoreArmure
    },

    force:
      nombreSorealIdle_(
        row[c.FORCE - 1],
        1
      ),

    endurance:
      nombreSorealIdle_(
        row[c.ENDURANCE - 1],
        1
      ),

    organisation:
      nombreSorealIdle_(
        row[
          c.ORGANISATION - 1
        ],
        1
      ),

    puissance:
      nombreSorealIdle_(
        row[
          c.PUISSANCE - 1
        ],
        0
      ),

    bossActuel:
      String(
        row[
          c.BOSS_ACTUEL - 1
        ] ||
        CONFIG_SOREAL_IDLE
          .BOSS_BASE
      ),

    bossImage:
      String(
        bossDefinitionEtat.image || ''
      ),

    bossDriveFileId:
      String(
        bossDefinitionEtat.driveFileId || ''
      ),

    /*
     * Correctif 2026-09-13 : bossId permet au client de résoudre l'image
     * réelle sur R2 (idle/bosses/boss_<id>_*.webp) via
     * /api/idle/media/boss?id=<bossId> — driveFileId seul ne suffisait
     * plus, la résolution Drive côté serveur étant un stub inopérant
     * dans cet environnement Cloudflare Workers (DriveApp/Utilities,
     * ~ligne 362, renvoient toujours un blob vide).
     *
     * Correctif 2026-09-18 (Norman : "c'est toujours les mauvaises images
     * dans fight boss") : bossDefinitionEtat.id vient de la colonne brute
     * IDLE_BOSS.ID (via bossCatalogueSorealIdle_, qui trie ENSUITE le
     * catalogue par ce même id — un ID incohérent/à trous dans la feuille
     * décale l'id réel par rapport à la position réelle du boss). L'écran
     * Collection, lui, n'utilise JAMAIS cet id : bossCatalogue expose
     * "numero: index+1" (position dans le catalogue trié, RENVOYÉ
     * IDENTIQUE pour Fight Boss et Collection). bossSelectionIndex est
     * exactement ce même index (= bossVaincus, cf. plus haut) : bossId
     * doit donc être bossSelectionIndex+1, jamais bossDefinitionEtat.id,
     * pour résoudre EXACTEMENT la même image que la carte Collection du
     * même boss.
     */
    bossId:
      Math.max(
        0,
        Math.floor(bossSelectionIndex) + 1
      ),

    bossPv:
      nombreSorealIdle_(
        row[c.BOSS_PV - 1],
        CONFIG_SOREAL_IDLE
          .BOSS_PV_BASE
      ),

    bossPvMax:
      nombreSorealIdle_(
        row[
          c.BOSS_PV_MAX - 1
        ],
        CONFIG_SOREAL_IDLE
          .BOSS_PV_BASE
      ),

    bossVaincus:
      nombreSorealIdle_(
        row[
          c.BOSS_VAINCUS - 1
        ],
        0
      ),

    bossSelection:
      bossSelectionIndex + 1,

    mondeActuel:
      Math.floor(
        bossSelectionIndex /
        bossParMondeSorealIdle_()
      ) + 1,

    ordreBossMonde:
      (
        bossSelectionIndex %
        bossParMondeSorealIdle_()
      ) + 1,

    bossBloqueRenaissance:
      Boolean(
        progression &&
        progression.bossBloqueRenaissance
      ),

    combatBossActif:
      Boolean(
        statsBossEtat.combatBossActif
      ),

    autoBossSuivant:
      Boolean(
        statsBossEtat.autoBossSuivant
      ),

    bossRespawnJusqua: 0,

    bossRespawnSecondesRestantes: 0,

    bossDisponible: true,

    rang:
      nombreSorealIdle_(
        row[c.RANG - 1],
        0
      ),

    xpRequise: 0,

    degatsSeconde:
      Math.max(
        0,
        nombreSorealIdle_(
          row[c.PUISSANCE - 1],
          0
        )
      ),

    pvJoueur:
      Math.max(
        0,
        nombreSorealIdle_(
          row[c.PV_JOUEUR - 1],
          row[c.PV_JOUEUR_MAX - 1]
        )
      ),

    pvJoueurMax:
      Math.max(
        1,
        nombreSorealIdle_(
          row[c.PV_JOUEUR_MAX - 1],
          CONFIG_SOREAL_IDLE.PV_JOUEUR_BASE
        )
      ),

    defense:
      defenseEtat,

    attaqueBoss:
      attaqueBossSelection,

    defenseBoss:
      defenseBossSelection,

    regenBoss:
      regenBossSecondeSorealIdle_(
        bossSelectionIndex,
        Math.max(
          1,
          nombreSorealIdle_(
            row[c.BOSS_PV_MAX - 1],
            pvMaxBossSorealIdle_(
              bossSelectionIndex,
              metaNguEtat.difficulty
            )
          )
        )
      ),

    degatsRecusSeconde:
      degatsRecusSecondeSorealIdle_(
        bossSelectionIndex,
        defenseEtat,
        row[c.BOSS_PV - 1],
        row[c.BOSS_PV_MAX - 1]
      ),

    bossCapacites:
      Array.isArray(
        bossDefinitionEtat.capacites
      )
        ? bossDefinitionEtat.capacites
        : [],

    bossHistoire:
      String(
        bossDefinitionEtat.histoire || ''
      ),

    bossMortVivant:
      Boolean(
        bossDefinitionEtat.mortVivant
      ),

    /*
     * V186 — IDLE_BOSS.Conseil est un vestige éditorial SOREAL historique,
     * non sourcé NGU. Les histoires restent ; les anciens "tips" sont
     * neutralisés partout.
     */
    bossConseil: '',

    ko:
      koSecondesRestantes > 0,

    koSecondesRestantes:
      koSecondesRestantes,

    dureeKoSecondes: 0,

    pieces:
      Math.max(
        0,
        nombreSorealIdle_(
          row[c.PIECES - 1],
          0
        )
      ),

    inventaire:
      parserJsonSorealIdle_(
        row[
          c.INVENTAIRE_JSON - 1
        ],
        []
      ),

    equipement:
      equipementEtat,

    bonusEquipement:
      bonusEquipementSorealIdle_(
        parserJsonSorealIdle_(
          row[
            c.INVENTAIRE_JSON - 1
          ],
          []
        ),
        parserJsonSorealIdle_(
          row[
            c.EQUIPEMENT_JSON - 1
          ],
          {}
        )
      ),

    ameliorations:
      ameliorationsSorealIdle_(
        row[
          c.AMELIORATIONS_JSON - 1
        ]
      ),

    boutiqueLegacyDesactivee:true,

    coutsBoutique: {
      production:
        coutAmeliorationSorealIdle_(
          'production',
          ameliorationsSorealIdle_(
            row[
              c.AMELIORATIONS_JSON - 1
            ]
          ).production
        ),

      capacite:
        coutAmeliorationSorealIdle_(
          'capacite',
          ameliorationsSorealIdle_(
            row[
              c.AMELIORATIONS_JSON - 1
            ]
          ).capacite
        ),

      puissance:
        coutAmeliorationSorealIdle_(
          'puissance',
          ameliorationsSorealIdle_(
            row[
              c.AMELIORATIONS_JSON - 1
            ]
          ).puissance
        )
    },

    bonusBoutique:
      bonusAmeliorationsSorealIdle_(
        ameliorationsSorealIdle_(
          row[
            c.AMELIORATIONS_JSON - 1
          ]
        )
      ),

    boutiqueMeta:
      [
        'production',
        'capacite',
        'puissance'
      ].reduce(
        function(resultat,type) {
          const cfg =
            boutiqueConfigSorealIdle_(
              type
            ) || {};

          resultat[type] = {
            base:
              Math.max(
                1,
                nombreSorealIdle_(
                  cfg.base,
                  1
                )
              ),
            croissance:
              Math.max(
                1,
                nombreSorealIdle_(
                  cfg.croissance,
                  1
                )
              ),
            bonusParNiveau:
              nombreSorealIdle_(
                cfg.bonusParNiveau,
                0
              )
          };

          return resultat;
        },
        {}
      ),

    materiaux:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            row[c.MATERIAUX - 1],
            0
          )
        )
      ),

    collection:
      listeCollectionSorealIdle_(
        collectionEtat
      ),

    collections:
      progressionCollectionsEtat,

    inventaireCapacite:
      capaciteInventaire,

    inventaireUtilise:
      objetsDansSac,

    inventaireLibre:
      Math.max(
        0,
        capaciteInventaire-objetsDansSac
      ),

    /*
     * Norman (2026-09-10) : "L'inventaire ne doit pas se verrouiller quand
     * on rebirth. C'est un déblocage permanent." Même bug déjà corrigé une
     * fois pour l'Aventure/le Bestiaire (2026-09-09, cf.
     * construireAventureSorealIdle_/construireBestiaireSorealIdle_) :
     * row[BOSS_VAINCUS] est seulement le compteur du RUN EN COURS, remis à
     * 0 à chaque Renaissance — jamais utilisable seul comme condition de
     * déblocage permanent. Réutilise ici le même high-water-mark
     * persistant (metaNguEtat.records.highestBoss) plutôt que d'inventer
     * un second mécanisme parallèle. Les anciens critères (loot/inventaire
     * /collection non vides) restent en OR par compatibilité avec les
     * comptes déjà débloqués avant ce correctif.
     */
    inventaireDebloque:
      Boolean(
        Math.max(
          0,
          Math.floor(nombreSorealIdle_(row[c.BOSS_VAINCUS - 1],0)),
          Math.floor(
            nombreSorealIdle_(
              metaNguEtat.records &&
                metaNguEtat.records.highestBoss,
              0
            )
          )
        ) >= 4 ||
        Math.max(
          0,
          Math.floor(
            nombreSorealIdle_(
              statsEtat.lootsObtenus,
              0
            )
          )
        ) > 0 ||
        inventaireEtat.length > 0 ||
        (
          Array.isArray(
            collectionEtat
          ) &&
          collectionEtat.length > 0
        )
      ),

    coutExtensionInventaire:
      coutExtensionSacSorealIdle_(
        capaciteInventaire
      ),

    peutEtendreInventaire:
      capaciteInventaire <
      inventaireCapaciteMaxSorealIdle_(),

    sets:
      setsEtat,

    autoAventure: {
      actif:
        statsEtat.autoAventure,
      zoneId:
        statsEtat.autoAventureZone
    },

    apparenceJoueur: {
      numero:
        apparenceNumeroEtat,
      fichier:
        'Player_' + apparenceNumeroEtat + '.png',
      driveFileId:
        String(
          apparenceEtat.driveFileId || ''
        )
    },

    repos: {
      numero:
        reposEtat.numero,
      nom:
        reposEtat.nom,
      regenPctSec:
        reposEtat.regenPctSec,
      fichier:
        'Bedroom_' + reposEtat.numero + '.png',
      driveFileId:
        String(
          reposEtat.driveFileId || ''
        )
    },

    profil: {
      dateDebut:
        new Date(dateDebutMs).toISOString(),

      ageSecondes:
        Math.floor(ageMs/1000),

      ageHeures:
        ageMs/3600000,

      ageJours:
        ageMs/86400000,

      ageMois:
        ageMs/(86400000*30.4375),

      stats:
        statsEtat,

      nouveauJoueur:
        Boolean(
          ageMs < 15 * 60 * 1000 &&
          Math.floor(
            nombreSorealIdle_(
              row[c.NIVEAU - 1],
              1
            )
          ) <= 1 &&
          Math.floor(
            nombreSorealIdle_(
              row[c.BOSS_VAINCUS - 1],
              0
            )
          ) === 0 &&
          Math.floor(
            nombreSorealIdle_(
              row[c.RENAISSANCES - 1],
              0
            )
          ) === 0 &&
          Math.floor(
            nombreSorealIdle_(
              statsEtat.lootsObtenus,
              0
            )
          ) === 0
        )
    },

    forge:
      slotsEquipementSorealIdle_()
        .reduce(
          function(resultat,slot) {
            const objet=
              equipementEtat[slot];

            resultat[slot]=
              objet
                ?{
                    niveau:
                      Math.floor(
                        nombreSorealIdle_(
                          objet.forge,
                          0
                        )
                      ),
                    cout:
                      coutForgeSorealIdle_(
                        objet
                      )
                  }
                :null;

            return resultat;
          },
          {}
        ),

    forgeMeta: {
      base:
        Math.max(
          1,
          nombreSorealIdle_(
            parametreSorealIdle_(
              'FORGE_COUT_BASE',
              5
            ),
            5
          )
        ),
      croissance:
        Math.max(
          1,
          nombreSorealIdle_(
            parametreSorealIdle_(
              'FORGE_CROISSANCE',
              1.7
            ),
            1.7
          )
        )
    },

    inventaireMeta: {
      base:
        Math.max(
          1,
          Math.floor(
            nombreSorealIdle_(
              parametreSorealIdle_(
                'INVENTAIRE_CAPACITE_BASE',
                CONFIG_SOREAL_IDLE
                  .INVENTAIRE_CAPACITE_BASE
              ),
              CONFIG_SOREAL_IDLE
                .INVENTAIRE_CAPACITE_BASE
            )
          )
        ),
      pas:
        Math.max(
          1,
          Math.floor(
            nombreSorealIdle_(
              parametreSorealIdle_(
                'INVENTAIRE_EXTENSION_PAS',
                3
              ),
              3
            )
          )
        ),
      coutBase:
        Math.max(
          1,
          nombreSorealIdle_(
            parametreSorealIdle_(
              'INVENTAIRE_EXTENSION_COUT_BASE',
              25
            ),
            25
          )
        ),
      croissance:
        Math.max(
          1,
          nombreSorealIdle_(
            parametreSorealIdle_(
              'INVENTAIRE_EXTENSION_CROISSANCE',
              1.85
            ),
            1.85
          )
        ),
      max:
        inventaireCapaciteMaxSorealIdle_()
    },

    aventure:
      construireAventureSorealIdle_(
        row,
        metaNguEtat.records &&
          metaNguEtat.records.highestBoss || 0
      ),

    bestiaire:
      construireBestiaireSorealIdle_(
        row,
        metaNguEtat.records &&
          metaNguEtat.records.highestBoss || 0
      ),

    renaissance: {
      debloquee:Boolean(metaNguEtat.rebirth&&metaNguEtat.rebirth.canRebirth),
      /*
       * Norman (2026-09-16) : le Rebirth doit rester verrouillé (avec une
       * explication claire, pas juste "3 minutes") tant que le tutoriel
       * Aventure (boss 4) n'est pas fait — voir REBIRTH_UNLOCK_BOSS_V1.
       */
      aventureRequise:
        (metaNguEtat.records&&metaNguEtat.records.highestBoss||0) <
        REBIRTH_UNLOCK_BOSS_V1,
      aventureRequiseBoss:REBIRTH_UNLOCK_BOSS_V1,
      number:Math.max(1,nombreSorealIdle_(metaNguEtat.rebirth&&metaNguEtat.rebirth.number,1)),
      nextNumber:Math.max(1,nombreSorealIdle_(metaNguEtat.rebirth&&metaNguEtat.rebirth.nextNumber,1)),
      renaissances:Math.max(0,nombreSorealIdle_(metaNguEtat.records&&metaNguEtat.records.totalRebirths,0)),
      /*
       * Norman (2026-09-16) : "il faut aussi un timer avec le temps du
       * run actuel. Un run peut durer plusieurs jours." Expose le vrai
       * horodatage de début de run (déjà suivi en interne pour le calcul
       * du NUMBER, idle-ngu-progression.js) — le client calcule la durée
       * écoulée lui-même (Date.now()-runDebuteA), jamais un second
       * horodatage recalculé côté serveur.
       */
      runDebuteA:Math.max(0,nombreSorealIdle_(metaNguEtat.runStartedAt,0)),
      essence:0,
      legacy:false
    },

    titre: '',

    prochainPalier: null,

    deblocages:
      deblocagesEtatSorealIdleV405_(),

    patchRuntime:
      'GAME-V47-NGU-EARLY',

    systemes:
      idleNguSnapshot(
        metaNguEtat,
        contexteMetaNguEtat,
        Date.now()
      ),

    bossCatalogue:
      bossCatalogueSorealIdle_()
        .map(function(boss,index) {
          const vaincus =
            Math.max(
              0,
              Math.floor(
                nombreSorealIdle_(
                  row[c.BOSS_VAINCUS - 1],
                  0
                )
              )
            );

          const selection =
            bossSelectionIndex;

          return {
            numero: index + 1,
            monde:
              Math.floor(
                index /
                bossParMondeSorealIdle_()
              ) + 1,
            ordreMonde:
              (
                index %
                bossParMondeSorealIdle_()
              ) + 1,
            nom: boss.nom,
            niveauRequis:
              niveauRequisBossSorealIdle_(
                index
              ),
            connu:
              Boolean(
                index < vaincus ||
                (
                  index === vaincus &&
                  niveauEtat >=
                  niveauRequisBossSorealIdle_(
                    index
                  )
                )
              ),
            driveFileId:
              String(
                boss.driveFileId || ''
              ),
            pv:
              definitionBossSorealIdle_(index).pv,
            attaque:
              definitionBossSorealIdle_(index).attaque,
            /*
             * 2026-09-17 — pv/attaque juste au-dessus passent déjà par
             * definitionBossSorealIdle_ (valeurs équilibrées/corrigées).
             * xp lisait encore la ligne BRUTE du catalogue (boss.xp,
             * jamais corrigée par le plancher NGU) : le Bestiaire/l'écran
             * boss du client affichait donc encore 100/120/180/.../19000
             * même une fois le vrai calcul de combat corrigé. Alignée sur
             * pv/attaque pour afficher la même valeur que celle réellement
             * accordée au kill.
             */
            xp: definitionBossSorealIdle_(index).xp,
            pieces: boss.pieces,
            histoire:
              String(boss.histoire || ''),
            mortVivant:
              Boolean(boss.mortVivant),
            conseil: '',
            capacites:
              Array.isArray(
                boss.capacites
              )
                ? boss.capacites
                : [],
            puissanceMinimum:
              seuilPuissanceBossPrincipalSorealIdle_(
                index + 1,
                row[c.PV_JOUEUR_MAX - 1],
                defenseEtat
              ).puissance,
            selectionnable:
              Boolean(
                index === vaincus &&
                niveauEtat >=
                niveauRequisBossSorealIdle_(
                  index
                )
              ),
            selectionne:
              index === selection,
            etat:
              index < vaincus
                ? 'vaincu'
                : index === vaincus
                  ? 'actuel'
                  : 'avenir'
          };
        }),

    banniereDriveFileId:
      typeof banniereSorealIdleDriveFileId_ === 'function'
        ? banniereSorealIdleDriveFileId_()
        : String(
            parametreSorealIdle_(
              'BANNIERE_SOREAL_IDLE_DRIVE_ID',
              '1omNowtqq_YjUQitljdBXbLK9VZ0oJ7qb'
            ) || ''
          ),

    magie:
      (function(){
        const niveauActuel = Math.max(
          1,
          Math.floor(nombreSorealIdle_(row[c.NIVEAU - 1],1))
        );
        const statsMagie = statsJoueurSorealIdle_(row[c.STATS_JSON - 1]);
        const manaEtat = mettreAJourManaStatsSorealIdle_(
          statsMagie,
          niveauActuel,
          Date.now()
        );
        const debloquee = niveauActuel >= niveauMagieSorealIdle_();
        const bossActuel = definitionBossSorealIdle_(bossSelectionIndex);
        const maintenant = Date.now();

        return {
          debloquee: debloquee,
          niveauRequis: niveauMagieSorealIdle_(),
          mana: manaEtat.mana,
          manaMax: manaEtat.max,
          regenSeconde: manaEtat.regen,
          sortsAchetes: statsMagie.sortsAchetes.slice(),
          effets: {
            bouclierJusqua: statsMagie.buffBouclierJusqua,
            bouclierPct: statsMagie.buffBouclierPct,
            immuniteParalysieJusqua: statsMagie.immuniteParalysieJusqua,
            bossStunJusqua: statsMagie.bossStunJusqua,
            bossVulnerableJusqua: statsMagie.bossVulnerableJusqua,
            bossVulnerablePct: statsMagie.bossVulnerablePct,
            sceauBriseBossNumero: statsMagie.sceauBriseBossNumero
          },
          sorts: sortsSorealIdle_().map(function(sort){
            const achete = statsMagie.sortsAchetes.indexOf(sort.id) !== -1;
            const cooldownJusqua = Math.max(
              0,
              nombreSorealIdle_(statsMagie.cooldownsSorts[sort.id],0)
            );
            return Object.assign({},sort,{
              achete: achete,
              disponibleNiveau: niveauActuel >= sort.niveauRequis,
              achetable:
                !achete &&
                niveauActuel >= sort.niveauRequis &&
                Math.floor(nombreSorealIdle_(row[c.PIECES - 1],0)) >= sort.coutPieces,
              cooldownJusqua: cooldownJusqua,
              cooldownRestant:
                Math.max(0,(cooldownJusqua - maintenant)/1000),
              peutLancer:
                achete &&
                manaEtat.mana >= sort.coutMana &&
                cooldownJusqua <= maintenant,
              bossMortVivant:
                Boolean(bossActuel.mortVivant)
            });
          })
        };
      })(),

    prochainBoss:
      prochainBossSorealIdle_(
        row[c.BOSS_VAINCUS - 1]
      ),

    recompenseBossActuel: {
      xp:
        Math.max(
          0,
          Math.round(
            recompenseXpBossNiveauSorealIdle_(
              bossSelectionIndex,
              niveauEtat
            ) *
            Math.max(
              1,
              nombreSorealIdle_(
                idleNguBonuses(
                  statsEtat.metaNgu
                ).xpMultiplier,
                1
              )
            ) *
            facteurExpBossPerkSorealIdle_(
              idleNguBonuses(statsEtat.metaNgu),
              bossSelectionIndex
            )
          )
        ),

      xpBase:
        xpBossSorealIdle_(
          bossSelectionIndex
        ),

      xpMultiplicateur:
        Math.max(
          1,
          nombreSorealIdle_(
            idleNguBonuses(statsEtat.metaNgu).xpMultiplier,
            1
          )
        ),

      niveauRequis:1,

      pieces:
        recompensePiecesBossSorealIdle_(
          bossSelectionIndex
        )
    },

    progressionHorsLigne: {
      gainEnergie:
        progression
          ? nombreSorealIdle_(
              progression.gain,
              0
            )
          : 0,

      gainNetEnergie:
        progression
          ? nombreSorealIdle_(
              progression.gainNet,
              progression.gain
            )
          : 0,

      energieProduite:
        progression
          ? nombreSorealIdle_(
              progression.energieProduite,
              progression.gain
            )
          : 0,

      energieStockee:
        progression
          ? nombreSorealIdle_(
              progression.energieStockee,
              progression.gain
            )
          : 0,

      energiePerdueAuPlafond:
        progression
          ? nombreSorealIdle_(
              progression.energiePerdueAuPlafond,
              0
            )
          : 0,

      energieDepenseeAventure:
        progression
          ? nombreSorealIdle_(
              progression.energieDepenseeAventure,
              0
            )
          : 0,

      secondes:
        progression
          ? nombreSorealIdle_(
              progression
                .secondesComptabilisees,
              0
            )
          : 0,

      degats:
        progression
          ? nombreSorealIdle_(
              progression.degats,
              0
            )
          : 0,

      bossBattus:
        progression
          ? nombreSorealIdle_(
              progression.bossBattus,
              0
            )
          : 0,

      xpGagnee:
        progression
          ? nombreSorealIdle_(
              progression.xpGagnee,
              0
            )
          : 0,

      niveauxGagnes:
        progression
          ? nombreSorealIdle_(
              progression.niveauxGagnes,
              0
            )
          : 0,

      dropsRecents:
        progression &&
        Array.isArray(
          progression.dropsRecents
        )
          ? progression.dropsRecents
          : [],

      degatsRecus:
        progression
          ? nombreSorealIdle_(
              progression.degatsRecus,
              0
            )
          : 0,

      koSubis:
        progression
          ? nombreSorealIdle_(
              progression.koSubis,
              0
            )
          : 0
    },

    syncSecondes:
      Math.max(
        5,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'Sauvegarde serveur (secondes)',
            15
          ),
          15
        )
      ),

    serveurTs:
      Date.now()
  };
}



/**
 * ============================================================
 * ÉCONOMIE / PROGRESSION V6
 * ============================================================
 */

function recompensePiecesBossSorealIdle_(
  bossVaincusAvant
) {
  return Math.max(
    1,
    Math.round(
      nombreSorealIdle_(
        definitionBossSorealIdle_(
          bossVaincusAvant
        ).pieces,
        5
      )
    )
  );
}


function calculerPiecesSorealIdle_(
  bossVaincus
) {
  const n =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          bossVaincus,
          0
        )
      )
    );

  let total = 0;

  for (
    let i = 0;
    i < n;
    i += 1
  ) {
    total +=
      recompensePiecesBossSorealIdle_(
        i
      );
  }

  return total;
}


function prochainBossSorealIdle_(
  bossVaincus
) {
  const prochainIndex =
    Math.max(
      0,
      Math.floor(
        nombreSorealIdle_(
          bossVaincus,
          0
        )
      )
    ) + 1;

  return {
    numero:
      prochainIndex + 1,

    nom:
      nomBossSorealIdle_(
        prochainIndex
      ),

    pv:
      pvMaxBossSorealIdle_(
        prochainIndex
      ),

    niveauRequis:
      niveauRequisBossSorealIdle_(
        prochainIndex
      )
  };
}


/**
 * ============================================================
 * ENTRAÎNEMENTS
 * ============================================================
 */

function obtenirParametresEntrainementSorealIdle_() {
  return {
    force:
      Math.max(
        0,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'COEFFICIENT_FORCE',
            3
          ),
          3
        )
      ),

    endurance:
      Math.max(
        0,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'COEFFICIENT_ENDURANCE',
            2
          ),
          2
        )
      ),

    organisation:
      Math.max(
        0,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'COEFFICIENT_ORGANISATION',
            2
          ),
          2
        )
      )
  };
}


function coutEntrainementSorealIdle_(
  niveauActuel
) {
  const niveau =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          niveauActuel,
          1
        )
      )
    );

  return Math.max(
    1,
    Math.round(
      nombreSorealIdle_(
        parametreSorealIdle_(
          'COUT_ENTRAINEMENT_BASE',
          75
        ),
        75
      ) *
      niveau
    )
  );
}


function ajouterCoutsEntrainementEtatSorealIdle_(
  etat
) {
  if (!etat) {
    return etat;
  }

  const coefficients =
    obtenirParametresEntrainementSorealIdle_();

  etat.entrainementMeta = {
    force:
      coefficients.force,
    endurance:
      coefficients.endurance,
    organisation:
      coefficients.organisation,
    pvParEndurance:
      Math.max(
        0,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'PV_PAR_ENDURANCE',
            CONFIG_SOREAL_IDLE.PV_PAR_ENDURANCE
          ),
          CONFIG_SOREAL_IDLE.PV_PAR_ENDURANCE
        )
      ),
    defenseParEndurance:
      Math.max(
        0,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'DEFENSE_PAR_ENDURANCE',
            CONFIG_SOREAL_IDLE.DEFENSE_PAR_ENDURANCE
          ),
          CONFIG_SOREAL_IDLE.DEFENSE_PAR_ENDURANCE
        )
      ),
    organisationEnergieMax:
      Math.max(
        0,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'ORGANISATION_ENERGIE_MAX_PAR_NIVEAU',
            5
          ),
          5
        )
      ),
    organisationProdPct:
      Math.max(
        0,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'ORGANISATION_PROD_PCT_PAR_NIVEAU',
            2
          ),
          2
        )
      ),
    coutBase:
      Math.max(
        1,
        nombreSorealIdle_(
          parametreSorealIdle_(
            'COUT_ENTRAINEMENT_BASE',
            75
          ),
          75
        )
      )
  };

  etat.combatRegles = {
    bossDegatsMinPct:
      nombreSorealIdle_(
        parametreSorealIdle_(
          'BOSS_DEGATS_MIN_PCT',
          CONFIG_SOREAL_IDLE
            .DEGATS_BOSS_MIN_PCT
        ),
        CONFIG_SOREAL_IDLE
          .DEGATS_BOSS_MIN_PCT
      ),
    bossRespawnSecondes:
      delaiRespawnBossSorealIdle_(
        Math.max(
          0,
          nombreSorealIdle_(
            etat.bossSelection,
            1
          ) - 1
        )
      )
  };

  etat.coutsEntrainement = {
    force:
      coutEntrainementSorealIdle_(
        etat.force
      ),

    endurance:
      coutEntrainementSorealIdle_(
        etat.endurance
      ),

    organisation:
      coutEntrainementSorealIdle_(
        etat.organisation
      )
  };

  return etat;
}

/**
 * ============================================================
 * API DU JEU
 * ============================================================
 */

function definirCombatBossSorealIdle(
  sessionToken,
  actif,
  raison,
  snapshot
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(1800)) {
    return {
      ok: false,
      message:
        'Le jeu est occupé.'
    };
  }

  try {
    const feuille =
      obtenirFeuilleJoueursSorealIdle_();

    const ligne =
      trouverLigneJoueurSorealIdle_(
        feuille,
        acces
      );

    assurerDonneesJeuSorealIdle_(
      feuille,
      ligne
    );

    const c =
      CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

    /*
     * Rejouer TOUJOURS le temps écoulé avant de changer l'état Fight Boss.
     * C'est indispensable au redémarrage : le temps passé à régénérer hors
     * combat ne doit jamais être rejoué ensuite comme du temps de combat.
     */
    appliquerProgressionEnergieSorealIdle_(
      feuille,
      ligne
    );

    const stats =
      statsJoueurSorealIdle_(
        feuille
          .getRange(
            ligne,
            c.STATS_JSON
          )
          .getValue()
      );

    const raisonArret=
      String(raison||'')
        .trim()
        .toLowerCase();

    const arretApresDefaite=
      !Boolean(actif)&&
      raisonArret==='defaite';

    const snapshotCombat=
      snapshot&&typeof snapshot==='object'
        ?snapshot
        :null;

    const bossVaincusCourant=
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            feuille
              .getRange(
                ligne,
                c.BOSS_VAINCUS
              )
              .getValue(),
            0
          )
        )
      );

    const bossSelectionCourante=
      bossVaincusCourant+1;

    const snapshotMemeBoss=
      Boolean(
        snapshotCombat &&
        Math.max(
          0,
          Math.floor(
            nombreSorealIdle_(
              snapshotCombat.bossSelection,
              0
            )
          )
        )===bossSelectionCourante
      );

    /*
     * V184 — un Start peut rester en vol pendant un NUKE/Rebirth.
     * Si sa snapshot vise le boss précédent, il est OBSOLÈTE : surtout
     * ne pas réactiver combatBossActif sur le nouveau boss.
     *
     * On répond ok:true pour rendre l'opération idempotente et silencieuse ;
     * le client se resynchronisera normalement sans boucle de retry.
     */
    if(
      Boolean(actif) &&
      snapshotCombat &&
      !snapshotMemeBoss
    ){
      return {
        ok:true,
        actif:false,
        ignore:true,
        obsolete:true,
        bossSelection:bossSelectionCourante
      };
    }

    /*
     * Le client simule Fight Boss en continu entre deux RPC. Au moment
     * exact d'une défaite, fuite ou reprise, ses PV visibles sont donc
     * l'état le plus récent. Les recopier ici évite qu'un snapshot serveur
     * légèrement plus ancien ne rende instantanément de la vie au joueur
     * ou au boss. Les valeurs restent strictement bornées aux maxima serveur.
     */
    if(snapshotCombat){
      const pvJoueurMaxCourant=
        Math.max(
          1,
          nombreSorealIdle_(
            feuille
              .getRange(
                ligne,
                c.PV_JOUEUR_MAX
              )
              .getValue(),
            1
          )
        );

      const pvJoueurSnapshot=
        Math.max(
          0,
          Math.min(
            pvJoueurMaxCourant,
            nombreSorealIdle_(
              snapshotCombat.pvJoueur,
              feuille
                .getRange(
                  ligne,
                  c.PV_JOUEUR
                )
                .getValue()
            )
          )
        );

      feuille
        .getRange(
          ligne,
          c.PV_JOUEUR
        )
        .setValue(
          arretApresDefaite
            ?0
            :pvJoueurSnapshot
        );

      if(snapshotMemeBoss){
        const bossPvMaxCourant=
          Math.max(
            1,
            nombreSorealIdle_(
              feuille
                .getRange(
                  ligne,
                  c.BOSS_PV_MAX
                )
                .getValue(),
              1
            )
          );

        const bossPvSnapshot=
          Math.max(
            0,
            Math.min(
              bossPvMaxCourant,
              nombreSorealIdle_(
                snapshotCombat.bossPv,
                feuille
                  .getRange(
                    ligne,
                    c.BOSS_PV
                  )
                  .getValue()
              )
            )
          );

        feuille
          .getRange(
            ligne,
            c.BOSS_PV
          )
          .setValue(
            bossPvSnapshot
          );
      }
    }

    /*
     * Le prochain calcul serveur doit partir exactement de l'instant où
     * Fight/Fuite/défaite vient d'être enregistré, jamais d'un timestamp
     * antérieur à la transition d'état.
     */
    feuille
      .getRange(
        ligne,
        c.DERNIERE_SYNCHRO
      )
      .setValue(
        new Date()
      );

    /*
     * Fight Boss reste idempotent : un double clic sur Fight ne recrée
     * jamais le combat. Il n'existe en revanche plus aucun verrou K.O.
     */
    if(Boolean(actif)&&stats.combatBossActif){
      return {ok:true,actif:true,dejaActif:true};
    }

    if (Boolean(actif)) {
      const niveau =
        Math.max(
          1,
          Math.floor(
            nombreSorealIdle_(
              feuille
                .getRange(
                  ligne,
                  c.NIVEAU
                )
                .getValue(),
              1
            )
          )
        );

      const bossVaincus =
        bossVaincusCourant;

      const bossIndex =
        bossVaincus;

      stats.bossSelection =
        bossIndex + 1;

      stats.bossRespawnJusqua = 0;

      const niveauRequis =
        niveauRequisBossSorealIdle_(
          bossIndex
        );

      if (niveau < niveauRequis) {
        return {
          ok:false,
          code:'BOSS_NIVEAU_INSUFFISANT',
          niveauRequis:niveauRequis,
          message:
            'Niveau '+niveauRequis+
            ' requis pour ce combat.'
        };
      }

      marquerRencontreBossPrincipalUneFoisParRunV207_(
        stats,
        bossIndex + 1,
        bossVaincusCourant
      );
    }

    stats.combatBossActif =
      Boolean(actif);

    if(Boolean(actif)){
      feuille
        .getRange(
          ligne,
          c.KO_JUSQUA
        )
        .clearContent();
    }

    feuille
      .getRange(
        ligne,
        c.STATS_JSON
      )
      .setValue(
        JSON.stringify(
          stats
        )
      );

    if (!stats.combatBossActif) {
      /*
       * STOP = fuite du combat.
       * Les effets magiques temporaires ne survivent pas à une fuite.
       */
      stats.buffBouclierJusqua = 0;
      stats.buffBouclierPct = 0;
      stats.immuniteParalysieJusqua = 0;
      stats.bossStunJusqua = 0;
      stats.bossVulnerableJusqua = 0;
      stats.bossVulnerablePct = 0;
      stats.sceauBriseBossNumero = 0;

      feuille
        .getRange(
          ligne,
          c.STATS_JSON
        )
        .setValue(
          JSON.stringify(
            stats
          )
        );

      /*
       * Aucun K.O. et aucun reset de boss :
       * - défaite : le joueur est persisté à 0 PV ;
       * - fuite : ses PV courants sont conservés ;
       * - dans les deux cas, le boss conserve ses PV courants ;
       * - les deux barres régénèrent ensuite hors combat.
       */
      if(arretApresDefaite){
        feuille
          .getRange(
            ligne,
            c.PV_JOUEUR
          )
          .setValue(0);
      }

      feuille
        .getRange(
          ligne,
          c.KO_JUSQUA
        )
        .clearContent();

      feuille
        .getRange(
          ligne,
          c.DERNIERE_SYNCHRO
        )
        .setValue(
          new Date()
        );

      stats.bossStunJusqua = 0;
      stats.bossVulnerableJusqua = 0;
      stats.bossVulnerablePct = 0;
      stats.sceauBriseBossNumero = 0;

      feuille
        .getRange(
          ligne,
          c.STATS_JSON
        )
        .setValue(
          JSON.stringify(stats)
        );
    }

    SpreadsheetApp.flush();

    return {
      ok: true,
      actif:
        stats.combatBossActif
    };
  } finally {
    lock.releaseLock();
  }
}


/**
 * NUKE — règle BossController.nukeBosses() de NGU :
 * Attack joueur / 5 > Defense boss ET Defense joueur / 5 > Attack boss.
 * On avance depuis le boss courant tant que LES DEUX conditions restent
 * vraies, en accordant les mêmes récompenses qu'une victoire normale.
 * Combat arrêté au premier boss non nukable ; mur de Renaissance inchangé.
 */
/*
 * Perk ITOPOD « +2% EXP from bosses 24 and on » (wiki Experience, 25 niveaux) :
 * bossExpMultiplierFromPerks était calculé mais jamais lu. Les boss
 * d'index 23 et plus (boss 24+) reçoivent ce facteur en plus du multiplicateur d'XP.
 */
function facteurExpBossPerkSorealIdle_(bonus, indexBoss) {
  return indexBoss >= 23
    ? Math.max(1, nombreSorealIdle_(bonus && bonus.bossExpMultiplierFromPerks, 1))
    : 1;
}

function nukerBossSorealIdle(
  sessionToken
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(1800)) {
    return {
      ok: false,
      code: 'SOREAL_IDLE_OCCUPE',
      retryable: true,
      message: 'Le jeu est occupé.'
    };
  }

  try {
    const feuille =
      obtenirFeuilleJoueursSorealIdle_();

    const ligne =
      trouverLigneJoueurSorealIdle_(
        feuille,
        acces
      );

    assurerDonneesJeuSorealIdle_(
      feuille,
      ligne
    );

    /*
     * Comme renaitreSorealIdle : on rejoue d'abord toute la progression
     * d'entraînement/énergie/combat en attente, pour ne jamais calculer
     * NUKE sur une Défense ou un Boss vaincus périmés.
     */
    appliquerProgressionEnergieSorealIdle_(
      feuille,
      ligne
    );

    const c =
      CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

    const row =
      feuille
        .getRange(
          ligne,
          1,
          1,
          c.STATS_JSON
        )
        .getValues()[0];

    const stats =
      statsJoueurSorealIdle_(
        row[c.STATS_JSON - 1]
      );

    if (stats.combatBossActif) {
      /*
       * NUKE part toujours d'un état "prêt" (Task 2 : un combat manuel en
       * cours n'est jamais court-circuité automatiquement).
       */
      return {
        ok: false,
        code: 'SOREAL_IDLE_NUKE_COMBAT_EN_COURS',
        message: 'Termine ou arrête le combat en cours avant de lancer NUKE.'
      };
    }

    const renaissanceNativeCountNuke =
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            stats.metaNgu &&
              stats.metaNgu.records &&
              stats.metaNgu.records.totalRebirths,
            0
          )
        )
      );

    const niveauNuke =
      Math.max(
        1,
        Math.floor(
          nombreSorealIdle_(
            row[c.NIVEAU - 1],
            1
          )
        )
      );

    /*
     * V198 — appliquerProgressionEnergieSorealIdle_ vient de synchroniser
     * Basic Training + bonus NGU et a réécrit PUISSANCE/ENDURANCE avec les
     * stats Fight Boss effectives. Ce sont donc les mêmes Attack/Defense
     * que celles utilisées par le combat, jamais un calcul parallèle.
     */
    const attaqueNuke =
      Math.max(
        0,
        nombreSorealIdle_(
          row[c.PUISSANCE - 1],
          0
        )
      );

    const defenseNuke =
      Math.max(
        0,
        nombreSorealIdle_(
          row[c.ENDURANCE - 1],
          0
        )
      );

    let bossVaincus =
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            row[c.BOSS_VAINCUS - 1],
            0
          )
        )
      );

    let inventaire =
      parserJsonSorealIdle_(
        row[c.INVENTAIRE_JSON - 1],
        []
      );

    if (!Array.isArray(inventaire)) {
      inventaire = [];
    }

    const equipement =
      parserJsonSorealIdle_(
        row[c.EQUIPEMENT_JSON - 1],
        {}
      );

    let pieces =
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            row[c.PIECES - 1],
            0
          )
        )
      );

    const capaciteSac =
      Math.max(
        CONFIG_SOREAL_IDLE.INVENTAIRE_CAPACITE_BASE,
        Math.floor(
          nombreSorealIdle_(
            row[c.INVENTAIRE_CAPACITE - 1],
            CONFIG_SOREAL_IDLE.INVENTAIRE_CAPACITE_BASE
          )
        )
      );

    const bonusNguNuke =
      idleNguBonuses(
        stats.metaNgu
      );

    const xpMultiplierNuke =
      Math.max(
        1,
        nombreSorealIdle_(
          bonusNguNuke.xpMultiplier,
          1
        )
      );

    const dropMultiplierNuke =
      Math.max(
        1,
        nombreSorealIdle_(
          bonusNguNuke.dropMultiplier,
          1
        )
      );

    const defeated = [];
    const dropsRecents = [];
    let xpGagnee = 0;
    let iterations = 0;

    /*
     * FTBE (2026-09-17) : même mécanique que dans
     * appliquerProgressionEnergieSorealIdle_ — NUKE peut aussi vaincre
     * plusieurs boss d'affilée dans le même appel, donc le high-water-mark
     * local doit avancer à chaque kill, pas seulement être relu une fois.
     */
    let highestBossJamaisAtteintNuke =
      highestBossJamaisAtteintSorealIdle_(
        stats.metaNgu
      );

    while (iterations < 500) {
      iterations += 1;

      const bossBloqueRenaissanceNuke =
        bossVaincus === bossParMondeSorealIdle_() - 1 &&
        renaissanceNativeCountNuke < 1;

      if (bossBloqueRenaissanceNuke) {
        break;
      }

      if (
        niveauNuke <
        niveauRequisBossSorealIdle_(
          bossVaincus
        )
      ) {
        break;
      }

      const difficulteNuke =
        stats.metaNgu &&
        stats.metaNgu.difficulty;

      const attaqueBossNuke =
        attaqueBossSorealIdle_(
          bossVaincus,
          difficulteNuke
        );

      const defenseBossNuke =
        defenseBossSorealIdle_(
          bossVaincus,
          difficulteNuke
        );

      /*
       * Règle réelle de BossController.nukeBosses() :
       *   playerAttack / 5 > bossDefense
       *   ET
       *   playerDefense / 5 > bossAttack
       *
       * Les deux comparaisons sont strictes. L'ancienne implémentation ne
       * testait que Defense >= 5× Boss Attack et pouvait donc nuker un boss
       * que le joueur était incapable d'endommager.
       */
      if (
        !(attaqueNuke / 5 > defenseBossNuke) ||
        !(defenseNuke / 5 > attaqueBossNuke)
      ) {
        break;
      }

      const bossIndexNuke = bossVaincus;

      marquerRencontreBossPrincipalUneFoisParRunV207_(
        stats,
        bossIndexNuke + 1,
        bossVaincus
      );

      const xpReelleNuke =
        Math.max(
          0,
          Math.round(
              recompenseXpBossNiveauSorealIdle_(
              bossIndexNuke,
              niveauNuke
            ) *
            xpMultiplierNuke *
            facteurExpBossPerkSorealIdle_(bonusNguNuke, bossIndexNuke)
          )
        );

      if (xpReelleNuke > 0) {
        stats.metaNgu.currencies.experience =
          Math.max(
            0,
            nombreSorealIdle_(
              stats.metaNgu.currencies.experience,
              0
            )
          ) +
          xpReelleNuke;

        xpGagnee += xpReelleNuke;
      }

      const estPremiereFoisJamaisNuke =
        bossIndexNuke >= highestBossJamaisAtteintNuke;

      const bonusPremiereFoisNuke =
        estPremiereFoisJamaisNuke
          ? Math.max(
              0,
              Math.round(
                xpBonusPremiereFoisSorealIdle_(
                  bossIndexNuke
                ) *
                xpMultiplierNuke *
                facteurExpBossPerkSorealIdle_(bonusNguNuke, bossIndexNuke)
              )
            )
          : 0;

      if (bonusPremiereFoisNuke > 0) {
        stats.metaNgu.currencies.experience =
          Math.max(
            0,
            nombreSorealIdle_(
              stats.metaNgu.currencies.experience,
              0
            )
          ) +
          bonusPremiereFoisNuke;

        xpGagnee += bonusPremiereFoisNuke;
      }

      if (estPremiereFoisJamaisNuke) {
        enregistrerBossJamaisVaincuSorealIdle_(
          stats.metaNgu,
          bossIndexNuke
        );
        highestBossJamaisAtteintNuke =
          highestBossJamaisAtteintSorealIdle_(
            stats.metaNgu
          );
      }

      pieces +=
        Math.max(
          1,
          Math.round(
            recompensePiecesBossSorealIdle_(
              bossIndexNuke
            )
          )
        );

      if (
        Math.random() <
        Math.max(
          0,
          Math.min(
            1,
            nombreSorealIdle_(
              definitionBossSorealIdle_(
                bossIndexNuke
              ).chanceLoot,
              0.45
            ) *
            dropMultiplierNuke
          )
        )
      ) {
        const objetNuke =
          genererObjetBossSorealIdle_(
            bossIndexNuke,
            nomBossSorealIdle_(
              bossIndexNuke
            )
          );

        if (
          objetNuke &&
          nombreObjetsSacSorealIdle_(
            inventaire,
            equipement
          ) < capaciteSac
        ) {
          inventaire.push(objetNuke);
          dropsRecents.push(objetNuke);
        }
      }

      defeated.push({
        numero: bossIndexNuke + 1,
        nom: nomBossSorealIdle_(bossIndexNuke)
      });

      bossVaincus += 1;
    }

    if (!defeated.length) {
      return {
        ok: false,
        code: 'SOREAL_IDLE_NUKE_AUCUN_BOSS',
        message: 'NUKE impossible : ton Attaque doit dépasser 5× la Défense du boss ET ta Défense doit dépasser 5× son Attaque.'
      };
    }

    const bossSuivantNuke =
      definitionBossSorealIdle_(
        bossVaincus
      );

    /*
     * Combat toujours ARRÊTÉ après NUKE (Task 2) : le joueur revoit l'écran
     * "prêt" et doit recliquer Start pour le boss suivant, sauf s'il relance
     * NUKE lui-même.
     */
    stats.combatBossActif = false;
    stats.bossSelection = bossVaincus + 1;
    stats.bossRespawnJusqua = 0;
    stats.buffBouclierJusqua = 0;
    stats.buffBouclierPct = 0;
    stats.immuniteParalysieJusqua = 0;
    stats.bossStunJusqua = 0;
    stats.bossVulnerableJusqua = 0;
    stats.bossVulnerablePct = 0;
    stats.sceauBriseBossNumero = 0;

    feuille.getRange(ligne, c.BOSS_VAINCUS).setValue(bossVaincus);
    feuille.getRange(ligne, c.BOSS_ACTUEL).setValue(bossSuivantNuke.nom);
    feuille.getRange(ligne, c.BOSS_PV_MAX).setValue(bossSuivantNuke.pv);
    feuille.getRange(ligne, c.BOSS_PV).setValue(bossSuivantNuke.pv);

    feuille.getRange(ligne, c.PV_JOUEUR).setValue(
      Math.max(
        1,
        nombreSorealIdle_(
          row[c.PV_JOUEUR_MAX - 1],
          1
        )
      )
    );

    feuille.getRange(ligne, c.KO_JUSQUA).clearContent();
    feuille.getRange(ligne, c.PIECES).setValue(pieces);

    feuille.getRange(ligne, c.INVENTAIRE_JSON).setValue(
      JSON.stringify(inventaire)
    );

    feuille.getRange(ligne, c.STATS_JSON).setValue(
      JSON.stringify(stats)
    );

    SpreadsheetApp.flush();

    const joueur =
      ajouterCoutsEntrainementEtatSorealIdle_(
        construireEtatJoueurSorealIdle_(
          feuille,
          ligne,
          {
            gain: 0,
            secondesComptabilisees: 0,
            degats: 0,
            degatsRecus: 0,
            koSubis: 0,
            bossBattus: defeated.length,
            xpGagnee: xpGagnee,
            niveauxGagnes: 0,
            dropsRecents: dropsRecents
          }
        )
      );

    return {
      ok: true,
      nuke: {
        count: defeated.length,
        defeated: defeated
      },
      joueur: joueur
    };
  } finally {
    lock.releaseLock();
  }
}


function definirAutoBossSuivantSorealIdle(
  sessionToken,
  actif
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(1800)) {
    return {
      ok: false,
      message:
        'Le jeu est occupé.'
    };
  }

  try {
    const feuille =
      obtenirFeuilleJoueursSorealIdle_();

    const ligne =
      trouverLigneJoueurSorealIdle_(
        feuille,
        acces
      );

    assurerDonneesJeuSorealIdle_(
      feuille,
      ligne
    );

    const c =
      CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

    const stats =
      statsJoueurSorealIdle_(
        feuille
          .getRange(
            ligne,
            c.STATS_JSON
          )
          .getValue()
      );

    stats.autoBossSuivant =
      Boolean(actif);

    feuille
      .getRange(
        ligne,
        c.STATS_JSON
      )
      .setValue(
        JSON.stringify(
          stats
        )
      );

    SpreadsheetApp.flush();

    return {
      ok: true,
      actif:
        stats.autoBossSuivant
    };
  } finally {
    lock.releaseLock();
  }
}


function selectionnerBossSorealIdle(
  sessionToken,
  numeroBoss
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(1800)) {
    return {
      ok: false,
      message:
        'Le jeu est occupé.'
    };
  }

  try {
    const feuille =
      obtenirFeuilleJoueursSorealIdle_();

    const ligne =
      trouverLigneJoueurSorealIdle_(
        feuille,
        acces
      );

    assurerDonneesJeuSorealIdle_(
      feuille,
      ligne
    );

    const c =
      CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

    const row =
      feuille
        .getRange(
          ligne,
          1,
          1,
          c.STATS_JSON
        )
        .getValues()[0];

    const bossVaincus =
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            row[c.BOSS_VAINCUS - 1],
            0
          )
        )
      );

    const numeroDemande =
      Math.max(
        1,
        Math.floor(
          nombreSorealIdle_(
            numeroBoss,
            bossVaincus + 1
          )
        )
      );

    const numero =
      bossVaincus + 1;

    if (numeroDemande < numero) {
      return {
        ok:false,
        code:'BOSS_DEJA_VAINCU',
        message:
          'Ce boss est mort pour ce run. Il reviendra à la Renaissance.'
      };
    }

    if (numeroDemande > numero) {
      return {
        ok:false,
        code:'BOSS_NON_ATTEINT',
        message:
          'Bats d’abord le boss actuel.'
      };
    }

    const index =
      numero - 1;

    const niveau =
      Math.max(
        1,
        Math.floor(
          nombreSorealIdle_(
            row[c.NIVEAU - 1],
            1
          )
        )
      );

    const niveauRequis =
      niveauRequisBossSorealIdle_(
        index
      );

    if (niveau < niveauRequis) {
      return {
        ok:false,
        code:'BOSS_NIVEAU_INSUFFISANT',
        niveauRequis:niveauRequis,
        message:
          'Ce boss est encore inconnu.'
      };
    }

    const stats =
      statsJoueurSorealIdle_(
        row[c.STATS_JSON - 1]
      );

    stats.bossSelection =
      numero;

    stats.bossRespawnJusqua = 0;

    stats.buffBouclierJusqua = 0;
    stats.buffBouclierPct = 0;
    stats.immuniteParalysieJusqua = 0;
    stats.bossStunJusqua = 0;
    stats.bossVulnerableJusqua = 0;
    stats.bossVulnerablePct = 0;
    stats.sceauBriseBossNumero = 0;
    stats.bossStunJusqua = 0;
    stats.bossVulnerableJusqua = 0;
    stats.bossVulnerablePct = 0;
    stats.sceauBriseBossNumero = 0;

    const boss =
      definitionBossSorealIdle_(
        index
      );

    feuille
      .getRange(
        ligne,
        c.STATS_JSON
      )
      .setValue(
        JSON.stringify(
          stats
        )
      );

    feuille
      .getRange(
        ligne,
        c.BOSS_ACTUEL
      )
      .setValue(
        boss.nom
      );

    feuille
      .getRange(
        ligne,
        c.BOSS_PV_MAX
      )
      .setValue(
        boss.pv
      );

    feuille
      .getRange(
        ligne,
        c.BOSS_PV
      )
      .setValue(
        boss.pv
      );

    feuille
      .getRange(
        ligne,
        c.PV_JOUEUR
      )
      .setValue(
        row[c.PV_JOUEUR_MAX - 1]
      );

    feuille
      .getRange(
        ligne,
        c.KO_JUSQUA
      )
      .clearContent();

    SpreadsheetApp.flush();

    return {
      ok: true,
      numero:
        numero,
      nom:
        boss.nom,
      pv:
        boss.pv,
      attaque:
        boss.attaque,
      niveauRequis:
        niveauRequis
    };
  } finally {
    lock.releaseLock();
  }
}


/*
 * Audit 2026-09-17 (grand nettoyage) : obtenirImageReposSorealIdle,
 * obtenirImageJoueurSorealIdle et obtenirImageBossSorealIdle (RPC) ont
 * été retirées -- le client (SOREAL-APP) ne les appelle plus depuis le
 * 2026-09-13/14 (bascule vers des routes R2 dédiées, /api/idle/media/*,
 * gérées entièrement côté APP). Leurs seuls appelants,
 * imageReposParNumeroSorealIdle_/imageJoueurParNumeroSorealIdle_/
 * imageBossParNomSorealIdle_ (backées par DriveApp, toujours vide dans
 * cet environnement Cloudflare Workers -- jamais fonctionnelles),
 * supprimées avec elles. Zéro autre référence dans le dépôt, vérifié.
 */


/*
 * Norman (2026-09-14) : "j'ai toujours des items à 4/1. Sûrement dû à
 * mon ancienne partie. Je veux que tu forces un reset total du jeu
 * pour tout le monde." Confirmé explicitement (reset GLOBAL, pas
 * seulement son propre compte) avant exécution — action irréversible
 * qui efface la progression de tous les joueurs SOREAL IDLE.
 *
 * Même principe que reinitialiserCompteCompletSorealIdle (efface
 * réellement la ligne A:AL, jamais juste des compteurs remis à 0 —
 * au prochain chargement, creerJoueurSorealIdle_() recrée chaque
 * joueur comme une toute première connexion), appliqué à CHAQUE ligne
 * de la feuille JOUEURS plutôt qu'à la seule ligne de l'appelant.
 * Réservé à un déclenchement manuel ponctuel (jamais exposé à un
 * bouton joueur) : exigerAccesSorealIdle_ suffit ici, l'appelant est
 * l'unique Responsable qui a demandé et confirmé cette action.
 *
 * Correctif 2026-09-18 (Norman, en direct : "ajoute à moi seul, dans le
 * menu paramètres, un bouton qui reset l'entièreté des joueurs actuels")
 * — désormais exposée à un vrai bouton (SOREAL-APP, pageParametresIdleV28_),
 * donc le commentaire ci-dessus ("jamais un bouton joueur", "l'appelant
 * est l'unique Responsable") n'est plus garanti par le simple fait que
 * personne d'autre ne connaît cette fonction : exigerAccesSorealIdle_
 * seul autorise tout compte de la liste EMAILS_DEVELOPPEMENT (Norman,
 * Sébastien...), pas seulement Norman. ADMIN_SOREAL_IDLE_EMAIL restreint
 * cette action précise (et elle seule) au seul Responsable — la liste de
 * développement reste inchangée pour l'accès normal au jeu.
 */
const ADMIN_SOREAL_IDLE_EMAIL = 'technicien.soreal@gmail.com';

/*
 * Correctif 2026-09-18 (Norman, en direct, bug confirmé en repro live
 * malgré un premier correctif client le même jour) : le bouton admin
 * restait invisible car il dépendait entièrement de SOREAL_USER, peuplé
 * côté client par le handshake TV-embed (postMessage, tv-staging-session-
 * bridge-v1.html / authReturnInline de build-static.mjs) -- un mécanisme
 * asynchrone dont le timing n'est jamais garanti par rapport au premier
 * rendu de la page Settings. Ce point d'entrée dédié, minimal (aucune
 * lecture de feuille), donne au client une réponse SERVEUR autoritaire
 * et indépendante de ce handshake -- la même comparaison que
 * reinitialiserTousLesComptesSorealIdle ci-dessous, jamais un second
 * critère dupliqué.
 */
function estAdminSorealIdle(
  sessionToken
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  return {
    ok: true,
    isAdmin:
      String(acces.emailAutorise || '').toLowerCase() ===
      ADMIN_SOREAL_IDLE_EMAIL
  };
}

function reinitialiserTousLesComptesSorealIdle(
  sessionToken
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  if (
    String(acces.emailAutorise || '').toLowerCase() !==
    ADMIN_SOREAL_IDLE_EMAIL
  ) {
    throw new Error(
      'SOREAL_IDLE_ADMIN_REQUIS'
    );
  }

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(10000)) {
    return {
      ok: false,
      code: 'SOREAL_IDLE_OCCUPE',
      retryable: true,
      message:
        'Le moteur termine encore une action. Réessaie dans un instant.'
    };
  }

  try {
    const feuille =
      obtenirFeuilleJoueursSorealIdle_();

    const c =
      CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

    const derniereLigne =
      feuille.getLastRow();

    let comptesEffaces = 0;

    if (derniereLigne >= 2) {
      feuille
        .getRange(
          2,
          1,
          derniereLigne - 1,
          c.STATS_JSON
        )
        .clearContent();

      comptesEffaces = derniereLigne - 1;
    }

    SpreadsheetApp.flush();

    return {
      ok: true,
      resetComplet: true,
      comptesEffaces: comptesEffaces,
      message:
        'Tous les comptes SOREAL IDLE ont été réinitialisés (' +
        comptesEffaces +
        ' compte(s)).'
    };
  } finally {
    lock.releaseLock();
  }
}


function reinitialiserCompteCompletSorealIdle(
  sessionToken
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(10000)) {
    return {
      ok: false,
      code: 'SOREAL_IDLE_OCCUPE',
      retryable: true,
      message:
        'Le moteur termine encore une action. Réessaie dans un instant.'
    };
  }

  try {
    const feuille =
      obtenirFeuilleJoueursSorealIdle_();

    const ligne =
      trouverLigneJoueurSorealIdle_(
        feuille,
        acces
      );

    const c =
      CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

    /*
     * RESET TOTAL.
     *
     * On ne remet pas simplement des compteurs à 0 :
     * on efface réellement toute la ligne A:AL du joueur.
     * Au prochain chargement d'IDLE, trouverLigneJoueurSorealIdle_()
     * ne retrouvera plus cet utilisateur et passera par
     * creerJoueurSorealIdle_(), exactement comme une première connexion.
     *
     * Le format de la feuille est conservé, seul le contenu est effacé.
     */
    feuille
      .getRange(
        ligne,
        1,
        1,
        c.STATS_JSON
      )
      .clearContent();

    SpreadsheetApp.flush();

    return {
      ok: true,
      resetComplet: true,
      message:
        'Compte SOREAL IDLE entièrement réinitialisé.'
    };
  } finally {
    lock.releaseLock();
  }
}



/**
 * V40.8 — endpoint public autonome.
 *
 * Le Game expose désormais lui-même obtenirEtatSorealIdle().
 * Ainsi le lancement ne dépend plus de la version du Loader installée.
 * Un Loader V2.2 qui expose aussi ce nom reste compatible : les deux
 * implémentations routent vers la même fonction interne.
 */
function obtenirEtatSorealIdle(
  sessionToken
) {
  return obtenirEtatSorealIdleGameV40_(
    sessionToken,
    {stopBossOnOpen:true}
  );
}


function obtenirEtatSorealIdleGameV40_(
  sessionToken,
  options
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const lock =
    LockService.getScriptLock();

  /*
   * Au premier chargement, Apps Script peut encore terminer une ancienne
   * opération IDLE. Ce n'est pas une erreur fatale.
   * On attend davantage et, si le verrou reste pris, le client retente.
   */
  /*
   * V40.6 — le verrou serveur ne doit plus devenir un faux temps
   * de chargement. On sonde brièvement puis le launcher retente
   * automatiquement avec le même écran de chargement.
   */
  if (!lock.tryLock(120)) {
    return {
      ok: false,
      autorise: true,
      code: 'SOREAL_IDLE_OCCUPE',
      retryable: true,
      retryAfterMs: 220,
      message:
        'Finalisation des données SOREAL IDLE…'
    };
  }

  try {
    const feuille =
      obtenirFeuilleJoueursSorealIdle_();

    const ligne =
      trouverLigneJoueurSorealIdle_(
        feuille,
        acces
      );

    initialiserModeleJoueurSorealIdleV41SiNecessaire_(
      feuille,
      ligne
    );

    /*
     * V206 — ouvrir/recharger SOREAL IDLE ne reprend jamais un Fight Boss
     * abandonné dans un ancien onglet/WebView. Le combat doit repartir
     * uniquement après un nouveau clic explicite sur Fight.
     *
     * Important : on coupe l'ancien flag AVANT de rejouer le temps écoulé,
     * sinon une session fermée avec combatBossActif=true pouvait tuer le
     * boss suivant pendant l'écran de chargement.
     */
    if(options&&options.stopBossOnOpen){
      const c=CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;
      const statsOuverture=statsJoueurSorealIdle_(
        feuille.getRange(ligne,c.STATS_JSON).getValue()
      );
      if(statsOuverture.combatBossActif){
        statsOuverture.combatBossActif=false;
        statsOuverture.bossStunJusqua=0;
        statsOuverture.bossVulnerableJusqua=0;
        statsOuverture.bossVulnerablePct=0;
        statsOuverture.sceauBriseBossNumero=0;
        feuille.getRange(ligne,c.STATS_JSON).setValue(JSON.stringify(statsOuverture));
        feuille.getRange(ligne,c.DERNIERE_SYNCHRO).setValue(new Date());
      }
    }

    const progression =
      appliquerProgressionEnergieSorealIdle_(
        feuille,
        ligne
      );

    return {
      ok: true,
      autorise: true,
      version:
        CONFIG_SOREAL_IDLE.VERSION,

      patchRuntime:
        'GAME-V47-NGU-EARLY',

      joueur:
        ajouterCoutsEntrainementEtatSorealIdle_(
          construireEtatJoueurSorealIdle_(
            feuille,
            ligne,
            progression
          )
        )
    };
  } finally {
    lock.releaseLock();
  }
}


/**
 * Synchronisation volontaire.
 *
 * Pour V2, le client n'envoie PAS son énergie :
 * le serveur recalcule lui-même le temps écoulé.
 * Cela évite qu'une valeur modifiée dans le navigateur
 * soit enregistrée dans la feuille.
 */
function synchroniserSorealIdle(
  sessionToken
) {
  return obtenirEtatSorealIdleGameV40_(
    sessionToken,
    {stopBossOnOpen:false}
  );
}




/**
 * ============================================================
 * ACTIONS RAPIDES / BATCH V60
 * ============================================================
 *
 * Ces endpoints sont pensés pour une UI de jeu idle :
 * - plusieurs clics peuvent être accumulés côté navigateur ;
 * - un seul verrou + une seule lecture/écriture pour tout le lot ;
 * - réponse minimale : le client garde son état optimiste et resynchronise
 *   seulement lorsque toutes les actions en attente sont envoyées.
 */

function reponseOccupeeSorealIdleV60_() {
  return {
    ok: false,
    code: 'SOREAL_IDLE_OCCUPE',
    retryable: true,
    message:
      'Le moteur traite encore une action.'
  };
}


/*
 * Audit 2026-09-16 : dans le vrai NGU Idle, l'équipement/loot n'existe
 * QUE dans Adventure Mode -- le combat de boss numéroté (Fight Boss/
 * Basic Training) n'a AUCUN objet équipé dans le vrai jeu. Désactivée
 * pour une fidélité NGU totale (décision de Norman, 2026-09-16), même
 * patron que les 7 autres mécaniques de loot déjà désactivées ici. Les
 * objets déjà équipés/l'inventaire existant restent en l'état (gel
 * propre, aucune donnée supprimée), simplement plus modifiables ni
 * lus par le calcul de combat (voir statsCombatPrincipalSorealIdleV413_).
 */
function equiperObjetsSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}


/*
 * Audit 2026-09-16 : même décision que equiperObjetsSorealIdle ci-dessus
 * -- pas déquivalent NGU pour la fusion d’équipement Fight Boss.
 */
function fusionnerObjetsSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}



function obtenirEtatBoutiqueSorealIdle(
  sessionToken
) {
  const acces=
    exigerAccesSorealIdle_(
      sessionToken
    );

  const feuille=
    obtenirFeuilleJoueursSorealIdle_();

  const ligne=
    trouverLigneJoueurSorealIdle_(
      feuille,
      acces
    );

  const c=
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  const row=
    feuille
      .getRange(
        ligne,
        1,
        1,
        c.AMELIORATIONS_JSON
      )
      .getValues()[0];

  const ameliorations=
    ameliorationsSorealIdle_(
      row[
        c.AMELIORATIONS_JSON-1
      ]
    );

  return {
    ok:true,
    pieces:
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            row[c.PIECES-1],
            0
          )
        )
      ),
    ameliorations:
      Object.assign(
        {},
        ameliorations
      ),
    coutsBoutique:{
      production:
        coutAmeliorationSorealIdle_(
          'production',
          ameliorations.production
        ),
      capacite:
        coutAmeliorationSorealIdle_(
          'capacite',
          ameliorations.capacite
        ),
      puissance:
        coutAmeliorationSorealIdle_(
          'puissance',
          ameliorations.puissance
        )
    },

    /*
     * Valeurs dérivées autoritaires pour la réconciliation ciblée APP.
     * L'interface ne doit pas reconstruire Organisation/Renaissance/sets.
     */
    energie:
      Math.max(
        0,
        nombreSorealIdle_(
          row[c.ENERGIE-1],
          0
        )
      ),
    energieMax:
      Math.max(
        1,
        nombreSorealIdle_(
          row[c.ENERGIE_MAX-1],
          CONFIG_SOREAL_IDLE.ENERGIE_MAX_BASE
        )
      ),
    productionSeconde:
      Math.max(
        0.01,
        nombreSorealIdle_(
          row[c.PROD_SECONDE-1],
          CONFIG_SOREAL_IDLE.PROD_SECONDE_BASE
        )
      ),
    puissance:
      Math.max(
        1,
        nombreSorealIdle_(
          row[c.PUISSANCE-1],
          1
        )
      ),
    bonusBoutique:
      bonusAmeliorationsSorealIdle_(
        ameliorations
      )
  };
}


function acheterAmeliorationsSorealIdle(
  sessionToken,
  demandes
) {
  void sessionToken;
  void demandes;
  return {
    ok:false,
    code:'SOREAL_IDLE_V53_LEGACY_SHOP_DISABLED',
    message:'Cette ancienne boutique est désactivée. Utilise Spend EXP du moteur NGU.'
  };
}


function ameliorerEquipementsForgeSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}


function agrandirInventairePlusieursSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}




/**
 * Sauvegarde la disposition visuelle du sac.
 * Les cases vides sont conservées.
 */
function sauvegarderDispositionInventaireSorealIdle(
  sessionToken,
  cases
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(8000)) {
    return reponseOccupeeSorealIdleV60_();
  }

  try {
    const feuille =
      obtenirFeuilleJoueursSorealIdle_();

    const ligne =
      trouverLigneJoueurSorealIdle_(
        feuille,
        acces
      );

    assurerDonneesJeuSorealIdle_(
      feuille,
      ligne
    );

    const c =
      CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

    const inventaire =
      parserJsonSorealIdle_(
        feuille
          .getRange(
            ligne,
            c.INVENTAIRE_JSON
          )
          .getValue(),
        []
      );

    const equipement =
      parserJsonSorealIdle_(
        feuille
          .getRange(
            ligne,
            c.EQUIPEMENT_JSON
          )
          .getValue(),
        {}
      );

    const capacite =
      Math.max(
        CONFIG_SOREAL_IDLE
          .INVENTAIRE_CAPACITE_BASE,
        Math.floor(
          nombreSorealIdle_(
            feuille
              .getRange(
                ligne,
                c.INVENTAIRE_CAPACITE
              )
              .getValue(),
            CONFIG_SOREAL_IDLE
              .INVENTAIRE_CAPACITE_BASE
          )
        )
      );

    const idsEquipes =
      Object.keys(
        equipement || {}
      )
        .map(function(slot) {
          return String(
            equipement[slot] || ''
          );
        })
        .filter(Boolean);

    const objetsSac =
      inventaire.filter(
        function(objet) {
          return (
            objet &&
            idsEquipes.indexOf(
              String(
                objet.id || ''
              )
            ) === -1
          );
        }
      );

    const parId = {};

    objetsSac.forEach(
      function(objet) {
        parId[
          String(
            objet.id || ''
          )
        ] = objet;
      }
    );

    const vus = {};
    const positionsUtilisees = {};

    (
      Array.isArray(cases)
        ? cases.slice(
            0,
            capacite
          )
        : []
    )
      .forEach(function(id,index) {
        const cle =
          String(id || '');

        if (
          !cle ||
          !parId[cle] ||
          vus[cle]
        ) {
          return;
        }

        const position =
          index + 1;

        parId[cle].positionSac =
          position;

        vus[cle] = true;
        positionsUtilisees[
          position
        ] = true;
      });

    let prochainePosition = 1;

    objetsSac.forEach(
      function(objet) {
        const id =
          String(
            objet.id || ''
          );

        if (vus[id]) {
          return;
        }

        while (
          prochainePosition <=
            capacite &&
          positionsUtilisees[
            prochainePosition
          ]
        ) {
          prochainePosition += 1;
        }

        if (
          prochainePosition <=
          capacite
        ) {
          objet.positionSac =
            prochainePosition;

          positionsUtilisees[
            prochainePosition
          ] = true;

          prochainePosition += 1;
        }
      }
    );

    feuille
      .getRange(
        ligne,
        c.INVENTAIRE_JSON
      )
      .setValue(
        JSON.stringify(
          inventaire
        )
      );

    SpreadsheetApp.flush();

    return {
      ok: true
    };
  } finally {
    lock.releaseLock();
  }
}


/**
 * ============================================================
 * TEST
 * ============================================================
 */

function testerAccesSorealIdle(
  sessionToken
) {
  const acces =
    verifierAccesSorealIdle_(
      sessionToken
    );

  return {
    ok:
      Boolean(acces.ok),

    autorise:
      Boolean(
        acces.autorise
      ),

    raison:
      String(
        acces.raison || ''
      ),

    prenom:
      acces.user
        ? String(
            acces.user.prenom ||
            ''
          )
        : '',

    email:
      acces.user
        ? String(
            acces.user.email ||
            ''
          )
        : '',

    emailConnexion:
      acces.user
        ? String(
            acces.user
              .emailConnexion ||
            ''
          )
        : ''
  };
}



/*
 * Audit 2026-09-17 (grand nettoyage) : appliquerAchatsEntrainementsSorealIdle_
 * (ancien modèle "acheter un niveau à la fois" en Force/Endurance/
 * Organisation) n'avait plus aucun appelant dans tout le dépôt --
 * entièrement remplacé par le modèle d'allocation en pourcentage
 * (applyBasicTrainingAllocationsV411, appelé par
 * definirAllocationsEntrainementSorealIdle ci-dessous). Supprimée.
 */
function definirAllocationsEntrainementSorealIdle(
  sessionToken,
  allocations
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(2500)) {
    return reponseOccupeeSorealIdleV60_();
  }

  try {
    const feuille =
      obtenirFeuilleJoueursSorealIdle_();

    const ligne =
      trouverLigneJoueurSorealIdle_(
        feuille,
        acces
      );

    initialiserModeleJoueurSorealIdleV41SiNecessaire_(
      feuille,
      ligne
    );

    appliquerProgressionEnergieSorealIdle_(
      feuille,
      ligne
    );

    const c =
      CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

    const row =
      feuille
        .getRange(
          ligne,
          1,
          1,
          c.STATS_JSON
        )
        .getValues()[0];

    const stats =
      statsJoueurSorealIdle_(
        row[c.STATS_JSON - 1]
      );

    const budgetMetaEnergie = idleNguResourceBudget(
      stats.metaNgu,
      "energy",
      {}
    );
    const reserveMetaEnergie = Math.max(
      0,
      nombreSorealIdle_(budgetMetaEnergie.allocated,0)
    );

    const resultat =
      applyBasicTrainingAllocationsV411(
        stats.entrainementBase,
        allocations,
        Math.max(0,nombreSorealIdle_(row[c.ENERGIE - 1],0)),
        Math.max(0,nombreSorealIdle_(row[c.ENERGIE_MAX - 1],0)-reserveMetaEnergie)
      );

    stats.modeleJeuVersion =
      BASIC_TRAINING_V411.version;

    stats.entrainementBase =
      resultat.state;

    if(
      stats.metaNgu&&
      stats.metaNgu.version===IDLE_NGU_META_VERSION&&
      stats.metaNgu.resources&&
      stats.metaNgu.resources.energy
    ){
      stats.metaNgu.resources.energy.current=Math.max(0,nombreSorealIdle_(resultat.idleEnergy,0));
      /*
       * 2026-09-23 (audit NGU) : ne PAS remettre fillProgress à 0. Chaque
       * changement d'allocation effaçait la fraction de barre d'énergie déjà
       * remplie (jusqu'à 1 unité de régénération perdue par clic) ; le vrai
       * jeu conserve la progression de la barre.
       */
    }

    feuille
      .getRange(
        ligne,
        c.ENERGIE
      )
      .setValue(
        resultat.idleEnergy
      );

    feuille
      .getRange(
        ligne,
        c.STATS_JSON
      )
      .setValue(
        JSON.stringify(
          stats
        )
      );

    SpreadsheetApp.flush();

    return {
      ok:true,
      energieIdle:
        resultat.idleEnergy,
      energieAllouee:
        resultat.allocated,
      joueur:
        ajouterCoutsEntrainementEtatSorealIdle_(
          construireEtatJoueurSorealIdle_(
            feuille,
            ligne,
            {
              gain:0,
              secondesComptabilisees:0,
              degats:0,
              bossBattus:0,
              xpGagnee:0,
              niveauxGagnes:0,
              dropsRecents:[]
            }
          )
        )
    };
  } finally {
    lock.releaseLock();
  }
}


function acheterEntrainementsSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}


function acheterEntrainementSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}



/**
 * Action générique pour la métaprogression V42.
 */
function agirProgressionSorealIdle(
  sessionToken,
  action
) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return reponseOccupeeSorealIdleV60_();

  try {
    const feuille = obtenirFeuilleJoueursSorealIdle_();
    const ligne = trouverLigneJoueurSorealIdle_(feuille,acces);
    appliquerProgressionEnergieSorealIdle_(feuille,ligne);

    const c = CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;
    const row = feuille.getRange(ligne,1,1,c.STATS_JSON).getValues()[0];
    const stats = statsJoueurSorealIdle_(row[c.STATS_JSON - 1]);
    const collection = parserJsonSorealIdle_(row[c.COLLECTION_JSON - 1],{});
    const contexte = contexteMetaNguSorealIdle_(row,stats,collection);

    const applique = applyIdleNguAction(
      stats.metaNgu,
      action && typeof action === 'object' ? action : {},
      contexte,
      Date.now()
    );

    stats.metaNgu = applique.state;

    /*
     * EXP Shop : metaNgu.currencies.experience est la source de vérité.
     * La colonne historique XP n'est plus qu'un miroir de compatibilité ;
     * on la resynchronise dans LA MÊME opération que tout achat/récompense
     * meta afin qu'une valeur ancienne ne puisse jamais être réimportée
     * lors d'un appel ultérieur. Cela couvre buyResource, Newbie Offers
     * et tout autre achat du Spend EXP sans logique spéciale par bouton.
     */
    const experienceMetaAction=Math.max(
      0,
      nombreSorealIdle_(
        stats.metaNgu &&
          stats.metaNgu.currencies &&
          stats.metaNgu.currencies.experience,
        0
      )
    );
    row[c.XP - 1]=experienceMetaAction;
    feuille
      .getRange(
        ligne,
        c.XP
      )
      .setValue(
        experienceMetaAction
      );

    if(applique.result&&applique.result.challengeReset){
      const maintenantDefi=Date.now();
      stats.entrainementBase=rebirthBasicTrainingStateV411(
        stats.entrainementBase,
        maintenantDefi
      );
      stats.modeleJeuVersion=BASIC_TRAINING_V411.version;
      stats.combatBossActif=false;
      stats.bossSelection=1;
      stats.bossRespawnJusqua=0;
      row[c.NIVEAU-1]=1;
      row[c.BOSS_VAINCUS-1]=0;
      row[c.BOSS_ACTUEL-1]=nomBossSorealIdle_(0);
      /*
       * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
       * stats.metaNgu vient d'être remplacé par applique.state (ligne
       * ci-dessus) -- reflète déjà la NOUVELLE difficulté si ce reset
       * provient d'un changement de difficulté (difficultyAction,
       * idle-ngu-progression.js), pas l'ancienne.
       */
      row[c.BOSS_PV_MAX-1]=pvMaxBossSorealIdle_(0,stats.metaNgu&&stats.metaNgu.difficulty);
      row[c.BOSS_PV-1]=row[c.BOSS_PV_MAX-1];
      feuille.getRange(ligne,c.NIVEAU).setValue(1);
      feuille.getRange(ligne,c.BOSS_VAINCUS).setValue(0);
      feuille.getRange(ligne,c.BOSS_ACTUEL).setValue(row[c.BOSS_ACTUEL-1]);
      feuille.getRange(ligne,c.BOSS_PV_MAX).setValue(row[c.BOSS_PV_MAX-1]);
      feuille.getRange(ligne,c.BOSS_PV).setValue(row[c.BOSS_PV-1]);
      try{feuille.getRange(ligne,c.KO_JUSQUA).clearContent();}catch(e){}
    }

    const energieMetaAction=stats.metaNgu.resources&&stats.metaNgu.resources.energy
      ?stats.metaNgu.resources.energy
      :null;
    if(energieMetaAction){
      row[c.ENERGIE - 1]=Math.max(0,nombreSorealIdle_(energieMetaAction.current,0));
      row[c.ENERGIE_MAX - 1]=Math.max(0,nombreSorealIdle_(energieMetaAction.cap,0));
      row[c.PROD_SECONDE - 1]=Math.max(0,idleNguResourceGenerationPerSecond(stats.metaNgu,"energy"));
      feuille.getRange(ligne,c.ENERGIE).setValue(row[c.ENERGIE - 1]);
      feuille.getRange(ligne,c.ENERGIE_MAX).setValue(row[c.ENERGIE_MAX - 1]);
      feuille.getRange(ligne,c.PROD_SECONDE).setValue(row[c.PROD_SECONDE - 1]);
    }

    if (
      applique.result &&
      applique.result.materialsRequested
    ) {
      const courant = Math.max(0,nombreSorealIdle_(row[c.MATERIAUX - 1],0));
      feuille.getRange(ligne,c.MATERIAUX).setValue(
        Math.max(0,courant-applique.result.materialsRequested)
      );
    }

    feuille.getRange(ligne,c.STATS_JSON).setValue(JSON.stringify(stats));
    recalculerPuissanceCompleteSorealIdle_(feuille,ligne);
    feuille.getRange(ligne,c.DERNIERE_SYNCHRO).setValue(new Date());
    SpreadsheetApp.flush();

    return {
      ok:true,
      resultat:applique.result || {},
      joueur:ajouterCoutsEntrainementEtatSorealIdle_(
        construireEtatJoueurSorealIdle_(feuille,ligne,{
          gain:0,
          secondesComptabilisees:0,
          degats:0,
          bossBattus:0,
          xpGagnee:0,
          niveauxGagnes:0,
          dropsRecents:[]
        })
      )
    };
  } catch (erreur) {
    return {
      ok:false,
      code:'ERREUR_META_PROGRESSION',
      message:erreur&&erreur.message?String(erreur.message):'Action impossible.'
    };
  } finally {
    lock.releaseLock();
  }
}


/**
 * ============================================================
 * BOUTIQUE PERMANENTE
 * ============================================================
 */

function acheterAmeliorationSorealIdle(
  sessionToken,
  type
) {
  void sessionToken;
  void type;
  return {
    ok:false,
    code:'SOREAL_IDLE_V53_LEGACY_SHOP_DISABLED',
    message:'Cette ancienne boutique est désactivée. Utilise Spend EXP du moteur NGU.'
  };
}



/**
 * ============================================================
 * MAGIE / MANA
 * ============================================================
 */

function acheterSortsSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}


function acheterSortSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}


function lancerSortSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}


/**
 * ============================================================
 * RENAISSANCE
 * ============================================================
 */

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * `difficulte` (2e paramètre, optionnel) : wiki NGU, "at the bottom of the
 * rebirth screen, there is a choice of Normal, Evil difficulty or
 * Sadistic" -- le vrai jeu propose ce choix DANS le même clic Rebirth,
 * jamais une action séparée. Absent/omis = comportement strictement
 * inchangé (Rebirth normal, difficulté actuelle conservée).
 */
function renaitreSorealIdle(
  sessionToken,
  difficulte
) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(5000)) {
    return {
      ok:false,
      code:'SOREAL_IDLE_OCCUPE',
      retryable:true,
      message:'Le moteur termine encore une action.'
    };
  }

  try {
    const feuille = obtenirFeuilleJoueursSorealIdle_();
    const ligne = trouverLigneJoueurSorealIdle_(feuille,acces);
    initialiserModeleJoueurSorealIdleV41SiNecessaire_(feuille,ligne);
    appliquerProgressionEnergieSorealIdle_(feuille,ligne);

    const c = CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;
    const row = feuille.getRange(ligne,1,1,c.STATS_JSON).getValues()[0];
    const stats = statsJoueurSorealIdle_(row[c.STATS_JSON-1]);
    const collection = parserJsonSorealIdle_(row[c.COLLECTION_JSON-1],{});
    const contexte = contexteMetaNguSorealIdle_(row,stats,collection);
    const maintenant = Date.now();

    try {
      stats.metaNgu = rebirthIdleNguState(
        stats.metaNgu,
        contexte,
        maintenant,
        { difficulty: difficulte }
      );
    } catch (erreurRebirth) {
      const codeErreurRebirth = String(erreurRebirth && erreurRebirth.message || erreurRebirth);
      if (codeErreurRebirth === 'REBIRTH_TROP_TOT') {
        return {
          ok:false,
          code:'REBIRTH_TROP_TOT',
          message:'Un Rebirth demande au moins 3 minutes de run.',
          joueur:ajouterCoutsEntrainementEtatSorealIdle_(
            construireEtatJoueurSorealIdle_(feuille,ligne,null)
          )
        };
      }
      /*
       * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
       * Même traitement que REBIRTH_TROP_TOT ci-dessus : un choix de
       * difficulté non débloquée ne doit jamais planter la requête, juste
       * renvoyer un état joueur inchangé avec un code exploitable côté
       * client (cf. idleNguDifficultyUnlockRequirementsV1 pour savoir quelle
       * condition manque encore).
       */
      if (codeErreurRebirth === 'DIFFICULTE_VERROUILLEE') {
        return {
          ok:false,
          code:'DIFFICULTE_VERROUILLEE',
          message:'Les conditions de déblocage de cette difficulté ne sont pas encore réunies.',
          joueur:ajouterCoutsEntrainementEtatSorealIdle_(
            construireEtatJoueurSorealIdle_(feuille,ligne,null)
          )
        };
      }
      throw erreurRebirth;
    }

    /*
     * V186 — après chaque Rebirth, Adventure repart obligatoirement dans
     * la Safe Zone et n'engage AUCUN combat tout seul. La progression,
     * l'inventaire et les déblocages persistent ; seule la position/instance
     * de combat du run courant est remise au repos.
     */
    if(
      stats.metaNgu &&
      stats.metaNgu.adventure &&
      typeof stats.metaNgu.adventure==='object'
    ){
      stats.metaNgu.adventure.selectedZone='safe';
      stats.metaNgu.adventure.fight={
        active:false,
        zone:'',
        monsterHp:0,
        monsterHpMax:0,
        boss:false,
        playerHp:0,
        playerHpMax:0
      };
    }
    stats.autoAventure=false;
    stats.autoAventureZone=0;

    stats.bestiaireBossRunVersionV207=207;
    stats.bestiaireBossRunMaxNumeroV207=0;

    stats.entrainementBase = rebirthBasicTrainingStateV411(
      stats.entrainementBase,
      maintenant
    );
    stats.modeleJeuVersion = BASIC_TRAINING_V411.version;

    const boss = definitionBossSorealIdle_(0, stats.metaNgu && stats.metaNgu.difficulty);
    const energieDepart = Math.max(0,CONFIG_SOREAL_IDLE.ENERGIE_BASE);

    /*
     * Les anciennes colonnes Niveau/Renaissances restent uniquement comme
     * shim de stockage SQLite pendant le nettoyage du schéma. Elles ne sont
     * plus une mécanique de progression et ne produisent aucun bonus.
     */
    feuille.getRange(ligne,c.NIVEAU).setValue(1);
    feuille.getRange(ligne,c.XP).setValue(0);
    feuille.getRange(ligne,c.ENERGIE).setValue(energieDepart);
    feuille.getRange(ligne,c.BOSS_ACTUEL).setValue(boss.nom);
    feuille.getRange(ligne,c.BOSS_PV).setValue(boss.pv);
    feuille.getRange(ligne,c.BOSS_PV_MAX).setValue(boss.pv);
    feuille.getRange(ligne,c.BOSS_VAINCUS).setValue(0);
    feuille.getRange(ligne,c.RENAISSANCES).setValue(
      Math.max(0,nombreSorealIdle_(stats.metaNgu && stats.metaNgu.records && stats.metaNgu.records.totalRebirths,0))
    );
    feuille.getRange(ligne,c.ESSENCE_RENAISSANCE).setValue(0);
    feuille.getRange(ligne,c.KO_JUSQUA).clearContent();
    feuille.getRange(ligne,c.DERNIERE_SYNCHRO).setValue(new Date(maintenant));
    feuille.getRange(ligne,c.STATS_JSON).setValue(JSON.stringify(stats));

    /*
     * Correctif 2026-09-14 (Norman : "quand on rebirth, la barre energie
     * tique toujours 1 fois par seconde. Dans NGU, quand on rebirth, elle
     * tique de plus en plus vite") — la vraie Energy Speed/Bars NGU
     * (state.metaNgu.resources.energy) survit bien à un Rebirth (seul le
     * point courant se remet à 0, jamais la vitesse achetée avec l'EXP —
     * confirmé wiki NGU, page Energy). Mais la colonne héritée PROD_SECONDE
     * (utilisée par le client pour animer la vitesse RÉELLE de la barre,
     * cf. metaTickEnergieSorealIdle_ ci-dessus) n'était jamais recalculée
     * ni réécrite ici après un Rebirth — contrairement à agirProgressionSorealIdle
     * (le chemin générique des autres actions NGU), qui le fait déjà à
     * chaque appel. Elle restait donc figée à sa valeur d'AVANT le
     * Rebirth, faisant croire que la vitesse retombait à 1 tick/seconde à
     * chaque Renaissance alors que la vraie vitesse achetée était intacte.
     * energieMax était logé au même défaut (ENERGIE_BASE fixe, jamais le
     * vrai cap NGU qui grandit naturellement à chaque Rebirth — voir
     * applyNaturalEnergyCapGrowthOnRebirth, idle-ngu-progression.js).
     */
    const energieMetaApresRenaissance=stats.metaNgu.resources&&stats.metaNgu.resources.energy
      ?stats.metaNgu.resources.energy
      :null;
    if(energieMetaApresRenaissance){
      const energieMaxApresRenaissance=Math.max(0,nombreSorealIdle_(energieMetaApresRenaissance.cap,0))||energieDepart;
      feuille.getRange(ligne,c.ENERGIE_MAX).setValue(energieMaxApresRenaissance);
      feuille.getRange(ligne,c.PROD_SECONDE).setValue(
        Math.max(0,idleNguResourceGenerationPerSecond(stats.metaNgu,"energy"))
      );
    }

    recalculerPuissanceCompleteSorealIdle_(feuille,ligne);
    const pvMax = Math.max(1,nombreSorealIdle_(feuille.getRange(ligne,c.PV_JOUEUR_MAX).getValue(),1));
    feuille.getRange(ligne,c.PV_JOUEUR).setValue(pvMax);
    SpreadsheetApp.flush();

    const joueur = ajouterCoutsEntrainementEtatSorealIdle_(
      construireEtatJoueurSorealIdle_(
        feuille,
        ligne,
        {
          gain:0,
          secondesComptabilisees:0,
          degats:0,
          degatsRecus:0,
          koSubis:0,
          bossBattus:0,
          xpGagnee:0,
          niveauxGagnes:0,
          dropsRecents:[]
        }
      )
    );

    return {
      ok:true,
      number:stats.metaNgu && stats.metaNgu.rebirth ? stats.metaNgu.rebirth.number : 1,
      nextNumber:stats.metaNgu && stats.metaNgu.rebirth ? stats.metaNgu.rebirth.nextNumber : 1,
      joueur:joueur
    };
  } catch (erreur) {
    return {
      ok:false,
      code:'ERREUR_REBIRTH_V47',
      message:erreur && erreur.message ? String(erreur.message) : 'Erreur pendant le Rebirth.'
    };
  } finally {
    lock.releaseLock();
  }
}



function recyclerObjetSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}


function recyclerObjetsSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}


function fusionnerObjetSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}



function ameliorerEquipementForgeSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}


function agrandirInventaireSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}


/**
 * ============================================================
 * MODE AVENTURE SOREAL
 * ============================================================
 */


function definirCombatAutoAventureSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}


/*
 * Audit 2026-09-17 : selectionnerZoneAventureSorealIdle (stub mort
 * renvoyant SOREAL_IDLE_V47_LEGACY_DISABLED, jamais un mécanisme réel)
 * retiré entièrement plutôt que laissé en stub. Vérifié avant suppression
 * qu'aucun consommateur réel ne subsistait : le seul appelant client
 * (runner.selectionnerZoneAventureSorealIdle, google.script.run) avait
 * déjà été retiré de Soreal_Idle_UI.html le 2026-09-16 (cf.
 * idle-collection-menu-and-dead-zone-case.test.mjs côté SOREAL-APP) — la
 * vraie sélection de zone Aventure passe depuis par
 * __selectionnerZoneAdventureIdleV47__ (idle-adventure-v47.js). Seule
 * référence restante trouvée : cloudflare/public/cloudflare-bridge.js
 * (SOREAL-APP) expose encore un passe-plat générique portant ce nom, mais
 * ce fichier mirrore SYMÉTRIQUEMENT chaque nom d'opération connu (y
 * compris d'autres mécaniques déjà mortes comme equiperObjetsSorealIdle)
 * sans jamais l'appeler lui-même — un appel réel via ce passe-plat
 * échouerait désormais avec SOREAL_IDLE_OPERATION_INCONNUE au lieu de
 * SOREAL_IDLE_V47_LEGACY_DISABLED, un changement de message sans risque
 * puisqu'aucun code n'invoque ce passe-plat.
 */


function combattreAventureSorealIdle(...args) {
  void args;
  return {
    ok:false,
    code:'SOREAL_IDLE_V47_LEGACY_DISABLED',
    message:'Cette ancienne mécanique est désactivée. SOREAL IDLE utilise maintenant le moteur NGU V47.'
  };
}


/**
 * ============================================================
 * SOREAL IDLE — DATA ACCESS V19
 * Fichier Apps Script : Soreal_Idle_Data.gs
 * Source GitHub : Soreal_Idle_Data.js
 * ============================================================
 *
 * V19 :
 * - lecture en bloc + cache Google Sheets conservée ;
 * - cache mémoire court ajouté pour éviter plusieurs JSON.parse /
 *   CacheService.get de la même table dans une seule exécution ;
 * - CONFIG préparé une seule fois puis réutilisé ;
 * - paramètres constants sortis des boucles de zones ;
 * - cache d'index des images d'aventure correctement invalidé ;
 * - recherche de boss par nom mémorisée brièvement ;
 * - API publique/interne existante conservée.
 * ============================================================
 */


/* ============================================================
   MÉMOIRES COURTES
   ============================================================ */

var __SOREAL_IDLE_TABLE_MEMO_V19__ =
  typeof __SOREAL_IDLE_TABLE_MEMO_V19__ !== 'undefined'
    ? __SOREAL_IDLE_TABLE_MEMO_V19__
    : {};

var __SOREAL_IDLE_PARAMS_MEMO_V19__ =
  typeof __SOREAL_IDLE_PARAMS_MEMO_V19__ !== 'undefined'
    ? __SOREAL_IDLE_PARAMS_MEMO_V19__
    : null;

var __SOREAL_IDLE_PARAMS_MEMO_TS_V19__ =
  typeof __SOREAL_IDLE_PARAMS_MEMO_TS_V19__ !== 'undefined'
    ? __SOREAL_IDLE_PARAMS_MEMO_TS_V19__
    : 0;

var __SOREAL_IDLE_BOSS_IMAGES_MEMO_V19__ =
  typeof __SOREAL_IDLE_BOSS_IMAGES_MEMO_V19__ !== 'undefined'
    ? __SOREAL_IDLE_BOSS_IMAGES_MEMO_V19__
    : {};

var __SOREAL_IDLE_MEMO_MS_V19__ = 5 * 60 * 1000;
var __SOREAL_IDLE_CACHE_SEC_V19__ = 300;


function memoTableSorealIdleV19_(nom) {
  const cle = String(nom || '');
  const item = __SOREAL_IDLE_TABLE_MEMO_V19__[cle];

  if (
    !item ||
    !item.ts ||
    Date.now() - item.ts > __SOREAL_IDLE_MEMO_MS_V19__
  ) {
    return null;
  }

  return Array.isArray(item.data)
    ? item.data
    : null;
}


function memoriserTableSorealIdleV19_(nom, data) {
  __SOREAL_IDLE_TABLE_MEMO_V19__[
    String(nom || '')
  ] = {
    ts: Date.now(),
    data: Array.isArray(data) ? data : []
  };

  return __SOREAL_IDLE_TABLE_MEMO_V19__[
    String(nom || '')
  ].data;
}


/* ============================================================
   TABLES GOOGLE SHEETS
   ============================================================ */

function lireTableSorealIdle_(nomFeuille) {
  const nom = String(nomFeuille || '').trim();

  if (!nom) {
    return [];
  }

  const memo = memoTableSorealIdleV19_(nom);

  if (memo) {
    return memo;
  }

  const cleCache =
    'SOREAL_IDLE_TABLE_V18_' + nom;

  const cache =
    CacheService.getScriptCache();

  const enCache =
    cache.get(cleCache);

  if (enCache) {
    try {
      const parsed = JSON.parse(enCache);

      if (Array.isArray(parsed)) {
        return memoriserTableSorealIdleV19_(
          nom,
          parsed
        );
      }
    } catch (e) {}
  }

  const ss =
    obtenirSpreadsheetSorealIdle_();

  const feuille =
    ss.getSheetByName(nom);

  if (!feuille) {
    return memoriserTableSorealIdleV19_(
      nom,
      []
    );
  }

  const lastRow =
    feuille.getLastRow();

  const lastColumn =
    feuille.getLastColumn();

  if (
    lastRow < 2 ||
    lastColumn < 1
  ) {
    return memoriserTableSorealIdleV19_(
      nom,
      []
    );
  }

  const valeurs =
    feuille
      .getRange(
        1,
        1,
        lastRow,
        lastColumn
      )
      .getValues();

  const entetes =
    valeurs[0]
      .map(function(v) {
        return String(v || '').trim();
      });

  const lignes = [];

  for (
    let r = 1;
    r < valeurs.length;
    r += 1
  ) {
    const ligne = {};
    let vide = true;

    for (
      let c = 0;
      c < entetes.length;
      c += 1
    ) {
      const entete = entetes[c];

      if (!entete) {
        continue;
      }

      const valeur =
        valeurs[r][c];

      if (
        valeur !== '' &&
        valeur !== null
      ) {
        vide = false;
      }

      ligne[entete] = valeur;
    }

    if (!vide) {
      lignes.push(ligne);
    }
  }

  try {
    cache.put(
      cleCache,
      JSON.stringify(lignes),
      __SOREAL_IDLE_CACHE_SEC_V19__
    );
  } catch (e) {
    /*
     * CacheService refuse notamment les valeurs trop volumineuses.
     * La donnée lue reste utilisable dans l'exécution en cours.
     */
  }

  return memoriserTableSorealIdleV19_(
    nom,
    lignes
  );
}


function viderCacheDonneesSorealIdle_() {
  const cache =
    CacheService.getScriptCache();

  [
    'IDLE_BOSS',
    'IDLE_ZONES',
    'IDLE_LOOTS',
    'IDLE_SETS',
    'IDLE_COLLECTIONS',
    'IDLE_REPOS',
    'IDLE_APPARENCES',
    'IDLE_RARETES',
    'IDLE_DEBLOCAGES',
    'IDLE_BOUTIQUE',
    'IDLE_SORTS',
    'CONFIG'
  ].forEach(function(nom) {
    cache.remove(
      'SOREAL_IDLE_TABLE_V18_' + nom
    );
  });

  /*
   * V18 oubliait cet index Drive.
   */
  cache.remove(
    'SOREAL_IDLE_AVENTURE_IMAGES_V18'
  );

  /*
   * Cache des recherches de boss par nom ajouté en V19.
   */
  try {
    cache.removeAll(
      Object.keys(
        __SOREAL_IDLE_BOSS_IMAGES_MEMO_V19__
      ).map(function(cle) {
        return (
          'SOREAL_IDLE_BOSS_IMAGE_V19_' +
          cle
        );
      })
    );
  } catch (e) {}

  __SOREAL_IDLE_TABLE_MEMO_V19__ = {};
  __SOREAL_IDLE_PARAMS_MEMO_V19__ = null;
  __SOREAL_IDLE_PARAMS_MEMO_TS_V19__ = 0;
  __SOREAL_IDLE_BOSS_IMAGES_MEMO_V19__ = {};
}


/* ============================================================
   CONFIG
   ============================================================ */

function parametresSorealIdle_() {
  if (
    __SOREAL_IDLE_PARAMS_MEMO_V19__ &&
    __SOREAL_IDLE_PARAMS_MEMO_TS_V19__ &&
    Date.now() -
      __SOREAL_IDLE_PARAMS_MEMO_TS_V19__ <=
      __SOREAL_IDLE_MEMO_MS_V19__
  ) {
    return __SOREAL_IDLE_PARAMS_MEMO_V19__;
  }

  const lignes =
    lireTableSorealIdle_(
      'CONFIG'
    );

  const resultat = {};

  lignes.forEach(function(ligne) {
    const cle =
      String(
        ligne['Paramètre'] ||
        ligne.Parametre ||
        ligne.parametre ||
        ligne['PARAMÈTRE'] ||
        ligne.Nom ||
        ligne.nom ||
        ''
      )
        .trim()
        .toUpperCase();

    if (!cle) {
      return;
    }

    resultat[cle] =
      ligne.Valeur !== undefined
        ? ligne.Valeur
        : ligne.valeur;
  });

  __SOREAL_IDLE_PARAMS_MEMO_V19__ =
    resultat;

  __SOREAL_IDLE_PARAMS_MEMO_TS_V19__ =
    Date.now();

  return resultat;
}


function parametreSorealIdle_(cle, defaut) {
  const params =
    parametresSorealIdle_();

  const valeur =
    params[
      String(cle || '')
        .trim()
        .toUpperCase()
    ];

  if (
    valeur === undefined ||
    valeur === null ||
    valeur === ''
  ) {
    return defaut;
  }

  return valeur;
}


function banniereSorealIdleDriveFileId_() {
  return String(
    parametreSorealIdle_(
      'BANNIERE_SOREAL_IDLE_DRIVE_ID',
      '1omNowtqq_YjUQitljdBXbLK9VZ0oJ7qb'
    )
  ).trim();
}


/* ============================================================
   BOSS
   ============================================================ */

function bossCatalogueSorealIdle_() {
  return lireTableSorealIdle_(
    'IDLE_BOSS'
  )
    .filter(function(ligne) {
      return (
        String(
          ligne.Actif
        ).toLowerCase() !== 'false'
      );
    })
    .map(function(ligne, index) {
      // Systeme de capacites (regen/bouclier/paralysie/fureur/fracas/sceau)
      // retire : mecanique 100% SOREAL sans equivalent NGU, remplacee par
      // la resolution Attaque-vs-Defense pure documentee sur le wiki.
      const capacites = [];

      return {
        id:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.ID,
                index + 1
              )
            )
          ),

        nom:
          String(
            ligne.Nom || 'Boss'
          ),

        pv:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.PV,
                500
              )
            )
          ),

        attaque:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.Attaque,
                2
              )
            )
          ),

        /*
         * 2026-09-17 — ce plancher de 1 forçait un minimum de 1 XP même
         * pour un boss dont le XP réel (repeat-kill) est 0 (wiki : boss
         * 1/2/3/5/6 du catalogue). equilibrerBossPrincipalSorealIdleV413_
         * rend maintenant le XP autoritaire depuis la référence sourcée
         * (ce champ brut ne sert donc plus qu'à un éventuel accès direct
         * hors combat), mais gardait quand même ce plancher inexact.
         */
        xp:
          Math.max(
            0,
            Math.round(
              nombreSorealIdle_(
                ligne.XP,
                25
              )
            )
          ),

        pieces:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.Pieces,
                5
              )
            )
          ),

        chanceLoot:
          Math.max(
            0,
            Math.min(
              1,
              nombreSorealIdle_(
                ligne.ChanceLoot,
                0.45
              )
            )
          ),

        image:
          String(
            ligne.Image || ''
          ).trim(),

        driveFileId:
          String(
            ligne.DriveFileID || ''
          ).trim(),

        histoire:
          index===3
            ?"Alors que tu te tournes vers la sortie de cette 'pièce', tu remarques une petite souris marron. D'une voix stridente, elle couine : BIENVENUE dans SOREAL IDLE ! Moi c'est Tippy... Si t'es prê-' Sa petite voix de merde, te donne envie de lui péter la gueule... le besoin de vaincre CHAQUE ennemi sur ton chemin, quoi qu'il arrive. Tu peux commencer avec cette souris et arracher sa tête de con."
            :String(
                ligne.Histoire || ''
              ).trim(),

        mortVivant:
          ligne.MortVivant === true ||
          String(
            ligne.MortVivant || ''
          )
            .trim()
            .toLowerCase() === 'true',

        conseil:
          String(
            ligne.Conseil || ''
          ).trim(),

        niveauRequis:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.NiveauRequis,
                index + 1
              )
            )
          ),

        capacites:
          capacites,

        bossCible:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.BossCible,
                index + 1
              )
            )
          )
      };
    })
    .sort(function(a, b) {
      return a.id - b.id;
    });
}


/* ============================================================
   AVENTURE / ZONES
   ============================================================ */

function indexImagesAventureSorealIdle_() {
  const cache =
    CacheService.getScriptCache();

  const cle =
    'SOREAL_IDLE_AVENTURE_IMAGES_V18';

  const brut =
    cache.get(cle);

  if (brut) {
    try {
      const parsed =
        JSON.parse(brut);

      if (
        parsed &&
        typeof parsed === 'object'
      ) {
        return parsed;
      }
    } catch (e) {}
  }

  const resultat = {};

  const dossierId =
    String(
      parametreSorealIdle_(
        'DOSSIER_AVENTURE_DRIVE_ID',
        '1D75f90EEsGxNALcnBmKPvWobJC9QMIFc'
      ) || ''
    ).trim();

  if (dossierId) {
    try {
      const fichiers =
        DriveApp
          .getFolderById(
            dossierId
          )
          .getFiles();

      while (
        fichiers.hasNext()
      ) {
        const f =
          fichiers.next();

        resultat[
          String(
            f.getName() || ''
          )
            .trim()
            .toLowerCase()
        ] = f.getId();
      }
    } catch (e) {}
  }

  try {
    cache.put(
      cle,
      JSON.stringify(resultat),
      __SOREAL_IDLE_CACHE_SEC_V19__
    );
  } catch (e) {}

  return resultat;
}


function zonesTableSorealIdle_() {
  const indexImages =
    indexImagesAventureSorealIdle_();

  const zonesParMonde =
    Math.max(
      1,
      Math.floor(
        nombreSorealIdle_(
          parametreSorealIdle_(
            'AVENTURE_ZONES_PAR_MONDE',
            6
          ),
          6
        )
      )
    );

  return lireTableSorealIdle_(
    'IDLE_ZONES'
  )
    .filter(function(ligne) {
      return (
        String(
          ligne.Actif
        ).toLowerCase() !== 'false'
      );
    })
    .map(function(ligne, index) {
      const imageName =
        String(
          ligne.ImageName ||
          ligne.Image ||
          ''
        ).trim();

      const idDirect =
        String(
          ligne.DriveFileID || ''
        ).trim();

      const idParNom =
        imageName
          ? String(
              indexImages[
                imageName.toLowerCase()
              ] || ''
            )
          : '';

      return {
        id:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.ID,
                index + 1
              )
            )
          ),

        monde:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.Monde,
                Math.floor(
                  index /
                  zonesParMonde
                ) + 1
              )
            )
          ),

        nom:
          String(
            ligne.Nom || 'Zone'
          ),

        emoji:
          String(
            ligne.Emoji || '🗺️'
          ),

        description:
          String(
            ligne.Description || ''
          ),

        ennemi:
          String(
            ligne.Ennemi || 'Ennemi'
          ),

        boss:
          String(
            ligne.Boss || 'Boss'
          ),

        niveauRequis:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.NiveauRequis,
                1
              )
            )
          ),

        puissanceRecommandee:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.PuissanceRecommandee,
                1
              )
            )
          ),

        coutEntree:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.CoutEntree,
                30
              )
            )
          ),

        pvEnnemi:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.PVEnnemi,
                120
              )
            )
          ),

        attaqueEnnemi:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.AttaqueEnnemi,
                3
              )
            )
          ),

        pvBoss:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.PVBoss,
                384
              )
            )
          ),

        attaqueBoss:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.AttaqueBoss,
                5
              )
            )
          ),

        points:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.Points,
                2
              )
            )
          ),

        pieces:
          Math.max(
            1,
            Math.round(
              nombreSorealIdle_(
                ligne.Pieces,
                4
              )
            )
          ),

        image:
          String(
            ligne.Image || ''
          ).trim(),

        imageName:
          imageName,

        driveFileId:
          idDirect || idParNom
      };
    })
    .sort(function(a, b) {
      return a.id - b.id;
    });
}


/* ============================================================
   SORTS
   ============================================================ */

function sortsSorealIdle_() {
  return lireTableSorealIdle_(
    'IDLE_SORTS'
  )
    .filter(function(ligne) {
      return (
        String(
          ligne.Actif
        ).toLowerCase() !== 'false'
      );
    })
    .map(function(ligne) {
      return {
        id:
          String(
            ligne.ID || ''
          ).trim(),

        nom:
          String(
            ligne.Nom || 'Sort'
          ).trim(),

        emoji:
          String(
            ligne.Emoji || '✨'
          ).trim(),

        description:
          String(
            ligne.Description || ''
          ).trim(),

        niveauRequis:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.NiveauRequis,
                1
              )
            )
          ),

        coutPieces:
          Math.max(
            0,
            Math.round(
              nombreSorealIdle_(
                ligne.CoutPieces,
                0
              )
            )
          ),

        coutMana:
          Math.max(
            0,
            nombreSorealIdle_(
              ligne.CoutMana,
              0
            )
          ),

        cooldownSec:
          Math.max(
            0,
            nombreSorealIdle_(
              ligne.CooldownSec,
              0
            )
          ),

        type:
          String(
            ligne.Type || ''
          )
            .trim()
            .toLowerCase(),

        valeur:
          Math.max(
            0,
            nombreSorealIdle_(
              ligne.Valeur,
              0
            )
          ),

        valeurSecondaire:
          Math.max(
            0,
            nombreSorealIdle_(
              ligne.ValeurSecondaire,
              0
            )
          ),

        duree:
          Math.max(
            0,
            nombreSorealIdle_(
              ligne.Duree,
              0
            )
          ),

        cibles:
          String(
            ligne.Cible || ''
          )
            .split(',')
            .map(function(v) {
              return String(v || '')
                .trim()
                .toLowerCase();
            })
            .filter(Boolean),

        effetMortVivant:
          String(
            ligne.EffetMortVivant || ''
          )
            .trim()
            .toLowerCase()
      };
    })
    .filter(function(sort) {
      return Boolean(sort.id);
    });
}


/* ============================================================
   RARETÉS / LOOTS / SETS / COLLECTIONS
   ============================================================ */

function lootsSorealIdle_() {
  return lireTableSorealIdle_(
    'IDLE_LOOTS'
  )
    .filter(function(ligne) {
      return (
        String(
          ligne.Actif
        ).toLowerCase() !== 'false'
      );
    })
    .map(function(ligne, index) {
      return {
        id:
          String(
            ligne.ID ||
            (
              'loot_' +
              (index + 1)
            )
          ),

        slot:
          String(
            ligne.Slot || ''
          ),

        nom:
          String(
            ligne.Nom || 'Objet'
          ),

        zoneId:
          Math.max(
            0,
            Math.floor(
              nombreSorealIdle_(
                ligne.ZoneID,
                0
              )
            )
          ),

        boss:
          String(
            ligne.Boss || ''
          ).trim(),

        poids:
          Math.max(
            0.01,
            nombreSorealIdle_(
              ligne.Poids,
              1
            )
          ),

        chanceDrop:
          Math.max(
            0,
            Math.min(
              1,
              nombreSorealIdle_(
                ligne.ChanceDrop,
                1
              )
            )
          ),

        basePuissance:
          Math.max(
            1,
            nombreSorealIdle_(
              ligne.BasePuissance,
              3
            )
          ),

        setId:
          String(
            ligne.SetID || ''
          ).trim(),

        image:
          String(
            ligne.Image || ''
          ).trim()
      };
    });
}


function setsSorealIdle_() {
  return lireTableSorealIdle_(
    'IDLE_SETS'
  )
    .filter(function(ligne) {
      return (
        String(
          ligne.Actif
        ).toLowerCase() !== 'false'
      );
    })
    .map(function(ligne, index) {
      return {
        id:
          String(
            ligne.ID ||
            (
              'set_' +
              (index + 1)
            )
          ).trim(),

        nom:
          String(
            ligne.Nom || 'Set'
          ),

        zoneId:
          Math.max(
            0,
            Math.floor(
              nombreSorealIdle_(
                ligne.ZoneID,
                0
              )
            )
          ),

        pieces2:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.Pieces2,
                2
              )
            )
          ),

        bonus2Pct:
          Math.max(
            0,
            nombreSorealIdle_(
              ligne.Bonus2Pct,
              5
            )
          ),

        pieces4:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.Pieces4,
                4
              )
            )
          ),

        bonus4Pct:
          Math.max(
            0,
            nombreSorealIdle_(
              ligne.Bonus4Pct,
              12
            )
          ),

        pieces6:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.Pieces6,
                6
              )
            )
          ),

        bonus6Pct:
          Math.max(
            0,
            nombreSorealIdle_(
              ligne.Bonus6Pct,
              30
            )
          ),

        apparence:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.Apparence,
                1
              )
            )
          ),

        description:
          String(
            ligne.Description || ''
          )
      };
    });
}


function setParIdSorealIdle_(setId) {
  const id =
    String(setId || '');

  if (!id) {
    return null;
  }

  const sets =
    setsSorealIdle_();

  for (
    let i = 0;
    i < sets.length;
    i += 1
  ) {
    if (
      sets[i].id === id
    ) {
      return sets[i];
    }
  }

  return null;
}


function collectionsSorealIdle_() {
  return lireTableSorealIdle_(
    'IDLE_COLLECTIONS'
  )
    .filter(function(ligne) {
      return (
        String(
          ligne.Actif
        ).toLowerCase() !== 'false'
      );
    })
    .map(function(ligne, index) {
      return {
        id:
          String(
            ligne.ID ||
            (
              'collection_' +
              (index + 1)
            )
          ).trim(),

        zoneId:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.ZoneID,
                index + 1
              )
            )
          ),

        nom:
          String(
            ligne.Nom ||
            (
              'Collection zone ' +
              (index + 1)
            )
          ),

        bonusPuissancePct:
          Math.max(
            0,
            nombreSorealIdle_(
              ligne.BonusPuissancePct,
              0
            )
          ),

        description:
          String(
            ligne.Description || ''
          )
      };
    })
    .sort(function(a, b) {
      return a.zoneId - b.zoneId;
    });
}


/* ============================================================
   REPOS / APPARENCES
   ============================================================ */

function reposSorealIdle_() {
  return lireTableSorealIdle_(
    'IDLE_REPOS'
  )
    .filter(function(ligne) {
      return (
        String(
          ligne.Actif
        ).toLowerCase() !== 'false'
      );
    })
    .map(function(ligne, index) {
      return {
        id:
          String(
            ligne.ID ||
            (
              'BEDROOM_' +
              (index + 1)
            )
          ),

        nom:
          String(
            ligne.Nom ||
            'Salle de repos'
          ),

        numero:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.Numero,
                index + 1
              )
            )
          ),

        regenPctSec:
          Math.max(
            0,
            nombreSorealIdle_(
              ligne.RegenPctSec,
              2.5
            )
          ),

        niveauRequis:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.NiveauRequis,
                1
              )
            )
          ),

        image:
          String(
            ligne.Image ||
            (
              'Bedroom_' +
              (index + 1) +
              '.png'
            )
          ),

        driveFileId:
          String(
            ligne.DriveFileID || ''
          ).trim()
      };
    })
    .sort(function(a, b) {
      return a.numero - b.numero;
    });
}


function apparencesSorealIdle_() {
  return lireTableSorealIdle_(
    'IDLE_APPARENCES'
  )
    .filter(function(ligne) {
      return (
        String(
          ligne.Actif
        ).toLowerCase() !== 'false'
      );
    })
    .map(function(ligne, index) {
      return {
        id:
          String(
            ligne.ID ||
            (
              'PLAYER_' +
              (index + 1)
            )
          ),

        nom:
          String(
            ligne.Nom || 'Apparence'
          ),

        numero:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.Numero,
                index + 1
              )
            )
          ),

        setIdRequis:
          String(
            ligne.SetIDRequis || ''
          ).trim(),

        image:
          String(
            ligne.Image ||
            (
              'Player_' +
              (index + 1) +
              '.png'
            )
          ),

        driveFileId:
          String(
            ligne.DriveFileID || ''
          ).trim()
      };
    })
    .sort(function(a, b) {
      return a.numero - b.numero;
    });
}


/*
 * Audit 2026-09-17 (grand nettoyage) : imageDriveParIdSorealIdle_,
 * imageFichierDriveSorealIdle_, imageReposParNumeroSorealIdle_ et
 * imageJoueurParNumeroSorealIdle_ (bloc "IMAGES DRIVE") n'avaient plus
 * qu'un seul appelant chacun, en cascade jusqu'aux RPC obtenirImage*
 * déjà retirées plus haut -- toutes backées par DriveApp, jamais
 * fonctionnel dans cet environnement Cloudflare Workers. Supprimées.
 */


/* ============================================================
   BOUTIQUE / DÉBLOCAGES
   ============================================================ */

function boutiqueConfigSorealIdle_(type) {
  const lignes =
    lireTableSorealIdle_(
      'IDLE_BOUTIQUE'
    );

  const cle =
    String(type || '');

  for (
    let i = 0;
    i < lignes.length;
    i += 1
  ) {
    if (
      String(
        lignes[i].Type || ''
      ) === cle
    ) {
      return {
        base:
          Math.max(
            1,
            nombreSorealIdle_(
              lignes[i].CoutBase,
              20
            )
          ),

        croissance:
          Math.max(
            1,
            nombreSorealIdle_(
              lignes[i].Croissance,
              1.6
            )
          ),

        bonusParNiveau:
          nombreSorealIdle_(
            lignes[i].BonusParNiveau,
            1
          )
      };
    }
  }

  return null;
}


function deblocagesSorealIdle_() {
  const resultat = {};

  lireTableSorealIdle_(
    'IDLE_DEBLOCAGES'
  )
    .filter(function(ligne) {
      return (
        String(
          ligne.Actif
        ).toLowerCase() !== 'false'
      );
    })
    .forEach(function(ligne) {
      const id =
        String(
          ligne.ID || ''
        ).trim();

      if (!id) {
        return;
      }

      resultat[id] = {
        niveau:
          Math.max(
            1,
            Math.floor(
              nombreSorealIdle_(
                ligne.Niveau,
                1
              )
            )
          ),

        nom:
          String(
            ligne.Nom || id
          )
      };
    });

  resultat.aventure =
    Object.assign(
      {},
      resultat.aventure || {
        nom: 'Aventure'
      },
      {
        niveau: 1
      }
    );

  return resultat;
}



const IDLE_OPERATIONS={
  agirProgressionSorealIdle,
  definirAllocationsEntrainementSorealIdle,
  acheterAmeliorationSorealIdle,
  acheterAmeliorationsSorealIdle,
  acheterEntrainementSorealIdle,
  acheterEntrainementsSorealIdle,
  acheterSortSorealIdle,
  acheterSortsSorealIdle,
  agrandirInventairePlusieursSorealIdle,
  agrandirInventaireSorealIdle,
  ameliorerEquipementForgeSorealIdle,
  ameliorerEquipementsForgeSorealIdle,
  combattreAventureSorealIdle,
  definirAutoBossSuivantSorealIdle,
  definirCombatAutoAventureSorealIdle,
  definirCombatBossSorealIdle,
  estAdminSorealIdle,
  equiperObjetsSorealIdle,
  fusionnerObjetSorealIdle,
  fusionnerObjetsSorealIdle,
  lancerSortSorealIdle,
  nukerBossSorealIdle,
  obtenirAccesSorealIdle,
  obtenirEtatBoutiqueSorealIdle,
  obtenirEtatSorealIdle,
  recyclerObjetSorealIdle,
  recyclerObjetsSorealIdle,
  reinitialiserCompteCompletSorealIdle,
  reinitialiserTousLesComptesSorealIdle,
  renaitreSorealIdle,
  sauvegarderDispositionInventaireSorealIdle,
  selectionnerBossSorealIdle,
  synchroniserSorealIdle,
  testerAccesSorealIdle
};

export function idleOperationNames(){
  return Object.keys(IDLE_OPERATIONS);
}

export const idleRuntimeTestHooks=Object.freeze({
  CONFIG_SOREAL_IDLE,
  IDLE_PROTOCOL_VERSION,
  IDLE_NGU_META_VERSION,
  normalizeIdleNguState,
  syncIdleNguState,
  idleNguBonuses,
  idleNguSnapshot,
  applyIdleNguAction,
  rebirthIdleNguState,
  BASIC_TRAINING_V411,
  createBasicTrainingStateV411,
  normalizeBasicTrainingStateV411,
  advanceBasicTrainingStateV411,
  rebirthBasicTrainingStateV411,
  nextBasicTrainingCapV411,
  deriveBasicTrainingStatsV411,
  applyBasicTrainingAllocationsV411,
  basicTrainingSnapshotV411,
  metaTickEnergieSorealIdle_,
  calculerTicksEnergieSorealIdle_,
  creerSimulateurEnergieHorsLigneSorealIdle_,
  emailsAutorisesSorealIdle_,
  __idleCanonicalSheetNameV1,
  nombreSorealIdle_,
  dateSorealIdle_,
  __idleRestoreCatalogFromLegacyV2,
  equilibrerBossPrincipalSorealIdleV413_,
  definitionBossSorealIdle_,
  contexteMetaNguSorealIdle_,
  degatsRecusSecondeSorealIdle_,
  xpBossSorealIdle_,
  highestBossJamaisAtteintSorealIdle_,
  xpBonusPremiereFoisSorealIdle_,
  enregistrerBossJamaisVaincuSorealIdle_,
  attaqueBossSorealIdle_,
  defenseBossSorealIdle_,
  pvMaxBossSorealIdle_,
  regenPvIntegreeBasicTrainingSorealIdleV176_
});

/*
 * Drapeau mémoire (2026-09-18, perf) — voir le commentaire dans
 * runSorealIdleOperation() juste en dessous : la réparation/restauration
 * legacy des feuilles de catalogue ne fait jamais rien d'utile une fois la
 * migration confirmée terminée. Scopé à l'isolate (jamais persistant), donc
 * toujours ré-exécuté au moins une fois après chaque redémarrage à froid.
 */
let __idleLegacyRepairDoneV1=false;

export function runSorealIdleOperation(sql,operation,args,user){
  const op=String(operation||"");
  const fn=IDLE_OPERATIONS[op];
  if(typeof fn!=="function")throw new Error("SOREAL_IDLE_OPERATION_INCONNUE");

  /*
   * L'autorisation d'afficher le lanceur ne dépend jamais de l'état des
   * données du jeu. Elle dépend uniquement de la session SOREAL et de
   * l'allowlist. Cela évite qu'une migration/catalogue incomplet masque
   * le bouton IDLE dans APP et TV.
   */
  if(op==="obtenirAccesSorealIdle"||op==="testerAccesSorealIdle"){
    __idleRuntimeUser=user||null;
    __idleWorkbook=null;
    try{
      return fn.apply(null,Array.isArray(args)?args:[]);
    }finally{
      __idleRuntimeUser=null;
      __idleWorkbook=null;
    }
  }

  const sourceState=sqlRows(sql.exec(
    "SELECT COUNT(*) AS total,SUM(CASE WHEN status='DONE' THEN 1 ELSE 0 END) AS done "+
    "FROM migration_sources WHERE source_key LIKE 'idle:%'"
  ))[0]||{};
  if(Number(sourceState.total||0)<15||Number(sourceState.done||0)!==Number(sourceState.total||0)){
    throw new Error("SOREAL_IDLE_MIGRATION_INCOMPLETE");
  }

  /*
   * Les premières migrations IDLE ont stocké les noms techniques en
   * minuscules (joueurs, config, boss...) alors que le moteur attend les
   * noms réels des feuilles (JOUEURS, CONFIG, IDLE_BOSS...). On répare
   * ces clés de façon idempotente avant de reconstruire le workbook.
   *
   * Perf (2026-09-18, Norman : "le menu Paramètres est lent") — mesuré en
   * direct : chaque /api/idle/call prenait 830ms à 2,2s. Cause confirmée :
   * ces deux passes de réparation tournaient AVANT CHAQUE opération, sans
   * exception, alors qu'elles ne font jamais rien d'utile une fois la
   * migration terminée — chacune exécute jusqu'à 15 requêtes SQL (une par
   * feuille canonique) rien que pour constater qu'il n'y a rien à réparer.
   * Le check ci-dessus (sourceState.total/done) confirme déjà que la
   * migration des 15 sources est complète — une fois vrai, ça ne redevient
   * jamais faux (aucun mécanisme ne réintroduit du legacy après coup). Un
   * simple drapeau mémoire, remis à zéro à chaque redémarrage à froid de
   * l'isolate (donc toujours ré-exécuté au moins une fois, jamais un skip
   * permanent risqué), suffit à économiser ces ~30 requêtes par appel.
   */
  if(!__idleLegacyRepairDoneV1){
    __idleRepairCatalogSheetNamesV1(sql);
    __idleRestoreCatalogFromLegacyV2(sql);
    __idleLegacyRepairDoneV1=true;
  }

  const workbook=__idleBuildWorkbook(sql);
  if(!workbook.getSheetByName("JOUEURS"))throw new Error("SOREAL_IDLE_JOUEURS_ABSENT");

  __idleRuntimeUser=user||null;
  __idleWorkbook=workbook;
  try{
    const result=fn.apply(null,Array.isArray(args)?args:[]);
    __idleCommit(sql,workbook);
    return result;
  }finally{
    __idleRuntimeUser=null;
    __idleWorkbook=null;
  }
}
