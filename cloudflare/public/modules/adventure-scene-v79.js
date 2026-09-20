/*
 * SOREAL IDLE standalone auxiliary frontend module.
 * Migrated from SOREAL-APP/cloudflare/features/idle/adventure-scene-v79.html
 * during standalone frontend cutover.
 */
(function(){
  'use strict';

  if(window.__SOREAL_IDLE_ADVENTURE_SCENE_V79__)return;
  window.__SOREAL_IDLE_ADVENTURE_SCENE_V79__=true;

  var runtime=window.__SOREAL_IDLE_RUNTIME_V1__||null;
  var timer=0;

  function root_(){return document.querySelector('.soreal-idle-page-root-v28');}
  /*
   * V1 combat de zone (2026-09-09) — le bouton Combattre n'appelle plus
   * combattreZoneAdventureIdleV47_ (kill instantané, retiré de l'écran),
   * et disparaît carrément pendant un combat actif (remplacé par la vue
   * de combat). Détecter la page Adventure sur un marqueur toujours
   * présent plutôt que sur un texte/attribut fragile.
   *
   * BUG (2026-09-10, Norman : "je ne vois plus d'image en aventure") :
   * le sélecteur de zone est passé d'une liste de boutons onclick à une
   * liste déroulante (<select onchange=...>) + 2 flèches — le marqueur
   * `[onclick*="selectionnerZoneAdventureIdleV47_"]` ne correspondait
   * donc plus à RIEN, désactivant tout le module en silence. Détecte
   * maintenant sur le conteneur du sélecteur lui-même (toujours présent,
   * quel que soit l'état du combat).
   */
  /*
   * Norman (2026-09-14) : le sélecteur de zone est passé d'un <select>
   * natif (.soreal-idle-zone-select-v1) à un menu déroulant personnalisé
   * (.soreal-idle-zone-custom-v1, même style que "Trier par" en Équipe) —
   * même piège déjà documenté ici une fois (2026-09-10) : ce marqueur doit
   * suivre le vrai balisage à chaque fois qu'il change, jamais un texte
   * devenu fragile.
   */
  function adventurePage_(root){return Boolean(root&&root.querySelector('.soreal-idle-zone-custom-v1'));}
  function adventure_(state){return state&&state.systemes&&state.systemes.adventure&&typeof state.systemes.adventure==='object'?state.systemes.adventure:null;}
  function number_(v){var n=Number(v);return Number.isFinite(n)?n:0;}
  function int_(v){return Math.max(0,Math.floor(number_(v)));}
  function html_(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function currentZone_(a){
    var zones=Array.isArray(a&&a.zones)?a.zones:[];
    return zones.find(function(z){return z&&z.id===a.selectedZone;})||zones.find(function(z){return z&&z.unlocked;})||zones[0]||null;
  }

  /*
   * Correctif 2026-09-17 (Norman : "tu peux supprimer les backgrounds
   * pour le mode aventure. L'image en a déjà 1.") : les nouvelles images
   * de monstre (idle/aventure/<Zone>/Adv_<id>_<nom>.png) sont déjà des
   * scènes complètes avec leur propre décor — plus besoin d'une image de
   * fond de zone séparée (idle/backgrounds/adventure/) superposée
   * derrière un petit monstre à 55% de hauteur. L'appel réseau vers le
   * média de fond de zone est retiré ; l'image du monstre remplit
   * maintenant tout le cadre.
   */
  /*
   * Bug signalé par Norman (2026-09-17) : "Les noms des mobs ne
   * correspondent pas aux images dans aventure tutorial zone... il n'y a
   * que A Small Mouse qui a le bon nom." Déjà vrai avec les anciennes
   * images — pas une régression du jour. Cause confirmée : l'image
   * affichée ICI utilisait un "seed" = Date.now() (horodatage arbitraire,
   * change à chaque nouveau combat), alors que le NOM affiché dans le
   * journal de combat (libelleEnnemiAdventureIdleV1_, Soreal_Idle_UI.html)
   * résout depuis fight.monsterIndex (le vrai index tiré côté serveur,
   * idle-adventure-v47.js). Deux seeds complètement différents envoyés à
   * choisirCleMobR2_ (worker.js), qui indexe le même dossier par
   * seed%pool.length -- l'image et le nom ne tombaient donc sur le même
   * fichier QUE par coïncidence (Date.now()%pool.length===monsterIndex%
   * pool.length). "A Small Mouse" (seul boss de Tutorial, pool.length=1)
   * tombait TOUJOURS juste par construction (modulo 1 vaut toujours 0),
   * masquant que tous les mobs normaux (pool.length=3) étaient faux.
   * Corrigé : la même valeur (fight.monsterIndex) sert maintenant à la
   * fois pour l'image ET le nom, plus jamais deux seeds indépendants pour
   * la même créature.
   */
  function mobUrl_(fight){
    var p=new URLSearchParams();
    p.set('zone',String(fight&&fight.zone||''));
    p.set('boss',fight&&fight.boss?'1':'0');
    p.set('seed',String(Math.max(0,int_(fight&&fight.monsterIndex))));
    return '/api/idle/media/mob?'+p.toString();
  }

  function safeZoneVisualZone_(a){
    var selected=String(a&&a.selectedZone||'safe').trim().toLowerCase();
    if(selected==='safe'){
      return String(a&&a.lastCombatZone||'tutorial').trim().toLowerCase()||'tutorial';
    }
    return selected||'tutorial';
  }

  function safeZoneUrl_(a){
    var p=new URLSearchParams();
    p.set('zone',safeZoneVisualZone_(a));
    return '/api/idle/media/safe-zone?'+p.toString();
  }

  /*
   * Bug signalé par Norman (2026-09-09) : "je vois les points de vie de
   * l'ennemi clignoter entre 54 et 0 rapidement" + "j'ai été en safe zone
   * et l'ennemi est toujours présent." Deux causes distinctes :
   *
   * 1) DEUX écrivains indépendants mettaient à jour #sorealIdleAdventureFightPvV1
   *    / -BarV1 : ce module (rendu débounced ~60ms sur un état mis en
   *    cache par le runtime partagé, CACHE_MS=2000) ET le tick rapide de
   *    Soreal_Idle_UI.html (mettreAJourJeuIdleLocalV7_, 100ms, lit
   *    idleEtat en direct). Le second est la seule source fraîche et
   *    rapide pour un combat — ce module ne fait plus que CRÉER les deux
   *    éléments (contenu initial vide), jamais les réécrire ensuite.
   * 2) selectZone (serveur) ne vidait jamais un combat actif resté sur
   *    l'ancienne zone quand le joueur changeait de zone en cours de
   *    combat — le combat "fantôme" restait actif et son ennemi
   *    continuait de s'afficher même sur le décor de la Safe Zone.
   *    Corrigé côté serveur (idle-adventure-v47.js), mais une sauvegarde
   *    déjà bloquée dans cet état doit aussi être ignorée ici tant que la
   *    zone du combat ne correspond plus à la zone sélectionnée.
   */
  /*
   * Correctif 2026-09-18 (Norman : "je veux que la barre de vie de
   * l'ennemi et la nôtre soient superposées dans le cadre noir. La barre
   * de l'ennemi au dessus et la nôtre juste en dessous.") — les 2 barres
   * (PV label + barre) vivent maintenant dans le cadre noir
   * (.soreal-idle-v79-adventure-bars, créées une fois par scene_ ci-
   * dessous), plus dans ce wrap superposé à l'image. Ce wrap ne gère
   * donc plus QUE l'image du monstre + son étiquette "Boss de zone" ;
   * la ligne "PV ennemi" (dans le cadre noir) est simplement montrée/
   * masquée selon qu'un combat est actif, jamais recréée à chaque tick.
   *
   * Correctif 2026-09-18 (suite, Norman, en direct : "je ne veux pas que
   * l'interface se réduise quand la barre de l'ennemi disparait. Les
   * emplacements de nos barres de vie à l'ennemi et moi doivent rester
   * telle quel") — display:none retirait entièrement ligneEnnemi du flux
   * (hauteur 0), donc tout ce qui suit (notre propre barre, en dessous)
   * remontait et le cadre entier rétrécissait à chaque respawn/kill —
   * d'autant plus visible maintenant que les combats s'enchaînent seuls
   * (plus de bouton "Combattre", le motif clignote en continu).
   * visibility:hidden masque le contenu SANS retirer la ligne du flux :
   * son espace reste réservé, la nôtre ne bouge plus jamais.
   */
  function overlay_(root,a){
    var media=root.querySelector('.soreal-idle-v79-adventure-media');
    var ligneEnnemi=root.querySelector('.soreal-idle-v79-adventure-enemy-row');
    if(!media)return;
    var fight=a&&a.fight;
    var zoneCombat=String(fight&&fight.zone||'');
    var zoneSelectionnee=String((a&&a.selectedZone)||'');
    var actif=Boolean(fight&&fight.active&&(!zoneCombat||zoneCombat===zoneSelectionnee));

    var fallback=media.querySelector('.soreal-idle-v79-adventure-fallback');

    if(!actif){
      var old=media.querySelector('.soreal-idle-v79-adventure-mob-wrap');
      if(old)old.remove();
      if(ligneEnnemi)ligneEnnemi.style.visibility='hidden';

      var safeWrap=media.querySelector('.soreal-idle-v79-adventure-safe-wrap');
      if(!safeWrap){
        safeWrap=document.createElement('div');
        safeWrap.className='soreal-idle-v79-adventure-safe-wrap';
        safeWrap.innerHTML='<img class="soreal-idle-v79-adventure-safe-image" alt="" loading="eager">';
        media.appendChild(safeWrap);
      }

      var safeImg=safeWrap.querySelector('.soreal-idle-v79-adventure-safe-image');
      var safeUrl=safeZoneUrl_(a);
      if(safeImg&&safeImg.getAttribute('src')!==safeUrl){
        if(fallback)fallback.style.display='grid';
        safeImg.style.display='none';
        safeImg.onload=function(){
          safeImg.style.display='block';
          if(fallback)fallback.style.display='none';
        };
        safeImg.onerror=function(){
          safeImg.style.display='none';
          if(fallback)fallback.style.display='grid';
        };
        safeImg.setAttribute('src',safeUrl);
      }
      return;
    }

    var safeOld=media.querySelector('.soreal-idle-v79-adventure-safe-wrap');
    if(safeOld)safeOld.remove();
    if(fallback)fallback.style.display='none';
    if(ligneEnnemi)ligneEnnemi.style.visibility='';

    var wrap=media.querySelector('.soreal-idle-v79-adventure-mob-wrap');
    if(!wrap){
      wrap=document.createElement('div');
      wrap.className='soreal-idle-v79-adventure-mob-wrap';
      wrap.innerHTML=''
        +(fight.boss?'<div class="soreal-idle-v79-adventure-mob-boss-tag">🐉 Boss de zone</div>':'')
        +'<img id="sorealIdleAdventureSceneMobV1" class="soreal-idle-v79-adventure-mob" alt="" loading="eager">';
      media.appendChild(wrap);
    }

    var img=wrap.querySelector('#sorealIdleAdventureSceneMobV1');
    var url=mobUrl_(fight);
    if(img&&img.getAttribute('src')!==url)img.setAttribute('src',url);
  }

  function stats_(root,a){
    var stats=a&&a.stats||{};
    var rewards=a&&a.setRewards||{};
    var fight=a&&a.fight||{};
    var active=Boolean(fight.active&&(!fight.zone||fight.zone===a.selectedZone));
    var player=root.querySelector('.soreal-idle-v79-player-card');
    var enemy=root.querySelector('.soreal-idle-v79-enemy-card');
    if(!player||!enemy)return;
    var playerName=player.querySelector('.soreal-idle-v79-card-name');
    if(playerName)playerName.textContent='Joueur';
    var basePower=10+number_(rewards.adventurePower);
    var baseToughness=10+number_(rewards.adventureToughness);
    var baseHp=50+number_(rewards.adventureHp);
    var baseRegen=Math.max(0,number_(stats.regenBase)||1);
    var totalRegen=Math.max(baseRegen,number_(stats.regen));
    var cubePower=Math.max(0,number_(stats.cubePowerContribution));
    var cubeToughness=Math.max(0,number_(stats.cubeToughnessContribution));
    var selectedZone=String(a&&a.selectedZone||'safe');
    var safeMultiplier=a&&a.setRewards&&a.setRewards.safeZoneRegen10x?10:5;
    var effectiveRegen=selectedZone==='safe'?totalRegen*safeMultiplier:totalRegen;
    function playerStat(key,base,total,precision,cubeContribution){
      var line=player.querySelector('[data-player-stat="'+key+'"]');
      if(!line)return;
      var cube=Math.max(0,number_(cubeContribution));
      var bonus=Math.max(0,total-base-cube);
      line.querySelector('.soreal-idle-v79-stat-base').textContent=format_(base,precision);
      var extra=line.querySelector('.soreal-idle-v79-stat-bonus');
      if(extra)extra.textContent=bonus>0?' (+'+format_(bonus,precision)+')':'';
      var cubeExtra=line.querySelector('.soreal-idle-v79-stat-cube');
      if(cubeExtra)cubeExtra.textContent=cube>0?' (+'+format_(cube,precision)+' cube)':'';
    }
    playerStat('power',basePower,number_(stats.power),0,cubePower);
    playerStat('toughness',baseToughness,number_(stats.toughness),0,cubeToughness);
    playerStat('hp',baseHp,number_(stats.hp),0,0);
    var regenLine=player.querySelector('[data-player-stat="regen"]');
    if(regenLine){
      var regenValue=regenLine.querySelector('.soreal-idle-v79-stat-base');
      var regenBonus=regenLine.querySelector('.soreal-idle-v79-stat-bonus');
      if(regenValue){
        regenValue.textContent=format_(effectiveRegen,2);
        regenValue.classList.toggle('soreal-idle-v79-safe-regen',selectedZone==='safe');
      }
      if(regenBonus){
        regenBonus.textContent=selectedZone==='safe'?' (×'+safeMultiplier+' Safe Zone)':'';
      }
    }
    enemy.style.visibility=active?'visible':'hidden';
    if(!active)return;
    enemy.querySelector('.soreal-idle-v79-card-name').textContent=String(fight.mobName||'Ennemi')+(fight.boss?' (BOSS)':'');
    var enemyValues={power:fight.mobPower,toughness:fight.mobToughness,hp:fight.monsterHpMax,regen:fight.mobHpRegen,type:fight.mobType||'normal'};
    Object.keys(enemyValues).forEach(function(key){
      var value=enemy.querySelector('[data-enemy-stat="'+key+'"]');
      if(value)value.textContent=key==='type'?String(enemyValues[key]):format_(enemyValues[key],key==='regen'?2:0);
    });
  }

  function format_(value,precision){
    var n=number_(value);
    if(Math.abs(n)<1000000)return new Intl.NumberFormat('fr-FR',{maximumFractionDigits:precision||0}).format(n);
    return new Intl.NumberFormat('fr-FR',{notation:'compact',maximumFractionDigits:2}).format(n);
  }

  function scene_(root,a){
    var zone=currentZone_(a);if(!zone)return;
    var key=String(zone.id||zone.name||'')+'|'+String(zone.name||'');
    var old=root.querySelector('.soreal-idle-v79-adventure-scene');
    if(old&&old.dataset.zoneKey===key)return;
    if(old)old.remove();

    var block=document.createElement('section');
    block.className='soreal-idle-v79-adventure-scene ready';
    block.dataset.zoneKey=key;
    block.innerHTML=''
      /*
       * Norman (2026-09-14) : "dans aventure, enlève les 'Power conseillé
       * : 10 · Toughness : 10'." Retiré ici aussi (bandeau décoratif de
       * scène, occurrence séparée de celle déjà retirée dans
       * Soreal_Idle_UI.html) — l'info reste consultable en info-bulle sur
       * chaque option du menu déroulant de zone.
       *
       * Correctif 2026-09-18 (Norman : "je veux que la barre de vie de
       * l'ennemi et la nôtre soient superposées dans ce cadre noir. La
       * barre de l'ennemi au dessus et la nôtre juste en dessous.") — les
       * 2 barres vivent maintenant ICI, dans le cadre noir "ADVENTURE",
       * au lieu d'être superposées sur l'image (ennemi) ou plus bas dans
       * le panneau joueur (Soreal_Idle_UI.html). Créées vides une seule
       * fois ; overlay_ ci-dessus se contente de montrer/masquer la ligne
       * ennemie, mettreAJourJeuIdleLocalV7_ (Soreal_Idle_UI.html, tick
       * 100ms) reste l'unique écrivain du contenu (mêmes id/classes
       * qu'avant, jamais renommés) — voir son commentaire pour le détail.
       */
      +'<div class="soreal-idle-v79-adventure-copy">'
      +  '<h2>'+html_(zone.name||zone.id)+'</h2>'
      +'</div>'
      +'<div class="soreal-idle-v79-arena">'
      +  '<div class="soreal-idle-v79-adventure-media"><div class="soreal-idle-v79-adventure-fallback">🗺️</div></div>'
      +  '<div class="soreal-idle-v79-combat-health">'
      +    '<div class="soreal-idle-v79-card-health soreal-idle-v79-adventure-enemy-row" style="visibility:hidden">'
      +      '<div class="soreal-idle-v79-health-track-v200">'
      +        '<div id="sorealIdleAdventureFightBarV1" class="soreal-idle-bossbar-v7 soreal-idle-v79-health-fill-v200" style="width:0%"></div>'
      +        '<div id="sorealIdleAdventureFightPvV1" class="soreal-idle-v79-adventure-mob-pv soreal-idle-v79-health-label-v200"></div>'
      +      '</div>'
      +    '</div>'
      +    '<div class="soreal-idle-v79-card-health soreal-idle-v79-player-health">'
      +      '<div class="soreal-idle-v79-health-track-v200">'
      +        '<div id="sorealIdleAdventureJoueurBarV1" class="soreal-idle-playerbar-v15 soreal-idle-v79-health-fill-v200" style="width:0%"></div>'
      +        '<div id="sorealIdleAdventureJoueurPvLabelV1" class="soreal-idle-adventure-player-pv-label-v1 soreal-idle-v79-health-label-v200"></div>'
      +      '</div>'
      +    '</div>'
      +  '</div>'
      +  '<div class="soreal-idle-v79-stats-grid">'
      +    '<div class="soreal-idle-v79-player-card soreal-idle-v79-stat-card">'
      +      '<div class="soreal-idle-v79-card-name"></div>'
      +      '<div class="soreal-idle-v79-stat-lines">'
      +        '<div data-player-stat="power"><span class="soreal-idle-v79-stat-label">Power</span><span class="soreal-idle-v79-stat-value"><b class="soreal-idle-v79-stat-base"></b><b class="soreal-idle-v79-stat-bonus"></b><b class="soreal-idle-v79-stat-cube"></b></span></div>'
      +        '<div data-player-stat="toughness"><span class="soreal-idle-v79-stat-label">Toughness</span><span class="soreal-idle-v79-stat-value"><b class="soreal-idle-v79-stat-base"></b><b class="soreal-idle-v79-stat-bonus"></b><b class="soreal-idle-v79-stat-cube"></b></span></div>'
      +        '<div data-player-stat="hp"><span class="soreal-idle-v79-stat-label">Max HP</span><span class="soreal-idle-v79-stat-value"><b class="soreal-idle-v79-stat-base"></b><b class="soreal-idle-v79-stat-bonus"></b></span></div>'
      +        '<div data-player-stat="regen"><span class="soreal-idle-v79-stat-label">HP Regen/s</span><span class="soreal-idle-v79-stat-value"><b class="soreal-idle-v79-stat-base"></b><b class="soreal-idle-v79-stat-bonus"></b></span></div>'
      +      '</div>'
      +    '</div>'
      +    '<div class="soreal-idle-v79-enemy-card soreal-idle-v79-stat-card" style="visibility:hidden">'
      +      '<div class="soreal-idle-v79-card-name"></div>'
      +      '<div class="soreal-idle-v79-stat-lines">'
      +        '<div><span class="soreal-idle-v79-stat-label">Power</span><span class="soreal-idle-v79-stat-value"><b data-enemy-stat="power"></b></span></div>'
      +        '<div><span class="soreal-idle-v79-stat-label">Toughness</span><span class="soreal-idle-v79-stat-value"><b data-enemy-stat="toughness"></b></span></div>'
      +        '<div><span class="soreal-idle-v79-stat-label">Max HP</span><span class="soreal-idle-v79-stat-value"><b data-enemy-stat="hp"></b></span></div>'
      +        '<div><span class="soreal-idle-v79-stat-label">HP Regen/s</span><span class="soreal-idle-v79-stat-value"><b data-enemy-stat="regen"></b></span></div>'
      +        '<div><span class="soreal-idle-v79-stat-label">Type</span><span class="soreal-idle-v79-stat-value"><b data-enemy-stat="type"></b></span></div>'
      +      '</div>'
      +    '</div>'
      +  '</div>'
      +'</div>';

    /*
     * Norman (2026-09-15) : "je veux le menu déroulant des zones tout en
     * haut, au-dessus de l'image de combat." + "je veux la barre de vie du
     * joueur en dessous de la barre de vie de l'ennemi." Le décor/ennemi
     * (avec sa barre de PV superposée, voir overlay_ ci-dessus) était
     * toujours placé en TÊTE de page (root.prepend), avant même le menu de
     * zone. Inséré maintenant juste avant la section Combat (repérée par le
     * panneau joueur .soreal-idle-adventure-player-panel-v1, toujours
     * présent dès qu'une zone est sélectionnée) : le menu de zone (rendu
     * avant cette section dans pageAventureIdleV28_) reste au-dessus.
     *
     * Correctif 2026-09-18 : .soreal-idle-adventure-player-panel-v1 n'est
     * plus enveloppé dans un .soreal-idle-section-v8 (retiré, "⚔️
     * Tutoriel SOREAL" supprimé) — .closest('.soreal-idle-section-v8')
     * ne trouvait donc plus rien et faisait silencieusement retomber ce
     * décor en tête de page (root.prepend, au-dessus du menu de zone,
     * régression du correctif du 2026-09-15 ci-dessus). Le panneau
     * joueur est maintenant un élément direct de `root` : utilisé
     * directement comme repère d'insertion, sans .closest().
     */
    var combatSection=root.querySelector('.soreal-idle-adventure-player-panel-v1');
    if(combatSection&&combatSection.parentNode===root){
      root.insertBefore(block,combatSection);
    }else{
      root.prepend(block);
    }
  }

  function render_(){
    var root=root_();if(!adventurePage_(root))return;
    runtime=window.__SOREAL_IDLE_RUNTIME_V1__||runtime;
    if(!runtime||!runtime.getState)return;
    runtime.getState(false).then(function(state){
      if(root_()!==root||!adventurePage_(root))return;
      var a=adventure_(state);
      if(!a)return;
      scene_(root,a);
      overlay_(root,a);
      stats_(root,a);
    }).catch(function(){});
  }
  function schedule_(){clearTimeout(timer);timer=setTimeout(render_,60);}
  function style_(){
    if(document.getElementById('soreal-idle-adventure-scene-v79-style'))return;
    /*
     * Norman (2026-09-17) : "il faut réduire le cadre par rapport à
     * l'image dans aventure." Cause confirmée : le cadre précédent était
     * une large boîte paysage (largeur pleine, hauteur clampée jusqu'à
     * 590px) pensée pour un futur fond de zone haute résolution — les
     * vraies images de monstre (idle/aventure/) sont carrées (184x184
     * confirmé), donc beaucoup d'espace mort de chaque côté avec
     * object-fit:contain. Cadre passé à un vrai carré (aspect-ratio:1/1,
     * plafonné en largeur) qui colle exactement au format des images.
     */
    var st=document.createElement('style');st.id='soreal-idle-adventure-scene-v79-style';st.textContent='\
      .soreal-idle-v79-adventure-scene{position:relative;overflow:hidden;margin:0 0 14px;border:1px solid color-mix(in srgb,var(--nav-color,#22c55e) 22%,rgba(166,188,229,.16));border-radius:20px;background:linear-gradient(180deg,#121b2b,#0d1523);box-shadow:0 16px 34px rgba(3,8,18,.30),0 0 26px color-mix(in srgb,var(--nav-color,#22c55e) 8%,transparent)}\
      .soreal-idle-v79-arena{display:flex;flex-direction:column;align-items:stretch;gap:7px;padding:8px 10px 10px}.soreal-idle-v79-adventure-media{align-self:center;max-width:380px}.soreal-idle-v79-combat-health{display:grid;gap:5px;max-width:620px;width:100%;margin:0 auto}.soreal-idle-v79-combat-health .soreal-idle-v79-card-health{margin:0;padding:0 2px;text-align:center}.soreal-idle-v79-combat-health .soreal-idle-playerbar-wrap-v15,.soreal-idle-v79-combat-health .soreal-idle-bossbar-wrap-v7{width:100%;max-width:none}.soreal-idle-v79-stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;max-width:620px;width:100%;margin:0 auto}.soreal-idle-v79-adventure-media{position:relative;display:grid;place-items:center;width:100%;aspect-ratio:1/1;background:#05080d;border-radius:14px;overflow:hidden;border:1px solid rgba(166,188,229,.10);box-shadow:inset 0 0 0 1px rgba(255,255,255,.02)}.soreal-idle-v79-adventure-fallback{display:grid;place-items:center;font-size:72px;color:#8590a5;width:100%;height:100%}\
      .soreal-idle-v79-adventure-copy{padding:7px 12px;border-bottom:1px solid rgba(166,188,229,.10);background:linear-gradient(135deg,color-mix(in srgb,var(--nav-color,#22c55e) 18%,#202d45),#182236 64%,#121b2b);font-family:"Segoe UI Variable Display","Segoe UI Variable","Segoe UI",system-ui,-apple-system,sans-serif}.soreal-idle-v79-adventure-copy span{font-size:10px;font-weight:800;letter-spacing:.16em;color:color-mix(in srgb,var(--nav-color,#22c55e) 82%,#ffffff);text-shadow:0 0 14px color-mix(in srgb,var(--nav-color,#22c55e) 30%,transparent)}.soreal-idle-v79-adventure-copy h2{margin:3px 0 0;color:#f4f7ff;font-size:18px;font-weight:750;letter-spacing:.015em}\
      .soreal-idle-v79-stat-card{display:flex;flex-direction:column;min-width:0;padding:9px 10px 8px;background:linear-gradient(155deg,#26344f 0%,#1b273d 55%,#162136 100%);color:#dce5f3;border:1px solid rgba(166,188,229,.16);border-radius:16px;box-shadow:0 10px 24px rgba(5,9,18,.24),inset 0 1px 0 rgba(255,255,255,.04);font-family:"Segoe UI Variable Text","Segoe UI Variable","Segoe UI",system-ui,-apple-system,sans-serif;font-size:13px}.soreal-idle-v79-player-card{border-top:3px solid var(--nav-color,#22c55e);box-shadow:0 10px 24px rgba(5,9,18,.24),0 0 18px color-mix(in srgb,var(--nav-color,#22c55e) 8%,transparent),inset 0 1px 0 rgba(255,255,255,.04)}.soreal-idle-v79-enemy-card{border-top:3px solid #d95b68}.soreal-idle-v79-card-name{font-family:"Segoe UI Variable Display","Segoe UI Variable","Segoe UI",system-ui,-apple-system,sans-serif;font-weight:800;font-size:15px;line-height:1.2;letter-spacing:.018em;color:#f5f7fc;min-height:34px;padding:1px 0 9px;margin-bottom:8px;border-bottom:1px solid rgba(166,188,229,.10);overflow-wrap:anywhere}.soreal-idle-v79-stat-lines{display:grid;gap:6px;line-height:1.3}.soreal-idle-v79-stat-lines>div{display:flex;align-items:baseline;justify-content:space-between;gap:12px;min-width:0;white-space:nowrap;color:#aebbd4;font-size:12.5px}.soreal-idle-v79-stat-label{flex:1 1 auto;min-width:0;text-align:left;overflow:hidden;text-overflow:ellipsis}.soreal-idle-v79-stat-value{display:inline-flex;flex:0 0 auto;align-items:baseline;justify-content:flex-end;gap:0;white-space:nowrap;text-align:right}.soreal-idle-v79-stat-lines b{color:#f4f7ff;font-size:13px;font-weight:750;font-variant-numeric:tabular-nums;letter-spacing:.01em}.soreal-idle-v79-stat-bonus{margin-left:0!important;color:#55e188!important;font-weight:800!important}.soreal-idle-v79-stat-cube{margin-left:0!important;color:#a98cff!important;font-weight:800!important}.soreal-idle-v79-safe-regen{color:#55e188!important;text-shadow:0 0 10px rgba(85,225,136,.20)}.soreal-idle-v79-card-health{margin-top:auto;padding-top:8px;text-align:center}.soreal-idle-v79-stat-card .soreal-idle-playerbar-wrap-v15,.soreal-idle-v79-stat-card .soreal-idle-bossbar-wrap-v7{width:100%;max-width:none}.soreal-idle-v79-stat-card .soreal-idle-adventure-player-pv-label-v1,.soreal-idle-v79-stat-card .soreal-idle-v79-adventure-mob-pv{color:#dce5f3;text-shadow:none;font-family:"Segoe UI Variable Text","Segoe UI Variable","Segoe UI",system-ui,-apple-system,sans-serif;font-variant-numeric:tabular-nums}\
      @media(max-width:700px){.soreal-idle-v79-arena{gap:5px;padding:6px}.soreal-idle-v79-adventure-media{width:min(100%,250px);margin:auto}.soreal-idle-v79-stat-card{padding:7px 8px}.soreal-idle-v79-card-name{min-height:0;padding-bottom:5px;margin-bottom:4px;font-size:12px}.soreal-idle-v79-stat-lines{gap:2px}.soreal-idle-v79-stat-lines>div{font-size:10px}.soreal-idle-v79-stat-lines b{font-size:10.5px}.soreal-idle-v79-adventure-copy{padding:6px 9px}.soreal-idle-v79-adventure-copy h2{font-size:14px;margin-top:1px}.soreal-idle-v79-adventure-copy span{font-size:8px}.soreal-idle-v79-combat-health{gap:3px}.soreal-idle-v79-adventure-mob-pv,.soreal-idle-v79-stat-card .soreal-idle-adventure-player-pv-label-v1{font-size:10px;margin-bottom:1px}.soreal-idle-v79-stats-grid{gap:5px}}@media(max-width:470px){.soreal-idle-v79-adventure-media{width:min(100%,210px)}.soreal-idle-v79-stats-grid{grid-template-columns:1fr 1fr}.soreal-idle-v79-stat-lines>div{font-size:9px;gap:2px}.soreal-idle-v79-stat-lines b{font-size:9.5px}.soreal-idle-v79-card-name{font-size:11px}.soreal-idle-v79-arena{padding:4px}.soreal-idle-v79-adventure-scene{margin-bottom:7px}}\
      .soreal-idle-v79-adventure-safe-wrap{position:absolute;inset:0;z-index:1;pointer-events:none;background:#05080d}\
      .soreal-idle-v79-adventure-safe-image{display:none;width:100%;height:100%;object-fit:cover}\
      .soreal-idle-v79-adventure-mob-wrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:2}\
      .soreal-idle-v79-adventure-mob{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 10px 22px rgba(0,0,0,.55))}\
      .soreal-idle-v79-adventure-mob-boss-tag{position:absolute;top:14px;left:50%;transform:translateX(-50%);font-size:12px;font-weight:900;padding:5px 12px;border-radius:999px;background:rgba(255,196,60,.22);color:#ffcf5c;text-shadow:0 1px 3px rgba(0,0,0,.5);z-index:1}\
      .soreal-idle-v79-adventure-mob.impact-boss-v46{animation:sorealIdleBossHitV46 .26s ease-out}\
      \
      .soreal-idle-v79-adventure-enemy-row{display:flex;flex-direction:column;align-items:center;width:100%}\
      .soreal-idle-v79-adventure-mob-pv{font-size:13px;font-weight:900}\
      .soreal-idle-v79-health-track-v200{position:relative;width:100%;height:28px;overflow:hidden;border:2px solid #111827;border-radius:6px;background:linear-gradient(180deg,#f4f7fb 0%,#dce3ec 100%);box-shadow:0 2px 8px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.9),inset 0 -1px 0 rgba(15,23,42,.12)}.soreal-idle-v79-health-track-v200 .soreal-idle-v79-health-fill-v200{position:absolute;left:0;top:0;bottom:0;height:100%!important;border:0!important;border-radius:3px 0 0 3px!important;background:linear-gradient(180deg,#ff5a63 0%,#ef3742 47%,#ce202d 100%)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.35),inset -1px 0 0 rgba(84,0,8,.22),0 0 10px rgba(239,55,66,.20)!important}.soreal-idle-v79-health-label-v200{position:absolute!important;inset:0!important;z-index:3!important;display:flex!important;align-items:center!important;justify-content:center!important;margin:0!important;padding:0 8px!important;color:#fff!important;font-family:\"Segoe UI Variable Display\",\"Segoe UI Variable\",\"Segoe UI\",system-ui,-apple-system,sans-serif!important;font-size:13px!important;font-weight:900!important;letter-spacing:.025em!important;font-variant-numeric:tabular-nums!important;line-height:1!important;text-align:center!important;pointer-events:none!important;text-shadow:0 1px 0 #000,0 0 3px rgba(0,0,0,.95),0 0 6px rgba(0,0,0,.8)!important}@media(max-width:700px){.soreal-idle-v79-health-track-v200{height:26px}.soreal-idle-v79-health-label-v200{font-size:12px!important}}\
    ';document.head.appendChild(st);
  }

  window.__SOREAL_IDLE_ADVENTURE_SCENE_V79_TEST__={currentZone:currentZone_};
  function init_(){
    style_();runtime=window.__SOREAL_IDLE_RUNTIME_V1__||runtime;
    if(runtime&&runtime.onRender)runtime.onRender(schedule_);
    schedule_();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init_,{once:true});else init_();
})();
