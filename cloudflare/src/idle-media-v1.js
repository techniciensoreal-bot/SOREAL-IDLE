const IDLE_ADVENTURE_R2_PREFIX="idle/backgrounds/adventure/";
const IDLE_ADVENTURE_R2_EXTENSIONS=Object.freeze(["webp","png","jpg","jpeg","avif"]);
/*
 * Dossiers R2 confirmés en direct (2026-09-09) sous idle/aventure/ : un
 * dossier "<Nom>_Mobs" par zone, chacun avec plusieurs monstres normaux et
 * UN fichier "*_boss.<ext>" pour le kill de boss de zone (tous les 10
 * kills, cf. rollKill côté serveur). Mapping explicite plutôt que du
 * matching flou : les noms de dossiers divergent trop des id de zone
 * (2d -> Zone2D_Mobs, mega -> Mega_Lands_Mobs) pour un score fiable.
 */
const IDLE_ADVENTURE_MOBS_R2_PREFIX="idle/aventure/";
/*
 * Correctif 2026-09-17 (Norman a réorganisé idle/aventure/ avec les
 * vrais noms de zone NGU, fichiers Adv_<id>_<nom réel>.png numérotés sur
 * la même plage globale 1-301 que idle/bosses/) : les anciens noms de
 * dossier SOREAL (Tutorial_Mobs, Cave_Mobs...) n'existent plus. Confirmé
 * en direct via un listing R2 temporaire. Ajout des 4 dernières zones
 * (beardverse/badly/boring/chocolate), jamais mappées avant faute
 * d'images. D'autres dossiers existent déjà sur R2 pour des zones NGU
 * post-Chocolate-World pas encore codées ici (Nether_Regions, Rad-Lands,
 * Aethereal_Sea...) — non mappés tant que ces zones n'existent pas dans
 * IDLE_ADVENTURE_ZONES (SOREAL-IDLE), à ajouter le jour où elles le
 * seront, jamais deviné à l'avance.
 */
const IDLE_ADVENTURE_MOB_FOLDERS=Object.freeze({
  tutorial:"Tutorial_Zone",
  sewers:"Sewers",
  forest:"Forest",
  cave:"Cave_of_Many_Things",
  sky:"The_Sky",
  hsb:"High_Security_Base",
  clock:"Clock_Dimension",
  "2d":"The_2D_Universe",
  ancient:"Ancient_Battlefield",
  avsp:"A_Very_Strange_Place",
  mega:"Mega_Lands",
  beardverse:"The_Beardverse",
  badly:"Badly_Drawn_World",
  boring:"Boring-Ass_Earth",
  chocolate:"Chocolate_World"
});

/*
 * Image affichée quand aucun ennemi n'est présent. Le nom est dérivé
 * uniquement de l'id de zone, donc déposer le fichier R2 suffit pour
 * l'activer sans nouveau déploiement. "sewer" est gardé comme alias car
 * Norman utilise ce nom de fichier, tandis que l'id moteur est "sewers".
 */
const IDLE_ADVENTURE_SAFE_ZONE_ALIASES=Object.freeze({
  sewers:["sewer","sewers"]
});
function safeZoneFileNames_(zone){
  const z=String(zone||"").trim().toLowerCase();
  const stems=IDLE_ADVENTURE_SAFE_ZONE_ALIASES[z]||[z];
  const out=[];
  for(const stem of stems){
    for(const ext of IDLE_ADVENTURE_R2_EXTENSIONS){
      out.push(stem+"_safe_zone."+ext);
    }
  }
  return out;
}
const IDLE_BOSSES_R2_PREFIX="idle/bosses/";
const IDLE_ITEMS_R2_PREFIX="idle/items/";
const IDLE_ITEMS_R2_EXTENSIONS=IDLE_ADVENTURE_R2_EXTENSIONS;
const IDLE_ITEM_SET_NAMES=Object.freeze({
  training:"Training Set",
  sewers:"Sewers Set",
  forest:"Forest Set",
  cave:"Cave Set",
  hsb:"HSB Set",
  grb:"GRB Set",
  clock:"Clock Set",
  "2d":"2D Set",
  spoopy:"Spoopy Set",
  jake:"Jake Set",
  uug:"UUG's Rings Set",
  gaudy:"Gaudy Set",
  mega:"Mega Set",
  beardverse:"Beardverse Set",
  badly:"Badly Drawn Set",
  stealth:"Stealth Set",
  choco:"Choco Set",
  wanderer:"Wanderer's Set",
  rerednaw:"S'rerednaW Set",
  slimy:"Slimy Set",
  /*
   * Norman (2026-09-18) : "les images des items sont présentes aussi sur
   * mon R2 mais elles ne sont pas utilisées" — les 17 sets Evil/Sadistic
   * ajoutés côté SOREAL-IDLE (idle-adventure-v47.js, IDLE_ADVENTURE_SETS)
   * n'avaient jamais été enregistrés ici : dossierSetItemR2_ retombait sur
   * l'id brut du set (ex. "edgy") au lieu de son vrai nom affiché ("Edgy
   * Set"), donc ne pouvait jamais faire correspondre un dossier R2 nommé
   * d'après le nom réel du set — même si le dossier ET les images
   * existaient bel et bien sur R2. Noms repris EXACTEMENT du champ `name`
   * de chaque set (idle-adventure-v47.js).
   */
  edgy:"Edgy Set",
  pinkprincess:"Pretty Pink Princess Set",
  meta:"Meta Set",
  party:"Party Set",
  typo:"Typo Set",
  fad:"Fad Set",
  jrpg:"JRPG Set",
  rad:"Rad Set",
  backtoschool:"Back To School Set",
  western:"Western Set",
  bread:"Bread Set",
  disco:"Disco Set",
  halloweenie:"Halloweenie Set",
  construction:"Construction Set",
  duck:"Duck Set",
  dutch:"Dutch Set",
  pirate:"Pirate Set"
});
const IDLE_ITEM_SLOT_ALIASES=Object.freeze({
  head:["head","helmet","helm","hat","casque"],
  chest:["chest","body","torso","armor","armour","plate","plastron","tunique"],
  legs:["legs","leg","pants","trousers","leggings","jambes","jambiere"],
  boots:["boots","boot","shoes","feet","bottes"],
  weapon:["weapon","weapons","sword","blade","stick","gun","arme","epee"],
  ring:["ring","anneau"],
  amulet:["amulet","amulette"],
  necklace:["necklace","collier"],
  pendant:["pendant"],
  alarm:["alarm"],
  sands:["sand","sands"],
  cube:["cube"],
  tie:["tie"],
  paperweight:["paperweight"],
  meat:["meat"],
  greed:["greed"],
  might:["might"],
  utility:["utility"],
  energy:["energy"],
  magic:["magic"],
  /*
   * Norman (2026-09-18) : mêmes 17 sets Evil/Sadistic que ci-dessus —
   * chacun a 1 ou 2 accessoires/armes secondaires avec un nom de slot
   * propre (idle-adventure-v47.js, IDLE_ADVENTURE_SETS), jamais un slot
   * générique déjà connu (ring/amulet/etc.) : sans alias, scoreObjetItemR2_
   * ne pouvait donner aucun bonus de correspondance de slot pour ces
   * pièces, même quand le fichier R2 nomme explicitement le slot.
   */
  charmInfinity:["infinity","infinitycharm"],
  charm69:["69","69charm"],
  cup:["cup","plasticredcup","redcup"],
  whistle:["whistle","partywhistle"],
  asscessory:["asscessory"],
  eyeElxu:["eyeofelxu","eyeelxu"],
  pokeymanCard:["pokeyman","pokeymancard"],
  krazyBonez:["krazybonez","bonez"],
  zipper:["zipper","giganticzipper"],
  wig:["wig","animeherowig"],
  notDrugs:["notdrugs"],
  gloveOfPower:["gloveofpower","glove"],
  theS:["thes"],
  walkman:["walkman"],
  corgi:["corgi","battlecorgi"],
  bandana:["bandana","pinkbandana"],
  baguette:["baguette","daybaguette"],
  creamPie:["creampie"],
  yeast:["yeast","spoonfulofyeast"],
  vinylShard:["vinylrecordshard","vinylshard"],
  whitePowder:["whitepowder"],
  rollingPaper:["rollingpaper"],
  apple:["ordinaryapple","apple"],
  toiletPaper:["toiletpaper","rolloftoiletpaper"],
  pandora:["pandorasbox","pandora"],
  hammer:["woodenhammer","hammer"],
  toolbox:["toolbox"],
  levelLevel:["levellevel"],
  shotgun:["shotgun"],
  ducktTape:["ducktape","someducktape"],
  duckCaller:["duckcaller"],
  tulip:["blacktulip","tulip"],
  netherlands:["pocketnetherlands","netherlands"],
  cheese:["combatcheese","cheese"],
  cutlass:["cutlass"],
  eyepatch:["giantseyepatch","eyepatch"],
  compass:["compass"]
});
/*
 * Correctif 2026-09-18 (Norman, en direct : "les images des items ne sont
 * toujours pas les bonnes... où va-t-il chercher les images ?") — cause
 * RÉELLE enfin confirmée via un listing R2 live (/api/idle/media/debug-list,
 * ajouté entre-temps par un autre process) : idle/items/ est 100% PLAT,
 * AUCUN sous-dossier par set n'a jamais existé (dossierSetItemR2_/
 * scoreDossierItemR2_ ci-dessous, tout l'édifice "trouver le dossier du
 * set", cherchaient donc toujours un dossier qui n'existe pas — 0 objet
 * listé, 404 systématique, quel que soit le set). Chaque fichier réel
 * suit `Item_<ID global>_<Vrai nom NGU>.<ext>` (ex. Item_0043_Crappy_Boots.
 * png) — le vrai nom NGU, jamais le nom générique posé côté SOREAL-IDLE
 * (idle-adventure-v47.js, fonction item() : name=`${set.name} ${slot}`,
 * ex. "Training Set boots", qui ne ressemble à aucun fichier réel).
 *
 * Sans set réellement séparé par dossier, la résolution devient : lister
 * TOUT idle/items/ à plat (objetsDossierItemR2_ ci-dessous, réutilisé tel
 * quel avec IDLE_ITEMS_R2_PREFIX comme unique préfixe) et chercher le
 * VRAI nom NGU de la pièce. Comme ce vrai nom n'existe nulle part côté
 * SOREAL-IDLE pour l'équipement (contrairement aux SPECIALS, dont
 * `name` EST déjà le vrai nom NGU — "Tuba of Time", "Cheese Grater"... —
 * ceux-là résolvent donc déjà correctement une fois le pool à plat),
 * cette table associe explicitement chaque (set, slot) du catalogue
 * d'équipement (idle-adventure-v47.js, IDLE_ADVENTURE_SETS) au vrai nom
 * NGU de la pièce, sourcé des commentaires d'audit wiki déjà présents
 * dans ce fichier (V143, blocs "Evilverse" 2026-09-18) et vérifié contre
 * le listing R2 réel. `sewers` n'a aucun commentaire source direct :
 * inféré du seul bloc R2 non réclamé par un autre set (Cloth Hat/Shirt/
 * Leggings/Boots + A Stick, Item_0062-0065/0075) — à corriger si jamais
 * démenti en jeu.
 */
