import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const lire = (f) => readFileSync(f, "utf8");
const mobs = JSON.parse(lire("design/traductions/fr/mobs.json"));
/* « Sundae » garde son nom d'origine partout (jeu de mots avec Sunday) */
assert.ok(!("Sundae" in mobs), "aucune traduction française de Sundae");
assert.ok(!lire("design/ngu-boss-names-fr.json").includes("Coupe glacée"));
/* sangsue : jamais de jet parasite au changement de cadence */
const sang = lire("cloudflare/public/modules/sang-rituel-decor-v1.js");
assert.ok(sang.includes("if(sc.__cleAt&&maintenant-sc.__cleAt<350)return;") && sang.includes("sc.__cleAt=performance.now();"), "garde de 350 ms après un changement de cadence");
assert.ok(sang.includes("paq[i].onanimationiteration=null;paq[i].style.animation='none';"), "nouvelle Animation à chaque changement de cadence");
assert.ok(sang.includes("sc.__flux=(m===1)") && sang.includes("if(sc.__flux)return;") && sang.includes("}else if(!attente&&m>1){"), "mode continu : ni jets distincts ni recalage");
/* machine à remonter le temps : nom au-dessus, « Meilleur butin d'or » + Or dessous ; cases de taille fixe */
const md = lire("cloudflare/public/modules/machine-dessin-v1.js");
assert.ok(md.includes('id="tmmNomMob" x="130" y="296"') && md.includes("function tailleNom(nom)"));
assert.ok(lire("cloudflare/public/soreal-idle-machine.css").includes(".tmm-machine .tmm-case .tmm-case-val.soreal-idle-alloc-pop-v1{display:block"), "le gonflement du chiffre ne change plus la taille des cases");
/* fond du Coffre : le dernier ouvert persiste (velours / tapis vert) */
const v = lire("cloudflare/public/modules/valise-v1.js");
assert.ok(v.includes("soreal_idle_dernier_ouvert_v1") && v.includes("noterDernier('valise')") && v.includes("noterDernier('coffre')"));
assert.ok(lire("cloudflare/public/modules/ui-aventure-2-v1.js").includes("fondCoffre==='coffre'?' vl-tapis'"));
assert.ok(v.includes("min-height:var(--vl-m);pointer-events:none}") && v.includes(".vl-deplie .vl-art,${P} .vl-deplie button{pointer-events:auto}"), "toute la valise ouvre : le bloc déplié ne capte plus les clics");
console.log("idle-divers-2026-10-23-v1 OK");
/* cadre : tapis vert foncé par défaut (plus de bois) ; valise à la même distance du texte que le Coffre ; étiquette à gauche, à hauteur des yeux */
const css = lire("cloudflare/public/soreal-idle-itopod.css");
assert.ok(css.includes("radial-gradient(ellipse at 50% 30%,#1a5a30 0%,#11421f 52%,#082712 100%)!important;") && !css.includes("linear-gradient(180deg,#6b4a33,#563a28 55%,#3b2618)!important"), "fond par défaut vert foncé, plus de bois");
assert.ok(v.includes("function rapprocher(s,coffre,rv)") && v.includes("rapprocher(s,coffre,rv);") && v.includes("grid-template-columns:minmax(0,760px) 240px;justify-content:center"));
assert.ok(v.includes('<g class="vl-yeux">\'+\n        \'<g class="vl-etiquette"><path d="M29 80') && !v.includes('<rect x="212" y="168" width="40" height="26"'), "étiquette accrochée à l'extrémité gauche, dans le groupe des yeux");
assert.ok(v.includes(".vl-etiquette{transform-origin:29px 80px;"));
console.log("idle-divers-2026-10-23-v1 (cadre, distance, étiquette) OK");
/* ouverture / fermeture animées : Coffre (couvercle + contenu) et valise (bouche) */
const av = lire("cloudflare/public/modules/ui-aventure-2-v1.js");
assert.ok(av.includes("window.__coffreAnimOuvreIdleV1=Date.now();") && av.includes("racines.forEach(function(r){r.classList.add('ferme-anim');});") && av.includes("setTimeout(finir,400);"), "fermeture : l'animation joue AVANT le changement d'état");
assert.ok(av.includes('data-morph-classes-gardees="^(ferme-anim|ouvre|hors-ecran)$"') && av.includes("classList.remove('ouvre')") && av.includes("classList.remove('ferme-anim')"), "classes gardées au redessin, retirées à la fin");
assert.ok(css.includes("@keyframes bgOuvre") && css.includes("@keyframes bgReplie") && css.includes(".soreal-idle-coffre-v1.ouvre .bg-bagage-v1 .bg-couvercle{animation:bgOuvre"));
assert.ok(v.includes("@keyframes vlOuvre") && v.includes("@keyframes vlFerme") && v.includes("s.classList.add('vl-ferme')") && v.includes("anim|baille|ferme)$"), "bouche de la valise : vraies animations à l'ouverture et à la fermeture");
console.log("idle-divers-2026-10-23-v1 (ouvertures animées) OK");
/* le cadre s'allonge / se raccourcit en douceur, l'écran ne bouge pas */
assert.ok(av.includes("function animerHauteurCoffreIdleV1_(racine,de,vers,ms)") && av.includes("window.scrollTo(sx,sy)") && av.includes("Math.max(racine1.getBoundingClientRect().height,racine1.scrollHeight)"), "hauteur animée, défilement conservé");
assert.ok(css.includes(".soreal-idle-page-root-v28{overflow-anchor:none}"));
assert.ok(av.includes("bloc.style.display='none';") && av.includes("const ferme=r0.getBoundingClientRect().height;"), "hauteur refermée mesurée, pas estimée");
console.log("idle-divers-2026-10-23-v1 (cadre en douceur) OK");
/* la valise garde sa taille et sa place quand le Coffre se redessine : réglages en variables du module, écrits dans son HTML ; décalage par « left » (une marge négative l'élargissait) */
assert.ok(v.includes("function styleSection()") && v.includes('style="\'+styleSection()+\'" data-vl data-vl-sig=') && v.includes("s.style.position='relative';s.style.left=") && !v.includes("s.style.marginLeft"));
console.log("idle-divers-2026-10-23-v1 (valise stable au redessin) OK");
/* fiches d'objets : plus de « Special: » devant les intitulés, et intitulés sur une ligne (police réduite au besoin) */
assert.ok(!av.includes('class="sb-special-v1">Special: ') && !av.includes('class="sb-special-v1">Special Bonus: '), "plus de préfixe « Special: » dans la description");
const lu = lire("cloudflare/public/modules/ligne-unique-items-v1.js");
assert.ok(lu.includes("while(l.scrollWidth>l.clientWidth+1&&taille>MIN)") && lire("cloudflare/public/index.html").includes("/modules/ligne-unique-items-v1.js"));
assert.ok(css.includes(".soreal-idle-v138-details-stat>span{white-space:nowrap;min-width:0}") && css.includes("flex-wrap:nowrap;gap:8px;min-width:0;max-width:100%"));
console.log("idle-divers-2026-10-23-v1 (intitulés d'objets) OK");
/* téléphone : le Coffre s'ouvre SOUS LUI-MÊME et pousse la valise ; le redessin ne retire plus « data-volet » ; le journal note sauts et redessins du Coffre */
assert.ok(v.includes(">.vl-section{order:3;margin-top:8px;padding-top:12px;border-top:2px dashed") && v.includes(".ouvert:has(>.vl-section)>div:last-child:not(.vl-section){order:2}"), "téléphone : coffre, puis son contenu, puis la valise");
const vo = lire("cloudflare/public/modules/inventaire-volet-v1.js");
assert.ok(vo.includes(".push('data-volet')"), "data-volet gardé au redessin (sinon la mise en page saute à chaque redessin)");
const dc = lire("cloudflare/public/modules/diag-coffre-v1.js"), df = lire("cloudflare/public/modules/diag-fluidite-v1.js");
assert.ok(dc.includes("type:'layout-shift'") && dc.includes("noter('redessin_coffre'") && dc.includes("noter('hauteur_page'") && df.includes("noter:function(type,cle,details)") && df.includes("saut_page:40,hauteur_page:30,redessin_coffre:30"));
assert.ok(lire("cloudflare/public/index.html").includes("/modules/diag-coffre-v1.js"));
console.log("idle-divers-2026-10-23-v1 (téléphone, journal) OK");

