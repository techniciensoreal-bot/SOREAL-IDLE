/*
 * SOREAL IDLE — journaux de combat EN FRANÇAIS (Norman, 2026-11-22 : « le journal de combat de l'ITOPOD doit être traduit en français pour la version française »).
 * Traduction fidèle des phrases du jeu d'origine (modules/itopod-journal-v1.js pour les coups du joueur, modules/journal-jeu-v1.js pour l'Aventure) : mêmes paliers, mêmes blagues, aucune phrase inventée.
 * Utilisé quand la langue du jeu n'est pas l'anglais (clé soreal_idle_langue_v1) ; en anglais les phrases du jeu restent telles quelles.
 * Dans les phrases de coups : 1 = nom de l'ennemi, 2 = dégâts, 3 = nom de la 3e ressource (même ordre que la table anglaise, 92 paliers).
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_JOURNAL_FR_V1__)return;
function actif(){try{return localStorage.getItem('soreal_idle_langue_v1')!=='en';}catch(_e){return true;}}
var DEFAUT=["Tu as frappé ",1," pour ",2," dégâts !"];
var DEGATS=[
  ["Tu NGU-EXPLOSES le cul de ",1," pour ",2," dégâts !"],
  ["Tu sous-traites ton message de dégâts pour ",1," : ",2," dégâts !"],
  ["Tu compactes ",1," en singularité pour ",2," dégâts !"],
  ["Tu arraches toutes les dents de ",1," pour ",2," dégâts !"],
  ["Tu refais à ",1," la façon dont naissent les bébés pour ",2," dégâts !"],
  ["Tu fais un câlin d'ours à ",1," pour ",2," dégâts !"],
  ["Tu fais spontanément prendre feu à ",1," pour ",2," dégâts !"],
  ["Tu combines ton Énergie, ta Magie et ",3," sur ",1," pour ",2," dégâts !"],
  ["Tu as déconcerté ",1," pour ",2," dégâts !"],
  ["Tu souilles le slip de ",1," pour ",2," dégâts !"],
  ["Tu creuses le bloc sur lequel se tenait ",1," pour ",2," dégâts !"],
  ["Tu combines toutes tes attaques précédentes sur ",1," pour ",2," dégâts !"],
  ["Tu convaincs ",1," d'embrasser une déchiqueteuse pour ",2," dégâts !"],
  ["Tu tripotes les réglages de mise à jour de Wandoos de ",1," pour ",2," dégâts !"],
  ["Tu JETTES ",1," pour ",2," dégâts !"],
  ["Tu mâchouilles ",1," pour ",2," dégâts ! Non j'ai dit MÂCHOUILLER"],
  ["Tu lâches ton fidèle corgi de combat sur ",1," pour ",2," dégâts !"],
  ["Tu goudronnes et emplumes ",1," pour ",2," dégâts !"],
  ["Tu graves tes initiales sur le cul de ",1," pour ",2," dégâts !"],
  ["Tu tires un élastique sur ",1," pour ",2," dégâts !"],
  ["Tu fais un doigt d'honneur à ",1," pour ",2," dégâts !"],
  ["Tu as supprimé ",1," de tes amis pour ",2," dégâts ! :("],
  ["Tu matches avec ",1," sur un site de rencontre pour ",2," dégâts !"],
  ["Tu fais un caprice devant ",1," pour ",2," dégâts !"],
  ["Tu fusilles ",1," du regard pour ",2," dégâts !"],
  ["Tu expliques les animés à ",1," pour ",2," dégâts !"],
  ["Tu fais un kickflip par-dessus ",1," pour ",2," dégâts ! Trop cool !"],
  ["Tu retires le rein de ",1," pour ",2," dégâts !"],
  ["Tu gifles ",1," avec un émoji aubergine pour ",2," dégâts !"],
  ["Tu lances une lune sur ",1," pour ",2," dégâts !"],
  ["Tu fais un canular téléphonique à ",1," pour ",2," dégâts !"],
  [1," a perdu ",2," PV. C'est tout."],
  ["Tu éclabousses ",1," de fluides divers de la Bête pour ",2," dégâts !"],
  ["Tu infliges des blessures corporelles à ",1," pour ",2," dégâts !"],
  ["Tu boopes doucement ",1," sur le nez pour ",2," dégâts !"],
  ["Tu as fait un 20 naturel et un coup critique sur ",1," pour ",2," dégâts !"],
  ["Tu écrases ",1," avec la puissance de tes NGU MALÉFIQUES pour ",2," dégâts !"],
  ["Tu piègues ",1," pour qu'il joue à un jeu idle nul pour ",2," dégâts !"],
  ["Tu renvoies ",1," dans le royaume des ombres pour ",2," dégâts !"],
  ["Tu frappes ",1," avec les restes du dernier ennemi pour ",2," dégâts !"],
  ["Tu fais marcher ",1," sur un lego pour ",2," dégâts !"],
  ["Tu jettes du SABLE DANS LES YEUX de ",1," pour ",2," dégâts !"],
  ["Tu colles ton pied poisseux aux fesses de ",1," pour ",2," dégâts !"],
  ["Tu humilies ",1," avec un message de dégâts sans effort pour ",2," dégâts !"],
  ["Tu fais un examen de la prostate à ",1," avec un cactus pour ",2," dégâts !"],
  ["Tu dis à ",1," que ses parents ne l'aiment pas pour ",2," dégâts émotionnels !"],
  ["Tu rugis sur ",1," comme un tyrannosaure sexuel pour ",2," dégâts !"],
  ["Tu lances un noob débutant sur ",1," pour ",2," dégâts !"],
  ["Tu as effleuré ",1," et l'as fait exploser pour ",2," dégâts !"],
  ["Tu as dunké sur ",1," pour ",2," dégâts !"],
  ["Tu as dessiné ",1," comme une de tes Françaises pour ",2," dégâts !"],
  ["Tu as fait un atomic wedgie à ",1," pour ",2," dégâts !"],
  ["Tu as fusillé ",1," du regard de toutes tes forces pour ",2," dégâts !"],
  ["Tu as réduit ",1," en fine pâte pour ",2," dégâts !"],
  ["Tu as mâché le petit doigt droit de ",1," pour ",2," dégâts !"],
  ["Tu as mutilé le petit doigt gauche de ",1," pour ",2," dégâts !"],
  ["Tu as fait pipi sur ",1," pour ",2," dégâts ! Trop loin, mec."],
  ["Tu as écrasé deux météorites géantes sur ",1," pour ",2," dégâts !"],
  ["Tu as effacé ",1," de la chronologie pour ",2," dégâts !"],
  ["Tu as déçu ",1," pour ",2," dégâts ! :c"],
  ["Tu as tapé sur les mains de ",1," avec une règle pour ",2," dégâts !"],
  ["Tu as envoyé ",1," dans la 43e dimension pour ",2," dégâts !"],
  ["Tu as compressé ",1," en trou noir pour ",2," dégâts !"],
  ["Tu as frappé ",1," avec la force de 1000 soleils pour ",2," dégâts !"],
  ["Tu as effleuré ",1," pour ",2," dégâts ! Hein, quoi ?"],
  ["Tu as détruit l'arbre généalogique de ",1," pour ",2," dégâts !"],
  ["Tu as utilisé Bulle d'O sur ",1," pour ",2," dégâts ! C'est super efficace !"],
  ["Tu as eu des relations charnelles avec la mère de ",1," pour ",2," dégâts !"],
  ["Tu as chanté du karaoké horrible à ",1," pour ",2," dégâts !"],
  ["Tu as insulté chaque cellule du corps de ",1," une par une pour ",2," dégâts !"],
  ["Tu as frappé ",1," en coup critique pour ",2," dégâts !"],
  ["Tu as détruit l'estime de soi de ",1," pour ",2," dégâts !"],
  ["Tu as mis la raclée à ",1," pour ",2," dégâts !"],
  ["Tu as fait un 'BOOM HEADSHOT' sur ",1," pour ",2," dégâts !"],
  ["Tu as mis le feu à chaque atome du corps de ",1," pour ",2," dégâts !"],
  ["Tu as ANÉANTI ",1," pour ",2," dégâts !"],
  ["Tu as démonté ",1," en un set lego de 500 pièces pour ",2," dégâts !"],
  ["Tu as fait fondre ",1," en une flaque de bouillie dégoûtante pour ",2," dégâts !"],
  ["Tu as FLORIFIÉ ",1," pour ",2," dégâts ! Qu'est-ce que ça veut dire ?"],
  ["Tu as fait détoner ",1," comme une étoile à neutrons pour ",2," dégâts !"],
  ["Tu as réduit ",1," en éclats de shrapnel pour ",2," dégâts !"],
  ["Tu as incinéré ",1," en petits morceaux carbonisés pour ",2," dégâts !"],
  ["Tu as défoncé le torse de ",1," pour ",2," dégâts !"],
  ["Tu as cruellement démembré ",1," pour ",2," dégâts !"],
  ["Tu as brutalement massacré ",1," pour ",2," dégâts !"],
  ["Tu as décimé ",1," pour ",2," dégâts !"],
  ["Tu as écrasé ",1," pour ",2," dégâts !"],
  ["Tu as profondément entaillé ",1," pour ",2," dégâts !"],
  ["Tu as attaqué ",1," avec férocité pour ",2," dégâts !"],
  ["Tu as frappé ",1," extrêmement fort pour ",2," dégâts !"],
  ["Tu as frappé ",1," très fort pour ",2," dégâts !"],
  ["Tu as frappé ",1," fort pour ",2," dégâts !"]
];
var AURAS={
  1:function(n){return [n+' lance l\'HYPER AURA ROUGE D\'ANIMÉ ! Il se soigne à toute vitesse !'];},
  2:function(n){return [n+' équipe le badge POWER SMASH, oh merde ! Ça va faire mal !'];},
  3:function(n){return [n+' vomit de la bouillie grise partout et se roule dedans !','Oh la vache : il s\'est fait pousser une couche d\'armure en métal !'];},
  4:function(n){return [n+' sort un réveil d\'un de ses replis visqueux et le mange ! C\'est quoi ce bordel ?','Tu as l\'impression que tout s\'est accéléré autour de toi ! Ou alors c\'est toi qui es plus lent ? '];},
  5:function(n){return [n+' vomit en jet une boule de gelée caoutchouteuse et s\'en tartine tout son corps lent !','Fais attention à la façon dont tu l\'attaques !'];},
  6:function(n){return [n+' lâche un pet à l\'odeur rance ! Tu te plies en deux, pris de haut-le-cœur !','Tu sens ce nuage putride ronger ta santé !'];}
};
var CONSIGNES={3:'NORMALE',4:'FORTE',5:'PERÇANTE',6:'ULTIME'};
function attaque(kind,nom,n){
  switch(kind){
    case 'puissante':return nom+' a déchaîné une attaque puissante pour '+n+' dégâts !';
    case 'super':return nom+' a déchaîné une SUPER attaque puissante pour '+n+' dégâts !';
    case 'smash':return nom+' exécute un POWER SMASH pour '+n+' dégâts !';
    case 'massive':return nom+' a déchaîné une attaque MASSIVE pour '+n+' dégâts !';
    case 'poison':return nom+' a attaqué pour '+n+' dégâts ! Tu es aussi empoisonné !';
    case 'poisonFin':return nom+' a attaqué pour '+n+' dégâts ! Ton poison s\'est dissipé.';
    case 'ralentit':return nom+' attaque pour '+n+' dégâts ! Tu sens que tu commences à ralentir...';
    case 'paralyse':return nom+' attaque pour '+n+' dégâts ! Te voilà complètement paralysé, oh merde !';
    case 'rapide':return 'Tu as été attaqué pour '+n+' dégâts !';
    case 'rapideFin':return nom+' a attaqué pour '+n+' dégâts ! Il semble avoir arrêté de s\'agiter.';
    case 'croit':return nom+' a attaqué pour '+n+' dégâts ! Il gonfle aussi ! Flippant !';
    case 'gant':return nom+' te met un crochet du gauche pour '+n+' dégâts !';
    case 'gantPuissant':return nom+' te fait goûter au Gant de puissance pour '+n+' dégâts !';
    case 'explosion':return nom+' EXPLOSE POUR '+n+' DÉGÂTS !';
    case 'tirBras':return nom+' te touche d\'un tir pour '+n+' dégâts !';
    case 'succion':return nom+' te frappe pour '+n+' dégâts et se soigne de 10 % !';
    case 'devore':return nom+' TE DÉVORE pour '+n+' dégâts !';
    case 'sauterelle':return 'DES SAUTERELLES T\'ATTAQUENT LE VISAGE POUR '+n+' DÉGÂTS !';
    case 'rat':return 'UN TRILLION DE RATS TE LACÈRENT LE VISAGE POUR '+n+' DÉGÂTS !';
    case 'saigne':return nom+' t\'a haché les membres pour '+n+' dégâts ! Tu sens que tu saignes...';
    default:return nom+' a attaqué pour '+n+' dégâts !';
  }
}
function titan(kind,nom,o){
  o=o||{};
  switch(kind){
    case 'gant':return ['En même temps, le Nerd enfile un Gant de puissance à sa main droite !','Attention, ça va être grave !'];
    case 'gantPuissant':return ['Ils t\'ont frappé si fort que leur gant s\'est brisé ! Tu es à l\'abri encore un petit moment. '];
    case 'piratage':return ['Le Greasy Nerd ouvre CheatEngine sur son PC et pirate NGU, augmentant sa puissance de 8 % ! '];
    case 'genou':return ['La Godmother ordonne à l\'un de ses hommes de main de te défoncer les genoux à la batte de baseball ! AÏE AÏE AÏE !!','Tes temps de recharge de mouvements sont estropiés !'];
    case 'explosionsDebut':return [nom+' se met à briller en blanc ! PLAQUE-TOI AU SOL !',nom+' SE MET À EXPLOSER COMME UN MALADE !!!'];
    case 'tirBras':return ['Le buster de '+nom+' libère un énorme tir chargé !'];
    case 'brasCharge':return [nom+' charge le Buster Arm ! BAISSE-TOI !!'];
    case 'exileSaignement':return [nom+' t\'encorne ! Tu saignes abondamment maintenant !'];
    case 'exileParalysie':return [nom+' dresse ses antennes et prend le contrôle de ton esprit ! Tu ne contrôles plus ton corps du tout !'];
    case 'succion':return [nom+' enroule un tentacule autour de toi et aspire ta vie !'];
    case 'invincible':return [nom+' est complètement invulnérable à tes attaques !','Si seulement tu pouvais l\'empoisonner avec de la mauvaise cuisine !'];
    case 'spores':return [nom+' projette un nuage de spores ! Tes bras deviennent soudain si lourds...'];
    case 'draine':return [nom+' projette un nuage de spores ! Tu tousses et tu siffles, l\'énergie quitte ton corps...'];
    case 'rats':return [nom+' invoque un TRILLION DE RATS FURIEUX POUR TE BOUFFER LE VISAGE ! ILS ARRIVENT !!!'];
    case 'sauterelles':return [nom+' ouvre la bouche de façon anormalement grande et crache 100 000 PUTAINS DE SAUTERELLES ! ILS ARRIVENT !!!'];
    case 'reductionPV':return [nom+' déchaîne la puissance des MacGuffins pour réduire tes PV à un niveau critique !'];
    case 'bouclier':return ['Les MacGuffins de '+nom+' brillent en vert et '+(o.renforce?'le bouclier d\'énergie se renforce !':'un bouclier d\'énergie se matérialise !')];
    case 'accelere':return [nom+' devient rouge ! Il a accéléré définitivement la croissance de sa puissance !'];
    case 'chemise':return [nom+' rentre les bras dans sa chemise et se met à agiter ses manches vides d\'avant en arrière !'].concat(o.desactive?['Tu es tellement déconcerté par ce spectacle que l\'un de tes mouvements a été désactivé !']:[]);
    case 'paralyse':return [nom+' se met à te hurler des obscénités ! Ça te flippe tellement que tu es paralysé de peur !'];
    case 'walderpDit':return [(o.dit?'WALDERP DIT ':'')+'FRAPPE-MOI AVEC UNE ATTAQUE '+(CONSIGNES[o.consigne]||'NORMALE')];
    case 'walderpExplose':return [o.dit?'Le randonneur dément ricane : « TU N\'AS PAS FAIT CE QUE WALDERP DIT, ESPÈCE D\'ABRUTI ! C\'EST L\'HEURE DE MOURIIIIIIIR ! »':'Le randonneur dément ricane : « JE N\'AI PAS DIT WALDERP DIT, ESPÈCE D\'ABRUTI ! C\'EST L\'HEURE DE MOURIIIIIIIR ! »','Il sort un gros bouton rouge et appuie dessus.'];
    case 'beastReflet':return ['Ton attaque rebondit sur la peau caoutchouteuse de THE BEAST !','Tu t\'es frappé toi-même pour '+o.n+' dégâts !'];
    case 'nerdAnnule':return ['Le Greasy Nerd recule sous le coup, affaibli : ton attaque ultime a annulé son dernier tour de piratage !'];
    case 'aura':return AURAS[o.aura]?AURAS[o.aura](nom):[];
    case 'explodeMob':return [nom+' a détoné comme un explosif thermonucléaire pour '+o.n+' dégâts !'];
    case 'chargeDebut':return [nom+' se met à rougeoyer... une énorme attaque arrive !'];
    case 'rapideDebut':return [nom+' a bondi en avant et s\'est mis à attaquer à toute vitesse !'];
    case 'tremble':return [nom+' se met à trembler violemment ! Que va-t-il se passer ?'];
    case 'poisonDegats':return ['Tu subis aussi '+o.n+' dégâts de poison !'];
    case 'liberte':return ['Tu t\'es libéré de la paralysie ! Redonne-leur une raclée, et vite !'];
    case 'presqueMort':return ['Tu es presque certainement mort.'];
    default:return [];
  }
}
window.__SOREAL_IDLE_JOURNAL_FR_V1__={actif:actif,defaut:DEFAUT,degats:DEGATS,attaque:attaque,titan:titan,
  premiereAtteinte:function(etage,pp){return ["Tu as atteint l'étage "+etage+" de l'I.T.O.P.O.D pour la première fois !","Tu as reçu un bonus unique de "+pp+" Points d'Atout !"];},
  changementEtage:function(de,vers){return "Le Floor Shifter de l'ITOPOD a changé ton étage actuel de "+de+" à "+vers+".";},
  victoire:function(nom){return 'Tu as vaincu '+nom+' !';},
  defaite:function(nom){return nom+' t\'a vaincu !';},
  soin:function(pv){return 'Tu t\'es soigné de '+pv+' PV !';},
  or:function(nom,n){return nom+' a lâché '+n+' pièces d\'or ! Génial !';},
  progres:function(n){return 'Tu as gagné '+n+' de progression vers ton prochain Point d\'Atout !';},
  pointAtout:function(n,pluriel){return pluriel?'Tu as gagné '+n+' Points d\'Atout !':'Tu as gagné 1 Point d\'Atout !';}
};
})();
