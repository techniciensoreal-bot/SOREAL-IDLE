import assert from "node:assert/strict";
import fs from "node:fs";
import { idleRuntimeTestHooks, runSorealIdleOperation } from "../src/idle-sqlite-runtime.js";
import {
  IDLE_NGU_META_VERSION,
  IDLE_NGU_SYSTEMS,
  IDLE_NGU_TRACKS,
  normalizeIdleNguState,
  advanceIdleNguState,
  idleNguBonuses,
  applyIdleNguAction,
  rebirthIdleNguState
} from "../src/idle-ngu-progression.js";

const {
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
  dateSorealIdle_
}=idleRuntimeTestHooks;

// Les ticks restent strictement équivalents à la production affichée.
{
  const tick=metaTickEnergieSorealIdle_(0.25);
  assert.equal(tick.gain,1);
  assert.equal(tick.dureeMs,4000);

  const result=calculerTicksEnergieSorealIdle_(0.25,12000,0);
  assert.equal(result.ticks,3);
  assert.equal(result.energieProduite,3);
  assert.ok(Math.abs(result.resteMs)<1e-6);
}

// Cas réel Monde 1 : après le premier upgrade production et Organisation 3,
// 2,34 énergie/s doit pouvoir alimenter l'AUTO pendant toute une heure.
// L'ancien calcul plafonnait d'abord l'énergie et ne pouvait donc exploiter
// qu'une fraction de la production hors ligne.
{
  const sim=creerSimulateurEnergieHorsLigneSorealIdle_(
    2.34,
    0,
    760,
    0
  );

  let combats=0;
  const creneaux=60*60/5;

  for(let i=0;i<creneaux;i+=1){
    sim.avancer(5000);
    if(sim.depenser(12))combats+=1;
  }

  const etat=sim.etat();

  assert.ok(combats>250,"L'AUTO hors ligne ne doit plus être limité à 250 combats.");
  assert.ok(combats>=700,"La production doit rester utilisable après chaque dépense.");
  assert.equal(
    etat.energieProduite,
    combats*12+etat.energie+etat.energiePerdueAuPlafond
  );
  assert.equal(etat.energiePerdueAuPlafond,0);
}

// Garde-fous structurels contre deux anciennes divergences de calcul.
{
  const source=fs.readFileSync(
    new URL("../src/idle-sqlite-runtime.js",import.meta.url),
    "utf8"
  );

  assert.ok(
    !source.includes("bossCombatIndex === 19 &&"),
    "La fin de monde doit dépendre de BOSS_PAR_MONDE et non du nombre 19."
  );

  const debut=source.indexOf("function seuilPuissanceBossPrincipalSorealIdle_");
  const fin=source.indexOf("function obtenirSpreadsheetSorealIdle_",debut);
  const bloc=source.slice(debut,fin);

  assert.ok(
    bloc.includes("degatsRecusSecondeSorealIdle_("),
    "L'estimation du boss tutoriel doit réutiliser la formule réelle de dégâts."
  );

  assert.ok(
    !bloc.includes("BOSS_TUTORIEL_DEGATS_SEC',\n            0.35"),
    "L'ancienne valeur 0,35 ne doit plus diverger du combat réel."
  );

  assert.ok(
    source.includes("function delaiRespawnBossSorealIdle_(") &&
    source.includes("void bossIndex;\n  return 0;") &&
    !source.includes("'BOSS_1_RESPAWN_SECONDES'"),
    "Les boss principaux ne doivent plus avoir de cooldown de reformation."
  );

  assert.ok(
    source.includes("const statsAuto =\n    statsCombat;"),
    "L'Aventure AUTO doit partager le même état stats pour préserver le Bestiaire."
  );
}

// La réconciliation ciblée de la boutique doit exposer les totaux exacts.
{
  const source=fs.readFileSync(
    new URL("../src/idle-sqlite-runtime.js",import.meta.url),
    "utf8"
  );

  const boutiqueDebut=source.indexOf("function obtenirEtatBoutiqueSorealIdle(");
  const boutiqueFin=source.indexOf("function acheterAmeliorationsSorealIdle(",boutiqueDebut);
  const boutique=source.slice(boutiqueDebut,boutiqueFin);

  for(const cle of ["energieMax:","productionSeconde:","puissance:","bonusBoutique:"]){
    assert.ok(
      boutique.includes(cle),
      "La réconciliation boutique doit exposer "+cle
    );
  }
}



// Accès privé : deux personnes seulement (Norman a deux alias e-mail).
{
  assert.deepEqual(
    emailsAutorisesSorealIdle_().sort(),
    [
      "hodappsebastien@gmail.com",
      "reeeedruuuum@gmail.com",
      "technicien.soreal@gmail.com"
    ].sort()
  );
}

// Renaissance : STATS_JSON doit être inclus dans la lecture afin de conserver
// les sorts permanents et les autres statistiques conservées.
{
  const source=fs.readFileSync(
    new URL("../src/idle-sqlite-runtime.js",import.meta.url),
    "utf8"
  );
  const debut=source.indexOf("function renaitreSorealIdle(");
  const fin=source.indexOf("function ",debut+30);
  const bloc=source.slice(debut,fin>debut?fin:source.length);
  assert.ok(
    bloc.includes("c.STATS_JSON"),
    "La Renaissance doit lire STATS_JSON avant de reconstruire le joueur."
  );
  assert.ok(
    !bloc.includes("1,\n          c.AVENTURE_DERNIERE_ACTION"),
    "La Renaissance ne doit plus couper la ligne avant STATS_JSON."
  );
}



// Les 15 noms techniques migrés doivent être convertis vers les vrais noms
// attendus par le moteur Apps Script porté sur SQLite.
{
  const attendu={
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
  };
  for(const [legacy,canonique] of Object.entries(attendu)){
    assert.equal(__idleCanonicalSheetNameV1(legacy),canonique);
  }
}

// L'accès au launcher doit être évalué avant toute exigence de migration ou
// de feuille JOUEURS : un catalogue cassé ne doit plus masquer le bouton.
{
  const source=fs.readFileSync(
    new URL("../src/idle-sqlite-runtime.js",import.meta.url),
    "utf8"
  );
  const debut=source.indexOf("export function runSorealIdleOperation");
  const fin=source.indexOf("\n}",debut);
  const bloc=source.slice(debut,Math.max(fin,debut)+4500);
  const bypass=bloc.indexOf('op==="obtenirAccesSorealIdle"');
  const migration=bloc.indexOf("SOREAL_IDLE_MIGRATION_INCOMPLETE");
  const repair=bloc.indexOf("__idleRepairCatalogSheetNamesV1(sql)");
  const joueurs=bloc.indexOf("SOREAL_IDLE_JOUEURS_ABSENT");
  assert.ok(bypass>=0&&migration>bypass,
    "Le contrôle d'accès IDLE doit précéder le contrôle de migration.");
  assert.ok(repair>migration&&joueurs>repair,
    "Les noms de feuilles doivent être réparés avant de rechercher JOUEURS.");
}



// Les nombres et dates issus du rendu français de Google Sheets doivent
// conserver exactement leur sens après migration SQLite.
{
  assert.equal(nombreSorealIdle_("2,34",0),2.34);
  assert.equal(nombreSorealIdle_("14 000",0),14000);
  assert.equal(
    dateSorealIdle_("27/08/2026",0),
    Date.UTC(2026,7,27)
  );
}

