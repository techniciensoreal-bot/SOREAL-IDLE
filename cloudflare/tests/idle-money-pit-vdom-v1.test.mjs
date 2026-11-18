import assert from "node:assert/strict";
import { evenement, serialiser } from "./_faux-dom-vdom.mjs";
import { creerMoneyPit, partieMoneyPit } from "./_mp-vdom.mjs";

/*
 * Page Money Pit & Roue journalière rendue par composants Preact (modules/money-pit-vdom-v1.js, chantier 2026-11-18) : le VRAI Preact, le VRAI pont, les VRAIS modules sur un faux DOM. Garanties :
 *  - les nœuds (cadres repliables, tableaux, bandeaux, cases du calendrier, boutons) gardent leur identité d'un rendu à l'autre (rien n'est reconstruit quand les données changent un peu) ;
 *  - ce que d'autres modules ajoutent à la main (salve d'or, classe « mp3-vu », angle de la roue) survit à un rendu ;
 *  - après un redessin complet (conteneur recréé par le morph) la page se remet en place sans autre appel ;
 *  - clic -> action (Balance ton argent, récompense du jour), pagination des tableaux (état gardé, sans redessin de la page) ;
 *  - le texte du compte à rebours est réécrit sur place par le minuteur (nœud de texte conservé) ;
 *  - anti-spoil (règle n°2) : aucun cadenas, aucun total « x / y » (hors « Page x / y » du tableau, déjà visible) ;
 *  - sans Preact : repli sur le rendu historique en chaîne HTML.
 */
function monter(options) {
  const e = creerMoneyPit(options);
  const racine = e.document.createElement("div"); racine.className = "soreal-idle-page-root-v28"; racine.setAttribute("data-menu", "moneyPit");
  e.document.body.appendChild(racine);
  /* Comme le menu : la chaîne stable du pont est posée dans la page, puis le crochet de redessin rend le composant. */
  e.poser = (j) => { e.hote.etat = j; const chaine = e.MP.page(j); const t = e.document.createElement("template"); t.innerHTML = chaine; return t.content.childNodes[0]; };
  e.redessiner = (j) => {
    e.hote.etat = j;
    const chaine = e.MP.page(j);
    if (!racine.querySelector("[data-vdom]")) { const t = e.document.createElement("template"); t.innerHTML = chaine; racine.appendChild(t.content.childNodes[0]); }
    e.pont.appliquer();
  };
  e.racine = racine;
  return e;
}
const un = (r, s) => { const x = r.querySelector(s); assert.ok(x, "introuvable : " + s); return x; };

/* --- 1. Premier rendu, structure et textes --- */
{
  const e = monter();
  const j = partieMoneyPit({ nbPit: 25 });
  e.redessiner(j);
  const r = e.racine;
  assert.equal(r.querySelectorAll("[data-vdom]").length, 1, "un seul conteneur Preact");
  assert.ok(un(r, ".soreal-idle-page-title-v28").textContent.includes("Money Pit"), "entête");
  assert.equal(r.querySelectorAll(".soreal-idle-section-v8").length, 2, "deux bandeaux de totaux");
  const texte = r.textContent;
  assert.ok(texte.includes("Bonus obtenus grâce au Money Pit") && texte.includes("Bonus obtenus grâce à la roue journalière"));
  assert.ok(texte.includes("+120 Puissance et Endurance d’Aventure") && texte.includes("🎁 2 × Lucky Charm"), "totaux cumulés (mêmes textes)");
  assert.equal(r.querySelectorAll(".mp-cadre-v1").length, 2, "deux cadres de récompenses");
  assert.ok(texte.includes("🕳️ RÉCOMPENSES DU MONEY PIT ") && texte.includes("(25)"), "compte du cadre");
  assert.equal(un(r, '[data-mp-cadre="pit"] tbody').querySelectorAll("tr").length, 20, "20 lignes par page");
  assert.ok(un(r, "[data-mp-compteur]").textContent === "Page 1 / 2", "compteur de pages");
  assert.equal(r.querySelectorAll(".cal-case-v1").length, 30, "calendrier : une case par jour");
  assert.ok(un(r, ".rb-roue[data-roue-v1]"), "carte de la roue, directement dans la colonne (sélecteurs CSS « .mp-col-v1>.rb-roue »)");
  assert.equal(un(r, ".rb-roue").parentNode.className, "mp-col-v1 mp-col-roue-v1");
  assert.ok(un(r, "[data-trou-v1][data-mp-palier]"), "légende du trou (guetteur de palier)");
  assert.ok(un(r, "[id=\"sorealIdleMoneyPitImageV209\"]").getAttribute("src"), "image du trou");
  assert.ok(un(r, ".mp3-calques").innerHTML.includes("mp3-titre-nom"), "calques du trou");
  /* anti-spoil (règle n°2) : rien de verrouillé, aucun total « x / y » (« Page 1 / 2 » est la page d'un tableau déjà affiché) */
  assert.ok(!/🔒|verrouill|\?\?\?/.test(texte), "aucun cadenas ni « ??? »");
  const sansStyle = serialiser(r).replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ");
  const reste = sansStyle.replace(/Page \d+ \/ \d+/g, "").replace(/\d\d\/\d\d \d\d:\d\d/g, "");   /* « Page x / y » et les dates des lignes d'historique */
  assert.ok(!/\d+\s*\/\s*\d+/.test(reste), "aucun total « x / y » : " + (/.{0,20}\d+\s*\/\s*\d+.{0,20}/.exec(reste) || [""])[0]);
}