/* fermeture : la case du Coffre ne se comprime plus (flex-shrink:0), le contenu se replie en douceur et la valise remonte avec lui */
assert.ok(v.includes(":has(>.vl-section)>*{flex-shrink:0}"), "aucun bloc du cadre ne se comprime");
assert.ok(av.includes("sb.setProperty('max-height',cb.toFixed(1)+'px','important');") && av.includes("border-top-width '+ease"), "contenu replié en douceur, en même temps que le cadre");
console.log("idle-divers-2026-10-23-v1 (fermeture sans saut) OK");
/* journal du téléphone (14 à 25 images/s, 57 animations CSS) : le Coffre et la valise ne s'animent que lorsqu'on les voit */
const ah = lire("cloudflare/public/modules/animations-hors-ecran-v1.js");
assert.ok(ah.includes("rootMargin:'150px 0px 150px 0px'") && ah.includes(".hors-ecran.hors-ecran *") && ah.includes("animation-play-state:paused") && !ah.includes("!important"), "pause hors écran, sans !important");
assert.ok(av.includes('"^(ferme-anim|ouvre|hors-ecran)$"') && lire("cloudflare/public/index.html").includes("/modules/animations-hors-ecran-v1.js"));
console.log("idle-divers-2026-10-23-v1 (animations hors écran) OK");