// Test de démarrage complet : on part volontairement uniquement des lignes
// brutes legacy_rows, comme filet de récupération d'une migration historique.
// Le runtime doit reconstruire les 15 feuilles puis retourner un joueur.
{
  class FakeIdleSql {
    constructor(legacy){
      this.legacy=legacy;
      this.catalog=new Map();
      this.players=[];
    }
    sheet(name){
      if(!this.catalog.has(name))this.catalog.set(name,new Map());
      return this.catalog.get(name);
    }
    exec(query,...bindings){
      const q=String(query||"").replace(/\s+/g," ").trim();

      if(q.includes("FROM migration_sources WHERE source_key LIKE 'idle:%'")){
        return [{total:15,done:15}];
      }

      if(q.startsWith("SELECT COUNT(*) AS n FROM idle_catalog WHERE sheet_name=?")){
        return [{n:(this.catalog.get(String(bindings[0]))||new Map()).size}];
      }

      if(q.startsWith("SELECT row_index,row_json,updated_at FROM idle_catalog WHERE sheet_name=?")){
        const rows=[...(this.catalog.get(String(bindings[0]))||new Map()).entries()]
          .map(([row_index,x])=>({row_index,...x}))
          .sort((a,b)=>a.row_index-b.row_index);
        return rows;
      }

      if(q.startsWith("SELECT row_index,values_json,imported_at FROM legacy_rows")){
        return (this.legacy[String(bindings[0])]||[]).map(x=>({...x}));
      }

      if(q.startsWith("SELECT source_row,state_json,updated_at FROM idle_players")){
        return this.players.map(x=>({...x}));
      }

      if(q.startsWith("SELECT sheet_name,row_index,row_json FROM idle_catalog")){
        const out=[];
        for(const [sheet_name,rows] of this.catalog){
          for(const [row_index,x] of rows){
            out.push({sheet_name,row_index,row_json:x.row_json});
          }
        }
        return out.sort(
          (a,b)=>String(a.sheet_name).localeCompare(String(b.sheet_name))||
            a.row_index-b.row_index
        );
      }

      if(q.startsWith("INSERT INTO idle_catalog")){
        let sheetName,rowIndex,rowJson,updatedAt;
        if(q.includes("VALUES('JOUEURS',1,?,?)")){
          sheetName="JOUEURS";
          rowIndex=1;
          [rowJson,updatedAt]=bindings;
        }else if(q.includes("VALUES('JOUEURS',?,?,?)")){
          sheetName="JOUEURS";
          [rowIndex,rowJson,updatedAt]=bindings;
        }else{
          [sheetName,rowIndex,rowJson,updatedAt]=bindings;
        }
        this.sheet(String(sheetName)).set(
          Number(rowIndex),
          {row_json:String(rowJson),updated_at:Number(updatedAt)||Date.now()}
        );
        return [];
      }

      if(q.startsWith("DELETE FROM idle_catalog WHERE sheet_name=? AND row_index=?")){
        this.catalog.get(String(bindings[0]))?.delete(Number(bindings[1]));
        return [];
      }

      if(q.startsWith("DELETE FROM idle_catalog WHERE sheet_name=?")){
        this.catalog.delete(String(bindings[0]));
        return [];
      }

      if(
        q.startsWith("INSERT INTO idle_players")||
        q.startsWith("DELETE FROM idle_players")
      ){
        return [];
      }

      throw new Error("FakeIdleSql SQL non géré: "+q);
    }
  }

  const now=Date.now();
  const rows=(values)=>values.map((v,i)=>({
    row_index:i+1,
    values_json:JSON.stringify(v),
    imported_at:now
  }));

  const joueurHeaders=[
    "ID","Nom","Niveau","XP","Énergie","Énergie max","Prod/s","Force",
    "Endurance","Organisation","Puissance","Boss actuel","PV boss",
    "PV boss max","Boss vaincus","Dernière synchro","Public","Rang",
    "Email principal","Email connexion","Pièces","Inventaire JSON",
    "Équipement JSON","Améliorations JSON","Renaissances",
    "Essence renaissance","PV joueur","PV joueur max","KO jusqu'à",
    "Zone aventure","Progression aventure JSON","Points aventure",
    "Dernière action aventure","Matériaux","Collection JSON","Date début",
    "Capacité inventaire","Stats JSON"
  ];
  const joueur=[
    "J001","Norman",5,20,100,760,"2,34",4,4,3,96,
    "Le Maxity de l’Apocalypse",14000,14000,4,
    new Date(now-5000).toISOString(),"Visible","",
    "technicien.soreal@gmail.com","reeeedruuuum@gmail.com",
    37,"[]","{}","{\"production\":1,\"capacite\":2,\"puissance\":1}",
    0,0,340,340,"",1,"{}",28,"",4,"{}",
    "27/08/2026",18,
    "{\"bossSelection\":5,\"combatBossActif\":false,\"autoBossSuivant\":true,\"reposNumero\":1}"
  ];

  const legacy={
    "idle:joueurs":rows([joueurHeaders,joueur]),
    "idle:classement":rows([
      ["Rang","Joueur","Niveau","Puissance","Boss actuel","Boss vaincus","Dernière synchro","Statut"],
      ["","Norman",5,96,"Le Maxity de l’Apocalypse",4,new Date(now).toISOString(),"Visible"]
    ]),
    "idle:config":rows([
      ["Paramètre","Valeur","Description"],
      ["Production énergie de base / sec","0,25",""],
      ["Énergie max de base",250,""],
      ["BOSS_PAR_MONDE",20,""],
      ["BANNIERE_SOREAL_IDLE_DRIVE_ID","1omNowtqq_YjUQitljdBXbLK9VZ0oJ7qb",""],
      ["PV_PAR_ENDURANCE",20,""],
      ["DEFENSE_PAR_ENDURANCE","0,5",""],
      ["ORGANISATION_ENERGIE_MAX_PAR_NIVEAU",5,""],
      ["ORGANISATION_PROD_PCT_PAR_NIVEAU",2,""],
      ["MAGIE_NIVEAU_DEBLOCAGE",4,""]
    ]),
    "idle:boss":rows([
      ["ID","Nom","PV","Attaque","XP","Pieces","ChanceLoot","Image","Actif","DriveFileID","Capacite1","Intervalle1","Valeur1","Duree1","Capacite2","Intervalle2","Valeur2","Duree2","Capacite3","Intervalle3","Valeur3","Duree3","Histoire","MortVivant","Conseil","NiveauRequis"],
      [1,"La Palette Infernale",800,2,100,8,0.35,"",true,"","","","","","","","","","","","","","",false,"",1],
      [5,"Le Maxity de l’Apocalypse",14000,14,320,24,0.4,"",true,"","","","","","","","","","","","","","",false,"",5]
    ]),
    "idle:zones":rows([
      ["ID","Nom","Emoji","Description","Ennemi","Boss","NiveauRequis","PuissanceRecommandee","CoutEntree","PVEnnemi","AttaqueEnnemi","PVBoss","AttaqueBoss","Points","Pieces","Image","Actif","ImageName","DriveFileID"],
      [1,"Quai des Palettes","📦","","Palette bancale","La Palette Infernale",2,15,12,90,2,260,4,2,3,"",true,"",""]
    ]),
    "idle:monstres":rows([
      ["ID","ZoneID","Type","Nom","Emoji","PV","Attaque","ChanceRencontre","ChanceLegendaire","ObjetLegendaire","SlotLegendaire","BaseLegendaire","Description","Image","Actif"],
      ["Z1_NORMAL",1,"normal","Palette bancale","📦",90,2,1,0,"","",0,"","",true]
    ]),
    "idle:loots":rows([
      ["ID","Nom","Slot","ZoneID","Boss","Poids","ChanceDrop","BasePuissance","SetID","Image","Actif"],
      ["GEN_TETE","Casquette du débutant","tete",0,"*",1,0.3,2,"","",true]
    ]),
    "idle:sets":rows([
      ["ID","Nom","ZoneID","Pieces2","Bonus2Pct","Pieces4","Bonus4Pct","Pieces6","Bonus6Pct","Apparence","Description","Actif"],
      ["SET_PALETTES","Set du Quai des Palettes",1,2,5,4,12,6,30,2,"",true]
    ]),
    "idle:collections":rows([
      ["ID","ZoneID","Nom","BonusPuissancePct","Description","Actif"],
      ["COLL_Z1",1,"Collection du Quai des Palettes",2,"",true]
    ]),
    "idle:repos":rows([
      ["ID","Nom","Numero","RegenPctSec","NiveauRequis","Image","Actif","DriveFileID"],
      ["BEDROOM_1","Salle de repos 1",1,2.5,1,"",true,""]
    ]),
    "idle:apparences":rows([
      ["ID","Nom","Numero","SetIDRequis","Image","Actif","DriveFileID"],
      ["PLAYER_1","Tenue de départ",1,"","",true,""]
    ]),
    "idle:raretes":rows([
      ["ID","Nom","Chance","Multiplicateur","Materiaux","Couleur","Actif"],
      ["commun","Commun",70,1,1,"#aaa",true],
      ["legendaire","Légendaire",2,4,50,"#e58a00",true]
    ]),
    "idle:deblocages":rows([
      ["ID","Nom","Niveau","Actif"],
      ["combat","Combat",1,true],
      ["personnage","Personnage",1,true],
      ["aventure","Aventure",2,true],
      ["bestiaire","Bestiaire",2,true],
      ["magie","Magie",4,true]
    ]),
    "idle:boutique":rows([
      ["Type","CoutBase","Croissance","BonusParNiveau","Actif"],
      ["production",20,1.65,2,true],
      ["capacite",15,1.55,250,true],
      ["puissance",25,1.75,10,true]
    ]),
    "idle:sorts":rows([
      ["ID","Nom","Emoji","Description","NiveauRequis","CoutPieces","CoutMana","CooldownSec","Type","Valeur","ValeurSecondaire","Duree","Cible","EffetMortVivant","Actif"],
      ["petit_soin","Soin de fortune","❤️","",4,6,18,34,"heal_pct",35,5,0,"joueur,boss","degats_pct_boss",true]
    ])
  };

  const sql=new FakeIdleSql(legacy);
  const user={
    prenom:"Norman",
    email:"technicien.soreal@gmail.com",
    emailConnexion:"reeeedruuuum@gmail.com",
    emails:["technicien.soreal@gmail.com","reeeedruuuum@gmail.com"]
  };

  const res=runSorealIdleOperation(
    sql,
    "obtenirEtatSorealIdle",
    ["session-test"],
    user
  );

  assert.equal(res?.ok,true);
  assert.equal(res?.joueur?.nom,"Norman");
  assert.equal(res?.joueur?.banniereDriveFileId,"1omNowtqq_YjUQitljdBXbLK9VZ0oJ7qb");
  assert.equal(sql.catalog.has("JOUEURS"),true);
  assert.equal(sql.catalog.has("CONFIG"),true);
}

