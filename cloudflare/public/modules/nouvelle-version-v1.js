/*
 * Nouvelle version disponible (Norman, 2026-10-01) : un joueur resté sur une ancienne version du jeu voit une bannière l'invitant à
 * rafraîchir la page. Détection sans toucher au serveur : toutes les 3 minutes (et au retour sur l'onglet), on relit /index.html sans cache
 * et on compare les fichiers versionnés (?v=…) avec ceux que cette page a chargés. Jamais de rechargement automatique : le joueur choisit
 * le bon moment (sa progression est de toute façon sauvegardée côté serveur).
 */
(function(){
  'use strict';

  const INTERVALLE_MS=3*60*1000;
  const ATTENTE_MIN_MS=30*1000;
  let derniereVerif=0;
  let affichee=false;

  function signature(liste){
    return liste.filter(function(u){return /[?&]v=/.test(u);}).sort().join('|');
  }

  function signatureCourante(){
    const urls=[];
    document.querySelectorAll('script[src],link[rel="stylesheet"][href]').forEach(function(n){
      urls.push(n.getAttribute('src')||n.getAttribute('href')||'');
    });
    return signature(urls);
  }

  function signatureDuTexte(html){
    const urls=[];
    const re=/<(?:script|link)\b[^>]*?(?:src|href)="([^"]+)"/gi;
    let m;
    while((m=re.exec(html)))urls.push(m[1]);
    return signature(urls);
  }

  function css(){
    if(document.getElementById('sorealIdleNouvelleVersionStyleV1'))return;
    const st=document.createElement('style');
    st.id='sorealIdleNouvelleVersionStyleV1';
    st.textContent=
      '#sorealIdleNouvelleVersionV1{position:fixed;top:0;left:0;right:0;z-index:60;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;'+
        'padding:calc(8px + env(safe-area-inset-top,0)) 12px 8px;background:linear-gradient(90deg,#f59e0b,#ef4444);color:#fff;font:800 13px/1.3 inherit;'+
        'text-align:center;box-shadow:0 6px 18px rgba(0,0,0,.45)}'+
      '#sorealIdleNouvelleVersionV1 button{cursor:pointer;font:inherit;font-weight:900;border:0;border-radius:999px;padding:6px 14px;background:#fff;color:#7c2d12}'+
      '#sorealIdleNouvelleVersionV1 .nv-x{background:transparent;color:#fff;padding:6px 8px;opacity:.85}';
    document.head.appendChild(st);
  }

  function afficher(){
    if(affichee)return;
    affichee=true;
    css();
    const b=document.createElement('div');
    b.id='sorealIdleNouvelleVersionV1';
    b.setAttribute('role','status');
    b.innerHTML='<span>🚀 Nouvelle version de SOREAL IDLE disponible ! Rafraîchis la page pour en profiter.</span>'+
      '<button type="button" class="nv-ok">Rafraîchir</button><button type="button" class="nv-x" aria-label="Plus tard" title="Plus tard">✕</button>';
    b.querySelector('.nv-ok').addEventListener('click',function(){location.reload();});
    b.querySelector('.nv-x').addEventListener('click',function(){b.remove();affichee=false;derniereVerif=Date.now()+INTERVALLE_MS;});
    document.body.appendChild(b);
  }

  function verifier(){
    if(affichee||document.visibilityState!=='visible')return;
    if(Date.now()-derniereVerif<ATTENTE_MIN_MS)return;
    derniereVerif=Date.now();
    const moi=signatureCourante();
    if(!moi)return;
    fetch('/index.html',{cache:'no-store',credentials:'same-origin'}).then(function(r){
      return r.ok?r.text():'';
    }).then(function(html){
      const serveur=html?signatureDuTexte(html):'';
      if(serveur&&serveur!==moi)afficher();
    }).catch(function(){});
  }

  window.__SOREAL_IDLE_NOUVELLE_VERSION_V1__={verifier:verifier,signature:signatureDuTexte,afficher:afficher};
  setInterval(verifier,INTERVALLE_MS);
  document.addEventListener('visibilitychange',verifier);
  setTimeout(verifier,60*1000);
})();
