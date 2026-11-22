/*
 * SOREAL IDLE — phrases du journal de combat de l'Aventure, REPRISES MOT POUR MOT DU JEU (Norman, 2026-11-21 : « reprends les phrases du jeu pour le journal de l'ITOPOD et également pour celui d'aventure »).
 * Source : NGU Idle build 1260, assembly lu le 2026-11-21 (PlayerController::damageText / heal, EnemyAI::regularAttack / poisonAttack / chargeAttack / paralyzeAI / rapidAI / growerAI / explode, theButcherAI, corruptedTreeAI, jakeAI, uugAI, waldoAI, beastAI,
 * doAura, nerdAI, godmotherAI, exileAI / doExileAura, itHungersAI, ratAI, traitorAI, takeDamage, AdventureController::enemyDeath / playerDeath). Seuls des FAITS (phrases) sont gardés ; elles restent EN ANGLAIS, fautes du jeu comprises
 * (« Theyt've », « it's completely invulnerable »). Les deux espaces de « hacked your limbs for  N » sont ceux du jeu.
 * Les lignes de DÉGÂTS du joueur viennent de la table de modules/itopod-journal-v1.js (PlayerController::damageText), partagée avec le journal de l'ITOPOD.
 * Expose window.__SOREAL_IDLE_JOURNAL_JEU_V1__ = { coupJoueur, victoire, defaite, soin, attaque, titan }.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_JOURNAL_JEU_V1__)return;

/* Phrase du coup du joueur (damageText) : degats = nombre, fmt = formateur du client. */
function coupJoueur(degats,nom,nomR3,fmt){
  var J=window.__SOREAL_IDLE_ITOPOD_JOURNAL_V1__;
  if(J)return J.phrase(degats,nom,nomR3,fmt);
  return 'You hit '+nom+' for '+(fmt?fmt(degats):degats)+' damage!';
}
/* Nom de la 3e ressource (Resource3::res3Name ; « Butts » tant qu'il n'a jamais été donné, valeur de départ du jeu) et formateur de nombres du client. */
function nomR3(){
  try{var H=window.__SOREAL_IDLE_META_HOST_V130__,j=H&&H.getIdleEtat&&H.getIdleEtat();var n=j&&j.systemes&&typeof j.systemes.r3Nom==='string'?j.systemes.r3Nom:'';if(n)return n;}catch(_e){}
  return 'Butts';
}
function fmt(v){
  var R=window.__SOREAL_IDLE_REG__,x=Math.round(Number(v)||0);
  try{
    /* grands nombres : le format du reste de l'interface (suffixes) ; petits : entier habituel */
    if(R&&Math.abs(x)>=1e6&&typeof R.formatGrandNombreIdleV70_==='function')return String(R.formatGrandNombreIdleV70_(x));
    if(R&&typeof R.idleEntier_==='function')return String(R.idleEntier_(x));
  }catch(_e){}
  return String(x);
}
/* Ligne de coup du joueur prête à écrire (nombre formaté comme le reste de l'interface). */
function coup(degats,nom){return coupJoueur(degats,nom,nomR3(),fmt);}
/* Nom du dernier ennemi vaincu : les lignes de butin du jeu commencent par lui (« X dropped N gold! Sweet! », LootDrop::zoneNDrop). */
var dernierEnnemi='';
/* Langue : en français (langue du jeu ≠ anglais) les phrases viennent de modules/journal-fr-v1.js, traduction fidèle. */
function FR(){var F=window.__SOREAL_IDLE_JOURNAL_FR_V1__;return F&&F.actif()?F:null;}
/* Texte propre au jeu SOREAL (sans phrase du jeu d'origine) : français ou anglais selon la langue du jeu. */
function l(fr,en){return FR()?fr:en;}
function victoire(nom){dernierEnnemi=String(nom||'');var f=FR();return f?f.victoire(nom):'You have defeated '+nom+'!';}
function or(n){var f=FR();return f?f.or(dernierEnnemi||"L'ennemi",n):(dernierEnnemi||'The enemy')+' dropped '+n+' gold! Sweet!';}
/* Lignes du journal de l'ITOPOD : progression vers le prochain Point d'Atout et Points d'Atout gagnés (ItopodPerkController::addProgress). */
function progres(n){var f=FR();return f?f.progres(n):'You gained '+n+' progress to your next Perk Point!';}
function pointAtout(n,pluriel){var f=FR();return f?f.pointAtout(n,pluriel):(pluriel?'You gained '+n+' Perk Points!':'You gained 1 Perk Point!');}
function defaite(nom){var f=FR();return f?f.defaite(nom):nom+' has defeated you!';}
function soin(pv){var f=FR();return f?f.soin(pv):'You healed yourself for '+pv+' HP!';}