console.log("SOREAL IDLE runtime calculations: OK");


/*
 * Isolation du dépôt (2026-09-15) — le test vérifiant que
 * index-global-read-coordinator-v55.js authentifie /api/app/idle/*
 * (APP puis TV) reste dans SOREAL-TV : ce fichier de routage/auth n'a
 * pas migré ici avec le moteur de jeu. Voir SOREAL-TV/cloudflare/tests/
 * idle-runtime.test.mjs pour la version complète avec ce bloc.
 */


// Aventure V118 : la puissance globale ne doit plus permettre de raser
// instantanément une zone sans équipement d'Aventure adapté.
{
  const source=fs.readFileSync(
    new URL("../src/idle-sqlite-runtime.js",import.meta.url),
    "utf8"
  );
  const profilStart=
    source.indexOf("function profilStuffAventureSorealIdle_(");
  const combatStart=
    source.indexOf("function combattreAventureSorealIdle(");
  const aventureBalance=
    source.slice(profilStart,combatStart);

  assert.ok(
    profilStart>=0 &&
    aventureBalance.includes("zoneSuperieure >= 4") &&
    aventureBalance.includes("zoneOuMieux >= 5") &&
    aventureBalance.includes("boss\n        ? 36\n        : 19.5"),
    "La durée cible doit dépendre du niveau réel du stuff équipé."
  );

  assert.ok(
    aventureBalance.includes("function puissanceEffectiveAventureSorealIdle_(") &&
    aventureBalance.includes("Math.min(\n          brut,\n          plafond"),
    "La puissance Aventure doit être plafonnée par la courbe de stuff."
  );

  const combatEnd=
    source.indexOf("/**\n * ============================================================\n * SOREAL IDLE — DATA ACCESS",combatStart);
  const combatBlock=
    source.slice(combatStart,combatEnd);

  if (!combatBlock.includes("SOREAL_IDLE_V47_LEGACY_DISABLED")) {
    assert.ok(
      combatBlock.includes("const puissanceBrute =") &&
      combatBlock.includes("puissanceEffectiveAventureSorealIdle_(") &&
      combatBlock.includes("const puissance =\n      puissanceAventure.effective;"),
      "Le combat Aventure réel doit utiliser la puissance effective, pas la puissance globale brute."
    );
  
    assert.ok(
      combatBlock.includes("dureeCibleStuff:") &&
      combatBlock.includes("farmRapide:") &&
      combatBlock.includes("stuffAventure:"),
      "La simulation doit exposer le profil de farm pour garder le client explicable."
    );
  } else {
    assert.ok(
      combatBlock.includes("moteur NGU V47"),
      "Le point d’entrée Adventure legacy neutralisé doit rediriger explicitement vers le moteur NGU V47."
    );
  }

}


// Basic Training V41.1 : l'énergie est affectée, jamais dépensée.
{
  const initial=createBasicTrainingStateV411(1000);

  assert.equal(initial.version,411);
  assert.equal(BASIC_TRAINING_V411.maxLevelsPerSecond,50);
  assert.equal(initial.skills.attaque_passive.cap,2500);
  assert.equal(initial.skills.blocage.cap,2500);

  const allocation=applyBasicTrainingAllocationsV411(
    initial,
    {
      attaque_passive:250,
      blocage:250
    },
    500,
    500
  );

  assert.equal(allocation.allocated,500);
  assert.equal(allocation.idleEnergy,0);

  const release=applyBasicTrainingAllocationsV411(
    allocation.state,
    {
      attaque_passive:0,
      blocage:0
    },
    0,
    500
  );

  assert.equal(release.allocated,0);
  assert.equal(release.idleEnergy,500);
}