/* --- 2. Identité des nœuds d'un rendu à l'autre + survie des ajouts manuels --- */
{
  const e = monter();
  const j = partieMoneyPit({ nbPit: 5, nbRoue: 2, serie: 3 });
  e.redessiner(j);
  const r = e.racine;
  const garde = { cadre: un(r, '[data-mp-cadre="pit"]'), table: un(r, '[data-mp-cadre="pit"] table'), ligne0: un(r, '[data-mp-cadre="pit"] tr'), cases: r.querySelectorAll(".cal-case-v1"), grille: un(r, ".mp2-grille-v1"), bandeau: un(r, ".soreal-idle-section-v8"), carte: un(r, ".rb-roue"), calques: un(r, ".mp3-calques"), image: un(r, "[id=\"sorealIdleMoneyPitImageV209\"]") };
  /* ajouts à la main : classe d'observateur de visibilité, salve d'or, angle de la roue, ouverture d'un cadre par l'utilisateur */
  garde.calques.classList.add("mp3-vu");
  const salve = e.document.createElement("div"); salve.className = "mp3-pieces"; salve.setAttribute("data-morph-garder", ""); garde.calques.appendChild(salve);
  const rot = un(r, ".rb-rot"); rot.style.transform = "rotate(123deg)";
  /* nouvelle synchro : une ligne de plus, totaux changés, une case du calendrier prise */
  const j2 = partieMoneyPit({ nbPit: 6, nbRoue: 2, serie: 4 });
  j2.__meta.moneyPit.state.data.rewardsTotal.adventureStats = 500;
  e.redessiner(j2);
  assert.equal(un(r, '[data-mp-cadre="pit"]'), garde.cadre, "cadre : même nœud");
  assert.equal(un(r, '[data-mp-cadre="pit"] table'), garde.table, "tableau : même nœud");
  assert.equal(un(r, '[data-mp-cadre="pit"] tr'), garde.ligne0, "ligne : même nœud (mise à jour sur place)");
  assert.equal(r.querySelectorAll('[data-mp-cadre="pit"] tbody tr').length, 6, "la ligne de plus est ajoutée");
  r.querySelectorAll(".cal-case-v1").forEach((c, i) => assert.equal(c, garde.cases[i], "case " + (i + 1) + " : même nœud"));
  assert.ok(r.querySelectorAll(".cal-case-v1.allume").length === 4 && un(r, ".cal-case-v1.allume.nouveau"), "case allumée, animation d'allumage sur la nouvelle seulement");
  assert.equal(un(r, ".mp2-grille-v1"), garde.grille);
  assert.equal(un(r, ".soreal-idle-section-v8"), garde.bandeau);
  assert.ok(r.textContent.includes("+500 Puissance et Endurance d’Aventure"), "totaux mis à jour");
  assert.equal(un(r, ".rb-roue"), garde.carte, "carte de la roue : même nœud");
  assert.equal(un(r, ".rb-rot").style.transform, "rotate(123deg)", "l'angle posé par la roue survit (chaîne de l'îlot identique)");
  assert.equal(un(r, ".mp3-calques"), garde.calques);
  assert.ok(garde.calques.classList.contains("mp3-vu"), "classe mp3-vu conservée");
  assert.ok(garde.calques.querySelector(".mp3-pieces"), "salve d'or conservée");
  assert.equal(un(r, "[id=\"sorealIdleMoneyPitImageV209\"]"), garde.image, "image du trou : même nœud");
  /* troisième rendu identique : rien à faire */
  e.redessiner(j2);
  assert.equal(un(r, ".mp3-calques"), garde.calques);
}

