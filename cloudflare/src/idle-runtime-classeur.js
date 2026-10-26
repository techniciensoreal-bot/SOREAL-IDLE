/*
 * Classeur SQLite « à la Google Sheets » (Range, Sheet, Spreadsheet, verrou, caches) et cycle lecture/commit (audit d'architecture, 2026-10-16 : découpage de idle-sqlite-runtime.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { safeJson, sqlRows, jsonText } from "./core/sqlite-core.js";
import { enregistrerGainExpV1 } from "./idle-gains-v1.js";
import { __idleCtx, __idleKey, __idleNonEmpty } from "./idle-sqlite-runtime.js";

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
  /*
   * Lignes PARESSEUSES (audit du 2026-10-10, IDLE-AUDIT-PERF-001) : une ligne peut être donnée sous forme de TEXTE JSON brut (avec sa longueur en colonnes, calculée par SQLite) et n'est décodée qu'au premier accès. La feuille
   * JOUEURS contient la ligne entière de chaque joueur (57 Ko et plus) : décoder celles de tous les joueurs à chaque opération coûtait 0,17 ms par joueur et par opération, même pour un simple battement. Une ligne jamais touchée
   * n'est ni décodée ni réécrite (elle n'est jamais « sale »).
   */
  constructor(name,rows,chargeur){
    this.name=String(name||"");
    this.rows=Array.isArray(rows)?rows:[];
    /* chargeur(numeroDeLigne) : texte JSON d'une ligne différée, lu à la demande dans SQLite. */
    this.chargeur=typeof chargeur==="function"?chargeur:null;
    this.dirtyRows=new Set();
    this.maxColumns=this.rows.reduce((m,r)=>Math.max(m,Array.isArray(r)?r.length:0),0);
  }
  /* Ligne décodée (tableau) ; une ligne différée est lue dans SQLite, décodée et mémorisée à son premier accès. */
  _ligne(i){
    let r=this.rows[i];
    if(r===__IDLE_LIGNE_DIFFEREE){
      r=safeJson(this.chargeur?this.chargeur(i+1):"[]",[]);
      if(!Array.isArray(r))r=[];
      this.rows[i]=r;
    }
    return r;
  }
  getName(){return this.name;}
  getCell(row,col){
    const r=this._ligne(row-1);
    return Array.isArray(r)&&col-1<r.length?(r[col-1]??""):"";
  }
  setCell(row,col,value){
    while(this.rows.length<row)this.rows.push([]);
    const r=this._ligne(row-1);
    while(r.length<col)r.push("");
    /* Valeur identique : rien à réécrire (la ligne n'est pas marquée « sale », donc pas de réécriture de la ligne joueur en base). */
    if(r[col-1]===value)return;
    r[col-1]=value;
    this.maxColumns=Math.max(this.maxColumns,col);
    this.dirtyRows.add(row);
  }
  getRange(row,col,numRows=1,numCols=1){return new IdleRange(this,row,col,numRows,numCols);}
  getLastRow(){
    for(let i=this.rows.length-1;i>=0;i--){
      const r=this._ligne(i);
      if(Array.isArray(r)&&r.some(__idleNonEmpty))return i+1;
    }
    return 0;
  }
  getLastColumn(){
    let m=0;
    for(let i=0;i<this.rows.length;i++){
      const r=this.rows[i];
      /* Ligne différée non lue : ignorée (seule l'en-tête, toujours décodée, donne la largeur de la feuille JOUEURS). */
      if(r===__IDLE_LIGNE_DIFFEREE)continue;
      if(Array.isArray(r)&&r.some(__idleNonEmpty))m=Math.max(m,r.length);
    }
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
  /* Feuille créée à la demande (ex. registre du classement) ; ses lignes modifiées sont enregistrées par __idleCommit. */
  getOrCreateSheet(name){
    const nom=String(name||"");
    let feuille=this.sheets.get(nom);
    if(!feuille){feuille=new IdleSheet(nom,[]);this.sheets.set(nom,feuille);}
    return feuille;
  }
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

export function __idleCanonicalSheetNameV1(name){
  const raw=String(name||"").trim();
  const key=raw.toLowerCase();
  return IDLE_CANONICAL_SHEET_NAMES_V1[key]||raw;
}

export function __idleRepairCatalogSheetNamesV1(sql){
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

/*
 * Une feuille vidée VOLONTAIREMENT (remplacement avec confirmPurge, voir index-idle-coordinator-v1.js) est marquée dans idle_meta : la restauration automatique depuis legacy_rows ne la ressuscite plus au prochain démarrage
 * à froid (audit du 2026-10-10, IDLE-AUDIT-SEC-014 : d'anciennes valeurs, éventuellement non conformes au wiki, pouvaient réapparaître).
 */
function __idlePurgeVolontaireV1(sql,canonical){
  try{
    return sqlRows(sql.exec("SELECT meta_value FROM idle_meta WHERE meta_key=?","catalogue_purge:"+canonical)).length>0;
  }catch(_e){
    return false;
  }
}

export function __idleRestoreCatalogFromLegacyV2(sql){
  const now=Date.now();

  for(const [legacy,canonical] of Object.entries(IDLE_CANONICAL_SHEET_NAMES_V1)){
    if(__idleCatalogCountV2(sql,canonical)>0)continue;
    if(__idlePurgeVolontaireV1(sql,canonical))continue;

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
  if(__idleCatalogCountV2(sql,"JOUEURS")===0&&!__idlePurgeVolontaireV1(sql,"JOUEURS")){
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

/* Lignes de joueurs paresseuses (voir IdleSheet) ; SOREAL_IDLE_LIGNES_EAGER=1 rétablit le décodage immédiat (tests d'équivalence). */
function __idleLignesParesseusesV1(){
  return !(typeof process!=="undefined"&&process.env&&process.env.SOREAL_IDLE_LIGNES_EAGER==="1");
}

/* Marqueur d'une ligne de JOUEURS pas encore lue (voir IdleSheet._ligne). */
const __IDLE_LIGNE_DIFFEREE=Object.freeze({differee:true});

export function __idleBuildWorkbook(sql){
  const bySheet=new Map();
  const paresseux=__idleLignesParesseusesV1();
  /* Les lignes des joueurs (hors en-tête) ne sont PAS lues ici : seul leur numéro l'est ; chacune n'est lue et décodée que si l'opération la touche. */
  const records=sqlRows(sql.exec(
    paresseux
      ?"SELECT sheet_name,row_index,row_json FROM idle_catalog WHERE NOT (sheet_name='JOUEURS' AND row_index>1) ORDER BY sheet_name,row_index"
      :"SELECT sheet_name,row_index,row_json FROM idle_catalog ORDER BY sheet_name,row_index"
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
  if(paresseux){
    const joueurs=sqlRows(sql.exec("SELECT row_index FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index>1 ORDER BY row_index"));
    if(joueurs.length){
      let rows=bySheet.get("JOUEURS");
      if(!rows){rows=[];bySheet.set("JOUEURS",rows);}
      for(const rec of joueurs){
        const idx=Math.max(1,Number(rec.row_index)||1)-1;
        while(rows.length<=idx)rows.push([]);
        rows[idx]=__IDLE_LIGNE_DIFFEREE;
      }
    }
  }
  const chargeur=function(numero){
    const r=sqlRows(sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=?",numero))[0];
    return r&&typeof r.row_json==="string"?r.row_json:"[]";
  };
  const sheets=new Map();
  for(const [name,rows] of bySheet)sheets.set(name,new IdleSheet(name,rows,name==="JOUEURS"?chargeur:null));
  return new IdleSpreadsheet(sheets);
}

export function __idleCommit(sql,workbook){
  const now=Date.now();
  for(const [sheetName,sheet] of workbook.sheets){
    for(const rowIndex of sheet.dirtyRows){
      const ligneDecodee=sheet._ligne(rowIndex-1);
      const row=Array.isArray(ligneDecodee)?ligneDecodee:[];
      const nonEmpty=row.some(__idleNonEmpty);
      /* audit 2026-10-13 : la ligne n'est sérialisée qu'une fois (idle_catalog ET idle_players), avant : deux JSON.stringify de 45 à 177 Ko par commit */
      const texteLigneV1=nonEmpty?jsonText(row):'';
      /* Journal d'EXP : solde AVANT l'écriture (colonne XP = 4e cellule), lu par SQLite sans décoder toute la ligne. */
      let xpAvantV1=null;
      if(sheetName==="JOUEURS"&&rowIndex>1&&nonEmpty){
        try{
          const r=sqlRows(sql.exec("SELECT json_extract(row_json,'$[3]') AS xp FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=?",rowIndex))[0];
          if(r&&r.xp!=null&&Number.isFinite(Number(r.xp)))xpAvantV1=Number(r.xp);
        }catch(_e){/* le journal ne doit jamais gêner le jeu */}
      }
      if(nonEmpty){
        sql.exec(
          "INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?) "+
          "ON CONFLICT(sheet_name,row_index) DO UPDATE SET row_json=excluded.row_json,updated_at=excluded.updated_at",
          sheetName,rowIndex,texteLigneV1,now
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
        if(xpAvantV1!==null&&playerKey.indexOf("+partieb@")===-1&&playerKey.indexOf("+partiec@")===-1){
          try{
            enregistrerGainExpV1(sql,{email:playerKey,nom:displayName,operation:__idleCtx.__idleOperationNomV1+(__idleCtx.__idleReferenceGainV1?":"+__idleCtx.__idleReferenceGainV1:""),avant:xpAvantV1,apres:Number(row[3]),now});
          }catch(_e){/* le journal ne doit jamais gêner le jeu */}
        }
        sql.exec(
          "INSERT INTO idle_players(player_key,player_id,display_name,email_primary,email_login,state_json,source_row,updated_at) "+
          "VALUES(?,?,?,?,?,?,?,?) "+
          "ON CONFLICT(player_key) DO UPDATE SET player_id=excluded.player_id,display_name=excluded.display_name,"+
          "email_primary=excluded.email_primary,email_login=excluded.email_login,state_json=excluded.state_json,"+
          "source_row=excluded.source_row,updated_at=excluded.updated_at",
          playerKey,playerId,displayName,emailPrimary,emailLogin,texteLigneV1,rowIndex,now
        );
      }
    }
  }
}

export function verifierSessionSoreal(_token){
  return __idleCtx.__idleRuntimeUser?{ok:true,user:__idleCtx.__idleRuntimeUser}:{ok:false,user:null};
}

/*
 * Verrou orphelin (2026-10-05, essai en partie B avec 14 barres d'Augments très rapides) : une requête tuée par le serveur en plein calcul (temps de calcul dépassé) ne passe jamais par son
 * `finally` : l'indicateur restait à « tenu » et TOUTES les requêtes suivantes répondaient « Finalisation des données… » tant que l'isolat vivait (partie injouable). Le cycle étant
 * entièrement synchrone, un verrou tenu depuis plus de 20 s ne peut être que celui d'une requête morte : il est repris.
 */
export function __idleVerrouPerimeV1_(){
  if(__idleCtx.__idleScriptLockHeldV1&&Date.now()-__idleCtx.__idleScriptLockDepuisV1>20000)__idleCtx.__idleScriptLockHeldV1=false;
}

function __idleEmptyIterator(){
  return {hasNext(){return false;},next(){throw new Error("NO_FILE");}};
}

export const DriveApp={
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