// 500 d'énergie au départ ne suffit PAS à speed-cap les deux premières barres.
// 250 / 2500 = 10 %, donc 5 niveaux/s.
{
  const state=createBasicTrainingStateV411(1000);

  state.skills.attaque_passive.allocation=250;

  const progressed=advanceBasicTrainingStateV411(
    state,
    11000,
    60
  );

  assert.equal(
    progressed.state.skills.attaque_passive.level,
    50
  );
}

// Les déblocages suivent 5k / 10k / 15k / 20k / 25k.
{
  const state=createBasicTrainingStateV411(Date.now());

  let snap=basicTrainingSnapshotV411(
    state,
    500,
    500
  );

  assert.equal(
    snap.skills.find(x=>x.id==="attaque_reguliere").unlocked,
    false
  );

  state.skills.attaque_passive.level=5000;

  snap=basicTrainingSnapshotV411(
    state,
    500,
    500
  );

  assert.equal(
    snap.skills.find(x=>x.id==="attaque_reguliere").unlocked,
    true
  );

  state.skills.attaque_reguliere.level=10000;

  snap=basicTrainingSnapshotV411(
    state,
    500,
    500
  );

  assert.equal(
    snap.skills.find(x=>x.id==="attaque_renforcee").unlocked,
    true
  );
}

// Le cap ne bouge PAS pendant le run. Les niveaux ne font que préparer
// le prochain cap, appliqué à la Renaissance.
{
  const state=createBasicTrainingStateV411(Date.now());
  state.skills.attaque_passive.level=10000;

  const before=basicTrainingSnapshotV411(
    state,
    500,
    500
  );

  const skill=
    before.skills.find(x=>x.id==="attaque_passive");

  assert.equal(skill.cap,2500);
  assert.equal(skill.nextCap,2249);
  assert.equal(skill.maxReductionReached,true);

  const reborn=
    rebirthBasicTrainingStateV411(
      state,
      Date.now()
    );

  assert.equal(
    reborn.skills.attaque_passive.cap,
    2249
  );

  assert.equal(
    reborn.skills.attaque_passive.level,
    0
  );
}

// La contribution de chaque barre suit Level^1.3 × BaseValue.
// Energy Power n'intervient jamais dans le calcul du Basic Training.
{
  const state=createBasicTrainingStateV411(Date.now());

  state.skills.attaque_passive.level=100;
  state.skills.blocage.level=100;

  const stats=deriveBasicTrainingStatsV411(state);

  const expected=
    100+
    Math.pow(100,1.3)*150;

  assert.ok(
    Math.abs(stats.attack-expected)<1e-6
  );

  assert.ok(
    Math.abs(stats.defense-expected)<1e-6
  );

  const snap=basicTrainingSnapshotV411(
    state,
    500,
    500
  );

  assert.equal(
    snap.energyPowerAffectsTraining,
    false
  );
}

// Garde-fous de branchement du runtime V42.
{
  const source=fs.readFileSync(
    new URL("../src/idle-sqlite-runtime.js",import.meta.url),
    "utf8"
  );

  assert.ok(
    source.includes("VERSION: 'V45-NGU-PARITY'") &&
    source.includes("ENERGIE_BASE: 500") &&
    source.includes("ENERGIE_MAX_BASE: 500"),
    "Une nouvelle partie V45 doit démarrer avec 500 d'énergie."
  );

  assert.ok(
    source.includes("initialiserModeleJoueurSorealIdleV41SiNecessaire_") &&
    source.includes("definirAllocationsEntrainementSorealIdle") &&
    source.includes("basicTrainingSnapshotV411("),
    "Le runtime doit exposer le Basic Training V41.1."
  );

  assert.ok(
    source.includes("rebirthBasicTrainingStateV411("),
    "La réduction de cap doit être appliquée lors de la Renaissance."
  );

  assert.ok(
    source.includes("energieIdleMaxV41"),
    "La production d'énergie doit respecter l'énergie déjà affectée."
  );
}


// V41.2 — les premiers combats Aventure restent visibles longtemps et
// l'AUTO hors ligne utilise exactement le même plafond de puissance.
{
  const source=fs.readFileSync(
    new URL("../src/idle-sqlite-runtime.js",import.meta.url),
    "utf8"
  );

  const durationStart=
    source.indexOf("function dureeCibleStuffAventureSorealIdle_(");
  const durationEnd=
    source.indexOf("function puissanceEffectiveAventureSorealIdle_",durationStart);
  const durationBlock=
    source.slice(durationStart,durationEnd);

  assert.ok(
    durationBlock.includes("boss\n        ? 36\n        : 19.5") &&
    durationBlock.includes("boss\n        ? 28\n        : 14") &&
    durationBlock.includes("boss\n        ? 6\n        : 3"),
    "La progression Aventure doit partir de combats longs et accélérer avec le stuff."
  );

  const progressionStart=
    source.indexOf("function appliquerProgressionEnergieSorealIdle_(");
  const stateStart=
    source.indexOf("function construireEtatJoueurSorealIdle_(",progressionStart);
  const progression=
    source.slice(progressionStart,stateStart);

  assert.ok(
    progression.includes("const puissanceAventureAuto =") &&
    progression.includes("puissanceEffectiveAventureSorealIdle_("),
    "L'Aventure AUTO hors ligne doit respecter le même plafond de puissance que le combat visible."
  );
}

// V41.2 — un boss principal est tué une fois par run.
// La victoire sélectionne le suivant, sans respawn ni farm des anciens boss.
{
  const source=fs.readFileSync(
    new URL("../src/idle-sqlite-runtime.js",import.meta.url),
    "utf8"
  );

  const progressionStart=
    source.indexOf("function appliquerProgressionEnergieSorealIdle_(");
  const progressionEnd=
    source.indexOf("function construireEtatJoueurSorealIdle_(",progressionStart);
  const progression=
    source.slice(progressionStart,progressionEnd);

  assert.ok(
    progression.includes("bossCombatIndex =\n        bossVaincus;") &&
    progression.includes("statsCombat.bossSelection =\n        bossCombatIndex + 1;") &&
    progression.includes("statsCombat.bossRespawnJusqua = 0;"),
    "Après victoire, le moteur doit avancer immédiatement au boss suivant sans cooldown."
  );

  const catalogStart=
    source.indexOf("bossCatalogue:\n      bossCatalogueSorealIdle_()");
  const catalogEnd=
    source.indexOf("banniereDriveFileId:",catalogStart);
  const catalog=
    source.slice(catalogStart,catalogEnd);

  assert.ok(
    catalog.includes("index === vaincus") &&
    !catalog.includes("index <= vaincus"),
    "Seul le boss courant doit rester sélectionnable ; les boss vaincus restent morts."
  );

  const selectStart=
    source.indexOf("function selectionnerBossSorealIdle(");
  const selectEnd=
    source.indexOf("function obtenirImageReposSorealIdle",selectStart);
  const selectBlock=
    source.slice(selectStart,selectEnd);

  assert.ok(
    selectBlock.includes("BOSS_DEJA_VAINCU") &&
    selectBlock.includes("Il reviendra à la Renaissance") &&
    selectBlock.includes("BOSS_NON_ATTEINT"),
    "L'API doit interdire de recombattre un boss vaincu ou de sauter un boss."
  );

  const startBoss=
    source.slice(
      source.indexOf("function definirCombatBossSorealIdle("),
      source.indexOf("function definirAutoBossSuivantSorealIdle")
    );

  assert.ok(
    !startBoss.includes("BOSS_RESPAWN") &&
    !startBoss.includes("cooldownRestant"),
    "Démarrer un boss ne doit plus dépendre d'un respawn."
  );
}


