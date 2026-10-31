/*
 * SOREAL IDLE — page Money Pit & Roue journalière (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe).
 * Extrait tel quel de meta-progression-v130.js (même code, mêmes fonctions, mêmes ponts window.__x__ pour les onclick inline).
 * Dépendances : window.__SOREAL_IDLE_META_V130__ (systemeMetaParIdIdleV130_, collecterSystemeMetaIdleV130_) et window.__SOREAL_IDLE_META_HOST_V130__,
 * relus seulement à l'exécution (l'ordre de chargement des <script> n'a pas d'importance).
 * Expose window.__SOREAL_IDLE_MONEY_PIT_V1__ = { rendreBoutonMoneyPit, rendreBoutonDailySpin, page }.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_MONEY_PIT_V1__)return;

      function systemeMetaParIdIdleV130_(j,id){return window.__SOREAL_IDLE_META_V130__.systemeMetaParIdIdleV130_(j,id);}
      function collecterSystemeMetaIdleV130_(id){return window.__SOREAL_IDLE_META_V130__.collecterSystemeMetaIdleV130_(id);}

      /*
       * Compte à rebours Money Pit / Daily Spin (Norman, 2026-10-03 : « tous les compteurs doivent être très précis »). Le texte était écrit une seule fois au dessin de la page :
       * il restait figé puis le bouton restait grisé après l'échéance. Chaque bouton porte maintenant son échéance (heure du SERVEUR) ; un minuteur met le texte à jour et,
       * à l'échéance, redessine la page une fois pour rendre le bouton actif.
       */
      function libelleRechargeMoneyPitIdleV1_(restantS){
        const h=Math.floor(restantS/3600);
        const m=Math.floor((restantS%3600)/60);
        const sec=restantS%60;
        return '🕳️ En recharge · '+(h>0?(h+'h '+m+'m'):(m>0?(m+'m '+sec+'s'):(sec+'s')));
      }
      function libelleRechargeDailySpinIdleV1_(restantS){
        const h=Math.floor(restantS/3600);
        const m=Math.floor((restantS%3600)/60);
        return 'Prochain tour dans '+(h>0?(h+'h '+m+'m'):(m>0?(m+'m'):(restantS+'s')));
      }
      let minuteurRechargeIdleV1=null;
      function demarrerMinuteurRechargeIdleV1_(){
        if(minuteurRechargeIdleV1||typeof setInterval!=='function')return;
        minuteurRechargeIdleV1=setInterval(function(){
        const boutons=document.querySelectorAll('[data-idle-recharge-v1]');
        if(!boutons.length)return;
        const maintenant=(typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now());
        let echu=false;
        boutons.forEach(function(b){
          const restantMs=Number(b.getAttribute('data-fin'))-maintenant;
          if(restantMs>0){
            const restantS=Math.ceil(restantMs/1000);
            const texte=b.getAttribute('data-idle-recharge-v1')==='pit'?libelleRechargeMoneyPitIdleV1_(restantS):libelleRechargeDailySpinIdleV1_(restantS);
            if(b.textContent!==texte)b.textContent=texte;
          }else echu=true;
        });
        if(echu){
          const racine=document.querySelector('.soreal-idle-page-root-v28');
          const H=window.__SOREAL_IDLE_META_HOST_V130__;
          if(racine&&H&&typeof H.rafraichirMenuRacineIdleV28_==='function'&&H.getIdleEtat())H.rafraichirMenuRacineIdleV28_();
        }
        },500);
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-301 */
      function rendreBoutonMoneyPitIdleV1_(j,st){
        const gold=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(j&&j.systemes&&j.systemes.currencies&&j.systemes.currencies.gold);
        const nextAt=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(st&&st.data&&st.data.nextAt);
        const restantMs=nextAt-(typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now());
        if(restantMs>0){
          const restantS=Math.ceil(restantMs/1000);
          demarrerMinuteurRechargeIdleV1_();
          return '<button type="button" class="soreal-idle-expand-button-v25" disabled data-idle-recharge-v1="pit" data-fin="'+nextAt+'">'+libelleRechargeMoneyPitIdleV1_(restantS)+'</button>';
        }
        /* Sous 100 000 Or le trou prend quand même l'or (message « Tu te sens bien plus pauvre… », comme dans le jeu d'origine) : le bouton reste actif tant qu'il y a de l'or. */
        if(gold<1){
          return '<button type="button" class="soreal-idle-expand-button-v25" disabled>🕳️ Jeter de l’or (tu n’as plus d’Or)</button>';
        }
        return '<button type="button" class="soreal-idle-expand-button-v25 glow-dispo-v1" onclick="window.__actionMetaIdleV130__({action:\'moneyPit\'})">🕳️ Balance ton argent</button>';
      }

      /*
       * Roue du Daily Spin refaite (Norman, 2026-10-31) : voir modules/roue-journaliere-v1.js (grande roue de la largeur du cadre du trou, un secteur par récompense réelle, flux « le moteur tire, la roue s'arrête
       * sur son résultat »). Ici : l'état « prête ? » et le bouton.
       */
      const rangCouleurMemoIdleV1={};

      function roueDisponibleIdleV1_(st){
        const readyAt=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(st&&st.data&&st.data.readyAt);
        return readyAt-(typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now())<=0;
      }

      function rendreBoutonDailySpinIdleV203_(st){
        const readyAt=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(st&&st.data&&st.data.readyAt);
        const restantMs=readyAt-(typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now());
        if(restantMs>0){
          const restantS=Math.ceil(restantMs/1000);
          demarrerMinuteurRechargeIdleV1_();
          return '<button type="button" class="rb-bouton" disabled data-idle-recharge-v1="spin" data-fin="'+readyAt+'">'+libelleRechargeDailySpinIdleV1_(restantS)+'</button>';
        }
        return '<button type="button" class="rb-bouton rb-dispo glow-dispo-v1 mp2-spin-bouton-v1" onclick="window.__lancerRoueIdleV1__()">Tourner</button>';
      }


      /*
       * Money Pit (2026-09-26, Norman : « il ne faudrait que les bonus totaux que le Money Pit nous a apportés depuis le début de la partie ») :
       * remplace le bandeau « Progression permanente » (EXP, PP, QP, Or…) au-dessus du trou. Totaux cumulés côté serveur (data.rewardsTotal).
       */
      function bandeauMoneyPitIdleV1_(data){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const t=data&&data.rewardsTotal&&typeof data.rewardsTotal==='object'?data.rewardsTotal:{};
        const n=function(k){return Math.max(0,Number(t[k])||0);};
        const f=function(v,d){return H.formatGrandNombreIdleV70_(v,d);};
        const lignes=[];
        if(n('adventureStats'))lignes.push('⚔️ +'+f(n('adventureStats'))+' Puissance et Endurance d’Aventure');
        if(n('adventureHp'))lignes.push('❤️ +'+f(n('adventureHp'))+' PV max d’Aventure');
        if(n('adventureRegen'))lignes.push('🩹 +'+f(n('adventureRegen'),2)+' Regen PV d’Aventure');
        if(n('cubePower')||n('cubeToughness')||n('cubeBoth')){
          const morceaux=[];
          if(n('cubePower'))morceaux.push('+'+f(n('cubePower'))+' Puissance');
          if(n('cubeToughness'))morceaux.push('+'+f(n('cubeToughness'))+' Endurance');
          if(n('cubeBoth'))morceaux.push('+'+f(n('cubeBoth'))+' des deux');
          lignes.push('🧊 Cube : '+morceaux.join(' · '));
        }
        if(n('experience'))lignes.push('✨ +'+f(n('experience'))+' EXP');
        if(n('ap'))lignes.push('🎟️ +'+f(n('ap'))+' AP');
        if(n('seeds'))lignes.push('🌱 +'+f(n('seeds'))+' graines');
        if(n('wandoosLevels'))lignes.push('💻 +'+f(n('wandoosLevels'))+' niveaux de Wandoos');
        if(n('boosts'))lignes.push('🚀 '+f(n('boosts'))+' boost(s) obtenu(s)');
        if(n('energyBars')||n('magicBars'))lignes.push('📊 +'+f(n('energyBars'))+' barre(s) d’Energy · +'+f(n('magicBars'))+' barre(s) de Magic');
        return '<div class="soreal-idle-section-v8">'+
          '<div class="soreal-idle-window-title-v31 gold">🕳️ Bonus obtenus grâce au Money Pit</div>'+
          (lignes.length
            ?'<div style="display:grid;gap:5px;margin-top:6px">'+lignes.map(function(l){return '<div class="soreal-idle-note-v4" style="margin:0">'+H.idleHtml_(l)+'</div>';}).join('')+'</div>'
            :'<div class="soreal-idle-note-v4">Aucun bonus pour l’instant : jette ton Or dans le trou.</div>')+
        '</div>';
      }


      /*
       * Roue journalière (Norman, 2026-10-17) : « comme pour le Money Pit, un total de ce que la roue nous a donné au total ; toute l'AP cumulée, etc. ». Totaux cumulés côté serveur (data.rewardsTotal). Rien n'est
       * affiché tant que la roue n'a rien donné.
       */
      function bandeauRoueIdleV1_(data){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const t=data&&data.rewardsTotal&&typeof data.rewardsTotal==='object'?data.rewardsTotal:{};
        const f=function(v,d){return H.formatGrandNombreIdleV70_(v,d);};
        const lignes=[];
        if(Number(t.ap)>0)lignes.push('🎟️ +'+f(Number(t.ap))+' AP');
        if(Number(t.seeds)>0)lignes.push('🌱 +'+f(Number(t.seeds))+' graines');
        const items=t.items&&typeof t.items==='object'?t.items:{};
        Object.keys(items).forEach(function(id){
          const n=Number(items[id]);
          if(n>0)lignes.push('🎁 '+f(n)+' × '+(NOMS_OBJETS_ROUE_V1[id]||id));
        });
        return '<div class="soreal-idle-section-v8">'+
          '<div class="soreal-idle-window-title-v31 gold">🎡 Bonus obtenus grâce à la roue journalière</div>'+
          (lignes.length
            ?'<div style="display:grid;gap:5px;margin-top:6px">'+lignes.map(function(l){return '<div class="soreal-idle-note-v4" style="margin:0">'+H.idleHtml_(l)+'</div>';}).join('')+'</div>'
            :'<div class="soreal-idle-note-v4">Aucun bonus pour l’instant : fais tourner la roue.</div>')+
        '</div>';
      }

      const NOMS_OBJETS_ROUE_V1={energyPotionAlpha:'Potion Energy α',energyPotionBeta:'Potion Energy β',energyPotionDelta:'Potion Energy δ',magicPotionAlpha:'Potion Magic α',magicPotionBeta:'Potion Magic β',magicPotionDelta:'Potion Magic δ',luckyCharm:'Lucky Charm',superLuckyCharm:'Super Lucky Charm',energyBarBar:'Energy Bar Bar',magicBarBar:'Magic Bar Bar',littleBluePill1000:'× 1000 Little Blue Pill',poop:'Caca',beastButter:'Beast Butter',macguffinMuffin:'MacGuffin Muffin'};

      function libelleRecompenseMetaV206_(entree){
        if(!entree)return '—';
        const morceaux=[];
        const reward=entree.reward&&typeof entree.reward==='object'?entree.reward:{};
        if(entree.boost){
          const typeBoost=String(entree.boost.type||'');
          const nomBoost=typeBoost==='power'?'Puissance':(typeBoost==='toughness'?'Endurance':(typeBoost==='special'?'Spécial':typeBoost));
          morceaux.push(
            'Boost '+nomBoost+
            ' +'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(entree.boost.strength||0)
          );
        }
        if(reward.adventureStats){
          morceaux.push(
            '+'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(reward.adventureStats)+
            ' Puissance/Endurance Aventure'
          );
        }
        if(reward.adventureHp){
          morceaux.push('+'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(reward.adventureHp)+' PV max Aventure');
        }
        if(reward.adventureRegen){
          morceaux.push('+'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(reward.adventureRegen,2)+' Regen PV Aventure');
        }
        if(reward.ap)morceaux.push(window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(reward.ap)+' AP');
        if(reward.experience)morceaux.push(window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(reward.experience)+' EXP');
        if(reward.seeds)morceaux.push(window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(reward.seeds)+' graines');
        if(reward.cubePower)morceaux.push('+'+reward.cubePower+' Cube Puissance');
        if(reward.cubeToughness)morceaux.push('+'+reward.cubeToughness+' Cube Endurance');
        if(reward.cubeBoth)morceaux.push('+'+reward.cubeBoth+' Cube Puissance et Endurance');
        if(reward.wandoosLevels)morceaux.push('+'+reward.wandoosLevels+' niveau(x) Wandoos');
        if(reward.items){
          const NOMS={energyPotionAlpha:'Potion Energy α',energyPotionBeta:'Potion Energy β',energyPotionDelta:'Potion Energy δ',magicPotionAlpha:'Potion Magic α',magicPotionBeta:'Potion Magic β',magicPotionDelta:'Potion Magic δ',luckyCharm:'Lucky Charm',superLuckyCharm:'Super Lucky Charm',energyBarBar:'Energy Bar Bar',magicBarBar:'Magic Bar Bar',littleBluePill1000:'× 1000 Little Blue Pill',poop:'Caca',beastButter:'Beast Butter',macguffinMuffin:'MacGuffin Muffin'};
          Object.keys(reward.items).forEach(function(id){morceaux.push(reward.items[id]+' × '+(NOMS[id]||id));});
        }
        return morceaux.length?morceaux.join(' · '):'Récompense mystérieuse';
      }


      function phraseMoneyPitIdleV1_(entree,j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const nb=function(v,d){return H.formatGrandNombreIdleV70_(v,d);};
        const reward=entree&&entree.reward&&typeof entree.reward==='object'?entree.reward:{};
        const variante=Math.abs(Math.floor(Number(entree&&entree.at)||0))%2;
        const choisir=function(a,b){return variante?b:a;};
        if(entree&&entree.boost){
          const type=String(entree.boost.type||'');
          const nom=type==='power'?'Puissance':(type==='toughness'?'Endurance':(type==='special'?'Spécial':type));
          return 'Le Trou rote et recrache un Boost '+nom+' '+nb(entree.boost.strength||0)+' !';
        }
        if(reward.seeds){
          const ygg=systemeMetaParIdIdleV130_(j,'yggdrasil');
          const debloque=Boolean(ygg&&(ygg.unlocked||(ygg.state&&ygg.state.unlocked)));
          return debloque
            ?choisir('Une graine jaillit du Trou et vous atterrit sur le pied : +'+nb(reward.seeds)+' graines !','Le Trou vous crache une poignée de graines à la figure : +'+nb(reward.seeds)+' graines !')
            :'Une énorme graine verte jaillit du Trou et atterrit à vos pieds ! Avant que vous puissiez l’attraper, elle rebondit dans le Trou ! C’était QUOI, ça ?!';
        }
        if(Object.prototype.hasOwnProperty.call(reward,'wandoosLevels')&&!reward.wandoosLevels)return 'Le Trou rote… et ça sent affreusement mauvais.';
        if(reward.wandoosLevels)return choisir('Le Trou rote et ça sent le vieil ordinateur : +'+reward.wandoosLevels+' niveau(x) Wandoos !','Le Trou ronronne comme un vieux disque dur : +'+reward.wandoosLevels+' niveau(x) Wandoos !');
        if(reward.adventureStats)return choisir('Le Trou rote un grand coup et vous voilà plus costaud : +'+nb(reward.adventureStats)+' Puissance et Endurance !','Le Trou vous crache de la force brute sur les bottes : +'+nb(reward.adventureStats)+' Puissance et Endurance !');
        if(reward.adventureHp)return choisir('Le Trou gargouille et vous gonfle les muscles : +'+nb(reward.adventureHp)+' PV max !','Le Trou hoquette et vous voilà bien plus solide : +'+nb(reward.adventureHp)+' PV max !');
        if(reward.adventureRegen)return choisir('Le Trou soupire un air tiède qui referme vos petits bobos : +'+nb(reward.adventureRegen,2)+' de régénération !','Le Trou tousse un nuage réparateur : +'+nb(reward.adventureRegen,2)+' de régénération !');
        if(reward.cubePower||reward.cubeToughness||reward.cubeBoth)return choisir('Le Trou crache un truc brillant qui se met à vibrer dans votre sac !','Le Trou rote et quelque chose de mystérieux se met à briller de bonheur !');
        if(reward.experience)return choisir('Le Trou tousse un petit nuage d’expérience : +'+nb(reward.experience)+' EXP !','Le Trou recrache un sac brillant : +'+nb(reward.experience)+' EXP !');
        return 'Le Trou rote… et ne recrache rien de reconnaissable.';
      }

      function historiqueMoneyPitIdleV206_(pit,roue){
        const pitData=pit&&pit.state&&pit.state.data||{};
        const roueData=roue&&roue.state&&roue.state.data||{};
        const lignes=[];

        (Array.isArray(pitData.history)?pitData.history:[]).forEach(function(x){
          lignes.push({
            at:window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(x.at),
            source:'🕳️ Money Pit',
            genre:'pit',
            entree:x,
            detail:'Palier '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(x.tier)+' · '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(x.cost||0)+' Or',
            prize:libelleRecompenseMetaV206_(x)
          });
        });
        (Array.isArray(roueData.history)?roueData.history:[]).forEach(function(x){
          lignes.push({
            at:window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(x.at),
            source:'🎡 Roue journalière',
            genre:'roue',
            detail:'Tier '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(x.tier),
            prize:libelleRecompenseMetaV206_(x)
          });
        });

        lignes.sort(function(a,b){return b.at-a.at;});
        return lignes.slice(0,20);
      }


      /*
       * Calendrier de connexion (Norman, 2026-10-03) : une case par jour du mois, grisées tant que la série ne les a pas atteintes, qui « s'allument » une à une ; la dernière case, bien plus
       * grosse, couronne le mois. Les sommes viennent du serveur (idle-login-calendar-v1.js : 150 000 AP par mois, croissantes). Voulu tel quel par Norman : les cases à venir sont visibles (grisées).
       */
      const IDLE_MOIS_FR_CALENDRIER_V1=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
      /* Dernière série vue : seule une case qui vient de s'allumer rejoue l'animation d'allumage (pas toutes les cases à chaque redessin de la page). */
      let calSerieVueV1=null;
      function rendreCalendrierConnexionIdleV1_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const cal=j&&j.systemes&&j.systemes.loginCalendar;
        if(!cal||!Array.isArray(cal.bareme)||!cal.bareme.length)return '';
        const jours=cal.bareme.length;
        const serie=Math.max(0,Math.min(jours,H.idleEntier_(cal.serie)));
        const nomMois=(IDLE_MOIS_FR_CALENDRIER_V1[H.idleEntier_(cal.moisNumero)-1]||'')+' '+H.idleEntier_(cal.annee);
        /* Cases = jours du mois (Norman, 2026-10-10) : prise = allumée, jour passé non pris = grisée (ratée, sans effet sur les autres), jour du jour = prête, à venir = éteinte. */
        const prises=Array.isArray(cal.reclamees)?cal.reclamees:[];
        const ratees=Array.isArray(cal.ratees)?cal.ratees:[];
        const serieAvant=calSerieVueV1;
        calSerieVueV1=prises.length;
        const jourDuMois=H.idleEntier_(cal.jourDuMois);
        const cases=cal.bareme.map(function(ap,i){
          const dernier=i===jours-1;
          const jour=i+1;
          const allume=prises.indexOf(jour)>=0;
          const ratee=!allume&&ratees.indexOf(jour)>=0;
          const pret=!allume&&!ratee&&jour===jourDuMois&&Boolean(cal.reclamable);
          const etat=allume?('allume'+((serieAvant!==null&&prises.length>serieAvant)?' nouveau':'')):(ratee?'ratee':(pret?'pret':'eteint'));
          const icone=dernier?'👑':(((i+1)%7===0)?'🎁':'💠');
          return '<div class="cal-case-v1 '+etat+(dernier?' dernier':'')+'" title="Jour '+jour+' : '+H.idleHtml_(H.formatGrandNombreIdleV70_(ap))+' AP'+(ratee?' (jour raté)':'')+'">'+
            '<span class="cal-jour-v1">'+jour+'</span>'+
            '<span class="cal-icone-v1">'+icone+'</span>'+
            '<span class="cal-ap-v1">'+H.idleHtml_(H.formatGrandNombreIdleV70_(ap))+(dernier?' AP':'')+'</span>'+
            (allume?'<span class="cal-coche-v1">✓</span>':'')+
          '</div>';
        }).join('');
        let bouton;
        if(cal.reclamable){
          bouton='<button type="button" class="soreal-idle-expand-button-v25 cal-bouton-v1 glow-dispo-v1" onclick="window.__actionMetaIdleV130__({action:\'loginCalendar\'})">🎁 Récupérer la récompense du jour : +'+H.idleHtml_(H.formatGrandNombreIdleV70_(cal.prochainAp))+' AP</button>';
        }else if(jourDuMois>=jours){
          bouton='<button type="button" class="soreal-idle-expand-button-v25 cal-bouton-v1" disabled>👑 Dernier jour du mois récupéré ! Un nouveau plateau commence le 1er du mois prochain.</button>';
        }else{
          bouton='<button type="button" class="soreal-idle-expand-button-v25 cal-bouton-v1" disabled>✅ Récompense du jour récupérée · reviens demain pour +'+H.idleHtml_(H.formatGrandNombreIdleV70_(cal.prochainAp))+' AP</button>';
        }
        return '<style>'+
            '.cal-v1{max-width:760px;margin:0 auto 14px;padding:12px;border-radius:16px;border:2px solid rgba(255,214,102,.55);background:linear-gradient(165deg,rgba(40,28,8,.92),rgba(14,10,4,.95));box-shadow:0 10px 28px rgba(0,0,0,.35),inset 0 0 40px rgba(255,190,60,.08)}'+
            '.cal-titre-v1{font-size:17px;font-weight:950;color:#ffe9a8;text-shadow:0 2px 4px #000;text-align:center}'+
            '.cal-sous-v1{font-size:12px;color:#e8d9b0;text-align:center;margin:3px 0 8px}'+
            '.cal-stats-v1{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;font-size:13px;color:#ffe9a8;margin-bottom:8px}'+
            '.cal-stats-v1 b{color:#fff}'+
            '.cal-grille-v1{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}'+
            '.cal-case-v1{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;aspect-ratio:1/1.12;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#1b1a22;color:#9aa0b4;overflow:hidden;transition:transform .2s}'+
            '.cal-jour-v1{position:absolute;top:3px;left:5px;font-size:10px;font-weight:800;opacity:.85}'+
            '.cal-icone-v1{font-size:19px;line-height:1.1;margin-top:9px}'+
            '.cal-ap-v1{font-size:10px;font-weight:900;letter-spacing:.01em}'+
            '.cal-case-v1.eteint{filter:grayscale(1);opacity:.5}'+
            '.cal-case-v1.ratee{filter:grayscale(1) brightness(.7);opacity:.38;background:repeating-linear-gradient(135deg,#1b1a22 0 6px,#15141b 6px 12px)}'+
            '.cal-case-v1.ratee .cal-icone-v1{opacity:.55}'+
            '.cal-case-v1.allume{border-color:#ffd54a;background:radial-gradient(circle at 50% 30%,#ffe58a 0,#f2a91b 55%,#a8650a 100%);color:#3a2300;box-shadow:0 0 14px rgba(255,200,60,.75),inset 0 0 10px rgba(255,255,255,.45)}'+
            '.cal-case-v1.allume.nouveau{animation:calAllumeV1 .6s ease-out}'+
            '.cal-case-v1.allume .cal-icone-v1{filter:drop-shadow(0 0 5px rgba(255,255,255,.9))}'+
            '.cal-coche-v1{position:absolute;right:3px;top:3px;font-size:9px;font-weight:1000;color:#15632a;background:rgba(255,255,255,.9);border-radius:50%;width:13px;height:13px;line-height:13px;text-align:center}'+
            '.cal-case-v1.pret{border:2px solid #7dffa8;background:radial-gradient(circle at 50% 30%,#26543a 0,#123222 70%);color:#eafff1;box-shadow:0 0 16px rgba(110,255,160,.8);animation:calPretV1 1.1s ease-in-out infinite}'+
            '.cal-case-v1.dernier{grid-column:1/-1;flex-direction:row;gap:12px;aspect-ratio:auto;min-height:62px;padding:8px 14px}'+
            '.cal-case-v1.dernier .cal-jour-v1{top:5px;left:9px;font-size:12px}'+
            '.cal-case-v1.dernier .cal-icone-v1{font-size:34px;margin-top:0}.cal-case-v1.dernier.eteint{opacity:.75}'+
            '.cal-case-v1.dernier .cal-ap-v1{font-size:20px}'+
            '.cal-bouton-v1{width:100%;margin-top:10px!important;white-space:normal}'+
            '@keyframes calPretV1{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}'+
            '@keyframes calAllumeV1{0%{transform:scale(.7);filter:brightness(2)}100%{transform:scale(1);filter:none}}'+
            '@media(prefers-reduced-motion:reduce){.cal-case-v1.pret,.cal-case-v1.allume,.cal-case-v1.allume.nouveau{animation:none}}'+
          '</style>'+
          '<div class="cal-v1">'+
            '<div class="cal-titre-v1">📅 Récompenses de connexion · '+H.idleHtml_(nomMois)+'</div>'+
            '<div class="cal-sous-v1">'+(cal.offert?'Reviens chaque jour pour récupérer ta case : plus le mois avance, plus l’AP est gros. Une case ratée est grisée.':'Reviens chaque jour pour récupérer ta case. Une case ratée est grisée, et chaque jour raté retire 10 % aux récompenses restantes.')+'</div>'+
            '<div class="cal-stats-v1"><span>🔥 Cases récupérées : <b>'+prises.length+'</b></span>'+(H.idleEntier_(cal.joursRates)>0&&!cal.offert?'<span>⚠️ Jours ratés : <b>'+H.idleEntier_(cal.joursRates)+'</b> (récompenses restantes à <b>'+Math.round(H.idleNombre_(cal.multiplicateur)*100)+' %</b>)</span>':'')+'<span>💠 Total du mois : <b>'+H.idleHtml_(H.formatGrandNombreIdleV70_(H.idleNombre_(cal.totalMois)))+' AP</b></span></div>'+
            '<div class="cal-stats-v1"><span>🏆 Total d’AP obtenus depuis le début des récompenses : <b>'+H.idleHtml_(H.formatGrandNombreIdleV70_(H.idleNombre_(cal.totalAp)))+' AP</b></span></div>'+
            '<div class="cal-grille-v1">'+cases+'</div>'+
            bouton+
          '</div>';
      }

      /*
       * Historiques du Money Pit et de la roue (Norman, 2026-10-03) : DEUX cadres séparés (Money Pit seulement, roue seulement), repliables, 20 lignes par page, une page de plus pour les lignes
       * plus anciennes. L'état ouvert/fermé de chaque cadre et la page affichée sont retenus (la page se redessine souvent).
       */
      const IDLE_MP_PAR_PAGE_V1=20;
      const idleMpPagesV1={pit:0,roue:0};

      function lignesMoneyPitIdleV1_(pit){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const data=pit&&pit.state&&pit.state.data||{};
        return (Array.isArray(data.history)?data.history:[]).map(function(x){
          return {at:H.idleNombre_(x.at),entree:x,detail:'Palier '+H.idleEntier_(x.tier)+' · '+H.formatGrandNombreIdleV70_(x.cost||0)+' Or',prize:libelleRecompenseMetaV206_(x)};
        }).sort(function(a,b){return b.at-a.at;});
      }

      function lignesRoueIdleV1_(roue){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const data=roue&&roue.state&&roue.state.data||{};
        return (Array.isArray(data.history)?data.history:[]).map(function(x){
          return {at:H.idleNombre_(x.at),detail:'Tier '+H.idleEntier_(x.tier),prize:libelleRecompenseMetaV206_(x)};
        }).sort(function(a,b){return b.at-a.at;});
      }

      function dateCourteMoneyPitIdleV1_(ms){
        if(!(ms>0))return '';
        try{return new Date(ms).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}catch(_e){return '';}
      }

      function cleOuvertureCadreMoneyPitIdleV1_(cle){return 'soreal_idle_mp_cadre_'+cle;}
      function cadreMoneyPitOuvertIdleV1_(cle){
        try{return localStorage.getItem(cleOuvertureCadreMoneyPitIdleV1_(cle))!=='0';}catch(_e){return true;}
      }
      window.__basculerCadreMoneyPitIdleV1__=function(cle,details){
        try{localStorage.setItem(cleOuvertureCadreMoneyPitIdleV1_(cle),details&&details.open?'1':'0');}catch(_e){}
      };

      /* Change de page dans un cadre sans redessiner la page : montre le corps de tableau voulu, cache les autres, met à jour le compteur et les boutons. */
      window.__pageCadreMoneyPitIdleV1__=function(cle,sens){
        const racine=document.querySelector('[data-mp-cadre="'+cle+'"]');
        if(!racine)return;
        const corps=racine.querySelectorAll('[data-mp-page]');
        const total=corps.length;
        const cible=Math.max(0,Math.min(total-1,(idleMpPagesV1[cle]||0)+sens));
        idleMpPagesV1[cle]=cible;
        Array.prototype.forEach.call(corps,function(c){c.hidden=Number(c.getAttribute('data-mp-page'))!==cible;});
        const compteur=racine.querySelector('[data-mp-compteur]');
        if(compteur)compteur.textContent='Page '+(cible+1)+' / '+total;
        const recent=racine.querySelector('[data-mp-recent]');
        const ancien=racine.querySelector('[data-mp-ancien]');
        if(recent)recent.disabled=cible<=0;
        if(ancien)ancien.disabled=cible>=total-1;
      };

      function cadreRecompensesMoneyPitIdleV1_(cle,titre,lignes,colonneDetail,vide){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const pages=Math.max(1,Math.ceil(lignes.length/IDLE_MP_PAR_PAGE_V1));
        const courante=Math.max(0,Math.min(pages-1,idleMpPagesV1[cle]||0));
        idleMpPagesV1[cle]=courante;
        let tables='';
        for(let p=0;p<pages;p+=1){
          tables+='<tbody data-mp-page="'+p+'"'+(p===courante?'':' hidden')+'>'+
            lignes.slice(p*IDLE_MP_PAR_PAGE_V1,(p+1)*IDLE_MP_PAR_PAGE_V1).map(function(x){
              return '<tr><td>'+H.idleHtml_(dateCourteMoneyPitIdleV1_(x.at))+'</td><td>'+H.idleHtml_(x.detail)+'</td><td><b>'+H.idleHtml_(x.prize)+'</b></td></tr>';
            }).join('')+
          '</tbody>';
        }
        return '<details class="mp-cadre-v1" data-mp-cadre="'+cle+'"'+(cadreMoneyPitOuvertIdleV1_(cle)?' open':'')+' ontoggle="window.__basculerCadreMoneyPitIdleV1__(\''+cle+'\',this)">'+
          '<summary>'+H.idleHtml_(titre)+' <span class="mp-compte-v1">('+lignes.length+')</span></summary>'+
          '<div class="mp-corps-v1">'+
            (lignes.length
              ?'<table class="soreal-idle-reward-table-v206"><thead><tr><th>Quand</th><th>'+H.idleHtml_(colonneDetail)+'</th><th>Prix</th></tr></thead>'+tables+'</table>'+
                (pages>1
                  ?'<div class="mp-pager-v1">'+
                      '<button type="button" data-mp-recent onclick="window.__pageCadreMoneyPitIdleV1__(\''+cle+'\',-1)"'+(courante<=0?' disabled':'')+'>◀ Plus récentes</button>'+
                      '<span data-mp-compteur>Page '+(courante+1)+' / '+pages+'</span>'+
                      '<button type="button" data-mp-ancien onclick="window.__pageCadreMoneyPitIdleV1__(\''+cle+'\',1)"'+(courante>=pages-1?' disabled':'')+'>Plus anciennes ▶</button>'+
                    '</div>'
                  :'')
              :'<div class="soreal-idle-note-v4">'+H.idleHtml_(vide)+'</div>')+
          '</div>'+
        '</details>';
      }

      function pageMoneyPitDailySpinIdleV206_(j){
        const pit=systemeMetaParIdIdleV130_(j,'moneyPit');
        const roueReelle=systemeMetaParIdIdleV130_(j,'dailySpin');
        const pitSt=pit&&pit.state||{};
        const RO=window.__SOREAL_IDLE_ROUE_V1__;
        /* Pendant que la roue tourne, TOUT l'affichage lié au tour (prix, totaux, historique, bouton) reste celui d'AVANT : le résultat n'apparaît qu'à l'arrêt de la roue. */
        const roueEnCours=Boolean(RO&&RO.enCours());
        const roueSt=roueEnCours&&RO.stAvant()?RO.stAvant():(roueReelle&&roueReelle.state||{});
        const roue={state:roueSt};
        const pitData=pitSt.data||{};
        const roueData=roueSt.data||{};
        const totalSpins=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(roueData.totalSpins||roueSt.level||0);
        const listePit=lignesMoneyPitIdleV1_(pit);
        const listeRoue=lignesRoueIdleV1_(roue);
        const historique=historiqueMoneyPitIdleV206_(pit,roue);
        const derniere=historique.find(function(x){return x.genre==='pit';})||null;
        const derniereRoue=historique.find(function(x){return x.genre==='roue';})||null;
        /*
         * Couleur du cadre du prix (Norman, 2026-10-07 : « le cadre doit changer de couleur à chaque récompense, sinon on ne remarque pas le changement entre la précédente et la nouvelle »).
         * Un compteur, gardé sur l'appareil, avance d'un cran chaque fois que la dernière récompense n'est plus celle qu'on avait vue ; la couleur est le rang du compteur (6 teintes qui se suivent).
         */
        /*
         * Norman (2026-10-21) : « les cadres ne changent plus de couleur, ça reste rouge ». Le compteur n'était gardé que dans le stockage de l'appareil (recopié sur le compte, parfois remis à une ancienne valeur par une réponse) :
         * il est maintenant AUSSI gardé en mémoire de page (la séquence ne recule jamais pendant la session) et, pour la roue, la couleur suit directement le nombre total de tours (aucun stockage, aucune course possible).
         */
        const rangCouleurPrix_=function(d,stockage,total){
          let rang=0;
          if(total!=null&&total>0)return ((Math.floor(total)%6)+6)%6;
          try{
            const cle=d?(String(d.at)+'|'+String(d.prize)):'';
            if(cle){
              const memo=rangCouleurMemoIdleV1[stockage];
              let brut=null;
              try{brut=JSON.parse(localStorage.getItem(stockage)||'null');}catch(_e2){brut=null;}
              if(memo&&(!brut||typeof brut!=='object'||memo.n>(Number(brut.n)||0)||(memo.cle===cle&&memo.n>=(Number(brut.n)||0))))brut=memo;
              let n=0;
              if(brut&&typeof brut==='object'){n=brut.cle===cle?(Number(brut.n)||0):(Number(brut.n)||0)+1;}
              if(!brut||brut.cle!==cle){
                rangCouleurMemoIdleV1[stockage]={cle:cle,n:n};
                try{localStorage.setItem(stockage,JSON.stringify({cle:cle,n:n}));}catch(_e3){}
              }
              rang=((n%6)+6)%6;
            }
          }catch(_e){}
          return rang;
        };
        /* Un « Ton prix » sous CHAQUE bouton (Norman, 2026-10-16) : le dernier gain du Money Pit sous « Balance ton argent », le dernier de la roue sous la roue, chacun avec son propre compteur de couleur. */
        const couleurPrix=rangCouleurPrix_(derniere,'soreal_idle_prix_couleur_v1');
        const couleurPrixRoue=rangCouleurPrix_(derniereRoue,'soreal_idle_prix_couleur_roue_v1',totalSpins);
        if(RO)RO.memoPrix(derniereRoue,totalSpins);
        const H0=window.__SOREAL_IDLE_META_HOST_V130__;
        const prixPit='<div class="soreal-idle-offre-v1 mp2-prix-v1">'+
            '<div class="soreal-idle-offre-titre-v1">🎁 TON PRIX</div>'+
            '<div class="soreal-idle-prize-v206" data-couleur="'+couleurPrix+'">'+
              (derniere
                ?(derniere.entree
                  ?H0.idleHtml_(phraseMoneyPitIdleV1_(derniere.entree,j))+
                    '<span class="soreal-idle-prize-detail-v1">'+H0.idleHtml_(derniere.prize)+'</span>'
                  :H0.idleHtml_(derniere.prize))
                :'Aucun prix obtenu pour l’instant.')+
            '</div>'+
          '</div>';
        const prixRoue='<div class="soreal-idle-offre-v1 mp2-prix-v1">'+
            '<div class="soreal-idle-offre-titre-v1">🎁 TON PRIX</div>'+
            '<div class="soreal-idle-prize-v206" data-couleur="'+couleurPrixRoue+'">'+
              (derniereRoue?'<span class="soreal-idle-prize-detail-v1">'+H0.idleHtml_(derniereRoue.prize)+'</span>':'Aucun prix obtenu pour l’instant.')+
            '</div>'+
          '</div>';

        const boutonRoue=roueEnCours?'<button type="button" class="rb-bouton" disabled>Ça tourne…</button>':rendreBoutonDailySpinIdleV203_(roueSt);
        return ''+
          window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_(
            '🕳️ Money Pit & 🎡 Roue journalière',
            'Balance tout ton Or durement gagné dedans.'
          )+
          bandeauMoneyPitIdleV1_(pitData)+
          bandeauRoueIdleV1_(roueData)+
          '<style>'+
            '.soreal-idle-money-scene-v206{position:relative;max-width:760px;margin:0 auto 14px;overflow:hidden;border-radius:18px;border:2px solid #26344d;background:#102e16;box-shadow:0 15px 40px rgba(0,0,0,.3)}'+
            /* Norman (2026-10-02) : l'image du trou était coupée à gauche et à droite (carré forcé + cover) : elle s'affiche maintenant en entier, à ses proportions. */
            /* Norman (2026-10-08) : « l'image du trou sans fond sur PC est beaucoup trop grande » : même image entière et centrée, mais jamais plus haute que 340 px (ni que 40 % de l'écran). */
            '.soreal-idle-money-scene-v206>img{display:block;width:auto;height:auto;max-width:100%;max-height:min(40vh,340px);margin:0 auto;object-fit:contain}'+
            '.soreal-idle-money-actions-v206{display:flex;gap:8px;max-width:760px;margin:0 auto 14px}'+
            '.soreal-idle-money-action-v206{flex:1 1 0;min-width:0;box-sizing:border-box;background:rgba(12,18,31,.92);border:2px solid rgba(255,255,255,.5);border-radius:12px;padding:8px;box-shadow:0 8px 22px rgba(0,0,0,.28);text-align:center}'+
            '.soreal-idle-money-action-v206 .soreal-idle-expand-button-v25{width:100%;margin:4px 0 0!important}'+
            '.soreal-idle-money-action-title-v206{font-size:15px;font-weight:950;color:#fff;text-shadow:0 1px 3px #000}'+
            '.soreal-idle-money-action-note-v206{font-size:12px;color:#d5e1f5;margin-top:2px}'+
            /* Norman (2026-10-03) : « Ton prix » était plus large que les autres cadres sur PC : même largeur maximale que la scène, les boutons et les cadres de récompenses. */
            '.soreal-idle-money-scene-v206~.soreal-idle-offre-v1{max-width:760px;margin:0 auto 14px;box-sizing:border-box}'+
            '.soreal-idle-prize-v206{padding:12px;border-radius:12px;background:#f4c83b;color:#19160b;border:2px solid #9c7b12;text-align:center;font-weight:950;font-size:14px}'+
            '.soreal-idle-reward-table-v206{width:100%;border-collapse:collapse;font-size:13px}.soreal-idle-reward-table-v206 th,.soreal-idle-reward-table-v206 td{padding:7px;border:1px solid rgba(132,145,175,.28);text-align:left}.soreal-idle-reward-table-v206 th{background:rgba(97,112,147,.14)}'+
            '@media(max-width:620px){.soreal-idle-money-action-title-v206{font-size:14px}.soreal-idle-money-action-note-v206{font-size:11px}}'+
            '.mp-cadre-v1{max-width:760px;margin:0 auto 12px;border-radius:14px;border:2px solid rgba(255,255,255,.28);background:rgba(12,18,31,.92);overflow:hidden}'+
            '.mp-cadre-v1>summary{cursor:pointer;padding:11px 14px;font-weight:950;font-size:15px;color:#fff;text-shadow:0 1px 3px #000;list-style:none;display:flex;gap:8px;align-items:center}'+
            '.mp-cadre-v1>summary::-webkit-details-marker{display:none}'+
            '.mp-cadre-v1>summary::after{content:"▾";margin-left:auto;transition:transform .2s}'+
            '.mp-cadre-v1:not([open])>summary::after{transform:rotate(-90deg)}'+
            '.mp-compte-v1{font-weight:700;opacity:.75;font-size:13px}'+
            '.mp-corps-v1{padding:0 12px 12px}'+
            '.mp-cadre-v1 .soreal-idle-reward-table-v206 th,.mp-cadre-v1 .soreal-idle-reward-table-v206 td{color:#eef3ff}'+
            '.mp-pager-v1{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px;font-size:13px;color:#d5e1f5}'+
            '.mp-pager-v1 button{padding:6px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.4);background:#253957;color:#fff;font-weight:800}'+
            '.mp-pager-v1 button:disabled{opacity:.4}'+
          '</style>'+
          /* Mise en page (Norman, 2026-10-10 : « beaucoup plus jolie », image entière et grande) : sur PC l'image à gauche, les actions et « Ton prix » à droite ; sur téléphone tout s'empile (CSS : soreal-idle-itopod.css, « Money Pit v2 »). */
          /* Deux colonnes indépendantes sur PC (Norman, 2026-10-31 : « équilibrer les deux colonnes, combler les espaces vides ») : à gauche le trou (image, menu, tableau de ses récompenses), à droite la roue (image, menu, tableau) ; chaque colonne se remplit vers le bas sans laisser de vide. Téléphone : les colonnes disparaissent (display:contents) et l'ordre d'avant est rétabli par la propriété order (CSS). */
          '<div class="mp2-grille-v1">'+
          '<div class="mp-col-v1 mp-col-trou-v1">'+
          '<div class="soreal-idle-money-scene-v206">'+
            /* Image refaite par Norman (2026-10-31), fichier statique du dépôt (donc dans le paquet hors ligne) ; l'ancienne Money_Pit.jpg reste sur le serveur, plus utilisée ici. Calques : titre, yeux, puanteur, salve d'or (soreal-idle-itopod.css, « Trou sans fond »). */
            '<img id="sorealIdleMoneyPitImageV209" src="/trou/trou-sans-fond-v1.webp" width="1000" height="1000" alt="Trou sans fond">'+
            calquesTrouSansFondIdleV1_()+
          '</div>'+
          /* 2026-09-26 (Norman) : les deux boutons sous l'image, chacun sur la moitié de sa largeur. */
          '<div class="soreal-idle-money-actions-v206">'+
            '<div class="soreal-idle-money-action-v206 soreal-idle-money-pit-action-v206">'+
              '<div class="soreal-idle-money-action-title-v206">Balance ton argent</div>'+
              '<div class="soreal-idle-money-action-note-v206">Le trou prend tout ton Or actuel.</div>'+
              rendreBoutonMoneyPitIdleV1_(j,pitSt)+
              prixPit+
            '</div>'+
          '</div>'+
          cadreRecompensesMoneyPitIdleV1_('pit','🕳️ RÉCOMPENSES DU MONEY PIT',listePit,'Palier','Le tableau se remplira dès ton premier lancer dans le trou.')+
          '</div>'+
          '<div class="mp-col-v1 mp-col-roue-v1">'+
          /* Roue journalière (Norman, 2026-10-31) : image de la roue (colonne de droite), puis son titre, TON PRIX et le compte à rebours, puis son tableau de récompenses. */
          (RO?RO.rendreCarte(roueSt,j,boutonRoue):'')+
          '<div class="rb-prixcol"><div class="soreal-idle-money-action-v206 soreal-idle-money-spin-action-v206">'+
            '<div class="soreal-idle-money-action-title-v206">Roue journalière !</div>'+
            '<div class="soreal-idle-money-action-note-v206">Une fois par jour. Chaque part de la roue est une récompense possible : sa largeur suit sa chance.</div>'+
            prixRoue+
            '<div class="rb-prix-txt">Tours effectués : <b>'+totalSpins+'</b>.</div>'+
          '</div></div>'+
          cadreRecompensesMoneyPitIdleV1_('roue','🎡 RÉCOMPENSES DE LA ROUE',listeRoue,'Tier','Le tableau se remplira dès ton premier tour de roue.')+
          '</div>'+
          '</div>'+
          /* Norman (2026-10-03) : « Ton prix » juste sous les boutons, puis le bonus des jours cumulés (avec son total d'AP), puis un cadre par liste de récompenses. */
          /* Norman (2026-10-10) : les récompenses du Money Pit et de la roue passent au-dessus, le calendrier de connexion en bas de page. */
          rendreCalendrierConnexionIdleV1_(j);
      }

  /*
   * Calques du Trou sans fond (positions en % de l'image carrée, repérées sur le dessin : le noir du trou va d'environ x 29-56 %, y 43-66 %).
   * Tout est dans le HTML de la page (le redessin le laisse intact) SAUF la salve d'or, posée seulement par window.__jeterOrSalveV1__ (data-morph-garder).
   * Titre et phrase : la clé du titre porte un espace de largeur nulle pour avoir sa propre ligne du dictionnaire anglais (« Trou sans fond » seul = « Money Pit », nom du menu).
   */
  function calquesTrouSansFondIdleV1_(){
    /* trois paires d'yeux : [x, y, période (s), décalage (s)] ; l'écart entre les deux points est fixe */
    const yeux=[[36.8,58.2,3.1,.8],[47.4,56.4,2.3,1.9],[51.2,61.6,3.9,3.1]].map(function(p){
      return '<span class="mp3-yeux" style="left:'+p[0]+'%;top:'+p[1]+'%;--p:'+p[2]+'s;--d:'+p[3]+'s"><i></i><i></i></span>';
    }).join('');
    /* 5 volutes fines : [x, couleur, durée, décalage, amplitude du balancement en cqw] */
    const volutes=[[34.5,'#d9c52e',9.4,0,.9],[41,'#8fd04a',11.2,-3.6,1.2],[47,'#e6cf3a',8.6,-6.1,.8],[53.5,'#7cc43e',10.4,-1.9,1.1],[59.5,'#cfc02c',12,-8.3,1]].map(function(v){
      return '<span class="mp3-volute" style="left:'+v[0]+'%;--dur:'+v[2]+'s;--del:'+v[3]+'s;--sx:'+v[4]+'cqw"><svg viewBox="0 0 40 170" aria-hidden="true"><path d="M20 168 Q6 148 20 128 Q34 108 20 88 Q6 68 20 48 Q34 28 20 4" fill="none" stroke="'+v[1]+'" stroke-width="4" stroke-linecap="round"/></svg></span>';
    }).join('');
    return '<div class="mp3-calques" aria-hidden="false" data-morph-classes-gardees="^mp3-vu$">'+
      volutes+yeux+
      '<div class="mp3-titre"><div class="mp3-titre-nom">Trou sans fond​</div><div class="mp3-titre-phrase">(Lance tout l’or gagné à la sueur de ton front dedans !)</div></div>'+
    '</div>';
  }

  /* Salve d'or : SEULEMENT quand le joueur jette son or (meta-progression-v130.js, après la réponse du moteur à l'action moneyPit) ; n pièces, de 1 à 14. */
  let compteurPiecesIdleV1_=0;
  function faceDePieceIdleV1_(){
    const u='mpc'+(++compteurPiecesIdleV1_);
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="'+u+'a" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#fff6c4"/><stop offset=".4" stop-color="#f6c540"/><stop offset=".8" stop-color="#c88a10"/><stop offset="1" stop-color="#8a5a06"/></radialGradient><linearGradient id="'+u+'b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe58a"/><stop offset="1" stop-color="#8a5a06"/></linearGradient></defs>'+
      '<circle cx="50" cy="50" r="49" fill="#6a4306"/><circle cx="50" cy="50" r="46" fill="url(#'+u+'a)"/><circle cx="50" cy="50" r="46" fill="none" stroke="url(#'+u+'b)" stroke-width="6"/>'+
      '<circle cx="50" cy="50" r="33" fill="none" stroke="#8a5a06" stroke-width="3"/><circle cx="50" cy="50" r="30.5" fill="none" stroke="#fff3b0" stroke-width="1.4" opacity=".7"/>'+
      '<path d="M50 29 L61 50 L50 71 L39 50Z" fill="#b87a10" stroke="#6a4306" stroke-width="2"/><path d="M50 29 L61 50 L50 50Z" fill="#fff3b0" opacity=".55"/>'+
      '<path d="M18 36 A36 36 0 0 1 44 15" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/></svg>';
  }
  function pieceDeOrIdleV1_(p,dl){
    let tr='';
    for(let k=-3;k<=3;k++)tr+='<i class="mp3-tr" style="transform:translateZ(calc(var(--t)*'+(k*0.012)+'))"></i>';
    const st='--x1:'+p.x+'%;--y1:'+p.y+'%;--d:'+p.d+'s;--dl:'+dl+'s;--dx:'+p.dx+'cqw;--t:'+p.t+'cqw;--tours:'+p.tours+';--rx:'+p.rx+'deg;--inc:'+p.inc+'deg;';
    const face=faceDePieceIdleV1_();
    return '<div class="mp3-chute'+(p.dehors?' mp3-dehors':'')+'" style="'+st+'"><div class="mp3-derive"><div class="mp3-echelle" style="perspective:90cqw"><div class="mp3-pc">'+tr+'<div class="mp3-fa">'+face+'</div><div class="mp3-fb">'+faceDePieceIdleV1_()+'</div></div></div></div></div>'+
      (p.dehors?'':'<div class="mp3-eclat" style="'+st+'"><svg viewBox="-20 -20 40 40"><g fill="#fff3b0"><path d="M0 -16 L2.5 -2.5 L16 0 L-2.5 2.5 L0 16 L-2.5 2.5 L-16 0 L-2.5 -2.5Z"/><circle r="5" fill="#ffd24a" opacity=".6"/></g></svg></div>');
  }
  /* Les yeux n'apparaissent qu'à partir du moment où l'image est À L'ÉCRAN (Norman, 2026-10-31) : un observateur pose la classe mp3-vu quand 60 % de l'image sont visibles ; les yeux (en pause avant) apparaissent alors l'un après l'autre. La classe est gardée par le morph (data-morph-classes-gardees). */
  const vusIdleV1_=new WeakSet();
  function surveillerYeuxIdleV1_(){
    document.querySelectorAll('.mp3-calques:not(.mp3-vu)').forEach(function(c){
      if(vusIdleV1_.has(c))return;
      vusIdleV1_.add(c);
      if(typeof IntersectionObserver!=='function'){c.classList.add('mp3-vu');return;}
      const o=new IntersectionObserver(function(es){
        if(es.some(function(e){return e.isIntersecting;})){c.classList.add('mp3-vu');o.disconnect();}
      },{threshold:.6});
      o.observe(c);
    });
  }
  try{new MutationObserver(surveillerYeuxIdleV1_).observe(document.body,{childList:true,subtree:true});}catch(_e){}
  window.__jeterOrSalveV1__=function(n){
    n=Math.max(1,Math.min(14,Math.round(Number(n))||8));
    const calques=document.querySelector('.mp3-calques');
    if(!calques)return;
    const r=function(k){return (Math.sin(k*91.7)+1)/2;};
    let h='';
    for(let i=0;i<n;i++){
      /* ~40 % des pièces passent le bord proche du trou (sa lèvre, y 60 à 66 % selon x) : le bord est au premier plan, elles disparaissent en le franchissant (calque coupé en CSS) ; les autres tombent dans le noir (y 50 à 56 %) en rapetissant et en s'effaçant */
      const dehors=r(i+11)<.4;
      const p={dehors:dehors,x:(36+r(i+1)*13).toFixed(1),y:(dehors?68+r(i+7)*4:50+r(i+7)*6).toFixed(1),dx:((r(i+3)-.5)*30).toFixed(1),t:(5.4+r(i+5)*2.2).toFixed(2),tours:2+Math.round(r(i+9)*3)/2,rx:(12+r(i+2)*34).toFixed(0),inc:((r(i+4)-.5)*50).toFixed(0),d:(1.0+((i*37)%5)*0.1).toFixed(2)};
      h+=pieceDeOrIdleV1_(p,(i/n*0.55).toFixed(2));
    }
    /* une salve à la fois : l'ancienne est remplacée (son bloc porte data-morph-garder : le redessin de la page ne le retire pas) */
    let c=calques.querySelector('.mp3-pieces');
    if(!c){c=document.createElement('div');c.className='mp3-pieces';c.setAttribute('data-morph-garder','');calques.appendChild(c);}
    c.innerHTML=h;
    clearTimeout(c.__fin);
    c.__fin=setTimeout(function(){if(c.parentNode)c.parentNode.removeChild(c);},2600);
  };

  window.__SOREAL_IDLE_MONEY_PIT_V1__={
    rendreBoutonMoneyPit:rendreBoutonMoneyPitIdleV1_,
    rendreBoutonDailySpin:rendreBoutonDailySpinIdleV203_,
    page:pageMoneyPitDailySpinIdleV206_
  };
})();
