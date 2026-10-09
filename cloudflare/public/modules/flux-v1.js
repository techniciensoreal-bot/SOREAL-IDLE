/*
 * Fil d'actualité de SOREAL IDLE (Norman, 2026-10-01) : « voir ce que les gens font dans leur jeu (Mickaël vient de tuer <boss>, Sébastien a
 * débloqué <trophée>, Sylvain farme dans les égouts, Maxence a terrassé <titan>…), visible dans tous les menus, comme une écriture qui défile. »
 *
 * Les événements viennent du serveur (src/idle-flux-v1.js) par la réponse du battement du chat (toutes les ~20 s) : aucun appel de plus.
 * Un bandeau fixe en bas de l'écran, hors du rendu du jeu (donc présent dans tous les menus et jamais effacé par un re-rendu), fait défiler
 * les nouveautés ; chaque information n'est jouée qu'une fois (un seul passage), le bandeau apparaît et disparaît en fondu ; toucher/survoler met en pause.
 *
 * Anti-spoil (AGENTS.md règle n°2) : chaque phrase est construite CÔTÉ LECTEUR avec ce que le lecteur a déjà découvert
 * (window.__SOREAL_IDLE_ACTIVITE_V1__().connus) : un boss, un titan ou un trophée qu'il ne connaît pas devient « un boss », « un Titan »,
 * « un trophée » ; un Rebirth ou un Challenge n'est jamais mentionné tant que le lecteur n'a pas débloqué ces menus.
 */