const IDLE_ITEM_SLOT_R2_NAME=Object.freeze({
  training:{head:"Cloth Hat",chest:"Cloth Shirt",legs:"Cloth Leggings",boots:"Cloth Boots",weapon:"A Stick"},
  sewers:{head:"Crappy Helmet",chest:"Crappy Chestplate",legs:"Crappy Leggings",boots:"Crappy Boots",weapon:"Rusty Sword",ring:"Gross Ring",amulet:"Cracked Amulet"},
  forest:{head:"Forest Helmet",chest:"Forest Chestplate",legs:"Forest Leggings",boots:"Forest Boots",weapon:"Kokiri Blade",ring:"Mossy Ring",pendant:"Forest Pendant"},
  cave:{head:"Blue Cheese Helmet",chest:"Gouda Chestplate",legs:"Swiss Leggings",boots:"Limburger Boots",weapon:"Mole Hammer",ring:"Havarti Ring",amulet:"Cheddar Amulet",combat:"Combat Cheese"},
  hsb:{head:"Magitech Helmet",chest:"Magitech Chestplate",legs:"Magitech Leggings",boots:"Magitech Boots",weapon:"Magitech Blade",ring:"Magitech Ring",amulet:"Magitech Amulet"},
  grb:{head:"Chefs Hat",chest:"Chefs Apron",legs:"Regular Pants",boots:"Non Slip Shoes",weapon:"Bloody Cleaver",necklace:"Suspicious Sausage Necklace",meat:"Raw Slab of Meat"},
  clock:{head:"Clockwork Hat",chest:"Clockwork Chest",legs:"Clockwork Pants",boots:"Clockwork Boots",weapon:"A Comically Oversized Minute-Hand",alarm:"Alarm Clock",sands:"The Sands of Time"},
  "2d":{head:"Circle Helmet",chest:"Square Chestpiece",legs:"Rectangle Pants",boots:"Polygon Boots",weapon:"A Triangle",cube:"THE CUBE",amulet:"King Circles Amulet of Helping Random Stuff"},
  spoopy:{head:"Spoopy Helmet",chest:"Ghostly Chest",legs:"Pants of Horror",boots:"Spectral Boots",weapon:"Spooky Sword",ring:"Cursed Ring",amulet:"Amulet of Sunshine Sparkles and Gore"},
  jake:{head:"Office Hat",chest:"Office Shirt",legs:"Office Pants",boots:"Office Shoes",weapon:"The Pen-Is",tie:"A Regular Tie",paperweight:"Generic Paperweight"},
  gaudy:{head:"Gaudy Hat",chest:"Gaudy Shirt",legs:"Gaudy Pants",boots:"Gaudy Boots",weapon:"Paper Fan"},
  mega:{head:"Mega Helmet",chest:"Mega Chest",legs:"Mega Blue Jeans",boots:"Mega Boots",weapon:"Beam Laser Sword"},
  beardverse:{head:"Groucho Marx Disguise",chest:"Gossamer Chest",legs:"Braided Beard Legs",boots:"Fuzzy Orange Cheeto Slippers!",weapon:"Bearded Axe"},
  badly:{head:"Badly Drawn Smiley Face",chest:"Badly Drawn Chest",legs:"Badly Drawn Pants",boots:"Badly Drawn Foot",weapon:"Badly Drawn Gun"},
  stealth:{head:"Stealthy Hat",chest:"Stealthy Chest",legs:"No Pants",boots:"High Heeled Boots",weapon:"A Giant Bazooka"},
  choco:{head:"Chocolate Helmet",chest:"Chocolate Chest",legs:"Chocolate Pants",boots:"Chocolate Boots",weapon:"Chocolate Crowbar"},
  uug:{ringGreed:"Ring of Greed",ringMight:"Ring of Might",ringUtility:"Ring of Utility",ringEnergy:"Ring of Way Too Much Energy",ringMagic:"Ring of Way Too Much Magic"},
  wanderer:{head:"Wanderers Hat",chest:"Wanderers Chest",legs:"Wanderers Pants",boots:"Wanderers Boots"},
  rerednaw:{head:"taH srerednaW",chest:"tsehC srerednaW",legs:"stnaP srerednaW",boots:"stooB srerednaW"},
  slimy:{head:"Slimy Helmet",chest:"Slimy Chest",legs:"Slimy Pants",boots:"Slimy Boots",weapon:"The Fists of Flubber"},
  edgy:{head:"Edgy Helmet",chest:"Edgy Chest",legs:"Edgy Pants",boots:"BOTH Edgy Boots",weapon:"Edgy Jaw Axe",amulet:"A Cheap Plastic Amulet"},
  pinkprincess:{head:"Clown Hat",chest:"Fabulous Super Chest",legs:"A Crappy Tutu",boots:"Pretty Pink Slippers",weapon:"Giant Sticky Foot",amulet:"A Pretty Pink Bow"},
  meta:{head:"Numerical Head",chest:"Numerical Chest",legs:"Numerical Legs",boots:"Numerical Boots",weapon:"The Number 7",charmInfinity:"Infinity Charm",charm69:"69 Charm"},
  party:{head:"Party Hat",chest:"Pogmail Chest",legs:"Tear Away Pants",boots:"Pizza Boots",weapon:"The God of Thunders Hammer",cup:"Plastic Red Cup",whistle:"Party Whistle"},
  typo:{head:"Hamlet",chest:"Chess Plate",legs:"Logs",boots:"Booms",weapon:"Wee pin",asscessory:"The Ass-cessory",eyeElxu:"Eye of ELXU"},
  fad:{head:"Spinning Tophat",chest:"Demonic Flurbie Chestplate",legs:"AAA Battery Legs",boots:"Slinky Boots",weapon:"THE MALF SLAMMER",pokeymanCard:"Rare Foil Pokeyman Card",krazyBonez:"A handful of Krazy Bonez"},
  jrpg:{head:"Buster Sword Top",chest:"Buster Sword Upper",legs:"Buster Sword Lower",boots:"Buster Sword Bottom",weapon:"Gift Shop Buster Sword Replica",zipper:"A Gigantic Zipper",wig:"Anime Hero Wig"},
  rad:{head:"Cool Shades",chest:"Leather Jacket",legs:"Flamin Hot Shorts",boots:"A Skateboard",weapon:"Nunchuks",notDrugs:"Not Drugs",gloveOfPower:"The Glove of Power"},
  backtoschool:{head:"Dunce Cap",chest:"School Jersey",legs:"ULTRAWIDE Pants",boots:"Shoes With Wheels",weapon:"Floppy Elastic Ruler",theS:"THE S",walkman:"A Walkman"},
  western:{head:"A 10 Litre Hat",chest:"Asslest Vest",legs:"Assful Chaps",boots:"Extra Spiky Spurs",weapon:"The Six Shooter",corgi:"A Battle Corgi",bandana:"A Pink Bandana"},
  bread:{head:"Bread Bowl Helmet",chest:"Paper Thin Crepe Cape",legs:"Flour Sack Pants",boots:"Gingerbread Boots",weapon:"A Rolling Pin",baguette:"1 Day-Old Baguette",creamPie:"A Cream Pie",yeast:"A Spoonful of Yeast"},
  disco:{head:"Disco Ball Helmet",chest:"Disco Shirt",legs:"Bell Bottoms",boots:"Roller Skates",weapon:"A Rusty Old Sabre",vinylShard:"A Vinyl Record Shard",whitePowder:"A Bit of White Powder",rollingPaper:"Some Rolling Paper"},
  halloweenie:{head:"Neck Bolts",chest:"Skeleton Shirt",legs:"A Broomstick",boots:"Fuzzy Boots",weapon:"A Giant Scythe",apple:"An Ordinary Apple",toiletPaper:"A Roll of Toilet Paper",pandora:"Pandoras Box"},
  construction:{head:"A Hardhat",chest:"High Visibility Vest",legs:"Yet Another Generic Pair Of Jeans",boots:"Steel Toed Boots",weapon:"A Giant Wrecking Ball",hammer:"A Wooden Hammer",toolbox:"The Toolbox",levelLevel:"A Level Level"},
  duck:{head:"A Fake Duckbill",chest:"An Inflatable Ducky Innertube",legs:"Duck Duck Shorts",boots:"Duck Slippers",weapon:"The Zapper",shotgun:"A shotgun",ducktTape:"Some Duck-t Tape",duckCaller:"A Duck Caller"},
  dutch:{head:"A Dutch Hat",chest:"Windmill Shirt",legs:"Stroopwaffel Pants",boots:"Clogs",weapon:"Weaponized Hollandaise sauce",tulip:"Black Tulip",netherlands:"Pocket Netherlands",cheese:"Rest of the Combat Cheese"},
  pirate:{head:"Pirate Hat",chest:"Swashbuckler Chest",legs:"Piratey Pants",boots:"Piratey Peglegs",weapon:"The Flintlock",cutlass:"The Cutlass",eyepatch:"A Giants Eyepatch",compass:"A Compass!"}
});
/*
 * Correctif 2026-09-18 (trouvé en vérifiant en direct sur prod, avant
 * même que Norman ne le signale) : itemSet_ reçoit `slot` déjà passé en
 * minuscules (paramItemR2_(url,"slot",40).toLowerCase(), ligne ci-
 * dessous) — head/chest/legs/boots/weapon ne s'en apercevaient jamais
 * (déjà tout en minuscules), mais les 5 slots camelCase du set uug
 * (ringGreed/ringMight/ringUtility/ringEnergy/ringMagic, copiés tels
 * quels depuis IDLE_ADVENTURE_SETS.uug.slots) ne matchaient plus jamais
 * leur clé dans IDLE_ITEM_SLOT_R2_NAME.uug ("ringgreed" ≠ "ringGreed") —
 * 404 systématique pour les 5 anneaux UUG malgré une entrée correcte
 * dans la table. Comparaison insensible à la casse plutôt que de
 * renoncer au lowercase en amont (qui alimente aussi normaliserNomItemR2_
 * ailleurs, où la casse n'a jamais d'importance).
 */
