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
        return '🎡 Prochain tour · '+(h>0?(h+'h '+m+'m'):(m>0?(m+'m'):(restantS+'s')));
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
       * Roue du Daily Spin (Norman, 2026-10-10 : « un effet de roue qui tourne ») : huit parts dessinées en CSS, repère fixe au-dessus. Prête, elle tourne doucement ; au clic elle fait un vrai tour de roue
       * (départ rapide, ralentissement long, arrêt sur une part au hasard), PUIS la demande part au serveur : le lot s'annonce quand la roue s'arrête. Sans animation (prefers-reduced-motion), la demande part tout de suite.
       */
      function roueDisponibleIdleV1_(st){
        const readyAt=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(st&&st.data&&st.data.readyAt);
        return readyAt-(typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now())<=0;
      }
      function rendreRoueIdleV1_(st){
        return '<div class="mp2-roue-cadre-v1" aria-hidden="true"><div class="mp2-roue-v1'+(roueDisponibleIdleV1_(st)?' mp2-roue-prete-v1':'')+'"></div></div>';
      }
      let roueEnCoursIdleV1=false;
      function lancerRoueIdleV1_(){
        if(roueEnCoursIdleV1)return;
        const roue=document.querySelector('.mp2-roue-v1');
        let reduit=false;
        try{reduit=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(_e){}
        if(!roue||reduit||typeof roue.animate!=='function'){collecterSystemeMetaIdleV130_('dailySpin');return;}
        roueEnCoursIdleV1=true;
        roue.classList.remove('mp2-roue-prete-v1');
        const bouton=document.querySelector('.mp2-spin-bouton-v1');
        if(bouton)bouton.disabled=true;
        let envoye=false;
        const envoyer=function(){
          if(envoye)return;
          envoye=true;
          roueEnCoursIdleV1=false;
          collecterSystemeMetaIdleV130_('dailySpin');
        };
        try{
          const angle=1800+Math.floor(Math.random()*8)*45+22.5;
          const anim=roue.animate([{transform:'rotate(0deg)'},{transform:'rotate('+angle+'deg)'}],{duration:2800,easing:'cubic-bezier(.08,.7,.12,1)',fill:'forwards'});
          /* son du cliquet calé sur la roue (un tic par part, aux instants réels), puis plus de son à la réponse du serveur */
          try{if(window.__SOREAL_IDLE_AUDIO_V199__&&typeof window.__SOREAL_IDLE_AUDIO_V199__.roueTourne==='function'){window.__roueSonneeIdleV1__=true;window.__SOREAL_IDLE_AUDIO_V199__.roueTourne(angle,2800);}}catch(_e){}
          anim.onfinish=function(){setTimeout(envoyer,350);};
          setTimeout(envoyer,4000);
        }catch(_e){envoyer();}
      }
      window.__lancerRoueIdleV1__=lancerRoueIdleV1_;

      function rendreBoutonDailySpinIdleV203_(st){
        const readyAt=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(st&&st.data&&st.data.readyAt);
        const restantMs=readyAt-(typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now());
        if(restantMs>0){
          const restantS=Math.ceil(restantMs/1000);
          demarrerMinuteurRechargeIdleV1_();
          return '<button type="button" class="soreal-idle-expand-button-v25" disabled data-idle-recharge-v1="spin" data-fin="'+readyAt+'">'+libelleRechargeDailySpinIdleV1_(restantS)+'</button>';
        }
        return '<button type="button" class="soreal-idle-expand-button-v25 glow-dispo-v1 mp2-spin-bouton-v1" onclick="window.__lancerRoueIdleV1__()">🎡 Fais-moi tourner, bébé !</button>';
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
          const NOMS={energyPotionAlpha:'Potion Energy α',energyPotionBeta:'Potion Energy β',energyPotionDelta:'Potion Energy δ',magicPotionAlpha:'Potion Magic α',magicPotionBeta:'Potion Magic β',magicPotionDelta:'Potion Magic δ',luckyCharm:'Lucky Charm',superLuckyCharm:'Super Lucky Charm',energyBarBar:'Energy Bar Bar',magicBarBar:'Magic Bar Bar',littleBluePill1000:'× 1000 Little Blue Pill',poop:'crottin (sans effet)',beastButter:'Beast Butter (sans effet)',macguffinMuffin:'MacGuffin Muffin (sans effet)'};
          Object.keys(reward.items).forEach(function(id){morceaux.push(reward.items[id]+' × '+(NOMS[id]||id));});
        }
        return morceaux.length?morceaux.join(' · '):'Récompense mystérieuse';
      }


      function tierDailySpinIdleV206_(totalSpins){
        const n=Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(totalSpins));
        const seuils=[0,7,14,30,60,120,180,365];
        let tier=0;
        seuils.forEach(function(seuil,index){
          if(n>=seuil)tier=index;
        });
        return tier;
      }


      function recompensesDailySpinTierIdleV206_(tier){
        const tables=[
          ['50 AP · 70 %','100 AP · 30 %'],
          ['100 AP · 53 %','200 AP · 35 %','1 000 AP · 10 %'],
          ['200 AP · 53 %','400 AP · 30 %','2 000 AP · 10 %'],
          ['300 AP · 37 %','600 AP · 25 %','3 000 AP · 10 %','20 graines · 10 %','50 000 AP · 0,5 %'],
          ['500 AP · 50 %','1 000 AP · 25 %','5 000 AP · 10 %','100 graines · 5 %','75 000 AP · 0,5 %'],
          ['800 AP · 36 %','1 600 AP · 25 %','8 000 AP · 10 %','400 graines · 10 %','100 000 AP · 0,5 %'],
          ['1 200 AP · 35 %','2 400 AP · 25 %','12 000 AP · 10 %','2 000 graines · 10 %','150 000 AP · 0,5 %'],
          ['1 500 AP · 35 %','3 000 AP · 25 %','15 000 AP · 10 %','5 000 graines · 10 %','175 000 AP · 0,5 %']
        ];
        return tables[Math.max(0,Math.min(tables.length-1,window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(tier)))]||tables[0];
      }


      /*
       * Phrases du Trou (Norman, 2026-09-26 : « les petites phrases humoristiques, traduites en français »). Le wiki NGU ne publie que trois messages du
       * Puits : le boost (« The Pit belches and spits out a Toughness Boost 1! », donné par Norman), « The Pit belches and it smells awful » (Wandoos déjà au
       * maximum) et la graine avant Yggdrasil (« A giant green seed shoots out of the pit and lands by your feet! Before you can grab it, it hops back into
       * the pit! WTF was that?? ») : ceux-là sont traduits fidèlement. Les autres phrases sont écrites par SOREAL dans le même ton (une par récompense).
       * Le choix entre deux variantes est fixé par l'heure du jet (la même phrase à chaque affichage).
       */
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
        const roue=systemeMetaParIdIdleV130_(j,'dailySpin');
        const pitSt=pit&&pit.state||{};
        const roueSt=roue&&roue.state||{};
        const pitData=pitSt.data||{};
        const roueData=roueSt.data||{};
        const totalSpins=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(roueData.totalSpins||roueSt.level||0);
        const tier=tierDailySpinIdleV206_(totalSpins);
        const table=recompensesDailySpinTierIdleV206_(tier);
        const listePit=lignesMoneyPitIdleV1_(pit);
        const listeRoue=lignesRoueIdleV1_(roue);
        const historique=historiqueMoneyPitIdleV206_(pit,roue);
        const derniere=historique.find(function(x){return x.genre==='pit';})||null;
        const derniereRoue=historique.find(function(x){return x.genre==='roue';})||null;
        /*
         * Couleur du cadre du prix (Norman, 2026-10-07 : « le cadre doit changer de couleur à chaque récompense, sinon on ne remarque pas le changement entre la précédente et la nouvelle »).
         * Un compteur, gardé sur l'appareil, avance d'un cran chaque fois que la dernière récompense n'est plus celle qu'on avait vue ; la couleur est le rang du compteur (6 teintes qui se suivent).
         */
        const rangCouleurPrix_=function(d,stockage){
          let rang=0;
          try{
            const cle=d?(String(d.at)+'|'+String(d.prize)):'';
            if(cle){
              const brut=JSON.parse(localStorage.getItem(stockage)||'null');
              let n=0;
              if(brut&&typeof brut==='object'){n=brut.cle===cle?(Number(brut.n)||0):(Number(brut.n)||0)+1;}
              if(!brut||brut.cle!==cle)localStorage.setItem(stockage,JSON.stringify({cle:cle,n:n}));
              rang=((n%6)+6)%6;
            }
          }catch(_e){}
          return rang;
        };
        /* Un « Ton prix » sous CHAQUE bouton (Norman, 2026-10-16) : le dernier gain du Money Pit sous « Balance ton argent », le dernier de la roue sous la roue, chacun avec son propre compteur de couleur. */
        const couleurPrix=rangCouleurPrix_(derniere,'soreal_idle_prix_couleur_v1');
        const couleurPrixRoue=rangCouleurPrix_(derniereRoue,'soreal_idle_prix_couleur_roue_v1');
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

        return ''+
          window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_(
            '🕳️ Money Pit & 🎡 Roue journalière',
            'Balance tout ton Or durement gagné dedans.'
          )+
          bandeauMoneyPitIdleV1_(pitData)+
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
          '<div class="mp2-grille-v1">'+
          '<div class="soreal-idle-money-scene-v206">'+
            '<img id="sorealIdleMoneyPitImageV209" src="/api/idle/media/banner?name=Money_Pit.jpg" alt="Money Pit et Roue journalière">'+
          '</div>'+
          /* 2026-09-26 (Norman) : les deux boutons sous l'image, chacun sur la moitié de sa largeur. */
          '<div class="soreal-idle-money-actions-v206">'+
            '<div class="soreal-idle-money-action-v206 soreal-idle-money-pit-action-v206">'+
              '<div class="soreal-idle-money-action-title-v206">Balance ton argent</div>'+
              '<div class="soreal-idle-money-action-note-v206">Le trou prend tout ton Or actuel.</div>'+
              rendreBoutonMoneyPitIdleV1_(j,pitSt)+
              prixPit+
            '</div>'+
            '<div class="soreal-idle-money-action-v206 soreal-idle-money-spin-action-v206">'+
              '<div class="mp2-spin-tete-v1">'+
                rendreRoueIdleV1_(roueSt)+
                '<div><div class="soreal-idle-money-action-title-v206">Roue journalière !</div>'+
                '<div class="soreal-idle-money-action-note-v206">Bon, ça ne « tourne » pas vraiment, mais c’est aléatoire !</div></div>'+
              '</div>'+
              rendreBoutonDailySpinIdleV203_(roueSt)+
              prixRoue+
            '</div>'+
          '</div>'+
          '</div>'+
          /* Norman (2026-10-03) : « Ton prix » juste sous les boutons, puis le bonus des jours cumulés (avec son total d'AP), puis un cadre par liste de récompenses. */
          /* Norman (2026-10-10) : les récompenses du Money Pit et de la roue passent au-dessus, le calendrier de connexion en bas de page. */
          cadreRecompensesMoneyPitIdleV1_('pit','🕳️ RÉCOMPENSES DU MONEY PIT',listePit,'Palier','Le tableau se remplira dès ton premier lancer dans le trou.')+
          cadreRecompensesMoneyPitIdleV1_('roue','🎡 RÉCOMPENSES DE LA ROUE',listeRoue,'Tier','Le tableau se remplira dès ton premier tour de roue.')+
          '<div class="soreal-idle-section-v8">'+
            '<div class="soreal-idle-window-title-v31">🎡 TABLE DES RÉCOMPENSES · TIER '+tier+'</div>'+
            '<div style="font-size:13px;color:#8b93ab;margin-bottom:8px">Tours effectués : <b>'+totalSpins+'</b>.</div>'+
            '<table class="soreal-idle-reward-table-v206"><tbody>'+
              table.map(function(x){return '<tr><td>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(x)+'</td></tr>';}).join('')+
            '</tbody></table>'+
          '</div>'+
          rendreCalendrierConnexionIdleV1_(j);
      }

  window.__SOREAL_IDLE_MONEY_PIT_V1__={
    rendreBoutonMoneyPit:rendreBoutonMoneyPitIdleV1_,
    rendreBoutonDailySpin:rendreBoutonDailySpinIdleV203_,
    page:pageMoneyPitDailySpinIdleV206_
  };
})();