/*
 * Phrase d'une attaque de l'ennemi (n = dégâts déjà formatés). kind :
 *  normal (regularAttack) · puissante (« power attack ») · super · smash (beastAI) · massive (chargeAttack) · poison (poisonAttack, 1er coup) · poisonFin · ralentit / paralyse (paralyzeAI) · rapide (rapidAI, mode rapide) · rapideFin · croit (growerAI) ·
 *  gant / gantPuissant (nerdAI) · explosion (godmotherAI) · tirBras (exileAI) · succion (doExileAura) · devore (itHungersAI) · sauterelle / rat (jakeAI / ratAI) · saigne (theButcherAI)
 */
function attaque(kind,nom,n){
  var f=FR();if(f)return f.attaque(kind,nom,n);
  switch(kind){
    case 'puissante':return nom+' unleashed a power attack for '+n+' damage!';
    case 'super':return nom+' unleashed a SUPER power attack for '+n+' damage!';
    case 'smash':return nom+' performs a POWER SMASH for '+n+' damage!';
    case 'massive':return nom+' unleashed a MASSIVE attack for '+n+' damage!';
    case 'poison':return nom+' has attacked for '+n+' damage! You\'ve also been poisoned!';
    case 'poisonFin':return nom+' has attacked for '+n+' damage! Your poison has worn off.';
    case 'ralentit':return nom+' attacks for '+n+' damage! You feel yourself beginning to slow down...';
    case 'paralyse':return nom+' attacks for '+n+' damage! You\'re now fully paralyzed, oh crap!';
    case 'rapide':return 'You were attacked for '+n+' damage!';
    case 'rapideFin':return nom+' has attacked for '+n+' damage! They seem to have stopped freaking out.';
    case 'croit':return nom+' has attacked for '+n+' damage! They swell up in size, too! Creepy!';
    case 'gant':return nom+' gives you a left hook for '+n+' damage!';
    case 'gantPuissant':return nom+' gives you a taste of the Power Glove for '+n+' damage!';
    case 'explosion':return nom+' EXPLODES FOR '+n+' DAMAGE!';
    case 'tirBras':return nom+' blasts you for '+n+' damage!';
    case 'succion':return nom+' hits you for '+n+' damage and heals by 10%!';
    case 'devore':return nom+' DEVOURS YOU for '+n+' damage!';
    case 'sauterelle':return 'LOCUSTS ATTACK YOUR FACE FOR '+n+' DAMAGE!';
    case 'rat':return 'A TRILLION RATS SLASH YOUR FACE FOR '+n+' DAMAGE!';
    case 'saigne':return nom+' hacked your limbs for  '+n+' damage! You feel yourself bleed...';
    default:return nom+' attacked for '+n+' damage!';
  }
}