// V56 — mission NGU (2026-09-09) : le plancher PV/Attaque/XP des boss doit
// suivre la vraie courbe NGU sourcée (idle-ngu-boss-reference-v1.js), pas
// une progression géométrique inventée (×3/×2 par boss). Boss 1 reste un
// tutoriel ; du boss 5 au boss 20 chaque boss vaut ×5 le précédent, puis
// ×10 à partir du boss 21 — vérifié exact sur les 160 premiers boss
// (cf. cloudflare/reference/README.md).
{
  const boss1=
    idleRuntimeTestHooks.equilibrerBossPrincipalSorealIdleV413_({},0);
  const boss2=
    idleRuntimeTestHooks.equilibrerBossPrincipalSorealIdleV413_({},1);
  const boss5=
    idleRuntimeTestHooks.equilibrerBossPrincipalSorealIdleV413_({},4);
  const boss20=
    idleRuntimeTestHooks.equilibrerBossPrincipalSorealIdleV413_({},19);
  const boss21=
    idleRuntimeTestHooks.equilibrerBossPrincipalSorealIdleV413_({},20);

  assert.equal(
    boss1.pv,500000,
    "Le Boss 1 (tutoriel) doit avoir les PV réels NGU (500 000), pas un plancher inventé."
  );
  assert.equal(
    boss1.attaque,50000,
    "Le Boss 1 (tutoriel) doit avoir l'Attaque réelle NGU (50 000), pas un plancher inventé."
  );

  assert.ok(
    Math.abs(boss2.pv/boss1.pv-2)<1e-9 && Math.abs(boss2.attaque/boss1.attaque-2)<1e-9,
    "Le Boss 2 doit valoir exactement ×2 le Boss 1 (courbe réelle NGU, pas ×30 inventé)."
  );

  // Tolérance large (1%) : les valeurs sourcées du wiki sont arrondies à
  // 4 chiffres significatifs par boss, donc un ratio composé sur 15 boss
  // accumule un léger écart d'arrondi — ce n'est pas une identité
  // mathématique exacte, juste la vraie donnée publiée.
  assert.ok(
    Math.abs(boss20.pv/boss5.pv-Math.pow(5,15))<Math.pow(5,15)*0.01,
    "Du Boss 5 au Boss 20, chaque boss doit valoir ×5 le précédent (règle NGU sourcée)."
  );
  assert.ok(
    Math.abs(boss21.pv/boss20.pv-10)<0.01 && Math.abs(boss21.attaque/boss20.attaque-10)<0.01,
    "À partir du Boss 21, chaque boss doit valoir ×10 le précédent (règle NGU sourcée)."
  );

  // Un catalogue qui définit volontairement un boss plus fort garde le dessus
  // (le plancher NGU ne doit jamais AFFAIBLIR une valeur curatée SOREAL).
  const boss1Renforce=
    idleRuntimeTestHooks.equilibrerBossPrincipalSorealIdleV413_(
      {pv:999999999,attaque:999999999},
      0
    );
  assert.equal(
    boss1Renforce.pv,999999999,
    "Le plancher NGU ne doit jamais réduire une valeur de catalogue volontairement plus forte."
  );

  const source=fs.readFileSync(
    new URL("../src/idle-sqlite-runtime.js",import.meta.url),
    "utf8"
  );

  const definitionStart=
    source.indexOf("function definitionBossSorealIdle_(");
  const definitionEnd=
    source.indexOf("function nomBossSorealIdle_",definitionStart);
  const definition=
    source.slice(definitionStart,definitionEnd);

  assert.ok(
    definition.includes("equilibrerBossPrincipalSorealIdleV413_("),
    "Toutes les fiches de boss doivent passer par la couche d'équilibrage V41.3."
  );
}

// V41.3 — le stuff doit être un vrai multiplicateur du combat principal.
{
  const source=fs.readFileSync(
    new URL("../src/idle-sqlite-runtime.js",import.meta.url),
    "utf8"
  );

  const gearStart=
    source.indexOf("function profilEquipementCombatPrincipalSorealIdleV413_(");
  const gearEnd=
    source.indexOf("function statsCombatPrincipalSorealIdleV413_",gearStart);
  const gear=
    source.slice(gearStart,gearEnd);

  assert.ok(
    gear.includes("piecesEquipees * 0.08") &&
    gear.includes("scorePuissance * 0.03") &&
    gear.includes("piecesArmure * 0.10") &&
    gear.includes("scoreArmure * 0.04"),
    "Chaque pièce et sa puissance doivent améliorer réellement attaque et défense."
  );

  const sharedStart=
    source.indexOf("function statsCombatPrincipalSorealIdleV413_(");
  const sharedEnd=
    source.indexOf("function definitionBossSorealIdle_",sharedStart);
  const shared=
    source.slice(sharedStart,sharedEnd);

  assert.ok(
    shared.includes("deriveBasicTrainingStatsV411(") &&
    shared.includes(".multiplicateurAttaque") &&
    shared.includes(".multiplicateurDefense") &&
    shared.includes("multiplicateurPermanent"),
    "Training, stuff et bonus permanents doivent partager une seule formule de combat."
  );

  const recalcStart=
    source.indexOf("function recalculerPuissanceCompleteSorealIdle_(");
  const recalcEnd=
    source.indexOf("function equilibrerBossPrincipalSorealIdleV413_",recalcStart);
  const recalc=
    source.slice(recalcStart,recalcEnd);

  assert.ok(
    recalc.includes("statsCombatPrincipalSorealIdleV413_(") &&
    recalc.includes("c.PV_JOUEUR_MAX") &&
    !recalc.includes("obtenirParametresEntrainementSorealIdle_"),
    "Équiper un objet doit utiliser la même formule que le ticker Training, sans ancienne formule concurrente."
  );
}