(function(){
  'use strict';

  const MAX_ITEMS=30;
  const PX_PAR_SEC=46;
  /*
   * « En direct » (Norman, 2026-10-02 : « aucun message de rattrapage ») : le bandeau ne montre que ce qui vient de se passer. Une information de plus de
   * 90 s (arrivée après une absence, onglet resté en arrière-plan…) n'est jamais jouée, ni dans le bandeau ni dans le panneau du Chat.
   */
  const FRAICHEUR_MS=90000;

  let items=[];
  let chats=[];
  let file=[];
  const vus=new Set();
  let amorceFlux=false;
  let amorceChat=false;
  let phase='repos';
  let largeurVue=300;
  let dernier=0;
  let bandeau=null;
  let piste=null;
  let x=0;
  let enPause=false;
  let tPrec=0;
  let raf=0;

  function echapper(v){
    return String(v==null?'':v).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  /* Durée d'un run : « 8 h », « 8 h 12 min », « 45 min », « 3 j 4 h » (jamais de secondes au-delà d'une minute, arrondi à la minute inférieure). */
  function dureeRunTexte(secondes){
    let m=Math.floor((Number(secondes)||0)/60);
    if(!(m>0))return (Number(secondes)||0)>0?'moins d’une minute':'';
    const j=Math.floor(m/1440);m-=j*1440;
    const h=Math.floor(m/60);m-=h*60;
    const parts=[];
    if(j)parts.push(j+' j');
    if(h)parts.push(h+' h');
    if(m&&!j)parts.push(m+' min');
    return parts.join(' ');
  }

  /* Durée d'un Challenge : « 42 s », « 8 min 30 s », « 2 h 15 min » (secondes seulement sous 10 minutes). */
  function dureeChallengeTexte(secondes){
    const t=Math.round(Number(secondes)||0);
    if(!(t>0))return '';
    if(t<60)return t+' s';
    if(t<600)return Math.floor(t/60)+' min'+(t%60?' '+(t%60)+' s':'');
    return dureeRunTexte(t);
  }

  function contexte(){
    try{
      const f=window.__SOREAL_IDLE_ACTIVITE_V1__;
      const c=typeof f==='function'?f():null;
      return c&&c.connus?c:{zones:[],bossMax:0,connus:{boss:{},titan:{},succes:{},menus:{}}};
    }catch(e){return {zones:[],bossMax:0,connus:{boss:{},titan:{},succes:{},menus:{}}};}
  }

  /* Nombre lisible : 12 345, 1,2 M, 3,4e12… (jamais plus de 4 chiffres significatifs). */
  function nombreCourt(v){
    const n=Number(v)||0;
    if(Math.abs(n)<10000)return Math.round(n).toLocaleString('fr-FR');
    const unites=[[1e15,' Qa'],[1e12,' T'],[1e9,' Md'],[1e6,' M'],[1e3,' k']];
    for(let i=0;i<unites.length;i+=1){
      if(Math.abs(n)>=unites[i][0])return (Math.round(n/unites[i][0]*100)/100).toLocaleString('fr-FR')+unites[i][1];
    }
    return String(n);
  }
  /*
   * Récompense d'un jet du puits ou de la roue, dite avec les mots du lecteur : EXP, AP, statistiques d'Aventure, niveaux Wandoos, graines… Une récompense qui se rapporte à un système que le lecteur ne connaît pas
   * encore devient « une récompense » : jamais un nom de système verrouillé (règle n°2).
   */
  function recompenseTexte(r,boost,k){
    const rec=r&&typeof r==='object'?r:{};
    const m=(k&&k.menus)||{};
    const parties=[];
    let inconnue=false;
    Object.keys(rec).forEach(function(cle){
      const v=Number(rec[cle]);
      if(cle==='items'){parties.push('un lot d’objets');return;}
      if(!(v>0))return;
      if(cle==='experience'){if(m.spendExp)parties.push('+'+nombreCourt(v)+' EXP');else inconnue=true;return;}
      if(cle==='ap'){if(m.sellout)parties.push('+'+nombreCourt(v)+' AP');else inconnue=true;return;}
      if(cle==='adventureStats'||cle==='adventureHp'||cle==='adventureRegen'){
        if(m.aventure)parties.push('+'+nombreCourt(v)+(cle==='adventureStats'?' stats d’Aventure':cle==='adventureHp'?' PV d’Aventure':' régénération d’Aventure'));else inconnue=true;
        return;
      }
      if(cle==='wandoosLevels'){if(m.wandoos)parties.push('+'+nombreCourt(v)+' niveaux Wandoos');else inconnue=true;return;}
      if(cle==='seeds'){if(m.yggdrasil)parties.push('+'+nombreCourt(v)+' graines');else inconnue=true;return;}
      inconnue=true;
    });
    if(boost){if(m.aventure)parties.push('un boost');else inconnue=true;}
    if(!parties.length&&inconnue)return 'une récompense';
    return parties.join(' et ');
  }

  /*
   * Phrase d'un événement, ou null si elle ne doit pas être montrée à CE lecteur. Exportée pour les tests.
   * it = { type, nom, donnees, moi } ; ctx = résultat de __SOREAL_IDLE_ACTIVITE_V1__.
   */
  function phrase(it,ctx){
    const c=ctx||contexte();
    const k=c.connus||{boss:{},titan:{},succes:{},menus:{}};
    const d=it.donnees||{};
    const nom=it.moi?'Tu':it.nom;
    const verbe=function(toi,lui){return it.moi?toi:lui;};
    switch(it.type){
      case 'boss':{
        const n=Number(d.boss)||0;
        const nomBoss=n>0&&n<=Number(c.bossMax||0)?k.boss[n]:'';
        return {icone:'👹',texte:nomBoss?nom+verbe(' viens',' vient')+' de vaincre '+nomBoss:nom+verbe(' viens',' vient')+' de vaincre un boss'};
      }
      /* Fuite / défaite contre un boss (Norman, 2026-10-04) : le nom du boss n'est donné que si le lecteur l'a lui-même atteint (anti-spoil), comme pour la victoire. */
      case 'fuite':
      case 'defaite':{
        const n=Number(d.boss)||0;
        const nomBoss=n>0&&n<=Number(c.bossMax||0)?k.boss[n]:'';
        const cible=nomBoss||'un boss';
        /* Variantes d'humour pour les AUTRES joueurs (la variante 0 reste la phrase simple) ; le nom du boss suit la même règle anti-spoil. */
        const fuitesVariantes=[['a pris la fuite devant ',''],['a fui face à ','… la honte !'],['a détalé devant ',', les jambes à son cou'],['a battu en retraite devant ',' (stratégique, bien sûr 😏)'],['s’est souvenu d’un rendez-vous urgent, très loin de ',''],['a vu ',' et a soudain eu très envie de rentrer chez lui'],['a regardé ',' dans les yeux, puis a regardé la sortie'],['a fait un 100 mètres olympique pour échapper à ',''],['a crié « maman ! » devant ',''],['a pris ses jambes à son cou devant ',', et on ne le jugera pas… (un peu)'],['a laissé ',' gagner par forfait'],['a préféré le canapé à ',''],['a dit « à demain ! » à ',' et a disparu'],['a fait semblant d’avoir oublié le gaz devant ',''],['a tenté la technique du lapin face à ',''],['a découvert le bouton Fuite face à ',', quelle révélation'],['a sorti le drapeau blanc devant ',''],['a trouvé que ',' sentait mauvais et est parti'],['a trébuché dans sa fuite devant ',', mais il court encore'],['a joué la prudence face à ',', la honte l’a rattrapé'],['a promis de revenir plus fort contre ',', un jour… peut-être']];
        const defaitesVariantes=[['a perdu contre ',''],['est mort contre ',', une minute de silence… ou de fou rire'],['s’est fait écraser par ',', aïe aïe aïe'],['a pris une raclée par ',', mais il reviendra (peut-être)'],['a embrassé le sol devant ',''],['a fait une sieste forcée après ',''],['a offert la victoire à ',' sur un plateau'],['a été cueilli comme une fleur par ',''],['a goûté au poing de ',', ça pique'],['a trouvé ',' un peu plus costaud que prévu'],['a pris une leçon de la part de ',''],['a dit bonjour au sol grâce à ',''],['est tombé au combat contre ',', héroïquement (ou presque)'],['a servi d’entraînement à ',''],['a vu la vie en rose, puis en noir, face à ',''],['a fait un joli vol plané grâce à ',''],['a perdu son match contre ',' mais gagne notre sympathie'],['est reparti en morceaux après ',''],['a testé la solidité de ',', verdict : très solide'],['a oublié de se défendre face à ',''],['a encore perdu contre ',', la persévérance paie… un jour']];
        const variante=Math.abs(Number(it.id)||0);
        if(it.moi)return it.type==='fuite'?{icone:'🏃',texte:nom+' as pris la fuite devant '+cible}:{icone:'💀',texte:nom+' as perdu contre '+cible};
        return it.type==='fuite'
          ?{icone:'🏃',texte:nom+' '+fuitesVariantes[variante%fuitesVariantes.length][0]+cible+fuitesVariantes[variante%fuitesVariantes.length][1]}
          :{icone:'💀',texte:nom+' '+defaitesVariantes[variante%defaitesVariantes.length][0]+cible+defaitesVariantes[variante%defaitesVariantes.length][1]};
      }
      /* Sort de Blood Magic (Norman, 2026-10-04) : seulement pour un lecteur qui a le menu ; le nom du sort n'est donné que si le lecteur l'a déjà découvert (connus.sorts) ; le dernier sort n'est jamais nommé. */
      case 'sort':{
        if(!k.menus.sang)return null;
        const rang=Number(d.sort)||0;
        const nomSort=['','Blood NUMBER Boost','Iron Pill','Blood Spaghetti','Counterfeit Gold'][rang]||'';
        const visible=Boolean(k.sorts&&k.sorts[rang]);
        return {icone:'🩸',texte:nom+verbe(' as',' a')+' lancé '+(visible&&nomSort?'le sort '+nomSort:'un sort de Blood Magic')};
      }
      /* Puits sans fond et roue (Norman, 2026-10-04) : annoncés aux lecteurs qui connaissent le Money Pit ; chaque récompense n'est nommée que si le lecteur connaît le système qui s'y rapporte (anti-spoil). */
      case 'puits':{
        if(!k.menus.moneyPit)return null;
        const r=recompenseTexte(d.recompense,d.boost,k);
        return {icone:'🕳️',texte:nom+verbe(' as',' a')+' jeté '+nombreCourt(d.cout)+' d’or dans le puits'+(r?' : '+r:'')};
      }
      case 'roue':{
        if(!k.menus.moneyPit)return null;
        const r=recompenseTexte(d.recompense,false,k);
        return {icone:'🎡',texte:nom+verbe(' as',' a')+' tourné la roue'+(r?' : '+r:'')};
      }
      case 'histoire':
        return {icone:'🎬',texte:nom+verbe(' as regardé',' a regardé')+' une cinématique'};
      case 'succes':{
        const nomSucces=k.succes[String(d.id)];
        return {icone:'🏆',texte:nomSucces?nom+verbe(' as',' a')+' débloqué le trophée '+nomSucces:nom+verbe(' as',' a')+' débloqué un trophée'};
      }
      case 'titan':{
        if(!k.menus.titans)return null;
        const nomTitan=k.titan[String(d.id)];
        return {icone:'🔥',texte:nomTitan?nom+verbe(' viens',' vient')+' de terrasser un Titan : '+nomTitan:nom+verbe(' viens',' vient')+' de terrasser un Titan'};
      }
      /* Combat de titan lancé / perdu (Norman, 2026-10-04) : comme la victoire, seulement pour un lecteur qui connaît les Titans, nom donné s'il connaît ce titan. */
      case 'titanCombat':
      case 'titanPerdu':{
        if(!k.menus.titans)return null;
        const nomTitan=k.titan[String(d.id)];
        const cible=nomTitan?'le Titan '+nomTitan:'un Titan';
        return it.type==='titanCombat'
          ?{icone:'⚔️',texte:nom+verbe(' as',' a')+' lancé le combat contre '+cible}
          :{icone:'💀',texte:nom+verbe(' as',' a')+' perdu contre '+cible};
      }
      case 'defi':
        if(!k.menus.challenges)return null;
        {
          const dc=dureeChallengeTexte(d.duree);
          return {icone:'🏁',texte:nom+verbe(' as',' a')+' réussi un Challenge'+(dc?' en '+dc:'')};
        }
      /* « X vient de se connecter » : les connexions des AUTRES joueurs (la tienne, tu la connais). */
      case 'connexion':
        if(it.moi)return null;
        return {icone:'👋',texte:nom+' vient de se connecter'};
      case 'defiLance':
        if(!k.menus.challenges)return null;
        return {icone:'🏁',texte:nom+verbe(' as',' a')+' lancé un Challenge'};
      case 'set':{
        /* Le nom d'un set n'est donné que si le lecteur l'a lui-même complété (anti-spoil) ; sinon un set d'équipement, sans nom. */
        const nomSet=(k.sets||{})[String(d.id)];
        return {icone:'🛡️',texte:nomSet?nom+verbe(' as',' a')+' complété le set '+nomSet:nom+verbe(' as',' a')+' complété un set d’équipement'};
      }
      /* Achat en boutique (Norman, 2026-10-03 : « on voit l'achat des autres joueurs, oublie le sans spoil ») : annoncé à tous, avec l'article acheté. */
      case 'achat':{
        const ap=d.boutique==='sellout';
        const noms=(c.achatsNoms&&c.achatsNoms[ap?'sellout':'exp'])||{};
        const article=String(noms[d.id]||d.nom||'').trim();
        const fois=Number(d.n)>1?' ×'+Number(d.n):'';
        return {icone:'🛒',texte:article
          ?nom+verbe(' as',' a')+' acheté '+article+fois+' dans la '+(ap?'Boutique AP':'boutique EXP')
          :nom+verbe(' as',' a')+' fait un achat dans la '+(ap?'Boutique AP':'boutique EXP')};
      }
      /* Récompense de connexion (Norman, 2026-10-03) : annoncée aux joueurs qui connaissent déjà ce menu (comme les Titans ou les Challenges). */
      case 'calendrier':{
        if(!k.menus.moneyPit)return null;
        const ap=Number(d.ap)>0?' (+'+Math.round(Number(d.ap)).toLocaleString('fr-FR')+' AP)':'';
        const jour=Number(d.jour)>0?' du jour '+Math.floor(Number(d.jour)):'';
        return {icone:'📅',texte:nom+verbe(' as',' a')+' récupéré '+verbe('ta','sa')+' récompense de connexion'+jour+ap};
      }
      case 'rebirth':
        if(!k.menus.renaissance)return null;
        const dureeRun=dureeRunTexte(d.duree);
        return {icone:'♻️',texte:nom+verbe(' as',' a')+' fait un Rebirth'+(dureeRun?' après '+dureeRun+' de run':'')};
      /* Boss en cours de combat (Norman, 2026-10-07) : même règle que la victoire -- le nom n'est donné que si le lecteur a lui-même atteint ce boss. */
      case 'bossCombat':{
        const n=Number(d.boss)||0;
        const nomBoss=n>0&&n<=Number(c.bossMax||0)?k.boss[n]:'';
        return {icone:'👹',texte:nom+verbe(' combats',' combat')+(nomBoss?' '+nomBoss:' un boss')};
      }
      /* Menu visité (Norman, 2026-10-07) : annoncé seulement aux lecteurs qui ont déjà ce menu (anti-spoil). */
      case 'visite':{
        const l=LIEUX_VISITE[d.menu];
        if(!l)return null;
        const idVar=Math.abs(Number(it.id)||0);
        /* Menu que le lecteur n'a pas encore : on dit seulement que quelqu'un est dans un endroit à découvrir, sans le nommer. */
        if(!k.menus[d.menu])return {icone:'🗝️',texte:nom+' '+VISITE_MYSTERE[idVar%VISITE_MYSTERE.length]};
        if(it.moi)return {icone:l[0],texte:nom+' visites '+l[1]};
        /* Phrase d'humour choisie selon l'événement (stable pour un même événement, variée d'un événement à l'autre) : les phrases propres au menu, puis les phrases communes. */
        const v=l[2];
        /* Un menu peut avoir ses propres phrases seulement (4e élément) : on ne « fouille » pas dans Fight Boss, on s'y bat. */
        const generiques=Array.isArray(l[3])?l[3]:VISITE_GENERIQUES;
        const total=v.length+generiques.length;
        const n=idVar%total;
        if(n<v.length)return {icone:l[0],texte:v[n].split('{n}').join(nom)};
        const g=generiques[n-v.length];
        return {icone:l[0],texte:nom+' '+g[0]+l[1]+g[1]};
      }
      case 'farm':{
        const connue=(c.zones||[]).some(function(z){return Number(z.id)===Number(d.zoneId);});
        return {icone:'⚔️',texte:connue&&d.zoneNom?nom+verbe(' farmes',' farme')+' dans '+d.zoneNom:nom+verbe(' farmes',' farme')+' en Aventure'};
      }
      default:return null;
    }
  }

  /*
   * Menus visités (Norman, 2026-10-09 : « des phrases humoristiques par rapport aux menus visités »). [icône, nom pour « Tu visites … », variantes]. Seuls des lecteurs qui ont déjà le menu les voient
   * (anti-spoil, règle n°2) : chaque phrase ne nomme que le menu lui-même et ne raconte rien de ce qu'il contient.
   */
  const LIEUX_VISITE={
    spendExp:['🛒','la boutique EXP',['{n} vide son portefeuille à la boutique EXP','{n} fait les soldes de la boutique EXP','{n} regarde les prix de la boutique EXP en soupirant']],
    sellout:['🛍️','la Boutique AP',['{n} flâne à la Boutique AP','{n} se demande si ça se négocie, à la Boutique AP','{n} dépense ses AP sans compter']],
    shop:['🔮','la boutique',['{n} visite la boutique','{n} fait les magasins, comme un dimanche','{n} entre dans la boutique « juste pour regarder »','{n} compare les prix à la boutique, la calculette à la main']],
    moneyPit:['🕳️','le puits sans fond',['{n} jette de l’or dans le puits sans fond','{n} crie dans le puits sans fond… pas d’écho','{n} se penche un peu trop au bord du puits']],
    challenges:['🏁','les Challenges',['{n} s’échauffe avant les Challenges','{n} fait craquer ses doigts devant les Challenges','{n} se prépare à souffrir dans les Challenges','{n} relève un Challenge, courageux ou inconscient ?','{n} regarde les Challenges avec un mélange de peur et d’excitation','{n} se motive pour un Challenge de plus','{n} serre les dents devant les Challenges','{n} choisit son prochain Challenge avec soin','{n} jure qu’il va réussir ce Challenge, cette fois','{n} accepte un défi dans les Challenges, sans réfléchir','{n} se sent d’humeur à souffrir dans les Challenges','{n} prépare sa stratégie pour les Challenges','{n} relit les règles des Challenges, pour la dixième fois','{n} tente de dompter un Challenge','{n} se lance dans les Challenges, le sourire crispé','{n} fait le tour des Challenges, l’air de dire « facile »','{n} a décidé que les Challenges, c’est aujourd’hui','{n} se prépare mentalement aux Challenges','{n} défie les Challenges du regard','{n} ne sait pas dans quoi il s’engage avec les Challenges'],[]],
    titans:['🔥','les Titans',['{n} rend visite aux Titans, sans rendez-vous','{n} observe les Titans de loin, très loin','{n} prend son courage à deux mains devant les Titans','{n} frappe à la porte des Titans, un peu trop fort','{n} se demande s’il est assez fort pour les Titans','{n} compte ses PV avant d’aller voir les Titans','{n} fait un testament avant les Titans','{n} lève la tête vers les Titans, ils sont immenses','{n} prépare un plan, vaguement, contre les Titans','{n} bombe le torse devant les Titans','{n} fait mine de ne pas avoir peur des Titans','{n} vérifie son équipement avant les Titans','{n} espère que les Titans dorment encore','{n} salue poliment les Titans, au cas où','{n} rêve de terrasser un Titan','{n} respire un grand coup devant les Titans','{n} repère le Titan le plus costaud, juste pour avoir peur','{n} affûte ses armes pour les Titans','{n} se dit que les Titans, ça passe… peut-être','{n} serre les poings devant les Titans'],[]],
    sang:['🩸','Blood Magic',['{n} remue un chaudron dans Blood Magic','{n} bricole de la magie douteuse dans Blood Magic','{n} se salit les mains dans Blood Magic']],
    entrainement:['🥊','Basic Training',['{n} s’entraîne… ou fait semblant','{n} soulève de la fonte à Basic Training','{n} s’étire avant Basic Training','{n} fait chauffer ses muscles à Basic Training','{n} transpire à grosses gouttes à Basic Training','{n} enchaîne les répétitions à Basic Training','{n} se prend pour un champion à Basic Training','{n} bat son record à Basic Training, enfin presque','{n} remplit ses barres à Basic Training','{n} répartit son énergie à Basic Training','{n} s’entraîne dur à Basic Training, à l’ancienne','{n} fait ses étirements à Basic Training','{n} ne saute jamais le jour des jambes à Basic Training','{n} pousse un cri de guerrier à Basic Training','{n} prend un coup de fatigue à Basic Training','{n} se muscle à Basic Training','{n} respire à fond entre deux séries à Basic Training','{n} écoute son coach imaginaire à Basic Training','{n} rêve de gros bras à Basic Training','{n} gagne un niveau de plus à Basic Training'],[]],
    combat:['⚔️','Fight Boss',['{n} affûte son épée devant Fight Boss','{n} se motive devant Fight Boss','{n} jette un œil à Fight Boss, le cœur battant','{n} entre dans l’arène de Fight Boss, déterminé','{n} fait craquer ses jointures avant Fight Boss','{n} s’échauffe avant Fight Boss, ça sent la bagarre','{n} serre les poings devant Fight Boss','{n} prépare sa plus belle grimace pour Fight Boss','{n} lance un défi du regard depuis Fight Boss','{n} passe en mode guerrier dans Fight Boss','{n} respire un grand coup avant de se battre dans Fight Boss','{n} met son casque et file à Fight Boss','{n} fixe son prochain boss dans Fight Boss, l’œil mauvais','{n} se demande s’il a assez de vie pour Fight Boss','{n} répète ses coups devant le miroir de Fight Boss','{n} s’apprête à distribuer des baffes dans Fight Boss','{n} fait semblant d’être courageux devant Fight Boss','{n} se prend pour un héros devant Fight Boss','{n} jure que cette fois, c’est la bonne, dans Fight Boss','{n} ajuste son armure avant d’affronter Fight Boss'],[]],
    aventure:['🗺️','Adventure',['{n} prépare son sac pour l’Aventure','{n} part à l’Aventure sans carte','{n} fouille son sac d’Aventure à la recherche de rien','{n} lace ses bottes pour l’Aventure','{n} se demande quelle zone explorer en Aventure','{n} part en Aventure avec le sourire','{n} surveille son sac d’Aventure, plein à craquer','{n} cherche la zone parfaite pour farmer en Aventure','{n} se met en route pour l’Aventure, sac au dos','{n} compte ses PV avant l’Aventure','{n} rêve de butin en Aventure','{n} se lance en Aventure, l’épée à la main','{n} revient à l’Aventure comme à la maison','{n} choisit son équipement pour l’Aventure','{n} a l’air d’avoir perdu sa carte en Aventure','{n} espère un bon drop en Aventure','{n} trie son butin d’Aventure','{n} explore l’Aventure, un pas après l’autre','{n} se prépare à tomber sur un monstre en Aventure','{n} prend la route de l’Aventure, un sifflotement aux lèvres'],[]],
    renaissance:['♻️','Rebirth',['{n} médite devant Rebirth','{n} hésite à tout recommencer','{n} regarde Rebirth d’un air songeur']],
    augmentations:['🦾','les Augmentations',['{n} bidouille ses Augmentations','{n} négocie avec ses Augmentations','{n} ajoute des rouages à ses Augmentations']],
    avance:['🏋️','Advanced Training',['{n} sue sang et eau à Advanced Training','{n} fait des pompes à Advanced Training','{n} se plaint des courbatures d’Advanced Training','{n} passe à la vitesse supérieure à Advanced Training','{n} se jette dans Advanced Training, sans échauffement','{n} serre les dents à Advanced Training','{n} pousse ses limites à Advanced Training','{n} enchaîne les séries difficiles à Advanced Training','{n} ne lâche rien à Advanced Training','{n} se prend pour un athlète à Advanced Training','{n} fait des étirements très sérieux à Advanced Training','{n} trouve Advanced Training bien plus dur que Basic Training','{n} transpire encore plus qu’avant à Advanced Training','{n} monte en puissance à Advanced Training','{n} a des courbatures rien qu’en regardant Advanced Training','{n} avale une barre énergétique à Advanced Training','{n} se dépasse à Advanced Training','{n} hurle « encore une ! » à Advanced Training','{n} garde le rythme à Advanced Training','{n} devient un monstre à Advanced Training, petit à petit'],[]],
    machine:['⏱️','Time Machine',['{n} tripote les cadrans de Time Machine','{n} remonte le temps, ou presque, avec Time Machine','{n} règle Time Machine en croisant les doigts']],
    tower:['🏢','ITOPOD',['{n} grimpe dans ITOPOD, étage après étage','{n} en a plein les jambes dans ITOPOD','{n} se perd dans ITOPOD','{n} monte un étage de plus dans ITOPOD','{n} souffle un grand coup entre deux étages d’ITOPOD','{n} se demande combien d’étages il reste dans ITOPOD','{n} vise le sommet d’ITOPOD','{n} prend l’escalier d’ITOPOD, pas l’ascenseur','{n} compte les marches d’ITOPOD','{n} monte ITOPOD sans regarder en bas','{n} a le vertige dans ITOPOD','{n} fait une pause dans ITOPOD, les mollets en feu','{n} affronte l’étage suivant d’ITOPOD','{n} se motive pour grimper ITOPOD','{n} espère trouver un raccourci dans ITOPOD','{n} entame l’ascension d’ITOPOD','{n} tient bon dans ITOPOD','{n} mesure la hauteur d’ITOPOD, ça donne le tournis','{n} ne s’arrête pas de monter dans ITOPOD','{n} regarde les étoiles depuis ITOPOD'],[]],
    daycare:['🛠️','Item Daycare',['{n} dépose ses objets à Item Daycare','{n} câline ses objets à Item Daycare','{n} vérifie que ses objets ont bien mangé à Item Daycare']],
    ngu:['♾️','NGU',['{n} fait chauffer NGU','{n} bichonne ses NGU','{n} observe NGU grandir, tranquillement']],
    wandoos:['💻','Wandoos',['{n} redémarre Wandoos, en espérant le meilleur','{n} se bat avec Wandoos','{n} attend que Wandoos veuille bien répondre']],
    yggdrasil:['🌱','Yggdrasil',['{n} arrose Yggdrasil','{n} parle à Yggdrasil, qui ne répond pas','{n} guette les fruits d’Yggdrasil']],
    diggers:['⛏️','Gold Diggers',['{n} inspecte ses Gold Diggers','{n} met les Gold Diggers au travail','{n} compte les pelletées de ses Gold Diggers']],
    beards:['🧔','Beards',['{n} peigne ses Beards','{n} taille ses Beards avec soin','{n} admire ses Beards dans le miroir']],
    macguffins:['🧩','MacGuffins',['{n} range ses MacGuffins','{n} cherche à quoi servent ses MacGuffins','{n} astique ses MacGuffins']],
    hacks:['🧪','Hacks',['{n} pirate allègrement dans Hacks','{n} tape très vite dans Hacks, l’air mystérieux','{n} bidouille Hacks en capuche']],
    questing:['📋','Questing',['{n} épluche le tableau de Questing','{n} se demande quelle quête choisir dans Questing','{n} part en quête dans Questing']],
    quirks:['📚','Quirks',['{n} consulte ses Quirks','{n} étudie ses Quirks, le nez dans les livres','{n} révise ses Quirks']],
    wishes:['🌠','Wishes',['{n} fait un vœu dans Wishes','{n} lève les yeux vers Wishes','{n} espère très fort dans Wishes']],
    cards:['🃏','Cards',['{n} bat ses Cards','{n} range ses Cards par couleur','{n} garde une carte sous la manche dans Cards']],
    cooking:['🍲','Cooking',['{n} met la main à la pâte dans Cooking','{n} goûte sa soupe dans Cooking','{n} fait brûler quelque chose dans Cooking']],
    chroniques:['📜','les Chroniques',['{n} feuillette les Chroniques','{n} relit ses exploits dans les Chroniques','{n} se la raconte dans les Chroniques']],
    parametres:['⚙️','les réglages',['{n} règle ses paramètres au millimètre','{n} fouille dans les réglages','{n} tourne tous les boutons des réglages']]
  };

  const VISITE_GENERIQUES=[['fait un tour dans ',''],['traîne dans ',', l’air de rien'],['est entré dans ',' sans frapper'],['se perd un instant dans ',''],['bidouille dans ',', ne le dérangez pas'],['jette un œil dans ',', par curiosité'],['est en pleine réflexion dans ',''],['passe une tête dans ',', juste pour voir'],['fouille un peu dans ',''],['s’installe confortablement dans ',''],['fait semblant de comprendre ce qu’il fait dans ',''],['est en mission secrète dans ',''],['a une idée derrière la tête dans ',''],['se prend pour un expert dans ',''],['a l’air très sérieux dans ',''],['prend son temps dans ',', il n’est pas pressé'],['s’est perdu dans ',', quelqu’un a une carte ?'],['fait ses petites affaires dans ',''],['a trouvé un coin tranquille dans ','']];
  /* Visite d'un menu que le LECTEUR n'a pas encore : jamais le nom du menu (règle n°2), seulement qu'il existe un endroit à découvrir (Norman, 2026-10-09). */
  const VISITE_MYSTERE=['se promène dans un endroit que tu n’as pas encore découvert…','explore un coin du jeu qui t’est encore inconnu','est quelque part où tu n’es jamais allé','fait un tour dans un lieu mystérieux, que tu ne connais pas encore','a disparu dans un endroit que tu n’as pas encore trouvé','chuchote avec quelque chose que tu n’as pas encore croisé','visite un endroit secret… pour toi, en tout cas','est parti là où tu n’as pas encore mis les pieds','se balade dans une zone du jeu qui reste un mystère pour toi','ouvre une porte que tu n’as pas encore trouvée','fait des trucs dans un endroit dont tu ne soupçonnes rien','est dans un lieu que tu découvriras plus tard… peut-être','s’amuse quelque part où tu n’es pas encore invité','fouille un coin que tu n’as jamais vu','est en tête de peloton : il est dans un endroit que tu ne connais pas','te cache quelque chose : il est dans un endroit encore secret pour toi','est en visite privée dans un lieu inconnu de toi','traîne dans un endroit que tu n’as pas encore découvert, ça viendra','fait coucou depuis un endroit que tu n’as pas encore découvert','profite d’un endroit que tu ne connais pas encore, tu verras plus tard'];

  function ilya(at){
    const s=Math.max(0,Math.round((Date.now()-at)/1000));
    if(s<60)return 'à l’instant';
    const m=Math.round(s/60);
    if(m<60)return 'il y a '+m+' min';
    return 'il y a '+Math.round(m/60)+' h';
  }

  /* Messages du chat : publics, donc sans filtre de découverte ; passent EN ENTIER (Norman, 2026-10-03 : « quand un message est trop long, il est coupé dans En Direct ») : le bandeau défile en continu, la longueur n'est pas un problème (280 caractères au plus côté chat). */
  function texteChat(m){
    return String(m||'').replace(/\s+/g,' ').trim();
  }

  function visibles(){
    const ctx=contexte();
    const sortie=[];
    items.forEach(function(it){
      const p=phrase(it,ctx);
      /* Chacun ne voit que ce que font les AUTRES : jamais ses propres événements (Norman, 2026-10-07). */
      if(p&&!it.moi)sortie.push({id:it.id,at:it.at,icone:p.icone,texte:p.texte,moi:it.moi,recu:it.recu});
    });
    chats.forEach(function(m){
      if(m.message)sortie.push({id:'c'+m.id,at:m.at,icone:'💬',texte:(m.moi?'Toi':m.nom)+' : '+texteChat(m.message),moi:m.moi,chat:true,recu:m.recu});
    });
    sortie.sort(function(a,b){return a.at-b.at;});
    return sortie;
  }

  /* ---------- bandeau ---------- */
  function css(){
    if(document.getElementById('sorealIdleFluxStyleV1'))return;
    const st=document.createElement('style');
    st.id='sorealIdleFluxStyleV1';
    st.textContent=
      '#sorealIdleFluxV1{position:fixed;left:0;right:0;bottom:0;z-index:55;height:34px;display:flex;align-items:center;overflow:hidden;'+
        'padding-bottom:env(safe-area-inset-bottom,0);box-sizing:content-box;'+
        'background:linear-gradient(180deg,var(--th-bg,#16233a),var(--th-bg2,#0b1220));border-top:1px solid var(--th-line,rgba(94,234,212,.4));'+
        'box-shadow:0 -6px 18px -10px var(--th-glow,rgba(94,234,212,.5));color:var(--th-ink,#e8fffb);font:700 13px/1 inherit;-webkit-user-select:none;user-select:none;'+
        'opacity:1;transition:opacity .6s ease,visibility 0s linear 0s}'+
      '#sorealIdleFluxV1.sif-off{opacity:0;visibility:hidden;pointer-events:none;transition:opacity .6s ease,visibility 0s linear .6s}'+
      '#sorealIdleFluxV1[hidden]{display:none}'+
      '#sorealIdleFluxV1 .sif-tag{flex:0 0 auto;z-index:2;padding:0 12px;height:100%;display:flex;align-items:center;gap:6px;font-weight:900;letter-spacing:.06em;font-size:14px;'+
        'background:linear-gradient(90deg,var(--th-a,#5eead4),var(--th-b,#25b9a4));color:#06201c;clip-path:polygon(0 0,100% 0,calc(100% - 10px) 100%,0 100%);padding-right:20px}'+
      '#sorealIdleFluxV1 .sif-vue{flex:1;min-width:0;overflow:hidden;height:100%;display:flex;align-items:center;'+
        '-webkit-mask-image:linear-gradient(90deg,transparent,#000 24px,#000 calc(100% - 24px),transparent);mask-image:linear-gradient(90deg,transparent,#000 24px,#000 calc(100% - 24px),transparent)}'+
      '#sorealIdleFluxV1 .sif-piste{display:flex;align-items:center;white-space:nowrap;will-change:transform}'+
      '#sorealIdleFluxV1 .sif-it{display:inline-flex;align-items:center;gap:6px;padding:0 18px;border-right:1px solid var(--th-line,rgba(255,255,255,.14))}'+
      '#sorealIdleFluxV1 .sif-it.moi{color:var(--th-num,#fff)}'+
      '#sorealIdleFluxV1 .sif-it .ic{font-size:15px}'+
      'body.soreal-idle-flux-actif-v1 .soreal-idle-native-v4{padding-bottom:44px}'+
      /* Panneau dans la page Chat */
      '.sif-panneau{margin:0 0 10px;border:1px solid var(--th-line,rgba(255,255,255,.18));border-radius:16px;background:rgba(0,0,0,.22);overflow:hidden}'+
      '.sif-panneau .sif-ph{padding:8px 12px;font-size:15px;font-weight:900;letter-spacing:.04em;border-bottom:1px solid var(--th-line,rgba(255,255,255,.12))}'+
      '.sif-panneau .sif-pl{max-height:150px;overflow-y:auto;padding:6px 12px;display:grid;gap:5px}'+
      '.sif-panneau .sif-pi{display:flex;gap:8px;align-items:baseline;font-size:15px}'+
      '.sif-panneau .sif-pi small{margin-left:auto;flex:0 0 auto;color:var(--th-dim,#8b93ab);font-size:13px}'+
      '.sif-panneau .sif-vide{padding:10px 12px;color:var(--th-dim,#8b93ab);font-size:14px}';
    document.head.appendChild(st);
  }

  function construire(){
    if(bandeau&&document.body.contains(bandeau))return;
    css();
    bandeau=document.createElement('div');
    bandeau.id='sorealIdleFluxV1';
    bandeau.className='sif-off';
    bandeau.setAttribute('role','marquee');
    bandeau.setAttribute('aria-label','Activité des joueurs');
    bandeau.innerHTML='<div class="sif-tag">📰 EN DIRECT</div><div class="sif-vue"><div class="sif-piste"></div></div>';
    piste=bandeau.querySelector('.sif-piste');
    ['mouseenter','touchstart','pointerdown'].forEach(function(t){bandeau.addEventListener(t,function(){enPause=true;},{passive:true});});
    ['mouseleave','touchend','touchcancel','pointerup'].forEach(function(t){bandeau.addEventListener(t,function(){enPause=false;},{passive:true});});
    document.body.appendChild(bandeau);
  }

  function htmlItem(p){
    return '<span class="sif-it'+(p.moi?' moi':'')+'"><span class="ic">'+p.icone+'</span><span>'+echapper(p.texte)+'</span></span>';
  }

  /*
   * Lecture du bandeau (Norman, 2026-10-02 : « les informations ne doivent passer qu'une seule fois et au moment où elles arrivent uniquement ») :
   * défilement CONTINU. Chaque information est ajoutée au bout de la piste à l'instant où elle arrive (elle entre par la droite, même si une autre est
   * encore en train de défiler : plus d'attente de la fin d'un lot), traverse l'écran UNE seule fois, puis est retirée. Le bandeau apparaît à la première
   * information et disparaît (fondu) quand la piste est vide. Une même phrase déjà passée il y a moins de 2 minutes n'est pas rejouée.
   */
  let derniereImage=0;
  let derniereVue=new Map();
  const DOUBLON_MS=120000;

  function ajouterAuBandeau(e){
    const p=e&&e.texte;
    if(!p)return;
    const maintenant=performance.now();
    const vuLe=derniereVue.get(e.texte);
    if(vuLe!==undefined&&maintenant-vuLe<DOUBLON_MS)return;
    derniereVue.set(e.texte,maintenant);
    if(derniereVue.size>60){derniereVue.forEach(function(t,k){if(maintenant-t>=DOUBLON_MS)derniereVue.delete(k);});}
    largeurVue=bandeau.querySelector('.sif-vue').clientWidth||largeurVue||300;
    const modele=document.createElement('div');
    modele.innerHTML=htmlItem(e);
    const noeud=modele.firstChild;
    if(!piste.firstChild){
      x=largeurVue;
    }else{
      /* La piste a déjà fini de défiler vers la gauche : un blanc la prolonge pour que la nouvelle information entre bien par la droite, au moment où elle arrive. */
      const finPiste=x+piste.scrollWidth;
      if(finPiste<largeurVue){
        const blanc=document.createElement('span');
        blanc.className='sif-blanc';
        blanc.style.cssText='display:inline-block;flex:none;width:'+Math.ceil(largeurVue-finPiste)+'px';
        piste.appendChild(blanc);
      }
    }
    piste.appendChild(noeud);
    piste.style.transform='translateX('+x.toFixed(1)+'px)';
    bandeau.classList.remove('sif-off');
    document.body.classList.add('soreal-idle-flux-actif-v1');
    phase='defile';
  }

  function viderBandeau(){
    if(piste)piste.innerHTML='';
    if(bandeau)bandeau.classList.add('sif-off');
    document.body.classList.remove('soreal-idle-flux-actif-v1');
    phase='repos';
  }

  function boucle(t){
    raf=requestAnimationFrame(boucle);
    if(!tPrec)tPrec=t;
    const dt=Math.min(0.1,(t-tPrec)/1000);
    tPrec=t;
    if(!bandeau)return;
    const now=performance.now();
    if(document.visibilityState!=='visible'){derniereImage=0;return;}
    /* Retour après une absence (onglet en arrière-plan) : ce qui défilait n'est plus « en direct », la piste repart de zéro. */
    if(derniereImage&&now-derniereImage>5000&&piste.firstChild)viderBandeau();
    derniereImage=now;
    /* Ce qui vient d'arriver passe tout de suite (jamais attendre) ; ce qui a trop attendu (onglet masqué) est écarté. */
    while(file.length){
      const e=file.shift();
      if(e.recu>0&&now-e.recu>FRAICHEUR_MS)continue;
      ajouterAuBandeau(e);
    }
    if(!piste.firstChild||enPause)return;
    x-=PX_PAR_SEC*dt;
    /* Une information entièrement sortie à gauche est retirée : elle n'est jamais rejouée. */
    while(piste.firstChild){
      const premier=piste.firstChild;
      const w=premier.getBoundingClientRect().width;
      if(x+w>0)break;
      piste.removeChild(premier);
      x+=w;
    }
    if(!piste.firstChild)return viderBandeau();
    piste.style.transform='translateX('+x.toFixed(1)+'px)';
  }

  /* Met en file ce qui n'a jamais été joué. Au tout premier passage de chaque source (chargement), on mémorise sans rejouer l'historique. */
  function enfiler(){
    visibles().forEach(function(e){
      if(vus.has(e.id))return;
      vus.add(e.id);
      if(e.chat?amorceChat:amorceFlux)file.push(e);
    });
  }

  /* ---------- données ---------- */
  function recevoir(liste,heureServeur){
    /* Le bandeau n'existe qu'une fois connecté : dès la première réponse du serveur (même sans nouvelle). */
    if(!bandeau)construire();
    if(!raf)raf=requestAnimationFrame(boucle);
    const maintenant=Number(heureServeur)>0?Number(heureServeur):Date.now();
    const nouveaux=(Array.isArray(liste)?liste:[]).map(function(it){
      return {id:Number(it&&it.id)||0,at:Number(it&&it.at)||0,nom:String(it&&it.nom||'Joueur'),type:String(it&&it.type||''),donnees:(it&&it.donnees)||{},moi:Boolean(it&&it.moi),recu:performance.now()};
    }).filter(function(it){
      if(it.id<=0)return false;
      /* Trop ancien : on avance simplement le repère pour ne plus le redemander, sans le montrer. */
      if(it.at>0&&maintenant-it.at>FRAICHEUR_MS){if(it.id>dernier)dernier=it.id;return false;}
      return true;
    });
    const connus=new Set(items.map(function(it){return it.id;}));
    let ajoute=false;
    nouveaux.forEach(function(it){if(!connus.has(it.id)){items.push(it);ajoute=true;}});
    if(ajoute){
      /* Petit bruit quand quelqu'un d'autre se connecte (jamais pour soi, une seule fois par lot). */
      if(nouveaux.some(function(it){return it.type==='connexion'&&!it.moi&&!connus.has(it.id);})){
        try{const audio=window.__SOREAL_IDLE_AUDIO_V199__;if(audio&&typeof audio.joueurConnecte==='function')audio.joueurConnecte();}catch(e){}
      }
      items.sort(function(a,b){return a.id-b.id;});
      if(items.length>MAX_ITEMS)items=items.slice(items.length-MAX_ITEMS);
      dernier=items[items.length-1].id;
      enfiler();
      majPanneaux();
    }
    amorceFlux=true;
    return ajoute;
  }

  /* Nouveaux messages du chat (modules/chat-v1.js) : le premier lot reçu au chargement n'est pas rejoué dans le bandeau. */
  function recevoirChat(liste,initial,heureServeur){
    if(!bandeau)construire();
    if(!raf)raf=requestAnimationFrame(boucle);
    const maintenant=Number(heureServeur)>0?Number(heureServeur):Date.now();
    const connus=new Set(chats.map(function(m){return m.id;}));
    let ajoute=false;
    (Array.isArray(liste)?liste:[]).forEach(function(m){
      if(!m||!m.id||connus.has(m.id))return;
      /* Premier lot (historique du chat) ou message devenu trop ancien : jamais montré dans le bandeau ; marqué « déjà vu » pour ne pas être redemandé. */
      if(initial||(Number(m.at)>0&&maintenant-Number(m.at)>FRAICHEUR_MS)){vus.add('c'+m.id);return;}
      chats.push({id:m.id,at:Number(m.at)||Date.now(),nom:String(m.nom||'Joueur'),message:String(m.message||''),moi:Boolean(m.moi),recu:performance.now()});
      ajoute=true;
    });
    if(ajoute){
      chats.sort(function(a,b){return a.id-b.id;});
      if(chats.length>MAX_ITEMS)chats=chats.slice(chats.length-MAX_ITEMS);
      enfiler();
      majPanneaux();
    }
    if(initial)amorceChat=true;
    return ajoute;
  }

  /* ---------- panneau dans la page Chat ---------- */
  function htmlPanneau(){
    const liste=visibles().slice(-12).reverse();
    return '<div class="sif-panneau"><div class="sif-ph">📰 Activité des joueurs</div>'+
      (liste.length
        ?'<div class="sif-pl">'+liste.map(function(p){return '<div class="sif-pi"><span>'+p.icone+'</span><span>'+echapper(p.texte)+'</span><small>'+ilya(p.at)+'</small></div>';}).join('')+'</div>'
        :'<div class="sif-vide">Rien pour le moment : ce que font les autres joueurs apparaîtra ici, en direct.</div>')+
      '</div>';
  }
  function majPanneaux(){
    document.querySelectorAll('[data-flux-panneau-v1]').forEach(function(n){n.innerHTML=htmlPanneau();});
  }

  window.__SOREAL_IDLE_FLUX_V1__={
    recevoir:recevoir,
    recevoirChat:recevoirChat,
    dernier:function(){return dernier;},
    /* Repère du premier battement : tout ce qui date d'avant l'arrivée du joueur est ignoré. */
    amorcer:function(id){id=Number(id)||0;if(id>dernier)dernier=id;amorceFlux=true;},
    amorce:function(){return amorceFlux;},
    phrase:phrase,
    lieuxVisite:LIEUX_VISITE,
    htmlPanneau:htmlPanneau,
    majPanneaux:majPanneaux,
    construire:construire,
    visibles:visibles,
    enAttente:function(){return file.length;},
    items:function(){return items.slice();}
  };

})();
