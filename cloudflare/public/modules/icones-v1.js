/*
 * SOREAL IDLE — emojis des menus (Norman, 2026-10-02) : « des emojis dans le menu Basic : Attaque, Blocage, Bonus défensif… dans tous les menus.
 * Il faut plus d'emojis cool ! »
 *
 * Un seul endroit pour les dessins des noms (compétences, pistes, fruits, diggers, NGU, souhaits…) : les menus demandent
 * « avec(famille, id, nom) » et reçoivent « 🔥 Bonus offensif ». Table explicite par identifiant quand on le connaît ; sinon un
 * emoji déduit des mots du nom (Energy ⚡, Magic 🔮, Drop 🎲…) pour les longues listes (Perks, Quirks). Aucun emoji n'est inventé pour un nom
 * sans rapport : « » (rien) plutôt qu'un dessin au hasard.
 *
 *   window.__SOREAL_IDLE_ICONES_V1__ = { pour(famille,id,nom), avec(famille,id,nom), motsCles(nom) }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_ICONES_V1__)return;

var TABLES={
  /* Basic Training : une attaque par ligne d'escalade, une défense par ligne. */
  basicTraining:{
    attaque_passive:'👊',attaque_reguliere:'🗡️',attaque_renforcee:'💥',contre_palette:'🤺',percee_quai:'🏹',ultime_soreal:'☄️',
    blocage:'🛡️',defense_renforcee:'🧱',recuperation:'💚',boost_offensif:'🔥',charge_logistique:'🐂',ultime_logistique:'👑'
  },
  /* Time Machine. */
  timeMachine:{vitesse:'⏱️',or:'🪙'},
  /* Yggdrasil : les fruits. */
  yggdrasil:{
    gold:'🪙',powerAlpha:'💪',adventure:'🗺️',knowledge:'🧠',pomegranate:'🍎',luck:'🍀',powerBeta:'🏋️',arbitrariness:'🎲',numbers:'🔢',rage:'😡',
    macguffinAlpha:'🧩',powerDelta:'🔱',watermelon:'🍉',macguffinBeta:'🧩',quirks:'📚',angryMayo:'🥫',sadMayo:'🥫',moldyMayo:'🥫',ayyMayo:'🥫',cincoMayo:'🥫',prettyMayo:'🥫'
  },
  /* Gold Diggers. */
  diggers:{
    drop:'🎲',wandoos:'💻',stats:'📊',adventure:'🗺️',energyNgu:'⚡',magicNgu:'🔮',energyBeard:'⚡🧔',magicBeard:'🔮🧔',pp:'⭐',daycare:'🛠️',blood:'🩸',experience:'✨'
  },
  /* NGU. */
  ngu:{
    augments:'🦾',wandoos:'💻',respawn:'⏳',gold:'🪙',adventureAlpha:'🗺️',powerAlpha:'💪',dropChance:'🎲',magicNgu:'🔮',pp:'⭐',yggdrasil:'🌱',exp:'✨',
    powerBeta:'🏋️',number:'🔢',timeMachine:'⏱️',energyNgu:'⚡',adventureBeta:'🧭'
  },
  /* Beards. */
  beards:{attack:'⚔️',drop:'🎲',defense:'🔢',ngu:'♾️',pp:'💻',adventure:'🗺️',gold:'🪙'},
  /* Hacks. */
  hacks:{
    attackDefense:'⚔️',adventureStats:'🗺️',timeMachineSpeed:'⏱️',dropChance:'🎲',augmentSpeed:'🦾',energyNguSpeed:'⚡',magicNguSpeed:'🔮',bloodGain:'🩸',
    qpGain:'📋',daycare:'🛠️',exp:'✨',number:'🔢',pp:'⭐',hackHack:'🧪',wish:'🌠'
  },
  /* Wandoos (pistes éventuelles). */
  wandoos:{energy:'⚡',magic:'🔮'}
};

/* Mots du nom -> emoji, dans l'ordre (le premier trouvé gagne). Pour les longues listes (Perks, Quirks, Souhaits…). */
var MOTS=[
  [/blood|sang/i,'🩸'],[/energy|énergie|energie/i,'⚡'],[/magic|magie/i,'🔮'],[/adventure|aventure/i,'🗺️'],
  [/drop|loot/i,'🎲'],[/\bexp\b|experience|expérience|knowledge/i,'✨'],[/\bpp\b|perk point/i,'⭐'],[/\bqp\b|quirk point/i,'📋'],
  [/attack|defense|défense|stat\b|stats\b|toughness|power|strength/i,'⚔️'],[/gold|\bor\b|money|coin|rich/i,'🪙'],
  [/inventory|slot|space/i,'🎒'],[/titan/i,'👹'],[/boss/i,'👹'],[/rebirth|renaissance/i,'♻️'],[/number|nombre/i,'🔢'],
  [/time machine|machine/i,'⏱️'],[/augment/i,'🦾'],[/wandoos/i,'💻'],[/\bngu\b/i,'♾️'],[/yggdrasil|seed|fruit/i,'🌱'],
  [/beard|barbe/i,'🧔'],[/daycare/i,'🛠️'],[/macguffin/i,'🧩'],[/cook|food|meal|repas/i,'🍲'],[/card|carte/i,'🃏'],[/mayo/i,'🥫'],
  [/wish|souhait/i,'🌠'],[/hack/i,'🧪'],[/quest|quête/i,'📋'],[/luck|chance/i,'🍀'],[/speed|vitesse|fast/i,'💨'],
  [/newbie|baby|first/i,'🐣'],[/cap\b|bars?\b/i,'📏'],[/respawn/i,'⏳']
];

function motsCles_(nom){
  var t=String(nom==null?'':nom);
  for(var i=0;i<MOTS.length;i+=1){if(MOTS[i][0].test(t))return MOTS[i][1];}
  return '';
}

function pour_(famille,id,nom){
  var t=TABLES[famille];
  if(t&&id!=null&&Object.prototype.hasOwnProperty.call(t,String(id)))return t[String(id)];
  return motsCles_(nom);
}

/* « 🔥 Bonus offensif » : l'emoji (s'il existe) suivi du nom ; le nom seul sinon. Le texte n'est pas échappé (l'appelant le fait). */
function avec_(famille,id,nom){
  var e=pour_(famille,id,nom);
  return (e?e+' ':'')+String(nom==null?'':nom);
}

window.__SOREAL_IDLE_ICONES_V1__={pour:pour_,avec:avec_,motsCles:motsCles_,tables:TABLES};
})();