// V41.3 — l'Aventure commence par un vrai cycle Training -> loot -> stuff.
{
  const source=fs.readFileSync(
    new URL("../src/idle-sqlite-runtime.js",import.meta.url),
    "utf8"
  );

  const enemyStart=
    source.indexOf("function statsEnnemiAventureSorealIdle_(");
  const enemyEnd=
    source.indexOf("function construireAventureSorealIdle_",enemyStart);
  const enemy=
    source.slice(enemyStart,enemyEnd);

  assert.ok(
    enemy.includes("15000000 *") &&
    enemy.includes("1200000 *") &&
    enemy.includes("1600000 *") &&
    enemy.includes("160000 *"),
    "La zone 1 doit avoir des floors de PV/attaque suffisamment élevés pour ne plus être triviale."
  );

  const durationStart=
    source.indexOf("function dureeCibleStuffAventureSorealIdle_(");
  const durationEnd=
    source.indexOf("function puissanceEffectiveAventureSorealIdle_",durationStart);
  const duration=
    source.slice(durationStart,durationEnd);

  assert.ok(
    duration.includes("boss\n        ? 36\n        : 19.5") &&
    duration.includes("zoneOuMieux >= 3") &&
    duration.includes("boss\n        ? 28\n        : 14"),
    "Sans 3 pièces de zone, le gardien doit dépasser la fenêtre de 30 s et être volontairement infranchissable."
  );

  const fightStart=
    source.indexOf("function combattreAventureSorealIdle(");
  const fightEnd=
    source.indexOf("function ",fightStart+40);
  const fight=
    source.slice(fightStart,fightEnd>fightStart?fightEnd:source.length);

  if (!fight.includes("SOREAL_IDLE_V47_LEGACY_DISABLED")) {
    assert.ok(
      fight.includes("const statsEquilibrees =") &&
      fight.includes("statsEnnemiAventureSorealIdle_(") &&
      fight.includes("puissanceEffectiveAventureSorealIdle_("),
      "Le vrai combat Aventure doit utiliser les floors et la courbe de stuff, pas seulement l'écran de prévision."
    );
  } else {
    assert.ok(
      fight.includes("moteur NGU V47"),
      "Le combat Adventure legacy doit rester neutralisé après la bascule V47."
    );
  }
}

// V45 — Adventure et Inventory sont débloqués par le boss 4, jamais par un niveau joueur.
{
  const source=fs.readFileSync(new URL("../src/idle-sqlite-runtime.js",import.meta.url),"utf8");
  assert.ok(source.includes("bossVaincusAventure >= 4"));
  assert.ok(source.includes("bossRequis: 4"));
}


// V45 — les déblocages viennent des vraies conditions NGU.
{
  const context={bosses:50,rebirths:2,sets:3,zone:5,adventurePower:1e8,bestGold:1000,materials:100};
  const state=normalizeIdleNguState({},context,1_000_000);

  assert.equal(state.version,IDLE_NGU_META_VERSION);
  assert.equal(state.systems.augmentations.unlocked,true);
  assert.equal(state.systems.timeMachine.unlocked,true);
  assert.equal(state.systems.bloodMagic.unlocked,true);
  assert.equal(state.systems.ngu.unlocked,false);
  assert.equal(state.systems.tower.unlocked,false);
  assert.equal(state.systems.hacks.unlocked,false);
  assert.equal(state.systems.infinityCube.unlocked,false);
}

// V42 — une allocation produit des niveaux et les bonus sont réellement utilisés.
{
  const context={bosses:50,rebirths:2,sets:3,zone:5,adventurePower:1e8,bestGold:1000,materials:100};
  let state=normalizeIdleNguState({},context,1_000_000);
  state.adventure.unlockItems.aNumber=true;
  state=applyIdleNguAction(state,{action:"adventure",adventure:{mode:"consumeUnlock",itemId:"aNumber"}},context,1_000_000).state;
  assert.equal(state.systems.ngu.unlocked,true);

  state=applyIdleNguAction(
    state,
    {action:"allocate",system:"ngu",resource:"energy",value:80},
    context,
    1_000_000
  ).state;

  state=advanceIdleNguState(state,4000,context,5_000_000);

  assert.ok(state.systems.ngu.level>0,"NGU SOREAL doit progresser avec de l'énergie allouée.");
  assert.ok(idleNguBonuses(state).attackMultiplier>1,"NGU doit contribuer aux statistiques.");
}

// V42/V47 — NGU permanent survit au Rebirth, tandis que les progressions de run sont reset/bankées.
{
  const context={bosses:80,rebirths:4,sets:5,zone:8,adventurePower:1e12,bestGold:1e6,materials:1000};
  let state=normalizeIdleNguState({},context,1_000_000);
  state.adventure.unlockItems.aNumber=true;
  state=applyIdleNguAction(state,{action:"adventure",adventure:{mode:"consumeUnlock",itemId:"aNumber"}},context,1_000_000).state;
  assert.equal(state.systems.ngu.unlocked,true);
  state=applyIdleNguAction(state,{action:"selectTrack",system:"ngu",track:"attack"},context,1_000_000).state;
  state=applyIdleNguAction(state,{action:"allocate",system:"ngu",resource:"energy",value:100},context,1_000_000).state;
  state=advanceIdleNguState(state,24*3600,context,87_400_000);
  const permanentAvant=state.systems.ngu.data.tracks.attack.level;
  assert.ok(permanentAvant>0);

  const reborn=rebirthIdleNguState(state,context,87_500_000);

  assert.ok(reborn.systems.ngu.data.tracks.attack.level>=permanentAvant);
  assert.ok(reborn.systems.advancedTraining.tempLevel<=state.systems.advancedTraining.tempLevel);
  assert.ok(reborn.systems.timeMachine.tempLevel<=state.systems.timeMachine.tempLevel);
  assert.ok(reborn.systems.beards.permanentLevel>=state.systems.beards.permanentLevel);
}

// V42 — la Renaissance SOREAL conserve maintenant le stuff et l'Aventure.
{
  const source=fs.readFileSync(
    new URL("../src/idle-sqlite-runtime.js",import.meta.url),
    "utf8"
  );
  const debut=source.indexOf("function renaitreSorealIdle(");
  const fin=source.indexOf("function valeurMateriauxObjetSorealIdle_",debut);
  const bloc=source.slice(debut,fin);

  assert.ok(
    !bloc.includes("c.INVENTAIRE_JSON\\n      )\\n      .setValue('[]')") &&
    !bloc.includes("c.EQUIPEMENT_JSON\\n      )\\n      .setValue('{}')") &&
    !bloc.includes("c.COLLECTION_JSON\\n      )\\n      .setValue('{}')"),
    "Inventaire, équipement et collection doivent survivre à la Renaissance."
  );

  assert.ok(
    bloc.includes("rebirthIdleNguState("),
    "La Renaissance doit appliquer la matrice de reset V42."
  );
}

// V42 — le runtime partagé expose une seule action générique pour les nouveaux systèmes.
{
  const source=fs.readFileSync(
    new URL("../src/idle-sqlite-runtime.js",import.meta.url),
    "utf8"
  );

  assert.ok(
    source.includes("function agirProgressionSorealIdle(") &&
    source.includes("agirProgressionSorealIdle,") &&
    source.includes("GAME-V42-NGU-META") || source.includes("V45-NGU-PARITY") || source.includes("GAME-V47-NGU-EARLY"),
    "Le moteur doit exposer la métaprogression via l'API partagée."
  );
}


// V42 — STATS_JSON doit conserver la métaprogression permanente.
{
  const source=fs.readFileSync(
    new URL("../src/idle-sqlite-runtime.js",import.meta.url),
    "utf8"
  );
  const debut=source.indexOf("function statsJoueurSorealIdle_(");
  const fin=source.indexOf("function cleBestiaireBossPrincipalSorealIdle_",debut);
  const bloc=source.slice(debut,fin);

  assert.ok(
    bloc.includes("metaNgu:") &&
    bloc.includes("s.metaNgu"),
    "Le parseur STATS_JSON doit préserver metaNgu entre deux chargements."
  );
}