/*
 * 2026-09-18 — Compatibilité avec les anciens snapshots IDLE qui ne
 * transportaient pas encore wikiItemId. Le moteur IDLE expose désormais
 * l'ID wiki canonique pour TOUT son catalogue ; cette petite table reste
 * seulement pour les six objets du correctif initial déjà déployé.
 *
 * Priorité réelle de itemSet_ : wikiItemId reçu du moteur > cette table
 * legacy par definitionId > résolution historique par nom/slot.
 */
const IDLE_ITEM_R2_ID_BY_DEFINITION=Object.freeze({
  "training:head":62,
  "training:chest":63,
  "training:legs":64,
  "training:boots":65,
  "training:weapon":75,
  tutorialCube:77
});
function idObjetItemR2_(object){
  const file=String(object&&object.key||"").split("/").pop();
  const m=file.match(/^Item_(\d+)_/i);
  return m?Number(m[1]):0;
}
function choisirObjetItemR2ParId_(objects,itemId,itemName="",slot="",setId=""){
  const target=Number(itemId)||0;
  if(!target||!Array.isArray(objects))return null;
  const candidates=objects.filter(object=>idObjetItemR2_(object)===target);
  if(!candidates.length)return null;
  if(candidates.length===1)return candidates[0];

  /*
   * Quelques IDs ont plusieurs variantes R2 (_Alt/_TierN/-0). L'ID reste
   * la clé primaire ; le nom ne sert qu'à départager les fichiers qui
   * partagent CET ID. À score égal, le nom de fichier le plus court est
   * le fichier canonique sans suffixe.
   */
  const ranked=candidates
    .map(object=>({
      object,
      ...scoreObjetItemR2_(object,itemName,slot,setId),
      stem:String(object&&object.key||"").split("/").pop().replace(/\.[^.]+$/,"")
    }))
    .sort((a,b)=>b.score-a.score||a.stem.length-b.stem.length||String(a.key).localeCompare(String(b.key)));
  return ranked[0]?.object||null;
}
function choisirObjetItemR2ParDefinition_(objects,definitionId,itemName="",slot="",setId=""){
  const target=Number(IDLE_ITEM_R2_ID_BY_DEFINITION[String(definitionId||"")])||0;
  return choisirObjetItemR2ParId_(objects,target,itemName,slot,setId);
}
function choisirObjetItemR2ParIdEtTier_(objects,itemId,tier,itemName="",slot="",setId=""){
  const target=Number(itemId)||0;
  const niveau=Math.max(0,Math.floor(Number(tier)||0));
  if(!target||!Array.isArray(objects))return null;

  const exactName=("Item_"+String(target).padStart(4,"0")+"_THE_CUBE_Tier"+niveau+".png").toLowerCase();
  const exact=objects.find(object=>{
    const file=String(object&&object.key||"").split("/").pop().toLowerCase();
    return file===exactName;
  });
  if(exact)return exact;

  const suffix=("tier"+niveau).toLowerCase();
  const tierCandidates=objects.filter(object=>{
    if(idObjetItemR2_(object)!==target)return false;
    const stem=String(object&&object.key||"")
      .split("/")
      .pop()
      .replace(/\.[^.]+$/,"");
    return normaliserNomItemR2_(stem).endsWith(suffix);
  });

  return tierCandidates.length
    ?choisirObjetItemR2ParId_(tierCandidates,target,itemName,slot,setId)
    :null;
}


function itemR2NameOverride_(setId,slot){
  const bySet=IDLE_ITEM_SLOT_R2_NAME[setId];
  if(!bySet)return "";
  const slotBas=String(slot||"").toLowerCase();
  for(const cle of Object.keys(bySet)){
    if(cle.toLowerCase()===slotBas)return bySet[cle];
  }
  return "";
}

const idleItemObjectsCache=new Map();

