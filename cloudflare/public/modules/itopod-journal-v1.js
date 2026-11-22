/*
 * SOREAL IDLE — phrases du journal de combat de l'ITOPOD (Norman, 2026-11-21 : « dans l'ITOPOD il y a un journal de combat »).
 * TABLE LUE DANS LE JEU (NGU Idle build 1260, PlayerController::damageText, désassemblée le 2026-11-21 ; seuls des FAITS sont gardés) : la phrase dépend des dégâts du coup, du plus grand palier au plus petit ; un coup choisit la
 * première ligne dont le seuil est STRICTEMENT inférieur aux dégâts (le jeu compare « dégâts > seuil »), sinon la phrase par défaut (« You hit <nom> for <dégâts> damage! »). Dans chaque phrase : 1 = nom de l'ennemi, 2 = dégâts, 3 = nom de la 3e ressource.
 * Les lignes du journal sont ÉCRITES EN ANGLAIS comme dans le jeu (aucun texte inventé) ; les lignes de dégâts sont affichées en vert (balise color=green du jeu).
 * Fichier généré par un script de lecture de l'assembly, à ne pas modifier à la main : tout changement de phrase doit venir du jeu.
 * Expose window.__SOREAL_IDLE_ITOPOD_JOURNAL_V1__ = { phrase(degats, nom, nomR3, formater) → texte brut, tiers }.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_ITOPOD_JOURNAL_V1__)return;
var DEFAUT=["You hit ",1," for ",2," damage!"];
var TIERS=[
  [1e38,["You NGU-BLASTED ",1,"'s ass for ",2," damage!"]],
  [3e37,["You outsource your damage message for ",1," for ",2," damage!"]],
  [1e37,["You compact ",1," into a singularity for ",2," damage!"]],
  [3e36,["You rip out all of ",1,"'s teeth for ",2," damage!"]],
  [1e36,["You reenact how babies are made to ",1," for ",2," damage!"]],
  [3e35,["You give ",1," a bear-hug for ",2," damage!"]],
  [1e35,["You spontaneously combust ",1," for ",2," damage!"]],
  [3e34,["You combine your Energy, Magic & ",3," at ",1," for ",2," damage!"]],
  [1e34,["You discombobulated ",1," for ",2," damage!"]],
  [3e33,["You soil ",1,"'s underpants for ",2," damage!"]],
  [1e33,["You mine the block ",1," was standing on for ",2," damage!"]],
  [3e32,["You combine all your previous attacks onto ",1," for ",2," damage!"]],
  [1e32,["You convince ",1," to hug a woodchipper for ",2," damage!"]],
  [3e31,["You mess with ",1,"'s wandoos update settings for ",2," damage!"]],
  [1e31,["You YEETED ",1," for ",2," damage!"]],
  [3e30,["You masticate onto ",1," for ",2," damage! No I said MASTICATE"]],
  [1e30,["You sic your trusty battle corgi onto ",1," for ",2," damage!"]],
  [3e29,["You tar and feather ",1," for ",2," damage!"]],
  [1e29,["You carve your initials onto ",1,"'s ass for ",2," damage!"]],
  [3e28,["You shoot a rubber band at ",1," for ",2," damage!"]],
  [1e28,["You flip ",1," the bird for ",2," damage!"]],
  [3e27,["You unfriended ",1," for ",2," damage! :("]],
  [1e27,["You match with ",1," on a dating site for ",2," damage!"]],
  [3e26,["You throw a temper tantrum at ",1," for ",2," damage!"]],
  [1e26,["You glare menacingly at ",1," for ",2," damage!"]],
  [3e25,["You explain anime at ",1," for ",2," damage!"]],
  [1e25,["You kickflip over ",1," for ",2," damage! Totally Awesome!"]],
  [3e24,["You remove ",1,"'s kidney for ",2," damage!"]],
  [1e24,["You slap ",1," with an eggplant emoji for ",2," damage!"]],
  [3e23,["You hurl a moon at ",1," for ",2," damage!"]],
  [1e23,["You prank call ",1," for ",2," damage!"]],
  [3e22,[1," lost ",2," HP. That's it."]],
  [1e22,["You splash random fluids from the Beast on ",1," for ",2," damage!"]],
  [3e21,["You inflict bodily harm onto ",1," for ",2," damage!"]],
  [1e21,["You boop ",1," gently on the nose for ",2," damage!"]],
  [3e20,["You rolled a nat 20 and crit ",1," for ",2," damage!"]],
  [1e20,["You crush ",1," with the might of your EVIL NGUs for ",2," damage!"]],
  [3e19,["You trick ",1," into playing a crappy idle game for ",2," damage!"]],
  [1e19,["You sent ",1," back to the shadow realm for ",2," damage!"]],
  [3e18,["You beat ",1," with the remains of the last foe for ",2," damage!"]],
  [1e18,["You make ",1," step on a lego for ",2," damage!"]],
  [3e17,["You throw POCKET SAND at ",1," for ",2," damage!"]],
  [1e17,["You slap your sticky foot at ",1,"'s tushy for ",2," damage!"]],
  [3e16,["You humiliate ",1," with a low-effort damage message for ",2," damage!"]],
  [1e16,["You give ",1," a prostate exam with a cactus for ",2," damage!"]],
  [3e15,["You tell ",1," their parents don't love them for ",2," emotional damage!"]],
  [1e15,["You roar at ",1," like a sexual tyrannosaur for ",2," damage!"]],
  [3e14,["You throw a stupid newbie at ",1," for ",2," damage!"]],
  [1e14,["You lightly tapped ",1," and exploded them for ",2," damage!"]],
  [3e13,["You dunked on ",1," for ",2," damage!"]],
  [1e13,["You drew ",1," like one of your french girls for ",2," damage!"]],
  [3e12,["You gave ",1," an atomic wedgie for ",2," damage!"]],
  [1e12,["You scowled at ",1," with all your might for ",2," damage!"]],
  [3e11,["You ground up ",1," into a fine paste for ",2," damage!"]],
  [1e11,["You chewed up ",1,"'s right pinky for ",2," damage!"]],
  [3e10,["You mangled ",1,"'s left pinky for ",2," damage!"]],
  [1e10,["You peed on ",1," for ",2," damage! Too far, dude."]],
  [3e9,["You crashed two gigantic meteors into ",1," for ",2," damage!"]],
  [1e9,["You erased ",1," from the timeline for ",2," damage!"]],
  [3e8,["You disappointed ",1," for ",2," damage! :c"]],
  [1e8,["You whacked ",1,"'s hands with a ruler for ",2," damage!"]],
  [5e7,["You sent ",1," to the 43rd dimension for ",2," damage!"]],
  [2.5e7,["You compressed ",1," into a black hole for ",2," damage!"]],
  [1.024e7,["You smacked ",1," with the force of 1000 suns for ",2," damage!"]],
  [5.12e6,["You lightly tapped ",1," for ",2," damage! Wait, what?"]],
  [2.56e6,["You destroyed ",1,"'s family tree for ",2," damage!"]],
  [1.28e6,["You used Bubblebeam on ",1," for ",2," damage! Super Effective!"]],
  [6.4e5,["You had carnal relations with ",1,"'s mother for ",2," damage!"]],
  [3.2e5,["You sang horrible karaoke at ",1," for ",2," damage!"]],
  [1.6e5,["You insulted every single cell in ",1,"'s body individually for ",2," damage!"]],
  [8e4,["You critically hit ",1," for ",2," damage!"]],
  [4e4,["You destroyed ",1,"'s sense of self worth for ",2," damage!"]],
  [2e4,["You laid the smackdown on ",1," for ",2," damage!"]],
  [1e4,["You 'BOOM HEADSHOT'ed ",1," for ",2," damage!"]],
  [6e3,["You set every atom of ",1,"'s body on fire for ",2," damage!"]],
  [4e3,["You ANNIHILATED ",1," for ",2," damage!"]],
  [3e3,["You disassembled ",1," into a 500-piece lego set for ",2," damage!"]],
  [2e3,["You melted ",1," into a gross puddle of goo for ",2," damage!"]],
  [1e3,["You FLORIFIED ",1," for ",2," damage! What does that even mean?"]],
  [8e2,["You detonated ",1," like a neutron star for ",2," damage!"]],
  [6e2,["You blew ",1," into bits of shrapnel for ",2," damage!"]],
  [4e2,["You incinerated ",1," into charred bits for ",2," damage!"]],
  [3e2,["You smashed ",1,"'s chest in for ",2," damage!"]],
  [2e2,["You cruelly dismembered ",1," for ",2," damage!"]],
  [1e2,["You brutally massacred ",1," for ",2," damage!"]],
  [8e1,["You decimated ",1," for ",2," damage!"]],
  [6e1,["You crushed ",1," for ",2," damage!"]],
  [4e1,["You slashed ",1," deep for ",2," damage!"]],
  [3e1,["You attacked ",1," viciously for ",2," damage!"]],
  [2e1,["You hit ",1," extremely hard for ",2," damage!"]],
  [1.5e1,["You hit ",1," very hard for ",2," damage!"]],
  [1e1,["You hit ",1," hard for ",2," damage!"]]
];
function phrase(degats,nom,nomR3,formater){
  var d=Number(degats)||0,p=DEFAUT;
  /* Version française (modules/journal-fr-v1.js, mêmes paliers dans le même ordre) quand la langue du jeu n'est pas l'anglais. */
  var FR=window.__SOREAL_IDLE_JOURNAL_FR_V1__,fr=Boolean(FR&&FR.actif()&&FR.degats.length===TIERS.length);
  if(fr)p=FR.defaut;
  for(var i=0;i<TIERS.length;i++){if(d>TIERS[i][0]){p=fr?FR.degats[i]:TIERS[i][1];break;}}
  var fmt=typeof formater==='function'?formater:function(v){return String(v);};
  return p.map(function(x){return x===1?String(nom==null?'':nom):x===2?fmt(d):x===3?String(nomR3||'Resource 3'):x;}).join('');
}
window.__SOREAL_IDLE_ITOPOD_JOURNAL_V1__={phrase:phrase,tiers:TIERS};
})();