// V42 — couverture des grandes familles NGU transposées en systèmes SOREAL.
{
  const ids=new Set(IDLE_NGU_SYSTEMS.map(x=>x.id));
  for(const id of [
    "achievements","dailySpin","augmentations","advancedTraining","timeMachine",
    "bloodMagic","wandoos","ngu","yggdrasil","moneyPit","diggers","beards",
    "tower","perks","challenges","macguffins","daycare","questing","quirks",
    "hacks","wishes","cards","cooking"
  ]){
    assert.ok(ids.has(id),"Système V42 manquant: "+id);
  }
}


// V42 — les systèmes complexes restent séparés en pistes spécialisées.
{
  assert.ok(IDLE_NGU_TRACKS.ngu.length>=6,"NGU SOREAL doit avoir plusieurs pistes.");
  assert.ok(IDLE_NGU_TRACKS.hacks.length>=10,"Les Hacks doivent rester spécialisés.");
  assert.ok(IDLE_NGU_TRACKS.wishes.length>=8,"Les Projets/Wishes doivent rester spécialisés.");

  const context={bosses:60,rebirths:3,sets:4,zone:8,adventurePower:1e10,bestGold:1e5,materials:100};
  let state=normalizeIdleNguState({},context,1_000_000);
  state.adventure.unlockItems.aNumber=true;
  state=applyIdleNguAction(state,{action:"adventure",adventure:{mode:"consumeUnlock",itemId:"aNumber"}},context,1_000_000).state;
  assert.equal(state.systems.ngu.unlocked,true);

  state=applyIdleNguAction(
    state,
    {action:"selectTrack",system:"ngu",track:"drop"},
    context,
    1_000_000
  ).state;

  state=applyIdleNguAction(
    state,
    {action:"allocate",system:"ngu",resource:"energy",value:100},
    context,
    1_000_000
  ).state;

  state=advanceIdleNguState(state,24*3600,context,87_400_000);

  assert.ok(state.systems.ngu.data.tracks.drop.level>0);
  assert.equal(state.systems.ngu.data.tracks.attack.level,0);
  assert.ok(idleNguBonuses(state).dropMultiplier>1);
}


// V43 — la timeline Aventure est la source unique des barres et du résultat.
{
  const source=fs.readFileSync(
    new URL("../src/idle-sqlite-runtime.js",import.meta.url),
    "utf8"
  );
  const helperStart=source.indexOf("function simulerCoupsAventureSorealIdleV43_(");
  const fightStart=source.indexOf("function combattreAventureSorealIdle(");
  const fightEnd=source.indexOf("SO... (go/truncated-by-tool?)" );
  const fight=source.slice(fightStart,fightEnd>fightStart?fightEnd:source.length);

  assert.ok(
    helperStart>=0&&
    source.includes("IDLE_COMBAT_EVENTS_V43")&&
    source.includes("atMs:")&&
    source.includes("pvAvant:")&&
    source.includes("pvApres:"),
    "Le serveur doit produire une timeline de coups avec PV avant/après."
  );
  if (!fight.includes("SOREAL_IDLE_V47_LEGACY_DISABLED")) {
    assert.ok(
      fight.includes("simulerCoupsAventureSorealIdleV43_(")&&
      fight.includes("versionCoups: 'V43'")&&
      fight.includes("evenements: combatCoups.evenements")&&
      fight.includes("combatCoups.degatsRecus"),
      "La victoire, les dégâts et la réponse Aventure doivent provenir de la timeline."
    );
  } else {
    assert.ok(
      fight.includes("moteur NGU V47"),
      "L'ancien combat Adventure neutralisé doit déléguer au moteur V47, qui possède ses propres tests de combat."
    );
  }
}


// V44/V47 — Adventure ne consomme plus la ressource Energy du Basic Training.
{
  const runtime=fs.readFileSync(new URL("../src/idle-sqlite-runtime.js",import.meta.url),"utf8");
  const adventure=fs.readFileSync(new URL("../src/idle-adventure-v47.js",import.meta.url),"utf8");
  const fightStart=runtime.indexOf("function combattreAventureSorealIdle(");
  const fightEnd=runtime.indexOf("function ",fightStart+20);
  const fight=runtime.slice(fightStart,fightEnd>fightStart?fightEnd:runtime.length);
  if (fight.includes("SOREAL_IDLE_V47_LEGACY_DISABLED")) {
    assert.ok(fight.includes("moteur NGU V47"));
    assert.ok(!adventure.includes("energy -=")&&!adventure.includes("coutEnergie"),"Le moteur Adventure V47 ne doit pas dépenser l'énergie Basic Training.");
  } else {
    assert.ok(runtime.includes("IDLE_ADVENTURE_NO_ENERGY_V44")&&runtime.includes("coutEnergie:\n        0,"));
  }
}

// V45 NGU PARITY CONTRACT
{
  const source=fs.readFileSync(new URL("../src/idle-sqlite-runtime.js",import.meta.url),"utf8");
  if (source.includes("GAME-V47-NGU-EARLY")) {
    assert.ok(source.includes("niveauxGagnes: 0"),"EXP ne doit plus produire un niveau joueur global.");
    assert.ok(source.includes("SOREAL_IDLE_V47_LEGACY_DISABLED"),"Les anciens endpoints doivent être neutralisés en V47.");
  } else {
    assert.ok(source.includes("VERSION: 'V45-NGU-PARITY'"));
    assert.ok(source.includes("bossVaincusAventure >= 4"),"Adventure doit être débloquée par le boss 4.");
    assert.ok(source.includes("void bossIndex;\n  return 1;"),"Les boss ne doivent pas être verrouillés par un niveau joueur.");
    assert.ok(source.includes("niveauxGagnes: 0"),"EXP ne doit plus produire un niveau joueur global.");
  }
}
{
  const meta=fs.readFileSync(new URL("../src/idle-ngu-progression.js",import.meta.url),"utf8");
  if (meta.includes("META-V47-EARLYGAME-NGU")) {
    const {IDLE_NGU_EARLY_GAME_TIMELINE}=await import(new URL("../src/idle-ngu-progression.js",import.meta.url));
    const unlocks=Object.fromEntries(IDLE_NGU_EARLY_GAME_TIMELINE.map(entry=>[entry.id,entry.boss]));
    assert.equal(unlocks.adventure,4,"Adventure + Inventory doivent se débloquer au boss 4.");
    assert.equal(unlocks.augmentations,17,"Augmentations doivent se débloquer au boss 17.");
    assert.equal(unlocks.timeMachine,30,"Time Machine doit se débloquer au boss 30.");
    assert.equal(unlocks.magic,37,"Magic + Blood Magic doivent se débloquer au boss 37.");
    assert.equal(unlocks.challenges,58,"Challenges doivent se débloquer au boss 58 dans le périmètre V47.");
    assert.equal(unlocks.titans,58,"Le premier Titan doit être prévu au boss 58 dans le périmètre V47.");
  } else {
    assert.ok(meta.includes('unlock:{bosses:17}'));
    assert.ok(meta.includes('unlock:{bosses:30}'));
    assert.ok(meta.includes('unlock:{bosses:37}'));
    assert.ok(meta.includes('unlock:{item:"aNumber"}'));
    assert.ok(meta.includes('unlock:{item:"giantSeed"}'));
    assert.ok(meta.includes('unlock:{item:"heroicSigil"}'));
  }
}

