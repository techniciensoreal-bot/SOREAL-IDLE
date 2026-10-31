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
   * Récompense d'un jet du trou ou de la roue, dite avec les mots du lecteur : EXP, AP, statistiques d'Aventure, niveaux Wandoos, graines… Une récompense qui se rapporte à un système que le lecteur ne connaît pas
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

  /* Phrases du fil pour le nettoyage (Norman, 2026-10-30 / 2026-10-31) : {nom} = le joueur qui a nettoyé, {ap} = son gain. Phrase choisie d'après le numéro de l'événement (la même pour tous les lecteurs). */
  const PHRASES_NETTOYAGE_AP={
    coffre:[
      '{nom} a du caca jusqu’aux coudes, mais ça valait le coup pour ses {ap} AP.',
      '{nom} sent encore le coffre. Les doigts ne sentent plus rien, mais les {ap} AP sentent très bon.',
      '{nom} a juré de ne plus jamais dire « c’est juste de la boue ». {ap} AP, c’est dur à digérer.',
      'Le coffre de {nom} brille. {nom} est un peu vert. Compensation : {ap} AP.',
      '{nom} jure que l’éponge n’était pas la sienne. {ap} AP plus tard, plus de questions.',
      '{nom} a frotté si fort que le gant et un bout d’orgueil y sont passés. {ap} AP.',
      '{nom} se lave les mains pour la douzième fois. {ap} AP, ça se rince mal.',
      'Le coffre de {nom} dit merci en silence. Les {ap} AP, eux, sont plus polis.'
    ],
    valise:[
      '{nom} a du vomi partout sur lui mais ça valait le coup pour ses {ap} AP.',
      'La valise de {nom} sent la menthe et le regret. {nom} garde les {ap} AP, le regret est offert.',
      '{nom} a nettoyé en retenant sa respiration : {ap} AP et un poumon plein de courage.',
      '{nom} ne mangera plus jamais de spaghetti. Mais ce sera avec {ap} AP de plus.',
      'Merci à {nom}, qui a frotté sans vomir. Presque. {ap} AP.',
      'La valise est propre ! Les chaussettes de {nom}, un peu moins. {ap} AP quand même.',
      '{nom} jure n’avoir touché à rien. Ses mains et ses {ap} AP disent le contraire.',
      'Le vomi est parti, la honte reste. {nom} garde ses {ap} AP.'
    ],
    rare:[
      'Jackpot ! {nom} a frotté, frotté… et la saleté a craché {ap} AP. Même la poubelle est jalouse.',
      '{ap} AP ! {nom} n’a jamais été aussi fier d’avoir les mains sales.',
      '{nom} a trouvé une dent en or dans la flaque : {ap} AP ! Mystère sur sa provenance.'
    ]
  };
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
        /* « Sébastien a battu Ent après 3 essais » (Norman, 2026-10-28) : les essais sont le nombre de clics sur Fight dans SA partie jusqu'à la victoire ; un seul essai : « du premier coup ». Pas d'essais connus (boss tué au NUKE) : rien d'ajouté. */
        const essais=Math.floor(Number(d.essais)||0);
        const suite=essais>1?' après '+essais+' essais':(essais===1?' du premier coup':'');
        return {icone:'👹',texte:nom+verbe(' as battu',' a battu')+' '+(nomBoss||'un boss')+suite};
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
        const nomSort=['','Boost du nombre par le sang','Pilule de fer','Spaghetti au sang','Or contrefait'][rang]||'';
        const visible=Boolean(k.sorts&&k.sorts[rang]);
        return {icone:'🩸',texte:nom+verbe(' as',' a')+' lancé '+(visible&&nomSort?'le sort '+nomSort:'un sort de Magie du sang')};
      }
      /*
       * Magie placée dans un rituel (Norman, 2026-10-16) : une phrase propre à chaque rituel (« Saka s'entaille le bras avec du papier »). Seulement pour un lecteur qui a la Magie du sang ; le rituel n'est
       * nommé que si le lecteur le connaît (connus.rituels = rituels déjà débloqués chez lui), sinon phrase neutre.
       */
      case 'rituel':{
        if(!k.menus.sang)return null;
        const PHRASES={
          tack:['se pique avec une punaise','te piques avec une punaise'],
          papercuts:['s’entaille le bras avec du papier','t’entailles le bras avec du papier'],
          hickey:['se fait un énorme suçon','te fais un énorme suçon'],
          barbedWire:['avale un bol de barbelés','avales un bol de barbelés'],
          bloodBank:['braque la banque du sang','braques la banque du sang'],
          decapitation:['se décapite','te décapites'],
          woodchipper:['fait un câlin à une broyeuse','fais un câlin à une broyeuse'],
          insideOut:['se retourne comme un gant','te retournes comme un gant']
        };
        const id=String(d.id||'');
        const p=PHRASES[id];
        if(p&&k.rituels&&k.rituels[id])return {icone:'🩸',texte:nom+' '+(it.moi?p[1]:p[0])};
        return {icone:'🩸',texte:nom+' '+(it.moi?'places':'place')+' de la magie dans un rituel de sang'};
      }
      /* Trou sans fond et roue (Norman, 2026-10-04) : annoncés aux lecteurs qui connaissent le Money Pit ; chaque récompense n'est nommée que si le lecteur connaît le système qui s'y rapporte (anti-spoil). */
      case 'puits':{
        if(!k.menus.moneyPit)return null;
        const r=recompenseTexte(d.recompense,d.boost,k);
        return {icone:'🕳️',texte:nom+verbe(' as',' a')+' jeté '+nombreCourt(d.cout)+' d’or dans le trou'+(r?' : '+r:'')};
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
      case 'titanFuite':
      case 'titanPerdu':{
        if(!k.menus.titans)return null;
        const nomTitan=k.titan[String(d.id)];
        const cible=nomTitan?'le Titan '+nomTitan:'un Titan';
        if(it.type==='titanFuite')return {icone:'🏃',texte:nom+verbe(' as',' a')+' pris la fuite contre '+cible};
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
        return {icone:'♻️',texte:nom+verbe(' as',' a')+' fait une Renaissance'+(dureeRun?' après '+dureeRun+' de run':'')};
      /* Boss en cours de combat (Norman, 2026-10-07) : même règle que la victoire -- le nom n'est donné que si le lecteur a lui-même atteint ce boss. */
      case 'bossCombat':{
        const n=Number(d.boss)||0;
        const nomBoss=n>0&&n<=Number(c.bossMax||0)?k.boss[n]:'';
        return {icone:'👹',texte:nom+verbe(' combats',' combat')+(nomBoss?' '+nomBoss:' un boss')};
      }
      /*
       * Le Coffre d'un joueur s'est chié dessus (Norman, 2026-10-15). Anti-spoil : le Coffre est dans l'inventaire d'Aventure, la phrase n'est montrée qu'aux lecteurs qui ont déjà ce menu.
       */
      case 'accident':{
        if(!k.menus.aventure)return null;
        const cof=it.moi?'Ton coffre':'Le coffre de '+nom;
        const variantes=[
          cof+' vient littéralement de se chier dessus',
          'Accident industriel : '+(it.moi?'ton coffre s’est':'le coffre de '+nom+' s’est')+' chié dessus',
          cof+(it.moi?' a':' a')+' eu un petit accident… un gros accident',
          (it.moi?'Sors l’éponge : ton coffre vient':nom+' ferait bien de sortir l’éponge : son coffre vient')+' de se chier dessus',
          'Odeur suspecte '+(it.moi?'dans ton coffre':'du côté du coffre de '+nom),
          cof+' n’a pas pu se retenir',
          (it.moi?'Ton coffre':'Le coffre de '+nom)+' vient de se faire dessus, au sens très large'
        ];
        return {icone:'💩',texte:variantes[Math.abs(Number(it.id)||0)%variantes.length]};
      }
      /*
       * Le joueur a nettoyé le caca de son Coffre (Norman, 2026-10-22) : plusieurs phrases d'humour, choisies selon l'événement. Même anti-spoil que l'accident : seulement pour les lecteurs qui ont déjà le menu Aventure.
       */
      case 'nettoyage':{
        if(!k.menus.aventure)return null;
        const lui=it.moi?'Tu as':nom+' a';
        const sonCoffre=it.moi?'ton coffre':'son coffre';
        const variantes=[
          lui+' nettoyé le caca de '+sonCoffre+'. '+(it.moi?'Évite de serrer la main de qui que ce soit':'Évitez de lui serrer la main si vous le croisez'),
          'Opération propreté : '+(it.moi?'tu viens de récurer':nom+' vient de récurer')+' '+sonCoffre+'. Il sent le propre… presque',
          (it.moi?'Ton coffre':'Le coffre de '+nom)+' est de nouveau impeccable. '+(it.moi?'Toi, un bon savon s’impose':'Son propriétaire, un bon savon s’impose')+' !',
          lui+' passé l’éponge sur '+sonCoffre+'. '+(it.moi?'On ne te demandera pas où elle a traîné':'On ne demandera pas où l’éponge a traîné'),
          'Fin de l’alerte marron : '+(it.moi?'ton coffre est':'le coffre de '+nom+' est')+' propre. '+(it.moi?'Tes doigts, moins':'Ses doigts, beaucoup moins'),
          (it.moi?'Tu as':nom+' a')+' frotté, frotté et refrotté '+sonCoffre+'. Courage, héros du nettoyage de caca !',
          (it.moi?'Ton coffre brille':'Le coffre de '+nom+' brille')+' à nouveau. Par contre, ne demandez pas à '+(it.moi?'te':'lui')+' de vous passer le sel',
          lui+' enfin nettoyé '+sonCoffre+'. Les mouches sont déçues'
        ];
        return {icone:'🧽',texte:variantes[Math.abs(Number(it.id)||0)%variantes.length]};
      }
      /*
       * Récompense en AP du nettoyage du Coffre ou de la Valise (Norman, 2026-10-31) : le joueur, lui, ne voit que « +N AP » ; les AUTRES lisent une phrase comique avec son nom (ex. « Sébastien a du vomi partout sur lui mais ça valait le coup pour ses 20 AP »).
       * Même anti-spoil que l'accident : seulement pour les lecteurs qui ont déjà le menu Aventure.
       */
      case 'nettoyageAp':{
        if(!k.menus.aventure)return null;
        const ap=Math.max(0,Math.floor(Number(d.ap)||0));
        const gain=ap>=1000?(Math.round(ap/100)/10).toString().replace('.',',')+'K':String(ap);
        const lieu=d.lieu==='valise'?'valise':'coffre';
        if(it.moi)return {icone:'🧽',texte:'Tu as gagné '+gain+' AP en nettoyant '+(lieu==='valise'?'ta valise':'ton coffre')};
        const liste=d.rare?PHRASES_NETTOYAGE_AP.rare:PHRASES_NETTOYAGE_AP[lieu];
        return {icone:d.rare?'✨':'🧽',texte:liste[Math.abs(Number(it.id)||0)%liste.length].split('{nom}').join(nom).split('{ap}').join(gain)};
      }
      /* Aucune phrase « X est dans tel menu » (Norman, 2026-10-31) : un ancien événement « visite » reste sans texte. */
      /* Boost versé dans le Cube de l'infini : seulement pour un lecteur qui l'a déjà (sinon on ne révèle pas son existence). */
      case 'cube':{
        if(!k.menus.cube)return null;
        const idc=Math.abs(Number(it.id)||0);
        return {icone:'🧊',texte:it.moi?nom+' nourris ton cube de l’infini':nom+' '+BOOST_CUBE[idc%BOOST_CUBE.length]};
      }
      /* Boost versé dans une pièce : le nom n'est donné que si le lecteur a lui-même obtenu cette pièce, sinon « une de ses pièces ». */
      case 'piece':{
        const idp=Math.abs(Number(it.id)||0);
        const nomPiece=(k.pieces&&d.def&&k.pieces[d.def])?'« '+k.pieces[d.def]+' »':'une de ses pièces';
        const t=BOOST_PIECE[idp%BOOST_PIECE.length];
        return {icone:'⚡',texte:nom+' '+t[0]+nomPiece+t[1]};
      }
      /* Objet transformé (ascension) : nommé seulement si le lecteur possède cet objet ; l'objet obtenu n'est nommé que si le lecteur le connaît aussi (sinon on ne révèle pas ce qui existe). */
      case 'piece_transformee':
      case 'transformation':{
        const idt=Math.abs(Number(it.id)||0);
        const connu=(k.pieces&&d.de&&k.pieces[d.de])?'« '+k.pieces[d.de]+' »':'une de ses pièces';
        const t=TRANSFORMATION[idt%TRANSFORMATION.length];
        const vers=(k.pieces&&d.vers&&k.pieces[d.vers]&&connu!=='une de ses pièces')?' — elle devient « '+k.pieces[d.vers]+' »':'';
        return {icone:'🔮',texte:nom+' '+t[0]+connu+t[1]+vers};
      }
      /* Nuke : le nombre de boss tués est toujours donné ; moins il y en a, plus les phrases se moquent (1 : bombe atomique pour une mouche). */
      case 'nuke':{
        const nb=Math.max(1,Math.floor(Number(d.n)||1));
        const pool=nb===1?NUKE_UN:(nb<=4?NUKE_PEU:NUKE_BEAUCOUP);
        const t=pool[Math.abs(Number(it.id)||0)%pool.length];
        const nombre=nb.toLocaleString('fr-FR');
        return {icone:'☢️',texte:nom+' '+(it.moi?'as utilisé le bouton Nuke et as tué '+nombre+' boss':t[0]+nombre+t[1])};
      }
      case 'farm':{
        const connue=(c.zones||[]).some(function(z){return Number(z.id)===Number(d.zoneId);});
        return {icone:'⚔️',texte:connue&&d.zoneNom?nom+verbe(' farmes',' farme')+' dans '+d.zoneNom:nom+verbe(' farmes',' farme')+' en Aventure'};
      }
      /*
       * Progrès des autres systèmes (Norman, 2026-10-25 : « ça ne parle jamais de la Machine temporelle, de Wandoos, de NGU, des Mineurs d'or ; ITOPOD pourrait donner l'étage où sont les autres ; l'Entraînement avancé… ça doit être vivant »). Un niveau ou un étage n'est
       * jamais un spoil, mais la phrase n'existe que pour un lecteur qui possède déjà ce menu (anti-spoil, règle n°2) ; plusieurs variantes par système, choisies d'après l'événement.
       */
      /* Une cinématique revue depuis Chroniques > Cinématiques : code 1 = l'intro. Aucune phrase pour un lecteur qui n'a pas le menu Chroniques (anti-spoil). */
      case 'cinematique':{
        if(!k.menus.chroniques)return null;
        const scene=Number(d.id)===1?'l’intro':'une cinématique',v=Math.abs(Number(it.id)||0);
        const l=it.moi?['Tu revois '+scene,'Tu retournes voir '+scene+' dans les Chroniques']:[nom+' regarde '+scene,nom+' revoit '+scene+' dans les Chroniques',nom+' s’offre une séance de cinéma : '+scene];
        return {icone:'🎬',texte:l[v%l.length]};
      }
      case 'tm':{
        if(!k.menus.machine)return null;
        const n=nombreCourt(Number(d.n)||0),v=Math.abs(Number(it.id)||0);
        const vitesse=d.quoi!=='or';
        const lui=vitesse
          ?[nom+' pousse la vitesse de la Machine temporelle au niveau '+n,nom+' remonte le temps de plus en plus vite : Machine temporelle, niveau '+n,'La Machine temporelle de '+nom+' tourne au niveau '+n+' de vitesse']
          :[nom+' fait cracher de l’or à la Machine temporelle : niveau '+n,'La Machine temporelle de '+nom+' rapporte plus d’or, niveau '+n,nom+' remonte le temps pour l’or : niveau '+n];
        const toi=vitesse
          ?['Tu pousses la vitesse de ta Machine temporelle au niveau '+n,'Ta Machine temporelle tourne au niveau '+n+' de vitesse']
          :['Ta Machine temporelle rapporte plus d’or : niveau '+n,'Tu fais cracher de l’or à ta Machine temporelle : niveau '+n];
        const l=it.moi?toi:lui;
        return {icone:'⏱️',texte:l[v%l.length]};
      }
      case 'wandoosOs':{
        if(!k.menus.wandoos)return null;
        const v=Math.abs(Number(it.id)||0);
        const l=it.moi?['Tu changes de système sur Wandoos','Tu réinstalles Wandoos, la nostalgie en plus']:[nom+' change de système sur Wandoos',nom+' réinstalle Wandoos, la nostalgie en plus',nom+' a fini par installer un autre Wandoos'];
        return {icone:'💻',texte:l[v%l.length]};
      }
      case 'wandoos':{
        if(!k.menus.wandoos)return null;
        const n=nombreCourt(Number(d.n)||0),v=Math.abs(Number(it.id)||0);
        const l=it.moi?['Tu fais ronronner Wandoos : '+n+' niveaux','Wandoos avale ton énergie : '+n+' niveaux']:[nom+' fait ronronner Wandoos : '+n+' niveaux','Wandoos de '+nom+' avale de l’énergie : '+n+' niveaux',nom+' envoie Wandoos à '+n+' niveaux'];
        return {icone:'💻',texte:l[v%l.length]};
      }
      case 'ngu':{
        if(!k.menus.ngu)return null;
        const n=nombreCourt(Number(d.n)||0),v=Math.abs(Number(it.id)||0);
        if(d.debut)return {icone:'♾️',texte:it.moi?'Tu lances tes premiers NGU':nom+' lance ses premiers NGU'};
        const l=it.moi?['Tes NGU progressent : ton meilleur est au niveau '+n,'Ton meilleur NGU atteint le niveau '+n]:[nom+' fait grandir ses NGU : le meilleur est au niveau '+n,'Le meilleur NGU de '+nom+' atteint le niveau '+n,nom+' bichonne ses NGU, niveau '+n+' pour le plus avancé'];
        return {icone:'♾️',texte:l[v%l.length]};
      }
      case 'diggers':{
        if(!k.menus.diggers)return null;
        const n=Math.max(1,Math.floor(Number(d.actifs)||1)),v=Math.abs(Number(it.id)||0);
        const l=it.moi?['Tu mets un Mineur d’or de plus au travail ('+n+' en tout)','Tes Mineurs d’or sont '+n+' à creuser']:[nom+' met un Mineur d’or de plus au travail ('+n+' en tout)','Ça creuse chez '+nom+' : '+n+' Mineurs d’or en action',nom+' embauche un Mineur d’or de plus, ils sont '+n];
        return {icone:'⛏️',texte:l[v%l.length]};
      }
      case 'diggersNiveau':{
        if(!k.menus.diggers)return null;
        const n=nombreCourt(Number(d.n)||0),v=Math.abs(Number(it.id)||0);
        const l=it.moi?['Tes Mineurs d’or totalisent '+n+' niveaux','Tes Mineurs d’or creusent plus profond : '+n+' niveaux']:['Les Mineurs d’or de '+nom+' totalisent '+n+' niveaux',nom+' améliore ses Mineurs d’or : '+n+' niveaux en tout','Ça creuse de plus en plus profond chez '+nom+' : '+n+' niveaux de Mineurs d’or'];
        return {icone:'⛏️',texte:l[v%l.length]};
      }
      case 'tour':{
        if(!k.menus.tower)return null;
        const e=Math.max(1,Math.floor(Number(d.etage)||1)),v=Math.abs(Number(it.id)||0);
        const l=it.moi?['Tu atteins l’étage '+e+' d’ITOPOD','Tu grimpes jusqu’à l’étage '+e+' d’ITOPOD']:[nom+' atteint l’étage '+e+' d’ITOPOD',nom+' grimpe jusqu’à l’étage '+e+' d’ITOPOD','Il y a du monde à l’étage '+e+' d’ITOPOD : '+nom,nom+' arrive à l’étage '+e+' d’ITOPOD, à bout de souffle'];
        return {icone:'🏢',texte:l[v%l.length]};
      }
      case 'avance':{
        if(!k.menus.avance)return null;
        const n=nombreCourt(Number(d.n)||0),v=Math.abs(Number(it.id)||0);
        const l=it.moi?['Ton Entraînement avancé monte : '+n+' niveaux en tout','Tu sues à l’Entraînement avancé : '+n+' niveaux']:[nom+' pousse l’Entraînement avancé : '+n+' niveaux en tout',nom+' sue à l’Entraînement avancé : '+n+' niveaux','L’Entraînement avancé de '+nom+' atteint '+n+' niveaux'];
        return {icone:'🏋️',texte:l[v%l.length]};
      }
      default:return null;
    }
  }

  const BOOST_CUBE=['vient de nourrir son cube de l’infini et a failli y laisser un doigt','donne à manger à son cube de l’infini, il a faim','gave son cube de l’infini de boosts','jette un boost dans son cube de l’infini, glouglou','verse un boost dans son cube de l’infini, il ronronne','fait un câlin à son cube de l’infini, avec un boost','dit « mange ! » à son cube de l’infini','remplit le cube de l’infini, sans le regarder dans les yeux','offre un goûter à son cube de l’infini','se fait presque croquer la main par son cube de l’infini','alimente son cube de l’infini, qui grossit à vue d’œil','balance un boost dans son cube de l’infini et recule prudemment','fait grandir son cube de l’infini, un boost à la fois','entend son cube de l’infini gronder de plaisir','sert un boost au cube de l’infini, bon appétit','nourrit son cube de l’infini, en gardant ses doigts','fait un cadeau à son cube de l’infini','regarde son cube de l’infini avaler un boost','recharge son cube de l’infini, il en redemande','nourrit son cube de l’infini avec un air de dompteur'];
  const BOOST_PIECE=[['renforce ',''],['donne un coup de boost à ',''],['bichonne ',' avec amour'],['fait avaler du boost à ',''],['améliore ',', ça devient sérieux'],['astique ',' et lui offre un boost'],['offre un petit cadeau à ',''],['rend ',' encore plus costaud'],['injecte du boost dans ',''],['muscle ',' sans pitié'],['dorlote ',' avec un boost tout neuf'],['passe ',' à la salle de sport'],['équipe ',' d’un peu de puissance en plus'],['soigne ',' à coups de boost'],['chouchoute ',', la préférée du jour'],['prend soin de ',', comme d’un trésor'],['pousse ',' vers la perfection'],['gave ',' de boost'],['envoie ',' à l’entraînement intensif'],['fait briller ',', c’est du solide']];

  const TRANSFORMATION=[['transforme ',''],['fait évoluer ',''],['passe ',' au niveau supérieur'],['offre une nouvelle vie à ',''],['métamorphose ',', abracadabra'],['fait passer ',' à l’âge adulte'],['vient de transformer ',', ça brille davantage'],['ne reconnaît plus ',' tant il a changé'],['fait subir une cure de jouvence à ',''],['pousse ',' vers sa forme finale'],['regarde ',' se transformer, les yeux brillants'],['a fait muer ',''],['se réjouit de la transformation de ',''],['a trouvé la recette pour transformer ',''],['a fait un tour de magie avec ',''],['fait chauffer le chaudron pour ',''],['donne un coup de neuf à ',''],['a poussé ',' dans ses derniers retranchements, et ça marche'],['envoie ',' chez le coiffeur, le résultat est bluffant'],['fait faire une mue à ',', sans douleur']];

  const NUKE_UN=[['a utilisé le bouton Nuke pour tuer… ',' boss. Une bombe atomique pour une mouche'],['a sorti l’artillerie lourde, le bouton Nuke, pour ',' seul boss'],['a nuké ',' boss : la sécurité avant tout'],['a appuyé sur Nuke et a tué ',' boss d’un coup. D’un seul. Un.'],['a lancé la Nuke pour ',' boss, c’est ce qu’on appelle de la prudence'],['a tué ',' boss avec le bouton Nuke, le bouton était plus gros que le boss'],['a dépensé un Nuke pour ',' boss, ça se fête quand même'],['a fait exploser ',' boss au bouton Nuke, les voisins ont à peine entendu'],['a utilisé le bouton Nuke : ',' boss en moins, pas de quoi fouetter un chat'],['a tué ',' boss d’un coup avec Nuke, c’était peut-être pas nécessaire'],['a tiré un missile sur ',' boss, par précaution'],['a sorti le gros bouton rouge pour ',' boss, la totale'],['a nuké ',' boss, il avait peut-être été méchant'],['a utilisé Nuke pour tuer ',' boss, les économies d’échelle, c’est pour les autres'],['a écrasé ',' boss sous le bouton Nuke, tout en douceur'],['a tué ',' boss avec Nuke, au moins il n’y a pas eu de dégâts collatéraux'],['a appuyé sur Nuke avec le plus grand sérieux : ',' boss est tombé'],['a fait un Nuke pour ',' boss, la modestie même'],['a vaincu ',' boss d’un seul coup de bouton Nuke, un exploit à échelle réduite'],['a cassé une noix au marteau-pilon : ',' boss nuké']];
  const NUKE_PEU=[['a utilisé le bouton Nuke et a tué ',' boss d’un coup, c’est un début'],['a appuyé sur Nuke : ',' boss en moins, on reste modeste'],['a nuké ',' boss, ça valait presque le coup'],['a tué ',' boss au bouton Nuke, ça chauffe à peine'],['a fait un petit Nuke : ',' boss d’un coup'],['a sorti le gros bouton pour ',' boss, c’est mieux que rien'],['a utilisé Nuke et a balayé ',' boss, un petit coup de balai'],['a envoyé la Nuke sur ',' boss, avec la manière'],['a fait tomber ',' boss d’un coup de Nuke, sans trop forcer'],['a tué ',' boss d’un coup avec Nuke, pas mal pour un début de journée'],['a utilisé le bouton Nuke : ',' boss ont fait leurs valises'],['a appuyé sur le bouton rouge et ',' boss ont disparu'],['a nuké ',' boss, avec le sourire'],['a vaincu ',' boss d’un seul bouton, la flemme paie'],['a lancé Nuke : ',' boss de moins sur la route']];
  const NUKE_BEAUCOUP=[['a utilisé le bouton Nuke et a tué ',' boss d’un coup'],['a appuyé sur Nuke et ',' boss ont disparu d’un coup'],['a nuké ',' boss d’un coup, respect'],['a rayé ',' boss de la carte avec le bouton Nuke'],['a fait un carnage : ',' boss tués d’un coup de Nuke'],['a lancé la Nuke et ',' boss n’ont rien vu venir'],['a tué ',' boss d’un seul bouton, les boss ont envoyé leurs condoléances'],['a fait trembler le jeu : ',' boss pulvérisés par Nuke'],['a transformé ',' boss en poussière avec le bouton Nuke'],['a vaincu ',' boss d’un coup, ça s’appelle de l’efficacité'],['a appuyé sur le gros bouton rouge : ',' boss de moins'],['a envoyé ',' boss à la retraite avec Nuke'],['a nuké ',' boss, le serveur en tremble encore'],['a balayé ',' boss d’un revers de Nuke'],['a fait exploser ',' boss en un seul appui'],['a tué ',' boss avec Nuke, un vrai chef de guerre'],['a utilisé Nuke : ',' boss d’un coup, et même pas décoiffé'],['a rasé ',' boss d’un clic sur le bouton Nuke'],['a vidé la salle des boss : ',' d’un coup de Nuke'],['a dit adieu à ',' boss grâce au bouton Nuke']];

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
        /* Norman (2026-10-13) : « le bandeau en direct fait baisser les fps, enlève la transparence » : plus d'opacité animée ni de masque dégradé (ils forçaient une composition hors écran à chaque image du défilement) ; le bandeau est opaque et se masque d'un coup */
        'contain:layout paint}'+
      /* Norman (2026-10-27) : « le bandeau doit apparaître et disparaître en fondu » : seul le fondu d'apparition et de disparition (0,6 s) est animé, jamais le défilement ; masqué par visibility (et non display:none) pour que sa largeur reste mesurable : masqué par display:none, il mesurait 0 et la première information arrivait au milieu de l'écran au lieu d'entrer par la droite. */
      '#sorealIdleFluxV1{opacity:1;transition:opacity .6s ease}'+
      '#sorealIdleFluxV1.sif-off{opacity:0;visibility:hidden;pointer-events:none;transition:opacity .6s ease,visibility 0s linear .6s}'+
      '#sorealIdleFluxV1[hidden]{display:none}'+
      '#sorealIdleFluxV1 .sif-tag{flex:0 0 auto;z-index:2;padding:0 12px;height:100%;display:flex;align-items:center;gap:6px;font-weight:900;letter-spacing:.06em;font-size:14px;'+
        'background:linear-gradient(90deg,var(--th-a,#5eead4),var(--th-b,#25b9a4));color:#06201c;clip-path:polygon(0 0,100% 0,calc(100% - 10px) 100%,0 100%);padding-right:20px}'+
      '#sorealIdleFluxV1 .sif-vue{flex:1;min-width:0;overflow:hidden;height:100%;display:flex;align-items:center}'+
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
    /* Largeur réelle de la fenêtre de défilement, jamais une valeur de repli au milieu de l'écran : repli = largeur de la page moins l'étiquette (PC comme téléphone). */
    const vue=bandeau.querySelector('.sif-vue');
    const etiquette=bandeau.querySelector('.sif-tag');
    largeurVue=vue.clientWidth||Math.max(0,(document.documentElement.clientWidth||window.innerWidth||0)-(etiquette?etiquette.offsetWidth:0))||largeurVue||300;
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
      /* largeur mesurée une seule fois par information (avant : une mesure de mise en page à chaque image) */
      const w=premier.__largeurV1||(premier.__largeurV1=premier.getBoundingClientRect().width);
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
    /* Message local (pas du serveur) joué tout de suite dans « En direct » : { icone, texte } */
    annoncer:function(e){if(e&&e.texte){file.push({icone:e.icone||'📢',texte:e.texte,recu:performance.now()});}},
    dernier:function(){return dernier;},
    /* Repère du premier battement : tout ce qui date d'avant l'arrivée du joueur est ignoré. */
    amorcer:function(id){id=Number(id)||0;if(id>dernier)dernier=id;amorceFlux=true;},
    amorce:function(){return amorceFlux;},
    phrase:phrase,
    htmlPanneau:htmlPanneau,
    majPanneaux:majPanneaux,
    construire:construire,
    visibles:visibles,
    enAttente:function(){return file.length;},
    items:function(){return items.slice();}
  };

})();