/* --- 3. Redessin complet : conteneur recréé par le morph --- */
{
  const e = monter();
  const j = partieMoneyPit();
  e.redessiner(j);
  const avant = un(e.racine, ".mp2-grille-v1");
  while (e.racine.firstChild) e.racine.removeChild(e.racine.firstChild);
  assert.equal(e.racine.querySelectorAll(".mp2-grille-v1").length, 0);
  e.redessiner(j);
  const apres = un(e.racine, ".mp2-grille-v1");
  assert.notEqual(apres, avant, "nouveau conteneur : l'arbre repart de zéro");
  assert.equal(e.racine.querySelectorAll(".cal-case-v1").length, 30);
  /* changement de menu : le conteneur disparaît, le pont démonte */
  while (e.racine.firstChild) e.racine.removeChild(e.racine.firstChild);
  e.pont.appliquer();
  assert.ok(!e.pont.registre.moneypit, "page quittée : composant démonté et oublié");
}

/* --- 4. Clics -> actions --- */
{
  const e = monter();
  const j = partieMoneyPit();
  e.redessiner(j);
  const bouton = un(e.racine, ".mp2-spin-bouton-v1");
  assert.ok(bouton.textContent.includes("Balance ton argent"));
  evenement(bouton, "click");
  assert.equal(JSON.stringify(e.actions), JSON.stringify([{ action: "moneyPit" }]), "« Balance ton argent » appelle l'action du moteur");
  evenement(un(e.racine, ".cal-bouton-v1"), "click");
  assert.equal(JSON.stringify(e.actions[1]), JSON.stringify({ action: "loginCalendar" }), "récompense du jour");
  /* cadre replié par l'utilisateur : la préférence est écrite (liée au compte) et le rendu suivant ne la combat pas */
  const cadre = un(e.racine, '[data-mp-cadre="roue"]');
  cadre.setAttribute("open", ""); cadre.open = true;
  cadre.open = false; cadre.removeAttribute("open");
  evenement(cadre, "toggle", { bubbles: false });
  assert.equal(e.stockage["soreal_idle_mp_cadre_roue"], "0", "état replié mémorisé");
  e.redessiner(j);
  assert.ok(!un(e.racine, '[data-mp-cadre="roue"]').hasAttribute("open"), "le rendu suivant respecte le cadre replié");
}

