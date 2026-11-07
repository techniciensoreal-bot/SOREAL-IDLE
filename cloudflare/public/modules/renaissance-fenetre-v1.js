/*
 * SOREAL IDLE — la carte de la fenêtre de Renaissance (Norman, 2026-11-07 : « plus belle, texturée, magique », horloge qui tourne à l'envers).
 * Sortie de ui-aventure-1-v1.js (audit d'architecture : fichier ≤ 2 700 lignes). window.__SOREAL_IDLE_RENAISSANCE_FENETRE_V1__.carte({gain,actuel,rapport,refermes,fmt}) injecte la feuille (une seule fois) et renvoie le HTML de la carte ;
 * l'ouverture, la fermeture et le voyage dans le temps restent dans ui-aventure-1-v1.js / ui-renaissance-v1.js.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_RENAISSANCE_FENETRE_V1__)return;
  function carte(p){
    const gain=p.gain,actuel=p.actuel,rapport=p.rapport,refermes=p.refermes||[];
    const formatGrandNombreIdleV70_=p.fmt;
    if(!document.getElementById('sorealIdleRenaissanceStyleV2')){
      const st=document.createElement('style');
      st.id='sorealIdleRenaissanceStyleV2';
      st.textContent="/* Fenêtre de Renaissance « magique » (Norman, 2026-11-07 : « texture la fenêtre, rends-la magique »). Boucles parfaites (règle n°3) : rotations de 360°, motes qui apparaissent, montent dans un seul sens et s'effacent, respirations 0 % = 100 %. */\n.rn-card{--or:#e8c878;--or2:#a9803a;width:min(470px,94vw);max-height:calc(100dvh - 36px);display:flex;flex-direction:column;overflow:hidden;border-radius:26px;position:relative;isolation:isolate;\n  background:\n    radial-gradient(90% 46% at 50% 0%,rgba(168,120,255,.46),transparent 70%),\n    radial-gradient(70% 40% at 50% 100%,rgba(70,60,170,.45),transparent 70%),\n    url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n' x='0' y='0' width='100%25' height='100%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .86 0 0 0 0 .78 0 0 0 0 1 0 0 0 .55 -.12'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E\"),\n    linear-gradient(180deg,#241d4a,#141230 55%,#0e1126);\n  background-blend-mode:normal,normal,soft-light,normal;\n  border:1px solid rgba(232,200,120,.6);\n  box-shadow:0 0 0 1px rgba(0,0,0,.6),0 0 60px rgba(140,100,255,.35),0 34px 90px rgba(0,0,0,.7),inset 0 0 40px rgba(120,90,220,.22),inset 0 1px 0 rgba(255,255,255,.12)}\n.rn-card::before{content:\"\";position:absolute;inset:7px;border-radius:20px;border:1px solid rgba(232,200,120,.3);pointer-events:none;z-index:3;box-shadow:inset 0 0 22px rgba(168,120,255,.16)}\n.rn-coin{position:absolute;width:30px;height:30px;z-index:4;pointer-events:none;background:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30' fill='none' stroke='%23e8c878' stroke-width='1.4' stroke-linecap='round'%3E%3Cpath d='M3 27V9C3 5.7 5.7 3 9 3h18'/%3E%3Cpath d='M8 27V13c0-2.8 2.2-5 5-5h14' stroke-opacity='.55'/%3E%3Ccircle cx='3' cy='3' r='2' fill='%23e8c878' stroke='none'/%3E%3Cpath d='M13 13l3 3' stroke-opacity='.8'/%3E%3C/svg%3E\") no-repeat center/contain;filter:drop-shadow(0 0 4px rgba(232,200,120,.55))}\n.rn-coin.a{top:9px;left:9px}.rn-coin.b{top:9px;right:9px;transform:scaleX(-1)}.rn-coin.c{bottom:9px;left:9px;transform:scaleY(-1)}.rn-coin.d{bottom:9px;right:9px;transform:scale(-1,-1)}\n.rn-fond{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0;border-radius:inherit}\n.rn-mote{position:absolute;bottom:-8px;width:4px;height:4px;border-radius:50%;background:radial-gradient(circle,#fff,rgba(255,226,150,.9) 40%,rgba(255,200,90,0) 72%);box-shadow:0 0 8px 2px rgba(255,214,130,.6);opacity:0;animation:rnMote 7s linear infinite}\n.rn-mote.v{background:radial-gradient(circle,#fff,rgba(200,170,255,.9) 40%,rgba(160,120,255,0) 72%);box-shadow:0 0 8px 2px rgba(180,140,255,.65)}\n@keyframes rnMote{0%{opacity:0;transform:translate(0,0) scale(.6)}12%{opacity:.95}85%{opacity:.9}100%{opacity:0;transform:translate(var(--dx,12px),-560px) scale(1)}}\n.rn-haut{flex:0 0 auto;padding:26px 22px 4px;text-align:center;position:relative;z-index:2}\n.rn-cercle{position:absolute;left:50%;top:-34px;width:250px;height:250px;margin-left:-125px;pointer-events:none;z-index:0;opacity:.85;filter:drop-shadow(0 0 8px rgba(232,200,120,.4))}\n.rn-cercle svg{position:absolute;inset:0;width:100%;height:100%}\n.rn-c1{animation:rnTourne 46s linear infinite}.rn-c2{animation:rnTourne 30s linear infinite reverse}\n@keyframes rnTourne{from{transform:rotate(0)}to{transform:rotate(360deg)}}\n.rn-icone{position:relative;z-index:1;width:88px;height:88px;margin:10px auto 10px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 40% 30%,#3a2d6e,#150f33 70%);border:3px solid #e8c878;animation:rnRespire 3.4s ease-in-out infinite}\n.rn-icone svg{width:100%;height:100%;display:block}.rn-aig{transform-origin:50px 50px}.rn-aig-m{animation:rnRecule 2s linear infinite}.rn-aig-h{animation:rnRecule 24s linear infinite}@keyframes rnRecule{from{transform:rotate(0)}to{transform:rotate(-360deg)}}\n.rn-titre{position:relative;z-index:1;font-family:Bangers,'Russo One',system-ui,sans-serif;font-weight:400;font-size:34px;letter-spacing:2px;line-height:1;color:#fff4d2;text-shadow:0 2px 0 #5b3d8a,0 0 22px rgba(255,214,130,.55),0 0 2px #000}\n.rn-sous{position:relative;z-index:1;margin-top:6px;color:#cdbff5;font-size:13px;letter-spacing:.4px}\n.rn-ruban{position:relative;z-index:1;display:flex;align-items:center;gap:8px;margin:12px 26px 0;color:var(--or);font-size:10px}\n.rn-ruban::before,.rn-ruban::after{content:\"\";flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(232,200,120,.7))}.rn-ruban::after{transform:scaleX(-1)}\n.rn-force{position:relative;z-index:2;margin:12px 24px 4px;padding:15px 12px 12px;text-align:center;border-radius:18px;\n  background:radial-gradient(80% 90% at 50% 0%,rgba(255,214,130,.18),transparent 70%),linear-gradient(180deg,rgba(40,30,80,.85),rgba(18,14,44,.9));\n  border:1px solid rgba(232,200,120,.55);box-shadow:inset 0 0 26px rgba(255,214,130,.1),0 0 26px rgba(232,200,120,.14)}\n.rn-force-lib,.rn-force-fin{color:#d9d0f3;font-size:13px}\n.rn-force-val{margin:3px 0 2px;font-family:Bangers,'Russo One',system-ui,sans-serif;font-weight:400;letter-spacing:1.5px;font-size:52px;line-height:1.05;overflow-wrap:anywhere;\n  background:linear-gradient(180deg,#fff7d6 8%,#ffd36a 48%,#c98d2c 92%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 14px rgba(255,200,90,.5)) drop-shadow(0 2px 0 rgba(60,30,10,.6));animation:rnLueur 3.4s ease-in-out infinite}\n.rn-nombres{display:flex;justify-content:center;align-items:center;gap:8px;margin-top:10px;font-size:12px;color:#a9b4d6;flex-wrap:wrap}\n.rn-nombres b{color:#f0e8ff;font-size:13px;padding:1px 9px;border-radius:99px;background:rgba(120,90,220,.25);border:1px solid rgba(190,170,255,.3)}\n.rn-corps{position:relative;z-index:2;flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:10px 24px 6px;display:flex;flex-direction:column;gap:9px}\n.rn-bloc{--c:#8fb2ff;display:flex;gap:12px;align-items:center;padding:11px 13px;border-radius:15px;position:relative;\n  background:linear-gradient(90deg,color-mix(in srgb,var(--c) 16%,transparent),rgba(18,16,44,.78) 42%),rgba(18,16,44,.7);border:1px solid color-mix(in srgb,var(--c) 38%,transparent);box-shadow:inset 3px 0 0 var(--c),0 4px 14px rgba(0,0,0,.3)}\n.rn-bloc.vit{--c:#6fe39a}.rn-bloc.zero{--c:#ff9d7a}.rn-bloc.ferme{--c:#f0c8a0}.rn-bloc.garde{--c:#8fb2ff}\n.rn-ico{flex:0 0 40px;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 30%,color-mix(in srgb,var(--c) 38%,#1a1638),#120f2c);border:1px solid color-mix(in srgb,var(--c) 70%,transparent);box-shadow:0 0 14px color-mix(in srgb,var(--c) 40%,transparent)}\n.rn-ico svg{width:22px;height:22px}\n.rn-bloc-t{color:#fff1cf;font-size:14px;font-weight:900;letter-spacing:.3px}\n.rn-bloc-p{margin-top:2px;color:#bfc8e2;font-size:13px;line-height:1.5}\n.rn-menus{display:flex;flex-wrap:wrap;gap:5px;margin:5px 0 3px}\n.rn-menus span{padding:2px 10px;border-radius:99px;background:rgba(240,200,160,.12);color:#ffdcb0;font-size:12px;font-weight:800;border:1px solid rgba(240,200,160,.4)}\n.rn-actions{position:relative;z-index:2;flex:0 0 auto;display:grid;grid-template-columns:1fr 1.5fr;gap:11px;padding:14px 24px 24px}\n.rn-actions button{border-radius:15px;padding:15px 12px;font-size:16px;font-weight:1000;letter-spacing:.5px;cursor:pointer;transition:transform .12s}\n.rn-actions button:active{transform:scale(.97)}\n.rn-actions .cancel{background:rgba(40,36,76,.85);color:#cfd6ee;border:1px solid rgba(190,170,255,.25)}\n.rn-actions .confirm{border:1px solid rgba(255,236,170,.8);color:#2a1650;background:linear-gradient(180deg,#fff0b8,#e8c060 45%,#b98a30);text-shadow:0 1px 0 rgba(255,255,255,.5);box-shadow:0 0 22px rgba(232,200,120,.45),inset 0 1px 0 rgba(255,255,255,.7),0 8px 18px rgba(0,0,0,.4);animation:rnBouton 3.4s ease-in-out infinite}\n@keyframes rnRespire{0%,100%{box-shadow:0 0 0 5px rgba(232,200,120,.1),0 0 26px rgba(168,120,255,.55)}50%{box-shadow:0 0 0 9px rgba(232,200,120,.2),0 0 42px rgba(168,120,255,.85)}}\n@keyframes rnLueur{0%,100%{filter:drop-shadow(0 0 10px rgba(255,200,90,.35)) drop-shadow(0 2px 0 rgba(60,30,10,.6))}50%{filter:drop-shadow(0 0 22px rgba(255,200,90,.75)) drop-shadow(0 2px 0 rgba(60,30,10,.6))}}\n@keyframes rnBouton{0%,100%{box-shadow:0 0 14px rgba(232,200,120,.3),inset 0 1px 0 rgba(255,255,255,.7),0 8px 18px rgba(0,0,0,.4)}50%{box-shadow:0 0 30px rgba(232,200,120,.7),inset 0 1px 0 rgba(255,255,255,.7),0 8px 18px rgba(0,0,0,.4)}}\n@media (prefers-reduced-motion:reduce){.rn-icone,.rn-force-val,.rn-actions .confirm,.rn-c1,.rn-c2,.rn-aig-m,.rn-aig-h{animation:none}.rn-mote{display:none}}";
      document.head.appendChild(st);
    }

    const svg=function(d,c){return '<svg viewBox="0 0 24 24" fill="none" stroke="'+c+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';};
    const icones={
      renaitre:svg('<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v4.5h-4.5"/>','#fff'),
      vite:svg('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>','#7be3a0'),
      zero:svg('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>','#ff9d7a'),
      ferme:svg('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>','#f0c8a0'),
      garde:svg('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>','#8fb2ff')
    };

    let graduations='';for(let i=0;i<60;i++){const g=i%5===0;graduations+='<line x1="50" y1="'+(g?7:9)+'" x2="50" y2="'+(g?14:11.5)+'" stroke-width="'+(g?2.2:.9)+'" transform="rotate('+(i*6)+' 50 50)"/>';}
    const horloge=
      '<svg viewBox="0 0 100 100" aria-hidden="true">'+
        '<circle cx="50" cy="50" r="46" fill="none" stroke="#e8c878" stroke-opacity=".35" stroke-width="1"/>'+
        '<g stroke="#f3dc9a" stroke-linecap="round">'+graduations+'</g>'+
        '<g transform="rotate(305 50 50)"><g class="rn-aig rn-aig-h"><path d="M50 56 46.4 52 48 30 50 24 52 30 53.6 52z" fill="#f3dc9a" stroke="#1a1238" stroke-width=".8" stroke-linejoin="round"/></g></g>'+
        '<g transform="rotate(62 50 50)"><g class="rn-aig rn-aig-m"><path d="M50 60 48.2 54 49 17 50 12 51 17 51.8 54z" fill="#fff1c0" stroke="#1a1238" stroke-width=".7" stroke-linejoin="round"/></g></g>'+
        '<circle cx="50" cy="50" r="3.2" fill="#e8c878" stroke="#1a1238" stroke-width=".8"/><circle cx="50" cy="50" r="1.1" fill="#1a1238"/>'+
      '</svg>';
    const med=function(i){return '<div class="rn-ico">'+i+'</div>';};
    /* Décor : cercle arcanique (deux couronnes de rotation inverse), coins ouvragés, motes de lumière (positions fixes, rien de lu dans la page). */
    const anneau=function(r,n,p){let o='';for(let i=0;i<n;i++){const a=i*360/n;o+='<line x1="125" y1="'+(125-r)+'" x2="125" y2="'+(125-r+p)+'" transform="rotate('+a+' 125 125)"/>';}return o;};
    const cercle=
      '<div class="rn-cercle" aria-hidden="true">'+
        '<svg class="rn-c1" viewBox="0 0 250 250" fill="none" stroke="#e8c878" stroke-width="1.2" stroke-linecap="round">'+
          '<circle cx="125" cy="125" r="120" stroke-opacity=".7"/><circle cx="125" cy="125" r="112" stroke-opacity=".4" stroke-dasharray="2 5"/>'+
          anneau(120,48,6)+'<circle cx="125" cy="125" r="96" stroke-opacity=".5"/>'+
          '<path d="M125 29 208 173H42z M125 221 42 77H208z" stroke-opacity=".75" stroke-linejoin="round"/>'+
        '</svg>'+
        '<svg class="rn-c2" viewBox="0 0 250 250" fill="none" stroke="#c9b0ff" stroke-width="1.1" stroke-linecap="round">'+
          '<circle cx="125" cy="125" r="78" stroke-opacity=".6"/><circle cx="125" cy="125" r="70" stroke-opacity=".4" stroke-dasharray="1 4"/>'+
          anneau(78,24,5)+
          '<path d="M125 62 179.5 156 70.5 156z" stroke-opacity=".6" stroke-linejoin="round"/>'+
        '</svg>'+
      '</div>';
    const motes=[[8,0,10],[19,2.2,-14],[31,4.4,8],[43,1.1,-10],[55,5.6,14],[66,3.3,-8],[77,0.6,12],[88,4.9,-12],[14,5.2,9],[49,6.4,-9],[71,2.7,11],[92,1.6,-7]].map(function(m,i){return '<span class="rn-mote'+(i%3===0?' v':'')+'" style="left:'+m[0]+'%;animation-delay:-'+m[1]+'s;animation-duration:'+(6+(i%4))+'s;--dx:'+m[2]+'px"></span>';}).join('');

    let forceHtml;
    if(rapport>=1.01){
      forceHtml=
        '<div class="rn-force-lib">Si tu renais maintenant, tu seras</div>'+
        '<div class="rn-force-val">×'+formatGrandNombreIdleV70_(rapport,2)+'</div>'+
        '<div class="rn-force-fin">plus fort qu’aujourd’hui</div>';
    }else if(rapport>=0.99){
      forceHtml=
        '<div class="rn-force-lib">Si tu renais maintenant</div>'+
        '<div class="rn-force-val">=</div>'+
        '<div class="rn-force-fin">tu auras à peu près la même force qu’aujourd’hui</div>';
    }else{
      forceHtml=
        '<div class="rn-force-lib">Si tu renais maintenant, tu seras</div>'+
        '<div class="rn-force-val">×'+formatGrandNombreIdleV70_(rapport,2)+'</div>'+
        '<div class="rn-force-fin">moins fort qu’aujourd’hui : mieux vaut attendre un peu</div>';
    }

    const vitesse=rapport>=1.5
      ?'Les boss que tu viens de vaincre tomberont beaucoup plus vite, et à chaque renaissance tu iras plus loin dans le jeu.'
      :rapport>=1.01
        ?'Les boss que tu viens de vaincre tomberont un peu plus vite.'
        :'Pour battre les boss plus vite, renais quand ta force aura augmenté.';

    const blocFerme=refermes.length
      ?'<div class="rn-bloc ferme">'+med(icones.ferme)+'<div><div class="rn-bloc-t">Se referment pour l’instant</div>'+
          '<div class="rn-menus">'+refermes.map(function(m){return '<span>'+m[1]+'</span>';}).join('')+'</div>'+
          '<div class="rn-bloc-p">Ils se rouvrent dès que tu bats de nouveau leur boss.</div></div></div>'
      :'';


    return '<div class="rn-card" role="dialog" aria-modal="true" aria-label="Confirmer la Renaissance">'+
        '<div class="rn-fond" aria-hidden="true">'+motes+'</div>'+
        '<i class="rn-coin a"></i><i class="rn-coin b"></i><i class="rn-coin c"></i><i class="rn-coin d"></i>'+
        '<div class="rn-haut">'+cercle+
          '<div class="rn-icone">'+horloge+'</div>'+
          '<div class="rn-titre">Renaître ?</div>'+
          '<div class="rn-sous">Une nouvelle partie, en plus fort.</div>'+
          '<div class="rn-ruban" aria-hidden="true">✦</div>'+
        '</div>'+
        '<div class="rn-force">'+forceHtml+
          '<div class="rn-nombres"><span>Aujourd’hui</span><b>'+formatGrandNombreIdleV70_(actuel,2)+'</b><span>→ après</span><b>'+formatGrandNombreIdleV70_(gain,2)+'</b></div>'+
        '</div>'+
        '<div class="rn-corps">'+
          '<div class="rn-bloc vit">'+med(icones.vite)+'<div><div class="rn-bloc-t">Plus rapide</div><div class="rn-bloc-p">'+vitesse+'</div></div></div>'+
          '<div class="rn-bloc zero">'+med(icones.zero)+'<div><div class="rn-bloc-t">Tu repars de zéro</div><div class="rn-bloc-p">Or, énergie, magie, boss de la partie et Entraînement de base reviennent à zéro.</div></div></div>'+
          blocFerme+
          '<div class="rn-bloc garde">'+med(icones.garde)+'<div><div class="rn-bloc-t">Tu gardes le reste</div><div class="rn-bloc-p">Inventaire, équipement, collection, progression d’Aventure et toutes tes améliorations permanentes.</div></div></div>'+
        '</div>'+
        '<div class="rn-actions">'+
          '<button type="button" class="cancel" onclick="window.__fermerPopupRenaissanceIdleV63__()">Annuler</button>'+
          '<button type="button" class="confirm" onclick="window.__executerRenaissanceIdleV63__()">Renaître</button>'+
        '</div>'+
      '</div>';
  }
  window.__SOREAL_IDLE_RENAISSANCE_FENETRE_V1__={carte:carte};
})();