/* journal : numéro dans la clé (plus de lignes avalées par la limite de 5 s), état du Coffre, défilement et dernier toucher */
assert.ok(dc.includes("x.noter(type,String(cle)+'#'+seq,o);") && dc.includes("toucher:dernierToucher.cible"), "lignes du journal contextualisées");
console.log("idle-divers-2026-10-23-v1 (journal contextualisé) OK");

// Ouverture / fermeture du Coffre ou de la valise : le reste de la page est mis en pause (peu d'images/s sur téléphone).
{
  const h = readFileSync("cloudflare/public/modules/animations-hors-ecran-v1.js", "utf8");
  assert.ok(h.includes("html.soreal-anim-coffre body *:not(.soreal-idle-coffre-v1)") && h.includes("pause:pause"));
  assert.ok(readFileSync("cloudflare/public/modules/valise-v1.js", "utf8").includes("ah.pause(retard+duree"));
  assert.ok(readFileSync("cloudflare/public/modules/ui-aventure-2-v1.js", "utf8").includes("ah.pause(2200)"));
}

// Pendant l'animation du Coffre/valise, aucune minuterie ne lit la mise en page (lectures forcées en pleine animation).
for (const f of ["valise-v1", "coffre-digestion-v1", "coffre-sommeil-v1", "valise-accident-v1", "coffre-accident-v1", "inventaire-volet-v1"]) {
  assert.ok(lire("cloudflare/public/modules/" + f + ".js").includes("classList.contains('soreal-anim-coffre')"), f + " : garde pendant l'animation");
}