function nomZoneAdventureR2(value){
  const name=String(value||"").trim();
  if(!name||name.length>140)return "";
  if(name.includes("/")||name.includes("\\")||name.includes("\0")||name.includes(".."))return "";
  return name;
}
function typeMediaAdventureR2(key){
  const ext=String(key||"").split(".").pop().toLowerCase();
  return {webp:"image/webp",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",avif:"image/avif"}[ext]||"application/octet-stream";
}
function mediaHeaders_(source,ttl){
  const h=new Headers(source||{});
  h.delete("set-cookie");
  h.set("cache-control","public, max-age="+String(ttl)+", stale-while-revalidate=86400");
  h.set("x-content-type-options","nosniff");
  return h;
}
function normaliserNomItemR2_(value){
  let s=String(value||"").trim();
  try{s=s.normalize("NFD").replace(/[̀-ͯ]/g,"");}catch(_){}
  return s.toLowerCase().replace(/[^a-z0-9]+/g,"");
}
function paramItemR2_(url,name,max){
  const value=String(url.searchParams.get(name)||"").trim();
  if(!value||value.length>max||value.includes(" ")||value.includes(".."))return "";
  return value;
}
async function objetsDossierItemR2_(env,prefix){
  const now=Date.now();
  const cached=idleItemObjectsCache.get(prefix);
  if(cached&&now-cached.at<300000)return cached.value;

  let objects=[];
  let cursor=undefined;
  do{
    const opts={prefix,limit:1000};
    if(cursor)opts.cursor=cursor;
    const listed=await env.SOREAL_R2.list(opts);
    if(listed&&Array.isArray(listed.objects))objects=objects.concat(listed.objects);
    cursor=listed&&listed.truncated&&listed.cursor?listed.cursor:undefined;
  }while(cursor&&objects.length<5000);

  objects=objects.filter(object=>{
    const key=String(object&&object.key||"");
    const ext=key.split(".").pop().toLowerCase();
    return IDLE_ITEMS_R2_EXTENSIONS.includes(ext);
  });

  idleItemObjectsCache.set(prefix,{at:now,value:objects});
  return objects;
}
/*
 * Correctif 2026-09-18 : les vrais fichiers R2 sont nommés
 * `Item_<ID global>_<Vrai nom>.<ext>` (ex. Item_0043_Crappy_Boots.png) —
 * l'ID numérique (jamais présent côté SOREAL-IDLE) empêchait toute
 * correspondance EXACTE avec le vrai nom seul (base restait
 * "item0043crappyboots" ≠ "crappyboots"), le repli sur `includes()`
 * absorbant l'écart. Le retirer avant de normaliser rend l'égalité
 * stricte enfin atteignable (bonus de score le plus élevé), ce qui
 * départage automatiquement le fichier de base d'une variante suffixée
 * (_Alt/_lvl1/_lvl100/_TierN, aussi présentes sur R2 pour certains
 * objets) sans logique dédiée : seul le nom EXACT obtient 1200, une
 * variante suffixée ne peut jamais dépasser 900 (includes()).
 */
function scoreObjetItemR2_(object,itemName,slot,setId){
  const key=String(object&&object.key||"");
  const file=key.split("/").pop().replace(/\.[^.]+$/,"").replace(/^Item_\d+_/i,"");
  const base=normaliserNomItemR2_(file);
  const nom=normaliserNomItemR2_(itemName);
  const setNom=normaliserNomItemR2_(IDLE_ITEM_SET_NAMES[setId]||setId);
  const slotCle=normaliserNomItemR2_(slot);
  const aliases=(IDLE_ITEM_SLOT_ALIASES[slot]||[]).map(normaliserNomItemR2_);

  let score=0;
  let specific=0;
  if(nom&&base===nom){score+=1200;specific+=1200;}
  else if(nom&&base.includes(nom)){score+=900;specific+=900;}

  const nomSansSet=setNom&&nom.startsWith(setNom)?nom.slice(setNom.length):nom;
  if(nomSansSet&&base.includes(nomSansSet)){score+=500;specific+=500;}

  if(slotCle&&base.includes(slotCle)){score+=400;specific+=400;}
  for(const alias of aliases){
    if(alias&&base.includes(alias)){score+=300;specific+=300;break;}
  }
  if(setNom&&base.includes(setNom))score+=80;

  const ext=key.split(".").pop().toLowerCase();
  if(ext==="webp")score+=25;
  else if(ext==="avif")score+=20;
  else if(ext==="png")score+=15;

  return {score,specific,key};
}
function choisirObjetItemR2_(objects,itemName,slot,setId){
  if(!Array.isArray(objects)||!objects.length)return null;
  if(objects.length===1)return objects[0];

  const ranked=objects
    .map(object=>({object,...scoreObjetItemR2_(object,itemName,slot,setId)}))
    .sort((a,b)=>b.score-a.score||String(a.key).localeCompare(String(b.key)));

  if(!ranked[0]||ranked[0].specific<=0)return null;
  return ranked[0].object;
}
/*
 * Correctif 2026-09-17 (Norman : "les nouveaux boosts Power s'affichent
 * correctement après remplacement d'images sur R2, mais les deux autres
 * familles de boosts utilisent encore les anciennes images") — vérifié en
 * direct en production : la résolution serveur (itemSet_/boostImage_) est
 * déjà 100% correcte pour les 3 familles de boosts à tous les paliers
 * (chaque appel resolvait déjà le bon fichier R2 exact via l'en-tête
 * x-soreal-idle-r2-key). Le vrai problème est un cache HTTP trop long :
 * cette fonction, PARTAGÉE par itemSet_ (équipement) ET boostImage_
 * (boosts), servait un cache-control de 24h + 24h stale-while-revalidate
 * sur une URL qui ne change JAMAIS quand Norman remplace le contenu d'un
 * fichier R2 sous le même nom — jusqu'à 48h de latence possible avant
 * qu'un navigateur ne revalide. Les endpoints jumeaux (adventureMob_,
 * adventureZone_, ~L355/L441) utilisent déjà un TTL de 300s, aligné sur le
 * cache mémoire de la liste R2 (idleItemObjectsCache, 300000ms) : "Power"
 * semblait fonctionner uniquement parce que ses images avaient été
 * remplacées plus tôt (le cache avait eu le temps d'expirer tout seul),
 * pas parce qu'un chemin de code différent le traitait. Alignement sur le
 * même TTL de 300s que ses endpoints jumeaux, jamais une nouvelle logique.
 */
async function reponseObjetR2_(request,env,object){
  if(!object||!object.key)return new Response("Image d'objet introuvable",{status:404,headers:{"cache-control":"public, max-age=60"}});
  const full=await env.SOREAL_R2.get(object.key);
  if(!full)return new Response("Image d'objet introuvable",{status:404,headers:{"cache-control":"public, max-age=60"}});
  const headers=new Headers();
  if(typeof full.writeHttpMetadata==="function")full.writeHttpMetadata(headers);
  if(!headers.has("content-type"))headers.set("content-type",typeMediaAdventureR2(object.key));
  if(full.httpEtag)headers.set("etag",full.httpEtag);
  headers.set("x-soreal-idle-r2-key",String(object.key));
  return new Response(request.method==="HEAD"?null:full.body,{
    status:200,
    headers:mediaHeaders_(headers,300)
  });
}

/*
 * Norman (2026-09-17) : "Voilà ils y sont dans boss" (301 images de boss
 * remplacées sur R2). Bug réel trouvé en testant en direct : les boss
 * 1 à ~50 renvoyaient 404 alors que 100+ fonctionnaient. Cause confirmée
 * : ce listing s'arrêtait dès 200 clés accumulées (objects.length<200),
 * une limite pensée pour les dossiers Adventure/joueur (quelques
 * fichiers chacun) — jamais mise à jour quand le dossier boss est passé
 * à ~300 fichiers. R2 trie les clés par ordre d'octets, où "_" (0x5F)
 * est plus grand que les chiffres (0x30-0x39) : "Boss_1_" trie donc
 * APRÈS tous ses préfixes "Boss_1X_"/"Boss_1XX_", et pareil pour "2",
 * "5", "20"... — la coupure à 200 tombait donc en plein milieu de la
 * vraie plage numérique, coupant exactement les boss actuellement
 * jouables (1-50) plutôt que les plus hauts ID. Relevé à 2000 (même
 * borne que clesAdventureR2_ plus bas), largement suffisant pour 301
 * boss + marge de croissance.
 */
let idleMobObjectsCache=new Map();
async function objetsDossierMobR2_(env,prefix){
  const now=Date.now();
  const cached=idleMobObjectsCache.get(prefix);
  if(cached&&now-cached.at<300000)return cached.value;

  let objects=[],cursor=undefined;
  do{
    const opts={prefix,limit:1000};
    if(cursor)opts.cursor=cursor;
    const listed=await env.SOREAL_R2.list(opts);
    if(listed&&Array.isArray(listed.objects))objects=objects.concat(listed.objects.map(o=>o.key));
    cursor=listed&&listed.truncated&&listed.cursor?listed.cursor:undefined;
  }while(cursor&&objects.length<2000);

  objects=objects.filter(key=>{
    const ext=String(key).split(".").pop().toLowerCase();
    return IDLE_ADVENTURE_R2_EXTENSIONS.includes(ext);
  });

  idleMobObjectsCache.set(prefix,{at:now,value:objects});
  return objects;
}
/*
 * Norman (2026-09-16) : "j'ai plusieurs images qui sont utilisée pour le
 * même mob. Ce qui fait que dans collection, je n'ai jamais tous les
 * mobs. Il remplace juste par la nouvelle image. Chacune des image doit
 * être reliée à un ennemi."
 *
 * Deux bugs confirmés en inspectant les vraies clés R2 en direct
 * (/api/idle/media/mob?zone=X&boss=0&seed=N, en-tête x-soreal-idle-r2-key) :
 *
 * 1. La regex de détection boss (`/_boss\.[a-z0-9]+$/i`, un SUFFIXE)
 *    n'a jamais matché aucun vrai fichier — tous les vrais fichiers boss
 *    sont nommés `<zone>_boss_<description>.webp` (boss en INFIXE, avant
 *    une description). bossKeys était donc toujours vide : une demande
 *    "boss=1" retombait silencieusement sur une image normale au hasard.
 *
 * 2. `seed` était haché (seed*31+charCode) puis réduit modulo la taille
 *    du pool — un simple numéro de graine différent (ex. index 0 vs 1)
 *    pouvait retomber sur LA MÊME image après hachage+modulo sur un
 *    petit pool (3 à 8 images), ce qui empêchait de facto d'assigner une
 *    image stable et DISTINCTE à chaque mob individuellement suivi
 *    (voir startZoneFight/construireBestiaireSorealIdle_ côté moteur,
 *    qui suivent désormais chaque image par un vrai INDEX de catalogue,
 *    pas une graine dérivée des rencontres cumulées de toute la zone).
 *
 * Les pools sont désormais triés (ordre stable, indépendant de l'ordre
 * de retour de R2.list()) et indexés directement — index%pool.length,
 * jamais un hachage qui pourrait faire collisionner deux mobs distincts
 * sur la même image.
 *
 * Correctif 2026-09-16 (Norman, Tutorial : "il manque l'épouvantail et
 * qu'on voit 2 fois l'image du boss") : `tutorial_cardboard_foreman_boss.webp`
 * a "boss" en SUFFIXE (juste avant l'extension), pas en infixe — la regex
 * `/_boss_/i` (qui exige un "_" des DEUX côtés) ne le reconnaissait donc
 * jamais comme fichier boss. Ce fichier tombait dans normalKeys, décalant
 * tout le pool trié : l'index 0 (prévu pour un mob normal) retombait sur
 * l'image du boss (déjà servie par le repli sans bossKeys), et le vrai
 * dernier mob normal (scarecrow) n'était plus jamais atteint par aucun
 * index de catalogue. "boss" peut donc être un mot entier délimité par
 * "_"/début/fin-de-nom-avant-extension, en INFIXE OU EN SUFFIXE.
 */
/*
 * Correctif 2026-09-17 (Norman a réorganisé idle/aventure/ avec les vrais
 * noms/numéros NGU) : les nouveaux fichiers "Adv_<id>_<nom réel>.ext" ne
 * portent plus aucun marqueur "boss" dans leur nom (contrairement à
 * l'ancienne convention <zone>_boss_<description>). Vérifié en direct
 * (listing R2) : dans chaque dossier de zone, le fichier au plus GRAND id
 * global correspond systématiquement au seuil de déblocage de la zone
 * suivante (IDLE_ADVENTURE_ZONES[].boss côté SOREAL-IDLE, ex. Tutorial
 * s'arrête à Adv_004 = seuil 4, Sewers à Adv_007 = seuil 7, Cave à
 * Adv_037 = seuil 37) -- donc traité comme "le" boss de la zone pour ce
 * repère visuel. Approximation assumée pour les zones à plusieurs boss
 * bestiaire (ex. Forêt : Rat of Unusual Size n'est pas le plus haut id) :
 * ce module reste volontairement une couche cosmétique découplée du
 * moteur de jeu réel (cf. commentaire idle-adventure-v47.js), donc une
 * créature réelle de la même zone au lieu de LA créature exacte tirée
 * reste largement acceptable ici. L'ancien marqueur "_boss_"/"_boss."
 * reste essayé en repli pour ne jamais casser un dossier qui ne serait
 * pas encore migré vers la nouvelle convention.
 */
function choisirCleMobR2_(keys,boss,indexValue){
  const idsParCle=new Map();
  for(const k of keys){
    const file=String(k).split("/").pop();
    const m=file.match(/^Adv_(\d+)_/i);
    if(m)idsParCle.set(k,Number(m[1]));
  }
  let bossKeys,normalKeys;
  if(idsParCle.size===keys.length&&idsParCle.size>0){
    const maxId=Math.max(...idsParCle.values());
    bossKeys=keys.filter(k=>idsParCle.get(k)===maxId).sort();
    normalKeys=keys.filter(k=>idsParCle.get(k)!==maxId).sort();
  }else{
    bossKeys=keys.filter(k=>/(^|_)boss(_|\.[a-z0-9]+$)/i.test(k)).sort();
    normalKeys=keys.filter(k=>!/(^|_)boss(_|\.[a-z0-9]+$)/i.test(k)).sort();
  }
  const pool=
    boss&&bossKeys.length
      ?bossKeys
      :(normalKeys.length?normalKeys:keys.slice().sort());
  if(!pool.length)return "";

  const rawIndex=Math.trunc(Number(indexValue))||0;
  const index=((rawIndex%pool.length)+pool.length)%pool.length;
  return pool[index];
}
async function adventureMob_(request,env,url){
  const zone=String(url.searchParams.get("zone")||"").trim().toLowerCase();
  const folder=IDLE_ADVENTURE_MOB_FOLDERS[zone];
  if(!folder)return new Response("Zone Adventure invalide",{status:400,headers:{"cache-control":"no-store"}});
  if(!env.SOREAL_R2||typeof env.SOREAL_R2.list!=="function"||typeof env.SOREAL_R2.get!=="function"){
    return new Response("Média de monstre indisponible",{status:503,headers:{"cache-control":"no-store"}});
  }

  const keys=(await objetsDossierMobR2_(env,IDLE_ADVENTURE_MOBS_R2_PREFIX+folder+"/"))
    .filter(k=>!/_safe_zone\.[a-z0-9]+$/i.test(String(k)));
  const key=choisirCleMobR2_(
    keys,
    url.searchParams.get("boss")==="1",
    url.searchParams.get("seed")
  );
  if(!key)return new Response("Image de monstre introuvable",{status:404,headers:{"cache-control":"public, max-age=60"}});

  const object=await env.SOREAL_R2.get(key);
  if(!object)return new Response("Image de monstre introuvable",{status:404,headers:{"cache-control":"public, max-age=60"}});
  const headers=new Headers();
  if(typeof object.writeHttpMetadata==="function")object.writeHttpMetadata(headers);
  if(!headers.has("content-type"))headers.set("content-type",typeMediaAdventureR2(key));
  if(object.httpEtag)headers.set("etag",object.httpEtag);
  headers.set("x-soreal-idle-r2-key",key);
  return new Response(request.method==="HEAD"?null:object.body,{
    status:200,
    headers:mediaHeaders_(headers,300)
  });
}
async function adventureSafeZone_(request,env,url){
  const zone=String(url.searchParams.get("zone")||"tutorial").trim().toLowerCase();
  const folder=IDLE_ADVENTURE_MOB_FOLDERS[zone];
  if(!folder)return new Response("Zone Adventure invalide",{status:400,headers:{"cache-control":"no-store"}});
  if(!env.SOREAL_R2||typeof env.SOREAL_R2.get!=="function"){
    return new Response("Média Safe Zone indisponible",{status:503,headers:{"cache-control":"no-store"}});
  }

  const files=safeZoneFileNames_(zone);
  const prefixes=[
    IDLE_ADVENTURE_R2_PREFIX,
    IDLE_ADVENTURE_MOBS_R2_PREFIX,
    IDLE_ADVENTURE_MOBS_R2_PREFIX+folder+"/",
    "idle/"
  ];

  for(const prefix of prefixes){
    for(const file of files){
      const key=prefix+file;
      const object=await env.SOREAL_R2.get(key);
      if(object){
        return reponseObjetR2_(request,env,{key});
      }
    }
  }

  return new Response("Image Safe Zone introuvable",{
    status:404,
    headers:{"cache-control":"public, max-age=60"}
  });
}

const IDLE_PIPER_MODEL_ROUTE_V1="/api/idle/media/piper-model.onnx";
const IDLE_PIPER_MODEL_CONFIG_ROUTE_V1=IDLE_PIPER_MODEL_ROUTE_V1+".json";
/*
 * Demande utilisateur (2026-09-22) : une seule voix, sans choix. "Tom"
 * (fr_FR-tom-medium) choisi après écoute des voix officielles Piper via
 * https://rhasspy.github.io/piper-samples/ — c'est le plafond de qualité
 * réellement disponible côté français (aucune voix "high" n'existe dans
 * le catalogue officiel rhasspy/piper-voices).
 */
const IDLE_PIPER_MODEL_UPSTREAM_V1=
  "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR/tom/medium/fr_FR-tom-medium.onnx";

async function piperModelProxy_(request,url){
  const path=String(url.pathname||"");
  const isConfig=path===IDLE_PIPER_MODEL_CONFIG_ROUTE_V1;
  if(!isConfig&&path!==IDLE_PIPER_MODEL_ROUTE_V1){
    return new Response("Voix Piper inconnue",{status:404,headers:{"cache-control":"no-store"}});
  }

  const upstreamUrl=IDLE_PIPER_MODEL_UPSTREAM_V1+(isConfig?".json":"");
  const upstream=await fetch(upstreamUrl,{
    method:request.method==="HEAD"?"HEAD":"GET",
    headers:{
      accept:isConfig?"application/json,*/*":"application/octet-stream,*/*"
    },
    cf:{cacheEverything:true,cacheTtl:604800}
  });

  if(!upstream.ok){
    return new Response("Modèle vocal Piper indisponible",{
      status:502,
      headers:{"cache-control":"no-store"}
    });
  }

  const headers=new Headers();
  headers.set(
    "content-type",
    isConfig
      ?"application/json; charset=utf-8"
      :(upstream.headers.get("content-type")||"application/octet-stream")
  );
  headers.set("cache-control","public, max-age=604800, immutable");
  headers.set("access-control-allow-origin","*");

  for(const name of ["content-length","etag","last-modified"]){
    const value=upstream.headers.get(name);
    if(value)headers.set(name,value);
  }

  return new Response(request.method==="HEAD"?null:upstream.body,{
    status:200,
    headers
  });
}

async function avatarProxy_(request,url,env){
  /*
   * 2026-09-23 (audit) : proxy d'image ouvert au public, sans la
   * moindre authentification -- n'importe qui pouvait faire
   * télécharger/mettre en cache par le Worker (facturé sur le compte
   * Cloudflare) n'importe quel fichier Google Drive dont il connaît
   * l'id, en se faisant passer pour un usage légitime du jeu. Aucun
   * appelant frontend trouvé nulle part dans les 3 dépôts (recherche
   * exhaustive) -- même clé interne que idleCallV1
   * (idle-worker-entry-v1.js) et debug-list (corrigé le même jour) par
   * cohérence, plutôt qu'une suppression pure tant qu'un appelant
   * légitime n'est pas formellement exclu.
   */
  const internalKey=String(env.SOREAL_IDLE_INTERNAL_KEY||"");
  const suppliedKey=String(request.headers.get("x-soreal-idle-internal-key")||"");
  if(!internalKey||suppliedKey!==internalKey){
    return new Response("Non autorisé",{status:401,headers:{"cache-control":"no-store"}});
  }
  const id=String(url.searchParams.get("id")||"").trim();
  const width=Math.max(64,Math.min(1600,Math.floor(Number(url.searchParams.get("w"))||700)));
  if(!/^[A-Za-z0-9_-]{10,220}$/.test(id))return new Response("Image IDLE invalide",{status:400,headers:{"cache-control":"no-store"}});
  const upstream=await fetch("https://lh3.googleusercontent.com/d/"+encodeURIComponent(id)+"=w"+width,{
    method:request.method==="HEAD"?"HEAD":"GET",
    headers:{accept:"image/avif,image/webp,image/*,*/*;q=.8"},
    cf:{cacheEverything:true,cacheTtl:604800}
  });
  if(!upstream.ok)return new Response("Image IDLE indisponible",{status:404,headers:{"cache-control":"public, max-age=60"}});
  return new Response(request.method==="HEAD"?null:upstream.body,{status:200,headers:mediaHeaders_(upstream.headers,604800)});
}

let idleAdventureKeysCache={at:0,value:[]};
async function clesAdventureR2_(env){
  const now=Date.now();
  if(idleAdventureKeysCache.value.length&&now-idleAdventureKeysCache.at<300000){
    return idleAdventureKeysCache.value;
  }
  let objects=[],cursor=undefined;
  do{
    const opts={prefix:IDLE_ADVENTURE_R2_PREFIX,limit:1000};
    if(cursor)opts.cursor=cursor;
    const listed=await env.SOREAL_R2.list(opts);
    if(listed&&Array.isArray(listed.objects))objects=objects.concat(listed.objects.map(o=>o.key));
    cursor=listed&&listed.truncated&&listed.cursor?listed.cursor:undefined;
  }while(cursor&&objects.length<2000);
  objects=objects.filter(key=>{
    const ext=String(key).split(".").pop().toLowerCase();
    return IDLE_ADVENTURE_R2_EXTENSIONS.includes(ext);
  });
  idleAdventureKeysCache={at:now,value:objects};
  return objects;
}
function motsR2_(value){
  let s=String(value||"").trim();
  try{s=s.normalize("NFD").replace(/[̀-ͯ]/g,"");}catch(_){}
  return s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}
function scoreCleZoneR2_(key,name){
  const file=String(key).split("/").pop().replace(/\.[^.]+$/,"");
  const sansNumero=file.replace(/^Zone_\d+_/i,"");
  const norm=normaliserNomItemR2_(sansNumero);
  const cible=normaliserNomItemR2_(name);
  if(!norm||!cible)return 0;
  if(norm===cible)return 1000;
  if(norm.includes(cible)||cible.includes(norm))return 600;

  /*
   * Repli mot-a-mot : le nom de zone du jeu et le fichier R2 peuvent
   * diverger legerement (ex. "Safety Zone" vs "Safe_Zone"). Chaque mot
   * du nom demande doit avoir un mot correspondant (egal ou prefixe)
   * dans le fichier pour eviter les faux positifs.
   */
  const motsFichier=motsR2_(sansNumero);
  const motsCible=motsR2_(name);
  if(!motsFichier.length||!motsCible.length)return 0;
  const correspond=motsCible.every(mot=>
    motsFichier.some(mf=>
      mf===mot||
      (mot.length>=3&&mf.length>=3&&(mf.startsWith(mot)||mot.startsWith(mf)))
    )
  );
  return correspond?400:0;
}
async function adventureZone_(request,env,url){
  const name=nomZoneAdventureR2(url.searchParams.get("name"));
  if(!name)return new Response("Nom de zone invalide",{status:400,headers:{"cache-control":"no-store"}});
  if(!env.SOREAL_R2||typeof env.SOREAL_R2.list!=="function"||typeof env.SOREAL_R2.get!=="function")return new Response("Média Adventure indisponible",{status:503,headers:{"cache-control":"no-store"}});
  const keys=await clesAdventureR2_(env);
  let best="",score=0;
  for(const key of keys){
    const s=scoreCleZoneR2_(key,name);
    if(s>score){score=s;best=key;}
  }
  if(!best)return new Response("Image de zone introuvable",{status:404,headers:{"cache-control":"public, max-age=60"}});
  const object=await env.SOREAL_R2.get(best);
  if(!object)return new Response("Image de zone introuvable",{status:404,headers:{"cache-control":"public, max-age=60"}});
  const headers=new Headers();
  if(typeof object.writeHttpMetadata==="function")object.writeHttpMetadata(headers);
  if(!headers.has("content-type"))headers.set("content-type",typeMediaAdventureR2(best));
  if(object.httpEtag)headers.set("etag",object.httpEtag);
  return new Response(request.method==="HEAD"?null:object.body,{status:200,headers:mediaHeaders_(headers,300)});
}

async function itemSet_(request,env,url){
  const setId=paramItemR2_(url,"set",40).toLowerCase();
  const slot=paramItemR2_(url,"slot",40).toLowerCase();
  const itemName=paramItemR2_(url,"name",180);
  const definitionId=paramItemR2_(url,"definition",80);
  const wikiItemIdRaw=paramItemR2_(url,"wikiItemId",12);
  const wikiItemId=/^\d{1,6}$/.test(wikiItemIdRaw)?Number(wikiItemIdRaw):0;
  const tierRaw=paramItemR2_(url,"tier",3);
  const tier=/^\d{1,2}$/.test(tierRaw)?Number(tierRaw):null;
  const legacyDefinitionItemId=Number(IDLE_ITEM_R2_ID_BY_DEFINITION[definitionId])||0;
  const explicitItemId=wikiItemId||legacyDefinitionItemId;
  if((setId&&!/^[a-z0-9_-]+$/.test(setId))||(!setId&&!explicitItemId)){
    return new Response("Set IDLE invalide",{status:400,headers:{"cache-control":"no-store"}});
  }
  if(!env.SOREAL_R2||typeof env.SOREAL_R2.list!=="function"||typeof env.SOREAL_R2.get!=="function"){
    return new Response("Média d'objet indisponible",{status:503,headers:{"cache-control":"no-store"}});
  }

  /*
   * Correctif 2026-09-18 : idle/items/ est plat, aucun sous-dossier par
   * set (voir IDLE_ITEM_SLOT_R2_NAME plus haut) — un seul pool, toujours
   * le même préfixe racine. IDLE_ITEM_SLOT_R2_NAME[setId][slot] fournit
   * le VRAI nom NGU de la pièce d'équipement quand il est connu (table
   * sourcée du wiki) ; à défaut (objet non répertorié, ex. un futur set
   * pas encore ajouté à la table), repli sur itemName tel qu'envoyé par
   * le client — suffisant pour les SPECIALS (dont le nom EST déjà le
   * vrai nom NGU), pas pour l'équipement générique mais jamais pire
   * qu'avant.
   */
  const objects=await objetsDossierItemR2_(env,IDLE_ITEMS_R2_PREFIX);
  const nomReel=itemR2NameOverride_(setId,slot)||itemName;
  const object=explicitItemId
    ?(tier!==null
      ?choisirObjetItemR2ParIdEtTier_(objects,explicitItemId,tier,nomReel,slot,setId)
      :choisirObjetItemR2ParId_(objects,explicitItemId,nomReel,slot,setId))
    :choisirObjetItemR2_(objects,nomReel,slot,setId);
  return reponseObjetR2_(request,env,object);
}

/*
 * Correctif 2026-09-18 : comme itemSet_ ci-dessus, idle/items/ est plat
 * (confirmé en direct via /api/idle/media/debug-list) — jamais de
 * dossier "SOREAL_IDLE_Boosts/" séparé, les 39 images de boost
 * (Item_0001-0039) vivent dans le MÊME pool que l'équipement. Repose
 * donc sur objetsDossierItemR2_(env,IDLE_ITEMS_R2_PREFIX), déjà réutilisé
 * par itemSet_ (même cache mémoire, un seul appel R2.list() pour les deux).
 *
 * Convention réelle des fichiers (vérifiée sur le listing live) :
 * "Item_<ID>_<Type>_Boost_<force>.ext" (ex. Item_0001_Power_Boost_1.png)
 * — après avoir retiré le préfixe "Item_<ID>_" (comme scoreObjetItemR2_),
 * ça normalise en "powerboost1". L'ancien code comparait par ÉGALITÉ DE
 * SET (fileBases.has(...)), ce qui aurait suffi UNE FOIS le préfixe
 * retiré ; gardé en égalité stricte (jamais un simple .includes()) car
 * une comparaison par sous-chaîne collisionnerait entre paliers de force
 * partageant un préfixe numérique (ex. cible "powerboost1" est une VRAIE
 * sous-chaîne de "powerboost100" et de "powerboost1000" — .includes()
 * matcherait n'importe lequel des trois pour une recherche de force "1").
 */
function strengthAliasesItemR2_(strength){
  const n=Number(strength);
  const aliases=[String(strength)];
  if(Number.isFinite(n)&&n>0&&n%1000===0)aliases.push((n/1000)+"k");
  return aliases;
}
async function boostImage_(request,env,url){
  const boostType=paramItemR2_(url,"boostType",20).toLowerCase();
  const strength=paramItemR2_(url,"strength",10);
  const wikiItemIdRaw=paramItemR2_(url,"wikiItemId",12);
  const wikiItemId=/^\d{1,6}$/.test(wikiItemIdRaw)?Number(wikiItemIdRaw):0;
  if(!["power","toughness","special"].includes(boostType)||!/^\d+$/.test(strength)){
    return new Response("Boost IDLE invalide",{status:400,headers:{"cache-control":"no-store"}});
  }
  if(!env.SOREAL_R2||typeof env.SOREAL_R2.list!=="function"||typeof env.SOREAL_R2.get!=="function"){
    return new Response("Média de boost indisponible",{status:503,headers:{"cache-control":"no-store"}});
  }
  const objects=await objetsDossierItemR2_(env,IDLE_ITEMS_R2_PREFIX);
  const fileBases=new Set();
  for(const s of strengthAliasesItemR2_(strength)){
    fileBases.add(normaliserNomItemR2_("boost"+boostType+s));
    fileBases.add(normaliserNomItemR2_(boostType+"boost"+s));
  }
  const object=wikiItemId
    ?choisirObjetItemR2ParId_(objects,wikiItemId,boostType+" Boost "+strength,boostType,"")
    :(objects.find(o=>{
      const file=String(o&&o.key||"").split("/").pop().replace(/\.[^.]+$/,"").replace(/^Item_\d+_/i,"");
      return fileBases.has(normaliserNomItemR2_(file));
    })||null);
  return reponseObjetR2_(request,env,object);
}

/*
 * Résolution générale des images de boss (2026-09-13). Avant ce correctif,
 * le boss n'avait AUCUNE résolution R2 : uniquement un DriveFileID lu
 * depuis la feuille IDLE_BOSS, résolu côté SOREAL-TV via imageDriveParIdSorealIdle_
 * — qui s'appuie sur un DriveApp/Utilities STUB (idle-sqlite-runtime.js,
 * ~ligne 362) renvoyant systématiquement un blob VIDE dans l'environnement
 * Cloudflare Workers (DriveApp n'existe que dans Google Apps Script). Ce
 * n'était donc pas "boss 1-20 fonctionnent, 21+ non" : AUCUN boss n'a
 * jamais reçu de vraie image par ce chemin. Les fichiers R2 réels suivent
 * la convention boss_<id>_<nom>.webp (id sans zéro de tête pour 10+, avec
 * zéro de tête pour 1-9, ex. boss_01_la_palette_infernale.webp,
 * boss_54_le_camion_frigorifique_carnassier.webp) — le boss 21 doit être
 * résolu EXACTEMENT comme le boss 1, jamais par un mécanisme séparé.
 */
/*
 * Audit 2026-09-13 (Norman) : "Le joueur se trouve dans soreal/idle/player/
 * mais je vais en ajouter d'autres qui refléteront les sets équipés de
 * chaque zone + des trucs funs... le système pour les accueillir quand
 * elles seront là doit déjà être en place." Un seul fichier existe
 * aujourd'hui (renommé idle/player/player-default.webp, ex-player-1.webp)
 * — convention retenue : player-<zoneId>.<ext> pour une apparence propre
 * à une zone (ex. player-tutorial.webp), player-default.<ext> en repli
 * tant que l'image de la zone courante n'existe pas encore. Un nouveau
 * fichier posé sur R2 avec le bon nom est automatiquement servi, sans
 * modification de code — même principe que les boss.
 */
const IDLE_PLAYER_R2_PREFIX="idle/player/";
async function objetsPlayerR2_(env){
  return objetsDossierMobR2_(env,IDLE_PLAYER_R2_PREFIX);
}
/*
 * Correctif 2026-09-17 (Norman : "j'ai mis à jour le player portrait") :
 * le matching exigeait un préfixe EXACT "player-<zone>." (tiret précis,
 * jamais d'autre séparateur) — même piège déjà rencontré et corrigé sur
 * les boosts (2026-09-14, "un dossier renommé, même légèrement... faisait
 * échouer TOUTE recherche"). Renommer le fichier par défaut (n'importe
 * quel nom réel choisi par Norman, plus forcément "player-default")
 * cassait donc TOUTE résolution, y compris pour des zones jamais
 * concernées par le renommage. Normalisation tolérante (accents/casse/
 * séparateurs ignorés, comme normaliserNomItemR2_) + repli sur l'unique
 * fichier du dossier tant qu'un seul portrait existe (cas réel
 * aujourd'hui), avant d'exiger un vrai texte "default".
 */
/*
 * Correctif 2026-09-17 (suite, Norman : "on n'a pas la photo Player
 * prévue. C'est idle/player/Portrait_PlayerAPportrait16.png") : les ~29
 * fichiers réels ne contiennent aucun texte "default" (ce sont des
 * portraits nommés par set NGU — Rerednaw, Wanderer, Slimy... voir
 * l'idée de système de déblocage par trophée/set, pas encore construit).
 * En attendant ce système, Norman a désigné explicitement CE portrait
 * comme le défaut actuel — repli EXPLICITE dessus avant le repli
 * générique "un seul fichier dans le dossier" (qui ne s'applique plus,
 * vu qu'il y en a ~29).
 */
const IDLE_PLAYER_DEFAULT_R2_HINT_V1="playerapportrait16";
function choisirCleJoueurR2_(keys,zone){
  const base=k=>normaliserNomItemR2_(String(k).split("/").pop().replace(/\.[^.]+$/,""));
  const z=normaliserNomItemR2_(zone);
  if(z){
    const cible="player"+z;
    const trouve=keys.find(k=>{const b=base(k);return b===cible||b.startsWith(cible);});
    if(trouve)return trouve;
  }
  const parDefaut=keys.find(k=>{const b=base(k);return b.includes("default")&&b.includes("player");});
  if(parDefaut)return parDefaut;
  const designe=keys.find(k=>base(k).includes(IDLE_PLAYER_DEFAULT_R2_HINT_V1));
  if(designe)return designe;
  if(keys.length===1)return keys[0];
  return "";
}
async function playerImage_(request,env,url){
  const zone=String(url.searchParams.get("zone")||"").trim();
  if(!env.SOREAL_R2||typeof env.SOREAL_R2.list!=="function"||typeof env.SOREAL_R2.get!=="function"){
    return new Response("Média de joueur indisponible",{status:503,headers:{"cache-control":"no-store"}});
  }
  const keys=await objetsPlayerR2_(env);
  const key=choisirCleJoueurR2_(keys,zone);
  if(!key)return new Response("Image de joueur introuvable",{status:404,headers:{"cache-control":"public, max-age=60"}});
  return reponseObjetR2_(request,env,{key});
}
async function objetsBossR2_(env){
  return objetsDossierMobR2_(env,IDLE_BOSSES_R2_PREFIX);
}
/*
 * Correctif 2026-09-17 (Norman a remplacé les 301 images de boss) : les
 * boss 1-99 renvoyaient 404 alors que 100+ fonctionnaient — vérifié en
 * direct sur prod, coupure exactement à 99/100. Cause confirmée : la
 * nouvelle convention de nommage zéro-remplit sur 3 chiffres partout
 * (Boss_001_..., Boss_099_..., Boss_100_...), mais seuls le nombre brut
 * et le zéro-remplissage à 2 chiffres (ancienne convention 1-20) étaient
 * essayés. Ajout du zéro-remplissage à 3 chiffres comme troisième
 * candidat — n'importe laquelle des 3 conventions continue de résoudre.
 */
function choisirCleBossR2_(keys,id){
  const n=Math.max(0,Math.floor(Number(id)||0));
  if(!n)return "";
  const candidats=[String(n),String(n).padStart(2,"0"),String(n).padStart(3,"0")];
  for(const c of candidats){
    const prefixe="boss_"+c+"_";
    const trouve=keys.find(k=>{
      const file=String(k).split("/").pop();
      return file.toLowerCase().startsWith(prefixe);
    });
    if(trouve)return trouve;
  }
  return "";
}
async function bossImage_(request,env,url){
  const idParam=String(url.searchParams.get("id")||"").trim();
  if(!/^\d+$/.test(idParam)){
    return new Response("Boss IDLE invalide",{status:400,headers:{"cache-control":"no-store"}});
  }
  if(!env.SOREAL_R2||typeof env.SOREAL_R2.list!=="function"||typeof env.SOREAL_R2.get!=="function"){
    return new Response("Média de boss indisponible",{status:503,headers:{"cache-control":"no-store"}});
  }
  const keys=await objetsBossR2_(env);
  const key=choisirCleBossR2_(keys,idParam);
  if(!key)return new Response("Image de boss introuvable",{status:404,headers:{"cache-control":"public, max-age=60"}});
  return reponseObjetR2_(request,env,{key});
}

async function bannerImage_(request,env,url){
  const nom=String(url.searchParams.get("name")||"").trim();
  if(!/^[A-Za-z0-9_.-]{1,120}$/.test(nom)||nom.includes("..")){
    return new Response("Bannière IDLE invalide",{status:400,headers:{"cache-control":"no-store"}});
  }
  if(!env.SOREAL_R2||typeof env.SOREAL_R2.get!=="function"){
    return new Response("Média de bannière indisponible",{status:503,headers:{"cache-control":"no-store"}});
  }
  const key="idle/banners/"+nom;
  const object=await env.SOREAL_R2.get(key);
  if(!object){
    return new Response("Bannière IDLE introuvable",{status:404,headers:{"cache-control":"public, max-age=60"}});
  }
  return reponseObjetR2_(request,env,{key,object});
}

async function debugListeR2_(request,env,url){
  /*
   * 2026-09-23 (audit) : accessible sans la moindre authentification --
   * n'importe qui pouvait énumérer toute l'arborescence du stockage R2
   * (jusqu'à 5000 clés). Outil de diagnostic manuel uniquement (aucun
   * appelant frontend, confirmé par recherche exhaustive) : même clé
   * interne que idleCallV1 (idle-worker-entry-v1.js), déjà provisionnée
   * comme secret Cloudflare réel.
   */
  const internalKey=String(env.SOREAL_IDLE_INTERNAL_KEY||"");
  const suppliedKey=String(request.headers.get("x-soreal-idle-internal-key")||"");
  if(!internalKey||suppliedKey!==internalKey){
    return new Response("Non autorisé",{status:401,headers:{"cache-control":"no-store"}});
  }
  const prefix=String(url.searchParams.get("prefix")||"").trim();
  if(!prefix.startsWith("idle/"))return new Response("Prefix invalide",{status:400,headers:{"cache-control":"no-store"}});
  if(!env.SOREAL_R2||typeof env.SOREAL_R2.list!=="function"){
    return new Response("R2 indisponible",{status:503,headers:{"cache-control":"no-store"}});
  }
  let objects=[],cursor=undefined;
  do{
    const opts={prefix,limit:1000};
    if(cursor)opts.cursor=cursor;
    const listed=await env.SOREAL_R2.list(opts);
    if(listed&&Array.isArray(listed.objects))objects=objects.concat(listed.objects.map(o=>({key:o.key,size:o.size})));
    cursor=listed&&listed.truncated&&listed.cursor?listed.cursor:undefined;
  }while(cursor&&objects.length<5000);
  return Response.json({ok:true,count:objects.length,objects:objects.sort((a,b)=>a.key.localeCompare(b.key))},{headers:{"cache-control":"no-store"}});
}

export async function traiterRequeteIdleMedia(request,env){
  const url=new URL(request.url);
  const routes=new Set([
    "/api/idle/media/adventure-zone",
    "/api/idle/media/avatar",
    "/api/idle/media/item",
    "/api/idle/media/mob",
    "/api/idle/media/safe-zone",
    "/api/idle/media/boost",
    "/api/idle/media/boss",
    "/api/idle/media/player",
    "/api/idle/media/banner",
    "/api/idle/media/piper-model.onnx",
    "/api/idle/media/piper-model.onnx.json",
    "/api/idle/media/debug-list"
  ]);
  if(!routes.has(url.pathname))return null;
  if(request.method!=="GET"&&request.method!=="HEAD"){
    return new Response("Méthode non autorisée",{status:405,headers:{allow:"GET, HEAD","cache-control":"no-store"}});
  }
  if(url.pathname==="/api/idle/media/debug-list")return debugListeR2_(request,env,url);
  if(url.pathname===IDLE_PIPER_MODEL_ROUTE_V1||url.pathname===IDLE_PIPER_MODEL_CONFIG_ROUTE_V1)return piperModelProxy_(request,url);
  if(url.pathname==="/api/idle/media/avatar")return avatarProxy_(request,url,env);
  if(url.pathname==="/api/idle/media/item")return itemSet_(request,env,url);
  if(url.pathname==="/api/idle/media/mob")return adventureMob_(request,env,url);
  if(url.pathname==="/api/idle/media/safe-zone")return adventureSafeZone_(request,env,url);
  if(url.pathname==="/api/idle/media/boost")return boostImage_(request,env,url);
  if(url.pathname==="/api/idle/media/boss")return bossImage_(request,env,url);
  if(url.pathname==="/api/idle/media/player")return playerImage_(request,env,url);
  if(url.pathname==="/api/idle/media/banner")return bannerImage_(request,env,url);
  return adventureZone_(request,env,url);
}