/* Lignes (une ou plusieurs) d'une capacité de titan ou d'ennemi : renvoie un tableau de phrases du jeu. */
var AURAS={
  1:function(n){return [n+' casts HYPER RED ANIME AURA! They start healing super fast!'];},
  2:function(n){return [n+' equips the POWER SMASH badge, oh crap! This is gonna hurt!'];},
  3:function(n){return [n+' start vomiting grey goop all over, and begins rolling around in it!','Oh snap - it\'s grown a layer of metal armor!'];},
  4:function(n){return [n+' pulls out an alarm clock from one of its slimy folds and eats it! WTF?','You feel like everything has sped up around you! Or are you slower? '];},
  5:function(n){return [n+' projectile vomits a lump of rubbery slime and slathers it all over its sluggish body!','Be careful how you attack it!'];},
  6:function(n){return [n+' rips a rancid smelling fart! You double over, gagging on the smell!','You feel this putrid cloud sapping away your health!'];}
};
var CONSIGNES={3:'REGULAR',4:'STRONG',5:'PIERCING',6:'ULTIMATE'};
function titan(kind,nom,o){
  o=o||{};
  var f=FR();if(f)return f.titan(kind,nom,o);
  switch(kind){
    case 'gant':return ['At the same time, the Nerd slips a Power Glove onto their right hand!','Watch out, this is gonna be bad!'];
    case 'gantPuissant':return ['They hit you so hard their glove broke! You\'re safe for a little while longer. '];
    case 'piratage':return ['The Greasy Nerd opens up CheatEngine on their PC and hacks NGU, raising their power by 8%! '];
    case 'genou':return ['The Godmother orders one of her goons to bash your knees with a baseball bat! OWIE OW OW!!','Your move cooldowns have been crippled!'];
    case 'explosionsDebut':return [nom+' starts glowing white! HIT THE FREAKIN\' DECK!',nom+' STARTS EXPLODING LIKE CRAZY!!!'];
    case 'tirBras':return [nom+'\'s buster unleashes a giant charge blast!'];
    case 'brasCharge':return [nom+' starts charging up the Buster Arm! GET DOWN!!'];
    case 'exileSaignement':return [nom+' gores you with their antlers! You\'re bleeding heavily now!'];
    case 'exileParalysie':return [nom+' raises their antennae and controls your mind! You can\'t control your body at all!'];
    case 'succion':return [nom+' wraps their tentacle around you and saps away your life!'];
    case 'invincible':return [nom+' it\'s completely invulnerable to your attacks!','If only you could poison it with some bad cooking!'];
    case 'spores':return [nom+' shoots out a cloud of spores! Your arms feel so heavy all of a sudden...'];
    case 'draine':return [nom+' shoots out a cloud of spores! You cough and wheeze, the energy draining from your body...'];
    case 'rats':return [nom+' summons a TRILLION ANGRY RATS  TO EAT YOUR FACE! INCOMING!!!'];
    case 'sauterelles':return [nom+' opens his mouth unnaturally wide and shoots out 100,000 FREAKING LOCUSTS! INCOMING!!!'];
    case 'reductionPV':return [nom+' unleashes the power of the MacGuffins to reduce your HP to critical levels!'];
    case 'bouclier':return [nom+'\'s MacGuffins glow Green and '+(o.renforce?'the energy shield strengthens!':'an energy shield materializes!')];
    case 'accelere':return [nom+' glows red! Theyt\'ve permanently sped up their power growth!'];
    case 'chemise':return [nom+' tucks his arms into his shirt and starts flapping his empty sleeves back and forth!'].concat(o.desactive?['You\'re so confused by this display that one of your moves has been disabled!']:[]);
    case 'paralyse':return [nom+' start screaming obscenities at you! It freaks you out so much you\'re frozen in fear!'];
    case 'walderpDit':return [(o.dit?'WALDERP SAYS ':'')+'HIT ME WITH A'+(o.consigne===6?'N':'')+' '+(CONSIGNES[o.consigne]||'REGULAR')+' ATTACK'];
    case 'walderpExplose':return [o.dit?'The demented hiker cackles, \'YOU DIDN\'T DO WHAT WALDERP SAYS, SUCKER! TIME TO DIEEEEEEEEE!\'':'The demented hiker cackles, \'I DIDN\'T SAY WALDERP SAYS, SUCKER! TIME TO DIEEEEEEEEE!\'','He pulls out a big red button and presses it.'];
    case 'beastReflet':return ['Your attack bounces back off THE BEAST\'s rubbery hide!','You hit yourself for '+o.n+' damage!'];
    case 'nerdAnnule':return ['The Greasy Nerd reels back from the blow, weakened - your ultimate attack reversed his last round of hacking!'];
    case 'aura':return AURAS[o.aura]?AURAS[o.aura](nom):[];
    case 'explodeMob':return [nom+' detonated like a thermonuclear explosive for '+o.n+' damage!'];
    case 'chargeDebut':return [nom+' starts glowing red... huge attack incoming!'];
    case 'rapideDebut':return [nom+' surged forward and started attacking crazy fast!'];
    case 'tremble':return [nom+' starts shaking violently! What\'s about to happen?'];
    case 'poisonDegats':return ['You also take '+o.n+' poison damage!'];
    case 'presqueMort':return ['You are almost certainly dead.'];
    case 'liberte':return ['You\'ve broken out of the paralyze effect! Start kicking some ass, pronto!'];
    default:return [];
  }
}
window.__SOREAL_IDLE_JOURNAL_JEU_V1__={l:l,progres:progres,pointAtout:pointAtout,or:or,coup:coup,fmt:fmt,coupJoueur:coupJoueur,victoire:victoire,defaite:defaite,soin:soin,attaque:attaque,titan:titan};
})();