// Valise : les variables du dépliage sont non héritées et posées sur les seuls éléments qui s'en servent (1,6 ms de style par image sur PC, dix fois plus sur téléphone).
{
  const v = lire("cloudflare/public/modules/valise-v1.js");
  assert.ok(v.includes("window.CSS.registerProperty({name:n,syntax:'*',inherits:false})") && v.includes("function poserVl(s,nom,val)"));
  assert.ok(!/s\.style\.setProperty\('--vl-(p|pf|rr|s|h)'/.test(v.replace(/if\(HERITE_VL\)\{s\.style\.setProperty\(nom,val\)/, "")), "plus d'écriture des variables sur la section");
}

// Basic Training : les lignes de rang 4 et 5 (Charge, Bonus ultime…) ont une animation permanente en !important qui remplaçait l'allumage néon : les deux sont jouées.
{
  const n = lire("cloudflare/public/modules/bt-neon-v1.js");
  assert.ok(n.includes('[data-rang-v1="4"]{animation:btNeonV1') && n.includes("rgSheenV1 3.2s linear infinite!important") && n.includes("rgBatV1 1.6s ease-in-out infinite!important"));
}

// Tapis du Coffre et velours de la valise : couleur seule, plus de grain de traits croisés (ralentissements sur téléphone).
{
  const c = lire("cloudflare/public/soreal-idle-itopod.css"), v = lire("cloudflare/public/modules/valise-v1.js");
  const i = c.indexOf("#1a5a30 0%,#11421f 52%");
  assert.ok(i > 0 && !c.slice(i - 400, i).includes("repeating-linear-gradient"), "tapis vert sans traits");
  assert.ok(!v.slice(v.indexOf(".vl-velours-fond{"), v.indexOf(".vl-velours-fond{") + 600).includes("repeating-linear-gradient"), "velours sans traits");
}

// Audit de traduction (Norman, 2026-10-24) : les phrases du Coffre, de la valise, de l'intro, du journal des attaques et du tutoriel existent en anglais.
{
  const d = JSON.parse(lire("cloudflare/public/modules/traduction-anglais-dict-v1.json"));
  for (const k of ["Ne me frappez pas, Maître !", "Un peu de potion, messire ?", "Par Saint-Glinglin !", "Enlevez ce doigt de ma serrure !", "Oh non… pas encore les potions…", "Service d’étage !", "Bienvenue et premiers pas", "📖 Journal des attaques", "Quand tu reprends connaissance,"]) {
    assert.ok(typeof d[k] === "string" && d[k].length > 2, "traduit : " + k);
  }
  assert.ok(Object.keys(d).every((k) => !/[<>]/.test(k)), "aucune balise dans une clé");
}

// Machine temporelle et bruits : traduits ; aucun morceau traduit à moitié (« d'Gold », « l'energy »).
{
  const d = JSON.parse(lire("cloudflare/public/modules/traduction-anglais-dict-v1.json"));
  const att = { "MACHINE TEMPORELLE": "TIME MACHINE", "MEILLEUR BUTIN D’OR": "BEST GOLD LOOT", "TIQUES/S": "TICKS/S", "TEMPS RESTANT": "TIME LEFT", "En attente d’Or": "Waiting for Gold", "Rot grave": "Deep burp" };
  for (const [k, v] of Object.entries(att)) assert.equal(d[k], v, k);
}

// Vomi de la valise : la langue passe par-dessus la flaque et porte elle aussi du vomi ; bannière du haut retirée ; effets allégeables du menu et des décors.
{
  const a = lire("cloudflare/public/modules/valise-accident-v1.js");
  assert.ok(a.includes("' .vl-deplie{z-index:7}'") && a.includes("' .vl-lg-corps::before{content:"), "langue au-dessus de la flaque (z 6), vomi sur la langue");
  const u = lire("cloudflare/public/modules/ui-noyau-v1.js");
  assert.ok(!u.includes("soreal-idle-hero-banner-v95") && !u.includes("media/banner?name=soreal-idle.webp"), "plus de bannière dans la page de jeu");
  const e = lire("cloudflare/public/modules/effets-legers-v1.js");
  assert.ok(e.includes("soreal_idle_effet_nav_v1") && e.includes("soreal_idle_effet_decor_v1") && e.includes("animation:none!important"));
  assert.ok(lire("cloudflare/public/soreal-idle-ui.js").includes("soreal_idle_effet_nav_v1") && lire("cloudflare/public/index.html").includes("/modules/effets-legers-v1.js"));
}

// Le Coffre se plaint du vomi de la valise non nettoyé ; la valise nettoyée est contente ; ces bulles sont traduites (plus de data-sans-traduction).
{
  const s = lire("cloudflare/public/modules/coffre-sommeil-v1.js"), v = lire("cloudflare/public/modules/valise-accident-v1.js");
  assert.ok(s.includes("Je t’en supplie, nettoie-la, elle pue.") && s.includes("function valiseSale_()") && s.includes("PLAINTES"));
  assert.ok(v.includes("v.dire('Je suis contente !')") && !v.includes("Merci… ça va mieux."));
  for (const f of ["coffre-sommeil-v1", "coffre-digestion-v1", "valise-v1"]) assert.ok(!lire("cloudflare/public/modules/" + f + ".js").includes("data-sans-traduction"), f);
  const d = JSON.parse(lire("cloudflare/public/modules/traduction-anglais-dict-v1.json"));
  assert.equal(d["Je suis contente !"], "I'm so happy!");
  assert.ok(s.match(/PLAINTES=\[([^\]]*)\]/)[1].split("',").every((x) => d[x.replace(/^\s*'|'$/g, "")]), "chaque plainte est traduite");
}

// Barre de chargement : elle suit les vraies étapes (scripts, connexion, interface, partie, moteur local, première image), animée par Web Animations, reprise après un rechargement.
{
  const h = lire('cloudflare/public/index.html'), p = 'cloudflare/public/';
  assert.ok(h.includes('__SOREAL_IDLE_CHARGEMENT_ETAPE_V1__') && h.includes('b.animate(') && h.includes('soreal_idle_chargement_v1') && !h.includes('pct+(pct<55?4:pct<80?2:1)'));
  assert.ok(lire(p + 'standalone-bridge.js').includes('__SOREAL_IDLE_CHARGEMENT_ETAPE_V1__(42)') && lire(p + 'standalone-bridge.js').includes('__SOREAL_IDLE_CHARGEMENT_ETAPE_V1__(52)'));
  assert.ok(lire(p + 'modules/moteur-local-v1.js').includes('__SOREAL_IDLE_CHARGEMENT_ETAPE_V1__(65)') && lire(p + 'modules/moteur-local-v1.js').includes('__SOREAL_IDLE_CHARGEMENT_ETAPE_V1__(80)'));
  assert.ok(lire(p + 'modules/ui-noyau-v1.js').includes('__SOREAL_IDLE_LOADING_COMPLETE_V206__'));
}

// Mort d'un boss : l'effet d'apparition ne se joue jamais sur l'image du boss TUÉ ; un calque sombre attend le suivant (jusqu'à 6 s).
{
  const a = lire('cloudflare/public/modules/apparition-boss-v1.js'), c = lire('cloudflare/public/modules/ui-combat-1-v1.js'), v = lire('cloudflare/public/modules/victoire-boss-arcade-v1.js');
  assert.ok(a.includes('function jouerApres(hote,idMort,immediat)') && a.includes('app-boss-attente') && a.includes('performance.now()-debut>6000') && a.includes('jouerApres:jouerApres,idDe:idDe'));
  assert.ok(c.includes('app.jouerApres(host,idMortV1)') && v.includes('app.jouerApres(hote,idMort,true)'));
  assert.ok(lire('cloudflare/public/modules/ui-aventure-1-v1.js').includes('sorealIdleSummaryRebirthTempsV1') && lire('cloudflare/public/modules/temps-rebirth-v1.js').includes('setInterval(maj,1000)'), 'case « Temps » du Rebirth dans le bandeau');
}

// Sang disponible en direct sur la page de Magie du sang (2026-10-25) : repères, suivi sur 12 s, avance bornée à un pas, jamais de retour en arrière.
{
  const b = lire("cloudflare/public/modules/blood-magic-v1.js");
  assert.ok(b.includes("id=\"sorealIdleBloodTotalV1\"") && b.includes("function sangAfficheV1_()") && b.includes("12000") && b.includes("Math.min(t.pas,") && b.includes("sorealIdleBloodOrV1"));
}

// Attaque / Défense affichées : un petit recul (< 2 %) est tenu 15 s au plus (les niveaux arrivent par paliers, l'interpolation passe devant) ; reproduit avec la partie de Norman : 52 reculs en 30 s.
{
  const e = lire("cloudflare/public/modules/ui-entrainement-v1.js");
  assert.ok(e.includes("const tenirStat=function(valeur,cle,tcle)") && e.includes("valeur>=avant*0.98") && e.includes("<15000)return avant;") && e.includes("tenirStat(attaqueArrondieBruteV1,"));
}

// Réapparition en fondu d'ouverture : chœur d'anges synthétisé (2026-10-25).
{
  const a = lire("cloudflare/public/modules/audio-effects-v199.js"), m = lire("cloudflare/public/modules/mort-joueur-v1.js");
  assert.ok(a.includes("function chorale_()") && a.includes("chorale:function(){return chorale_();}") && a.includes("createConvolver") && a.includes("[800,1,9]"));
  assert.ok(m.includes("ach.chorale()"));
}

// Son de défaite à l'envers : rendu lancé dès le début du rembobinage ; chœur raccourci (2026-10-25).
{
  const a = lire("cloudflare/public/modules/audio-effects-v199.js"), m = lire("cloudflare/public/modules/mort-joueur-v1.js");
  assert.ok(a.includes("defeatReversePrepare:function(){return preparerInverse_();}") && a.includes("function construireInverse_()") && a.includes("jouerWebAudio_(3800,"));
  assert.ok(m.includes("defeatReversePrepare") && m.includes("prepare=false"));
}

// Le son retourné est celui qui a été joué : on attend le tirage du son de défaite (2026-10-25).
{
  const a = lire("cloudflare/public/modules/audio-effects-v199.js");
  assert.ok(a.includes("function attendreDefaite_(depart)") && a.includes("dernierTempsDefaite=Date.now()"));
}

// Refus d'équiper faute de cap libre : bandeau visible, le toast restant muet (2026-10-25).
{
  const i = lire("cloudflare/public/modules/ui-inventaire-v1.js");
  assert.ok(i.includes("function annoncerRefusCapEquipementIdleV1_(message)") && i.includes("/^Libère /.test(res.message)"));
}

// Grands nombres : des lettres après Tg, plus de e+ (2026-10-25).
{
  const n = lire("cloudflare/public/modules/number-format-v1.js"), c = lire("cloudflare/public/modules/nombres-couleur-v1.js");
  assert.ok(n.includes("function suffixe(rang)") && n.includes("function rangDe(texte)") && !n.includes("suffixes.length"));
  assert.ok(c.includes("for(var i=0;i<71;i+=1)UNITES.push("));
}

// Comparaison : le rouge/vert l'emporte sur le vert « maxed » du popup (2026-10-25).
{
  const css = lire("cloudflare/public/soreal-idle-itopod.css");
  for (const k of ["haut", "bas"]) assert.ok(css.includes(".soreal-idle-item-popup-v1 .idle-compare-bloc-v1 .soreal-idle-v138-details-stat b .soreal-idle-v138-stat-value-v1.idle-cmp-" + k + "-v1{"));
}

// Coffre : un objet pas pleinement maxé (ou dont la case est prise) fait secouer la tête au Bagage au lieu de croquer, sans appel serveur (2026-10-25).
{
  const u = lire("cloudflare/public/modules/ui-aventure-2-v1.js"), c = lire("cloudflare/public/soreal-idle-itopod.css");
  assert.ok(u.includes("function coffreRefuseObjetIdleV1_(id)") && u.includes("if(coffreRefuseObjetIdleV1_(source)){jouerNonCoffreIdleV1_();return;}") && u.includes("if(id&&coffreRefuseObjetIdleV1_(id)){jouerNonCoffreIdleV1_();return;}"));
  assert.ok(c.includes(".bg-bagage-v1.refuse{") && c.includes("@keyframes bgNon{"));
}

// Barres de Wandoos : colonne du pourcentage de largeur fixe (la barre ne s'allonge plus sous 10 %) ; pastille de quantité de la valise hors de l'icône (2026-10-25).
{
  const w = lire("cloudflare/public/modules/wandoos-retro-v1.js"), v = lire("cloudflare/public/modules/valise-v1.js");
  assert.ok(w.includes(".wd-rang{grid-template-columns:6.6em 1fr 3.8em;}") && !w.includes("6.6em 1fr auto"));
  assert.ok(v.includes(".vl-pastille{position:absolute;right:-2px;top:-7px;"));
}