/* --- 5. Pagination : état gardé, sans redessiner la page --- */
{
  const e = monter();
  const j = partieMoneyPit({ nbPit: 45 });
  e.redessiner(j);
  const r = e.racine;
  const grille = un(r, ".mp2-grille-v1");
  assert.equal(un(r, "[data-mp-compteur]").textContent, "Page 1 / 3");
  assert.ok(un(r, "[data-mp-recent]").hasAttribute("disabled") && !un(r, "[data-mp-ancien]").hasAttribute("disabled"));
  evenement(un(r, "[data-mp-ancien]"), "click");
  assert.equal(un(r, "[data-mp-compteur]").textContent, "Page 2 / 3", "page suivante");
  assert.equal(un(r, '[data-mp-cadre="pit"] tbody').getAttribute("data-mp-page"), "1");
  assert.equal(r.querySelectorAll('[data-mp-cadre="pit"] tbody tr').length, 20);
  assert.ok(!un(r, "[data-mp-recent]").hasAttribute("disabled"));
  assert.equal(un(r, ".mp2-grille-v1"), grille, "la page n'est pas reconstruite");
  e.redessiner(j);
  assert.equal(un(r, "[data-mp-compteur]").textContent, "Page 2 / 3", "la synchro suivante garde la page");
  evenement(un(r, "[data-mp-ancien]"), "click");
  assert.equal(un(r, "[data-mp-compteur]").textContent, "Page 3 / 3");
  assert.equal(r.querySelectorAll('[data-mp-cadre="pit"] tbody tr').length, 5, "dernière page : le reste");
  assert.ok(un(r, "[data-mp-ancien]").hasAttribute("disabled"), "plus de page après la dernière");
  evenement(un(r, "[data-mp-recent]"), "click");
  assert.equal(un(r, "[data-mp-compteur]").textContent, "Page 2 / 3");
}

/* --- 6. Compte à rebours : le minuteur réécrit le texte SUR PLACE --- */
{
  const e = monter();
  const j = partieMoneyPit({ pitRecharge: true, pret: false });
  e.redessiner(j);
  const bouton = un(e.racine, '[data-idle-recharge-v1="pit"]');
  assert.ok(bouton.hasAttribute("disabled") && bouton.textContent.startsWith("🕳️ En recharge · "));
  const noeud = bouton.firstChild;
  assert.equal(e.timers.length >= 1, true, "minuteur démarré");
  let maintenant = 1_000_000 + 30_000;
  e.window.__SOREAL_IDLE_HEURE_V1__ = () => maintenant;
  e.timers.forEach((f) => f());
  assert.equal(bouton.textContent, "🕳️ En recharge · 1m 35s", "texte mis à jour par le minuteur");
  assert.equal(bouton.firstChild, noeud, "même nœud de texte (celui que Preact suit)");
  /* la synchro suivante recalcule le texte à partir de l'échéance : cohérent, jamais le texte périmé */
  e.redessiner(j);
  assert.equal(un(e.racine, '[data-idle-recharge-v1="pit"]'), bouton, "même bouton");
  assert.equal(bouton.textContent, "🕳️ En recharge · 1m 35s");
  /* à l'échéance : le bouton actif remplace le bouton de recharge */
  const j2 = partieMoneyPit({ pitRecharge: false, pret: false });
  e.redessiner(j2);
  assert.ok(!e.racine.querySelector('[data-idle-recharge-v1="pit"]') && un(e.racine, ".mp2-spin-bouton-v1"), "bouton actif");
  /* plus d'Or : bouton grisé « Jeter de l’or » */
  const j3 = partieMoneyPit({ pitRecharge: false }); j3.systemes.currencies.gold = 0;
  e.redessiner(j3);
  assert.ok(e.racine.textContent.includes("Jeter de l’or (tu n’as plus d’Or)"));
}

/* --- 7. Repli sans Preact --- */
{
  const e = creerMoneyPit({ sansPreact: true });
  const j = partieMoneyPit();
  e.hote.etat = j;
  const html = e.MP.page(j);
  assert.ok(html.includes("mp2-grille-v1") && html.includes("Balance ton argent"), "sans Preact, la page est la chaîne HTML historique");
  assert.ok(!html.includes("data-vdom"));
}

/* --- 8. Rendu vers HTML : même contenu que l'ancienne chaîne (clés d'identité) --- */
{
  const e = monter();
  const j = partieMoneyPit();
  e.hote.etat = j;
  const neuf = e.W.html(j);
  const ancien = e.MP.pageChaineHtml(j);
  for (const m of ["mp2-grille-v1", "soreal-idle-money-scene-v206", "rb-prixcol", "cal-v1", "soreal-idle-reward-table-v206", "mp-pager-v1", "TON PRIX", "Récompenses de connexion"]) {
    assert.ok(neuf.includes(m) && ancien.includes(m), "présent dans les deux rendus : " + m);
  }
  assert.ok(!serialiser(e.document.body).includes("undefined"));
}

console.log("idle-money-pit-vdom-v1: ok");