// Norman (2026-09-11) : "le mode aventure est déjà débloqué [après un
// Rebirth]... il ne doit se débloquer qu'au niveau habituel." Le bloc
// ci-dessous verrouillait auparavant le comportement INVERSE (Aventure/
// Bestiaire permanents une fois atteints via un high-water-mark persistant)
// sur la foi d'une hypothèse jamais vérifiée contre le wiki NGU. Vérifié
// depuis (wiki NGU, page "Rebirths") : "Access to the Adventure... tabs [is
// lost] until their related bosses are beaten... Bosses fought (you go back
// to boss 1)." construireAventureSorealIdle_ et le gate du Bestiaire
// (debloquee) ne doivent donc plus dépendre QUE de row[BOSS_VAINCUS] — le
// compteur DU RUN EN COURS, remis à 0 par renaitreSorealIdle() à chaque
// Renaissance. Le high-water-mark persistant (highestBossEver) reste
// légitime UNIQUEMENT pour la découverte du Bestiaire (Collection), jamais
// pour l'accès au menu/à une zone.
{
  const source=fs.readFileSync(new URL("../src/idle-sqlite-runtime.js",import.meta.url),"utf8");

  const aventureStart=source.indexOf("function construireAventureSorealIdle_(");
  const aventureEnd=source.indexOf("\nfunction ",aventureStart+40);
  const aventureBlock=source.slice(aventureStart,aventureEnd);
  assert.ok(
    aventureBlock.includes("void highestBossEver;"),
    "construireAventureSorealIdle_ ne doit plus utiliser le high-water-mark persistant pour le déblocage."
  );
  assert.ok(
    /const bossVaincusAventure\s*=\s*Math\.max\(\s*0,\s*Math\.floor\(nombreSorealIdle_\(row\[c\.BOSS_VAINCUS - 1\],0\)\)\s*\);/.test(aventureBlock),
    "Le déblocage Aventure doit être calculé UNIQUEMENT sur le compteur du run en cours (row[BOSS_VAINCUS]), jamais combiné avec un high-water-mark."
  );

  const bestiaireStart=source.indexOf("function construireBestiaireSorealIdle_(");
  const bestiaireEnd=source.indexOf("\nfunction ",bestiaireStart+40);
  const bestiaireBlock=source.slice(bestiaireStart,bestiaireEnd);
  assert.ok(
    bestiaireBlock.includes("bossVaincusActuel"),
    "construireBestiaireSorealIdle_ doit distinguer le compteur du run en cours (accès au menu) du high-water-mark historique (découverte)."
  );
  assert.ok(
    bestiaireBlock.includes("debloquee:\n      bossVaincusActuel >= 4,"),
    "Le déblocage DU MENU Bestiaire doit utiliser uniquement le compteur du run en cours (bossVaincusActuel), pas le high-water-mark historique."
  );
  assert.ok(
    bestiaireBlock.includes("index < bossVaincus"),
    "La DÉCOUVERTE d'un boss dans le Bestiaire (Collection) doit rester permanente, elle, via le high-water-mark historique."
  );
}

// Norman (2026-09-10) : "L'inventaire ne doit pas se verrouiller quand on
// rebirth. C'est un déblocage permanent." inventaireDebloque ne dépendait
// que du run en cours (lootsObtenus/inventaire/collection, tous purgeables)
// — même bug déjà corrigé une fois pour Aventure/Bestiaire (bloc
// précédent). Doit maintenant réutiliser le même high-water-mark
// persistant plutôt qu'un mécanisme séparé.
{
  const source=fs.readFileSync(new URL("../src/idle-sqlite-runtime.js",import.meta.url),"utf8");

  const start=source.indexOf("inventaireDebloque:");
  const end=source.indexOf("coutExtensionInventaire:",start);
  const block=source.slice(start,end);

  assert.ok(
    block.includes("row[c.BOSS_VAINCUS - 1]") &&
    block.includes("metaNguEtat.records &&\n                metaNguEtat.records.highestBoss"),
    "inventaireDebloque doit combiner row[BOSS_VAINCUS] (run en cours) avec le high-water-mark persistant metaNguEtat.records.highestBoss, jamais l'un sans l'autre."
  );
  assert.ok(
    block.includes(") >= 4 ||"),
    "Le seuil de déblocage doit être 4 (même boss que l'Aventure), calculé sur le max des deux compteurs."
  );
}

console.log("SOREAL IDLE runtime (rebirth unlocks survive Renaissance): OK");

// Norman (2026-09-09) : "il faut un bouton 'NUKE'" — reproduit la mécanique
// réelle de NGU Idle : avancer instantanément à travers les boss déjà
// largement dépassés en puissance (Défense >= 5x Attaque), en accordant les
// mêmes récompenses qu'une victoire normale, jusqu'au premier boss qui
// résiste. Un kill normal (ou NUKE) laisse toujours combatBossActif=false :
// jamais de chaîne automatique, le joueur doit recliquer Start ou NUKE.
{
  const source=fs.readFileSync(new URL("../src/idle-sqlite-runtime.js",import.meta.url),"utf8");

  assert.ok(
    source.includes("function nukerBossSorealIdle(") &&
    source.includes("nukerBossSorealIdle,"),
    "nukerBossSorealIdle doit exister et être exposée dans IDLE_OPERATIONS."
  );

  const start=source.indexOf("function nukerBossSorealIdle(");
  const end=source.indexOf("\nfunction definirAutoBossSuivantSorealIdle",start);
  const body=source.slice(start,end);

  assert.ok(
    body.includes("if (stats.combatBossActif) {"),
    "NUKE ne doit jamais court-circuiter un combat manuel déjà en cours."
  );
  assert.ok(
    body.includes("if (defenseNuke < attaqueBossNuke * 5) {\n        break;\n      }"),
    "La règle NGU exacte (Défense >= 5x Attaque du boss) doit être respectée pour chaque boss enchaîné."
  );
  assert.ok(
    body.includes(
      "const bossBloqueRenaissanceNuke =\n"+
      "        bossVaincus === bossParMondeSorealIdle_() - 1 &&\n"+
      "        renaissanceNativeCountNuke < 1;"
    ),
    "Le mur \"bloqué jusqu'à la Renaissance\" en fin de monde doit rester infranchissable par NUKE."
  );
  assert.ok(
    body.includes("stats.combatBossActif = false;"),
    "Après NUKE, le combat doit rester arrêté — jamais de chaîne automatique vers le boss suivant."
  );
  assert.ok(
    body.includes("if (!defeated.length) {"),
    "NUKE doit rejeter proprement le cas où aucun boss n'a pu être vaincu (Défense insuffisante)."
  );
  assert.ok(
    body.includes("while (iterations < 500) {"),
    "La boucle NUKE doit rester bornée (jamais de boucle non protégée)."
  );
}

console.log("SOREAL IDLE runtime (NUKE): OK");

